-- Start session B while this transaction is sleeping.
\set ON_ERROR_STOP on

BEGIN;
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30e2c000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
);

SELECT public.save_client_private_notes(
    NULL,
    '+51000003001',
    'Concurrent notes A'
) AS session_a_result;

SELECT pg_catalog.pg_sleep(5);
COMMIT;
