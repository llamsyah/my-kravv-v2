# Slice 2 — dormant capture-only API acceptance

Status: prepared offline; **no live run, private credential access, grant creation
or source-pin activation in this checkpoint**. Owner reported migration/catalog
and definition acceptance on `kjcvgjfwlmyfroiqlbmw`. That does not itself grant
execution. Application, Slice 0 and Slice 1 runner controls remain unchanged.

## Executable plan and limits

Entry point after separate explicit confirmation and successful security preflight:

```powershell
node scripts/v3/capture-acceptance-runner.ts
```

No arguments, environment files or overrides. Source-level
`approvedGrantSha256: string | null = null` denies before private I/O/network.
Only a separately authorized temporary source edit may pin exact private grant
bytes. The shared application Cloud gate is not opened. The runner specializes
the reviewed Company API kernel and reuses shared private-file/ACL, target and
Auth-observation validators; there is no general remote execution framework.

Pure plan/digest: `buildCaptureAcceptancePlan(spec)` in
`scripts/v3/capture-acceptance-plan.ts`, `captureAcceptancePlanDigest(spec)` in
the runner. Spec is `{profile,projectRef,apiOrigin,runId,users:{A,B}}`; profile is
`my-kravv-v3-cloud-dev`, origin is exactly
`https://kjcvgjfwlmyfroiqlbmw.supabase.co`, marker purpose is
`disposable-v3-slice0-cloud`, schema version 1. No generic/V2 fallback.

Passing plan: **31 requests / 31 verified stages**. Hard limits: **36 requests,
180 seconds total including private preflight, 10 seconds per request including
response reads, zero automatic retries**. Earlier grant expiry wins. Identity,
Auth, negative probes and deliberate deduplication assertions all count. The five
unused request slots do not authorize extra requests; execution follows only the
fixed 31-step plan. Redirects and oversized/malformed responses fail closed.

| Requests (1-based) | Fixed operation / expected result                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                  | Verify exact V3 environment identity.                                                                                                                                                           |
| 2–7                | A login, confirmed `/auth/v1/user`, capture capability 1; then the same for B.                                                                                                                  |
| 8                  | Select one existing A-owned Company (stable ordering, limit 1); require exactly one owned row. No Company creation.                                                                             |
| 9–10               | Require each fresh run-specific owner/request key to be absent. All prerequisites above pass before capture creation.                                                                           |
| 11–12              | Create A capture associated with that Company; create B capture without Company. Require HTTP **200** for SETOF RPC, exactly one valid generated UUID/owner/key/text/association/timestamp row. |
| 13–14              | Re-read each saved capture by the verified generated ID; compare every returned field exactly.                                                                                                  |
| 15–16              | Explicit same-key/same-payload RPC assertions, once each. Require the same complete row/ID/timestamp; not automatic execution retries.                                                          |
| 17                 | Reuse A's key with changed text; require 400/P0001 and the exact known conflict message in memory, without logging that response.                                                               |
| 18–19              | A reads B's generated ID, B reads A's ID; require HTTP 200 empty arrays.                                                                                                                        |
| 20                 | B associates with A's Company using B's already-saved key; require exact known `Company unavailable` rejection, not merely any P0001.                                                           |
| 21                 | B directly INSERTs A ownership using A's existing request key; require 403/42501.                                                                                                               |
| 22–23              | B PATCH/DELETE privilege probes; require 403/42501. Contradictory verified A/B ID filters guarantee no matching row.                                                                            |
| 24–25              | Anonymous capture read and create-RPC invocation; require permission denial (401/403 with 42501).                                                                                               |
| 26–27              | Owner re-reads both retained fixtures; all fields must remain identical.                                                                                                                        |
| 28–31              | Logout A, unauthenticated user request; logout B, unauthenticated user request. Local token clearing is not proof of immediate revocation of prior JWTs.                                        |

Raw synthetic text contains the fresh run namespace, whitespace, newlines and
Unicode. Request UUIDs are deterministic from fresh run ID + actor, not user
identifiers. Retain **at most two new Captures**, no Company/settings writes or
cleanup. Existing capture contents are not bulk-read or copied into evidence.
Negative INSERT/RPC probes reuse already-verified owner/request uniqueness keys;
they cannot intentionally create a third capture. The PATCH/DELETE predicates
require one row ID to equal two distinct generated UUIDs, so remain nonmatching
even if privileges are broader than expected. These checks establish privilege
denial; they do not claim a destructive row-level mutation was exercised.

## Future private preflight, grant and restoration

Only after the owner explicitly confirms this final plan:

1. Revalidate branch/HEAD and the exact reviewed preparation scope (or its later
   separately approved checkpoint). Reject unrelated source changes. Preserve all
   historical grants/manifests/consumed claims; never compare a fresh grant's bytes
   with an archived grant as though the archive were its expected contents.
