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

Milestone 3 adds `migrations/20261008000200_thoughts_and_initial_history.sql`.
Its application to the configured development project has been confirmed. Apply
it once to new development installations after both earlier migrations.

`thoughts` uses the canonical raw_content/optional intent fields, database capture
timestamps, and composite Company ownership FK. Owner-scoped SELECT/INSERT RLS
and column grants allow original capture; no ordinary UPDATE/DELETE is granted.
Archive capture is denied both in RLS and a caller-scoped trigger with a Company
SHARE lock to serialize capture against archive. Reads remain allowed after archive.

`timeline_events` uses the documented fields. The narrow SECURITY DEFINER trigger
appends one THOUGHT_CREATED event from the inserted Thought, atomically. Its search
path is empty, identifiers are qualified, and ordinary function execution is revoked.
Only owner SELECT is granted on history; API callers cannot fabricate or rewrite it.
No new credentials or elevated application client is needed. Account deletion
cascades Thoughts/events; this slice adds no permanent deletion UI.

Live tests create only marked disposable identities, test ordinary authenticated
API restrictions and real app forms, and verify cascade cleanup of all four tables.

Milestone 3.5 adds `migrations/20261008000300_data_control_and_capture_idempotency.sql`.
Its application to the configured development project is confirmed and live
verified. Apply once after Milestone 3 on new installations, never replay it.

Nullable per-owner capture operation UUIDs and an authenticated SECURITY INVOKER
RPC make retries return the same immutable Thought and initial event. Conflicting
payload reuse fails; distinct operation IDs preserve identical intentional captures.
The narrow authenticated deletion RPCs use empty search paths and explicit
`auth.uid()` predicates. Ordinary clients still cannot DELETE tables or UPDATE
originals/history. Owner DELETE RLS policies provide defense in depth; definer RPC
ownership checks are mandatory because their function owner can bypass table RLS.
Company deletion locks the parent and checks its exact name when Thoughts exist;
existing ownership FKs cascade children. A restricted trigger removes deleted
Thought history atomically. Restrictive future FKs reject and roll back unsafe
deletion. No service key is used by application user requests, no trash or
deleted-content event is created, and backups retain provider-specific semantics.
