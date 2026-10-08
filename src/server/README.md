# Server boundaries

All executable files in this directory import `server-only`. Credentials and
provider errors must never be sent as client props, responses, or logs.

- `auth/client.ts`: request-scoped Supabase SSR client using the publishable key
  and request cookies. User requests always run under RLS.
- `auth/proxy.ts`: verifies claims and refreshes cookies before private entry.
  Cookies propagate to the request and response; responses use `private, no-store`.
- `auth/session.ts`: verifies identity with `getUser()` on the server. React cache
  deduplicates within a render only. Never authorize with `getSession()` or client
  state alone.
- `auth/workspace.ts`: checks identity near private data, then bootstraps settings
  for that verified user's id.
- `auth/operations.ts`: validated password login and current-session logout,
  with safe Bahasa Indonesia feedback. Feature actions perform navigation.
- `db/user-settings.ts`: insert-if-missing bootstrap, then explicit owner check.
  Repeated or concurrent entry does not reset preferences.
- `companies/context.ts`: reuses the verified session and settings bootstrap for
  Company requests. Each action obtains this context before database work.
- `db/companies.ts`: create/list/lookup/edit/archive using explicit owner filters,
  validated fields, and checked return rows. No privileged client is used. Foreign
  and missing records share one unavailable result; provider details stay private.
- `db/thoughts.ts`: authenticated capture after owned/active parent checks, exact
  original preservation, Company-specific keyset history, and recent Thoughts.
  All queries use the user's RLS client with explicit ownership filters and
  validated return rows. History writes are atomic database trigger operations;
  no privileged client or separate API history insert is used.
- `db/config.ts`: privileged credential accessor for explicit administration and
  narrow AI accounting. It never reads user context with elevated privileges.
- `db/ai-runs.ts`: service-only reservation, attempt and finalization closures,
  explicit owner checks and safe logging failures. Owners cannot forge charges.
- `ai/`: lazy provider configuration, inert role registry, validated gateway,
  selected owned context, bounded provider calls, token/cost accounting and safe
  errors. See [the internal AI contract](ai/README.md). No product AI role or
  ordinary page/action invokes this infrastructure.

Future features must check authenticated identity, record ownership, and RLS
together. Add directories only when their first implementation is needed.
