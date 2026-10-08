# MY KRAVV

A private AI-assisted investment reasoning workspace. Milestone 3 adds immutable
Raw Thoughts and initial history to the owned Company foundation.
The UI defaults to Bahasa Indonesia and preserves the Hybrid KRAVV design.

## Run locally

Use Node.js 24 LTS and npm (version recorded in `.node-version`).

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. Anonymous users reach `/auth`; authenticated users
reach the minimal private shell at `/`. Companies live at `/companies`; Home
supports Company-linked quick capture and recent original thoughts.

For a new checkout, copy `.env.example` to `.env.local` and fill the development
project values. Do not overwrite an existing local configuration or commit it.

```powershell
Copy-Item .env.example .env.local
```

Browser-safe variables are `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SECRET_KEY` and `OPENAI_API_KEY`
are protected by `server-only` imports and never used in client code. No AI calls
are implemented. Validation reports missing configuration without echoing values.

Apply [the settings migration](supabase/migrations/20261007000100_user_settings_and_rls.sql)
to the configured development project. See [Supabase setup](supabase/README.md)
for migration and dashboard prerequisites. Sign in with an existing email/password
account; registration and password recovery are outside this milestone. Also apply
[the Company migration](supabase/migrations/20261008000100_companies_and_rls.sql)
once to the same development project before using Companies.
Also apply [the Thought migration](supabase/migrations/20261008000200_thoughts_and_initial_history.sql)
once to that project before using Raw Thoughts. Its application has been confirmed
for the configured development project.

## Company Slice

`/companies` lists owned active companies by recent metadata update. The archived
view is available through its quiet **Diarsipkan** link. `/companies/new` needs only
a name; optional ticker, exchange, sector, and short context sit behind disclosure.
No ticker lookup, external enrichment, or market data is used.

`/companies/[companyId]` shows company identity and user-entered context.
`/companies/[companyId]/edit` updates supported metadata and descriptive research
state. Missing, malformed, and foreign company IDs return the same safe unavailable
surface. No later reasoning features or fake data populate the workspace.

Ownership is derived from the verified server session, never form data. Every
query explicitly filters `user_id`, validates the returned owner, and runs under
the user's RLS session. Separate SELECT/INSERT/UPDATE policies protect Companies;
column grants prevent ordinary API changes to identity, ownership, or timestamps.

Archiving requires explicit confirmation. It sets `state = ARCHIVED` without
deletion; the database maintains `archived_at` and `updated_at`. Repeated archive
operations preserve the original archive timestamp. Archived workspaces can be
reopened and their metadata corrected; they remain archived. Restore and permanent
deletion controls are outside this slice. There is no ordinary Company DELETE
grant or policy. Deleting an Auth account cascades its private data.

Input limits are 200 characters for name, 40 for ticker, 80 for exchange, 120 for
sector, and 2,000 for context. The name is required; blanks in optional fields are
stored as NULL. Descriptive states are user-selected labels, not workflow gates.

## Raw Thought Slice

Write freely inside `/companies/[companyId]`, or choose an active Company in the
small Beranda composer. Only freeform text and Company are required; intent stays
NULL. The canonical names `raw_content` and `intent` follow the database schema,
rather than the conceptual `raw_text`/`intent_type` names in the domain document.
No Thought status or update timestamp is invented.

The server validates nonblank text without transforming it, verifies the parent,
and derives ownership from the verified session. The original submitted string
is stored exactly, including whitespace, tabs, and line breaks. Browser textarea
and form encoding determine submitted line endings; the server does not normalize
them. NUL characters are rejected because PostgreSQL TEXT cannot store them. A
100,000-character application limit keeps long capture within the existing Server
Action request budget. Content is never silently truncated.

Company history lists 20 original Thoughts per request, newest first, with UUID
ascending as a deterministic tie-breaker. Validated timestamp/UUID keyset links
reach older entries without offset shifts. Entries open their full escaped text
with original formatting, identity, and capture time (currently WIB). Beranda
shows five recent original thoughts with Company links. This is initial history,
not a full Timeline interface or a completed Home dashboard.

An insert trigger creates one `THOUGHT_CREATED` event in the same transaction;
failure rolls back both writes. Composite ownership foreign keys and separate
SELECT/INSERT RLS policies protect Thoughts. Ordinary INSERT grants cover only
owner/parent/content; UPDATE/DELETE permissions are absent. Originals, identity,
ownership, and capture timestamps cannot be rewritten through the user API.
Timeline events are owner-readable and writable only by a restricted database
trigger. The app uses the ordinary authenticated client throughout.

