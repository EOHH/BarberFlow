-- Phase 30: tenant-controlled confirmation mode for new public bookings.
-- Existing appointments are intentionally left unchanged.

BEGIN;

ALTER TABLE public.tenants
    ADD COLUMN booking_confirmation_mode text NOT NULL DEFAULT 'automatic',
    ADD CONSTRAINT tenants_booking_confirmation_mode_check
        CHECK (booking_confirmation_mode IN ('automatic', 'manual'));

CREATE OR REPLACE FUNCTION public.update_booking_confirmation_mode(p_mode text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id uuid;
    v_mode text;
BEGIN
    v_mode := p_mode;

    IF v_mode IS NULL OR v_mode NOT IN ('automatic', 'manual') THEN
        RAISE EXCEPTION 'Invalid booking confirmation mode.'
            USING ERRCODE = '22023';
    END IF;

    SELECT tu.tenant_id
      INTO v_tenant_id
      FROM public.tenant_users AS tu
     WHERE tu.user_id = auth.uid()
       AND tu.role = 'admin';

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Only a tenant administrator can change the booking confirmation mode.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.tenants AS t
       SET booking_confirmation_mode = v_mode
     WHERE t.id = v_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Authenticated tenant was not found.'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN v_mode;
END;
$$;

ALTER FUNCTION public.update_booking_confirmation_mode(text) OWNER TO postgres;

REVOKE ALL PRIVILEGES ON FUNCTION public.update_booking_confirmation_mode(text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_booking_confirmation_mode(text)
TO authenticated;

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
    -- Lock the tenant row before the booking advisory lock. A concurrent mode
    -- update must finish before this booking chooses its authoritative status.
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

    INSERT INTO public.appointments (
        tenant_id, service_id, barber_id, date, time, client_name, phone, status,
        service_name_snapshot, price_snapshot, duration_minutes_snapshot
    ) VALUES (
        v_tenant_id, p_service_id, p_barber_id, p_date, p_time, p_client_name, p_phone,
        v_initial_status, v_service_name, v_price, v_duration
    )
    RETURNING id INTO v_appointment_id;

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
