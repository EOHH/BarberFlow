-- Phase 31: reconcile the legacy owner_id signup trigger with tenant_users
-- and expose one idempotent, authenticated onboarding path.

BEGIN;

DO $$
DECLARE
    v_tenant_user_attnum smallint;
    v_domain_attnum smallint;
BEGIN
    IF current_user <> 'postgres' THEN
        RAISE EXCEPTION 'Phase 31 aborted: migration must run as postgres.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'tenants'
           AND column_name = 'owner_id'
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'tenants'
           AND column_name = 'domain'
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'tenant_users'
           AND column_name IN ('user_id', 'tenant_id', 'role')
         GROUP BY table_schema, table_name
        HAVING pg_catalog.count(*) = 3
    ) THEN
        RAISE EXCEPTION 'Phase 31 aborted: required tenant ownership columns are missing.';
    END IF;

    IF pg_catalog.to_regprocedure('public.resolve_auth_onboarding()') IS NOT NULL
       OR pg_catalog.to_regprocedure('public.complete_auth_onboarding(text,text)') IS NOT NULL
       OR pg_catalog.to_regprocedure('public.protect_tenant_owner_id()') IS NOT NULL
       OR EXISTS (
           SELECT 1
             FROM pg_catalog.pg_trigger
            WHERE tgrelid = 'public.tenants'::regclass
              AND tgname = 'trg_tenants_protect_owner_id'
              AND NOT tgisinternal
       ) THEN
        RAISE EXCEPTION 'Phase 31 aborted: one or more Phase 31 objects already exist.';
    END IF;

    IF pg_catalog.to_regprocedure('public.onboard_tenant(text,text)') IS NULL THEN
        RAISE EXCEPTION 'Phase 31 aborted: legacy onboard_tenant(text,text) is missing.';
    END IF;

    SELECT attnum INTO v_tenant_user_attnum
      FROM pg_catalog.pg_attribute
     WHERE attrelid = 'public.tenant_users'::regclass
       AND attname = 'user_id'
       AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_constraint AS c
         WHERE c.conrelid = 'public.tenant_users'::regclass
           AND c.contype = 'u'
           AND c.conkey = ARRAY[v_tenant_user_attnum]::smallint[]
    ) THEN
        RAISE EXCEPTION 'Phase 31 aborted: tenant_users.user_id must be unique.';
    END IF;

    SELECT attnum INTO v_domain_attnum
      FROM pg_catalog.pg_attribute
     WHERE attrelid = 'public.tenants'::regclass
       AND attname = 'domain'
       AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_index AS i
         WHERE i.indrelid = 'public.tenants'::regclass
           AND i.indisunique
           AND i.indpred IS NULL
           AND i.indexprs IS NULL
           AND i.indnkeyatts = 1
           AND i.indkey[0] = v_domain_attnum
    ) THEN
        RAISE EXCEPTION 'Phase 31 aborted: tenants.domain must have a non-partial single-column unique index.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.tenants AS t
         WHERE t.owner_id IS NOT NULL
         GROUP BY t.owner_id
        HAVING pg_catalog.count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Phase 31 aborted: an owner_id is assigned to multiple tenants.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.tenants AS t
          JOIN public.tenant_users AS tu ON tu.user_id = t.owner_id
         WHERE t.owner_id IS NOT NULL
           AND tu.tenant_id <> t.id
    ) OR EXISTS (
        SELECT 1
          FROM public.tenants AS t
          JOIN public.tenant_users AS member ON member.tenant_id = t.id
         WHERE t.owner_id IS NOT NULL
           AND member.user_id <> t.owner_id
           AND NOT EXISTS (
               SELECT 1
                 FROM public.tenant_users AS owner_membership
                WHERE owner_membership.user_id = t.owner_id
                  AND owner_membership.tenant_id = t.id
           )
    ) THEN
        RAISE EXCEPTION 'Phase 31 aborted: tenant ownership and membership data are inconsistent.';
    END IF;
END;
$$;

-- owner_id is the recovery authority for legacy tenants created by
-- handle_new_user(). Prevent client roles from rewriting that authority.
CREATE FUNCTION public.protect_tenant_owner_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
       AND current_user <> 'postgres' THEN
        RAISE EXCEPTION 'Tenant ownership cannot be changed by client roles.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.protect_tenant_owner_id() OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.protect_tenant_owner_id()
FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER trg_tenants_protect_owner_id
BEFORE UPDATE OF owner_id ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.protect_tenant_owner_id();

CREATE FUNCTION public.resolve_auth_onboarding()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_tenant_id uuid;
    v_tenant_name text;
    v_slug text;
    v_owned_count integer;
