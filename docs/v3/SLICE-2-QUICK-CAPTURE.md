# Slice 2 — Quick Capture MVP

Implementation starts from `5576052099d4d1887c20c8e34c45789dfcaca166` on `v3`.
Owner authorized this smaller Quick Capture milestone ahead of the broader
proposed Slice 2A/2B writing/Explore sequence. Neither writing persistence nor
capture moves are implied complete. Slice 1 is frozen with live application
acceptance PARTIAL; no third acceptance window is started or required here.

## User experience

`/foundation?view=captures` is the private **Penampungan** inbox, reached through
the global **Quick Capture** navigation link. The accepted Home and Company
Overview layouts remain unchanged. The same light/dark shell surrounds a focused
raw-text form and readable newest-first capture cards. Cards show a server creation
timestamp (explicit UTC), optional owned company link or **Tanpa perusahaan**, and
the complete escaped text with whitespace retained. There is no AI/Markdown/HTML
execution, automatic rewrite, categorization or Thought commit.

Capture text is required; company is optional. An inline searchable, paged owner
company picker uses the existing directory service and retains its selected
company independently of results. Capture pages use 20 items plus lookahead.
Empty, pending, schema-unavailable, validation, load-error and uncertain-save
states are explicit. Missing schema disables save rather than showing fake success.
The existing route loading boundary continues to show private-account loading.

Only a validated persisted response clears the composer. An intentional submit
gets a fresh UUID request identity, latched synchronously against double clicks.
On uncertainty the text/company/payload and identity stay fixed; explicit retry
uses the same payload/key and does not create another row. No automatic retries.
This conservative state does not offer editing of an uncertain submitted payload.
Inspect the inbox before deliberately starting another capture.

The entire workspace and inbox are keyed by verified user identity. Actions
revalidate the actual authenticated owner and reject a stale form's expected-owner
value; it is a guard, never permission. No captures, drafts or results use shared
module state or browser storage. Company-search responses after unmount are ignored.
Existing login/logout layout invalidation and private no-store remain unchanged.
Next navigation between inbox pages preserves the mounted form; reload/closing a
nonempty draft prompts the native unload warning. Drafts are memory-only, not
offline recovery/sync: leaving the inbox or changing accounts clears them. Do not
claim browser history behavior or live cookie/cache isolation from mocked checks.

## Data/security and scope

[Migration and verification handoff](../../supabase/v3-captures/README.md) defines
the additive owner-only captures table, optional composite restrictive company FK,
indexes, capability RPC and narrow invoker create RPC with same-key conflict checks.
Raw user content goes only through the authenticated, guarded server client.
Unknown/foreign/partial responses never become successful projections. No raw
provider/database errors are surfaced, no credentials or content are logged, and
no service-role client is used.

No Cloud access/migration, Auth changes, runner activation, schema reset, fixture
cleanup, backend permission expansion for old acceptance grants, AI, writing,
Thought, archive or destructive capture/company deletion is included.
The original bootstrap/Company Management SQL and evidence remain unchanged.

## Offline validation and remaining work

Deterministic tests cover exact text, bounds, malformed input, optional company,
RPC payload/grants, malformed/ambiguous/foreign receipts, owner-scoped association
lookups, stable ordering/paging, schema/error/empty UI, escaped full text, same-key
retry/double-submit protection, stale-owner refusal and component draft reset.
The existing synthetic HTTP adapter also exercises the real route/actions/services
across A/B changes: 55 loopback requests, 181 assertions, zero external requests.
It does not run the real Next Server Action protocol or prove live RLS/CSRF.

Synthetic-only preview: `npm run v3:ui:preview`, then
`http://127.0.0.1:3104/foundation?view=captures`; add `state=empty`, `state=error`
or `state=schema-pending` for explicit states. All actions are mocked, save simulates
failure and never claims persistence. This is distinct from the guarded application.

Actual persisted use remains blocked pending separately approved SQL deployment,
catalog/definition review and scoped two-user capture API/browser acceptance.
Both execution boundaries and all runner pins remain closed. No new acceptance
framework was introduced; existing Slice 1 authorizations cannot be reused for
capture operations. Visual review here is synthetic, not live application acceptance.


### Completed validation

- `node --conditions=react-server --test src/tests/v3-captures.test.ts src/tests/v3-workspace.test.ts src/tests/v3-application-http.test.ts`: all 32 included tests passed in the final full-suite run.
- `npm test`: **244 passed, 0 failed, 0 skipped**, including 14 Quick Capture tests.
- `npm run lint`, `npm run typecheck`, `npm run format:check`, `git diff --check`: passed.
- `node scripts/v3/offline-build.mjs`: **PASS**, optimized compilation, TypeScript, static generation and traces, with no Node network attempts and no credentials. The isolated temporary artifact is not a deployment acceptance.
- Synthetic browser review: light/dark desktop rendering, company picker, full-text cards and retained input after a simulated save failure. No real backend save or mobile browser session is claimed. Responsive rules and the existing mobile navigation regressions passed offline. Preview CSS module names now remain isolated, avoiding cross-component class collisions in the synthetic bundle.
- Review screenshots are ignored local QA files under `.qa/slice-2-captures/` (`light-composer.png`, `light-inbox.png`, `dark-inbox.png`); not curated design references or committed assets.

The temporary preview process was stopped after inspection. No Cloud requests,
private credential reads, SQL execution or acceptance-grant activity occurred.
