# Slice 1 — guarded Next.js application acceptance

Status: offline dispatch support implemented; **live application execution remains
unauthorized**. The committed application pin and both API runner pins are null.
The original shared/browser Cloud execution interlock remains unconditional.
The completed 92/92 Cloud API acceptance and 141 mocked HTTP checks are retained;
neither is proof of production browser acceptance.

## Compilation versus application execution

`node scripts/v3/offline-build.mjs` verifies a real isolated Next 16.4.0 production
Webpack build. It excludes environment/private files, strips inherited secrets,
proxies and Node overrides, links installed dependencies without downloading, and
denies Node fetch/sockets/HTTP/DNS/datagrams during compilation. No grant or
credentials are needed. The temporary artifact is discarded and is not deployable.

`node scripts/v3/offline-server-smoke.mjs` additionally starts the real closed-gate
production artifact on **127.0.0.1:3103**, checks actual Windows listener ownership,
requires `/auth` to return private/no-store 503 and an actual generated
`/_next/static/` JavaScript asset to return 200, then
stops only its child and verifies listener removal. A smoke-only preload denies
outbound Node networking while permitting this one numeric loopback listener.
Its literal-address lookup is resolved in memory, never through DNS. This is not
an activated Cloud server or successful authentication test. The build preload
continues to deny every listener. Both mechanisms are Node-level defense in depth,
not an OS sandbox against arbitrary native code.

The ordinary Cloud launcher actions `dev/build/serve/test` still deny execution.
A new **dormant** action, `node scripts/v3/cloud.ts accept-app`, dispatches the real
production Next server only after the separate server application approval below.
Do not execute it now. There are no target, origin, command, credential, pin or
budget overrides accepted by this command.

## Separate server-only authority

The unexported `approvedApplicationGrantSha256` in
`scripts/v3/application-authority.ts` is committed as **null**. Null rejects before
any private-file read, process launch or network request. Approval metadata and
environment variables cannot activate it. A future separately approved source edit
must pin the exact SHA-256 of the private grant's raw bytes, checked before JSON
parsing, credential reads or claim creation. Whitespace changes invalidate the pin.

The existing server auth client, Proxy and identity fetch use the server-only
`src/server/auth/application-target.ts` adapter. With no source approval they use
exactly the existing public target resolver; local behavior is unchanged and Cloud
remains denied. During an approved server window they use the pinned private V3
target and guarded fetch. The shared resolver, browser Supabase factory and API
runner interlocks do not receive that authorization. A response CSP restricts
browser connections and form submissions to the owned app; no browser Cloud SDK
permission is introduced.

Reuse the existing owner-private location `%USERPROFILE%\.my-kravv-v3-private`,
its restricted owner/SYSTEM/Administrators ACLs, no links or Git ancestors, and its
existing `credentials.json` schema. `scripts/v3/private-files.ts` extracts the
existing API runner's file/ACL checks without changing their behavior. No generic
environment credential fallback exists. Passwords, tokens and raw Auth responses
are never written to evidence or stdout. Only the publishable key enters public
build configuration; test passwords remain private and are entered by the owner
in the controlled login form, never placed in NEXT_PUBLIC variables.

### Future private application grant (not created in this checkpoint)

Fixed filename: `application-run-approval.json`, separate from both API grants.
Its strict schema contains exactly:

- `purpose`: `slice1-application-only`.
- `projectRef`: `kjcvgjfwlmyfroiqlbmw`.
- `apiOrigin`: `https://kjcvgjfwlmyfroiqlbmw.supabase.co`.
- `runId`: fresh UUID, never reused.
- `head`: full reviewed committed HEAD on `v3`.
- `users`: `{ A: approvedSyntheticUuid, B: distinctApprovedSyntheticUuid }`.
- `issuedAt`, `expiresAt`: UTC ISO timestamps, fresh and at most ten minutes apart.
- `maxCloudRequests`: 600; `maxHttpRequests`: 300; `overallMs`: 600000; `retries`: 0.
- `planSha256`: `applicationPlanDigest(runId, users)` from the committed module.
- `credentialSha256`: exact raw-byte digest of the existing private credential file.

