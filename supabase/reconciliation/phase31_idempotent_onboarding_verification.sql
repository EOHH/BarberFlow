-- Phase 31 read-only verification. This file performs no writes.

SELECT p.oid::regprocedure AS signature,
       p.prosecdef AS security_definer,
       p.proconfig AS configuration,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner,
       p.proacl AS acl
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN (
       'resolve_auth_onboarding',
       'complete_auth_onboarding',
       'protect_tenant_owner_id'
   )
 ORDER BY p.oid::regprocedure::text;

SELECT t.tgname AS trigger_name,
       t.tgenabled AS enabled,
       t.tgtype,
       t.tgfoid::regprocedure AS function_signature
  FROM pg_catalog.pg_trigger AS t
 WHERE t.tgrelid = 'public.tenants'::regclass
   AND t.tgname = 'trg_tenants_protect_owner_id'
   AND NOT t.tgisinternal;

SELECT role_name, function_name,
       pg_catalog.has_function_privilege(role_name, function_name, 'EXECUTE') AS can_execute
  FROM (VALUES
      ('anon', 'public.resolve_auth_onboarding()'),
      ('authenticated', 'public.resolve_auth_onboarding()'),
      ('service_role', 'public.resolve_auth_onboarding()'),
      ('anon', 'public.complete_auth_onboarding(text,text)'),
      ('authenticated', 'public.complete_auth_onboarding(text,text)'),
      ('service_role', 'public.complete_auth_onboarding(text,text)'),
      ('anon', 'public.protect_tenant_owner_id()'),
      ('authenticated', 'public.protect_tenant_owner_id()'),
      ('service_role', 'public.protect_tenant_owner_id()')
  ) AS checks(role_name, function_name)
 ORDER BY function_name, role_name;

SELECT role_name,
       pg_catalog.has_function_privilege(
           role_name,
           'public.onboard_tenant(text,text)',
           'EXECUTE'
       ) AS can_execute_legacy_onboarding
  FROM (VALUES ('anon'), ('authenticated')) AS roles(role_name)
 ORDER BY role_name;

-- Aggregate only: legacy owner tenants that still lack tenant_users membership.
SELECT pg_catalog.count(*) AS owned_tenants_without_membership
  FROM public.tenants AS t
 WHERE t.owner_id IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
         FROM public.tenant_users AS tu
        WHERE tu.user_id = t.owner_id
          AND tu.tenant_id = t.id
   );

-- Must be zero before assuming owner_id identifies one unambiguous tenant.
SELECT t.owner_id, pg_catalog.count(*) AS owned_tenant_count
  FROM public.tenants AS t
 WHERE t.owner_id IS NOT NULL
 GROUP BY t.owner_id
HAVING pg_catalog.count(*) > 1;
