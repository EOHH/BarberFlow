-- Phase 29: preserve the service values booked with each appointment.
-- Existing rows are backfilled with the known service value at migration time;
-- these values are not claimed to be the original values at booking time.

BEGIN;

ALTER TABLE public.appointments
    ADD COLUMN service_name_snapshot text,
    ADD COLUMN price_snapshot numeric,
    ADD COLUMN duration_minutes_snapshot integer;

UPDATE public.appointments AS a
   SET service_name_snapshot = COALESCE(a.service_name_snapshot, s.name),
       price_snapshot = COALESCE(a.price_snapshot, s.price),
       duration_minutes_snapshot = COALESCE(a.duration_minutes_snapshot, s.duration_minutes)
  FROM public.services AS s
 WHERE a.service_id = s.id
   AND a.tenant_id = s.tenant_id
   AND (
       a.service_name_snapshot IS NULL
       OR a.price_snapshot IS NULL
       OR a.duration_minutes_snapshot IS NULL
   );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM public.appointments
         WHERE service_name_snapshot IS NULL
            OR price_snapshot IS NULL
            OR duration_minutes_snapshot IS NULL
    ) THEN
        RAISE EXCEPTION
            'Phase 29 aborted: one or more appointments could not be backfilled from their tenant-safe service relation.';
    END IF;
END;
$$;

ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_service_name_snapshot_check
        CHECK (pg_catalog.length(pg_catalog.btrim(service_name_snapshot)) > 0),
    ADD CONSTRAINT appointments_price_snapshot_check
        CHECK (
            price_snapshot >= 0
            AND price_snapshot <> 'NaN'::numeric
            AND price_snapshot <> 'Infinity'::numeric
            AND price_snapshot <> '-Infinity'::numeric
        ),
    ADD CONSTRAINT appointments_duration_minutes_snapshot_check
        CHECK (duration_minutes_snapshot > 0);

ALTER TABLE public.appointments
    ALTER COLUMN service_name_snapshot SET NOT NULL,
    ALTER COLUMN price_snapshot SET NOT NULL,
    ALTER COLUMN duration_minutes_snapshot SET NOT NULL;

-- This trigger also keeps the non-public legacy create_booking overload and any
-- other authorized INSERT path compatible without changing its unknown return
-- contract. It never trusts caller-supplied snapshot values.
CREATE OR REPLACE FUNCTION public.set_appointment_service_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_service_name text;
    v_price numeric;
    v_duration integer;
BEGIN
    IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'Appointment tenant_id must be resolved before capturing service snapshots.';
    END IF;

    SELECT s.name, s.price, s.duration_minutes
      INTO v_service_name, v_price, v_duration
      FROM public.services AS s
     WHERE s.id = NEW.service_id
       AND s.tenant_id = NEW.tenant_id
       AND s.is_active = true
     FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The appointment service is inactive or does not belong to the appointment tenant.';
    END IF;

    IF pg_catalog.length(pg_catalog.btrim(v_service_name)) = 0
       OR v_price < 0
       OR v_price = 'NaN'::numeric
       OR v_price = 'Infinity'::numeric
       OR v_price = '-Infinity'::numeric
       OR v_duration <= 0 THEN
        RAISE EXCEPTION 'The appointment service has invalid snapshot values.';
    END IF;

    NEW.service_name_snapshot := v_service_name;
    NEW.price_snapshot := v_price;
    NEW.duration_minutes_snapshot := v_duration;
    RETURN NEW;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.set_appointment_service_snapshot()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_appointment_service_snapshot() TO service_role;

-- PostgreSQL fires triggers with the same timing/event in name order. Assert
-- that the existing tenant trigger is present and is a row-level BEFORE INSERT
-- trigger; its name sorts before trg_z_appointments_service_snapshot, so it
-- resolves/validates NEW.tenant_id before snapshot capture. The snapshot
-- function also rejects NULL tenant_id defensively.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_trigger AS t
          JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
          JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
         WHERE t.tgrelid = 'public.appointments'::regclass
           AND t.tgname = 'trg_appointments_tenant_id'
           AND NOT t.tgisinternal
           AND (t.tgtype::integer & 1) = 1
           AND (t.tgtype::integer & 2) = 2
           AND (t.tgtype::integer & 4) = 4
           AND n.nspname = 'public'
           AND p.proname = 'set_tenant_id_trigger'
    ) THEN
        RAISE EXCEPTION
            'Phase 29 aborted: expected row-level BEFORE INSERT trigger trg_appointments_tenant_id -> public.set_tenant_id_trigger() was not found.';
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_z_appointments_service_snapshot ON public.appointments;
CREATE TRIGGER trg_z_appointments_service_snapshot
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_appointment_service_snapshot();

CREATE OR REPLACE FUNCTION public.protect_appointment_service_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.service_id IS DISTINCT FROM OLD.service_id
       OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.service_name_snapshot IS DISTINCT FROM OLD.service_name_snapshot
       OR NEW.price_snapshot IS DISTINCT FROM OLD.price_snapshot
       OR NEW.duration_minutes_snapshot IS DISTINCT FROM OLD.duration_minutes_snapshot THEN
        RAISE EXCEPTION 'Appointment service identity and snapshots are immutable.';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.protect_appointment_service_snapshot()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_appointment_service_snapshot() TO service_role;

