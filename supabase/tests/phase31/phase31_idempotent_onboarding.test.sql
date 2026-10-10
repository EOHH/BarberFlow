-- Local/disposable database only. Synthetic data only.
\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
    IF pg_catalog.has_function_privilege('anon', 'public.resolve_auth_onboarding()', 'EXECUTE')
       OR pg_catalog.has_function_privilege('service_role', 'public.resolve_auth_onboarding()', 'EXECUTE')
       OR pg_catalog.has_function_privilege('anon', 'public.complete_auth_onboarding(text,text)', 'EXECUTE')
       OR pg_catalog.has_function_privilege('service_role', 'public.complete_auth_onboarding(text,text)', 'EXECUTE')
       OR pg_catalog.has_function_privilege('anon', 'public.protect_tenant_owner_id()', 'EXECUTE')
       OR pg_catalog.has_function_privilege('authenticated', 'public.protect_tenant_owner_id()', 'EXECUTE')
       OR pg_catalog.has_function_privilege('service_role', 'public.protect_tenant_owner_id()', 'EXECUTE')
       OR pg_catalog.has_function_privilege('anon', 'public.onboard_tenant(text,text)', 'EXECUTE')
       OR pg_catalog.has_function_privilege('authenticated', 'public.onboard_tenant(text,text)', 'EXECUTE')
       OR NOT pg_catalog.has_function_privilege('authenticated', 'public.resolve_auth_onboarding()', 'EXECUTE')
       OR NOT pg_catalog.has_function_privilege('authenticated', 'public.complete_auth_onboarding(text,text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Phase 31 RPC grants are broader than authenticated';
    END IF;
END;
$$;

INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
VALUES
    ('31000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-owner@example.invalid', '{"shop_name":"Phase 31 Owner","shop_slug":"phase31-owner"}'),
    ('31000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-new@example.invalid', '{"shop_name":"Phase 31 New","shop_slug":"phase31-new"}'),
    ('31000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-other@example.invalid', '{"shop_name":"Phase 31 Other","shop_slug":"phase31-other"}'),
    ('31000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-slug-probe@example.invalid', '{"shop_name":"Phase 31 Slug Probe","shop_slug":"phase31-slug-probe"}');

-- The production signup trigger may create legacy owner_id tenants. Keep the
-- first user's row to exercise recovery and clear the other two for onboarding.
DELETE FROM public.tenant_users
 WHERE user_id IN (
     '31000000-0000-0000-0000-000000000002',
     '31000000-0000-0000-0000-000000000003',
     '31000000-0000-0000-0000-000000000004'
 );
DELETE FROM public.tenants
 WHERE owner_id IN (
     '31000000-0000-0000-0000-000000000002',
     '31000000-0000-0000-0000-000000000003',
     '31000000-0000-0000-0000-000000000004'
 );

INSERT INTO public.tenants (id, name, domain, owner_id)
VALUES (
    '31100000-0000-0000-0000-000000000003',
    'Phase 31 Other',
    'phase31-occupied',
    '31000000-0000-0000-0000-000000000003'
);
INSERT INTO public.tenant_users (user_id, tenant_id, role)
VALUES (
    '31000000-0000-0000-0000-000000000003',
    '31100000-0000-0000-0000-000000000003',
    'admin'
);

-- Confirmed session: recover the trigger-created owner tenant and create one
-- tenant_users row. Calling twice must be idempotent.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
);
SELECT public.resolve_auth_onboarding();
SELECT public.resolve_auth_onboarding();
RESET ROLE;

DO $$
BEGIN
    IF (SELECT pg_catalog.count(*) FROM public.tenant_users
         WHERE user_id = '31000000-0000-0000-0000-000000000001') <> 1 THEN
        RAISE EXCEPTION 'Legacy owner tenant was not reconciled idempotently';
    END IF;
END;
$$;

-- User without a tenant needs onboarding, and repeated completion returns the
-- same tenant rather than creating a duplicate.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}',
    true
);
DO $$
DECLARE
    v_first jsonb;
    v_second jsonb;
BEGIN
    IF public.resolve_auth_onboarding()->>'status' <> 'needs_onboarding' THEN
        RAISE EXCEPTION 'Tenant-less user did not require onboarding';
    END IF;

    v_first := public.complete_auth_onboarding('Phase 31 New', 'phase31-new');
    v_second := public.complete_auth_onboarding('Ignored Retry Name', 'ignored-retry-slug');

    IF v_first->>'status' <> 'ready'
       OR v_first->>'tenant_id' IS DISTINCT FROM v_second->>'tenant_id' THEN
        RAISE EXCEPTION 'Onboarding retry was not idempotent';
    END IF;
END;
$$;

SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"31000000-0000-0000-0000-000000000004","role":"authenticated"}',
    true
);

DO $$
BEGIN
    PERFORM public.complete_auth_onboarding('Cross Tenant', 'phase31-occupied');
    RAISE EXCEPTION 'Foreign occupied slug unexpectedly succeeded';
EXCEPTION
    WHEN unique_violation THEN
        IF SQLERRM NOT LIKE '%SLUG_TAKEN%' THEN RAISE; END IF;
END;
$$;
RESET ROLE;

DO $$
BEGIN
    IF (SELECT pg_catalog.count(*) FROM public.tenant_users
         WHERE user_id = '31000000-0000-0000-0000-000000000002') <> 1 THEN
        RAISE EXCEPTION 'Onboarding created duplicate memberships';
    END IF;
    IF EXISTS (
        SELECT 1
          FROM public.tenant_users
         WHERE user_id = '31000000-0000-0000-0000-000000000002'
           AND tenant_id = '31100000-0000-0000-0000-000000000003'
    ) THEN
        RAISE EXCEPTION 'User was associated to another tenant by slug';
    END IF;
END;
$$;

-- A tenant member cannot rewrite owner_id and turn it into an onboarding
-- recovery authority for another account. Either RLS/grants or the Phase 31
-- trigger may reject the statement; the invariant must remain unchanged.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}',
    true
);
DO $$
DECLARE
    v_tenant_id uuid;
BEGIN
    SELECT tenant_id INTO v_tenant_id
      FROM public.tenant_users
     WHERE user_id = '31000000-0000-0000-0000-000000000002';

    BEGIN
        UPDATE public.tenants
           SET owner_id = '31000000-0000-0000-0000-000000000004'
         WHERE id = v_tenant_id;
    EXCEPTION
        WHEN insufficient_privilege OR raise_exception THEN
            NULL;
    END;
END;
$$;
RESET ROLE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM public.tenants AS t
          JOIN public.tenant_users AS tu ON tu.tenant_id = t.id
         WHERE tu.user_id = '31000000-0000-0000-0000-000000000002'
           AND t.owner_id = '31000000-0000-0000-0000-000000000004'
    ) THEN
        RAISE EXCEPTION 'A client role changed the tenant ownership authority';
    END IF;
END;
$$;

ROLLBACK;
