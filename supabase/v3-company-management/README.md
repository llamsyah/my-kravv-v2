# Company management — migration review package

Prepared offline only. Neither SQL file has been executed. This directory is deliberately outside the configured local migrations and the pinned Cloud bootstrap. No startup/reset/build command applies it.

## Proposed contract

`001-company-management.sql` is a single additive transaction guarded by the exact approved V3 Cloud/local markers. Unknown identity, missing RLS, pre-existing management columns or duplicate functions stop the transaction; no automatic reconciliation or adoption is attempted. Base identity version 1 and the original bootstrap remain unchanged. A separate authenticated capability RPC reports management contract 1, which grants no execution authority.

Nullable company fields: ticker (32 characters), exchange (80), sector (120), short_note (2,000). Name remains required (200). These are proposed engineering bounds for this review, not inherited V2 schema approval. Single-line identifiers reject controls; notes support plain multiline text. The application trims boundary whitespace and maps blank optional values to null. Browser/JavaScript limits count UTF-16 code units and can be more conservative than PostgreSQL character counts.

The migration grants authenticated INSERT/UPDATE only on the new company columns and theme. Existing ownership, name, ID, timestamp, SELECT and company RLS contracts remain intact. `user_settings.theme` defaults to light, with an owned UPDATE policy. There is no ownership UPDATE, DELETE grant, destructive RPC or service-role application access. Search functions are invoker functions with empty search_path, qualified tables and auth.uid owner predicates, so ordinary user RLS still applies.

Directory search is literal case-insensitive name/ticker substring matching. It returns at most 25 rows (24 visible plus a continuation probe), ordered by created_at/id. Pages range from 0 through 10,000. Offset pagination is bounded but not a transactional snapshot; later very large datasets may justify keyset/search-index work after measurement. No total count or arbitrary financial facts are invented.

## Separate approval and acceptance sequence

1. Review this SQL, its static tests, privileges and proposed field limits. Confirm the target is the dedicated V3 project, never V2. Inspect existing catalog/marker, preserve needed data and record the current schema before authorizing execution. Unexpected objects/columns are a stop condition.
2. Explicitly approve one application of `001-company-management.sql` on that exact V3 target. Execute the reviewed transaction only; do not reset a project, replay bootstrap, drop objects or edit the identity marker. A failure requires diagnosis, not automatic repair/retry.
3. Separately run `verify.sql`. Its anonymous block raises exceptions on missing/unexpected catalog conditions; the final PASS row covers those checks only. It is not proof of live RLS correctness, complete policy equivalence or application acceptance.
4. Authorize bounded two-user tests with synthetic accounts and uniquely named fixtures. Test metadata create/read/edit; unchanged rows after cross-user writes and forged-owner requests; anonymous rejection; invalid bounds; independent theme INSERT/UPDATE; unchanged ownership/ID; name-only compatibility; and directory/switcher paging over more than 24 rows. Inspect privileges and constraints as well as results. Preserve uncertain-write evidence. No broad cleanup, account deletion, reset or reuse of earlier grants/manifests is part of this package.
5. Only after separate execution approval, test the guarded application over HTTP: metadata confirmation/error/uncertain states, theme reload/account switching, literal search, continuation links, selected company outside the current result page, unavailable IDs and production build. Both existing execution interlocks remain closed in this checkpoint.

Local database compatibility receipts would also require review after any later approved schema change. Do not infer retained-volume compatibility from this package or adopt existing resources automatically.

## Offline evidence and limitations

Deterministic tests validate contracts, owned query construction, bounded pagination, pending-schema refusal, exact confirmed write receipts, theme column grants and static migration structure. SQL was not compiled or executed against PostgreSQL. Catalog assertions, two-user live RLS, SQL behavior, application HTTP and production build still need the approvals above.
