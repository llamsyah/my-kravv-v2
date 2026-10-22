# V3 Cloud bootstrap — Checkpoint 2C, offline artifacts only

**Target identity approved; execution blocked.** Organization `MY KRAVV V3`, project `my-kravv-dev-v3`, reference `kjcvgjfwlmyfroiqlbmw`, exact origin `https://kjcvgjfwlmyfroiqlbmw.supabase.co`. Free plan and Healthy status are owner-reported, not independently verified. Region is owner-reported South Asia; exact provider identifier and acceptance remain pending. V2 `my-kravv-dev` and all local volumes are outside this package.

See [Checkpoint 2F test preparation](TWO-USER-TEST-PLAN.md) for the newer owner-reported region/bootstrap/user status and the offline-only two-user request specification. Historical status below is the Checkpoint 2C record; no live acceptance is inferred.

## Approval is not execution authorization

The [approval record](../../src/lib/env/v3-cloud-approval.json) now contains the owner-selected public identity using the existing strict schema. It approves only the target identity, not credential use, database access, SQL, Auth changes or runtime execution. [bootstrap-plan.json](bootstrap-plan.json) records the draft paths and hashes; it is not an executable runner or migration history.

`assertCloudExecutionReady()` is unchanged and unconditionally throws. Application target resolution, identity requests, browser/SSR clients, Proxy, Cloud commands and the portable integration boundary retain that shared gate. Environment flags and populated metadata cannot authorize execution. Exact reference/origin/marker validation, separate cookie namespaces, inherited generic/V2 environment rejection, credential sanitization, local target guards and local publisher/volume interlocks remain intact.

Cloud commands remain denial-only. The portable test helper is not yet a functional Cloud runner. Future activation must explicitly implement and review Cloud preflight, fixture lifecycle, SQL coverage and build/serve target provenance; no direct Next invocation or credential placeholder may bypass these requirements.

## Draft artifacts and exact migration difference

- [bootstrap.sql](bootstrap.sql): review-only initial DDL, outside CLI migration discovery; no remote link exists.
- [verify.sql](verify.sql): review-only, read-only post-bootstrap catalog queries; results require human comparison, not an automatic acceptance verdict.
- Local source: `supabase/v3/supabase/migrations/20261021000100_slice0_foundation.sql`.
- Local source SHA-256: `d819f9d322179dde279fbab3632783c9c2ed331d892054f3f39c2e1ffdd1b17c`.
- Cloud SQL SHA-256: `3a833df429954f968daacff8ba4c4c54735eaa008f605b75a22a5c9edb1bbee9`.

Exactly two SQL lines differ (line endings normalized): the environment purpose CHECK becomes `disposable-v3-slice0-cloud`; the singleton INSERT uses project ID `kjcvgjfwlmyfroiqlbmw` and that Cloud purpose. There are no hosted-specific privilege changes. Tests compare the whole artifact against these substitutions and verify both byte hashes. The local migration is unchanged. The directory-local `.gitattributes` pins bootstrap.sql to LF so its reviewed byte hash survives Windows/Linux checkouts.

The private marker schema/table revoke access from PUBLIC, anon, authenticated and service_role. The identity RPC is a stable SQL SECURITY DEFINER function with empty search_path, a fully qualified marker-table reference and a fixed non-private JSON response. PUBLIC execute is revoked; anon/authenticated/service_role receive only identity execution. The timestamp trigger function remains SECURITY INVOKER with empty search_path and PUBLIC/anon/authenticated execution revoked. Tables, owner RLS, column grants, constraints, indexes and restrictive Company deletion behavior are preserved.

Hosted default privileges, inherited roles, object ownership and effective grants still require live verification. Source revocations alone do not prove the hosted ACLs. A privileged SQL editor session bypasses ordinary user RLS and cannot establish two-user isolation. Any unexpected effective privilege blocks acceptance; do not automatically repair grants or alter project-wide defaults.

## Ordered owner checklist — not authorized execution

### Offline checks available now

1. Review exact identity, marker, full SQL diff, source/artifact hashes and unchanged execution invariant.
2. Review this checklist, expected grants below and the verification script. No credentials or project access are needed.
3. Approve a separate bounded dashboard/SQL session and hosted Auth configuration before any live step. Region acceptance, target freshness and actual hosted settings cannot be established offline.

