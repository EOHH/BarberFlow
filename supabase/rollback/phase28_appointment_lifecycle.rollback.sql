-- Structural rollback for Phase 28. Do not run automatically.
-- The safer in_progress availability blocking is intentionally retained.

BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.appointments WHERE status = 'expired') THEN
        RAISE EXCEPTION
            'Rollback blocked: explicitly reconcile expired appointments first.';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_appointment_transitions()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_current_time timestamp;
BEGIN
    v_current_time := NOW() AT TIME ZONE 'America/Lima';

    UPDATE public.appointments a
    SET status = 'in_progress'
    FROM public.services s
    WHERE a.service_id = s.id
      AND a.status = 'confirmed'
      AND (a.date + a.time)::timestamp <= v_current_time;

    UPDATE public.appointments a
    SET status = 'completed'
    FROM public.services s
    WHERE a.service_id = s.id
      AND a.status = 'in_progress'
      AND v_current_time >= (
          (a.date + a.time)::timestamp
          + (s.duration_minutes * interval '1 minute')
          - interval '5 minutes'
      );
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.process_appointment_transitions()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_appointment_transitions() TO service_role;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'in_progress', 'completed'));

COMMIT;
