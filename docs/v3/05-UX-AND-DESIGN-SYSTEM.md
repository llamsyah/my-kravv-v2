# MY KRAVV V3 — UX and Design System

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). The owner's Hybrid C direction and product boundaries are constraints; interaction/system treatments below are proposed specifications for review, not accepted tokens or implemented UI. See [Design Discovery](DESIGN-DISCOVERY.md) for per-image exceptions and [workflows](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) for page responsibilities.

## Visual hierarchy and system roles

Use a premium, calm SaaS language with light neutral reading/writing surfaces and restrained green for primary actions, navigation/selection and meaningful interaction. Body text should remain neutral and readable, rather than green on tinted surfaces. Use clear hierarchy, typography, space and quiet boundaries before adding cards or badges. Cards should group related work, not turn every sentence into a widget.

Use consistent semantic roles for page/canvas/panel surfaces, primary/secondary/muted text, borders, primary/secondary/destructive actions, selection, focus, warning and error. Their exact colors, fonts, type scale, spacing, widths and radii remain technical/design question T7; no numerical tokens are inferred from raster images. Distinguish destructive actions by text/confirmation as well as color. Fabricated numbers or financial imagery must not be used to make an empty product look complete.

A selected green pill/tab uses a coherent selected state. Do not add an unrelated blue active underline beneath it. Keyboard focus has a separate visible state and must not be mistaken for the selected destination. Diff addition/deletion highlighting can use other semantic colors, with text/symbol alternatives; this does not create a second navigation accent family.

## Layout, navigation and long-form work

Global Beranda/Perusahaan navigation stays separate from Company context. Account Settings is reached from the navbar avatar. Within Company work, keep identity/switching and contextual navigation legible with many companies. Primary company destinations remain Overview, Ruang Tulis, Pemikiran, Explore and Referensi.

Use a controlled writing/reading width. Collapsing a sidebar must not stretch a paragraph across an uncomfortable full-screen measure. The left navigation and right context panel toggle independently, with discoverable reopen controls. The right panel can expose guidance, selected materials, references or AI Review; selecting a panel does not generate AI or fetch a reference.

Under settled P5, Terpandu, Pendamping and Kosong use one writing document/editor model. Switching changes guidance only: no deletion, reordering, automatic rewriting, format conversion, new draft or committed version. Headings already inserted by the owner remain after leaving Terpandu. The six areas and any coverage display remain optional assistance, never a quality/completion gate. Pendamping offers optional side guidance and Kosong has none active.

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

## Revision 2 interaction contracts

- **Temporary capture:** offer saving with no company, then explicit Move to Explore/Ruang Tulis. Ask for a company only when needed at that move. Keep the item visible on failure; remove it after destination save succeeds. Use a simple success/failure/uncertain-retry message, not a permanent lineage/history screen. Confirm permanent deletion; no capture archive/trash UI.
- **Live Working Tree:** label **Kirim ke Pemikiran** and **Batalkan Pengajuan** distinctly. Candidate summaries reflect the latest saved draft and reopen its editor; withdrawal retains the draft. Do not display a frozen submission requiring resubmission. Buat Draft Baru leads to writing. Save pending edits before recording; changes during Tinjau & Rekam require a fresh exact preview and reconfirmation.
- **Minimal recording:** clearly choose Thought Baru or Versi Lanjutan with its target. Keep a short rationale optional; omit unrelated required administrative forms. After confirmation show the committed result and remove pending candidate membership without implying autosaves were versions.
- **Pressure-free reflection:** Context Snapshot is optional within Tinjau & Rekam. Confidence choices are **Rendah, Sedang, Tinggi, Not provided**, with optional explanation/reflection. Every field/whole block can be skipped; uncertainty is valid. No required numerical slider, psychological language, emotional-validity test or scientific-quality implication. Explain that supplied context preserves subjective perspective at recording time and cannot later be edited in place. Later perspectives require a deliberate new version; no separate correction flow.
- **Deletion:** confirm irreversible content removal and its scope. A staged-draft deletion also removes its active candidate, never committed Thoughts; withdrawal deletes neither. A Thought delete removes the whole history and Context Snapshots, not selected versions. Reference deletion affects metadata, not external documents or recorded text. No trash/archive UI for these content types; Company destruction stays C1.
- **Review context:** explicit initial/follow-up/refresh actions show the selected draft snapshot and deliberate additions. Personal text inside that draft is included. Old-review continuation remains labeled with its old snapshot; a changed draft makes prior results stale. No hidden extra context or auto-refresh/provider call.
- **References:** require only Title and URL. Optional metadata never becomes a screenshot-implied asterisk gate. Gunakan di Ruang Tulis inserts title/URL and only specifically selected notes, while retaining the original catalog record. Do not imply URL/PDF retrieval or verification.

Minimal Company create/find/edit/switch/empty-state guidance is specified in [workflows](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md#minimal-company-management-journeys). It is a draft approach grounded in existing functionality, not approval of a Company cascade-delete/archive UX. Resolve [C1](01-PRODUCT-FOUNDATION.md#narrow-open-owner-policy--company-management) before adding destructive Company controls.

Labels such as Tersimpan must describe the actual persistence scope. An autosave is not Rekam; reopening a committed version in writing is not in-place editing of history. Use plain Indonesian interface labels, retaining natural names such as Explore, Working Tree and AI Review where the owner uses them. Final microcopy must not introduce a status taxonomy or extra workflow gate.

Home foregrounds Quick Capture with secondary resume/inbox/company access. Avoid unnecessary decorative hero photography. Company Overview summarizes personal research orientation and links into work; optional commit-time context stays inside Tinjau & Rekam. Diff identifies both committed versions, their dates and direction, and offers a readable comparison without requiring unsupported AI summaries or collaboration/comments.

## Accessibility and dark mode

The proposed baseline is keyboard-operable navigation/editor/tool actions, visible focus, meaningful labels, programmatic selected/expanded/error states, sufficient text/control contrast and non-color indicators. Avoid hover-only actions. Restore focus when a contextual surface closes, keep errors near the relevant input, announce important save/result changes without narrating every keystroke, and respect reduced motion. Measure the eventual UI rather than claiming accessibility from images.

Dark mode is designed alongside light mode with corresponding semantic roles and readable editor/diff/focus/error states. It is not a filter over the PNGs or the existing V2 dark stylesheet. Default light-first behavior and a basic light/dark preference are owner-directed; automatic System mode and extensive appearance controls are not required by the settings image.

Validation should include long text, empty data, many companies, large histories, narrow viewports, zoom/reflow, keyboard-only use and screen-reader feedback. Expected acceptance evidence is described in [validation/recovery](07-VALIDATION-AND-RECOVERY.md). No toolbar image authorizes uploads, a new icon package, a specific rich-text format or unrelated features.
