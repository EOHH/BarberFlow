-- Phase 29 read-only verification. This file performs no writes.

-- A. Every appointment must have a complete, valid snapshot.
SELECT
    pg_catalog.count(*) AS total_appointments,
    pg_catalog.count(*) FILTER (
        WHERE service_name_snapshot IS NULL
           OR pg_catalog.length(pg_catalog.btrim(service_name_snapshot)) = 0
           OR price_snapshot IS NULL
           OR price_snapshot < 0
           OR price_snapshot = 'NaN'::numeric
           OR price_snapshot = 'Infinity'::numeric
           OR price_snapshot = '-Infinity'::numeric
           OR duration_minutes_snapshot IS NULL
           OR duration_minutes_snapshot <= 0
    ) AS invalid_snapshots
FROM public.appointments;

-- B. Review captured values by tenant and service. For pre-Phase-29 rows these
-- are known service values at migration time, not proven original booked values.
SELECT
    a.tenant_id,
    a.service_id,
    a.service_name_snapshot,
    a.price_snapshot,
    a.duration_minutes_snapshot,
    pg_catalog.count(*) AS appointment_count
FROM public.appointments AS a
GROUP BY
    a.tenant_id,
    a.service_id,
    a.service_name_snapshot,
    a.price_snapshot,
    a.duration_minutes_snapshot
ORDER BY a.tenant_id, a.service_name_snapshot;

-- C. Differences are expected after a catalog edit and demonstrate that the
-- historical snapshot remains independent. Review; do not treat as corruption.
SELECT
    a.id,
    a.tenant_id,
    a.service_id,
    a.service_name_snapshot,
    s.name AS current_service_name,
    a.price_snapshot,
    s.price AS current_service_price,
    a.duration_minutes_snapshot,
    s.duration_minutes AS current_service_duration
FROM public.appointments AS a
JOIN public.services AS s
  ON s.id = a.service_id
 AND s.tenant_id = a.tenant_id
WHERE a.service_name_snapshot IS DISTINCT FROM s.name
   OR a.price_snapshot IS DISTINCT FROM s.price
   OR a.duration_minutes_snapshot IS DISTINCT FROM s.duration_minutes
ORDER BY a.tenant_id, a.date, a.time;

-- D. Referential integrity should remain tenant-safe and ON DELETE RESTRICT.
SELECT
    c.conname,
    pg_catalog.pg_get_constraintdef(c.oid) AS definition
FROM pg_catalog.pg_constraint AS c
WHERE c.conrelid = 'public.appointments'::regclass
  AND c.conname = 'fk_appointments_service_tenant';

-- E. Snapshot columns and constraints.
SELECT
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'appointments'
  AND c.column_name IN (
      'service_name_snapshot',
      'price_snapshot',
      'duration_minutes_snapshot'
  )
ORDER BY c.column_name;

SELECT
    c.conname,
    pg_catalog.pg_get_constraintdef(c.oid) AS definition
FROM pg_catalog.pg_constraint AS c
WHERE c.conrelid = 'public.appointments'::regclass
  AND c.conname IN (
      'appointments_service_name_snapshot_check',
      'appointments_price_snapshot_check',
      'appointments_duration_minutes_snapshot_check'
  )
ORDER BY c.conname;

-- F. Trigger inventory: the pre-existing tenant trigger must remain.
SELECT
    t.tgname,
    pg_catalog.pg_get_triggerdef(t.oid) AS definition
FROM pg_catalog.pg_trigger AS t
WHERE t.tgrelid = 'public.appointments'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- G. Security mode, owner and fixed search_path for affected functions.
SELECT
    p.oid::regprocedure AS function_signature,
    p.prosecdef AS security_definer,
    p.proconfig,
    pg_catalog.pg_get_userbyid(p.proowner) AS owner
FROM pg_catalog.pg_proc AS p
WHERE p.oid IN (
    'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure,
    'public.create_booking(uuid,uuid,uuid,date,time without time zone,character varying,character varying)'::regprocedure,
    'public.get_available_slots(text,uuid,uuid,date)'::regprocedure,
    'public.get_appointment_by_id(text,uuid)'::regprocedure,
    'public.get_appointments_by_phone(text,text)'::regprocedure,
    'public.process_appointment_transitions()'::regprocedure,
    'public.process_upcoming_reminders()'::regprocedure
)
ORDER BY function_signature::text;

-- H. Phase 27/28 EXECUTE boundary. Expected booleans are documented in the
-- Phase 29 deployment checklist; this query performs no role changes.
SELECT
    r.role_name,
    pg_catalog.has_function_privilege(r.role_name, f.signature, 'EXECUTE') AS can_execute,
    f.label
FROM (VALUES ('anon'), ('authenticated'), ('service_role'), ('postgres')) AS r(role_name)
CROSS JOIN (VALUES
    ('public.create_booking(text,uuid,uuid,date,time without time zone,text,text)', 'modern_create_booking'),
    ('public.create_booking(uuid,uuid,uuid,date,time without time zone,character varying,character varying)', 'legacy_create_booking'),
    ('public.get_available_slots(text,uuid,uuid,date)', 'get_available_slots'),
    ('public.get_appointment_by_id(text,uuid)', 'get_appointment_by_id'),
    ('public.get_appointments_by_phone(text,text)', 'get_appointments_by_phone'),
    ('public.process_appointment_transitions()', 'process_appointment_transitions'),
    ('public.process_upcoming_reminders()', 'process_upcoming_reminders')
) AS f(signature, label)
ORDER BY f.label, r.role_name;

-- I. Definitions must show snapshot reads in the lifecycle, availability and
-- public appointment RPCs.
SELECT pg_catalog.pg_get_functiondef(p.oid)
FROM pg_catalog.pg_proc AS p
WHERE p.oid IN (
    'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure,
    'public.get_available_slots(text,uuid,uuid,date)'::regprocedure,
    'public.get_appointment_by_id(text,uuid)'::regprocedure,
    'public.get_appointments_by_phone(text,text)'::regprocedure,
    'public.process_appointment_transitions()'::regprocedure
)
ORDER BY p.oid::regprocedure::text;
