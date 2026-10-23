# Slice 1 Company Management — dormant API acceptance

Prepared offline after owner-reported migration/catalog acceptance. No live request,
credential read, grant creation, application activation or SQL execution was part of
this implementation. Passing mocks are not live acceptance.

## Entry points and authorization

- Public plan: `scripts/v3/company-acceptance-plan.ts`,
  `buildCompanyAcceptancePlan(spec)`; digest helper:
  `companyAcceptancePlanDigest(spec)` in the runner. The specification is exactly
  `{ profile, projectRef, apiOrigin, runId, users: { A, B } }`.
- Dormant runner: `scripts/v3/company-acceptance-runner.ts`. A future separately
  authorized invocation is `node scripts/v3/company-acceptance-runner.ts`, without
  arguments, overrides or environment files. **Do not execute it in this checkpoint.**
- Its own source constant `approvedGrantSha256: string | null = null` denies before
  private file reads/network. Populated target metadata, credentials or grant JSON
  alone never authorize execution. No CLI/environment override supplies the pin.
  A future owner-approved, temporary runner-only edit must pin the SHA-256 of the
  exact grant bytes before parsing, credential reads or consumed-claim creation.
- The existing application interlock and Slice 0 runner are unchanged. The new
  runner reuses pure target, Auth-observation and Windows ACL validators. Its
  bounded transport/private-file/manifest kernel follows the existing runner,
  specialized to this fixed plan; there is no injectable production transport,
  general remote command mode or automatic migration/build invocation.

Target is exclusively `kjcvgjfwlmyfroiqlbmw`,
`https://kjcvgjfwlmyfroiqlbmw.supabase.co`, profile
`my-kravv-v3-cloud-dev`, marker purpose `disposable-v3-slice0-cloud`, version 1.
Authenticated capability must be exactly 1 for both users. Ordinary user sessions
perform all data/RLS assertions. JWT issuer, subject, role and expiry are checked
against the target and approved identities; `/auth/v1/user` confirms each account.
There is no service-role access or generic/V2 credential fallback.

## Private prerequisites — future authorization required

The fixed root remains `%USERPROFILE%\.my-kravv-v3-private`, outside every Git
checkout, without symlinks/junction ancestors. Its `.gitignore` must contain `*`.
Owner, SYSTEM and local Administrators are the only allowed principals; the owner
must verify Windows ACLs. Files must be regular, single-link, restricted files.
No ACL repair is performed by the runner.

Use the existing UTF-8, no-BOM `credentials.json` schema without printing it:
`{ projectRef, apiOrigin, publishableKey, users: { A: { id, email, password }, B: { id, email, password } } }`.
Only `sb_publishable_...` keys and distinct approved UUID/email pairs are accepted.
Both synthetic users must be confirmed and reserved for this run. Do not paste
credentials, identities or private hashes into chat or Git. The runner refuses
inherited Supabase/MY_KRAVV/proxy/TLS override configuration rather than falling back.

After separate owner approval, create one fresh **`slice1-run-approval.json`** in
that root. Do not reuse/archive-overwrite Slice 0 grants or modify prior evidence.
If this Slice 1 fixed path already exists, stop for an explicit archival decision.
Its exact, strict schema is:

```json
{
  "purpose": "slice1-company-api-only",
  "projectRef": "kjcvgjfwlmyfroiqlbmw",
  "apiOrigin": "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
  "runId": "<fresh UUID; never previously consumed>",
  "users": { "A": "<approved UUID>", "B": "<approved UUID>" },
  "issuedAt": "<fresh UTC ISO timestamp>",
  "expiresAt": "<UTC ISO timestamp; at most ten minutes after issue>",
  "maxRequests": 100,
  "overallMs": 300000,
  "retries": 0,
  "planSha256": "<SHA-256 of JSON.stringify(buildCompanyAcceptancePlan(spec))>",
  "credentialSha256": "<SHA-256 of exact credentials.json bytes>"
}
```

The raw grant-byte SHA-256 must match the reviewed source pin, including whitespace.
Claims share the existing `run-<UUID>.consumed.json` namespace across runners. An
exclusive `wx` creation and complete-byte/fsync persistence occurs before transport;
an existing, partial or ambiguous claim, or unwritable storage, fails closed.
Claims are never removed. Expired grants cannot be extended, reused or retried.

## Exact scope and budgets

The plan contains **92 requests on a passing run**, maximum **100 requests**, maximum
**300 seconds** total, maximum **10 seconds** per request including body reads,
and **zero retries**. The earlier of grant expiry and total deadline applies.
Auth, marker/capability checks, reads, failed-operation probes, reauthentication and
logout all count. Redirects, malformed/oversized JSON (over 256 KiB), unexpected
status/identity/shape, changed baselines or missing required assertions stop the run.
The admitted-request count can include a request whose pre-send persistence failed;
it is not proof that such a request reached the server.

