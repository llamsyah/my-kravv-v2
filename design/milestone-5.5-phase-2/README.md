# Phase 2 — actual navigation and Company shell QA

Unretouched captures of the running Next.js application, using fictional records
in a marked disposable development account. Its proposal used an injected mock;
no external AI provider was called. All fixture records and credentials were
removed after verification. Earlier prototype/Phase 1 artifacts were preserved.

- [Updated Company shell, desktop](updated-workspace-1440.jpg)
- [Long Company identity, desktop](workspace-1440.jpg) / [mobile](workspace-390.jpg)
- [Missing optional metadata, mobile](missing-metadata-390.jpg)
- [Account disclosure, desktop](account-desktop-open.jpg) / [narrow mobile](account-mobile-open.jpg)
- [Library, tablet](companies-768.jpg)
- [Edit, narrow mobile](edit-320.jpg)
- [Refine detail, desktop](refine-1440.jpg) / [mobile](refine-390.jpg)
- [Archived Company](archived-390.jpg) / [archived Refine](archived-refine-390.jpg)
- [Management disclosure](management-mobile-open.jpg)
- [Deleted Company unavailable](deleted-company-unavailable-390.jpg)
- [Final layout metrics](render-metrics.json) / [runtime summary](runtime-summary.json)
- [Captured image dimensions](capture-manifest.json)

Seven existing views at 1440/768/390/320 CSS px plus two mutation cases provide
30 final measured layouts: one h1, no page-wide document overflow, no unfinished
section links, local fonts loaded and 44px account/management triggers. Keyboard,
draft recovery/cleanup, capture receipt, real edit/archive/logout and disposable
Company deletion were exercised. No provider generation button was submitted.

The in-app capture surface scales/trims output; the CSS viewport is not the file's
pixel size. CSS zoom 1, visual viewport scale 1 and reported DPR about 0.8 do not
prove native 100% zoom. Native zoom, real mobile keyboard/safe-area behavior,
screen-reader interaction and forced font-fallback testing remain manual. Fixed
navigation in full-page exports can appear within the exported sheet. No images
or application layouts were edited for screenshot export.

To reproduce the disposable data, use the existing
`scripts/phase-1-visual-fixture.ts` setup/populate/cleanup modes with the explicit
development guard and server-side environment, as documented in the Phase 1 report.
The helper retains its original Phase 1 purpose label; this run created a new
account. Do not reuse actual user records or invoke configured AI providers.

See [Phase 2 report](../../docs/17-milestone-5.5-phase-2-notes.md) for architecture,
preserved behavior, quality gates and the exact Phase 3 boundary.
