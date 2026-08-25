-- Migración: Booking Step & Zero Buffer
-- 1. Cambia el salto dinámico por duración a un salto fijo de 30 mins.
-- 2. Elimina el margen de 30 mins para reservar el mismo día.

DROP FUNCTION IF EXISTS public.get_available_slots(text, uuid, uuid, date);

CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_slug TEXT,
    p_service_id UUID,
    p_barber_id UUID,
    p_date DATE
) RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '' 
AS $$
DECLARE
    v_tenant_id UUID;
    v_duration INTEGER;
    v_day_of_week INTEGER;
    v_available_slots text[] := ARRAY[]::text[];
    
    v_availability record;
    v_start_mins integer;
    v_end_mins integer;
    v_time integer;
    v_slot_end integer;
    v_step integer := 30; -- Intervalo fijo de 30 minutos
    
    v_is_overlapping boolean;
    
    v_is_today boolean;
    v_current_minutes integer;
    v_booked_intervals jsonb; 
BEGIN
    -- 0. Validación de Fechas en el Pasado (America/Lima)
    IF p_date < (timezone('America/Lima', now()))::date THEN
        RETURN '[]'::jsonb;
    END IF;

    -- 1. Resolución segura de Tenant vía slug
    SELECT id INTO v_tenant_id FROM public.tenants WHERE domain = p_slug;
    IF v_tenant_id IS NULL THEN RETURN '[]'::jsonb; END IF;

    -- 2. Validación de Servicio (activo y perteneciente al tenant)
    SELECT duration_minutes INTO v_duration FROM public.services WHERE id = p_service_id AND tenant_id = v_tenant_id AND is_active = true;
    IF v_duration IS NULL THEN RETURN '[]'::jsonb; END IF;
    
    -- 3. Validación de Barbero (activo y perteneciente al tenant)
    IF NOT EXISTS (SELECT 1 FROM public.barbers WHERE id = p_barber_id AND tenant_id = v_tenant_id AND is_active = true) THEN
        RETURN '[]'::jsonb;
    END IF;

    -- 4. Día de la semana (0=Dom, 6=Sab)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- 5. Manejo de Timezone para horas actuales (America/Lima)
    IF p_date = (timezone('America/Lima', now()))::date THEN
        v_is_today := true;
        v_current_minutes := (EXTRACT(HOUR FROM timezone('America/Lima', now())) * 60) + EXTRACT(MINUTE FROM timezone('America/Lima', now()));
    ELSE
        v_is_today := false;
    END IF;
    
    -- 6. Pre-calcular intervalos ocupados (Oculto del frontend, validando tenant_id explícitamente)
    SELECT COALESCE(pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
            'start_mins', (EXTRACT(HOUR FROM a.time) * 60) + EXTRACT(MINUTE FROM a.time),
            'end_mins', ((EXTRACT(HOUR FROM a.time) * 60) + EXTRACT(MINUTE FROM a.time)) + s.duration_minutes
        )
    ), '[]'::jsonb) INTO v_booked_intervals
    FROM public.appointments a
    JOIN public.services s ON a.service_id = s.id
    WHERE a.barber_id = p_barber_id 
      AND a.date = p_date 
      AND a.status IN ('pending', 'confirmed')
      AND a.tenant_id = v_tenant_id
      AND s.tenant_id = v_tenant_id;
      
    -- 7. Iterar sobre la disponibilidad y calcular huecos fijos de 30 min
    FOR v_availability IN 
        SELECT start_time, end_time 
        FROM public.availability 
        WHERE barber_id = p_barber_id 
          AND tenant_id = v_tenant_id
          AND day_of_week = v_day_of_week 
          AND is_active = true
    LOOP
        v_start_mins := (EXTRACT(HOUR FROM v_availability.start_time) * 60) + EXTRACT(MINUTE FROM v_availability.start_time);
        v_end_mins := (EXTRACT(HOUR FROM v_availability.end_time) * 60) + EXTRACT(MINUTE FROM v_availability.end_time);
        
        v_time := v_start_mins;
        
        WHILE v_time + v_duration <= v_end_mins LOOP
            v_slot_end := v_time + v_duration;
            
            -- Margen removido (buffer de 0 minutos)
            IF v_is_today AND v_time <= v_current_minutes THEN
                v_time := v_time + v_step;
                CONTINUE;
            END IF;
            
            -- Detectar solapamiento evaluando el JSON temporal
            SELECT bool_or(
                (v_time >= (b->>'start_mins')::int AND v_time < (b->>'end_mins')::int) OR
                (v_slot_end > (b->>'start_mins')::int AND v_slot_end < (b->>'end_mins')::int) OR
                (v_time <= (b->>'start_mins')::int AND v_slot_end >= (b->>'end_mins')::int) OR
                (v_time = (b->>'start_mins')::int)
            ) INTO v_is_overlapping
            FROM pg_catalog.jsonb_array_elements(v_booked_intervals) AS b;
            
            v_is_overlapping := COALESCE(v_is_overlapping, false);
            
            -- Evitar agregar slots duplicados si la disponibilidad del barbero se solapa consigo misma
            IF NOT v_is_overlapping THEN
                DECLARE
                    v_formatted_time text := lpad((v_time / 60)::text, 2, '0') || ':' || lpad((v_time % 60)::text, 2, '0') || ':00';
                BEGIN
                    IF NOT (v_available_slots @> ARRAY[v_formatted_time]) THEN
                        v_available_slots := array_append(v_available_slots, v_formatted_time);
                    END IF;
                END;
            END IF;
            
            v_time := v_time + v_step; -- <-- AQUI ESTA LA MAGIA DEL SALTO DE 30 EN 30 INDEPENDIENTE DEL SERVICIO
        END LOOP;
        
    END LOOP;

    RETURN pg_catalog.to_jsonb(v_available_slots);
