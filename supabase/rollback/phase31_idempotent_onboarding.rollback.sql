-- Functional rollback for Phase 31. Does not remove tenants or memberships.

BEGIN;

GRANT EXECUTE ON FUNCTION public.onboard_tenant(text, text) TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION public.complete_auth_onboarding(text, text)
FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION public.complete_auth_onboarding(text, text);

REVOKE ALL PRIVILEGES ON FUNCTION public.resolve_auth_onboarding()
FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION public.resolve_auth_onboarding();

DROP TRIGGER trg_tenants_protect_owner_id ON public.tenants;
REVOKE ALL PRIVILEGES ON FUNCTION public.protect_tenant_owner_id()
FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION public.protect_tenant_owner_id();

COMMIT;