2. Recheck `%USERPROFILE%\.my-kravv-v3-private`: outside all Git checkouts, no
   symlink/junction ancestors, private `.gitignore`, regular single-link files,
   restricted owner/SYSTEM/Administrators ACLs. No automatic ACL repair.
3. Validate the existing `credentials.json` privately: exact V3 project/origin,
   publishable-key type (no service role), distinct approved A/B UUID/email pairs,
   matching reserved synthetic accounts and no inherited generic/V2/proxy/TLS
   overrides. Do not print identities, passwords, keys or credential hashes.
   Runtime login/user checks independently validate actual identity/confirmation.
4. Create exactly one fresh private **`slice2-capture-run-approval.json`**. If it
   already exists, stop for preservation/archival authorization; never overwrite.
   Its strict schema is the following (placeholders are documentation only):

```json
{
  "purpose": "slice2-capture-api-only",
  "projectRef": "kjcvgjfwlmyfroiqlbmw",
  "apiOrigin": "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
  "runId": "<fresh UUID>",
  "users": { "A": "<approved UUID>", "B": "<approved UUID>" },
  "issuedAt": "<fresh UTC ISO timestamp>",
  "expiresAt": "<UTC ISO timestamp; maximum ten minutes after issue>",
  "maxRequests": 36,
  "overallMs": 180000,
  "retries": 0,
  "planSha256": "<SHA-256 of JSON.stringify(buildCaptureAcceptancePlan(spec))>",
  "credentialSha256": "<SHA-256 of exact credentials.json bytes>"
}
```

5. Temporarily pin this grant's exact raw-byte SHA-256 only in the dedicated
   capture runner. Verify one pin-line change against the reviewed preparation
   snapshot, fresh validity, matching identities/digests and unchanged other pins.
   No credential/grant contents or private hashes in chat/Git. A grant alone never
   authorizes execution. Null pin refuses before reads; digest mismatch refuses
   before grant parsing, credential access or claim creation.
6. Run the entry point exactly once. A shared `run-<UUID>.consumed.json` exclusive
   claim is fully written/fsynced before any request. Concurrent/replayed/partial
   claims or unwritable evidence storage refuse without removing historical evidence.
   No fresh grant/retry on any failure, expiry or uncertain result.
7. After process exit or confirmed termination, immediately restore the capture
   pin to null and compare the full working tree with the reviewed starting scope.
   Preserve prepared uncommitted files if no checkpoint commit was authorized;
   do not claim Git is clean in that case. Do not alter the application/API pins.

## Evidence and interpretation

The existing private `run-<UUID>.manifest.jsonl` pattern retains planned synthetic
fixtures and durable sending events before transmission. A sending event means
an intended/possibly uncertain write, not success. Exactly validated generated
IDs are durably recorded before dependent requests. Full-byte writes and fsync
are required; short/zero/throwing writes or fsync failure stop further requests.
Lost/invalid create responses leave uncertain writes without invented IDs.

Final PASS requires all 31 verified stages and a durably written final passed
record. Unexpected responses are FAIL; interrupted transport or incomplete
evidence is INCONCLUSIVE for the affected operation. Preserve everything and stop.
Sanitized failure diagnostics contain only fixed stage/category, request index,
received numeric HTTP status and allowlisted Auth reason. No raw responses/errors,
emails/passwords/API keys/tokens/headers enter logs or manifests. Approved synthetic
fixture bodies and private owner bindings stay in owner-private evidence only.

PASS is **API persistence/ownership acceptance only**. Browser hydration, Server
Actions/CSRF, navigation-cache isolation and session-expiry refresh are not tested;
Slice 1 application acceptance stays PARTIAL. No browser/UI, SQL/Auth configuration,
Writing Workspace, migration rerun or cleanup operation is authorized by this plan.

## Offline preparation results

- Focused `src/tests/v3-capture-acceptance.test.ts`: **11 passed, 0 failed, 0 skipped**.
- Full `npm test`: **255 passed, 0 failed, 0 skipped**.
- `npm run lint`, `npm run typecheck`, `npm run format:check`, and `git diff --check`: passed. New untracked artifacts were also inspected with no-index whitespace checks.
- Regression coverage includes the null-pin boundary, byte/whitespace grant mismatch before parsing/credential/claim access, grant/target/identity/budget drift, concurrent consumed claims/replay, prerequisite failures before writes, malformed/generated-ID responses, redirects/timeouts/JSON failures, secret-free evidence, and full-byte/fsync failures before initial and dependent transmissions.
- No original tracked file changed. Four new preparation files remain uncommitted at baseline `fe41c898c0b8139c4bc0f5c835709c993b6c84bb`; the new and unrelated pins remain null. No owner-private file, real grant, Cloud endpoint, SQL or browser was accessed.
- Pending before live execution: explicit final-plan confirmation, fresh local private credential/ACL/target preflight, new grant and temporary dedicated pin. No live preflight or API PASS is claimed here.
