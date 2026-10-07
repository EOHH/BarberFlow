-- Functional rollback for Phase 29. Do not run automatically.
-- Snapshot columns, constraints, data, and protective triggers are retained so
-- legacy/authorized insert paths remain valid and no historical data is lost.

BEGIN;

CREATE OR REPLACE FUNCTION public.process_appointment_transitions()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_current_time timestamp;
BEGIN
    v_current_time := pg_catalog.timezone('America/Lima', pg_catalog.now());

    UPDATE public.appointments AS a
       SET status = 'expired'
     WHERE a.status = 'pending'
       AND (a.date + a.time)::timestamp <= v_current_time;

    UPDATE public.appointments AS a
       SET status = 'in_progress'
     WHERE a.status = 'confirmed'
       AND (a.date + a.time)::timestamp <= v_current_time;

    UPDATE public.appointments AS a
       SET status = 'completed'
      FROM public.services AS s
     WHERE a.service_id = s.id
       AND a.tenant_id = s.tenant_id
       AND a.status = 'in_progress'
       AND v_current_time >= (
           (a.date + a.time)::timestamp
           + (s.duration_minutes * interval '1 minute')
       );
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.process_appointment_transitions()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_appointment_transitions() TO service_role;

-- Restore the Phase 28 live-service duration behavior for occupied intervals.
-- The full Phase 28 definition is kept in its versioned migration and should be
-- reviewed alongside this rollback before execution.
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_slug text, p_service_id uuid, p_barber_id uuid, p_date date
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
    v_duration integer;
    v_day_of_week integer;
    v_available_slots text[] := ARRAY[]::text[];
    v_availability record;
    v_start_mins integer;
    v_end_mins integer;
    v_time integer;
    v_slot_end integer;
    v_step integer := 30;
    v_is_overlapping boolean;
    v_is_today boolean;
    v_current_minutes integer;
    v_booked_intervals jsonb;
