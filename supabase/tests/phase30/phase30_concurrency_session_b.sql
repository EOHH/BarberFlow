-- Start Session B while Session A is sleeping. It must wait and then fail with
-- the Phase 29 availability error; it must never create a second appointment.
\set ON_ERROR_STOP off
SELECT public.create_booking(
    'phase30-concurrency',
    '30300000-0000-0000-0000-000000000010',
    '30200000-0000-0000-0000-000000000010',
    date '2099-01-05', time '15:00', 'Concurrency B', '+51000000011'
);
