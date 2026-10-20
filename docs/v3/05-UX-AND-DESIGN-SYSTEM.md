# MY KRAVV V3 — UX and Design System

Status: **Draft — awaiting owner review**

Date: **20 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). The owner's Hybrid C direction and product boundaries are constraints; interaction/system treatments below are proposed specifications for review, not accepted tokens or implemented UI. See [Design Discovery](DESIGN-DISCOVERY.md) for per-image exceptions and [workflows](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) for page responsibilities.

## Visual hierarchy and system roles

Use a premium, calm SaaS language with light neutral reading/writing surfaces and restrained green for primary actions, navigation/selection and meaningful interaction. Body text should remain neutral and readable, rather than green on tinted surfaces. Use clear hierarchy, typography, space and quiet boundaries before adding cards or badges. Cards should group related work, not turn every sentence into a widget.

Use consistent semantic roles for page/canvas/panel surfaces, primary/secondary/muted text, borders, primary/secondary/destructive actions, selection, focus, warning and error. Their exact colors, fonts, type scale, spacing, widths and radii remain technical/design question T7; no numerical tokens are inferred from raster images. Distinguish destructive actions by text/confirmation as well as color. Fabricated numbers or financial imagery must not be used to make an empty product look complete.

A selected green pill/tab uses a coherent selected state. Do not add an unrelated blue active underline beneath it. Keyboard focus has a separate visible state and must not be mistaken for the selected destination. Diff addition/deletion highlighting can use other semantic colors, with text/symbol alternatives; this does not create a second navigation accent family.

## Layout, navigation and long-form work

Global Beranda/Perusahaan navigation stays separate from Company context. Account Settings is reached from the navbar avatar. Within Company work, keep identity/switching and contextual navigation legible with many companies. Primary company destinations remain Overview, Ruang Tulis, Pemikiran, Explore and Referensi.

Use a controlled writing/reading width. Collapsing a sidebar must not stretch a paragraph across an uncomfortable full-screen measure. The left navigation and right context panel toggle independently, with discoverable reopen controls. The right panel can expose guidance, selected materials, references or AI Review; selecting a panel does not generate AI or fetch a reference.

Terpandu presents optional editable structure, Pendamping keeps writing freeform with guidance beside it, and Kosong starts without an active template. Framework coverage, if shown, is informational, not a quality grade or gate. Approach switching must not silently delete/reorder authored material; resolve P5 before implementing conversion behavior.

**Responsive proposal:** preserve the editor as the main task surface, move secondary panels into accessible toggled surfaces when space is limited, and avoid compressing both side panels beside a narrow editor. Exact breakpoints/drawer behavior remain T7. Keep selection and draft content while a panel is hidden. Do not promise mobile keyboard/safe-area or zoom behavior from desktop images.

## State and action language

| Context          | Required distinction                                                         | Proposed feedback                                                                               |
| ---------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Mutable saves    | Unsaved/saving/confirmed/failed or conflicted are different                  | Honest local versus server confirmation, retained text and an explicit recovery action.         |
| Staging          | Draft save versus deliberately submitted candidate                           | Confirmation of Working Tree membership; no automatic committed-version badge.                  |
| AI Review        | Not run/running/result/failed/stale                                          | Identify mode and reviewed snapshot; stale critique is readable but not described as current.   |
| Recording        | Review preview versus submitted operation versus confirmed committed version | Show exact content/Thought target, prevent duplicate submission and recover uncertain results.  |
| Context Snapshot | Optional reflection versus commit requirement                                | Clear skip path that still allows Rekam; no mandatory confidence number.                        |
| Reference        | Saved metadata versus reachable/verified external source                     | Open/copy URL actions; no false verification badge or silent disappearance on external failure. |
| AI usage         | Measured tokens/estimated cost versus warning/enforced reservation           | Label uncertainty and the actual kind of budget control.                                        |

Labels such as Tersimpan must describe the actual persistence scope. An autosave is not Rekam; reopening a committed version in writing is not in-place editing of history. Use plain Indonesian interface labels, retaining natural names such as Explore, Working Tree and AI Review where the owner uses them. Final microcopy must not introduce a status taxonomy or extra workflow gate.

Home foregrounds Quick Capture with secondary resume/inbox/company access. Avoid unnecessary decorative hero photography. Company Overview summarizes personal research orientation and links into work; optional commit-time context stays inside Tinjau & Rekam. Diff identifies both committed versions, their dates and direction, and offers a readable comparison without requiring unsupported AI summaries or collaboration/comments.

## Accessibility and dark mode

The proposed baseline is keyboard-operable navigation/editor/tool actions, visible focus, meaningful labels, programmatic selected/expanded/error states, sufficient text/control contrast and non-color indicators. Avoid hover-only actions. Restore focus when a contextual surface closes, keep errors near the relevant input, announce important save/result changes without narrating every keystroke, and respect reduced motion. Measure the eventual UI rather than claiming accessibility from images.

Dark mode is designed alongside light mode with corresponding semantic roles and readable editor/diff/focus/error states. It is not a filter over the PNGs or the existing V2 dark stylesheet. Default light-first behavior and a basic light/dark preference are owner-directed; automatic System mode and extensive appearance controls are not required by the settings image.

Validation should include long text, empty data, many companies, large histories, narrow viewports, zoom/reflow, keyboard-only use and screen-reader feedback. Expected acceptance evidence is described in [validation/recovery](07-VALIDATION-AND-RECOVERY.md). No toolbar image authorizes uploads, a new icon package, a specific rich-text format or unrelated features.
