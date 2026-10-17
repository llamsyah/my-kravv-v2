# Phase 4A final visual polish — Personal × Professional

> V2 checkpoint, 17 October 2026: temporary browser captures and measurement dumps were retired. Historical results and limitations below remain; see the [curated visual index](../design/README.md) for retained evidence.

11 October 2026. Implemented for visual review; stop before Phase 4B.

Preserved the existing uncommitted Phase 4A implementation at HEAD
`6a80f47b87ac9bbb20259e93abafd2b0eb0aa65d`. Read the approved blueprint, current
Phase 4A report and installed Next.js CSS, Server/Client and icon-convention
guides. Inspected the previous actual screenshots and captured a fresh baseline
in the real application before editing. No framework or dependencies added.

## Decisions and changed files

- `src/features/companies/company-workspace.module.css`: quiet, borderless
  breadcrumb links with accessible focus/underline hover, visually secondary
  Kelola, restrained tab borders and unchanged mineral-green selected treatment.
  Reduced header spacing and bounded editorial Company heading to 32px desktop
  / 28px mobile; operational headings remain Inter. Long names remain fully visible
  in the identity while the breadcrumb truncates with its existing full title.
- `src/app/(private)/companies/[companyId]/page.tsx`: the context column requires
  an actual authored note. Removed its redundant Thought count; the count remains
  in the existing Semua pemikiran entrance. Queries, destinations and data semantics
  remain unchanged.
- `src/features/companies/company-overview.module.css`: quieter authored context
  with one structural divider; no empty context card. Without a note, the primary
  composition is bounded to reading width rather than expanding into a count-only
  dashboard. Tightened latest-text/CTA spacing and reduced provenance badge framing.
  Earlier rows retain the corrected marker/body/arrow grid and two-line excerpts.
- `src/features/thoughts/thought-workspace.module.css`: composer width derives
  from 68ch reading width plus functional padding and remains on the Company grid.
  The scoped form/textarea now fill its interior. Save/discard sit together beside
  exact-save help on desktop and wrap safely on mobile. Essential draft privacy,
  validation, recovery and storage messages remain intact. Bounded the reading
  heading to the reading area, tightened entry rhythm, aligned connector endpoints
  with numbering, and reduced contextual actions' prominence without removing them.
- `src/app/icon.svg`: reused the existing K/ink/mineral-green brand treatment for
  the browser tab. Fresh Chrome QA identified the pre-existing missing favicon
  as its only console failure. Next.js now emits the standard icon metadata and
  serves the static SVG. The strict console checks were retained; no errors hidden.

`scripts/phase-4a-polish-qa.mjs` is a guarded development browser regression harness
using the already-installed Playwright library and an isolated Chrome profile.
No package dependency change. It exercises actual layouts, local draft recovery
and discard, original disclosure, focus, hover, pagination and reduced motion;
it never submits capture or AI generation. The existing mock-only disposable
fixture utility was reused unchanged for this pass.

## Actual geometry

| CSS viewport | Composer panel before → after | Textarea before → after | Reading body after | Shared left edge |
| ------------ | ----------------------------- | ----------------------- | ------------------ | ---------------- |
| 1440         | 1280 → 773.875px              | 684.250 → 723.875px     | 725.875px          | 80px             |
| 768          | 720 → 720px                   | 670 → 670px             | 676px              | 24px             |
| 390          | 358 → 358px                   | 324 → 324px             | 322px              | 16px             |
| 320          | 288 → 288px                   | 254 → 254px             | 252px              | 16px             |

At desktop the textarea occupies 93.5% of the outer composer, up from 53.5%.
Its editing line is approximately 72ch at the retained 16px input size. Composer
and stream share the outer workspace edge, with intentional interior padding for
writing and a separate 28px marker gutter for reading. Neither is independently
centered. The approximately 2px difference between editing and reading widths is
their border/padding treatment, not an accidental unused second column.

Identity and section-navigation rectangles are identical across Overview,
Pemikiran and existing Refine detail at all four widths, including the long Company
name. Earlier text widths are 863.875 / 615.875 / 285.875 / 215.875px; arrows remain
within their row and beyond text. No document overflow in any recorded case.

## Verification and evidence

[Selected final-polish images and QA retention note](../design/milestone-5.5-phase-4a-final-polish/README.md):
40 matched before and after cases, four Refine shell comparisons and eight final
viewport previews. Two additional interaction screenshots bring the total to 94.
Same fictional records, 900px viewport height and scroll 0 for matched captures.

Coverage includes empty and no-note Companies, absent optional metadata, short
and long names, original-only/default-original, selected short and long refinement,
historical selection, 25-Thought history with a 20/5 page split, long local writing,
expanded reading and archive. Existing long readers and exact original disclosure
are preserved; no review history is stacked into Pemikiran.

Browser assertions verify the textarea fills over 80% of its panel, input font
at least 16px, save/discard targets at least 44px, decorative numbering hidden,
page-local numbering and stable row bounds. Keyboard focus uses the existing 2px
mineral-green outline; row hover resolves to the interactive surface. Sampled
rendered text contrasts: reading 15.72:1, metadata/placeholder/breadcrumb 9.12:1,
selected section 6.34:1 and save label 9.92:1, all at opacity 1. Reduced-motion
emulation produces zero-duration control transitions. Final runtime/console logs
are empty. The baseline missing favicon was corrected, not filtered or suppressed.

47 protected domain/server/migration/draft/action/navigation files were hashed
before editing and verified unchanged. Both applied display migrations, RLS,
authorization, immutable originals, receipts, cursor order, legacy/focus links,
review lifecycle, Server Actions, AI Gateway and accounting remain intact.

Production build passed, including the standard static icon asset. All 62 existing
live development DB/HTTP checks passed with injected mock providers. Lint,
Next-generated route types/TypeScript, formatting and all **87 deterministic tests**
passed. Git whitespace check passed. No tests were weakened or removed.

Exact original strings and the same 28 injected-mock AI Runs were verified unchanged
after browser QA. Every isolated browser session was closed; the final sessions
also signed out. The disposable account was deleted through the fixture utility,
nine owned-table cascades verified empty and its ignored credentials removed.
The pre-existing development server and user's open Chrome tabs were preserved.

## Limits and Phase 4B boundary

Fresh isolated Chrome used default browser zoom, DPR 1 and measured root/body CSS
zoom 1 / visual scale 1. This does not verify the user's existing browser at native
100% or 80% zoom. Physical mobile keyboard, safe areas, touch interaction and an
assistive-reader session remain manual checkpoints. All local fonts were loaded;
contrast sampling is not a complete accessibility certification. Full-page export
may paint the fixed mobile rail at its initial viewport band; viewport previews
show actual composition without that export artifact.

Phase 4B still owns the Refine timeline and generation CTA redesign. Navigation
animation, persistent-layout changes, References and Phase 6 were not started.
No real provider calls, commit or push. Await user visual review.
