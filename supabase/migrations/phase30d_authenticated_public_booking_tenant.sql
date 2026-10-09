-- Phase 30D: preserve the slug-authoritative tenant for public bookings made
-- by authenticated users without weakening direct authenticated INSERTs.

BEGIN;

DO $$
DECLARE
    v_create_booking_oid oid := 'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure::oid;
BEGIN
    IF current_user <> 'postgres'
       OR NOT EXISTS (
           SELECT 1
             FROM pg_catalog.pg_roles
            WHERE rolname = current_user
              AND (rolcreaterole OR rolsuper)
       ) THEN
        RAISE EXCEPTION
            'Phase 30D aborted: migration must run as postgres with permission to create the private capability role.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_proc AS p
         WHERE p.oid = v_create_booking_oid
           AND p.prosecdef
           AND pg_catalog.pg_get_userbyid(p.proowner) = 'postgres'
           AND p.proconfig @> ARRAY['search_path=""']::text[]
    ) THEN
        RAISE EXCEPTION
            'Phase 30D aborted: modern create_booking must be SECURITY DEFINER, owned by postgres, with an empty search_path.';
    END IF;

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
            'Phase 30D aborted: expected appointments BEFORE INSERT tenant trigger was not found.';
    END IF;

    IF pg_catalog.to_regprocedure('public.get_auth_tenant_id()') IS NULL THEN
        RAISE EXCEPTION
            'Phase 30D aborted: public.get_auth_tenant_id() was not found.';
    END IF;

    IF (
        SELECT pg_catalog.count(DISTINCT t.tgrelid)
          FROM pg_catalog.pg_trigger AS t
          JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
          JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
         WHERE t.tgrelid IN (
               'public.availability'::regclass,
               'public.services'::regclass
           )
           AND NOT t.tgisinternal
           AND (t.tgtype::integer & 1) = 1
           AND (t.tgtype::integer & 2) = 2
           AND (t.tgtype::integer & 4) = 4
           AND n.nspname = 'public'
           AND p.proname = 'set_tenant_id_trigger'
    ) <> 2 THEN
        RAISE EXCEPTION
            'Phase 30D aborted: services and availability must retain their original BEFORE INSERT tenant triggers.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_trigger AS t
          JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
         WHERE t.tgrelid = 'public.appointments'::regclass
           AND t.tgname = 'trg_z_appointments_service_snapshot'
           AND NOT t.tgisinternal
           AND p.proname = 'set_appointment_service_snapshot'
    ) THEN
        RAISE EXCEPTION
            'Phase 30D aborted: Phase 29 appointment snapshot trigger was not found.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_class AS c
         WHERE c.oid = 'public.appointments'::regclass
           AND c.relrowsecurity
    ) THEN
        RAISE EXCEPTION 'Phase 30D aborted: RLS is not enabled on appointments.';
    END IF;

    IF pg_catalog.has_table_privilege('anon', 'public.appointments', 'INSERT') THEN
        RAISE EXCEPTION
            'Phase 30D aborted: anon unexpectedly has direct INSERT on appointments.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_attribute AS a
         WHERE a.attrelid = 'public.appointments'::regclass
           AND a.attname IN (
               'service_name_snapshot',
               'price_snapshot',
               'duration_minutes_snapshot'
           )
           AND a.attnotnull
           AND NOT a.attisdropped
         GROUP BY a.attrelid
        HAVING pg_catalog.count(*) = 3
    ) THEN
        RAISE EXCEPTION
            'Phase 30D aborted: required Phase 29 snapshot columns are missing or nullable.';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'barberflow_booking_writer') THEN
        RAISE EXCEPTION
            'Phase 30D aborted: role barberflow_booking_writer already exists.';
    END IF;
END;
$$;

CREATE ROLE barberflow_booking_writer
    NOLOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOINHERIT
    NOREPLICATION
    NOBYPASSRLS;

GRANT barberflow_booking_writer TO postgres;
GRANT USAGE ON SCHEMA public TO barberflow_booking_writer;
GRANT INSERT ON TABLE public.appointments TO barberflow_booking_writer;

