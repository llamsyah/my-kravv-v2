# Supabase development setup

The existing development project provides Supabase Auth, `user_settings`, and
Milestone 2 `companies`. Keep development and production projects separate.

Apply `migrations/20261007000100_user_settings_and_rls.sql` once to the configured
development project, using its SQL Editor or a properly linked migration tool.
This repository has no linked CLI or database connection. The API keys cannot
execute schema SQL. Record this migration as applied when introducing migration
tooling; do not blindly replay it against an existing table.

The migration defines documented defaults, a primary key referencing
`auth.users.id` with cascading deletion, an `updated_at` trigger, and four RLS
policies. Authenticated users can SELECT/INSERT/UPDATE/DELETE only their own row;
UPDATE checks both the existing and new owner. Anonymous access has no grant.

Enable email/password authentication and create a real development account in
the dashboard for manual sign-in. This milestone provides login only, without
self-registration or password recovery. Set a suitable localhost Site URL for
development and HTTPS URLs in production. No OAuth provider is needed.

Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for
browser and request-scoped server clients. `SUPABASE_SECRET_KEY` is privileged
and never used for application user requests. Keep it in `.env.local` only.

See the root README for opt-in live tests. These create random disposable
development identities, verify sessions and RLS, and delete only those identities
in `finally`; associated settings cascade away. Never point them at production.

Apply `migrations/20261008000100_companies_and_rls.sql` once to the configured
development project. It adds only the documented Company metadata, an ownership
index, timestamp/archive trigger, and separate SELECT/INSERT/UPDATE RLS policies.
Ordinary updates cannot change id, user_id, or creation/update timestamps. Archive
is an UPDATE; no ordinary DELETE grant/policy or permanent-deletion UI is provided.
The trigger preserves the first archive timestamp during subsequent corrections.

All subsequent schema changes belong in reviewed migrations with ownership tests.
There are no seed companies or later reasoning tables yet.
