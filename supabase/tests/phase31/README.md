# Phase 31 isolated onboarding tests

Run only against a disposable local Supabase database that reproduces the
production auth trigger, tenants, tenant_users, RLS and Phase 27–30 state.
Never run these tests against a linked or remote project.

Apply `supabase/migrations/phase31_idempotent_onboarding.sql`, then run:

```text
psql --set ON_ERROR_STOP=1 --file supabase/tests/phase31/phase31_idempotent_onboarding.test.sql
```

The test uses synthetic users and wraps all changes in a transaction that is
rolled back. It intentionally exercises the real SECURITY DEFINER functions;
it does not replace database permission checks with mocks.

## Real two-session concurrency test

The concurrency harness requires `psql` and a disposable local database with
the production trigger/RLS shape and Phase 31 applied. It refuses any host
other than `localhost`, `127.0.0.1` or `::1`.

Set the standard libpq variables (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`
and, if required locally, `PGPASSWORD`) without placing credentials in the
repository, then run:

```powershell
./supabase/tests/phase31/run_phase31_concurrency.ps1
```

The runner starts two independent `psql` processes for each scenario. Worker A
holds its transaction-level advisory lock for two seconds while worker B calls
the same RPC. It verifies concurrent legacy recovery, concurrent onboarding,
one-winner slug contention, tenant/membership uniqueness and that the losing
user never acquires the winning tenant. Synthetic rows and the test schema are
removed in a `finally` block.
