# Quick Capture — offline deployment package

**Not applied. No Cloud execution is authorized by these files.** Slice 1 is frozen;
its application acceptance remains PARTIAL. This package does not change those
results, runner plans/pins or either application execution boundary.

## Contract and ordering

Requires the dedicated V3 Slice 0 bootstrap and reviewed Company Management v1.
`001-captures.sql` is a single additive transaction, **non-idempotent; run once**
only after separate owner review. It checks the exact V3 environment marker and
refuses existing capture objects. No V2/Cloud database has been inspected here.

New `public.captures`: server-generated UUID/timestamp, verified `user_id`, client
`request_id`, nullable `company_id`, exact `raw_text`. The request ID is unique per
owner and intentional save. No separate status/history/workflow table: a row is
an inbox item. Moving it into writing/Explore, editing and confirmed deletion are
future slices; they must preserve content and use separately reviewed operations.

- Nonblank text, up to 8,000 Unicode code points / 32,000 UTF-8 bytes; PostgreSQL
  rejects NUL. The application also rejects ill-formed UTF-16 and Unicode-only
  whitespace. It never trims or normalizes accepted text. Textarea input follows
  the browser's native text/line-ending handling; no byte-exact file import is claimed.
- Newest-first owner index `(user_id, created_at DESC, id DESC)`, 20-row pages plus
  one lookahead, bounded to page 10,000. Concurrent insertion can shift offset
  pages; this is not snapshot pagination or a guaranteed immutable feed.
- Nullable composite `(company_id,user_id)` FK references owned companies with
  **ON DELETE RESTRICT**, plus a partial company/owner index. No cascade/detach.
  Company DELETE remains denied; there is no deletion UI or RPC. Every future
  empty-company deletion implementation must enumerate captures and pass races.
- RLS SELECT/INSERT only, exact `auth.uid() = user_id`; authenticated SELECT and
  INSERT only on `(user_id,request_id,company_id,raw_text)`. No ID/timestamp insert,
  UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER grant, anonymous access or service-role
  grant added. Effective catalog verification includes inherited/PUBLIC access.
- `v3_capture_contract()` returns 1 only as a schema capability, never execution
  authorization. `v3_create_capture(uuid,text,uuid)` is SECURITY INVOKER with an
  empty search path. It derives owner, locks an owned parent FOR KEY SHARE,
  inserts without UPDATE privileges and returns exactly the saved owned row.
  An unchanged same-key retry returns the existing row. A changed payload fails;
  concurrent transactions may fail and require explicit same-key revalidation.

## Separate future deployment/acceptance checkpoints

1. Review committed SQL/hashes and the exact dedicated V3 target. Preserve prior
   bootstrap, Company Management SQL, synthetic records and acceptance evidence.
2. Owner separately authorizes and executes `001-captures.sql` ONCE in that V3
   project's SQL Editor. Stop on any error/drift. Do not rerun or execute repair,
   rollback, reset or cleanup SQL automatically.
3. Execute `verify.sql` separately. It uses catalog-only assertions and one final
   JSON result. A SQL error is a failure, not an invitation to repair automatically.
   Expected six columns, two exact owner policies, five named validated constraints,
   four valid/ready indexes, zero user triggers, least-privilege column grants,
   invoker-only RPCs with empty search paths and version 1.
4. Inspect all JSON definitions against the migration, including defaults
   (`gen_random_uuid()`, `now()`), text bounds, owner/request uniqueness, both
   restrictive FKs and ordered indexes, and **complete RPC bodies**. Named catalog
   checks do not prove arbitrary function/constraint bodies match. Definition
   comparison and two-user runtime acceptance remain separate from catalog PASS.
5. Separately approve an appropriately scoped capture API/application acceptance
   plan. Existing Slice 1 grants do **not** authorize capture RPCs/table traffic;
   their immutable request allowlists intentionally remain unchanged. No existing
   runner/interlock is expanded in this milestone. Test optional/owned/foreign
   company, exact Unicode/whitespace round-trip, same-key lost-response retry,
   conflicting payload, owner/anonymous/forged-owner denial, server timestamp/ID,
   company-delete restriction, paging and B→A→B cache/draft isolation.

No live SQL parse/execution, concurrency test, RLS test or actual persisted use is
claimed by offline deterministic mocks. Credentials stay outside Git/chat.
