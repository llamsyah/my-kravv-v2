# Slice 1 — Company & App Shell milestone

22 October 2026. Owner-authorized product implementation; offline checkpoint.

## Delivered product surface

The authenticated V3 entry point /foundation now renders the first V3 product shell instead of the Slice 0 test form. Query-based navigation stays inside the existing proxy allowlist: view=home, companies, new, company&company=<UUID> and edit&company=<UUID>. The root login/session redirect remains unchanged. No legacy V2 route is enabled or rewritten.

The light-first shell provides Indonesian Beranda/Perusahaan navigation, a private account disclosure with existing logout, and a coherent dark appearance toggle. Company overview has independently collapsible contextual navigation and a right context panel; mobile layouts stack these surfaces rather than squeeze the main content. Appearance and panel state are in-memory UI preferences, not server-persisted settings.

The directory and selector share case-insensitive name search over the owned projection loaded by the existing foundation service. Empty data, no search results, load failure and inaccessible company selection are distinct. No sample companies, research metrics, financial facts, archive taxonomy or cascade controls are inserted into the product. The existing 100-row cap is disclosed when reached; scalable backend search/pagination remains future work.

Create and rename use the existing getUser()-verified, owner-filtered name-only service. The action returns the actual confirmed Company identity; only confirmed success navigates to its overview. Controlled input remains visible on failure, pending submission is disabled, and uncertain saves direct the owner to inspect the directory before retrying. Browser-provided ownership is never authority. Loading and route-error boundaries disclose no raw exceptions.

## Preserved boundaries and capability limits

- Application Cloud execution stays blocked; the separate API runner pin remains null.
- Earlier owner-authorized 37/37 API acceptance is separate evidence. This checkpoint makes no Cloud, database, Docker, privileged-key or provider requests.
- V2 pages, migrations and schemas are preserved.
- Name create/list/edit operate only when the existing guarded application runtime is separately authorized and available. This checkpoint neither enables it nor claims HTTP application acceptance.
- Ticker/exchange/sector/private-note fields and server theme preferences require later reviewed V3 schema/contracts. The UI does not submit unsupported columns.
- Empty-only deletion (C1), catalog/lock/race validation and restrictive destructive permissions remain unimplemented; no delete action is exposed. No archive or cascading deletion is added.
- Ruang Tulis, Pemikiran, Explore and Referensi are labeled unavailable, with no active links into V2 functionality. No Quick Capture, Writing Modes, Thought recording or AI work is implemented.

## Offline validation and limits

Read installed Next.js guides for layouts/pages, Server/Client Components, error handling and CSS before implementation.

Focused command: node --conditions=react-server --test src/tests/v3-workspace.test.ts. Seven deterministic tests cover location parsing, bounded shared search, foreign/missing selection, rendered empty/error/access states, actual overview/form markup and action success/failure with mocked dependencies. The test-only renderer compiles actual TSX and supplies inert Next navigation/server actions. It does not disable application guards.

Final checks: npm run lint, npm run typecheck, npm run format:check and git diff --check passed (exit 0). Focused workspace tests: 7 passed, 0 failed, 0 skipped. Full npm test: 152 passed, 0 failed, 0 skipped. No live test or HTTP acceptance is counted as passing.

Build check: npm run v3:cloud:build exits 1 with “V3 Cloud target identity conflicts with owner approval” in the unconfigured execution-blocked process. No compiler or backend operation is launched. A successful production build is not claimed; no placeholder credentials or direct-build bypass is introduced.

Static synthetic HTML rendering was tested at the first checkpoint. The 23 October visual refinement adds a separate interactive fixture preview, with real browser checks and screenshots documented in SLICE-1-VISUAL-REVIEW.md. This verifies synthetic UI interactions, not HTTP login/account switching, database persistence or deployed behavior.

## Remaining Slice 1 acceptance

1. Separately approve guarded application Cloud execution and HTTP testing, retaining exact target/session isolation.
2. Complete visual/keyboard/reflow checks at desktop/mobile widths in both themes, plus account switching and stale-session behavior.
3. Review and implement metadata/search/pagination and persisted appearance contracts before enabling those inputs.
4. Add and test empty-only deletion with catalog coverage, ordinary-user bypass checks and creation/deletion concurrency.
5. Validate live create/rename failure, uncertain responses, duplicate submissions and ownership through application HTTP.
6. Complete a real production build under an authorized target configuration.

No previous private grant, manifest, consumed claim or fixture is modified by this milestone.
