# V2 implementation evidence and retention notes

Consolidated on 17 October 2026 (Asia/Jakarta) from ten milestone retention READMEs. Their repeated policy is recorded once below; every original stage title, report association and retained-image selection is recorded separately. No image was deleted by this reorganization.

## Shared retention checkpoint — 17 October 2026

This was a temporary browser QA capture directory, using fictional owned records and injected mock providers. Its full screenshot matrix, browser logs and measurement dumps have been retired from the working tree. Original test results, implementation decisions, ownership/draft/pagination safeguards and known limitations remain in the stage reports linked below. Historical capture counts in those notes do not describe the retained inventory.

See the [curated V2 gallery and retention policy](../README.md) for all 13 application images, original references and 23 static prototype renders. Phase 4B visual approval remains pending; archival does not establish design approval.

## Reproduction and limitations

Browser QA still uses the guarded disposable helper in [scripts/phase-1-visual-fixture.ts](../../../scripts/phase-1-visual-fixture.ts), with `MY_KRAVV_LIVE_TESTS=development`. Use only purpose-marked development records, injected mock providers and explicit fixture cleanup. Capture/generation/review tests are preserved in source; no real-provider request is authorized by these historical instructions. Do not use production or real user records. Credentials stay in ignored local files.

Write new outputs to `.qa/<task>/`, not this reference directory. The Phase 4A final-polish and Phase 4B runners have been updated accordingly. See the implementation report for the original fixture modes, covered states and historical validation results; regenerating a before-state requires its matching code and must not reset someone's uncommitted work.

Responsive captures do not establish native browser zoom, physical keyboard/safe-area behavior or screen-reader support. Full-page exports may position fixed navigation at the initial viewport band. These limits remain manual review items. No app styling or screenshot retouching was introduced by this cleanup.

## Stage provenance

### Phase 1 — visual foundations

Former directory: `design/milestone-5.5-phase-1/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/16-milestone-5.5-phase-1-notes.md).

No screenshots from this superseded stage are retained; use the curated selection.

### Phase 2 — navigation and Company workspace

Former directory: `design/milestone-5.5-phase-2/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/17-milestone-5.5-phase-2-notes.md).

Selected historical application evidence remains:

- [companies-1440.jpg](phase-2/companies-1440.jpg)
- [companies-390.jpg](phase-2/companies-390.jpg)

### Correction A — shared workspace alignment

Former directory: `design/milestone-5.5-phase-3-alignment-a/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/18-milestone-5.5-phase-3-notes.md).

No screenshots from this superseded stage are retained; use the curated selection.

### Correction B — reading and writing

Former directory: `design/milestone-5.5-phase-3-pemikiran-b/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/18-milestone-5.5-phase-3-notes.md).

No screenshots from this superseded stage are retained; use the curated selection.

### Phase 3 — Overview and Pemikiran

Former directory: `design/milestone-5.5-phase-3/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/18-milestone-5.5-phase-3-notes.md).

No screenshots from this superseded stage are retained; use the curated selection.

### Phase 4A — final visual polish

Former directory: `design/milestone-5.5-phase-4a-final-polish/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/21-milestone-5.5-phase-4a-visual-polish.md).

Selected historical application evidence remains:

- [after-overview-1440.png](phase-4a-final-polish/after-overview-1440.png)
- [after-overview-390.png](phase-4a-final-polish/after-overview-390.png)
- [after-thoughts-1440.png](phase-4a-final-polish/after-thoughts-1440.png)
- [after-thoughts-390.png](phase-4a-final-polish/after-thoughts-390.png)

Runner output: `.qa/milestone-5.5-phase-4a-final-polish/`.

### Phase 4A — reading order correction

Former directory: `design/milestone-5.5-phase-4a-reading-order/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/20-milestone-5.5-phase-4a-notes.md).

No screenshots from this superseded stage are retained; use the curated selection.

### Phase 4A — persistent display choice

Former directory: `design/milestone-5.5-phase-4a/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/20-milestone-5.5-phase-4a-notes.md).

Selected historical application evidence remains:

- [1440-home.jpg](phase-4a/1440-home.jpg)
- [390-home.jpg](phase-4a/390-home.jpg)

### Phase 4B — Refine comparison and version flow

Former directory: `design/milestone-5.5-phase-4b/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/22-milestone-5.5-phase-4b-notes.md).

Selected historical application evidence remains:

- [after-suggested-1440-viewport.png](phase-4b/after-suggested-1440-viewport.png)
- [after-suggested-390.png](phase-4b/after-suggested-390.png)
- [after-selected-superseded-1440.png](phase-4b/after-selected-superseded-1440.png)
- [version-trail-expanded-desktop.png](phase-4b/version-trail-expanded-desktop.png)
- [editing-retained-mobile.png](phase-4b/editing-retained-mobile.png)

Runner output: `.qa/milestone-5.5-phase-4b/`.

### Company Refine workspace

Former directory: `design/milestone-5.5-refine-workspace/`.

[Implementation report](../../../docs/archive-v2/implementation-notes/19-milestone-5.5-refine-workspace-notes.md).

No screenshots from this superseded stage are retained; use the curated selection.
