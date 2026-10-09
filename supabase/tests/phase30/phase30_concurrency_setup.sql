-- Run only on a disposable isolated local database after Phase 30 is applied.
\set ON_ERROR_STOP on

DELETE FROM public.appointments
 WHERE tenant_id = '30100000-0000-0000-0000-000000000010';
DELETE FROM public.availability
 WHERE tenant_id = '30100000-0000-0000-0000-000000000010';
DELETE FROM public.services
 WHERE tenant_id = '30100000-0000-0000-0000-000000000010';
DELETE FROM public.barbers
 WHERE tenant_id = '30100000-0000-0000-0000-000000000010';
DELETE FROM public.tenants
 WHERE id = '30100000-0000-0000-0000-000000000010';

INSERT INTO public.tenants (id, name, domain, booking_confirmation_mode)
VALUES (
    '30100000-0000-0000-0000-000000000010',
    'Phase 30 Concurrency',
    'phase30-concurrency',
    'automatic'
);

INSERT INTO public.barbers (id, tenant_id, name, is_active)
VALUES (
    '30200000-0000-0000-0000-000000000010',
    '30100000-0000-0000-0000-000000000010',
    'Concurrency Barber',
    true
);

INSERT INTO public.services (
    id, tenant_id, name, duration_minutes, price, is_active
)
VALUES (
    '30300000-0000-0000-0000-000000000010',
    '30100000-0000-0000-0000-000000000010',
    'Concurrency Service',
    30,
    30,
    true
);

INSERT INTO public.availability (
    tenant_id, barber_id, day_of_week, start_time, end_time, is_active
)
VALUES (
    '30100000-0000-0000-0000-000000000010',
    '30200000-0000-0000-0000-000000000010',
    extract(dow FROM date '2099-01-05'),
    time '09:00',
    time '17:00',
    true
);
