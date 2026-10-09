\set ON_ERROR_STOP on
DO $$
BEGIN
    IF (
        SELECT pg_catalog.count(*)
          FROM public.appointments
         WHERE tenant_id = '30100000-0000-0000-0000-000000000010'
           AND barber_id = '30200000-0000-0000-0000-000000000010'
           AND date = date '2099-01-05'
           AND time = time '15:00'
           AND status IN ('pending', 'confirmed', 'in_progress', 'completed')
    ) <> 1 THEN
        RAISE EXCEPTION 'concurrency test expected exactly one appointment';
    END IF;
END;
$$;
