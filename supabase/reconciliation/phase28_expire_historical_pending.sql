-- REVIEW AND RUN MANUALLY. This file is not a migration.

-- Read-only preview.
SELECT id, tenant_id, barber_id, service_id, date, time, created_at, reminder_sent
FROM public.appointments
WHERE status = 'pending'
  AND (date + time)::timestamp <= pg_catalog.timezone('America/Lima', pg_catalog.now())
ORDER BY tenant_id, date, time, id;

SELECT tenant_id, pg_catalog.count(*) AS rows_to_expire
FROM public.appointments
WHERE status = 'pending'
  AND (date + time)::timestamp <= pg_catalog.timezone('America/Lima', pg_catalog.now())
GROUP BY tenant_id
ORDER BY tenant_id;

-- Manual reconciliation. Export the preview IDs before uncommenting.
-- BEGIN;
-- CREATE TEMP TABLE phase28_reconciled_ids ON COMMIT DROP AS
-- SELECT id FROM public.appointments
-- WHERE status = 'pending'
--   AND (date + time)::timestamp <= pg_catalog.timezone('America/Lima', pg_catalog.now())
-- FOR UPDATE;
--
-- UPDATE public.appointments AS a
-- SET status = 'expired'
-- FROM phase28_reconciled_ids AS r
-- WHERE a.id = r.id AND a.status = 'pending'
-- RETURNING a.id, a.tenant_id, a.date, a.time, a.status;
--
-- SELECT a.id FROM public.appointments AS a
-- JOIN phase28_reconciled_ids AS r ON r.id = a.id
-- WHERE a.status <> 'expired'; -- must return zero rows
-- COMMIT;

-- After-verification using the exported exact IDs.
-- SELECT id, tenant_id, date, time, status FROM public.appointments
-- WHERE id = ANY (ARRAY['00000000-0000-0000-0000-000000000000'::uuid]);

-- Targeted rollback guidance: review every ID, then use only the exported set.
-- UPDATE public.appointments SET status = 'pending'
-- WHERE status = 'expired'
--   AND id = ANY (ARRAY['00000000-0000-0000-0000-000000000000'::uuid])
-- RETURNING id, tenant_id, date, time, status;
