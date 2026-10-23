# Slice 1 — Focused Home and company navigation refinement

23 October 2026, Asia/Jakarta. Baseline: f3370cf6a31f09dceed69ae121ebe1fb3cc7f171, branch v3. Owner visual review is pending.

## Product changes

Home follows the approved 01-home.png reference's personal welcome, two-level typography, restrained green and layered company section, without its images or unfinished modules. A compact two-line heading introduces a single research-dashboard section. Search, the prominent create-company action, loaded count and directory access are grouped inside that section. Compact name-based shortcuts link directly to each company's real overview. No logos, image placeholders, invented metadata or activity are shown. The loaded projection still contains only name and ownership/identity fields; no backend fields were added.

The isolated promotional create panel is removed. Empty Home retains one create action and a compact inline explanation. A simple section grid can accommodate later separately implemented modules, with no disabled or fake widgets occupying those positions now. Directory behavior and Company Overview content are preserved.

Desktop navigation closes completely: its hidden aside occupies no grid column. An integrated breadcrumb control reopens it; closing moves focus to that control, and reopening moves focus into navigation. Selected company remains the URL-based owned selection. Escape closes desktop navigation, while an open nested disclosure consumes Escape first.

The desktop open/closed preference is one non-sensitive boolean in tab sessionStorage, independent of company and account identity. It survives navigation and reloads in the same tab. No company IDs, names, credentials or authorization data are stored. Storage exceptions fall back to module memory: navigation remains usable, but a full reload cannot guarantee preference retention when browser storage is blocked. Presentation preference never grants access.

Mobile always starts with a closed native modal dialog. Opening focuses its close control; background content is inert while modal, background scrolling is temporarily locked, and Tab/Shift+Tab explicitly cycle visible controls. Nested disclosures close first on Escape; a subsequent Escape closes the drawer. Close, backdrop dismissal and company navigation restore the page interaction state. Links close the drawer after navigation. The mobile drawer state is separate from the desktop preference. The existing optional context panel remains closed by default.

## Safe browser review

Used the existing synthetic loopback preview on port 3105, with actual UI/CSS and mocked server actions. No credential/environment loader, Cloud request, live Auth, data write or application guard bypass was used. Preview outputs remain temporary and screenshots remain outside Git.

Verified in Chromium:

- Home and workspace at 1440x1000 and 390x844 in both themes, with workspace navigation open and closed.
- Desktop close releases the full 244px column in the 1440px view; selected company is preserved. Both closed and reopened states survive company/edit navigation.
- Mobile default closed, open/close, company selector/search/switch, backdrop dismissal, focus entry/return, body-scroll restoration, forward/reverse Tab boundaries and nested Escape behavior.
- Home search and company/create navigation, compact empty and load-error states, and unchanged empty-name submission prevention.
- 320x812 long-name/drawer reflow, intermediate-width optional context, and no horizontal document overflow in the checked views.
- Console warning/error inspection and keyboard skip-to-main behavior. These are synthetic UI checks, not live application HTTP acceptance or a full accessibility audit.

## Screenshots

Twelve full-page, synthetic-preview-labeled JPEGs outside Git:

C:/Users/PIXWAR/.codex/visualizations/2026/10/22/01a16214-37fb-78d2-a02b-777e2110cd88/slice1-home-sidebar/

- desktop-home-light.jpg and desktop-home-dark.jpg
- mobile-home-light.jpg and mobile-home-dark.jpg
- desktop-workspace-open-light.jpg and desktop-workspace-open-dark.jpg
- desktop-workspace-closed-light.jpg and desktop-workspace-closed-dark.jpg
- mobile-workspace-open-light.jpg and mobile-workspace-open-dark.jpg
- mobile-workspace-closed-light.jpg and mobile-workspace-closed-dark.jpg

## Validation and boundaries

Focused command: node --conditions=react-server --test src/tests/v3-workspace.test.ts — 13 passed, 0 failed/skipped. This includes Home capability/scope checks, retained UI/service tests, preference persistence/restricted-storage regressions, keyboard-cycle regressions and offline preview compilation.

Full npm test — 158 passed, 0 failed/skipped. npm run lint, npm run typecheck, npm run format:check and git diff --check passed.

The Company Overview content, name-only create/rename contract, Cloud execution interlock, dormant API runner pin, approved bootstrap SQL/hash, V2, main and historical private evidence are unchanged. No dependencies, backend capability, migration, destructive action, paid provider request, push or merge are included.

No material blocker was found for owner visual review. Live application HTTP acceptance and production build remain separately guarded and unverified. This milestone does not advance Quick Capture, Thought, writing or AI features.

## Focused navigation semantics correction

After owner feedback on checkpoint 9c4686a905aa89c0c143ac1f3262ba44d66c9552, the expanded sidebar now explicitly displays arrow-left + Semua perusahaan as a real directory link. Collapse and reopen use separate panel icons and distinct accessible button names. When closed, the workspace header retains its own directory link alongside the reopen control. Neither toggle changes the selected company or route. No Home redesign, Overview content change or future global navigation item was introduced.

Desktop/mobile synthetic browser checks verified directory navigation from both expanded and collapsed states, full width release, preserved company/URL after toggling, mobile Tab containment, Escape dismissal and focus/scroll restoration. No console warnings/errors were observed. Screenshots are outside Git in C:/Users/PIXWAR/.codex/visualizations/2026/10/22/01a16214-37fb-78d2-a02b-777e2110cd88/slice1-navigation-semantics/ (desktop-expanded.jpg, desktop-collapsed.jpg, mobile-expanded.jpg, mobile-collapsed.jpg).

An isolated event-level regression exercises the actual workspace/sidebar handlers for desktop and mobile, keeping effects inert and refusing unexpected dependencies. It asserts distinct link/button semantics, the directory destination, preserved active company/Overview route, and no navigation during collapse/reopen. Focused suite: 14 passed. Full deterministic suite: 159 passed, 0 failed/skipped. Lint, typecheck, formatting and diff checks passed. These synthetic checks do not establish live application HTTP acceptance. Cloud guards, backend contracts, V2 and main remain unchanged.
