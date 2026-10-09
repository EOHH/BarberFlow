-- Phase 30 local-only integration tests. Synthetic data only.
-- Requires the verified baseline documented in README.md.
\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE phase30_results (
    test_name text PRIMARY KEY,
    payload jsonb
) ON COMMIT DROP;
GRANT SELECT, INSERT, UPDATE ON phase30_results TO anon, authenticated;

-- Phase 30D capability must insert without any SELECT privilege or
-- INSERT ... RETURNING dependency under appointments RLS.
DO $$
DECLARE
    v_helper_definition text := pg_catalog.pg_get_functiondef(
        'public.insert_public_booking_appointment(uuid,uuid,uuid,date,time without time zone,text,text,text,text,numeric,integer)'::regprocedure
    );
BEGIN
    IF NOT pg_catalog.has_table_privilege(
        'barberflow_booking_writer', 'public.appointments', 'INSERT'
    ) THEN
        RAISE EXCEPTION 'Phase 30D writer lacks INSERT on appointments';
    END IF;
    IF pg_catalog.has_table_privilege(
        'barberflow_booking_writer', 'public.appointments', 'SELECT'
    ) OR pg_catalog.has_column_privilege(
        'barberflow_booking_writer', 'public.appointments', 'id', 'SELECT'
    ) THEN
        RAISE EXCEPTION 'Phase 30D writer unexpectedly has SELECT on appointments';
    END IF;
    IF v_helper_definition ILIKE '%RETURNING id%' THEN
        RAISE EXCEPTION 'Phase 30D helper still depends on INSERT RETURNING';
    END IF;
    IF v_helper_definition NOT ILIKE '%pg_catalog.gen_random_uuid()%'
       OR v_helper_definition NOT ILIKE '%INSERT INTO public.appointments (%id,%' THEN
        RAISE EXCEPTION 'Phase 30D helper does not explicitly insert its generated UUID';
    END IF;
END;
$$;

INSERT INTO auth.users (id, instance_id, aud, role, email)
VALUES
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30-admin-a@example.invalid'),
    ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30-staff-a@example.invalid'),
    ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30-admin-b@example.invalid'),
    ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30-no-tenant@example.invalid');

INSERT INTO public.tenants (id, name, domain, booking_confirmation_mode)
VALUES
    ('30100000-0000-0000-0000-000000000001', 'Phase 30 Automatic', 'phase30-auto', 'automatic'),
    ('30100000-0000-0000-0000-000000000002', 'Phase 30 Manual', 'phase30-manual', 'manual');

INSERT INTO public.tenant_users (user_id, tenant_id, role)
VALUES
    ('30000000-0000-0000-0000-000000000001', '30100000-0000-0000-0000-000000000001', 'admin'),
    ('30000000-0000-0000-0000-000000000002', '30100000-0000-0000-0000-000000000001', 'staff'),
    ('30000000-0000-0000-0000-000000000003', '30100000-0000-0000-0000-000000000002', 'admin');

INSERT INTO public.barbers (id, tenant_id, name, is_active)
VALUES
    ('30200000-0000-0000-0000-000000000001', '30100000-0000-0000-0000-000000000001', 'Synthetic Barber A', true),
    ('30200000-0000-0000-0000-000000000002', '30100000-0000-0000-0000-000000000002', 'Synthetic Barber B', true);

INSERT INTO public.services (id, tenant_id, name, duration_minutes, price, is_active)
VALUES
    ('30300000-0000-0000-0000-000000000001', '30100000-0000-0000-0000-000000000001', 'Synthetic Service A', 30, 30, true),
    ('30300000-0000-0000-0000-000000000002', '30100000-0000-0000-0000-000000000002', 'Synthetic Service B', 45, 40, true);

INSERT INTO public.availability (
    tenant_id, barber_id, day_of_week, start_time, end_time, is_active
)
VALUES
    ('30100000-0000-0000-0000-000000000001', '30200000-0000-0000-0000-000000000001', extract(dow FROM date '2099-01-05'), time '09:00', time '17:00', true),
    ('30100000-0000-0000-0000-000000000002', '30200000-0000-0000-0000-000000000002', extract(dow FROM date '2099-01-05'), time '09:00', time '17:00', true);

-- Automatic and manual public bookings.
SET LOCAL ROLE anon;
INSERT INTO phase30_results(test_name, payload)
SELECT 'automatic_booking', public.create_booking(
    'phase30-auto',
    '30300000-0000-0000-0000-000000000001',
    '30200000-0000-0000-0000-000000000001',
    date '2099-01-05', time '10:00', 'Synthetic Client A', '+51000000001'
);
INSERT INTO phase30_results(test_name, payload)
SELECT 'manual_booking', public.create_booking(
    'phase30-manual',
    '30300000-0000-0000-0000-000000000002',
    '30200000-0000-0000-0000-000000000002',
    date '2099-01-05', time '11:00', 'Synthetic Client B', '+51000000002'
);
RESET ROLE;

