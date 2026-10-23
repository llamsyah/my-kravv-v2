# Slice 1 — final build readiness and proposed live application window

Status: offline production compilation is verified; live execution is still
unauthorized. This is a proposal, not a grant or an implemented application launcher.
Preserve the completed 92/92 Cloud API and 141 offline HTTP checks. Do not repeat
the database bootstrap, migrations or RLS acceptance.

## Compilation and execution are different boundaries

`scripts/v3/cloud.ts` validates action/target and then unconditionally invokes
`assertCloudExecutionReady()`. It never dispatches Next. Configuring the correct
project therefore cannot make `v3:cloud:build`, `dev` or `serve` work. Independently,
`resolveV3Target()` invokes the same gate before any application Cloud client or
identity request. Neither gate is changed here.

The legitimate build-only command is now:

```powershell
node scripts/v3/offline-build.mjs
```

It copies source/configuration inputs into a disposable temporary directory, omits
all environment files (including `.env.example`), strips inherited credentials,
project/proxy configuration and Node overrides, and links installed dependencies
without downloading anything. Source, Next config and the application guard are
unchanged. A build-only CommonJS preload denies fetch, Node sockets/listeners,
HTTP(S), DNS and datagrams, including inherited Node workers. Telemetry is disabled.
This is defense in depth for this reviewed Node/Webpack path, not a general OS
network sandbox against arbitrary native code. Any intercepted attempt leaves a
fixed marker and fails the verification, even if Next catches the exception.

The command runs **Next 16.4.0 `build --webpack`**, including optimized compilation,
TypeScript, page-data collection, static generation and build tracing. It passed
with no intercepted network attempts. Private routes remain dynamic; no user/data
render is activated. No fake credentials, SDK mocks or guard replacement are used.
The temporary artifact is discarded after verification; remove only the exact
temporary dependency link before deleting the checked temporary directory.
Windows may require filesystem permission for the temporary junction.

This is a real offline production-build pass, **not** a deployable Cloud-configured
artifact, Turbopack verification, running-server acceptance or permission to run
`next start`. No publishable key was embedded. The normal Cloud launcher remains
closed. A subsequent authorized Cloud-configured build must be rebuilt and tested;
do not reuse this temporary artifact as an activated application.

## Smallest next owner approval: bounded application support, not live execution

Approve an offline implementation of a narrow application window and launcher,
followed by a separate decision to execute it. Do not merely replace the shared
gate with a no-op or permanently allow the Cloud profile.

Reuse the private credentials/ACL validation, exact project/marker checks,
source-pinned raw grant digest, fresh run UUID, exclusive consumed claim,
complete-byte/fsync evidence and default-deny pattern already reviewed. The old
API runner and all claims/manifests remain unchanged. Keep the browser-facing
guard closed for browser SDK use (the current V3 UI uses Server Actions, not the
unused browser Supabase factory). Any application-window branch must be server
only, source-approved, exact-target and expiry-bound; never an environment boolean.

The future controller must consume one private application grant before launch,
verify the one temporary source diff, and start one Next process on explicit
`127.0.0.1:3103` with a sanitized V3-only environment. Verify port availability and
actual IPv4 listener first; no wildcard or IPv6 listener is permitted in this
first application window. Bind via Next's documented `--hostname`/`--port`
arguments, not a default hostname. No V2 credentials, administrative key or owner
password is put in NEXT_PUBLIC values. The publishable key is public by design;
test passwords stay private and are entered only into the controlled login flow.

Instrument the existing identity fetch and SSR SDK fetch points with one shared
controller-owned budget/abort state across page, Proxy and worker execution. It
must count **every** outbound Auth/identity/REST/RPC request before transmission,
pin the HTTPS origin, reject redirects and deny after expiry/failure. Do not use a
per-worker in-memory counter. Block unreviewed endpoints, privileged auth/admin,
SQL, DELETE, V2 and AI/provider destinations. Browser traffic may reach only the
owned loopback app. No automatic browser/action retries; an unexpected Cloud
failure latches the run closed so SDK retries cannot transmit additional calls.
Keep existing identity/RLS/ownership checks and form validation intact.

Prefer small hooks at the existing client/Proxy identity boundaries and the
existing browser tool for the walkthrough. Do not create a second application,
test-only production endpoints, a generic remote execution service or a new E2E
framework. The exact grant schema, server-only gate implementation, cross-worker
budget, shutdown and zero-retry enforcement need deterministic review **before**
activation. They are not implemented or authorized by this document.

### Planned activation sequence after support is reviewed