BEGIN
    IF v_user_id IS NULL OR auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended('barberflow:onboarding:' || v_user_id::text, 0)
    );

    SELECT t.id, t.name, t.domain
      INTO v_tenant_id, v_tenant_name, v_slug
      FROM public.tenant_users AS tu
      JOIN public.tenants AS t ON t.id = tu.tenant_id
     WHERE tu.user_id = v_user_id;

    IF v_tenant_id IS NOT NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'status', 'ready',
            'tenant_id', v_tenant_id,
            'tenant_name', v_tenant_name,
            'slug', v_slug
        );
    END IF;

    SELECT pg_catalog.count(*)::integer
      INTO v_owned_count
      FROM public.tenants AS t
     WHERE t.owner_id = v_user_id;

    IF v_owned_count > 1 THEN
        RAISE EXCEPTION 'ONBOARDING_AMBIGUOUS: multiple owned tenants require review.'
            USING ERRCODE = 'P0001';
    END IF;

    IF v_owned_count = 1 THEN
        SELECT t.id, t.name, t.domain
          INTO v_tenant_id, v_tenant_name, v_slug
          FROM public.tenants AS t
         WHERE t.owner_id = v_user_id;

        INSERT INTO public.tenant_users (user_id, tenant_id, role)
        VALUES (v_user_id, v_tenant_id, 'admin')
        ON CONFLICT (user_id) DO NOTHING;

        SELECT t.id, t.name, t.domain
          INTO v_tenant_id, v_tenant_name, v_slug
          FROM public.tenant_users AS tu
          JOIN public.tenants AS t ON t.id = tu.tenant_id
         WHERE tu.user_id = v_user_id;

        RETURN pg_catalog.jsonb_build_object(
            'status', 'ready',
            'tenant_id', v_tenant_id,
            'tenant_name', v_tenant_name,
            'slug', v_slug
        );
    END IF;

    RETURN pg_catalog.jsonb_build_object('status', 'needs_onboarding');
END;
$$;

ALTER FUNCTION public.resolve_auth_onboarding() OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.resolve_auth_onboarding()
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_auth_onboarding() TO authenticated;

CREATE FUNCTION public.complete_auth_onboarding(
    p_shop_name text,
    p_slug text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_shop_name text := pg_catalog.btrim(p_shop_name);
    v_slug text := pg_catalog.lower(pg_catalog.btrim(p_slug));
    v_resolution jsonb;
    v_tenant_id uuid;
BEGIN
    IF v_user_id IS NULL OR auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;
    IF v_shop_name IS NULL
       OR pg_catalog.length(v_shop_name) < 2
       OR pg_catalog.length(v_shop_name) > 120 THEN
        RAISE EXCEPTION 'El nombre de la barbería debe tener entre 2 y 120 caracteres.'
            USING ERRCODE = '22023';
    END IF;
    IF v_slug IS NULL
       OR pg_catalog.length(v_slug) < 3
       OR pg_catalog.length(v_slug) > 63
       OR v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
        RAISE EXCEPTION 'El enlace debe tener entre 3 y 63 caracteres y usar letras, números o guiones.'
            USING ERRCODE = '22023';
    END IF;

    -- This resolver takes the per-user advisory lock and repairs a legacy
    -- owner_id tenant before any new tenant can be created.
    v_resolution := public.resolve_auth_onboarding();
    IF v_resolution->>'status' = 'ready' THEN
        RETURN v_resolution;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.tenants AS t
         WHERE t.domain = v_slug
           AND t.owner_id IS DISTINCT FROM v_user_id
    ) THEN
        RAISE EXCEPTION 'SLUG_TAKEN: the public slug belongs to another tenant.'
            USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.tenants (name, domain, owner_id)
    VALUES (v_shop_name, v_slug, v_user_id)
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.tenant_users (user_id, tenant_id, role)
    VALUES (v_user_id, v_tenant_id, 'admin');

    RETURN pg_catalog.jsonb_build_object(
        'status', 'ready',
        'tenant_id', v_tenant_id,
        'tenant_name', v_shop_name,
        'slug', v_slug
    );
EXCEPTION
    WHEN unique_violation THEN
        -- A concurrent caller may have completed this same user's onboarding.
        SELECT t.id
          INTO v_tenant_id
          FROM public.tenants AS t
         WHERE t.domain = v_slug
           AND t.owner_id = v_user_id;

        IF v_tenant_id IS NULL THEN
            RAISE EXCEPTION 'SLUG_TAKEN: the public slug belongs to another tenant.'
                USING ERRCODE = '23505';
        END IF;

        INSERT INTO public.tenant_users (user_id, tenant_id, role)
        VALUES (v_user_id, v_tenant_id, 'admin')
        ON CONFLICT (user_id) DO NOTHING;

        RETURN public.resolve_auth_onboarding();
END;
$$;

ALTER FUNCTION public.complete_auth_onboarding(text, text) OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.complete_auth_onboarding(text, text)
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.complete_auth_onboarding(text, text) TO authenticated;

-- The legacy RPC creates a second tenant when handle_new_user already created
-- one without tenant_users. Leaving it callable would bypass Phase 31 locking
-- and recovery through direct requests or stale frontend clients.
REVOKE ALL PRIVILEGES ON FUNCTION public.onboard_tenant(text, text)
FROM PUBLIC, anon, authenticated;

COMMIT;
