# Supabase readiness

Milestone 0 uses configuration only. No remote project, auth flow, database client,
domain table, migration, seed data, or local Docker stack is created.

Populate the public Supabase variables in `.env.local` when connecting a development
project. The shell works with them blank. Keep development and production separate.

In the authentication milestone, add the Supabase SSR/client packages and
request-scoped session handling, including cookie refresh and server-side identity
validation. Add all schema changes under `migrations/`, following
`docs/09-database-schema.md`; require RLS and ownership tests before storing private
data. User-scoped access must not use the service-role key.