Reuse the Cloud entry point with a proposed `accept-app` action:
`node scripts/v3/cloud.ts accept-app`. **That action does not exist today; do not
execute it.** Keep its grant in the existing owner-private directory as
`application-run-approval.json`, separate from both API grant filenames. Archive
an existing fixed-path application grant only with owner authorization, preserving
bytes/ACLs; never overwrite evidence.

The single future invocation must: verify the approved HEAD/clean tree and closed
pins; validate credentials/ACLs and the public request plan; create one fresh grant
after owner approval; verify its own bytes/digests/identities; consume the run claim
durably; make only the reviewed temporary server-application pin edit; verify that
exact diff; build unchanged source for the approved V3 configuration without
prerender network; launch one loopback process; verify listener/target; then open
the isolated browser. Grant expiry bounds build, startup and testing together; no
clock extension after build. The API runner pins remain null throughout.

Application authorization must stay server-only; do not import private-file or
credential code into the shared/client-safe resolver. The exact minimal wiring is
part of the separately approved support review, with tests proving that ordinary
metadata, configuration and the unused browser SDK cannot authorize execution.

## Proposed one-window execution envelope (subject to owner review)

- One fresh application run, two existing approved/confirmed synthetic accounts,
  exact V3 project `kjcvgjfwlmyfroiqlbmw` and marker. Do not create Auth users.
- Maximum **600 seconds**, maximum **600 Cloud requests**, maximum **300 loopback
  HTTP requests** including assets/RSC/prefetch/actions; zero automatic retries.
  These are ceilings, not a request target. Proxy identity checks, verified-user
  reads and normal Next prefetch mean browser navigation costs more than an API
  assertion. Keep normal prefetch enabled so cache behavior is actually tested.
  If the full checklist cannot fit, stop and report partial coverage; never raise
  limits or skip checks automatically. Confirm the final exact plan during support
  implementation; no live network is used to estimate the budget here.
- A fresh grant valid for at most ten minutes; start only with enough remaining
  time. Consume it once. Never extend, renew or replay it automatically.
- At most **two new companies**: one per user with a fresh run-specific prefix.
  Each may receive one rename and one metadata update. No deletion/archive.
- At most **four successful theme saves** total, only for these users. If settings
  already exist, update theme only; otherwise at most one settings insert per user.
  Record original theme values, but retain final values without implicit restore.
- Use the 26 retained API fixtures for read-only pagination/search/selection;
  baseline and snapshot existing company records before/after. Never edit a prior
  fixture or assume the accounts/setting baselines are empty.

## Proposed actual Next/browser checklist

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

## Failure, shutdown and restoration

Persist intended synthetic mutations before send; persist exact returned IDs and
confirmed fields before dependent requests. Never persist login bodies, cookies,
tokens, passwords, headers, raw server responses or personal identifiers in public
reports. Keep detailed fixture identifiers only in the approved private manifest.
Use fixed stage/category/status diagnostics and request/verification counters.

On failed preflight, do not launch. On a runtime failure, unexpected target,
budget/expiry, network/CSRF surprise, hydration error or uncertain write: abort
outbound work, stop browser automation and stop only the owned process tree.
Do not retry the action, restart Next, renew a grant or clean up data.

The future controller must retain the exact child PID/tree, stop it in a finally
path and on a hard watchdog, and verify its loopback listener is gone. Only then
restore the exact original source pin/gate bytes and remove credentials from the
child/browser session. Delete only disposable build/browser output after evidence
is preserved; do not touch owner profiles or prior receipts. Verify both API runner
pins are null, shared application gate is closed, Git is clean at the approved
baseline and `main` is unchanged. Do not commit an activated source pin or publish
a built artifact containing one. Preserve grant, claim, manifest and fixtures.

PASS requires the actual production server, every required browser/HTTP check,
complete durable final evidence, no failed/uncertain mutation and verified shutdown
and relocking. A failed assertion is FAIL; interruption, uncertain write, missing
refresh coverage, dev-only testing or incomplete durable evidence is INCONCLUSIVE
for full application acceptance. An offline build pass alone is never live PASS.

## Offline validation for this readiness checkpoint

- Isolated full `next build --webpack`: PASS (compilation, TypeScript, static
  generation and tracing), no intercepted Node network attempts; output discarded.
- New build-isolation tests: 3 PASS; combined focused build/HTTP tests: 5 PASS.
- Full deterministic suite: 194 PASS, 0 failed, 0 skipped.
- Lint, TypeScript/Next type generation, formatting and diff checks: PASS.
- Existing Cloud launcher and both API/application execution boundaries: unchanged.

No Cloud-configured artifact, browser session, grant or credential was created.
The compilation result supersedes the earlier offline checkpoint's unverified
build status, without superseding its outstanding live browser acceptance.
