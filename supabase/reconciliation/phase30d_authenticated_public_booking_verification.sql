-- Phase 30D read-only verification. This file performs no writes.

-- The capability role must be inert outside its private helper.
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolbypassrls
  FROM pg_catalog.pg_roles
 WHERE rolname = 'barberflow_booking_writer';

-- Verify modern RPC and Phase 30D functions: owner, invoker/definer mode,
-- fixed configuration and ACL.
SELECT p.oid::regprocedure AS signature,
       p.prosecdef AS security_definer,
       p.proconfig AS configuration,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       p.proacl AS acl
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN (
       'create_booking',
       'insert_public_booking_appointment',
       'set_appointment_tenant_id_trigger',
       'set_tenant_id_trigger'
   )
 ORDER BY p.oid::regprocedure::text;

SELECT pg_catalog.pg_get_functiondef(
    'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)'::regprocedure
);
SELECT pg_catalog.pg_get_functiondef(
    'public.insert_public_booking_appointment(uuid,uuid,uuid,date,time without time zone,text,text,text,text,numeric,integer)'::regprocedure
);
SELECT pg_catalog.pg_get_functiondef(
    'public.set_appointment_tenant_id_trigger()'::regprocedure
);

-- No browser or service role may invoke the private helper or trigger function.
SELECT role_name, function_name,
       pg_catalog.has_function_privilege(role_name, function_name, 'EXECUTE') AS can_execute
  FROM (VALUES
      ('anon', 'public.insert_public_booking_appointment(uuid,uuid,uuid,date,time without time zone,text,text,text,text,numeric,integer)'),
      ('authenticated', 'public.insert_public_booking_appointment(uuid,uuid,uuid,date,time without time zone,text,text,text,text,numeric,integer)'),
      ('service_role', 'public.insert_public_booking_appointment(uuid,uuid,uuid,date,time without time zone,text,text,text,text,numeric,integer)'),
      ('postgres', 'public.insert_public_booking_appointment(uuid,uuid,uuid,date,time without time zone,text,text,text,text,numeric,integer)'),
      ('anon', 'public.set_appointment_tenant_id_trigger()'),
      ('authenticated', 'public.set_appointment_tenant_id_trigger()'),
      ('service_role', 'public.set_appointment_tenant_id_trigger()')
  ) AS checks(role_name, function_name)
 ORDER BY function_name, role_name;

-- The private role gets INSERT but no SELECT on appointments. The helper
-- generates its UUID before INSERT and therefore needs no SELECT RLS policy.
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name = 'appointments'
   AND grantee = 'barberflow_booking_writer'
 ORDER BY privilege_type;

SELECT
    pg_catalog.has_table_privilege(
        'barberflow_booking_writer', 'public.appointments', 'INSERT'
    ) AS has_insert,
    pg_catalog.has_table_privilege(
        'barberflow_booking_writer', 'public.appointments', 'SELECT'
    ) AS has_table_select,
    pg_catalog.has_column_privilege(
        'barberflow_booking_writer', 'public.appointments', 'id', 'SELECT'
    ) AS has_id_select;

SELECT pg_catalog.pg_has_role(member_role, 'barberflow_booking_writer', 'MEMBER') AS is_member,
       member_role
  FROM (VALUES ('anon'), ('authenticated'), ('service_role'), ('postgres')) AS roles(member_role)
 ORDER BY member_role;

-- The role-specific permissive INSERT policy is narrow and Phase 27 policies
-- remain present.
SELECT policyname, permissive, roles, cmd, qual, with_check
  FROM pg_catalog.pg_policies
 WHERE schemaname = 'public'
   AND tablename = 'appointments'
 ORDER BY policyname;

-- Appointments alone must use the new invoker trigger. Services and
-- availability must remain attached to the original trigger function.
SELECT c.relname AS table_name,
       t.tgname,
       p.proname AS function_name,
       pg_catalog.pg_get_triggerdef(t.oid) AS definition
  FROM pg_catalog.pg_trigger AS t
  JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace AS cn ON cn.oid = c.relnamespace
  JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
 WHERE cn.nspname = 'public'
   AND c.relname IN ('appointments', 'availability', 'services')
   AND NOT t.tgisinternal
 ORDER BY c.relname, t.tgname;

-- Phase 27 direct anonymous INSERT remains revoked and the modern public RPC
-- grants remain unchanged.
SELECT role_name,
       pg_catalog.has_table_privilege(role_name, 'public.appointments', 'INSERT') AS direct_insert,
       pg_catalog.has_function_privilege(
           role_name,
           'public.create_booking(text,uuid,uuid,date,time without time zone,text,text)',
           'EXECUTE'
       ) AS can_create_booking
  FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
 ORDER BY role_name;
