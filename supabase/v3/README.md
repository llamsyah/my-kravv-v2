# V3 Slice 0 local environment

Use only the guarded repository commands below. This is a disposable security foundation, not a working V3 research product. Current implementation/validation status is recorded in [the Slice 0 report](../../docs/v3/SLICE-0-IMPLEMENTATION-NOTES.md). Do not infer successful integration from this setup guide.

**22 October startup-safety update:** start/reset are interlocked pending an approved creation-time loopback publisher. The retained volume's identity-only receipt also fails the new compatibility gate. PostgreSQL image registration and an explicit IPv4 nginx canary succeeded separately. The later implicit-publication canary under the owner-selected native localhost-only policy remains unresolved: Windows showed IPv4 loopback, while Docker reported wildcard IPv6. Neither approves Supabase startup. Docker upgrade/storage expansion and a custom CLI build are deferred. See [startup safety and the owner-review boundary](../../scripts/v3/STARTUP-SAFETY.md). Do not run direct CLI commands to bypass these refusals.

## Fixed target

| Item                      | Value                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| Project                   | `my-kravv-v3-local-01a14897`                                           |
| CLI workdir               | `supabase/v3`                                                          |
| Actual config             | `supabase/v3/supabase/config.toml`                                     |
| Only discovered migration | `supabase/v3/supabase/migrations/20261021000100_slice0_foundation.sql` |
| API                       | `http://127.0.0.1:55321`                                               |
| PostgreSQL / shadow       | `55322` / `55320`                                                      |
| Local test mail           | `55324`                                                                |
| App                       | `http://127.0.0.1:3103`                                                |
| Docker context            | `desktop-linux`, local Windows Linux-engine named pipe                 |
| Supabase CLI              | npm dev dependency, exact `2.75.0`                                     |

Node 24 and Docker Desktop with its Linux engine running are required. The operating guard currently supports this Windows machine; it intentionally rejects other Docker endpoints. No global CLI, remote project, linked credentials, V2 seed or V2 migration replay is required. `tar` is overridden only under the CLI dependency to exact `7.5.22`.

## Commands

```sh
npm ci
npm run v3:up
npm run v3:doctor
npm run dev
```

Startup verifies the fixed manifest, migration discovery, absence of a remote link, local Docker endpoint and task-owned resource identity. Restart additionally requires explicit compatibility evidence matching the locked CLI executable, immutable service images, configuration/migration identity and exact retained volume. The ignored `.qa/v3-local-instance.json` receipt contains no credentials; its existing identity fields alone are insufficient. Missing compatibility evidence is never backfilled. Keep the receipt while retaining these volumes; do not delete it to bypass checks.

A later owner-approved fresh initialization requires `npm run v3:up -- --confirm-fresh-v3`, no existing resources/receipt and an approved publisher. That command remains blocked today. The fresh flag cannot authorize retained resources. A new project identity must be reviewed separately to preserve the older retained volume.

The launcher retains a project-specific network requesting loopback bindings. That request is not sufficient creation-time enforcement on this host, so stock CLI startup/reset is now blocked. Independent actual published-address checks remain in place and require explicit `127.0.0.1`. Broad bindings cause only this V3 stack to stop, with volumes retained. A CLI command succeeding is insufficient evidence that the environment is safe. Do not disable this check or expose the stack to the LAN as a workaround. The owner-selected native policy does not waive it; further global changes require separate review.

Before every database use, the runner checks its recorded container ID and label, retained volumes, database marker, synthetic-only users and exact public-table allowlist. It verifies the API marker separately. The app also verifies that nonprivate marker before Auth/content requests and rejects every URL except the exact V3 endpoint. An unrelated service responding on the port is insufficient.

The child environment blanks inherited Supabase/AI/public variables and every key found in root `.env*` files; source values are neither logged nor rewritten. The CLI publishable key is passed in memory after target checks. Only the integration-test child gets a privileged local key, for marked synthetic fixtures and their scoped cleanup. App processes never get it. Build uses the verified local publishable key; a build cannot be prepared against V2 or a placeholder and later served as V3.

## Offline checkpoint

Without starting Docker or Supabase, use `npm run lint`, `npm run typecheck`, `npm run format:check` and `npm test`. Deterministic tests use fake transports; startup-denial tests remove Docker from the child PATH. They do not establish real Auth/RLS or runtime port safety. Do not run the build/live/reset commands below while their prerequisites remain blocked. See the [current checkpoint and remaining work](../../docs/v3/SLICE-0-IMPLEMENTATION-NOTES.md#h-offline-checkpoint--22-october-2026).

## Future runtime validation (blocked)

```sh
npm run check
npm run build
npm start
# Separate terminal, with the isolated app running:
npm run v3:test
```

Registration is disabled globally. The test suite provisions two confirmed `v3-slice0-…@example.invalid` accounts carrying the `my-kravv-v3-slice0` purpose marker, exercises actual Auth/RLS/HTTP Server Actions and removes only those verified users and their Company fixtures. It never prints their passwords or tokens. No standing login account is created. Do not put personal research in this environment. Retained V2 `test:live` / `test:ai-smoke` commands are not the Slice 0 test entry points.

A reset is separately explicit:

```sh
npm run v3:reset -- --confirm-disposable-v3
```

The runner repeats the manifest, local engine, exact container/volume, database marker, user-purpose and public-table checks immediately before the only permitted reset invocation:

```text
supabase --network-id my-kravv-v3-local-01a14897-loopback db reset --local --no-seed --yes --workdir <absolute-repository>/supabase/v3
```

Never run a reset, migration push, project link, or CLI start from the repository root. Root `supabase/migrations/` is historical V2. Do not use `--no-backup`, global prune, or an unrelated container/volume as cleanup. No reset is claimed as validated until it actually completes and the integration suite passes again.

## Deliberately unavailable

Only `/auth`, `/foundation` and the entry redirect are allowed. The foundation demonstrates synthetic Company create/rename/read only. Every write verifies the current Auth user independently of Proxy; RLS enforces ownership at the database boundary. Legacy context entry is also blocked, so a directly submitted legacy Server Action cannot revive obsolete Company/Thought behavior. Production AI transport construction is disabled; deterministic fake transports remain testable.

Company DELETE has no authenticated grant or policy, no deletion RPC and no archive field. Later child migrations must add indexed composite `(company_id,user_id)` foreign keys to `companies(id,user_id)` with `ON DELETE RESTRICT`. Empty-only deletion stays unavailable until a separately authorized transactional implementation enumerates all child categories and passes concurrent create/delete tests. The temporary rollback-only FK probe is a pattern check, not proof of complete future C1 enforcement.

Upstream setup references: [Supabase local development](https://supabase.com/docs/guides/local-development), [configuration](https://supabase.com/docs/guides/local-development/cli/config), [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/). Actual local evidence takes precedence over assuming those recipes work on this host.
