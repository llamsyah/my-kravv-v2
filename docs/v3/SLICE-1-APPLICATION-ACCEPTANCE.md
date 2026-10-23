# Slice 1 application acceptance — offline checkpoint

The owner-approved Cloud API cycle passed 92/92 requests/assertions. That evidence
is preserved and is not rerun by this checkpoint. No owner credential, Cloud
request, SQL, Auth configuration, grant, fixture or execution interlock is changed.

## What is exercised offline

`src/tests/v3-application-http.test.ts` starts a self-terminating synthetic HTTP
adapter in a child process (`helpers/v3-application-http.mjs`). It listens only on
an ephemeral `127.0.0.1` port. The child receives a minimal environment without
Supabase/Cloud credentials, and external fetches throw. No `.env` file is loaded.
All users, cookies and in-memory company/settings records are synthetic.

The adapter transpiles the actual `/foundation` and `/auth` pages, authentication
operations/actions, company actions/services and session/proxy modules. Actual
NextRequest/NextResponse cookie/header implementations and React SSR are used.
The Supabase SDK, target lookup/identity I/O, Next cookies/navigation/invalidation
context and CSS imports are replaced only inside this test loader. Product source
does not accept a mock mode or execution override. Real interlocks remain closed.

Coverage: **45 loopback HTTP requests, at least 141 assertions, zero external
fetches** in the application scenario:

| Area         | Offline assertions                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth         | Anonymous/invalid sessions redirect; claims do not replace verified user lookup; invalid login, login cookie/redirect, logout failure and successful cookie clearing/layout invalidation                 |
| Proxy        | Unknown legacy routes return 404; unavailable identity returns 503; claim failures deny access; refreshed cookies propagate; every response is private/no-store                                          |
| Directory    | Actual route/service output, 24 visible rows, continuation, literal ticker search, ambiguous search fallback and owned-ID selection outside current results                                              |
| Mutations    | Create, name-only rename and nullable metadata update; forged form owner ignored; foreign rename rejected; invalid input makes no update; failed writes do not invalidate or report success              |
| Isolation    | A/B responses contain only their own records; same-process sequential and concurrent requests remain isolated; verified account keys differ; no prior account names appear after switching/logout        |
| Theme/errors | Save/read on later HTTP request; account-specific light/dark rendering; failed theme saves remain unconfirmed; capability/directory/theme/foreign-row failures do not expose partial company projections |

The in-memory backend does not prove PostgreSQL grants or RLS. The accepted live
API evidence covers that layer. The offline journal also checks the real services'
explicit user_id filters independently of its simulated ownership filtering.

## Corrections

- `/foundation` keys its client workspace by the verified user ID. React must
  remount its local theme choice, search/context and pending editor state across
  account identity changes, instead of preserving a previous account's component
  state. Existing company-ID editor keys remain intact.
- Any later load failure clears companies, selected company, continuation and
  capability/theme projections before rendering the error. This prevents a company
  name already loaded earlier in the request from appearing in the failed header.
- Existing force-dynamic routing, request-scoped Supabase clients, private/no-store
  responses and login/logout layout invalidation are preserved.

## Build status

`npm run v3:cloud:build` remains **BLOCKED**, not passed. With no explicit target
configuration it refuses target identity. A deterministic check supplies only the
approved public target metadata (no credential) and confirms the next boundary is
the unchanged unconditional application execution interlock, with zero requests.

The Cloud launcher currently contains no Next process dispatch even beyond that
gate. A real production build therefore needs a separately reviewed, narrowly
scoped build/launch implementation and application authorization. Merely adding
environment values cannot legitimately enable it. Directly running `next build`,
dummy credentials, patching the gate or using test replacements to label a build
successful would bypass the approved workflow and is not done here.

Safe checks are TypeScript/Next route type generation, lint, formatting, deterministic
tests and `npm run v3:ui:preview -- --check`. The latter compiles real UI components
with explicitly offline fixtures/actions; it is not a Next production build.

## Remaining separately authorized live application acceptance

This adapter is **not a running Next application**. Its `/__offline/*` POST paths
invoke real action functions through a test-only dispatcher, not Next's action-ID,
RSC, CSRF or streaming protocol. React SSR does not exercise client hydration,
browser history/bfcache, Router Cache, effects or actual session refresh against
Supabase. The request-scoped React cache guarantee still depends on the real Next
render lifecycle. Account keys provide a structural remount guarantee; a live
browser account switch remains required to verify the complete experience.

After a separately reviewed bounded application activation/launcher exists, approve
one loopback Next session using the same dedicated V3 project and synthetic users:

1. Verify exact target and marker, session/cookie namespace, loopback-only listener,
   origin restrictions and clean baseline. Preserve all API evidence/fixtures.
2. Test login/logout, cookie refresh and unauthenticated navigation in the browser.
3. Test real forms, confirmed and failed/uncertain writes, company selection/search
   and continuation using a separately approved bounded fixture write set.
4. Switch A to B and back; test back/forward/reload and concurrent tabs. Inspect
   rendered/RSC responses and cache headers for prior-user data; test unsaved drafts,
   theme choices, sidebar/editor state and account theme reload after switching.
5. Verify actual Server Action origin/CSRF handling and cookie propagation. Run the
   approved production build path and record its genuine result separately.
6. Stop the owned preview, restore both interlocks and preserve evidence. No automatic
   cleanup or unrelated database/Auth changes are included.

No live browser or production-build acceptance is claimed by this offline checkpoint.

## Recorded validation

- Full deterministic suite: **191 passed, 0 failed, 0 skipped** (`npm test`).
- Focused route/workspace/management suite: **30 passed**; the synthetic HTTP
  scenario completes **45 requests and 141 checks**, with zero external fetches.
- `npm run lint`, `npm run typecheck`, `npm run format:check` and
  `git diff --check`: passed.
- `npm run v3:ui:preview -- --check`: offline UI fixture bundle passed.
- `npm run v3:cloud:build`: refused with exit 1 at target validation; production
  build **not performed**. The valid-public-target regression independently confirms
  the application interlock still rejects before execution.
