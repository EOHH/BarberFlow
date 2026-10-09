-- Start Session A first. Keep the transaction open for Session B.
\set ON_ERROR_STOP on
BEGIN;
SELECT public.create_booking(
    'phase30-concurrency',
    '30300000-0000-0000-0000-000000000010',
    '30200000-0000-0000-0000-000000000010',
    date '2099-01-05', time '15:00', 'Concurrency A', '+51000000010'
);
SELECT pg_catalog.pg_sleep(10);
COMMIT;
