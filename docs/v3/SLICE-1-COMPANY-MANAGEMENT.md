# Slice 1 — Company management functionality checkpoint

23 October 2026. Baseline: bb13810fbddbf7306fe8c85820d3643c45a5f262 on v3.

Phase A was already committed and clean; no redundant navigation commit was created. Its separate directory and panel controls are preserved. This checkpoint extends the accepted UI with functionality rather than a visual redesign.

## Implemented offline

- Optional ticker, exchange, sector and plain personal notes in create/edit, bounded validation, ownership-scoped services, confirmed-value checks and retained inputs on failed/uncertain saves. Overview/directory show entered metadata only. Notes never enter an AI request.
- A narrow schema capability check. Only the known missing-RPC result selects legacy mode; unexpected errors or versions fail closed. Existing-schema mode keeps name-only create/edit and name search. New metadata writes independently recheck capability; a browser flag is never authority. No schema is installed automatically.
- Directory and company selector load 24 rows plus one continuation probe, with previous/next links and explicit submitted search. Selection is fetched independently of the current result page/search. Before migration, name search/paging uses existing table privileges; after migration, an invoker/RLS RPC provides literal name-or-ticker search. Malformed/foreign/duplicate responses are rejected.
- Persisted light/dark preference. The existing-schema mode stores the non-sensitive theme locally on this browser/device. After schema approval, an ordinary authenticated session reads/saves user_settings.theme; the account value is authoritative on subsequent navigation/reload. Updates write only theme, never user_id. Missing rows use an explicit INSERT rather than an ownership-changing upsert. Concurrent creation or save failure reports an unconfirmed account save; there is no automatic retry. The immediate local choice remains visible, but a later account reload may restore the last confirmed account value after a failed save.

The original Slice 0 service remains available for its pinned name-only integration contract. No V2 domain fields or migrations were imported. Company metadata limits and account-theme SQL are prepared in the separate [review package](../../supabase/v3-company-management/README.md); they are not live-ready or applied.

## Validation

Focused: node --conditions=react-server --test src/tests/v3-management.test.ts src/tests/v3-workspace.test.ts — 26 passed, 0 failed/skipped. Full npm test — 171 passed, 0 failed/skipped. npm run lint, npm run typecheck, npm run format:check and git diff --check passed.

Permitted npm run v3:cloud:build refuses before compilation/runtime with the existing target-identity guard (exit 1). Production build is unverified; no placeholder credentials or guard bypass were introduced. The offline UI fixture graph compiles successfully.

Synthetic Chromium checks: 55-record directory pagination (24 visible rows), ticker search, selected company outside its switcher search/page, mobile switching from the second page, metadata form and retained values after mocked failure, theme across navigation/reload, and legacy schema notice with no metadata inputs. No horizontal overflow or browser warnings/errors were observed in these checked views. Account theme success in the preview is simulated locally; it is not evidence of a Cloud write.

Review screenshots outside Git:
C:/Users/PIXWAR/.codex/visualizations/2026/10/22/01a16214-37fb-78d2-a02b-777e2110cd88/slice1-company-management/desktop-metadata-dark.jpg and mobile-editor-dark.jpg.

## Still required

Independent migration/privilege review, explicit approval to apply it to the exact V3 target, actual catalog/SQL testing, bounded two-user metadata/theme RLS acceptance, guarded application HTTP/account-switching/write-recovery acceptance and production build. Offset pagination is intentionally simple and bounded, not snapshot-isolated or an infinite-search platform. A successful SQL/capability result does not activate either application or API-runner execution.

Both execution interlocks, approved bootstrap hash, V2, main and historical security evidence remain unchanged. No Cloud/SQL/Docker/provider operation, destructive deletion, Quick Capture, Thought or AI functionality is included. No push or merge.
