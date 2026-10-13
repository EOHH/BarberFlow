-- Phase 30E.2B local-only integration tests. Synthetic data only.
-- Requires an isolated PostgreSQL/Supabase database with Phases 27-31 and
-- Phase 30E.2B applied. Never run this file against production.
\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE phase30e2b_results (
    test_name text PRIMARY KEY,
    payload jsonb
) ON COMMIT DROP;
GRANT SELECT, INSERT, UPDATE ON phase30e2b_results TO authenticated;

INSERT INTO auth.users (id, instance_id, aud, role, email)
VALUES
    ('30e20000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30e2b-admin-a@example.invalid'),
    ('30e20000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30e2b-staff-a@example.invalid'),
    ('30e20000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30e2b-admin-b@example.invalid'),
    ('30e20000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase30e2b-no-tenant@example.invalid');

INSERT INTO public.tenants (id, name, domain)
VALUES
    ('30e21000-0000-4000-8000-000000000001', 'Phase 30E.2B Tenant A', 'phase30e2b-a'),
    ('30e21000-0000-4000-8000-000000000002', 'Phase 30E.2B Tenant B', 'phase30e2b-b');

INSERT INTO public.tenant_users (user_id, tenant_id, role)
VALUES
    ('30e20000-0000-4000-8000-000000000001', '30e21000-0000-4000-8000-000000000001', 'admin'),
    ('30e20000-0000-4000-8000-000000000002', '30e21000-0000-4000-8000-000000000001', 'staff'),
    ('30e20000-0000-4000-8000-000000000003', '30e21000-0000-4000-8000-000000000002', 'admin');

INSERT INTO public.barbers (id, tenant_id, name, is_active)
VALUES
    ('30e22000-0000-4000-8000-000000000001', '30e21000-0000-4000-8000-000000000001', 'Synthetic Barber A', true),
    ('30e22000-0000-4000-8000-000000000002', '30e21000-0000-4000-8000-000000000002', 'Synthetic Barber B', true);

INSERT INTO public.services (
    id, tenant_id, name, duration_minutes, price, is_active
)
VALUES
    ('30e23000-0000-4000-8000-000000000001', '30e21000-0000-4000-8000-000000000001', 'Synthetic Service A', 30, 30, true),
    ('30e23000-0000-4000-8000-000000000002', '30e21000-0000-4000-8000-000000000002', 'Synthetic Service B', 30, 30, true);

INSERT INTO public.clients (id, tenant_id, name, phone, private_notes)
VALUES
    ('30e24000-0000-4000-8000-000000000001', '30e21000-0000-4000-8000-000000000001', 'Persisted Client A', '+51000002001', NULL),
    ('30e24000-0000-4000-8000-000000000002', '30e21000-0000-4000-8000-000000000002', 'Persisted Client B', '+51000002001', 'Tenant B notes');

INSERT INTO public.appointments (
    id, tenant_id, service_id, barber_id, date, time,
    client_name, phone, status
)
VALUES
    ('30e25000-0000-4000-8000-000000000001', '30e21000-0000-4000-8000-000000000001', '30e23000-0000-4000-8000-000000000001', '30e22000-0000-4000-8000-000000000001', date '2099-02-01', time '10:00', 'Virtual Client A Older', '+51000002002', 'confirmed'),
    ('30e25000-0000-4000-8000-000000000002', '30e21000-0000-4000-8000-000000000001', '30e23000-0000-4000-8000-000000000001', '30e22000-0000-4000-8000-000000000001', date '2099-02-02', time '10:00', 'Virtual Client A Newer', '+51000002002', 'confirmed'),
    ('30e25000-0000-4000-8000-000000000003', '30e21000-0000-4000-8000-000000000002', '30e23000-0000-4000-8000-000000000002', '30e22000-0000-4000-8000-000000000002', date '2099-02-01', time '10:00', 'Same Phone Tenant B', '+51000002002', 'confirmed');

INSERT INTO public.appointments (
    id, tenant_id, service_id, barber_id, date, time,
    client_name, phone, status
) VALUES (
    '30e25000-0000-4000-8000-000000000004',
    '30e21000-0000-4000-8000-000000000001',
    '30e23000-0000-4000-8000-000000000001',
    '30e22000-0000-4000-8000-000000000001',
    date '2099-02-03',
    time '10:00',
    pg_catalog.repeat('N', 256),
    '+51000002003',
    'confirmed'
);

-- Admin A updates an existing UUID and receives the persisted UUID and notes.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30e20000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
);
INSERT INTO phase30e2b_results(test_name, payload)
SELECT 'persisted_update', public.save_client_private_notes(
    '30e24000-0000-4000-8000-000000000001',
    '+51000002001',
    'Persisted notes A'
);

-- Admin A materializes a virtual client using an exact phone from tenant A.
INSERT INTO phase30e2b_results(test_name, payload)
SELECT 'virtual_materialization', public.save_client_private_notes(
    NULL,
    '+51000002002',
    'Virtual notes A'
);

DO $$
BEGIN
    PERFORM public.save_client_private_notes(
        NULL,
        pg_catalog.repeat('1', 51),
        'Oversized phone'
    );
    RAISE EXCEPTION 'oversized virtual phone unexpectedly succeeded';
EXCEPTION WHEN string_data_right_truncation THEN NULL;
END;
$$;

