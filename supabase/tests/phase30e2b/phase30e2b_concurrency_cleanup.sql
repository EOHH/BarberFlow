-- Local-only cleanup for synthetic committed concurrency fixtures.
-- Never run against production.
\set ON_ERROR_STOP on

BEGIN;

DELETE FROM public.tenant_users
WHERE user_id = '30e2c000-0000-4000-8000-000000000001';

DELETE FROM public.tenants
WHERE id = '30e2c100-0000-4000-8000-000000000001'
   OR owner_id = '30e2c000-0000-4000-8000-000000000001';

DELETE FROM auth.users
WHERE id = '30e2c000-0000-4000-8000-000000000001';

COMMIT;
