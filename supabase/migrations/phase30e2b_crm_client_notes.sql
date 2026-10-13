-- Phase 30E.2B: tenant-safe CRM notes for persisted and appointment-derived clients.
-- This migration does not change RLS, existing policies, appointments, or data.

BEGIN;

DO $$
DECLARE
    v_user_id_attnum smallint;
    v_client_tenant_attnum smallint;
    v_client_phone_attnum smallint;
BEGIN
    IF current_user <> 'postgres' THEN
        RAISE EXCEPTION 'Phase 30E.2B aborted: migration must run as postgres.';
    END IF;

    IF pg_catalog.to_regprocedure(
        'public.save_client_private_notes(uuid,text,text)'
    ) IS NOT NULL THEN
        RAISE EXCEPTION 'Phase 30E.2B aborted: save_client_private_notes(uuid,text,text) already exists.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'clients'
           AND column_name = 'id'
           AND data_type = 'uuid'
           AND is_nullable = 'NO'
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'clients'
           AND column_name = 'tenant_id'
           AND data_type = 'uuid'
           AND is_nullable = 'NO'
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'clients'
           AND column_name = 'name'
           AND data_type IN ('text', 'character varying')
           AND is_nullable = 'NO'
           AND character_maximum_length = 255
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'clients'
           AND column_name = 'phone'
           AND data_type IN ('text', 'character varying')
           AND is_nullable = 'NO'
           AND character_maximum_length = 50
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'clients'
           AND column_name = 'private_notes'
           AND data_type = 'text'
           AND is_nullable = 'YES'
    ) THEN
        RAISE EXCEPTION 'Phase 30E.2B aborted: clients columns, nullability, or lengths differ from the audited schema.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'appointments'
           AND column_name = 'tenant_id'
           AND data_type = 'uuid'
           AND is_nullable = 'NO'
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'appointments'
           AND column_name = 'client_id'
           AND data_type = 'uuid'
           AND is_nullable = 'YES'
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'appointments'
           AND column_name = 'client_name'
           AND data_type IN ('text', 'character varying')
           AND is_nullable = 'NO'
    ) OR NOT EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'appointments'
           AND column_name = 'phone'
           AND data_type IN ('text', 'character varying')
           AND is_nullable = 'NO'
    ) THEN
        RAISE EXCEPTION 'Phase 30E.2B aborted: appointment CRM columns differ from the audited schema.';
    END IF;

    SELECT attnum INTO v_user_id_attnum
      FROM pg_catalog.pg_attribute
     WHERE attrelid = 'public.tenant_users'::regclass
       AND attname = 'user_id'
       AND NOT attisdropped;

    IF v_user_id_attnum IS NULL OR NOT EXISTS (
        SELECT 1
          FROM pg_catalog.pg_constraint AS con
         WHERE con.conrelid = 'public.tenant_users'::regclass
           AND con.contype = 'u'
           AND con.conkey = ARRAY[v_user_id_attnum]::smallint[]
    ) THEN
        RAISE EXCEPTION 'Phase 30E.2B aborted: tenant_users.user_id must remain uniquely constrained.';
    END IF;

    SELECT attnum INTO v_client_tenant_attnum
      FROM pg_catalog.pg_attribute
     WHERE attrelid = 'public.clients'::regclass
       AND attname = 'tenant_id'
       AND NOT attisdropped;

    SELECT attnum INTO v_client_phone_attnum
      FROM pg_catalog.pg_attribute
     WHERE attrelid = 'public.clients'::regclass
       AND attname = 'phone'
       AND NOT attisdropped;

    IF v_client_tenant_attnum IS NULL
       OR v_client_phone_attnum IS NULL
       OR NOT EXISTS (
           SELECT 1
             FROM pg_catalog.pg_constraint AS con
            WHERE con.conrelid = 'public.clients'::regclass
              AND con.contype = 'u'
              AND con.conkey = ARRAY[
                  v_client_tenant_attnum,
                  v_client_phone_attnum
              ]::smallint[]
       ) THEN
        RAISE EXCEPTION 'Phase 30E.2B aborted: UNIQUE (tenant_id, phone) is required.';
    END IF;
END;
$$;

CREATE FUNCTION public.save_client_private_notes(
    p_client_id uuid,
    p_phone text,
    p_private_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_tenant_id uuid;
    v_admin_membership_count integer;
    v_client_id uuid;
    v_client_name text;
    v_saved_notes text;
BEGIN
    IF auth.role() IS DISTINCT FROM 'authenticated' OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_private_notes IS NULL THEN
        RAISE EXCEPTION 'Private notes must be a string; use an empty string to clear them.'
            USING ERRCODE = '22004';
    END IF;

    SELECT pg_catalog.count(*)::integer,
           (pg_catalog.array_agg(tu.tenant_id))[1]
      INTO v_admin_membership_count, v_tenant_id
      FROM public.tenant_users AS tu
     WHERE tu.user_id = v_user_id
       AND tu.role = 'admin';

    IF v_admin_membership_count <> 1 OR v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'An administrative tenant membership is required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_client_id IS NOT NULL THEN
        UPDATE public.clients AS c
           SET private_notes = p_private_notes
         WHERE c.id = p_client_id
           AND c.tenant_id = v_tenant_id
        RETURNING c.id, c.private_notes
             INTO v_client_id, v_saved_notes;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'The client does not exist in the authenticated tenant.'
                USING ERRCODE = 'P0002';
        END IF;
    ELSE
        IF p_phone IS NULL OR pg_catalog.btrim(p_phone) = '' THEN
            RAISE EXCEPTION 'A non-empty exact phone is required for a virtual client.'
                USING ERRCODE = '22023';
        END IF;

        IF pg_catalog.length(p_phone) > 50 THEN
            RAISE EXCEPTION 'The virtual client phone exceeds the supported length.'
                USING ERRCODE = '22001';
        END IF;

        SELECT a.client_name
          INTO v_client_name
          FROM public.appointments AS a
         WHERE a.tenant_id = v_tenant_id
           AND a.phone = p_phone
         ORDER BY a.date DESC,
                  a.time DESC,
                  a.created_at DESC NULLS LAST,
                  a.id DESC
         LIMIT 1;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No appointment with that exact phone exists in the authenticated tenant.'
                USING ERRCODE = 'P0002';
        END IF;

        IF v_client_name IS NULL OR pg_catalog.btrim(v_client_name) = '' THEN
            RAISE EXCEPTION 'The appointment does not contain a valid client name.'
                USING ERRCODE = '22023';
        END IF;

        IF pg_catalog.length(v_client_name) > 255 THEN
            RAISE EXCEPTION 'The appointment client name exceeds the supported length.'
                USING ERRCODE = '22001';
        END IF;

        INSERT INTO public.clients AS c (
            tenant_id,
            name,
            phone,
            private_notes
        ) VALUES (
            v_tenant_id,
            v_client_name,
            p_phone,
            p_private_notes
        )
        ON CONFLICT (tenant_id, phone)
        DO UPDATE
           SET private_notes = EXCLUDED.private_notes
        RETURNING c.id, c.private_notes
             INTO v_client_id, v_saved_notes;
    END IF;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client notes were not persisted.';
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'client_id', v_client_id,
        'private_notes', v_saved_notes
    );
END;
$$;

ALTER FUNCTION public.save_client_private_notes(uuid, text, text)
OWNER TO postgres;

REVOKE ALL PRIVILEGES ON FUNCTION public.save_client_private_notes(uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_client_private_notes(uuid, text, text)
TO authenticated;

COMMIT;
