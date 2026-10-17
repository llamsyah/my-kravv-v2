# Phase 1 — visual foundations

## V2 retention checkpoint — 17 October 2026

This was a temporary browser QA capture directory, using fictional owned records and injected mock providers. Its full screenshot matrix, browser logs and measurement dumps have been retired from the working tree. The original test results, implementation decisions, ownership/draft/pagination safeguards and known limitations remain in the [implementation notes](../../docs/16-milestone-5.5-phase-1-notes.md). Historical capture counts in those notes do not describe the retained inventory.

No screenshots from this superseded stage are retained. Use the current curated evidence instead.

See the [curated visual index and retention policy](../README.md) for original references, static design prototypes and the complete 13-image application selection. Phase 4B visual approval remains pending; this cleanup is not design approval.

## Reproduction and limitations

Browser QA still uses the guarded disposable helper in `scripts/phase-1-visual-fixture.ts`, with `MY_KRAVV_LIVE_TESTS=development`. Use only purpose-marked development records, injected mock providers and explicit fixture cleanup. Capture/generation/review tests are preserved in source; no real-provider request is authorized by these historical instructions. Do not use production or real user records. Credentials stay in ignored local files.

Write new outputs to `.qa/<task>/`, not this reference directory. The Phase 4A final-polish and Phase 4B runners have been updated accordingly. See the implementation report for the original fixture modes, covered states and historical validation results; regenerating a before-state requires its matching code and must not reset someone's uncommitted work.

Responsive captures do not establish native browser zoom, physical keyboard/safe-area behavior or screen-reader support. Full-page exports may position fixed navigation at the initial viewport band. These limits remain manual review items. No app styling or screenshot retouching was introduced by this cleanup.
