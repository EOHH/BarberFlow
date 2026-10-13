-- Functional rollback for Phase 30E.2B.
-- Existing clients or notes created while the RPC was deployed are retained.

BEGIN;

REVOKE ALL PRIVILEGES ON FUNCTION public.save_client_private_notes(uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;

DROP FUNCTION public.save_client_private_notes(uuid, text, text);

COMMIT;
