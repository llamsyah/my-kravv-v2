# V3 Cloud adapter — Checkpoint 1, offline only

**Unprovisioned and not runnable.** No Cloud project reference, API origin or database marker has been invented. No migration or Cloud request is authorized by this checkpoint. The existing V2 `my-kravv-dev` project and deferred local V3 volumes remain untouched.

## Target and approval flow

The public-safe [approval record](../../src/lib/env/v3-cloud-approval.json) contains null identity fields. `owner-approved` evidence must eventually bind one actual project reference to exactly `https://<approved-ref>.supabase.co` and a strict, distinct marker: `project_id` equal to that reference, `purpose` equal to `disposable-v3-slice0-cloud`, and `schema_version` equal to 1. The purpose is a contract, not an assigned project identity. Unknown status, missing evidence, extra approval fields, malformed reference, mismatched origin/marker, HTTP, userinfo, custom domain, path, query, fragment and alternate port are refused. Display names are not target identity.

Only a later reviewed source change can fill the approval record. Environment variables cannot supply approval. Pure validators accept injected evidence solely for deterministic test fixtures; production callers use the checked-in record. Even a filled record does not remove the independent unconditional Cloud execution interlock. The final review found that the initial application adapter did not consult this interlock; the remediation now enforces it inside application-facing target resolution before returning any Cloud target. Identity verification, browser/SSR client creation and Proxy therefore reject before Cloud I/O. Later provisioning, bootstrap and live-operation approvals remain separate.

Public selection is explicit: `NEXT_PUBLIC_MY_KRAVV_ENV=my-kravv-v3-cloud-dev`, the approved URL and `NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF` must agree. Local profile selection still invokes the original exact local URL guard and rejects a conflicting Cloud reference. There is no fallback. The Cloud cookie namespace is `my-kravv-v3-cloud-dev-auth`, distinct from local/V2. Existing Auth verification, independent `getUser` authorization, RLS, no-store responses, route restrictions and disabled real AI are preserved.

## Prepared command boundary and credentials

`npm run v3:cloud:dev`, `v3:cloud:build`, `v3:cloud:serve` and `v3:cloud:test` are **denial-only entry points today**. They validate action and target, then fail closed. They contain no fetch, SDK invocation, Docker/CLI command, child launch or credential acquisition. No Cloud reset, link, migration or cleanup command exists. The existing local commands and receipt/publisher gates remain separate. One client-safe invariant, `src/lib/env/v3-cloud-execution.ts`, is used by target resolution, commands (through a re-export) and the portable-test boundary. It accepts no execution grant format, environment flag or injected override at Checkpoint 1; missing, conflicting and apparently positive grants all fail. Metadata-only validation/environment preparation is distinct from obtaining an executable application target.

Future credentials must be supplied out of band to a separately approved launcher using these namespaced inputs; this checkpoint stores none:

- `MY_KRAVV_V3_CLOUD_PROFILE` — explicit Cloud profile label.
- `MY_KRAVV_V3_CLOUD_PROJECT_REF` and `MY_KRAVV_V3_CLOUD_API_ORIGIN` — exact approved public metadata.
- `MY_KRAVV_V3_CLOUD_PUBLISHABLE_KEY` — future public client credential.
- `MY_KRAVV_V3_CLOUD_SECRET_KEY` — future fixture process only; never the application.

The environment preparation helper is pure with respect to networking: no launch or credential retrieval. It rejects inherited generic/local target variables and privileged generic credentials, accepts only explicit namespaced inputs, and clears inherited dotenv key names, provider credentials, CLI tokens, Node options and local Docker configuration using the existing sanitization pattern. Namespaced private credentials are blanked in all children; only test preparation assigns the explicit fixture secret to the server-only generic secret field. Public configuration exposes only URL/publishable key; the target adapter adds public identity and cookie metadata, never privileged credentials.

Do not use `--env-file=.env.local`, copy V2 keys, replace the real publishable key with a placeholder, run Next directly, or promote a local build into the Cloud profile. Next freezes public environment values at build time; a future serve path must also verify matching build-target provenance before launching. Building/serving and provisioning are deliberately unimplemented here.

## Hosted bootstrap preparation

[bootstrap-plan.json](bootstrap-plan.json) pins the reviewed foundation source without creating a discoverable migration directory or remote link. **Do not apply the local SQL unchanged:** its marker identifies the local environment. A Cloud-specific migration must be generated and reviewed after the actual reference is approved. Preserve the foundation tables, owner RLS, column grants, restricted Company deletion, private marker schema and non-private identity RPC; change only separately reviewed target-specific identity/configuration. Do not discover root V2 migrations or duplicate V2 data. Existing local migration history, config and hashes remain unchanged.

