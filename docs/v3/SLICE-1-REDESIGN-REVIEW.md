# Slice 1 — Coherent research shell redesign

23 October 2026, Asia/Jakarta. Baseline: e62c1755b87346ba069b06818a6b4cfd4b4f7ffd on v3. Owner visual review is pending.

## Design decisions

Used design/v3/references/01-home.png and 03-company-overview.png for typographic hierarchy, restrained green accents, surface depth and workspace composition. No photography, illustrations, decorative images, unsupported research activity, metrics, inbox or AI features were added.

- Shared navbar, restrained content widths, spacing, surfaces, radii and semantic colors across Home, directory, workspace and forms. Light is the default; dark has its own text, muted, action and surface colors.
- Home replaces the oversized banner/search with a compact heading, bounded discovery cards and a separate creation panel. It shows up to six matching companies with a directory continuation; its total refers to the loaded owned projection, not research activity. Existing 100-row search limitations remain disclosed.
- Directory uses a dense divided surface with clear company names, monograms and individually named open actions. Search and creation remain explicit.
- Workspace sidebar combines return navigation, collapse control, company switcher/search and workspace destinations. Desktop can collapse to a narrow rail; mobile defaults to a compact closed header and closes after a switch. Main content remains dominant. The company name appears in the switcher and page heading without a third standalone sidebar heading.
- Context defaults closed on every viewport. Its control sits in the breadcrumb, and closing it returns keyboard focus to that control. On smaller screens the optional context follows main content rather than squeezing it.
- Future destinations live in one closed Area penelitian disclosure with disabled text, no fake links or repetitive availability badges. Secondary capability explanations in the overview and form use disclosures. Create/rename payloads and persistence semantics remain unchanged.

Appearance and panel choices remain in memory for the mounted UI. Cross-session appearance persistence is not implemented.

## Browser validation

Reviewed the actual React components/CSS in the existing synthetic fixture preview, at 127.0.0.1:3105. Port 3104 was occupied, so an allowlisted alternate loopback port was added; the unrelated listener was not stopped or modified. No dependencies were added. Preview actions remain mocked, backend imports forbidden, and CSP connect-src/form-action remain none. This does not launch the authenticated application or waive its execution gate.

Verified in the connected Chromium browser:

- Home, directory and workspace at desktop 1440x1000 and mobile 390x844 in both themes.
- Integrated sidebar collapse/reopen, independent optional context, company selector search/switch and default collapsed mobile panels.
- Directory/Home filtering, no-results recovery, creation/edit navigation, required-empty-name disabled state, pending save and retained input after a mocked failure.
- Empty data, explicit load alert, inaccessible-company state and loading live status. These fixture checks do not establish live authorization or persistence.
- Skip link focuses main; Escape closes account/switcher disclosures and restores summary focus; context close restores its control. Mobile account control retains an accessible name even when its text is visually hidden.
- 320x812 long-company-name reflow, including expanded switcher; no horizontal document overflow in the checked views.
- No browser console warnings/errors during the checked interactions.

Sampled semantic contrast ratios: light text/canvas 13.12:1, muted text/panel 5.82:1, action text/background 7.40:1; dark 15.08:1, 8.18:1 and 9.73:1 respectively. This is not a full accessibility audit or hardware/screen-reader certification.

## Review screenshots

Outside Git, synthetic-preview labeled, full-page JPEGs:

C:/Users/PIXWAR/.codex/visualizations/2026/10/22/01a16214-37fb-78d2-a02b-777e2110cd88/slice1-redesign/

For each of home, directory and workspace: desktop-<screen>-light.jpg, desktop-<screen>-dark.jpg, mobile-<screen>-light.jpg and mobile-<screen>-dark.jpg. An additional mobile-form-error.jpg records mocked failure feedback. These are review artifacts, not evidence of Cloud application acceptance.

## Checks and boundaries

- Focused: node --conditions=react-server --test src/tests/v3-workspace.test.ts — 11 passed, 0 failed/skipped.
- Full: npm test — 156 passed, 0 failed/skipped.
- npm run lint, npm run typecheck, npm run format:check and git diff --check — passed.
- npm run v3:cloud:build — expected refusal before compilation/runtime (exit 1: V3 Cloud target identity conflicts with owner approval). Production build remains unverified; no bypass or placeholder credentials were used. The separate offline fixture graph compiles successfully.

Cloud application interlock and dormant runner pin are unchanged, with no Cloud/database/provider requests. The approved bootstrap hash remains 3a833df429954f968daacff8ba4c4c54735eaa008f605b75a22a5c9edb1bbee9. Main, V2, historical manifests and consumed-run claims are untouched.

Remaining acceptance: owner visual review; separately authorized application HTTP/account-switching/persistence checks and production build. Metadata, server search/pagination, persisted appearance and reviewed empty-only deletion remain later Slice 1 work. No next feature milestone is included here.
