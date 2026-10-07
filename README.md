# MY KRAVV

A private AI-assisted investment reasoning workspace. Milestone 1 adds Supabase
email/password authentication and a private shell to the Milestone 0 foundation.
The UI defaults to Bahasa Indonesia and preserves the Hybrid KRAVV design.

## Run locally

Use Node.js 24 LTS and npm (version recorded in `.node-version`).

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. Anonymous users reach `/auth`; authenticated users
reach the minimal private shell at `/`. This is a foundation placeholder.

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
account; registration and password recovery are outside this milestone.

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
nine deterministic environment/authentication/bootstrap tests. Use `npm run format`
to format application/setup files. Product documentation and visual references are
excluded from formatting.

The opt-in live suite requires the designated development project, its applied
migration, and the local app running. It verifies real login, session refresh,
idempotent bootstrap, cross-user RLS, and the actual login/logout Server Actions
through HTTP. Random disposable users are removed in `finally`; no other user or
record is modified. The secret key is used only for this test administration.

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
src/lib/env/          Browser-safe configuration
src/lib/supabase/     Browser client boundary
src/server/auth/      SSR client, verified session, refresh, auth operations
src/server/db/        Settings bootstrap and privileged credential boundary
src/server/ai/        Reserved credential boundary; no provider calls
src/proxy.ts          Server-side route guard
src/tests/            Deterministic tests; separate opt-in live suite
supabase/migrations/  Reviewed settings schema and RLS migration
```

Only `@supabase/ssr` and `@supabase/supabase-js` were added for this milestone.
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

Stop after Authentication + Private Shell. Phase 2 in the implementation plan is
Companies: an owned company table and RLS, create/list/edit/archive flows, and a
minimal company workspace with validation and ownership tests. It has not started.
Raw Thoughts and the AI Gateway remain later phases.

Implementation references: [installed Next.js guidance](node_modules/next/dist/docs/)
and [Supabase SSR authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
