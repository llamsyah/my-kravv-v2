# MY KRAVV

A private AI-assisted investment reasoning workspace. Milestone 0 establishes the
application foundation only: a Bahasa Indonesia shell, local tooling, and validated
configuration boundaries. Authentication, persistence, and AI actions are not implemented.

## Run locally

Use Node.js 24 LTS and npm (Node version recorded in `.node-version`).

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. The shell works without credentials or external services.
For future integrations, copy `.env.example` to `.env.local` and fill in the relevant
values. Never commit `.env.local`.

```powershell
Copy-Item .env.example .env.local
```

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-safe.
`SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are protected by `server-only` imports.
Do not expose them through Next.js config, client props, responses, or logs.
Validation is lazy: a missing integration config throws a clear error only when used.

## Validation and production

```sh
npm run check
npm run build
npm start
```

`check` runs ESLint, strict TypeScript checks (including generated Next.js route types),
Prettier checks, and environment-boundary tests using Node's built-in test runner.
Use `npm run format` to format application/setup files. Existing product documentation
and visual references are deliberately excluded from formatting.

ESLint 9 is pinned for compatibility with the React/import/accessibility plugins
bundled by `eslint-config-next` (their peer ranges do not yet accept ESLint 10).
The registry marks ESLint 9 deprecated. The initial audit also reports five high
severity entries in the development-only `fast-glob` → `micromatch` → `braces`
chain. No patched `braces` release was available during setup; the suggested forced
fix downgrades Next.js lint configuration to an incompatible major. Revisit these
tooling dependencies when compatible upstream updates arrive. The production-only
audit is clean (`npm audit --omit=dev`).

## Source layout

```text
src/app/              App Router layout, shell page, not-found page, design tokens
src/components/       Shared application shell
src/lib/env/          Public Supabase configuration validation
src/server/db/        Server-only database credential boundary
src/server/ai/        Server-only AI credential boundary; no provider calls
src/tests/            Environment validation and public/private separation checks
supabase/migrations/  Reserved for future reviewed SQL migrations (currently empty)
```

The UI uses local system serif/sans-serif fonts and plain CSS. There is no font
download, component kit, market data, or mock account. Navigation includes only the
existing Beranda route. The page is a foundation placeholder, not the final Home.
Feature/domain/auth directories will arrive with their first implementation.

## Product documentation and references

Read [the original project overview](docs/README.md) and
[Product Foundation](docs/MY_KRAVV_Product_Foundation_v0.1.md) first, followed by
[MVP Scope](docs/05-mvp-scope.md), [Technical Architecture](docs/06-technical-architecture.md),
[Page Responsibilities](docs/07-page-responsibilities.md), and
[Design Direction](docs/08-design-direction.md), and
[Implementation Plan](docs/11-implementation-plan.md).

[Visual reference guidance](public/visual-references/visual-references-README.md)
explains the desktop/mobile images. They guide atmosphere and hierarchy; product
documentation takes priority. Original documents and all ten images remain intact.

Repository naming differs from the task brief: the original overview is
`docs/README.md`, Product Foundation uses its versioned filename above, and the
visual guide is `visual-references-README.md`. No originals were renamed.
The implementation plan became available during setup and was reviewed before
completion. This task's configuration-only scope takes precedence over its broader
Supabase project provisioning checklist; no external account or project is created.

## Next milestone

Stop after Milestone 0. [Phase 1 in the implementation plan](docs/11-implementation-plan.md#8-phase-1--authentication--private-shell)
is **Authentication + Private Shell**: Supabase Auth, protected routes, a session
helper, user settings bootstrap, logout, and private navigation. Verify that signed-out
users cannot access private pages, sessions survive refresh, settings are created once,
and logout works. Add protected-route, session, and settings-ownership tests then.
Companies and the AI Gateway remain separate later phases.

Implementation references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
and [Supabase server-side auth](https://supabase.com/docs/guides/auth/server-side).
