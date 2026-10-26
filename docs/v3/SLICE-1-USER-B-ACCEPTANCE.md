# Slice 1 — focused User B and account-switching acceptance

Status: prepared offline; **no third window is authorized or started here**.
Keep the application source pin and both API runner pins null. The shared/browser
Cloud gate remains unchanged. Reuse the existing `accept-app` launcher, private
grant schema, request plan, credential loader and consumed-run claims.

## Scope and limits

Reuse Window 2's verified User A company creation/update, nullable metadata,
ticker search, pagination, selection and theme persistence. Do not repeat those
mutations. Use retained synthetic companies, including A's Window 2 company and
an existing B-owned company, for read-only navigation checks.

**No planned company, metadata or theme writes.** Do not click create/save/theme
controls. Read-only application acceptance still needs the existing counted
identity/capability/directory RPCs and real Auth login/logout requests. No direct
SQL, administrative authorization, data cleanup or Auth configuration changes.

Keep the existing ceilings: 600 seconds including build/startup, 600 Cloud
requests, 300 HTTP requests and zero automatic retries. These are ceilings, not
targets. This is a narrower walkthrough, not a new runner/action or an assertion
that the existing grant schema implements a separate read-only permission mode.
No budget, interlock or endpoint is broadened.

**CSRF and session-expiry refresh are outside this acceptance scope.** They remain
unresolved coverage and do not require repeating this walkthrough or User A CRUD.
Do not extend a window to wait for JWT expiry or alter browser restrictions.

## Before any fresh grant

1. Obtain separate owner approval for exactly one focused window at the reviewed
   new checkpoint. Revalidate the V3 target, owner-private ACL/schema, unchanged
   approved synthetic accounts, closed pins, clean `v3` HEAD and unused port.
   Do not use private credentials or inspect their contents in this offline task.
2. Repeat only the lightweight same-tab readiness procedure: an explicitly bound
   in-app tab, tab URL/document origin equality and independently verified owned
   loopback listener. Require the owner to type READY in that exact tab and
   explicitly confirm availability for **B → A → B** credential entry. No passwords
   or identifiers in chat. Stop before grant creation if same-tab input fails.
3. Stop the static readiness listener and confirm port availability. Preserve and
   archive any fixed-path consumed grant without overwriting bytes or ACLs.
   Create one fresh run ID/grant with the correct private credential and current
   plan digests, reviewed HEAD and at most ten-minute UTC validity. Pin only the
   dedicated server application's exact grant-byte digest. Never reuse a run ID.
4. Invoke the existing launcher once. Include build time in the grant window.
   Use the same in-app tab for owner input and inspection. Do not switch to native
   Chrome-window title matching. Verify URL/origin after navigation; do not send
   requests after any origin-policy failure or expired/consumed window.

## Focused walkthrough

1. **B first:** owner logs in B. Require a verified login and B-owned directory,
   then hard reload. Record authenticated persistence and the displayed owned
   company set. Do not infer successful Auth from a recovery email or form submit.
2. **Foreign selection:** navigate to A's retained company using its approved
   private fixture reference. Require no A content or editable company form.
   Return to B's directory. Do not submit an update to a historical fixture.
3. **B → A:** logout B through the real account menu/Server Action. Require the
   logged-out form, then owner logs in A in that same tab. Confirm A's retained
   company is accessible and B's retained company is denied. These are identity
   and isolation checks; do not repeat A's metadata or theme saves.
4. **A → B and stale state:** where the existing form is explicitly non-autosaving,
   optionally enter a harmless unsaved synthetic draft in A's company editor;
   never submit it. Logout A and owner logs in B. Check directory/workspace,
   browser back/forward and hard reload. Require no A company detail, unsaved
   editor text or previous-user component state to appear for B. Distinguish
   immediate visible state from the settled navigation result.
5. Use a second explicitly bound in-app tab only if supported and within budget;
   verify its exact origin before inspecting cross-tab session changes. If omitted,
   mark concurrent-tab coverage unverified. Never extract cookies or inject a
   side-effecting page script to get around tool limitations.
6. Logout B if safely possible within the window. Local cookie/session clearing
   is not proof of immediate revocation of previously issued JWTs.

## Shutdown diagnostics and acceptance

New diagnostics preserve a first-writer stop reason in the private stop file and
fixed diagnostic events in the existing manifest. They include UTC timestamp,
`elapsedMs` since claim consumption, process-local monotonic `processElapsedMs`
where available, stage and sanitized child exit code/signal when available.
Worker elapsed time uses the shared claim start; process-local elapsed values
must not be compared as though every worker began with the controller.

Categories distinguish normal shutdown, guard refusal, external controller signal,
process exit and unknown cause. Specific reasons distinguish login credential-scope,
login origin/payload, token scope, request/response validation, grant expiry, budgets,
lease/process/state checks, persistence/lock failure, preflight/build/launch failure,
and unresolved shutdown/restoration. A credential-scope refusal is a **local gate
result**, not evidence Supabase rejected a password. A child exit code alone does
not identify who terminated the child.

The stop file is exclusive and never overwrites a prior cause. A later normal close
or owned-child termination cannot replace the original refusal. Null-pin rejection
still precedes private I/O; preflight failures without an initialized trusted claim
have fixed console diagnostics only. Unwritable storage cannot guarantee durable
evidence: execution remains terminal, and closure/restoration reports incompleteness.
No raw errors, request/response bodies, credentials, account identifiers, cookies or
tokens enter these diagnostic fields. Existing private fixture evidence is retained.

On first unexpected failure: stop, preserve evidence and do not resubmit/restart.
Record the first reason, event order, child status, request counts and any incomplete
evidence. Stop only the owned process; verify listener removal, null pin restoration
and clean Git. Never delete consumed claims or retry the same grant. Abrupt OS/power
termination can still prevent a final write; mark that outcome unknown/inconclusive.

PASS requires observed B authentication, B-owned reload, both ownership denials,
B → A → B switching, navigation/stale-state checks, complete evidence and verified
shutdown/relocking. Report per-check results. Mark omitted or unsupported checks
unverified rather than declaring full application acceptance.

## Offline checkpoint validation

- Focused dispatch, HTTP and shutdown tests: **37 passed, 0 failed, 0 skipped**
  (`node --conditions=react-server --test src/tests/v3-shutdown-diagnostics.test.ts src/tests/v3-application-dispatch.test.ts src/tests/v3-application-http.test.ts`).
- Full deterministic suite: **230 passed, 0 failed, 0 skipped** (`npm test`).
- `npm run lint`, `npm run typecheck`, `npm run format:check` and
  `git diff --check`: passed.
- `node scripts/v3/offline-build.mjs`: production compilation, typechecking,
  static generation and tracing passed with no Node network attempts. The
  restricted dependency-link attempt failed before compilation; the same check
  passed with permission to link installed dependencies into its temporary folder.
  No application server was started; the artifact is not deployment acceptance.

Regressions cover allowlisted categories and secret scrubbing, pre-send refusals,
expiry/budgets/process and lease checks, abandoned locks, short/zero/throwing writes,
fsync failures, first-cause preservation, normal/unknown closure, child exits/signals,
controller cancellation and failed diagnostic persistence. These are synthetic
offline results, not evidence of User B live browser acceptance.