No UUIDs, digests, grant contents or secrets should be returned in chat. The owner
must confirm the UUID/email pairs and both confirmed synthetic accounts privately.
An existing fixed-path grant must be archived only with owner authorization,
preserving bytes and ACLs; the launcher neither creates nor overwrites grants.

## Exact future activation and restoration gates

1. **Separate owner approval:** authorize one application window, its synthetic
   write allowance, private grant creation and one runner-only source pin edit.
   Current authorization covers offline implementation only.
2. Prepare one fresh grant privately, pin its exact bytes in the single source
   constant, and verify only that pin differs from the reviewed committed HEAD.
   Keep both API pins null. No application environment boolean is involved.
3. Invoke once, from `v3`: `node scripts/v3/cloud.ts accept-app`. The launcher
   validates branch/HEAD, index, tracked/untracked scope, pin bytes, ACLs, target,
   accounts, credential/plan digests, expiry and unused port. It requires at least
   60 seconds remaining; prepare immediately before invocation because build time
   consumes the same ten-minute window. Insufficient walkthrough time means STOP,
   not a grant extension. No automatic renewal or second invocation.
4. Create the shared namespace `run-<uuid>.consumed.json` with exclusive `wx` and
   fsync, before any Cloud call. Existing/ambiguous claims refuse replay. A partial
   initialization still consumes the run; never delete claims to recover.
5. Build reviewed source in a disposable isolated workspace, with public V3 values
   only and all Node network denied. Recheck repository scope after the build.
   Verify the exact V3 identity RPC under the shared Cloud budget before Auth/data
   I/O. No prior identity receipt can substitute for this request.
6. Spawn one production `next start --hostname 127.0.0.1 --port 3103`, no dev server,
   without inherited credentials/proxy/Node overrides. Persist the owned PID.
   Confirm **all** port-3103 Windows listeners are 127.0.0.1 and owned by that PID
   before opening application dispatch. Wildcard/IPv6/other-owner evidence fails.
7. On `APPLICATION_WINDOW_READY`, use a fresh owner-controlled browser profile for
   the checklist below. The launcher does not open a browser, enter passwords,
   create fixtures automatically or report acceptance PASS.
8. Stop with Ctrl+C, on first unexpected failure, or at expiry. The controller
   stops only the owned process tree, verifies listener removal, persists closure,
   and restores the exact committed null-pin source if no concurrent edit exists.
   Verify clean Git status, both API pins null and shared/browser gate unchanged.
   No source restoration overwrites concurrent edits. A replay encountering an
   existing open/ambiguous consumed window must not restore the pin beneath its
   original controller; it stops for owner shutdown/restoration review instead. If shutdown cannot be
   verified, stop and ask the owner to inspect the recorded PID before restoration.
   Never retry/renew/clean up automatically.

## Shared budgets, scope and durable evidence

The controller, preload, Proxy and Next workers share one private file ledger,
exclusive creation lock, fsynced evidence and atomically replaced state. No worker
has its own independent request allowance. The ledger also pins the controller and
owned Next process IDs; only that controller, the owned Next PID and its direct
worker children may use it. A separately started server cannot inherit an active
window merely by loading the source pin. Unexpected deeper process nesting fails
closed and needs review rather than a runtime exemption. Every permitted Cloud transmission is
reserved and durably recorded first, including identity, login, refresh, logout,
JWKS, user, capability, directory and owned table requests. The HTTP preload counts
all dispatched loopback requests including assets, RSC, prefetch and actions.
The window permits at most **600 Cloud** and **300 HTTP** requests, **600 seconds**
including build/startup, and **zero automatic outbound retries**. Per-request/body
read deadline is at most ten seconds, bounded by grant expiry; response size is
limited to 256 KiB. SDK fallback/retry attempts cannot transmit after a failure.

The exact HTTPS origin is pinned; redirects, admin/Auth mutation, SQL, DELETE,
unknown endpoints, foreign accounts and unapproved operations are refused. Only
current-window tokens returned from the approved accounts' password login can
access data. JWT subject/issuer/audience/role/expiry and confirmed returned account
identity are checked in addition to the existing SDK/server identity checks.
Only current-window registered refresh tokens are accepted; an older session is
not a shortcut into the window. Refresh availability remains a live prerequisite.

