# Phase 30 isolated local tests

These scripts are local-only and use synthetic UUIDs and customer data. They
must never be run against a linked or remote Supabase project.

## Required baseline

Do not run the tests until a local baseline can reproduce the production
schema before Phase 30, including:

- Supabase local roles and the `auth` schema;
- `tenants`, `tenant_users`, `barbers`, `services`, `availability`, and
  `appointments` with their effective production columns and tenant-aware
  foreign keys;
- `tenant_users.user_id UNIQUE`, its `admin`/`staff` role constraint, and its
  relation to `auth.users`;
- `set_tenant_id_trigger()` and `trg_appointments_tenant_id`;
- the effective tenant-aware active-appointment unique index;
- all permissive RLS policies that Phase 27 restricts;
- Phase 27, Phase 28, and Phase 29, applied in that order;
- the exact production grants and owners for the modern and legacy booking
  overloads and the lifecycle functions.

The current Git history does not provide that baseline. In particular,
`supabase_schema.sql` is not a migration and does not create `tenant_users` or
the tenant trigger required by Phase 29.

## Intended execution order on an isolated local database

1. Apply the verified pre-Phase-30 local baseline.
2. Apply `supabase/migrations/phase30_booking_confirmation_mode.sql`.
3. Apply `supabase/migrations/phase30d_authenticated_public_booking_tenant.sql`.
4. Run `phase30_booking_confirmation_mode.test.sql` with `psql` and
   `ON_ERROR_STOP=1`.
5. Run `phase30_concurrency_setup.sql`.
6. Run `phase30_concurrency_session_a.sql` and, while it is waiting, run
   `phase30_concurrency_session_b.sql` in a second terminal.
7. Run `phase30_concurrency_verify.sql`.
8. Apply `supabase/rollback/phase30d_authenticated_public_booking_tenant.rollback.sql`.
9. Run `phase30d_after_rollback.test.sql`.
10. Apply `supabase/rollback/phase30_booking_confirmation_mode.rollback.sql`.
11. Run `phase30_after_rollback.test.sql`.

Every non-concurrency test is wrapped in a transaction and rolls back its
synthetic data. The concurrency setup uses synthetic rows that must only exist
inside a disposable local database.
