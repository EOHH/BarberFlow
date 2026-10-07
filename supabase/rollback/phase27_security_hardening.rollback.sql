-- Rollback for phase27_security_hardening.sql.
-- Run manually only if Phase 27 must be reverted. This file is not a migration.

BEGIN;

DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.tenants;
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.barbers;
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.services;
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.availability;
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.appointments;
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.clients;
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.service_categories;
DROP POLICY IF EXISTS "phase27_tenant_boundary" ON public.gallery_images;

DROP FUNCTION IF EXISTS public.is_tenant_member(uuid);
DROP FUNCTION IF EXISTS public.cancel_public_appointment(text, uuid);

CREATE POLICY "Allow authenticated users to manage tenants"
ON public.tenants FOR ALL TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage barbers"
ON public.barbers FOR ALL TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage services"
ON public.services FOR ALL TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage availability"
ON public.availability FOR ALL TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage appointments"
ON public.appointments FOR ALL TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Appointments Public Insert"
ON public.appointments FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Appointments Public Read"
ON public.appointments FOR SELECT TO anon
USING (true);

GRANT SELECT, INSERT, UPDATE ON TABLE public.appointments TO anon;

GRANT EXECUTE ON FUNCTION public.create_booking(
    uuid, uuid, uuid, date, time without time zone, character varying, character varying
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_appointment_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_appointment_transitions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_upcoming_reminders() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_tenant_id_trigger() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.onboard_tenant(text, text) TO anon, authenticated;

COMMIT;
