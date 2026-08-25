-- phase22_update_rpc.sql
-- Actualiza la función get_tenant_catalog para devolver la dirección y los horarios

CREATE OR REPLACE FUNCTION public.get_tenant_catalog(p_slug TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id UUID;
    v_result jsonb;
BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE domain = p_slug;
    IF v_tenant_id IS NULL THEN RETURN pg_catalog.jsonb_build_object('tenant', null, 'services', '[]'::jsonb, 'barbers', '[]'::jsonb, 'availability', '[]'::jsonb); END IF;

    SELECT pg_catalog.jsonb_build_object(
        'tenant', (SELECT pg_catalog.row_to_json(t) FROM (
            -- Aquí agregamos address, business_hours y el id que faltaba
            SELECT id, name, domain, logo_url, theme_color, whatsapp_number, address, business_hours 
            FROM public.tenants WHERE id = v_tenant_id
        ) t),
        'services', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.row_to_json(s)) FROM (
            SELECT id, name, description, duration_minutes, price, image_url, category_id 
            FROM public.services WHERE tenant_id = v_tenant_id AND is_active = true
        ) s), '[]'::jsonb),
        'barbers', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.row_to_json(b)) FROM (
            SELECT id, name, avatar_url 
            FROM public.barbers WHERE tenant_id = v_tenant_id AND is_active = true
        ) b), '[]'::jsonb),
        'availability', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.row_to_json(a)) FROM (
            SELECT day_of_week, start_time, end_time, barber_id 
            FROM public.availability WHERE tenant_id = v_tenant_id AND is_active = true
        ) a), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;