DO $$
DECLARE
    v_auto jsonb;
    v_manual jsonb;
BEGIN
    SELECT payload INTO v_auto FROM phase30_results WHERE test_name = 'automatic_booking';
    SELECT payload INTO v_manual FROM phase30_results WHERE test_name = 'manual_booking';
    IF v_auto->>'status' <> 'confirmed' THEN
        RAISE EXCEPTION 'automatic booking was not confirmed: %', v_auto;
    END IF;
    IF v_manual->>'status' <> 'pending' THEN
        RAISE EXCEPTION 'manual booking was not pending: %', v_manual;
    END IF;
END;
$$;

-- Admin A may update only the mode derived from its own membership.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
);
SELECT public.update_booking_confirmation_mode('manual');
RESET ROLE;

DO $$
BEGIN
    IF (SELECT booking_confirmation_mode FROM public.tenants WHERE id = '30100000-0000-0000-0000-000000000001') <> 'manual' THEN
        RAISE EXCEPTION 'admin A did not update tenant A';
    END IF;
    IF (SELECT booking_confirmation_mode FROM public.tenants WHERE id = '30100000-0000-0000-0000-000000000002') <> 'manual' THEN
        RAISE EXCEPTION 'admin A changed tenant B';
    END IF;
END;
$$;

-- Staff and authenticated users without a tenant must be rejected.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}',
    true
);
DO $$
BEGIN
    PERFORM public.update_booking_confirmation_mode('automatic');
    RAISE EXCEPTION 'staff update unexpectedly succeeded';
EXCEPTION
    WHEN insufficient_privilege THEN NULL;
END;
$$;

SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}',
    true
);
DO $$
BEGIN
    PERFORM public.update_booking_confirmation_mode('automatic');
    RAISE EXCEPTION 'user without tenant unexpectedly succeeded';
EXCEPTION
    WHEN insufficient_privilege THEN NULL;
END;
$$;
RESET ROLE;

-- anon and service_role must not have EXECUTE on the administrative RPC.
DO $$
BEGIN
    IF pg_catalog.has_function_privilege('anon', 'public.update_booking_confirmation_mode(text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon can execute update_booking_confirmation_mode';
    END IF;
    IF pg_catalog.has_function_privilege('service_role', 'public.update_booking_confirmation_mode(text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'service_role can execute update_booking_confirmation_mode';
    END IF;
END;
$$;

SET LOCAL ROLE anon;
DO $$
BEGIN
    PERFORM public.update_booking_confirmation_mode('automatic');
    RAISE EXCEPTION 'anon update unexpectedly succeeded';
EXCEPTION
    WHEN insufficient_privilege THEN NULL;
END;
$$;
RESET ROLE;

-- Snapshot values must remain unchanged after the live service changes.
UPDATE public.services
   SET name = 'Changed Service A', price = 99, duration_minutes = 90
 WHERE id = '30300000-0000-0000-0000-000000000001';

DO $$
DECLARE
    v_id uuid;
BEGIN
    SELECT (payload->>'id')::uuid INTO v_id
      FROM phase30_results WHERE test_name = 'automatic_booking';
    IF NOT EXISTS (
        SELECT 1 FROM public.appointments
         WHERE id = v_id
           AND tenant_id = '30100000-0000-0000-0000-000000000001'
           AND status = 'confirmed'
           AND service_name_snapshot = 'Synthetic Service A'
           AND price_snapshot = 30
           AND duration_minutes_snapshot = 30
    ) THEN
        RAISE EXCEPTION 'automatic booking snapshot integrity failed';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.appointments
         WHERE id = (SELECT (payload->>'id')::uuid FROM phase30_results WHERE test_name = 'manual_booking')
           AND tenant_id = '30100000-0000-0000-0000-000000000002'
           AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'manual booking tenant isolation failed';
    END IF;
END;
$$;

-- Both confirmed and pending appointments must block their occupied slots.
DO $$
BEGIN
    IF public.get_available_slots(
        'phase30-auto', '30300000-0000-0000-0000-000000000001',
        '30200000-0000-0000-0000-000000000001', date '2099-01-05'
    ) ? '10:00:00' THEN
        RAISE EXCEPTION 'confirmed appointment did not block availability';
    END IF;
    IF public.get_available_slots(
        'phase30-manual', '30300000-0000-0000-0000-000000000002',
        '30200000-0000-0000-0000-000000000002', date '2099-01-05'
    ) ? '11:00:00' THEN
        RAISE EXCEPTION 'pending appointment did not block availability';
    END IF;
END;
$$;

-- Lifecycle compatibility using synthetic past appointments.
INSERT INTO public.appointments (
    id, tenant_id, service_id, barber_id, date, time, client_name, phone, status
) VALUES
    ('30400000-0000-0000-0000-000000000001', '30100000-0000-0000-0000-000000000001', '30300000-0000-0000-0000-000000000001', '30200000-0000-0000-0000-000000000001', current_date - 1, time '08:00', 'Lifecycle Confirmed', '+51000000003', 'confirmed'),
    ('30400000-0000-0000-0000-000000000002', '30100000-0000-0000-0000-000000000001', '30300000-0000-0000-0000-000000000001', '30200000-0000-0000-0000-000000000001', current_date - 1, time '09:00', 'Lifecycle Pending', '+51000000004', 'pending');

SELECT public.process_appointment_transitions();

DO $$
BEGIN
    IF (SELECT status FROM public.appointments WHERE id = '30400000-0000-0000-0000-000000000001') <> 'completed' THEN
        RAISE EXCEPTION 'confirmed lifecycle compatibility failed';
    END IF;
    IF (SELECT status FROM public.appointments WHERE id = '30400000-0000-0000-0000-000000000002') <> 'expired' THEN
        RAISE EXCEPTION 'pending lifecycle compatibility failed';
    END IF;
END;
$$;

-- Phase 30D: authenticated user booking in their own tenant.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}',
    true
);
INSERT INTO phase30_results(test_name, payload)
SELECT 'authenticated_same_tenant', public.create_booking(
    'phase30-manual',
    '30300000-0000-0000-0000-000000000002',
    '30200000-0000-0000-0000-000000000002',
    date '2099-01-05', time '13:00', 'Same Tenant Probe', '+51000000005'
);
RESET ROLE;

