-- Disposable local PostgreSQL/Supabase database only.
\set ON_ERROR_STOP on

DROP SCHEMA IF EXISTS phase31_test CASCADE;
CREATE SCHEMA phase31_test;

CREATE TABLE phase31_test.barrier (
    scenario text NOT NULL,
    worker text NOT NULL,
    PRIMARY KEY (scenario, worker)
);

CREATE TABLE phase31_test.results (
    scenario text NOT NULL,
    worker text NOT NULL,
    outcome text NOT NULL,
    tenant_id uuid,
    detail text,
    PRIMARY KEY (scenario, worker)
);

GRANT USAGE ON SCHEMA phase31_test TO authenticated;
GRANT SELECT, INSERT ON phase31_test.barrier TO authenticated;
GRANT INSERT ON phase31_test.results TO authenticated;

CREATE FUNCTION phase31_test.wait_for_peer(p_scenario text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_deadline timestamptz := pg_catalog.clock_timestamp() + interval '10 seconds';
BEGIN
    LOOP
        EXIT WHEN (
            SELECT pg_catalog.count(*)
              FROM phase31_test.barrier
             WHERE scenario = p_scenario
        ) = 2;

        IF pg_catalog.clock_timestamp() >= v_deadline THEN
            RAISE EXCEPTION 'Timed out waiting for the second concurrent worker';
        END IF;
        PERFORM pg_catalog.pg_sleep(0.05);
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION phase31_test.wait_for_peer(text) TO authenticated;

CREATE FUNCTION phase31_test.exercise(
    p_scenario text,
    p_worker text,
    p_shop_name text,
    p_slug text,
    p_hold_seconds double precision
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_resolution jsonb;
    v_outcome text := 'success';
    v_detail text;
BEGIN
    BEGIN
        IF p_scenario = 'resolve' THEN
            v_resolution := public.resolve_auth_onboarding();
        ELSIF p_scenario IN ('complete', 'slug_conflict') THEN
            v_resolution := public.complete_auth_onboarding(p_shop_name, p_slug);
        ELSE
            RAISE EXCEPTION 'Unknown Phase 31 concurrency scenario.';
        END IF;

        IF p_hold_seconds > 0 THEN
            PERFORM pg_catalog.pg_sleep(p_hold_seconds);
        END IF;
    EXCEPTION
        WHEN unique_violation THEN
            v_outcome := 'slug_taken';
            v_detail := SQLERRM;
        WHEN OTHERS THEN
            v_outcome := 'unexpected_error';
            v_detail := SQLSTATE || ': ' || SQLERRM;
    END;

    INSERT INTO phase31_test.results (scenario, worker, outcome, tenant_id, detail)
    VALUES (
        p_scenario,
        p_worker,
        v_outcome,
        (v_resolution->>'tenant_id')::uuid,
        v_detail
    );
END;
$$;

GRANT EXECUTE ON FUNCTION phase31_test.exercise(text, text, text, text, double precision)
TO authenticated;

DELETE FROM public.tenant_users
 WHERE user_id BETWEEN
       '31000000-0000-0000-0000-000000000011'::uuid AND
       '31000000-0000-0000-0000-000000000014'::uuid;
DELETE FROM public.tenants
 WHERE owner_id BETWEEN
       '31000000-0000-0000-0000-000000000011'::uuid AND
       '31000000-0000-0000-0000-000000000014'::uuid;
DELETE FROM auth.users
 WHERE id BETWEEN
       '31000000-0000-0000-0000-000000000011'::uuid AND
       '31000000-0000-0000-0000-000000000014'::uuid;

INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
VALUES
    ('31000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-concurrent-resolve@example.invalid', '{"shop_name":"Concurrent Resolve","shop_slug":"phase31-concurrent-resolve"}'),
    ('31000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-concurrent-complete@example.invalid', '{"shop_name":"Concurrent Complete","shop_slug":"phase31-concurrent-complete"}'),
    ('31000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-concurrent-slug-a@example.invalid', '{"shop_name":"Concurrent Slug A","shop_slug":"phase31-concurrent-slug-a"}'),
    ('31000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase31-concurrent-slug-b@example.invalid', '{"shop_name":"Concurrent Slug B","shop_slug":"phase31-concurrent-slug-b"}');

-- Keep user 11's trigger-created tenant for the resolver race. Users 12-14
-- intentionally start without a tenant so complete_auth_onboarding is tested.
DELETE FROM public.tenant_users
 WHERE user_id BETWEEN
       '31000000-0000-0000-0000-000000000011'::uuid AND
       '31000000-0000-0000-0000-000000000014'::uuid;
DELETE FROM public.tenants
 WHERE owner_id BETWEEN
       '31000000-0000-0000-0000-000000000012'::uuid AND
       '31000000-0000-0000-0000-000000000014'::uuid;

DO $$
BEGIN
    IF (SELECT pg_catalog.count(*) FROM public.tenants
         WHERE owner_id = '31000000-0000-0000-0000-000000000011') <> 1 THEN
        RAISE EXCEPTION 'handle_new_user did not create exactly one resolver fixture tenant';
    END IF;
END;
$$;