CREATE POLICY phase30d_booking_writer_insert
ON public.appointments
FOR INSERT
TO barberflow_booking_writer
WITH CHECK (tenant_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.insert_public_booking_appointment(
    p_tenant_id uuid,
    p_service_id uuid,
    p_barber_id uuid,
    p_date date,
    p_time time,
    p_client_name text,
    p_phone text,
    p_status text,
    p_service_name_snapshot text,
    p_price_snapshot numeric,
    p_duration_minutes_snapshot integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_appointment_id uuid := pg_catalog.gen_random_uuid();
BEGIN
    IF p_tenant_id IS NULL
       OR p_status NOT IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'Private public-booking insert received invalid tenant or status.';
    END IF;

    INSERT INTO public.appointments (
        id, tenant_id, service_id, barber_id, date, time, client_name, phone, status,
        service_name_snapshot, price_snapshot, duration_minutes_snapshot
    ) VALUES (
        v_appointment_id, p_tenant_id, p_service_id, p_barber_id, p_date, p_time,
        p_client_name, p_phone, p_status,
        p_service_name_snapshot, p_price_snapshot, p_duration_minutes_snapshot
    );

    RETURN v_appointment_id;
END;
$$;

ALTER FUNCTION public.insert_public_booking_appointment(
    uuid, uuid, uuid, date, time, text, text, text, text, numeric, integer
) OWNER TO barberflow_booking_writer;

REVOKE ALL PRIVILEGES ON FUNCTION public.insert_public_booking_appointment(
    uuid, uuid, uuid, date, time, text, text, text, text, numeric, integer
) FROM PUBLIC, anon, authenticated, service_role, barberflow_booking_writer;
GRANT EXECUTE ON FUNCTION public.insert_public_booking_appointment(
    uuid, uuid, uuid, date, time, text, text, text, text, numeric, integer
) TO postgres;

REVOKE barberflow_booking_writer FROM postgres;

CREATE OR REPLACE FUNCTION public.set_appointment_tenant_id_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- Only the private Phase 30D writer capability may preserve the tenant
    -- already resolved by the public booking RPC. `postgres` itself is not a
    -- sufficient signal: other SECURITY DEFINER functions may share that owner.
    IF current_user = 'barberflow_booking_writer' THEN
        IF NEW.tenant_id IS NULL THEN
            RAISE EXCEPTION 'Trusted public booking insert requires tenant_id.';
        END IF;
        RETURN NEW;
    END IF;

    -- Preserve the pre-Phase-30D behavior for direct authenticated INSERTs.
    IF auth.role() = 'authenticated' THEN
        NEW.tenant_id := public.get_auth_tenant_id();
        IF NEW.tenant_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated user is not associated with a tenant.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.set_appointment_tenant_id_trigger() OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.set_appointment_tenant_id_trigger()
FROM PUBLIC, anon, authenticated, service_role, barberflow_booking_writer;

DROP TRIGGER trg_appointments_tenant_id ON public.appointments;
CREATE TRIGGER trg_appointments_tenant_id
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_appointment_tenant_id_trigger();

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
    v_confirmation_mode text;
    v_initial_status text;
    v_appointment_id uuid;
    v_service_name text;
    v_price numeric;
    v_duration integer;
BEGIN
    SELECT t.id, t.booking_confirmation_mode
      INTO v_tenant_id, v_confirmation_mode
      FROM public.tenants AS t
     WHERE t.domain = p_slug
     FOR SHARE;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant inválido o no existe.';
    END IF;

    v_initial_status := CASE v_confirmation_mode
        WHEN 'automatic' THEN 'confirmed'
        WHEN 'manual' THEN 'pending'
        ELSE NULL
    END;

    IF v_initial_status IS NULL THEN
        RAISE EXCEPTION 'El tenant tiene una modalidad de confirmación inválida.';
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

    v_appointment_id := public.insert_public_booking_appointment(
        v_tenant_id,
        p_service_id,
        p_barber_id,
        p_date,
        p_time,
        p_client_name,
        p_phone,
        v_initial_status,
        v_service_name,
        v_price,
        v_duration
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'id', v_appointment_id,
        'service_name', v_service_name,
        'price', v_price,
        'duration_minutes', v_duration,
        'status', v_initial_status
    );
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time, text, text
) TO anon, authenticated, service_role;

COMMIT;
