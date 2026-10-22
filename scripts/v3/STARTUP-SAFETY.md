# V3 startup safety — 22 October 2026

**Startup/reset remain blocked.** The retained-volume compatibility gate is implemented. No creation-time publisher is approved. Native localhost-only enforcement remains unresolved; the custom CLI and Docker upgrade are deferred. This is a tooling report, not database compatibility approval or a successful V3 runtime test.

The later [offline Cloud adapter](../../supabase/v3-cloud/README.md) is a separate, execution-blocked path with owner-approved target metadata and review-only Cloud bootstrap artifacts. It does not change this publisher gate, local service lock, migration/config hashes or retained receipts. Cloud entry points and application-facing Cloud target resolution share the same unconditional client-safe execution invariant. The initial adapter missed the application check; the remediation blocks populated approval metadata before identity requests or client creation, as verified using isolated synthetic configuration and mocked transport. Later owner-approved target and operations work remains necessary.

## Current decision and evidence

The owner selected Docker Desktop's native `local-only-port-binding` policy. On Desktop 4.85.0, the single approved implicit-publication nginx canary returned HTTP 200; Windows showed only `127.0.0.1:55999`, but Docker runtime metadata also reported wildcard `[::]:55999`. No volumes were attached, cleanup completed, and the listener disappeared. Read-only Windows and running WSL socket evidence for existing n8n showed IPv4 loopback without a matching IPv6 listener. These observations support a reporting discrepancy, not approval to ignore wildcard metadata.

