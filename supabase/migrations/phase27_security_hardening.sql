-- Phase 27: first production security hardening pass.
--
-- Scope:
--   * keep public catalog and the modern slug-based booking RPCs working;
--   * close direct anonymous access to appointments;
--   * disable the legacy tenant-id booking overload for client roles;
--   * prevent permissive legacy policies from granting cross-tenant access;
--   * remove client execution rights from trigger/cron/internal functions;
--   * expose a narrowly-scoped cancellation RPC for the public client portal.
--
-- This migration intentionally does not change booking status semantics,
-- appointment indexes, triggers, scheduled jobs, onboarding data, or Storage.

BEGIN;

-- A small SECURITY DEFINER predicate avoids depending on caller-visible rows in
-- tenant_users while RLS is being evaluated. It returns only membership state.
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.tenant_users AS tu
        WHERE tu.user_id = auth.uid()
          AND tu.tenant_id = p_tenant_id
    );
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;

-- RESTRICTIVE policies are ANDed with every applicable permissive policy.
-- Consequently, a forgotten permissive legacy policy cannot reopen access to
-- rows belonging to another tenant.
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.tenants;
CREATE POLICY "phase27_tenant_boundary"
ON public.tenants
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(id))
WITH CHECK (public.is_tenant_member(id));

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.barbers;
CREATE POLICY "phase27_tenant_boundary"
ON public.barbers
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.services;
CREATE POLICY "phase27_tenant_boundary"
ON public.services
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.availability;
CREATE POLICY "phase27_tenant_boundary"
ON public.availability
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.appointments;
CREATE POLICY "phase27_tenant_boundary"
ON public.appointments
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.clients;
CREATE POLICY "phase27_tenant_boundary"
ON public.clients
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.service_categories;
CREATE POLICY "phase27_tenant_boundary"
ON public.service_categories
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.gallery_images;
CREATE POLICY "phase27_tenant_boundary"
ON public.gallery_images
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

-- Remove the broad authenticated policies whose permissive OR semantics can
-- bypass tenant-aware policies. Existing tenant-aware permissive policies stay
-- in place; the restrictive boundary above is the final cross-tenant guard.
DROP POLICY IF EXISTS "Allow authenticated users to manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow authenticated users to manage barbers" ON public.barbers;
DROP POLICY IF EXISTS "Allow authenticated users to manage services" ON public.services;
DROP POLICY IF EXISTS "Allow authenticated users to manage availability" ON public.availability;
DROP POLICY IF EXISTS "Allow authenticated users to manage appointments" ON public.appointments;

-- Public reads must use the purpose-built lookup RPCs and public bookings must
-- use create_booking(text, uuid, uuid, date, time, text, text).
DROP POLICY IF EXISTS "Appointments Public Insert" ON public.appointments;
DROP POLICY IF EXISTS "Appointments Public Read" ON public.appointments;
DROP POLICY IF EXISTS "Allow public to insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;

REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments FROM anon;

-- Disable the insecure legacy overload without dropping it. Keeping its body
-- temporarily makes rollback safe while removing every client execution path.
REVOKE ALL PRIVILEGES ON FUNCTION public.create_booking(
    uuid, uuid, uuid, date, time without time zone, character varying, character varying
) FROM PUBLIC, anon, authenticated;

-- Preserve the supported public booking surface explicitly.
REVOKE ALL PRIVILEGES ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time without time zone, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(
    text, uuid, uuid, date, time without time zone, text, text
) TO anon, authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_available_slots(text, uuid, uuid, date)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(text, uuid, uuid, date)
TO anon, authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_appointment_by_id(text, uuid)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_by_id(text, uuid)
TO anon, authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_appointments_by_phone(text, text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointments_by_phone(text, text)
TO anon, authenticated;

-- Public cancellation remains UUID-link based for compatibility, but direct
-- table UPDATE is replaced with server-side tenant, state, and time checks.
CREATE OR REPLACE FUNCTION public.cancel_public_appointment(
    p_slug text,
    p_appointment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_appointment_id uuid;
BEGIN
    UPDATE public.appointments AS a
       SET status = 'cancelled'
      FROM public.tenants AS t
     WHERE t.domain = p_slug
       AND a.tenant_id = t.id
       AND a.id = p_appointment_id
       AND a.status IN ('pending', 'confirmed')
       AND (a.date + a.time) >
           (pg_catalog.timezone('America/Lima', pg_catalog.now()) + interval '1 hour')
    RETURNING a.id INTO v_appointment_id;

    IF v_appointment_id IS NULL THEN
        RAISE EXCEPTION 'La cita no existe, ya no puede cancelarse o faltan menos de 60 minutos.';
    END IF;

    RETURN pg_catalog.jsonb_build_object('success', true, 'id', v_appointment_id);
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.cancel_public_appointment(text, uuid)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_public_appointment(text, uuid)
TO anon, authenticated;

-- Trigger functions continue to be invoked by their triggers without being
-- callable as public RPC endpoints. Cron/maintenance callers retain owner or
-- service-role privileges; only browser client roles are removed here.
REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.notify_appointment_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.process_appointment_transitions() FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.process_upcoming_reminders() FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.set_tenant_id_trigger() FROM PUBLIC, anon, authenticated;

-- This helper may still be referenced by legacy RLS definitions. Keep it for
-- authenticated policy evaluation, but do not expose it anonymously.
REVOKE ALL PRIVILEGES ON FUNCTION public.get_auth_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO authenticated;

-- Current frontend onboarding requires authenticated execution only.
REVOKE ALL PRIVILEGES ON FUNCTION public.onboard_tenant(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onboard_tenant(text, text) TO authenticated;

COMMIT;
