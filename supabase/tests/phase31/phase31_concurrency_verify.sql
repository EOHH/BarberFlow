\set ON_ERROR_STOP on

DO $$
DECLARE
    v_resolve_tenant uuid;
    v_complete_tenant uuid;
    v_slug_winner uuid;
BEGIN
    IF (SELECT pg_catalog.count(*) FROM phase31_test.results
         WHERE scenario = 'resolve' AND outcome = 'success') <> 2 THEN
        RAISE EXCEPTION 'Concurrent resolver calls did not both succeed';
    END IF;

    SELECT tenant_id INTO v_resolve_tenant
      FROM phase31_test.results
     WHERE scenario = 'resolve'
     LIMIT 1;

    IF v_resolve_tenant IS NULL
       OR EXISTS (
           SELECT 1 FROM phase31_test.results
            WHERE scenario = 'resolve'
              AND tenant_id IS DISTINCT FROM v_resolve_tenant
       )
       OR (SELECT pg_catalog.count(*) FROM public.tenants
            WHERE owner_id = '31000000-0000-0000-0000-000000000011') <> 1
       OR (SELECT pg_catalog.count(*) FROM public.tenant_users
            WHERE user_id = '31000000-0000-0000-0000-000000000011'
              AND tenant_id = v_resolve_tenant) <> 1 THEN
        RAISE EXCEPTION 'Resolver race violated tenant or membership idempotency';
    END IF;

    IF (SELECT pg_catalog.count(*) FROM phase31_test.results
         WHERE scenario = 'complete' AND outcome = 'success') <> 2 THEN
        RAISE EXCEPTION 'Concurrent completion calls did not both succeed';
    END IF;

    SELECT tenant_id INTO v_complete_tenant
      FROM phase31_test.results
     WHERE scenario = 'complete'
     LIMIT 1;

    IF v_complete_tenant IS NULL
       OR EXISTS (
           SELECT 1 FROM phase31_test.results
            WHERE scenario = 'complete'
              AND tenant_id IS DISTINCT FROM v_complete_tenant
       )
       OR (SELECT pg_catalog.count(*) FROM public.tenants
            WHERE owner_id = '31000000-0000-0000-0000-000000000012') <> 1
       OR (SELECT pg_catalog.count(*) FROM public.tenant_users
            WHERE user_id = '31000000-0000-0000-0000-000000000012'
              AND tenant_id = v_complete_tenant) <> 1 THEN
        RAISE EXCEPTION 'Completion race created duplicate or inconsistent data';
    END IF;

    IF (SELECT pg_catalog.count(*) FROM phase31_test.results
         WHERE scenario = 'slug_conflict' AND outcome = 'success') <> 1
       OR (SELECT pg_catalog.count(*) FROM phase31_test.results
            WHERE scenario = 'slug_conflict' AND outcome = 'slug_taken') <> 1 THEN
        RAISE EXCEPTION 'Concurrent slug conflict did not produce one winner and one rejection';
    END IF;

    SELECT tenant_id INTO v_slug_winner
      FROM phase31_test.results
     WHERE scenario = 'slug_conflict'
       AND outcome = 'success';

    IF (SELECT pg_catalog.count(*) FROM public.tenants
         WHERE domain = 'phase31-concurrent-shared') <> 1
       OR (SELECT pg_catalog.count(*) FROM public.tenant_users
            WHERE tenant_id = v_slug_winner) <> 1
       OR EXISTS (
           SELECT 1
             FROM public.tenants AS t
             JOIN public.tenant_users AS tu ON tu.tenant_id = t.id
            WHERE t.id = v_slug_winner
              AND t.owner_id IS DISTINCT FROM tu.user_id
       ) THEN
        RAISE EXCEPTION 'Slug loser acquired or shared the winning tenant';
    END IF;
END;
$$;

TABLE phase31_test.results;