The official [Desktop 4.88.0 fix](https://docs.docker.com/desktop/release-notes/#4880) describes corrected port reporting and added IPv6 loopback. The owner deferred the Desktop upgrade/storage work and a custom CLI build. Keep the source patch below as a review-only fallback. A future native-policy guard would need separately approved policy/version provenance, verified IPv4/IPv6 loopback and consistent actual-listener evidence. None is implemented or inferred from UI selection.

PostgreSQL image registration succeeded for Linux/amd64 `17.6.1.075`; both expected local aliases were verified against `sha256:e4c5a3f62fed239ca9cd633b5a8e03385f636a9705cc759af0abf56de280b747`. The retained database volume was not adopted, mounted or reset. Its service-version compatibility remains unverified; the receipt is identity-only and remains rejected.

This offline checkpoint performs no Docker command or live database operation. Current offline commands/results and remaining approval gates are recorded in [the implementation notes](../../docs/v3/SLICE-0-IMPLEMENTATION-NOTES.md#h-offline-checkpoint--22-october-2026).

## Upstream publisher finding and approval boundary

The installed npm package and executable report Supabase CLI `2.75.0`. The upstream tag resolves to commit `e07c7ea15b842e9bb45c79518a5f20cea84fc753`. Reviewed immutable sources:

- [shared Docker creation](https://github.com/supabase/cli/blob/e07c7ea15b842e9bb45c79518a5f20cea84fc753/internal/utils/docker.go): direct Docker API creation, without a configurable HostIP override;
- [database creation](https://github.com/supabase/cli/blob/e07c7ea15b842e9bb45c79518a5f20cea84fc753/internal/db/start/start.go): publication specifies HostPort, omitting HostIP;
- [other service creation](https://github.com/supabase/cli/blob/e07c7ea15b842e9bb45c79518a5f20cea84fc753/internal/start/start.go): the same omission;
- [configuration types](https://github.com/supabase/cli/blob/e07c7ea15b842e9bb45c79518a5f20cea84fc753/pkg/config/config.go) and [Go toolchain requirement](https://github.com/supabase/cli/blob/e07c7ea15b842e9bb45c79518a5f20cea84fc753/go.mod).

No supported project-scoped option for an explicit creation-time HostIP was found in this pinned source/configuration or its start help. The bridge network default is retained as defense in depth, but earlier observed wildcard bindings mean it cannot be treated as creation-time enforcement. The successful nginx canary establishes only that an explicit `127.0.0.1` publication works on the host.

A small source patch could set HostIP on every PortBinding in the shared Docker creation path, restricted to the exact reviewed V3 project. Delivering that patch requires a replacement CLI build. No Go executable was found on PATH; this source requires at least Go `1.25.5` and its module graph. This task installs no compiler, downloads no replacement binary, changes no dependency lockfile and implements no Docker API proxy or command shim.

The [review-only patch](patches/supabase-cli-2.75.0-loopback.review.patch) adds ten lines before shared image/container creation: refuse another project or `PublishAllPorts`, then set every explicit binding's HostIP to `127.0.0.1`. Its upstream source hash is recorded in the patch header. `git apply --check` passed against an ignored copy of the verified source; the patch was not applied, compiled, installed or executed. Its exact project literal must be reviewed/regenerated if a separately named fresh V3 target is selected. A passing patch applicability check is not a Go build or runtime test.

**The custom build is deferred; owner review is required before pursuing it.** A separate bounded build task should verify the compiler/source/dependency checksums, apply a checked-in minimal patch, run upstream and project tests, preserve original CLI/version provenance, and pin the resulting executable checksum. Every CLI upgrade would require patch review and rebuilding. The publisher controls privileged Docker requests and handles credential-bearing container configuration, so its scope must remain narrow and its output must never log environment values. A shell wrapper around `docker` does not cover this Go CLI's direct API calls.

Alternatives requiring owner review are a verified upstream release that supports the required binding, or a different project-local stack launcher with explicit bindings and equivalent isolation guards. The latter changes more lifecycle tooling. Native Desktop policy is now the preferred candidate for later verification, but it is machine-wide and has not passed the strict criteria. A custom credential-bearing API proxy remains inappropriate for this bounded task.

## Implemented guard and provenance rules

`service-lock.json` records the candidate CLI version, upstream commit, current Windows/x64 executable SHA-256, Linux/amd64 platform and exact database/Auth/REST/gateway/mail image references. Each image includes its immutable registry, platform-manifest and configuration digests. The five image names match the enabled services and upstream defaults for the reviewed V3 config. Cached manifest/configuration blobs were hash-verified read-only; no image pull was performed. A registry metadata request returned HTTP 429, so immutable cached metadata was used instead of repeated registry requests.

The complete startup fingerprint also binds the exact V3 project/purpose/API/workdir/local Docker endpoint/network, reviewed configuration hash, migration name/hash and publishing implementation identity. It is a **candidate service-set lock**, not evidence that an older volume is compatible.

Unreviewed nested CLI dotenv inputs, image/version cache files and branch overrides are rejected so they cannot silently change that effective set. Only the release-notification `cli-latest` cache and the default `main` CLI branch marker are permitted. These are the CLI's internal inputs, separate from the unchanged Git `v3` branch. No cache or branch metadata was edited to satisfy these checks.

An existing receipt must carry explicit provenance with a basis, approval time, evidence reference, complete matching fingerprint and approval bound to the same volume name/creation time. An identity-only receipt, missing approval, changed version/image/config/migration/publisher, or changed volume is rejected. No missing compatibility field is backfilled. Existing approval is preserved when a verified instance's container ID is refreshed.

The current retained receipt is identity-only and therefore remains rejected. It was not edited, adopted, mounted or inspected for database contents. Changing receipt fields manually is not a substitute for the required compatibility assessment and owner authorization.

Both the main start/reset entry points and the mutating CLI helper enforce the gate. Rejection occurs before Docker access for missing compatibility or missing fresh confirmation. A separate unconditional publisher interlock also rejects every start/reset until an actual reviewed creation-time publisher is wired in; no flag, environment variable or receipt approval can waive it. The current CLI is not falsely certified by a configuration boolean.

Before future allowed mutation, the runner also verifies the executable bytes and each required cached image's repository digest and Linux/amd64 metadata; missing or conflicting cache entries cause rejection, not an automatic pull. Existing actual-port checks remain independent and now require `127.0.0.1` exactly for every published binding, rejecting wildcard, omitted IP and IPv6 bindings. A null entry represents an exposed-but-unpublished internal port, not a host listener.

## Future fresh initialization path

The existing fresh-resource branch is preserved but requires explicit `--confirm-fresh-v3`, no prior receipt/resources, a second absence check immediately before startup, matching locked tools/images and an approved publisher. Only that genuinely fresh branch can record fresh creation provenance. The flag cannot authorize retained resources or convert an old receipt into compatibility approval. No initialization ran in this task.

Because the retained project already occupies its volume name, a fresh environment preserving it requires a separately reviewed **new V3 project identity** and corresponding target/config/migration-marker/fingerprint updates. No environment variable override or deletion of the old receipt should be used to evade this boundary.

## Validation and runtime limits

The affected tests exercise missing/forged/stale compatibility proof; exact environment, CLI binary, image, configuration and migration identities; changed volumes; fresh-versus-retained authorization; and omitted/wildcard/malformed bindings. Real launcher rejection is tested in subprocesses with Docker absent from PATH, checking that the retained receipt is byte-for-byte unchanged.

These tests validate refusal and proposed port-map validation, not actual Supabase publishing. No service was created or started, no database operation or live integration test ran, and no runtime port-binding result is claimed. The previous image registration and nginx canary remain separate evidence.

Executed checks for this correction:

| Command/check                                                                                               | Result                                                                                                        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                                                              | Passed                                                                                                        |
| `npm run typecheck`                                                                                         | Passed after correcting fresh-receipt input typing; input is runtime-schema-validated, without an unsafe cast |
| `npm run format:check`                                                                                      | Passed                                                                                                        |
| `node --conditions=react-server --test src/tests/v3-startup-safety.test.ts src/tests/v3-foundation.test.ts` | 12 passed, 0 failed, 0 skipped; six new safety tests and six affected existing V3 tests                       |
| Reviewed manifest + installed CLI byte hash                                                                 | Passed; five required service locks loaded                                                                    |
| Existing receipt through the actual compatibility validator                                                 | Rejected for missing compatibility evidence, before Docker                                                    |
| Review-only upstream patch                                                                                  | `git apply --check` passed against the hash-verified source copy; not applied or built                        |
| Task-start source snapshot comparison                                                                       | Only the seven files below changed; retained receipt SHA-256 unchanged                                        |

Exact task changes:

- Modified `scripts/v3/local.ts`: compatibility/creation interlocks, checked cache/executable metadata, strict independent port validation, guarded fresh provenance and preserved retained evidence.
- Modified `supabase/v3/README.md`: current blocked state and revised operating requirements.
- Added `scripts/v3/startup-safety.ts`: pure validators and authorization rules.
- Added `scripts/v3/service-lock.json`: candidate immutable tool/service identities.
- Added `src/tests/v3-startup-safety.test.ts`: deterministic denial and entry-point tests.
- Added `scripts/v3/STARTUP-SAFETY.md`: source findings, cost/approval boundary, evidence and proposed first test.
- Added `scripts/v3/patches/supabase-cli-2.75.0-loopback.review.patch`: unapplied publisher correction for owner/build review.

The earlier 95-test suite was not needlessly rerun. Build, runtime integration, reset/rebuild and an actual Supabase port-binding test remain outside this task. No application, dependency, migration, visual reference or established product specification file changed during this correction.

After publisher (native or explicit) and fresh-target review, the first separately approved startup test should:

1. Recheck the exact new target, absence of prior resources and remote links, disk, executable and all cached immutable images. Refuse downloads and old-volume attachment.
2. Run one guarded fresh startup with a hard ten-minute limit, observing stages without automatic retries. Inspect proposed explicit bindings before start and actual Docker/Windows listeners immediately afterward.
3. Verify only the fresh database/API identity and minimal migration. Keep app startup, two-user integration and reset/rebuild outside that first operation unless separately authorized.
4. On failure, stop only the positively identified new project's containers with volumes retained. Do not reset, prune or change the older retained environment.

This plan is conditional, not an authorization or a currently runnable startup command. It must not be executed while the publisher interlock remains in place.
