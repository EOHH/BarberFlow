-- Local-only verification after both concurrency sessions commit.
\set ON_ERROR_STOP on

DO $$
DECLARE
    v_client_count integer;
    v_notes text;
BEGIN
    SELECT pg_catalog.count(*)::integer,
           (pg_catalog.array_agg(client.private_notes))[1]
      INTO v_client_count, v_notes
      FROM public.clients AS client
     WHERE client.tenant_id = '30e2c100-0000-4000-8000-000000000001'
       AND client.phone = '+51000003001';

    IF v_client_count <> 1 THEN
        RAISE EXCEPTION 'concurrent materialization created % client rows', v_client_count;
    END IF;

    IF v_notes NOT IN ('Concurrent notes A', 'Concurrent notes B') THEN
        RAISE EXCEPTION 'concurrent notes contain an unexpected value: %', v_notes;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.appointments AS appointment
         WHERE appointment.id = '30e2c500-0000-4000-8000-000000000001'
           AND appointment.client_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'concurrent materialization changed appointment history';
    END IF;
END;
$$;

SELECT
    client.id,
    client.private_notes
FROM public.clients AS client
WHERE client.tenant_id = '30e2c100-0000-4000-8000-000000000001'
  AND client.phone = '+51000003001';