Before any future DDL, independently verify the approved project's reference, exact destination, dedicated development purpose and absence of pre-existing application data. The marker cannot serve as the bootstrap proof before it exists. Refuse an ambiguous project, unexpected schema or unmanaged data; do not adopt or reset it.

Hosted settings require owner verification separately; local `config.toml` does not configure Cloud:

- New user signup and anonymous-user creation disabled; email/password login available for admin-created confirmed synthetic users.
- Site URL `http://127.0.0.1:3103`, only explicitly approved redirect URLs, no V2 domains or integrations.
- Only `public` exposed through the Data API; `v3_internal` remains private, with only the narrow identity function callable as granted.
- Reviewed token/session settings and API-key types; no OAuth, SMTP, paid add-ons or email-delivery test is introduced by this checkpoint.
- TLS-verified exact project endpoints and least necessary credentials. No broad SQL-execution RPC or browser administrative key.

## Prepared test coverage

The local live test retains manifest, API marker, container/receipt and synthetic-only SQL preflight. It invokes the shared API/HTTP assertions and requires the SQL callback, so it cannot quietly omit local catalog/FK coverage. The extracted helper owns two synthetic account lifecycles; cleanup additionally checks the exact in-memory run marker as well as account ID, email and purpose.

| Coverage                                                                                                                                                | State                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous API denial and identity response, two-user RLS/ownership, invalid-session/logout/reauthentication, local HTTP login/actions/account switching | Extracted to `src/tests/helpers/v3-portable.ts`; local assertions retained; Cloud branch explicitly blocked before network/credentials |
| Container/volume/manifest and synthetic-only SQL preflight                                                                                              | Remains in `src/tests/v3-live/foundation.test.ts`; local only                                                                          |
| Catalog RLS/grants, forbidden delete/RPC and rollback-only restrictive-FK SQL probe                                                                     | Local callback retained unchanged; future Cloud SQL adaptation requires separate privileged SQL/DDL approval                           |
| Cloud fixture creation/cleanup, app/build/serve launch, hosted API marker and credential binding                                                        | Not operationally implemented or tested; future approval required                                                                      |
| Cloud schema replay, reset/rebuild and local Docker binding safety                                                                                      | Not validated by this adapter; no remote reset path                                                                                    |

The shared helper deliberately still requires the local target and SQL callback after its Cloud interlock. A later Cloud runner must add its own approved marker/preflight, explicit coverage reporting and exact synthetic cleanup; changing a target string cannot activate the current helper. No live check is silently skipped or counted as passed. Offline mocks and subprocess refusal tests are the only Cloud tests run at Checkpoint 1.

## Information and decisions required at Checkpoint 2

1. Owner confirmation of a second Free project slot, selected organization/region and an independently created, dedicated V3 project distinct from `my-kravv-dev`.
2. The actual non-secret project reference and exact HTTPS API origin; confirmation this reference has never been V2. No V2 database access is needed.
3. Approval of the corresponding distinct Cloud marker and project-specific foundation/bootstrap plan, including hosted Auth settings.
4. Separate decisions authorizing provisioning, bootstrap and later runtime tests. Filling metadata alone is not live-operation authorization.
5. Future credential delivery method outside chat/Git, and whether privileged SQL checks will use an approved TLS database connection or owner-executed checks. Do not send secrets at this checkpoint.
6. Acceptance of hosted/public service exposure, synthetic-only persistent state, quotas/pausing and separate rebuild coverage. Local infrastructure acceptance remains deferred.

No project access, service startup, SQL, fixture cleanup, provider request, global configuration change, commit or push is part of Checkpoint 1.

## Security remediation verification

The initial 109-test run did not cover populated approval metadata in the application path, and was insufficient to establish the claimed execution boundary. Three new deterministic regressions cover the shared gate, isolated populated-metadata application/command rejection with zero outbound requests, and unchanged local application behavior. The isolated probe mutates only the imported approval object in child-process memory and replaces network transport with a mock; the approval file stays unprovisioned. The real target resolver, identity verifier, browser/SSR clients and Proxy are exercised. The test maps the existing Next headers subpath to its actual `.js` entry for Node ESM loading, without replacing any security function. Live Cloud access/build/SQL remains unverified and unauthorized. See the implementation notes for final command results.
