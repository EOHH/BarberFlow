-- Local-only synthetic setup for the two-session Phase 30E.2B test.
-- Never run against production. This setup commits so both sessions can see it.
\set ON_ERROR_STOP on

BEGIN;

INSERT INTO auth.users (id, instance_id, aud, role, email)
VALUES (
    '30e2c000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'phase30e2b-concurrency@example.invalid'
);

INSERT INTO public.tenants (id, name, domain)
VALUES (
    '30e2c100-0000-4000-8000-000000000001',
    'Phase 30E.2B Concurrency',
    'phase30e2b-concurrency'
);

INSERT INTO public.tenant_users (user_id, tenant_id, role)
VALUES (
    '30e2c000-0000-4000-8000-000000000001',
    '30e2c100-0000-4000-8000-000000000001',
    'admin'
);

INSERT INTO public.barbers (id, tenant_id, name, is_active)
VALUES (
    '30e2c200-0000-4000-8000-000000000001',
    '30e2c100-0000-4000-8000-000000000001',
    'Concurrency Barber',
    true
);

INSERT INTO public.services (
    id, tenant_id, name, duration_minutes, price, is_active
)
VALUES (
    '30e2c300-0000-4000-8000-000000000001',
    '30e2c100-0000-4000-8000-000000000001',
    'Concurrency Service',
    30,
    30,
    true
);

INSERT INTO public.appointments (
    id, tenant_id, service_id, barber_id, date, time,
    client_name, phone, status
)
VALUES (
    '30e2c500-0000-4000-8000-000000000001',
    '30e2c100-0000-4000-8000-000000000001',
    '30e2c300-0000-4000-8000-000000000001',
    '30e2c200-0000-4000-8000-000000000001',
    date '2099-03-01',
    time '10:00',
    'Concurrency Client',
    '+51000003001',
    'confirmed'
);

COMMIT;
