# Server boundaries

Milestone 0 prepares configuration only. Nothing here makes network requests.
All executable files under this directory must import `server-only` so Next.js
rejects their use in Client Components. Do not send their return values as client
props, API responses, or log entries.

- `db/config.ts`: service-role credential accessor, reserved for explicit admin
  work. It must never become the default client for user requests because it
  bypasses RLS. The public URL/anon-key configuration is in `src/lib/env/public.ts`.
- `ai/config.ts`: credential boundary for the future AI Gateway. Add provider SDK,
  validated output contracts, usage/cost controls, and explicit authenticated
  actions only when implementing that milestone.
- Future `auth/`: Supabase Auth session handling and server-side identity checks.
  Add request-scoped SSR clients, cookie refresh, and ownership enforcement with
  the authentication milestone. The current shell has no session or private data.

Add domain logic and feature directories alongside their first real feature;
do not create empty services or placeholder endpoints.