END;
$$;

REVOKE ALL ON FUNCTION public.get_available_slots(text, uuid, uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(text, uuid, uuid, date) TO anon, authenticated;


-- Además debemos reemplazar create_booking para asegurarnos de que la nueva get_available_slots se usa correctamente
-- En realidad no cambia la firma, pero por si acaso.
DROP FUNCTION IF EXISTS public.create_booking(text, uuid, uuid, date, time, text, text);

CREATE OR REPLACE FUNCTION public.create_booking(
    p_slug TEXT,
    p_service_id UUID,
    p_barber_id UUID,
    p_date DATE,
    p_time TIME,
    p_client_name TEXT,
    p_phone TEXT
) RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = '' 
AS $$
DECLARE
    v_tenant_id UUID;
    v_appointment_id UUID;
BEGIN
    -- 1. Resolución segura de Tenant vía slug
    SELECT id INTO v_tenant_id FROM public.tenants WHERE domain = p_slug;
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Tenant inválido o no existe.'; END IF;

    -- 2. Adquirir lock transaccional exclusivo para el barbero y fecha.
    PERFORM pg_advisory_xact_lock(hashtext(p_barber_id::text || p_date::text)::bigint);

    -- 3. Volver a calcular disponibilidad y validar
    IF NOT (public.get_available_slots(p_slug, p_service_id, p_barber_id, p_date) ? to_char(p_time, 'HH24:MI:SS')) THEN
        RAISE EXCEPTION 'El horario solicitado no está disponible, es en el pasado o choca con otra cita.';
    END IF;

    -- 4. Inserción Segura 
    INSERT INTO public.appointments (tenant_id, service_id, barber_id, date, time, client_name, phone, status)
    VALUES (v_tenant_id, p_service_id, p_barber_id, p_date, p_time, p_client_name, p_phone, 'pending')
    RETURNING id INTO v_appointment_id;

    RETURN pg_catalog.jsonb_build_object('success', true, 'id', v_appointment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking(text, uuid, uuid, date, time, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(text, uuid, uuid, date, time, text, text) TO anon, authenticated;
