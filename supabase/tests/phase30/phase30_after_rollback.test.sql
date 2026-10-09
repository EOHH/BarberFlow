-- Run only after applying the functional Phase 30 rollback locally.
\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE phase30_rollback_result (appointment_id uuid) ON COMMIT DROP;
GRANT INSERT, SELECT ON phase30_rollback_result TO anon;

DO $$
BEGIN
    IF pg_catalog.to_regprocedure('public.update_booking_confirmation_mode(text)') IS NOT NULL THEN
        RAISE EXCEPTION 'administrative Phase 30 RPC still exists after rollback';
    END IF;
    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'tenants'
           AND column_name = 'booking_confirmation_mode'
    ) THEN
        RAISE EXCEPTION 'functional rollback destructively removed the tenant setting';
    END IF;
    IF pg_catalog.pg_get_functiondef(
        'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure
    ) NOT LIKE '%p_phone, ''pending''%' THEN
        RAISE EXCEPTION 'modern create_booking was not restored to Phase 29 pending behavior';
    END IF;
END;
$$;

SET LOCAL ROLE anon;
INSERT INTO phase30_rollback_result(appointment_id)
SELECT (public.create_booking(
    'phase30-concurrency',
    '30300000-0000-0000-0000-000000000010',
    '30200000-0000-0000-0000-000000000010',
    date '2099-01-05', time '16:00', 'Rollback Probe', '+51000000012'
)->>'id')::uuid;
RESET ROLE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM public.appointments AS a
          JOIN phase30_rollback_result AS r ON r.appointment_id = a.id
         WHERE a.status = 'pending'
    ) THEN
        RAISE EXCEPTION 'Phase 29 pending behavior was not restored after rollback';
    END IF;
END;
$$;

ROLLBACK;
