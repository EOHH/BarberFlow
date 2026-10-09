-- Functional rollback for Phase 30. Do not run automatically.
-- The tenant setting and its values are retained to avoid destructive data loss.
-- Public bookings return to the Phase 29 behavior of starting as pending.

BEGIN;

REVOKE ALL PRIVILEGES ON FUNCTION public.update_booking_confirmation_mode(text)
FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.update_booking_confirmation_mode(text);

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

COMMIT;