Mutation ceilings: **one new company per user**, one name-only rename and one
metadata update to that returned new ID, and **two theme saves per user**. Company
names must be `v3-slice1-app:<runId>:A` or `:B` with an optional bounded synthetic
ASCII suffix. Use synthetic metadata only. No owner/ID updates, upserts, deletes or
historical fixture edits. Settings writes use only the approved user's owner/theme
INSERT or theme-only UPDATE. Responses must confirm the approved owner, exact
fields, successful status, single row and actual server-generated company UUID.
Both list and explicitly requested single-object PostgREST responses are handled.
Expected attempts to mutate a foreign/historical company are recorded and denied
without transmission; they do not grant additional write scope.

Intended fixture values (excluding account identifiers), verified fixture IDs,
fixed status/category counters and final theme values remain **private**. No raw
Auth bodies, passwords, keys, authorization headers, cookies, tokens or raw errors
are persisted. Complete-byte write plus fsync is required before transmission;
verified-ID evidence and durable state are required before dependent requests.
An uncertain response never invents an ID or retries a write. Failed/incomplete
persistence, stale ten-second controller heartbeat, budgets or expiry fail closed.
An abandoned lock is never broken automatically. Parent disconnect stops the root
child; the lease separately denies Cloud work in surviving workers. Abrupt OS or
power termination can leave incomplete evidence or a source pin needing manual
restoration; the consumed claim still prevents replay.

Preserve `run-<uuid>.application.manifest.jsonl`, state, stop/consumed claim and
fixtures. No cleanup, Auth changes or implicit theme restoration. Closure means
**owner review required**, never automatic PASS. The owner walkthrough must record
original themes and review retained company baselines before/after; this launcher
is a bounded dispatcher, not a replacement for those acceptance assertions.

## Required live Next/browser checklist — still pending

1. **Preflight:** approved commit/clean tree, guard closed, private ACL/schema,
   exact target, current approved UUID/email pairs, source/grant/plan/credential
   digests and fresh claim. Record original settings and company snapshots under
   the same request cap. No unaudited probe outside the counted window.
2. **Hydration/auth:** start the owned production-mode process after an approved
   Cloud-configured build, or explicitly document a dev-only result. Load `/auth`,
   inspect hydration/runtime errors, verify anonymous private-route redirect, log
   in A and verify httpOnly/session-cookie behavior. Use a fresh isolated browser
   profile; no cookies, tokens, HAR or credential-filled DOM snapshots in reports.
3. **Real Server Actions:** create A's one fixture, rename it, update metadata
   including nulls, and confirm the rendered persisted result after reload. Submit
   invalid input; require error/no write. Repeat within the B write allowance.
   Any unconfirmed response leaves an uncertain write, never an automatic retry.
4. **CSRF/origin:** obtain the real action identifier from the owned page in memory.
   Submit one harmless same-value mutation using an explicitly foreign Origin and
   valid synthetic session. Require actual Next origin/CSRF rejection and **no
   downstream mutation transmission**. Do not invent an action identifier and
   mistake “action not found” for CSRF acceptance. Do not change allowedOrigins.
5. **Navigation/isolation:** directory pages 0/1, name/ticker/literal searches,
   selected owned company outside current results. Logout A, log in B using actual
   returned cookies; test foreign company URL/update denial. Exercise browser
   back/forward/reload, Router Cache/RSC responses and two concurrent tabs. Verify
   no A names, metadata or unsaved editor state appears for B, and vice versa.
6. **Theme/refresh:** save/read each account theme, reload and switch accounts;
   inspect stale optimistic theme/editor/context state. Test actual SSR cookie
   refresh only when a safely available expiring synthetic session allows it inside
   the window. Do not forge a JWT, reset Auth, extend the run or claim refresh
   passed merely because login issued a cookie. If unavailable, mark that check
   pending and propose a separately scheduled refresh-only window.
7. **Finish:** logout both owned sessions where possible within the budget; do not
   claim immediate revocation of old JWTs. Compare retained-record snapshots and
   capture sanitized screenshots without identity/credential/session details.

