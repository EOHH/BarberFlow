-- phase26_public_appointment_access.sql

-- 1. RPC para buscar citas por teléfono (FindBooking)
CREATE OR REPLACE FUNCTION public.get_appointments_by_phone(p_slug TEXT, p_phone TEXT)
RETURNS TABLE (
    id UUID,
    "date" DATE,
    "time" TIME,
    status TEXT,
    client_name TEXT,
    service_name TEXT,
    barber_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT t.id INTO v_tenant_id FROM public.tenants t WHERE t.domain = p_slug;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant no encontrado';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.client_name,
        s.name AS service_name,
        b.name AS barber_name
    FROM public.appointments a
    LEFT JOIN public.services s ON a.service_id = s.id
    LEFT JOIN public.barbers b ON a.barber_id = b.id
    WHERE a.tenant_id = v_tenant_id
      AND a.phone = p_phone
    ORDER BY a.date DESC, a.time DESC
    LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.get_appointments_by_phone(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointments_by_phone(TEXT, TEXT) TO anon, authenticated;

-- 2. RPC para obtener los detalles de una cita por ID (ClientPortal)
CREATE OR REPLACE FUNCTION public.get_appointment_by_id(p_slug TEXT, p_appointment_id UUID)
RETURNS TABLE (
    id UUID,
    "date" DATE,
    "time" TIME,
    status TEXT,
    client_name TEXT,
    phone TEXT,
    service_name TEXT,
    service_duration INT,
    service_price DECIMAL,
    barber_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT t.id INTO v_tenant_id FROM public.tenants t WHERE t.domain = p_slug;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant no encontrado';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.client_name,
        a.phone,
        s.name AS service_name,
        s.duration_minutes AS service_duration,
        s.price AS service_price,
        b.name AS barber_name
    FROM public.appointments a
    LEFT JOIN public.services s ON a.service_id = s.id
    LEFT JOIN public.barbers b ON a.barber_id = b.id
    WHERE a.tenant_id = v_tenant_id
      AND a.id = p_appointment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_appointment_by_id(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_by_id(TEXT, UUID) TO anon, authenticated;
