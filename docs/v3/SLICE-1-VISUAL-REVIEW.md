# Slice 1 — Visual acceptance and UI refinement

23 October 2026, Asia/Jakarta. Baseline: 41ef9b9fd5ef4a024253c652e4e241debf501cfb.

## Safe preview

Run npm run v3:ui:preview from the repository, then open http://127.0.0.1:3104/foundation?view=companies.

This is a separate synthetic fixture host, not the authenticated Next application. It compiles the actual workspace/editor/loading components and CSS with installed TypeScript and the pinned Next distribution's bundled webpack/CSS loader. No packages are added. The small loader adapter supplies preview-only tracing and CSS locals; it is coupled to the installed Next version and must be revalidated when that dependency changes.

The preview reads no environment credentials or dotenv files. Exactly the existing Auth and foundation action imports are replaced with local mocks; unreviewed actions, Supabase and server-only imports fail compilation. There is no login or successful database write implementation. Save simulates a bounded local failure; logout returns a synthetic unavailable-session message.

Only GET requests for the fixed document, bundle and local font are served. The server binds explicitly to 127.0.0.1:3104, sends no-store headers and a CSP with connect-src none and form-action none, and stops after 30 minutes or Ctrl+C. Generated bundles live in a unique OS temporary directory, removed only after checking its location/prefix. No project database, secret, SQL, app proxy or execution interlock is involved.

Run node scripts/v3/ui-preview.mjs --check to compile and check the fixture graph without starting a server. Other CLI options are refused. This is not a production build or authentication bypass; never expose the fixture server publicly or present its samples as real account data.

Fixtures: state=empty, state=error and state=loading; ordinary view and company query fields exercise directory, create, edit and inaccessible-company UI. All Company names/IDs are synthetic.

## Corrections

- At 390px, default expanded navigation originally pushed the company heading to roughly 691px below the viewport top. Both secondary panels now default collapsed at <=720px; desktop keeps them expanded. Explicit user choices remain independent, and responsive changes subscribe/unsubscribe without an effect-based state reset.
- Account and company-switcher disclosures close on Escape and restore focus to their summary.
- Each directory open action now has a distinct accessible company name.
- Removed the redundant second clear-search action in the no-results state.

No authentication, persistence payload, schema, ownership or deletion behavior was changed.

## Real browser evidence

Interactive fixture checks in the connected Chromium browser:

- Desktop 1440x1000: directory, selected navigation, company overview, independent panel toggles, light/dark appearance and long company names.
- Mobile 390x844: collapsed panels, company selector/search/switch, create/edit layout, pending save, retained controlled input after mocked failure, disabled submission with an empty name, empty data, load error and unavailable Company.
- Narrow 320x812: long company name wraps without horizontal document overflow.
- Keyboard: skip link focuses main content; Escape closes account and company-selector disclosures and restores summary focus.
- Loading renders its live status. Load failure is an alert rather than an empty-success list; inaccessible selection does not display another Company's identity.
- Sampled semantic contrast ratios (not a full WCAG audit): light primary text/canvas 13.45:1, muted text/panel 5.90:1 and primary action 7.49:1; dark equivalents 14.92:1, 8.18:1 and 9.95:1.

The first browser connection failed because the process was in the isolated network sandbox. Restarting only this loopback fixture host with host-level execution made it reachable. No global networking setting or application guard was changed.

## Screenshots

Local output directory outside Git:
C:/Users/PIXWAR/.codex/visualizations/2026/10/22/01a16214-37fb-78d2-a02b-777e2110cd88/slice1-review/

- desktop-directory-light.jpg
- desktop-directory-dark.jpg
- desktop-workspace-light.jpg
- mobile-directory-light.jpg
- mobile-workspace-dark.jpg
- mobile-empty-light.jpg
- mobile-form-error.jpg

Every screenshot includes synthetic-preview labeling. These are owner-review artifacts, not proof of live Cloud integration.

## Validation and remaining work

Focused workspace suite: 9 passed. Full deterministic suite: 154 passed, 0 failed, 0 skipped. Lint, typecheck, formatting and git diff --check passed. Staged scope and whitespace are checked again before the local commit.

Permitted guarded build check: npm run v3:cloud:build refuses the unconfigured Cloud target before compiler/runtime launch (exit 1). The offline fixture bundle compiled successfully. No guarded production build was bypassed or represented as passing.

Owner visual review is ready. Remaining Slice 1 work includes metadata/ticker support, scalable backend search/pagination, server-persisted appearance and reviewed empty-only deletion. Real authenticated HTTP acceptance, account switching, confirmed/failed/uncertain persistence through the application and a production build require separate authorized application execution. Touch/mobile hardware, full screen-reader coverage and a full accessibility audit are not established by this fixture review.

The V2 implementation, main, Cloud application interlock, dormant API runner pin, database fixtures and all historical private evidence remain unchanged.