Archived Companies retain readable thoughts/history. New capture is rejected by
the server and database, including concurrent archive/capture guarded by a Company
row lock. Company metadata correction remains available. Failed saves retain the
draft; a draft rejected after archive is shown read-only for copying. Submit
controls are disabled while saving. Drafts are not persisted across browser
reloads, and ambiguous network failures do not have retry idempotency; separate
intentional identical Thoughts remain valid.

## Authentication and authorization

Request-scoped Supabase SSR clients use the publishable key and session cookies.
Next.js Proxy verifies claims, refreshes sessions, and propagates cookies to the
request and response. Server layouts and the private page verify identity with
`getUser()` before private access. Private responses use `private, no-store`.

The first private entry inserts settings if missing, then checks the returned
owner. Concurrent or repeated visits preserve preferences. Four RLS policies
restrict reading, inserting, updating, and deleting to `auth.uid() = user_id`.
User requests never use the privileged secret key. Logout revokes the current
session and clears its cookies; private entry then redirects back to `/auth`.

Future private pages should use the private route group and check identity near
data access. Each new record requires explicit ownership checks and RLS tests.
Supabase's provider rate limits protect login; production HTTPS, secure project
configuration, and a separate production database remain deployment requirements.

## Validation and production

```sh
npm run check
npm run build
npm start
```

`check` runs ESLint, strict TypeScript with generated route types, Prettier, and
deterministic environment/authentication/bootstrap/Company/Thought tests. Use `npm run format`
to format application/setup files. Product documentation and visual references are
excluded from formatting.

The opt-in live suite requires the designated development project, its applied
migration, and the local app running. It verifies real login, session refresh,
idempotent bootstrap, cross-user RLS, Company creation/list/edit/archive, and actual
Server Actions through HTTP, plus exact raw preservation, immutable API permissions,
Thought ownership/history, and archived capture denial. Random disposable users
are removed in `finally`; their private data cascades away and cleanup is checked. No other
user or record is modified. The secret key is used only for test administration.

```powershell
$env:MY_KRAVV_LIVE_TESTS = 'development'
npm run test:live
Remove-Item Env:MY_KRAVV_LIVE_TESTS
```

The app URL defaults to `http://127.0.0.1:3000`; override it with
`MY_KRAVV_TEST_APP_URL` for a different localhost port. Without the opt-in value,
live tests are skipped. Browser visual verification is separate from HTTP tests.

ESLint 9 is pinned because bundled lint plugins do not yet accept ESLint 10.
Milestone 0 recorded five high development-only audit entries in the
`fast-glob` → `micromatch` → `braces` chain; revisit compatible upstream fixes.
Check production dependencies with `npm audit --omit=dev`.

## Source layout

```text
src/app/auth/         Public login surface
src/app/(private)/    Protected shell, placeholder, loading/error states
src/components/       Shared shell
src/features/auth/    Login/logout forms, validation, Server Actions
src/features/companies/ Company forms, actions, and private navigation
src/domain/company/   Validated Company fields, states, and runtime row types
src/domain/thought/   Original-text validation, row types, and history cursors
src/features/thoughts/ Composer, history, and authenticated capture action
src/lib/env/          Browser-safe configuration
src/lib/supabase/     Browser client boundary
src/server/auth/      SSR client, verified session, refresh, auth operations
src/server/db/        Settings bootstrap and privileged credential boundary
src/server/companies/ Verified session and settings context for Company requests
src/server/ai/        Reserved credential boundary; no provider calls
src/proxy.ts          Server-side route guard
src/tests/            Deterministic tests; separate opt-in live suite
supabase/migrations/  Settings, Companies, Thoughts, initial history, and RLS
```

No dependencies were added for Milestones 2 or 3. Milestone 1 introduced
`@supabase/ssr` and `@supabase/supabase-js`.
No component kit, external fonts, market data, or mock account is included.

## Product documentation and references

Read [the original overview](docs/README.md),
[Product Foundation](docs/MY_KRAVV_Product_Foundation_v0.1.md),
[MVP Scope](docs/05-mvp-scope.md), [Technical Architecture](docs/06-technical-architecture.md),
[Design Direction](docs/08-design-direction.md), [Database Schema](docs/09-database-schema.md),
and [Implementation Plan](docs/11-implementation-plan.md).
[Visual guidance](public/visual-references/visual-references-README.md) describes
the desktop/mobile images. Documentation takes priority; original documents and
all ten images remain intact. Their actual filenames differ from the task brief;
no originals were renamed. The task's current publishable/secret key model takes
precedence over legacy names in the original implementation plan.

## Next milestone

Stop after the Raw Thought Slice. Phase 4 in the implementation plan is AI
Infrastructure: Gateway, registries, run persistence, cost estimation, and context
building. It has not started. No AI provider calls exist.

Implementation references: [installed Next.js guidance](node_modules/next/dist/docs/)
and [Supabase SSR authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