1. Verify target; login/confirm both users; capability 1; capture existing company
   and theme baselines; require no collision with the fresh run namespace.
   At most 100 historical companies per user are accepted. More rows, malformed
   records or ambiguous settings require review before any fixture write.
2. Create exactly 25 A companies and one B company, named
   `v3-slice1:<run UUID>:A00` through `A24`, and `B00`. PostgreSQL assigns every ID.
   Positive INSERT never sends id/timestamps. One row uses name-only INSERT;
   another checks maximum 32/80/120/2000 metadata lengths. Capture exact owner,
   nullable fields, name, server-generated UUID and timestamps from HTTP 201 with
   exactly one representation row. Reject missing/duplicate/foreign IDs.
3. Update A00 through minimum values and then all-null metadata; require confirmed
   fields, unchanged ID/owner/creation time, and advancing update timestamp.
   Reject oversized values, empty identifiers/name, controls and protected-column
   updates. Protected-column probes use current values, not destructive new IDs.
   Cross-user reads/updates return no rows; forged-owner INSERT returns RLS denial.
   Read back A00/B00 unchanged after rejected operations.
4. Name search uses the unique namespace, including a case-folded query. Page 0
   returns 25 rows (24 visible plus probe), page 1 the final row; a repeated page
   must agree. Compare timestamp/UUID order with PostgreSQL microsecond precision.
   A unique ticker containing `%_` tests literal rather than wildcard matching.
   B's directory must not expose A's prefix. A separate owned-ID lookup selects
   the company beyond the first 24 visible rows, independent of search/page.
5. Capture each original theme (or absent setting) in private evidence. UPDATE
   only theme if settings exist; otherwise INSERT only user_id/theme. A becomes
   dark, B light; invalid themes and cross-user settings access must fail. Logout,
   reauthenticate/confirm and reread themes to test account persistence. At most
   two settings rows are inserted. Existing synthetic themes are intentionally
   changed and **retained**; no implicit restoration is authorized.
6. Compare every historical company with its baseline after excluding only the
   26 validated generated IDs. An unrelated concurrent change causes a stop,
   never an automatic repair. Final logout clears local tokens; do not claim
   immediate revocation of previously issued JWTs.

## Durable evidence, failures and retention

Before every send, persist exact method/path and synthetic fixture body (never
login bodies, keys or headers). A sending event is durable intended/possibly
uncertain-write evidence, not confirmation. Record a generated ID only after a
validated response; complete-byte write plus successful fsync must precede every
dependent request. Zero/short writes, write/fsync exceptions or interrupted
persistence stop execution. Never fabricate an ID or infer a successful write.

`run-<UUID>.manifest.jsonl` retains planned fixtures, sending/verified events,
generated-ID/metadata evidence, baseline counts/digests and original synthetic
themes. Historical company bodies are kept only in memory, not copied to evidence.
Failure diagnostics contain only fixed stage/category, request index, numeric
HTTP status when received and allowlisted Auth reason. Raw responses/errors,
emails/passwords/JWTs/API keys/headers are never logged or persisted.

PASS requires a successful process outcome, all 92 assertions and a durable final passed record. A visible passed line alone is insufficient if final fsync failed or the process was interrupted. A failed
assertion is FAIL; interruption, lost response or incomplete final evidence is
INCONCLUSIVE for affected writes, even if fixtures are visible later. Stop without
retry. Preserve all manifests, claims, grants and fixtures. Owner reconciliation
of uncertain writes and any cleanup/restoration require separate approval.

After the process stops, restore the runner source pin to null immediately and
verify only the temporary pin edit was reverted and Git is clean. Never commit an
active pin. This implementation creates no grant and contains no active pin.

## Approval boundaries and remaining acceptance

Next approval: private preflight, fresh exact grant and temporary runner-only pin,
then one explicitly authorized run. These may be approved as one bounded cycle or
separate gates; none are authorized by this document. Do not execute merely because
the Cloud migration passed. Keep both interlocks dormant after the cycle.

This plan tests the REST/RPC contract, not rendered application behavior. Browser
company switching/account isolation, theme reload/UI error states and production
build remain separately authorized work behind the unchanged application gate.
The old Slice 0 runner's empty-settings assumption is not reused. SQL, Auth edits,
cleanup, Docker, AI and infrastructure changes are outside this plan.

## Offline evidence

Deterministic tests exercise the real dormant engine with synthetic temporary
files, canned responses and in-memory source-pinned module copies only. These
tests do not inspect owner credentials, Windows ACLs or the live Cloud. Synthetic
temporary test directories are disposable; real manifests/claims are never touched.
Live PostgreSQL/PostgREST statuses, trigger behavior, RLS and HTTP acceptance remain
unverified until the corresponding owner-approved run succeeds.

Validation for this implementation: focused suite **16 passed**, full deterministic
suite **189 passed, 0 failed, 0 skipped**. Commands: `node --conditions=react-server
--test src/tests/v3-company-acceptance.test.ts`, `npm test`, `npm run lint`,
`npm run typecheck`, `npm run format:check`, and `git diff --check`.
