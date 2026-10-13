-- Phase 30E.2B read-only post-migration verification.
-- Run manually only after applying the migration.

SELECT
    proc.oid IS NOT NULL AS function_exists,
    proc.oid::regprocedure::text AS function_signature,
    pg_catalog.pg_get_userbyid(proc.proowner) AS function_owner,
    pg_catalog.pg_get_userbyid(proc.proowner) = 'postgres' AS owner_is_postgres,
    proc.prosecdef AS security_definer,
    proc.prosecdef IS TRUE AS security_definer_is_valid,
    proc.proconfig AS function_config,
    proc.proconfig @> ARRAY['search_path=""']::text[] AS search_path_is_empty,
    proc.provolatile AS volatility,
    proc.prokind AS function_kind
FROM (VALUES ('public.save_client_private_notes(uuid,text,text)'))
    AS expected(function_signature)
LEFT JOIN pg_catalog.pg_proc AS proc
  ON proc.oid = pg_catalog.to_regprocedure(expected.function_signature);

SELECT
    role_name,
    expected_can_execute,
    pg_catalog.has_function_privilege(
        role_name,
        'public.save_client_private_notes(uuid,text,text)',
        'EXECUTE'
    ) AS can_execute,
    pg_catalog.has_function_privilege(
        role_name,
        'public.save_client_private_notes(uuid,text,text)',
        'EXECUTE'
    ) = expected_can_execute AS matches_expected
FROM (VALUES
    ('anon', false),
    ('authenticated', true),
    ('service_role', false)
) AS roles(role_name, expected_can_execute)
ORDER BY role_name;

SELECT
    pg_catalog.pg_get_functiondef(
        'public.save_client_private_notes(uuid,text,text)'::regprocedure
    ) AS function_definition;

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
  AND column_name IN ('id', 'tenant_id', 'name', 'phone', 'private_notes')
ORDER BY ordinal_position;

SELECT
    cls.relname AS table_name,
    cls.relrowsecurity AS rls_enabled,
    cls.relforcerowsecurity AS rls_forced
FROM pg_catalog.pg_class AS cls
JOIN pg_catalog.pg_namespace AS ns
  ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relname IN ('clients', 'appointments')
ORDER BY cls.relname;

SELECT
    tablename AS table_name,
    policyname AS policy_name,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'appointments')
ORDER BY tablename, command, policyname;

SELECT
    con.conrelid::regclass::text AS table_name,
    con.conname AS constraint_name,
    CASE con.contype
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        ELSE con.contype::text
    END AS constraint_type,
    pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint AS con
WHERE con.conrelid IN (
    'public.clients'::regclass,
    'public.appointments'::regclass
)
  AND (
      pg_catalog.pg_get_constraintdef(con.oid, true) ILIKE '%tenant_id%phone%'
      OR pg_catalog.pg_get_constraintdef(con.oid, true) ILIKE '%client_id%tenant_id%'
  )
ORDER BY con.conname;

SELECT
    pg_catalog.count(*) AS appointments_without_client_id
FROM public.appointments AS appointment
WHERE appointment.client_id IS NULL;

SELECT
    pg_catalog.count(*) AS duplicate_exact_tenant_phone_groups
FROM (
    SELECT 1
    FROM public.clients AS client
    WHERE client.tenant_id IS NOT NULL
      AND client.phone IS NOT NULL
      AND pg_catalog.btrim(client.phone) <> ''
    GROUP BY client.tenant_id, client.phone
    HAVING pg_catalog.count(*) > 1
) AS duplicate_group;

SELECT
    pg_catalog.count(*) AS cross_tenant_appointment_client_links
FROM public.appointments AS appointment
JOIN public.clients AS client
  ON client.id = appointment.client_id
WHERE appointment.client_id IS NOT NULL
  AND appointment.tenant_id IS DISTINCT FROM client.tenant_id;
