-- Phase 30 read-only production verification. This file performs no writes.

-- Column, default and nullability.
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'tenants'
   AND column_name = 'booking_confirmation_mode';

-- Check constraint.
SELECT c.conname, pg_catalog.pg_get_constraintdef(c.oid) AS definition
  FROM pg_catalog.pg_constraint AS c
 WHERE c.conrelid = 'public.tenants'::regclass
   AND c.conname = 'tenants_booking_confirmation_mode_check';

-- Stored values (aggregate only).
SELECT t.booking_confirmation_mode, pg_catalog.count(*) AS tenant_count
  FROM public.tenants AS t
 GROUP BY t.booking_confirmation_mode
 ORDER BY t.booking_confirmation_mode;

-- Function security, owner, configuration and ACL.
SELECT p.oid::regprocedure AS signature,
       p.prosecdef AS security_definer,
       p.proconfig AS configuration,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       p.proacl AS acl
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND (
       p.proname = 'update_booking_confirmation_mode'
       OR p.proname = 'create_booking'
   )
 ORDER BY p.oid::regprocedure::text;

-- Exact definitions for the two Phase 30 functions.
SELECT pg_catalog.pg_get_functiondef(
    'public.update_booking_confirmation_mode(text)'::regprocedure
);

SELECT pg_catalog.pg_get_functiondef(
    'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure
);

-- Explicit privilege checks for client roles.
SELECT role_name, function_name,
       pg_catalog.has_function_privilege(role_name, function_name, 'EXECUTE') AS can_execute
  FROM (VALUES
      ('anon', 'public.update_booking_confirmation_mode(text)'),
      ('authenticated', 'public.update_booking_confirmation_mode(text)'),
      ('service_role', 'public.update_booking_confirmation_mode(text)'),
      ('anon', 'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'),
      ('authenticated', 'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'),
      ('service_role', 'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)')
  ) AS checks(role_name, function_name)
 ORDER BY function_name, role_name;

-- Confirm that RLS and the existing tenant policies remain unchanged/enabled.
SELECT c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname = 'tenants';

SELECT policyname, permissive, roles, cmd, qual, with_check
  FROM pg_catalog.pg_policies
 WHERE schemaname = 'public'
   AND tablename = 'tenants'
 ORDER BY policyname;

-- Pre-existing tenant trigger behavior used by every appointment INSERT.
SELECT pg_catalog.pg_get_functiondef(
    'public.set_tenant_id_trigger()'::regprocedure
);

SELECT t.tgname, pg_catalog.pg_get_triggerdef(t.oid) AS definition
  FROM pg_catalog.pg_trigger AS t
 WHERE t.tgrelid = 'public.appointments'::regclass
   AND NOT t.tgisinternal
 ORDER BY t.tgname;

-- Read-only post-smoke-test distribution. No historical row should be changed
-- merely by setting a tenant's confirmation mode.
SELECT t.booking_confirmation_mode, a.status, pg_catalog.count(*) AS appointment_count
  FROM public.tenants AS t
  JOIN public.appointments AS a ON a.tenant_id = t.id
 WHERE a.created_at >= pg_catalog.now() - interval '24 hours'
 GROUP BY t.booking_confirmation_mode, a.status
 ORDER BY t.booking_confirmation_mode, a.status;