## Failure and acceptance criteria

One harmless foreign-Origin probe (`https://csrf.invalid`) is permitted to reach
actual Next CSRF handling; a second probe/other origin is denied. Server-side
mutations independently require the owned Origin. No allowedOrigins relaxation is
introduced. Require actual Next rejection with the real action ID and no transmitted
mutation; a custom gate failure or unknown-action response alone is not CSRF PASS.

On hydration/cache leakage, failed assertion, uncertain mutation, unexpected target,
request budget/deadline, evidence failure or unexpected response: stop the browser
walkthrough and controller; preserve evidence and do not retry. Logout records
local session clearing, not immediate revocation of every previously issued JWT.

PASS requires production hydration, actual Auth/cookie/Server Action/CSRF behavior,
A/B account switching and navigation-cache isolation, all requested company/theme/
pagination checks, retained-record comparison, complete evidence and verified
shutdown/relocking. Failed assertions are FAIL. Interruption, missing refresh
coverage, uncertain writes, incomplete evidence or partial walkthrough are
INCONCLUSIVE for full application acceptance. Offline mocks and a closed-gate
server smoke are explicitly not live PASS.

## Offline shutdown-diagnostics follow-up

Shutdown diagnostics now use the fixed vocabulary in
`scripts/v3/application-diagnostics.ts`. The existing manifest and exclusive stop
file record the first reason, stage, UTC timestamp and elapsed execution time;
controller diagnostics also include available sanitized child exit code/signal.
Authority refusals before transmission are recorded without credentials or user
identifiers. Preflight failures before a trusted initialized claim have fixed
console diagnostics only. Persistence failure remains terminal; it cannot prevent
safe null-pin restoration after verified shutdown, and it cannot be reported as
complete durable evidence. Later cleanup preserves the first stop-file cause.

This does not reconstruct the missing Window 2 cause, and historical evidence is
not rewritten. No grant schema, target, allowed operation, request/time budget,
process-ownership check or shared/browser interlock is expanded.

The next proposed walkthrough is [focused User B/account-switching acceptance](SLICE-1-USER-B-ACCEPTANCE.md),
using retained fixtures with no planned company, metadata or theme writes. CSRF
and expiry-timed refresh remain separate unresolved coverage. A fresh window still
requires separate explicit owner approval and verified same-tab readiness before
any private grant creation or source-pin activation.

## Offline validation

Run focused dispatch tests, the full deterministic suite, lint, TypeScript/Next type
generation, formatting, diff checks and `node scripts/v3/offline-server-smoke.mjs`.
The smoke includes a full offline production build. Record actual results in the
checkpoint report. Synthetic pins exist only in in-memory module copies; the
actual application/API pins stay null. Windows ACL reuse is regression-tested with
synthetic policy evidence, not re-inspected against private owner files here.
The live configured artifact, active private ACL/session behavior, browser cookies,
CSRF, refresh and cross-tab caching remain separately authorized acceptance work.

### Recorded dispatch checkpoint results

- `node --conditions=react-server --test src/tests/v3-application-dispatch.test.ts`:
  **25 passed, 0 failed, 0 skipped**.
- `npm test`: **220 passed, 0 failed, 0 skipped**, including the existing 141
  mocked HTTP assertions and both dormant API runner regression suites.
- `npm run lint`, `npm run typecheck`, `npm run format:check`,
  `git diff --check`: **PASS**.
- `node scripts/v3/offline-server-smoke.mjs`: **PASS**, including optimized
  Webpack compilation, TypeScript, static generation/tracing, actual production
  startup, owned IPv4-only listener, guarded private 503, real static asset 200,
  verified shutdown and discarded temporary artifact. No Node network attempt
  marker, private credential/grant reads or Cloud calls occurred.

The temporary ledger replacement and loopback checks required Windows sandbox
permission for only their own synthetic files/processes. No validation skipped
security checks to pass. The first smoke attempts exposed harness issues (numeric
loopback lookup under the deny preload and choosing a Proxy-blocked icon for a
static check), plus a test-only environment typing error; these were corrected
and the complete final build/smoke passed. None was live application acceptance.