-- Phase 30D: authenticated Tenant A user booking through Tenant B's public RPC.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
);
INSERT INTO phase30_results(test_name, payload)
SELECT 'authenticated_cross_tenant', public.create_booking(
    'phase30-manual',
    '30300000-0000-0000-0000-000000000002',
    '30200000-0000-0000-0000-000000000002',
    date '2099-01-05', time '14:00', 'Cross Tenant Probe', '+51000000006'
);
RESET ROLE;

-- Phase 30D: authenticated user without membership booking publicly.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated"}',
    true
);
INSERT INTO phase30_results(test_name, payload)
SELECT 'authenticated_without_tenant', public.create_booking(
    'phase30-manual',
    '30300000-0000-0000-0000-000000000002',
    '30200000-0000-0000-0000-000000000002',
    date '2099-01-05', time '15:00', 'No Tenant Probe', '+51000000007'
);
RESET ROLE;

DO $$
DECLARE
    v_test_name text;
    v_payload jsonb;
BEGIN
    FOREACH v_test_name IN ARRAY ARRAY[
        'authenticated_same_tenant',
        'authenticated_cross_tenant',
        'authenticated_without_tenant'
    ] LOOP
        SELECT payload INTO v_payload
          FROM phase30_results
         WHERE test_name = v_test_name;

        IF v_payload->>'status' <> 'pending' THEN
            RAISE EXCEPTION '% returned an unexpected status: %', v_test_name, v_payload;
        END IF;
        IF NOT EXISTS (
            SELECT 1
              FROM public.appointments
             WHERE id = (v_payload->>'id')::uuid
               AND tenant_id = '30100000-0000-0000-0000-000000000002'
        ) THEN
            RAISE EXCEPTION '% did not preserve the slug-authoritative tenant', v_test_name;
        END IF;
    END LOOP;
END;
$$;

-- Direct authenticated INSERT behavior remains tenant-derived rather than
-- trusting the supplied tenant_id.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
);
INSERT INTO public.appointments (
    id, tenant_id, service_id, barber_id, date, time, client_name, phone, status
) VALUES (
    '30400000-0000-0000-0000-000000000003',
    '30100000-0000-0000-0000-000000000002',
    '30300000-0000-0000-0000-000000000001',
    '30200000-0000-0000-0000-000000000001',
    date '2099-01-05', time '16:00', 'Direct Insert Probe', '+51000000008', 'pending'
);
RESET ROLE;

DO $$
BEGIN
    IF (SELECT tenant_id FROM public.appointments WHERE id = '30400000-0000-0000-0000-000000000003')
       <> '30100000-0000-0000-0000-000000000001'::uuid THEN
        RAISE EXCEPTION 'direct authenticated INSERT did not enforce the authenticated tenant';
    END IF;
END;
$$;

TABLE phase30_results;
ROLLBACK;