BEGIN
    IF p_date < (pg_catalog.timezone('America/Lima', pg_catalog.now()))::date THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT id INTO v_tenant_id FROM public.tenants WHERE domain = p_slug;
    IF v_tenant_id IS NULL THEN RETURN '[]'::jsonb; END IF;

    SELECT duration_minutes INTO v_duration
      FROM public.services
     WHERE id = p_service_id AND tenant_id = v_tenant_id AND is_active = true;
    IF v_duration IS NULL THEN RETURN '[]'::jsonb; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.barbers
         WHERE id = p_barber_id AND tenant_id = v_tenant_id AND is_active = true
    ) THEN
        RETURN '[]'::jsonb;
    END IF;

    v_day_of_week := EXTRACT(DOW FROM p_date);

    IF p_date = (pg_catalog.timezone('America/Lima', pg_catalog.now()))::date THEN
        v_is_today := true;
        v_current_minutes :=
            (EXTRACT(HOUR FROM pg_catalog.timezone('America/Lima', pg_catalog.now())) * 60)
            + EXTRACT(MINUTE FROM pg_catalog.timezone('America/Lima', pg_catalog.now()));
    ELSE
        v_is_today := false;
    END IF;

    SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'start_mins', (EXTRACT(HOUR FROM a.time) * 60) + EXTRACT(MINUTE FROM a.time),
        'end_mins', (EXTRACT(HOUR FROM a.time) * 60) + EXTRACT(MINUTE FROM a.time)
            + s.duration_minutes
    )), '[]'::jsonb)
      INTO v_booked_intervals
      FROM public.appointments AS a
      JOIN public.services AS s
        ON s.id = a.service_id AND s.tenant_id = a.tenant_id
     WHERE a.barber_id = p_barber_id
       AND a.date = p_date
       AND a.status IN ('pending', 'confirmed', 'in_progress')
       AND a.tenant_id = v_tenant_id;

    FOR v_availability IN
        SELECT start_time, end_time FROM public.availability
         WHERE barber_id = p_barber_id
           AND tenant_id = v_tenant_id
           AND day_of_week = v_day_of_week
           AND is_active = true
    LOOP
        v_start_mins := (EXTRACT(HOUR FROM v_availability.start_time) * 60)
            + EXTRACT(MINUTE FROM v_availability.start_time);
        v_end_mins := (EXTRACT(HOUR FROM v_availability.end_time) * 60)
            + EXTRACT(MINUTE FROM v_availability.end_time);
        v_time := v_start_mins;

        WHILE v_time + v_duration <= v_end_mins LOOP
            v_slot_end := v_time + v_duration;
            IF v_is_today AND v_time <= v_current_minutes THEN
                v_time := v_time + v_step;
                CONTINUE;
            END IF;

            SELECT pg_catalog.bool_or(
                (v_time >= (b->>'start_mins')::integer AND v_time < (b->>'end_mins')::integer)
                OR (v_slot_end > (b->>'start_mins')::integer AND v_slot_end < (b->>'end_mins')::integer)
                OR (v_time <= (b->>'start_mins')::integer AND v_slot_end >= (b->>'end_mins')::integer)
                OR (v_time = (b->>'start_mins')::integer)
            ) INTO v_is_overlapping
            FROM pg_catalog.jsonb_array_elements(v_booked_intervals) AS b;

            v_is_overlapping := COALESCE(v_is_overlapping, false);
            IF NOT v_is_overlapping THEN
                DECLARE
                    v_formatted_time text := pg_catalog.lpad((v_time / 60)::text, 2, '0')
                        || ':' || pg_catalog.lpad((v_time % 60)::text, 2, '0') || ':00';
                BEGIN
                    IF NOT (v_available_slots @> ARRAY[v_formatted_time]) THEN
                        v_available_slots := pg_catalog.array_append(v_available_slots, v_formatted_time);
                    END IF;
                END;
            END IF;
            v_time := v_time + v_step;
        END LOOP;
    END LOOP;

    RETURN pg_catalog.to_jsonb(v_available_slots);
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_available_slots(text, uuid, uuid, date)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(text, uuid, uuid, date)
TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_booking(
    p_slug text, p_service_id uuid, p_barber_id uuid, p_date date,
    p_time time, p_client_name text, p_phone text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
    v_appointment_id uuid;
BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE domain = p_slug;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant inválido o no existe.';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtext(p_barber_id::text || p_date::text)::bigint
    );

    IF NOT (
        public.get_available_slots(p_slug, p_service_id, p_barber_id, p_date)
        ? pg_catalog.to_char(p_time, 'HH24:MI:SS')
    ) THEN
        RAISE EXCEPTION 'El horario solicitado no está disponible, es en el pasado o choca con otra cita.';
    END IF;

    INSERT INTO public.appointments (
        tenant_id, service_id, barber_id, date, time, client_name, phone, status
    ) VALUES (
        v_tenant_id, p_service_id, p_barber_id, p_date, p_time, p_client_name, p_phone, 'pending'
    ) RETURNING id INTO v_appointment_id;

    RETURN pg_catalog.jsonb_build_object('success', true, 'id', v_appointment_id);
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time, text, text
) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_appointments_by_phone(p_slug text, p_phone text)
RETURNS TABLE (
    id uuid, "date" date, "time" time, status text, client_name text,
    service_name text, barber_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    SELECT t.id INTO v_tenant_id FROM public.tenants AS t WHERE t.domain = p_slug;
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Tenant no encontrado'; END IF;

    RETURN QUERY
    SELECT a.id, a.date, a.time, a.status, a.client_name,
           s.name AS service_name, b.name AS barber_name
      FROM public.appointments AS a
      LEFT JOIN public.services AS s
        ON s.id = a.service_id AND s.tenant_id = a.tenant_id
      LEFT JOIN public.barbers AS b
        ON b.id = a.barber_id AND b.tenant_id = a.tenant_id
     WHERE a.tenant_id = v_tenant_id AND a.phone = p_phone
     ORDER BY a.date DESC, a.time DESC
     LIMIT 20;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_appointments_by_phone(text, text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointments_by_phone(text, text)
TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_appointment_by_id(p_slug text, p_appointment_id uuid)
RETURNS TABLE (
    id uuid, "date" date, "time" time, status text, client_name text,
    phone text, service_name text, service_duration integer,
    service_price numeric, barber_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    SELECT t.id INTO v_tenant_id FROM public.tenants AS t WHERE t.domain = p_slug;
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Tenant no encontrado'; END IF;

    RETURN QUERY
    SELECT a.id, a.date, a.time, a.status, a.client_name, a.phone,
           s.name, s.duration_minutes, s.price, b.name
      FROM public.appointments AS a
      LEFT JOIN public.services AS s
        ON s.id = a.service_id AND s.tenant_id = a.tenant_id
      LEFT JOIN public.barbers AS b
        ON b.id = a.barber_id AND b.tenant_id = a.tenant_id
     WHERE a.tenant_id = v_tenant_id AND a.id = p_appointment_id;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_appointment_by_id(text, uuid)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_by_id(text, uuid)
TO anon, authenticated, service_role;

COMMIT;

-- Destructive rollback is intentionally omitted. Do not drop snapshot columns,
-- constraints, triggers, or captured data as part of an operational rollback.
