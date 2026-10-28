# Writing reference refinement 04–06

## Reference and implementation map

Inspected the actual `design/v3/references/04-writing-space-guided.png`,
`05-writing-space-companion.png`, and `06-writing-space-ai-review.png`.
These are three states of one writing environment, not separate documents.
The accepted Company sidebar is reused; Writing alone receives a document header,
readable central canvas and independently collapsible right Companion.
Home, Directory and Overview composition is retained.

- `workspace.tsx` retains WritingSession and the existing create/save/commit,
  recovery, conflict, history and restore actions. It adds a bounded draft picker,
  real Markdown selection/line commands, six optional guidance areas and explicit
  save status. Blank, Guided and Assisted share the same exact Markdown body.
- `companion.tsx` provides Panduan/Bahan/AI Review/Referensi, keyboard tab movement
  and a narrow-screen modal drawer. Tabs and hide/reopen retain mounted review
  state; changing the responsive container may remount that secondary review UI,
  while the editor and WritingSession remain mounted. Mobile starts closed.
- `reasoning-panel.tsx` separates mode selection from explicit Run, uses the
  existing request and saved-run contracts, and renders structured feedback beside
  the editor. History loads only on explicit demand. A changed source revision or
  dirty draft marks old feedback stale. No tab, mode or panel action invokes AI.
- `writing-tools.ts` contains presentation guidance and deliberate Markdown
  commands, not another document or storage model.

One concrete read-integration correction: the selected-draft route previously
loaded the document/history but omitted the bounded list needed to select another
draft. `src/app/foundation/page.tsx` now calls the existing `listResearchDrafts`
service after validating the real Company context. Its owner checks, Company
filter, stable ordering and page limits remain unchanged. A route regression
checks that the list contains the selected owned draft and no other owner/Company.
The shared drawer focus helper now excludes explicit `tabindex=-1` controls.

## Truthful behavior and deliberate differences

The deployed document is one Markdown string. Guided section rows select questions;
they are not six independently persisted section editors. Headings enter the text
only through an explicit command. There are no invented completion percentages.
Saving is distinct from an explicit transactional Thought commit. Existing
immutable version/history/diff/restore behavior is retained, not redesigned.

Company-scoped and Company-less creation, deep links, existing draft selection,
and owned Capture provenance remain supported. Bahan displays only an actual
source Capture, which remains unchanged. New-draft creation still requires the
existing server confirmation; the synthetic preview does not fake that operation.

Candidate staging, Context Snapshot, follow-up AI conversations, persistent Explore
materials and References selection are not implemented. Their panel states disclose
these gaps rather than fabricate sources, counts or provider conversations.
AI and Cloud runtime interlocks remain blocked. Saved synthetic AI feedback is
explicitly marked as synthetic and is not evidence of provider acceptance.

## Offline checks and visual evidence

The existing loopback-only preview uses synthetic data and mocked server boundaries,
with external connections denied. Its save/commit fixtures are memory-only and do
not establish real persistence across a full reload. Existing service/session tests
cover persistence, recovery, CAS/idempotency, immutable revisions and account scope.

Observed in the browser: mode/tab/hide/reopen operations preserve exact body text;
confirmed mock autosave precedes Tersimpan; an uncertain save retains input and
shows Penyimpanan belum pasti; explicit commit produces a read-only version;
Ctrl+B produces actual Markdown; clean draft selection changes the document;
Company-less entry does not fabricate a Company; Bahan preserves Capture text;
structured saved feedback and stale status render without provider execution.
Tablet/mobile have no horizontal overflow; mobile Companion Escape restores focus.
Light and dark appearances were inspected. No browser console warnings/errors were
observed in the final responsive review.

Screenshots are ignored local QA output in `.qa/writing-reference-04-06/`:

- `guided-light.png`: desktop Guided writing.
- `companion-writing-light.png`: desktop Assisted writing with guidance.
- `companion-light.png`: source Capture in Bahan.
- `ai-review-light.png`: structured, clearly synthetic saved AI feedback.
- `panel-closed-light.png`: focused editor with Companion hidden.
- `new-draft-light.png`: independent creation and draft entry.
- `guided-dark.png`: desktop dark appearance.
- `tablet-light.png`: 900 × 1000 viewport.
- `mobile-light.png`, `mobile-companion-light.png`: 390 × 844 editor/drawer.

Validation commands:

```sh
node --conditions=react-server --test src/tests/writing-workspace.test.ts src/tests/research-core.test.ts src/tests/v3-workspace.test.ts
npm test
npm run lint
npm run typecheck
npm run format:check
git diff --check
node scripts/v3/offline-build.mjs
```

Focused suite: 35 passed. Full deterministic suite: 289 passed, 0 failed/skipped.
Lint, TypeScript, formatting, diff checks and the isolated network-denied production
build passed. This is offline compilation and mocked behavior, not live Cloud,
provider or real Next.js authenticated browser acceptance.

No migration, SQL contract, service mutation, runtime gate or prior acceptance
evidence changed. V2/main and the two preexisting untracked Research Core handoff
files are excluded from this checkpoint. No push or next refinement is authorized.
