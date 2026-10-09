-- Run only after applying the functional Phase 30D rollback locally.
\set ON_ERROR_STOP on

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_roles
         WHERE rolname = 'barberflow_booking_writer'
    ) THEN
        RAISE EXCEPTION 'Phase 30D capability role still exists after rollback';
    END IF;

    IF pg_catalog.to_regprocedure(
        'public.insert_public_booking_appointment(uuid,uuid,uuid,date,time without time zone,text,text,text,text,numeric,integer)'
    ) IS NOT NULL THEN
        RAISE EXCEPTION 'Phase 30D private insert helper still exists after rollback';
    END IF;

    IF pg_catalog.to_regprocedure('public.set_appointment_tenant_id_trigger()') IS NOT NULL THEN
        RAISE EXCEPTION 'Phase 30D appointments trigger function still exists after rollback';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_trigger AS t
          JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
         WHERE t.tgrelid = 'public.appointments'::regclass
           AND t.tgname = 'trg_appointments_tenant_id'
           AND NOT t.tgisinternal
           AND p.proname = 'set_tenant_id_trigger'
    ) THEN
        RAISE EXCEPTION 'original appointments tenant trigger was not restored';
    END IF;

    IF pg_catalog.pg_get_functiondef(
        'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure
    ) NOT LIKE '%INSERT INTO public.appointments%' THEN
        RAISE EXCEPTION 'Phase 30B direct insert body was not restored';
    END IF;

    IF pg_catalog.pg_get_functiondef(
        'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure
    ) LIKE '%insert_public_booking_appointment%' THEN
        RAISE EXCEPTION 'Phase 30D helper dependency remains in create_booking';
    END IF;
END;
$$;