DO $$
BEGIN
    PERFORM public.save_client_private_notes(
        NULL,
        '+51000002003',
        'Oversized appointment name'
    );
    RAISE EXCEPTION 'oversized appointment name unexpectedly succeeded';
EXCEPTION WHEN string_data_right_truncation THEN NULL;
END;
$$;
RESET ROLE;

DO $$
DECLARE
    v_persisted jsonb;
    v_virtual jsonb;
    v_virtual_id uuid;
BEGIN
    SELECT payload INTO v_persisted
      FROM phase30e2b_results WHERE test_name = 'persisted_update';
    SELECT payload INTO v_virtual
      FROM phase30e2b_results WHERE test_name = 'virtual_materialization';
    v_virtual_id := (v_virtual->>'client_id')::uuid;

    IF (v_persisted->>'client_id')::uuid <> '30e24000-0000-4000-8000-000000000001'::uuid
       OR v_persisted->>'private_notes' <> 'Persisted notes A' THEN
        RAISE EXCEPTION 'persisted client result is invalid: %', v_persisted;
    END IF;

    IF NOT EXISTS (
           SELECT 1
             FROM public.clients AS client
            WHERE client.id = v_virtual_id
              AND client.tenant_id = '30e21000-0000-4000-8000-000000000001'
              AND client.phone = '+51000002002'
              AND client.name = 'Virtual Client A Newer'
              AND client.private_notes = 'Virtual notes A'
       ) THEN
        RAISE EXCEPTION 'virtual client was not safely materialized: %', v_virtual;
    END IF;

    IF (SELECT private_notes FROM public.clients WHERE id = '30e24000-0000-4000-8000-000000000002')
       <> 'Tenant B notes' THEN
        RAISE EXCEPTION 'tenant A changed tenant B notes';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.appointments
         WHERE id IN (
             '30e25000-0000-4000-8000-000000000001',
             '30e25000-0000-4000-8000-000000000002',
             '30e25000-0000-4000-8000-000000000003'
         )
           AND client_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'CRM notes unexpectedly changed historical appointment links';
    END IF;
END;
$$;

-- Clearing notes persists an empty string, not a false success or NULL.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30e20000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
);
INSERT INTO phase30e2b_results(test_name, payload)
SELECT 'empty_notes', public.save_client_private_notes(
    '30e24000-0000-4000-8000-000000000001',
    '+51000002001',
    ''
);
RESET ROLE;

DO $$
BEGIN
    IF (SELECT private_notes FROM public.clients WHERE id = '30e24000-0000-4000-8000-000000000001') <> ''
       OR (SELECT payload->>'private_notes' FROM phase30e2b_results WHERE test_name = 'empty_notes') <> '' THEN
        RAISE EXCEPTION 'empty notes were not persisted exactly';
    END IF;
END;
$$;

-- Cross-tenant IDs, unknown IDs, staff, and users without a tenant fail closed.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30e20000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
);
DO $$
BEGIN
    PERFORM public.save_client_private_notes(
        '30e24000-0000-4000-8000-000000000002', '+51000002001', 'Forbidden'
    );
    RAISE EXCEPTION 'cross-tenant persisted update unexpectedly succeeded';
EXCEPTION WHEN no_data_found THEN NULL;
END;
$$;
DO $$
BEGIN
    PERFORM public.save_client_private_notes(
        '30e24000-0000-4000-8000-000000000099', '+51000009999', 'Missing'
    );
    RAISE EXCEPTION 'zero-row update unexpectedly succeeded';
EXCEPTION WHEN no_data_found THEN NULL;
END;
$$;

SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30e20000-0000-4000-8000-000000000002","role":"authenticated"}',
    true
);
DO $$
BEGIN
    PERFORM public.save_client_private_notes(NULL, '+51000002002', 'Staff');
    RAISE EXCEPTION 'staff write unexpectedly succeeded';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END;
$$;

SELECT pg_catalog.set_config(
    'request.jwt.claims',
    '{"sub":"30e20000-0000-4000-8000-000000000004","role":"authenticated"}',
    true
);
DO $$
BEGIN
    PERFORM public.save_client_private_notes(NULL, '+51000002002', 'No tenant');
    RAISE EXCEPTION 'tenantless write unexpectedly succeeded';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END;
$$;
RESET ROLE;

DO $$
BEGIN
    IF pg_catalog.has_function_privilege(
        'anon', 'public.save_client_private_notes(uuid,text,text)', 'EXECUTE'
    ) OR pg_catalog.has_function_privilege(
        'service_role', 'public.save_client_private_notes(uuid,text,text)', 'EXECUTE'
    ) OR NOT pg_catalog.has_function_privilege(
        'authenticated', 'public.save_client_private_notes(uuid,text,text)', 'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'Phase 30E.2B RPC grants are incorrect';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.clients
         GROUP BY tenant_id, phone
        HAVING pg_catalog.count(*) > 1
    ) THEN
        RAISE EXCEPTION 'duplicate exact tenant/phone clients exist';
    END IF;
END;
$$;

SET LOCAL ROLE anon;
DO $$
BEGIN
    PERFORM public.save_client_private_notes(NULL, '+51000002002', 'Anonymous');
    RAISE EXCEPTION 'anonymous write unexpectedly succeeded';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END;
$$;
RESET ROLE;

TABLE phase30e2b_results;
ROLLBACK;
