\set ON_ERROR_STOP on

INSERT INTO phase31_test.barrier (scenario, worker)
VALUES (:'scenario', :'worker');

SELECT phase31_test.wait_for_peer(:'scenario');

BEGIN;
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', :'user_id', 'role', 'authenticated')::text,
    true
);
SELECT pg_catalog.pg_sleep(:'pre_delay_seconds'::double precision);
SELECT phase31_test.exercise(
    :'scenario',
    :'worker',
    :'shop_name',
    :'slug',
    :'hold_seconds'::double precision
);
COMMIT;