### Later authorized dashboard and bootstrap session

1. Open the owner-selected organization/project manually. Confirm organization/name and **reference** `kjcvgjfwlmyfroiqlbmw` in project settings, exact API origin and provider region identifier. Display names, SQL `current_database()` and the future marker alone are not independent project proof. Accept the region explicitly or stop.
2. Inspect expected fresh state: no application tables/functions/policies, no `v3_internal` schema, no existing Auth users or unmanaged application data. Supabase-managed schemas/objects are expected. Abort on unexpected objects/users; do not adopt, drop, reset or repair them. Do not inspect V2.
3. Separately approved Auth setup: disable new-user signup and anonymous sign-ins; retain email/password login and email confirmation. Keep unused providers disabled. Site URL `http://127.0.0.1:3103`, no V2 domains or wildcard redirect entries; add only exact needed callbacks after review. Do not create users yet. Verify exposed Data API schemas exclude `v3_internal`; review actual platform defaults before approving any change.
4. Reconfirm the selected reference immediately before SQL execution. Use the dashboard SQL editor in that V3 project and the exact reviewed `bootstrap.sql` bytes/hash. No CLI link/push/reset and no root/V2 migrations. Execute the **entire file once**, not selected statements.
5. DDL order: BEGIN; private schema/marker; identity RPC and grants; settings/companies constraints/indexes; timestamp function/trigger; RLS/table/column grants and five ownership policies; schema-cache notification; COMMIT. No DROP, TRUNCATE, IF NOT EXISTS adoption or automatic retry exists. An existing object causes failure.
6. On reported SQL error, do not retry fragments or assume a persistent SQL editor session. An error in the explicit transaction prevents its COMMIT; connection close rolls back an open transaction. If the client stops early, rollback must occur in the same still-open session; a new tab/session's ROLLBACK is not evidence. If the response is lost or completion is ambiguous, stop and authorize read-only inspection before further action. Do not add destructive recovery SQL. Record the outcome without secrets.
7. After confirmed commit, run the separately approved whole `verify.sql` in read-only mode. Compare the singleton marker exactly with the approval record. Verify object owners; no private schema/table access for API roles; identity function only exposes its three fields, has empty search_path and intended execute grants; no PUBLIC or inherited unintended function access. Review table and column privileges, constraints, index, trigger and policies against bootstrap.sql.
8. Acceptance expectations: both app tables have RLS enabled; exactly two settings and three companies ownership policies; authenticated SELECT plus settings INSERT(user_id), companies INSERT(user_id,name), UPDATE(name); no authenticated company DELETE or wider write grants; anon no app-table access. service_role has fixture table CRUD but no private-marker access. Review role inheritance/effective ACLs as well as explicit ACL entries. The verification script reports evidence; it does not automatically enforce all these comparisons.
9. Separately authorize a bounded API identity read after catalog acceptance. Application tooling remains blocked until a later reviewed activation. Then separately approve two synthetic confirmed accounts, user-session Auth/RLS/HTTP tests and exact run-scoped cleanup. No production/user email, fixture deletion or live test is authorized here.

## Credentials and remaining boundaries

Dashboard verification/settings/manual SQL require only the owner's appropriately privileged dashboard session, not pasted API keys. Optional later SQL tooling needs a V3-only TLS database credential; API secret keys are not SQL passwords. Future app/RLS tests use the V3 publishable key and synthetic user sessions. Admin fixture creation/cleanup alone needs a V3 secret key in a trusted process; never use that key to prove RLS. Deliver credentials outside chat/Git using a separately approved local secret mechanism and existing namespaced inputs; do not load V2 root dotenv files.

No SQL has been parsed/executed against PostgreSQL or verified on the hosted database. Static contract/hash tests establish artifact consistency only. Auth setup, region, effective hosted privileges, marker persistence, live Auth/RLS/HTTP, Cloud build/serve and reset/rebuild acceptance remain pending. Local Docker IPv6 publishing, retained-volume compatibility and fresh local identity acceptance remain unresolved. No custom CLI or Docker upgrade is introduced.
