# Phase 30E.2B local PostgreSQL tests

These scripts use synthetic data and are only for an isolated database that
matches production through Phase 31 plus Phase 30E.2B. Never run them against
production.

Run `phase30e2b_crm_client_notes.test.sql` first for authorization, tenant
isolation, persisted and virtual clients, empty notes, zero-row failures, and
historical-link integrity. The script wraps all fixtures in a transaction and
ends with `ROLLBACK`.

For actual concurrency, use two independent `psql` sessions:

1. Run `phase30e2b_concurrency_setup.sql` once.
2. Start `phase30e2b_concurrency_session_a.sql` in session A.
3. While session A is sleeping, run
   `phase30e2b_concurrency_session_b.sql` in session B.
4. Run `phase30e2b_concurrency_verify.sql`.
5. Run `phase30e2b_concurrency_cleanup.sql` even if a test fails.

Both session calls must return the same `client_id` without a `23505` error.
Verification must report one client row, zero appointment links, and one of the
two complete note values. The RPC uses an exact stored-phone comparison and
intentionally does not merge differently formatted phone numbers.

Frontend double-click validation remains a focused manual test because this
repository has no component-test runner. In browser DevTools, enable request
preservation, double-click **Guardar Notas**, and confirm that exactly one
`save_client_private_notes` request and one Sileo result notification appear.