DROP TRIGGER IF EXISTS trg_appointments_protect_service_snapshot ON public.appointments;
CREATE TRIGGER trg_appointments_protect_service_snapshot
BEFORE UPDATE OF tenant_id, service_id, service_name_snapshot, price_snapshot, duration_minutes_snapshot
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.protect_appointment_service_snapshot();

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
     WHERE id = p_service_id
       AND tenant_id = v_tenant_id
       AND is_active = true;
    IF v_duration IS NULL OR v_duration <= 0 THEN RETURN '[]'::jsonb; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.barbers
         WHERE id = p_barber_id
           AND tenant_id = v_tenant_id
           AND is_active = true
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
            + a.duration_minutes_snapshot
    )), '[]'::jsonb)
      INTO v_booked_intervals
      FROM public.appointments AS a
     WHERE a.barber_id = p_barber_id
       AND a.date = p_date
       AND a.status IN ('pending', 'confirmed', 'in_progress')
       AND a.tenant_id = v_tenant_id;

    FOR v_availability IN
        SELECT start_time, end_time
          FROM public.availability
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
    p_slug text,
    p_service_id uuid,
    p_barber_id uuid,
    p_date date,
    p_time time,
    p_client_name text,
    p_phone text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
    v_appointment_id uuid;
    v_service_name text;
    v_price numeric;
    v_duration integer;
BEGIN
    SELECT id INTO v_tenant_id
      FROM public.tenants
     WHERE domain = p_slug;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant inválido o no existe.';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtext(p_barber_id::text || p_date::text)::bigint
    );

    SELECT s.name, s.price, s.duration_minutes
      INTO v_service_name, v_price, v_duration
      FROM public.services AS s
     WHERE s.id = p_service_id
       AND s.tenant_id = v_tenant_id
       AND s.is_active = true
     FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Servicio inválido, inactivo o no pertenece al tenant.';
    END IF;
    IF pg_catalog.length(pg_catalog.btrim(v_service_name)) = 0
       OR v_price < 0
       OR v_duration <= 0 THEN
        RAISE EXCEPTION 'El servicio tiene valores inválidos para reservar.';
    END IF;

    IF NOT (
        public.get_available_slots(p_slug, p_service_id, p_barber_id, p_date)
        ? pg_catalog.to_char(p_time, 'HH24:MI:SS')
    ) THEN
        RAISE EXCEPTION 'El horario solicitado no está disponible, es en el pasado o choca con otra cita.';
    END IF;

    INSERT INTO public.appointments (
        tenant_id, service_id, barber_id, date, time, client_name, phone, status,
        service_name_snapshot, price_snapshot, duration_minutes_snapshot
    ) VALUES (
        v_tenant_id, p_service_id, p_barber_id, p_date, p_time, p_client_name, p_phone, 'pending',
        v_service_name, v_price, v_duration
    )
    RETURNING id INTO v_appointment_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'id', v_appointment_id,
        'service_name', v_service_name,
        'price', v_price,
        'duration_minutes', v_duration
    );
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time, text, text
) TO anon, authenticated, service_role;

-- The legacy overload is intentionally not replaced: its return contract is
-- absent from Git. The BEFORE INSERT snapshot trigger covers its insert path.
REVOKE ALL PRIVILEGES ON FUNCTION public.create_booking(
    uuid, uuid, uuid, date, time, character varying, character varying
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(
    uuid, uuid, uuid, date, time, character varying, character varying
) TO service_role;

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
     WHERE a.status = 'in_progress'
       AND v_current_time >= (
           (a.date + a.time)::timestamp
           + (a.duration_minutes_snapshot * interval '1 minute')
       );
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.process_appointment_transitions()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_appointment_transitions() TO service_role;

CREATE OR REPLACE FUNCTION public.get_appointments_by_phone(p_slug text, p_phone text)
RETURNS TABLE (
    id uuid,
    "date" date,
    "time" time,
    status text,
    client_name text,
    service_name text,
    barber_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    SELECT t.id INTO v_tenant_id
      FROM public.tenants AS t
     WHERE t.domain = p_slug;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant no encontrado';
    END IF;

    RETURN QUERY
    SELECT a.id, a.date, a.time, a.status, a.client_name,
           a.service_name_snapshot AS service_name,
           b.name AS barber_name
      FROM public.appointments AS a
      LEFT JOIN public.barbers AS b
        ON b.id = a.barber_id AND b.tenant_id = a.tenant_id
     WHERE a.tenant_id = v_tenant_id
       AND a.phone = p_phone
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
    id uuid,
    "date" date,
    "time" time,
    status text,
    client_name text,
    phone text,
    service_name text,
    service_duration integer,
    service_price numeric,
    barber_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    SELECT t.id INTO v_tenant_id
      FROM public.tenants AS t
     WHERE t.domain = p_slug;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant no encontrado';
    END IF;

    RETURN QUERY
    SELECT a.id, a.date, a.time, a.status, a.client_name, a.phone,
           a.service_name_snapshot AS service_name,
           a.duration_minutes_snapshot AS service_duration,
           a.price_snapshot AS service_price,
           b.name AS barber_name
      FROM public.appointments AS a
      LEFT JOIN public.barbers AS b
        ON b.id = a.barber_id AND b.tenant_id = a.tenant_id
     WHERE a.tenant_id = v_tenant_id
       AND a.id = p_appointment_id;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_appointment_by_id(text, uuid)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_by_id(text, uuid)
TO anon, authenticated, service_role;

COMMIT;
