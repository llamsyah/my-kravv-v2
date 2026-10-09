# MY KRAVV — Milestone 5.5 UI/UX Architecture & Design Blueprint

Date: 2026-10-08. Status: **design direction and major compositions approved;
final polishing requirements recorded; application implementation not authorized**.
Local implementation inspected at `ea7a7ad`. Supplementary isolated visual prototypes
are referenced at the end of this document; they do not authorize implementation.
No application, migration, test, dependency,
environment, provider configuration, or existing product document changes belong
to this planning task. Phase 6 remains outside scope.

The proposed experience is a personal research notebook with recognizable places
to continue, write, read, and review. Navigation identifies the place; surfaces
identify the work; provenance identifies whose words are being read.

## 1. Inspection evidence and comparative UX audit

### Current MY KRAVV implementation

The local checkout is authoritative for the current product. The following actual
implementations were inspected, rather than treating earlier mockups as features:

| Source                                             | Observed behavior and implication                                                                                                                                                                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(private)/page.tsx`                       | Real recent Thoughts and active Companies feed continuation, capture, recent thinking, and research spaces. Continuation and excerpts use `raw_content`; the label ASLI applies to every recent item. “Last work” is inferred from persisted creation/update times, not a saved browsing session. |
| `src/app/(private)/companies/page.tsx`             | Owner-scoped active/archive list; submitted search `q`; name, metadata, state, note, update time, open link, and management disclosure. Continuous rows already suit a library; identity and action affordances need stronger hierarchy.                                                          |
| `src/app/(private)/companies/[companyId]/page.tsx` | Identity, context, composer, paginated raw history, facts, archive, and permanent deletion share one page. A desktop sidebar groups management with context, but there is no Company section navigation or concise Overview.                                                                      |
| Existing Thought `/refine/page.tsx`                | Loads original, newest 20 refinements, and pending claim. Always presents original, generation, and all fetched versions in a vertical stack. Accepted rows can sit below newer suggestions or outside the fetched history page.                                                                  |
| `src/components/app-shell.tsx`                     | Server shell, skip link, brand, supplied private navigation, date/edition, main landmark, footer. Reuse its authentication surroundings; do not replace it with a client application.                                                                                                             |
| `src/features/companies/private-navigation.tsx`    | Small client component reads pathname, highlights Home or Companies, renders two inline SVGs, and places LogoutForm alongside primary destinations. Company-local navigation is absent.                                                                                                           |
| `src/features/thoughts/thought-history.tsx`        | Raw text only; >420 characters or >7 lines use disclosure; first/focused/saved item opens. Exact IDs, anchors, timestamps, cursor links, Refine links, and deletion affordances already exist.                                                                                                    |
| `src/features/thoughts/thought-composer.tsx`       | Client island with `useActionState` and external draft store. Company selection and Home/Company draft isolation, operation IDs, save acknowledgement, storage errors, and archived read-only draft recovery are substantive behavior to preserve.                                                |
| `src/features/refinements/refine-forms.tsx`        | Explicit generation only; disable while pending/error; deliberate full-page status reload; edit/accept/reject with retained failed input. A normal reload is intentional because same-URL navigation previously retained action state.                                                            |
| `src/server/db/thoughts.ts`                        | Explicit owner/Company predicates, immutable capture, stable keyset pagination: creation descending, ID ascending, 21 fetched/20 displayed; recent Home limit five; separate Company count.                                                                                                       |
| `src/server/db/refinements.ts`                     | Owner/Company/Thought predicates; stable 21/20 history; claim, pending lookup, review, and narrow elevated completion. No batched accepted-version presentation query currently exists.                                                                                                           |
| `src/domain/refinement/refinement.ts`              | Separate immutable AI text and nullable user final text; SUGGESTED, ACCEPTED, REJECTED, SUPERSEDED; fixed prompt/schema provenance; strict generation/review inputs.                                                                                                                              |
| `src/app/globals.css`                              | 2,022 lines: initial foundations, later Milestone 3.5 compositions, responsive overrides/corrections, then Refine styles. Georgia/Segoe UI, repeated selector declarations, mobile metadata down to 9px, and predominantly typographic/hairline grouping. Desktop nav SVGs are hidden by CSS.     |
| Existing action files                              | Capture redirects to Company root with `saved` and Thought hash; review revalidates detail/Company but not Home; generation uses `proposal`; review uses `resolved`; deletion redirects differ by target. Route changes must update both links and invalidation.                                  |

Read approved direction in `docs/02-core-user-journey.md`,
`04-domain-model.md`, `07-page-responsibilities.md`, `08-design-direction.md`,
`09-database-schema.md`, `11-implementation-plan.md`, and implementation evidence
in `12-milestone-3.5-implementation-notes.md` and
`14-milestone-5-implementation-notes.md`. Earlier domain documents describe later
capabilities; their examples are not permission to expose those capabilities now.
This brief proposes separate working sections where document 07 previously allowed
a combined page. Approval of this blueprint is the decision checkpoint for that
presentation change, not a change to domain truth.

### KRAVV-IENT v3: actual source inspected

Read six files on the reference repository's default `main` branch through GitHub,
without cloning or copying its code:

| Source                                                                                                            | Verified reference pattern                                                                                                                                                                                                                                        | Adopt / adapt / reject                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [workspace-shell.tsx](https://github.com/llamsyah/kravv-ient-v3/blob/main/ient-src/app/workspace-shell.tsx)       | TopContextBar holds workspace/area/company/case identity and search; GlobalBottomRail separates destinations and profile; CaseTabs separates Overview from Evidence, Analysis, Diligence, Decision, Activity.                                                     | Adopt two navigation levels and contextual identity. Use real Next links, only functional destinations, and an account menu. Do not copy its six global destinations or prototype role model. |
| [workspace.tsx](https://github.com/llamsyah/kravv-ient-v3/blob/main/ient-src/app/workspace.tsx)                   | Overview offers next-step entrances, context/facts/questions in a main area, and AI/human judgments in a secondary column. Other sections concentrate specialized work. Company monograms, row actions, status badges, and form dialogs are explicit affordances. | Adapt orientation versus working sections and recognizable controls. Reject all deal, analyst, committee, portfolio, evidence/decision behavior not implemented in MY KRAVV.                  |
| [analysis-workspace.tsx](https://github.com/llamsyah/kravv-ient-v3/blob/main/ient-src/app/analysis-workspace.tsx) | Readiness, processing, saved result, source-change notice, findings disclosure, run selector, and separate human review are state-driven. Processing includes an explicitly simulated timed sequence.                                                             | Adapt state-specific priorities, durable-result identity, and progressive history. Never copy simulated steps as real Groq progress or show unsupported semantic assessments.                 |
| [globals.css](https://github.com/llamsyah/kravv-ient-v3/blob/main/ient-src/app/globals.css)                       | Clear controls, icons, local selected tabs, context columns; later shell has `min-width:1080px` and fixed global rail.                                                                                                                                            | Adapt hierarchy and sizing consistency. Reject minimum desktop width and fixed desktop rail on mobile.                                                                                        |
| [surface.css](https://github.com/llamsyah/kravv-ient-v3/blob/main/ient-src/app/surface.css)                       | Later surface pass converts several card grids into continuous rows, strengthens hover/focus, uses restrained badges, 15px base type, and functionally distinct context areas.                                                                                    | Adapt continuous lists, larger reading text, and interactive surface states. Do not copy blue identity or accumulated override strategy.                                                      |
| [analysis.css](https://github.com/llamsyah/kravv-ient-v3/blob/main/ient-src/app/analysis.css)                     | Comparison-like columns, readiness/action group, selected results, disclosures, run controls, and secondary history.                                                                                                                                              | Adapt functional grouping. Collapse comparison intentionally at smaller widths and retain MY KRAVV's quieter palette.                                                                         |

Inspection identity: file blob SHAs, in table order:
`6c2db5a6a6f1035b2c185292811ac61ea21f2613`,
`bb26134506be2b46994be1fc27fdab3a85ff19fb`,
`178dc2053ae4fdb0280de5b17492ddaf5fc61450`,
`9a95378516723591338ce012f402ab96f22aa84d`,
`cd1450e99779ec765578e89f44c148c9132141cb`,
`eea1337b50de7646550f1771129e7eab7dff56fb`.
Links follow `main` and can change; observations
describe the inspected 2026-10-08 snapshot. This is a source-based comparison,
not a claim that KRAVV-IENT was run or audited in a browser.

The reference places most orchestration inside one client Workspace with hash
navigation and a workspace API. MY KRAVV should retain authenticated Server
Components and isolated interactive islands. Borrow the interaction organization,
not that application architecture.

### Actual visual reference inspection

All ten PNGs were opened and visually inspected:

| Actual files under `public/visual-references/`                        | Observation informing this blueprint                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `desktop/01-home.png`, `mobile/01-home.png`                           | Dark mountain/lake hero, editorial question, mineral-green continuation/capture actions, continuous recent rows. Mobile gives capture and continuation prominent positions and uses labeled bottom navigation.                                                                          |
| `desktop/02-companies.png`, `mobile/02-companies.png`                 | Company identity leads; state, contextual excerpt, recognizable open/more controls are secondary. Mobile separates identity/state, note, then metadata/actions rather than squeezing desktop columns.                                                                                   |
| `desktop/03-company-workspace.png`, `mobile/02-company-workspace.png` | Context before work; distinctive thought evolution, focused current text, secondary history. Desktop can support two functional columns; mobile shows one primary reading task.                                                                                                         |
| `desktop/04-thesis-snapshot.png`, `mobile/4-thesis-snapshot.png`      | Strong frozen-version identity, contextual company navigation on desktop, source/history separation, readable mobile sequence. Use provenance and version hierarchy principles only; do not add Thesis.                                                                                 |
| `desktop/05-settings.png`, `mobile/05-settings.png`                   | Utilitarian account grouping, icons, switches, and secondary navigation; the mobile sign-out row is separate from workspace destinations. Do not implement Settings, automatic refinement, credits, budgets shown in sample data, or provider-training claims from these illustrations. |

The screenshots are direction evidence, not app data or standalone background
assets. No original mountain/lake asset exists in the inspected reference folder;
document 12's asset blocker remains. Do not crop a screenshot into the application.
Asset selection/creation and approval are a future separate decision; the proposed
layout must also look complete on the existing plain dark canvas.

## 2. Root causes of the current text-heavy interface

1. **Responsibility overload.** Company root combines orientation, writing,
   reading, review entrances, metadata, and destruction. More cards would preserve
   the overload rather than resolve it.
2. **One reading representation.** Raw-first lists ignore a user's explicit
   acceptance, so improving wording produces no visible benefit on Home/history.
3. **Uniform visual grammar.** Labels, timestamps, prose, status, and navigation
   rely on similar text weight and dividers. Familiar controls need a visible
   outline/fill/selected state, not an arrow character alone.
4. **Unconditional Refine stack.** A generator and every fetched version retain
   prominence regardless of pending, accepted, rejected, or historical state.
5. **Typography drift.** Serif applies broadly to headings, while repeated
   responsive rules shrink supporting text. Explain once beside the action;
   don't compensate for weak hierarchy with repeated instructional paragraphs.
6. **Cascade debt.** New overrides depend on source order and generic selectors,
   making visual roles less predictable across pages.

Retain quiet dividers for reading rhythm. Add bounded surfaces only for actual
work (composer/comparison), independent state (proposal/pending notice), or
interactive objects. A content paragraph does not need its own box.

## 3. Revised information architecture and navigation sitemap

```text
Authenticated MY KRAVV
├── Beranda /                        personal desk
├── Perusahaan /companies            research library
│   ├── Aktif / Diarsipkan            existing views, not new global destinations
│   ├── Tambah /companies/new
│   └── Company Workspace /companies/:companyId
│       ├── Overview                 orientation and continuation
│       ├── Pemikiran /thoughts      capture and preferred-version reading
│       │   └── Thought focus /thoughts/:thoughtId
│       ├── Refine /refinements      select a saved Thought and inspect status
│       │   └── Review /thoughts/:thoughtId/refine  existing address retained
│       └── Kelola → /edit, archive confirmation, permanent deletion
└── Akun menu                         Keluar only initially
```

Global desktop/tablet navigation: brand, Beranda, Perusahaan, account trigger.
Move LogoutForm into the account disclosure; it remains a Server Action POST,
not a destination link. No empty Settings/Profile page. Mobile: account in top
header, Beranda/Perusahaan in a two-item bottom navigation. This keeps sign-out
out of both navigation levels while leaving it reachable in one menu.

Company header: breadcrumb back to active/archive library, monogram/name,
optional ticker/sector, actual state badge, contextual `Kelola` button. Then
local links **Overview / Pemikiran / Refine** with icon + visible label.
Selected link uses a green-tinted surface, semibold label, and 2px marker;
`aria-current="page"` supplies a non-color state. Global Perusahaan stays active
through all Company routes. These links are navigation, not ARIA `tab` widgets.

Nested Thought focus selects Pemikiran. Existing Thought Refine detail selects
Refine, despite being nested under `/thoughts/`; check that specific suffix before
the general Thoughts prefix. `/edit` identifies management in breadcrumb and
does not falsely select a working section. Match path segment boundaries, not
arbitrary substrings; Company UUIDs remain validated server-side.

Keep **Overview / Pemikiran / Refine** visible and in that order. The future
**Referensi** section is approved in direction and follows those three only when
its separately scoped feature is implemented. Desktop should accommodate four
labeled links within the same navigation region. Narrow layouts may scroll that
region, preserving readable labels, 44px targets and visible selection/focus;
do not squeeze typography or add a second navigation row by default. If later
implemented sections need `Lainnya`, preserve the three existing work sections and
show the selected additional destination in its trigger. No reordering, new global
destination, reserved blank slot, disabled Referensi tab, placeholder route or
References query is introduced during Milestone 5.5. The final scope below governs
this future accommodation.

## 4. Detailed page responsibilities

| Page                  | Primary question / primary action                                              | Visible content and boundaries                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Beranda               | “Di mana aku ingin melanjutkan?” / continue or save Thought                    | Compact hero; one continuation derived from real latest active Thought, otherwise latest updated active Company; capture with existing Company selector; five recent Thoughts using preferred text; up to three active research spaces. No fabricated last-visited session, AI summary, gaps, market data, or portfolio metrics. Archived recent items may be shown with archive label and read-only destination, but never become capture selections. |
| Perusahaan            | “Ruang mana yang ingin kubuka?” / open Company                                 | Compact introduction, search, Aktif/Diarsipkan, add action, continuous identity rows. Monogram derives from supplied name, not fetched logo. Show optional ticker/sector, actual state, authored note, explicitly labeled identity update date. Do not label `companies.updated_at` as latest research activity.                                                                                                                                       |
| Overview              | “Apa yang terakhir kusimpan di ruang ini?” / continue reading or add Thought   | Latest Thought by immutable creation time, rendered through preferred projection; label `Pemikiran terakhir`, never aggregate `Pandangan Saat Ini` or thesis. Up to three other recent Thoughts and three meaningful stored events where available; concise authored context; entrances to Pemikiran/Refine. Full history and composer are on Pemikiran.                                                                                               |
| Pemikiran             | “Apa yang kupikirkan, dan apa yang ingin kutambahkan?” / save original         | Existing capture behavior, latest-first 20-Thought page, preferred representation, exact-source disclosure, focus/read link, contextual review link, secondary deletion. First page contains compact composer; older pages prioritize reading and offer `Tulis pemikiran` to first-page composer instead of repeating a large form.                                                                                                                    |
| Refine index          | “Pemikiran mana yang ingin kurapikan atau kutinjau?” / open selected Thought   | Paginated saved-Thought picker with preferred excerpt and actual status summaries; rows show pending/suggested/accepted state when fetched. Opening a row only navigates. Do not create a second generation form/service at index level or silently preselect and generate.                                                                                                                                                                            |
| Thought Refine detail | “Apakah usulan ini tetap menyampaikan maksudku?” / explicit generate or review | One selected Thought, state-specific body, original/proposal comparison, edit and deliberate acceptance/rejection, current accepted representation, progressive history, optional provenance. Original source is always the gateway input, even during intentional re-refinement.                                                                                                                                                                      |
| Thought focus         | “Bisa kubaca satu pemikiran tanpa gangguan?” / read, then optionally review    | Preferred full text, exact original disclosure, current provenance, link to existing Refine detail, secondary version history and delete disclosure. No generation on this reader.                                                                                                                                                                                                                                                                     |
| Company create/edit   | “Bagaimana aku mengenali ruang ini?” / existing save action                    | Existing validated fields and error retention; light utilitarian styling within current routes. Company management does not interrupt the primary reasoning column.                                                                                                                                                                                                                                                                                    |

**Thought focus decision: include a small read-only route now.** It solves durable
links to older Thoughts without loading pages until their anchor appears, and
offers a full readable destination for clamped Home/list excerpts. It reuses the
same projection/reader components, not a duplicate Company/Refine page. Defer a
modal/side-panel router and richer structure/evidence detail until their domains
exist. Cost: one new route and compatibility tests; benefit: simple owned lookup,
bookmarkability, Back behavior, and stable accessibility.

Overview ordering is explicit: newest saved Thought, not whichever old Thought
was most recently accepted. Acceptance can appear in recent meaningful activity
and updates that Thought's display wherever it appears; it does not synthesize a
company-wide conclusion or rewrite its creation date.

## 5. Desktop wireframes

Wireframes are proposed compositions, not implemented screenshots. Brackets
denote controls; plain lines denote content regions, not a card around each line.
Use fictional names in future QA. Target viewport 1440×900 CSS pixels, shell max
1280px with 48px gutters; usual main gap 32px. Above-fold targets assume a short
Company name, 3–5-line excerpts, and default font size; long content may flow below.

### Beranda: continuation and a usable composer before scrolling

```text
0–72     K MY KRAVV       [Beranda*] [Perusahaan]                    [Akun ▾]
104–220  Sampai di mana pemikiranmu?        quiet atmospheric area, no data
         One short supporting sentence
244–352  LANJUTKAN  [Nexa] Company name | preferred excerpt | [Lanjutkan →]
376–650  Catat pemikiran                     [Perusahaan: Nexa ▾]
         ┌ writing surface — textarea, 3–4 lines ─────────────────────────┐
         │ original draft                                                │
         └───────────────────────────────────────────────────────────────┘
         [Buang draf]                                      [Simpan pemikiran]
         status/error slot + collapsed draft privacy explanation
682–900  PEMIKIRAN TERBARU (2–3 rows visible)  | RUANG PENELITIAN (2–3 rows)
         Company • provenance • excerpt →     | Company • supplied note →
below    remaining recent rows; quiet footer
```

No continuation exists: replace the continuation region with a concise first
Company entrance. No active Companies: replace the composer with `Tambah
perusahaan` and one explanatory sentence, not an empty disabled writing widget.

### Perusahaan: continuous research library

```text
header   K MY KRAVV       [Beranda] [Perusahaan*]                    [Akun ▾]
104–208  Perusahaan                                  [+ Tambah perusahaan]
         One short description
232–288  [Search name / ticker / sector................][Cari] [Aktif*][Arsip]
320–360  Perusahaan aktif (real count)       identity update dates labeled clearly
380–488  [N] Nexa Industrial      [Menjelajah]    user note        [Buka →] [⋯]
         optional ticker/sector  secondary date, no empty metric columns
488–596  [A] Aster Foods          [real state]    user note        [Buka →] [⋯]
596–704  next row
704–812  next row
below    further rows; empty/no-results explanation occupies list region if needed
```

Use a grouped list on one plane with row hover/focus tint. Keep Company name as
the primary link and a separate labeled open control; avoid a wrapping link with
interactive children. Long names wrap to two or more lines; do not fix row height
or hide the only identity behind ellipsis. Missing ticker/sector removes that
metadata line, not the row. Single Company fills one row, not a giant lone card.

### Company Overview: orientation separated from work

```text
header   global navigation
96–128   Perusahaan / Nexa                                  [Kelola ▾]
144–218  [N] Nexa Industrial       [Menjelajah]    optional ticker / sector
242–290  [Overview*] [Pemikiran] [Refine]       persistent local navigation
322–610  PEMIKIRAN TERAKHIR                    | KONTEKS DARI KAMU
         preferred text, 60–68ch               | authored note (brief)
         [Asli / versi diterima badge]         | actual stored Thought count
         [Baca pemikiran →] [Tambah pemikiran]  | optional dates disclosed
642–840  PEMIKIRAN SEBELUMNYA (3 previews)     | AKTIVITAS TERBARU (≤3 events)
         contextual [Semua pemikiran →]        | capture / acceptance only
below    management disclosure for legacy #data-control, closed by default
```

At wide sizes use `minmax(0,1fr) 280px`; primary text is constrained to 68ch within
the wider area. Do not fill the context column with unavailable domains. With no
Thoughts: main region explains `Belum ada pemikiran` and offers `Tulis pemikiran`;
authored context still supplies orientation. For archived Company: show one clear
archive notice, read/review links remain; hide new-writing/new-generation actions.

### Pemikiran: working list, not an Overview duplicate

```text
header   global + shared Company header + [Overview] [Pemikiran*] [Refine]
322–540  Catat pemikiran   writing surface + existing save/draft controls
572–620  Pemikiran (count)                        Terbaru terlebih dahulu
644–850  [current provenance] timestamp                         [⋯]
         preferred text, comfortable full-width reading column ≤68ch
         [Baca lengkap →] [Tinjau di Refine →] [Lihat asli ▾]
below    further entries, older cursor navigation; never twenty equal card boxes
```

Short Thoughts display once. Long entries show an honest excerpt plus `Baca
lengkap`; exact original/source is not shortened on the focus page. Preserve
target anchors and highlight focus/saved entry; show focused entry independently
if outside the current cursor window, without changing the window's ordering.

### Refine index and review

```text
INDEX
shared   [Overview] [Pemikiran] [Refine*]
322–390  Refine / Pilih pemikiran untuk ditinjau
414–900  Thought picker: preferred excerpt | [Usulan belum ditinjau] [Buka →]
         next row: excerpt                 | [Versi diterima]       [Buka →]
         next row: excerpt                 | [Belum dirapikan]      [Buka →]
         older keyset navigation below

DETAIL — selected suggestion
shared   [Overview] [Pemikiran] [Refine*]
322–390  [← Pilih pemikiran] Tinjau usulan       [Usulan belum diterima]
414–690  ORIGINAL (read-only, ≤60ch)   | USULAN AI (read-only, ≤60ch)
         exact source                 | exact proposal; warnings when present
714–790  [Sunting sebelum menerima]   [Tolak usulan] [Terima versi ini]
814–900  [Riwayat versi ▾] [Asal versi ▾]   (secondary, not equal result panels)
```

For long original/proposal: use natural document scroll, not two independent
fixed-height scrolling panes. The action group follows the comparison; it must
not cover text. Edit mode replaces only the proposal-side working surface with
the existing bounded textarea; original and immutable AI proposal remain available.

Focus reader uses the shared header, provenance, one 68ch main text column,
`Lihat asli` disclosure and a secondary `Tinjau di Refine` action. It does not
reserve a permanent empty sidebar just to widen the page.

## 6. Tablet and mobile wireframes

### Tablet target 768×1024: purposeful single-column work

```text
0–72     K MY KRAVV   [Beranda] [Perusahaan]                     [Akun ▾]
Home     compact hero → continuation → Company selector + full composer
         → recent thinking → research spaces (each a continuous list)
Library  title + add; full-width search; Aktif/Arsip; two-line identity rows
Company  breadcrumb + Kelola; wrapped Company name/status
         [Overview] [Pemikiran] [Refine] (no clipped primary destination)
Overview latest preferred Thought → working entrances → context → recent activity
Thoughts compact capture → current list → older navigation
Refine   picker occupies full width; detail compares ORIGINAL then USULAN AI
         adjacent in document order; both fully expanded by default on tablet
         → review actions → disclosed history; editing remains inline
```

Collapse all context sidebars below the primary task. A portrait tablet should
not have two cramped 300px comparison columns. Landscape tablet follows the
≥1024px layout only when each comparison column can retain a readable width.

### Mobile target 390×844: one reading task with comparison access

```text
HOME
0–56    K MY KRAVV                                [Akun ▾]
80–174  Sampai di mana pemikiranmu? (32px; max two lines)
198–306 Lanjutkan • Company • preferred excerpt      [Buka →]
330–700 Catat pemikiran [Company ▾]
        ┌ textarea ≥120px, 16px text ┐
        └───────────────────────────┘
        [Buang draf]          [Simpan pemikiran]
        feedback slot; privacy disclosure
below   recent thinking → research spaces
780–844 [⌂ Beranda*]                       [▥ Perusahaan]  + safe area

COMPANIES
0–56    global compact header + Akun
80–142  Perusahaan                       [+ Tambah]
166–214 [Search..............................][Cari]
230–274 [Aktif*] [Diarsipkan]
298–490 [N] Company name wraps           [state] [⋯]
        ticker/sector if present
        authored note (2–3 lines) + date labeled correctly     [Buka →]
514–706 next row; no invisible hover-only actions
bottom  two-item global navigation

COMPANY OVERVIEW
0–56    global compact header + Akun
72–108  [← Perusahaan]                         [Kelola ▾]
124–224 Company identity/name/state, no obligatory large hero
240–284 [Overview*] [Pemikiran] [Refine]  horizontal nav, 44px targets
308–610 Pemikiran terakhir • provenance • preferred excerpt
        [Baca pemikiran →] [Tambah pemikiran]
634–760 recent Thought entrance; context/activity below fold
bottom  global navigation; no management controls in reasoning region

PEMIKIRAN
same    Company identity + local navigation
308–620 compact capture (first page only); full labels and status
644–760 list heading + beginning of first preferred Thought
below   reading rows, original access, next-page navigation

REFINE INDEX
same    Company identity + local navigation
308–382 Refine — Pilih pemikiran
406–610 excerpt + actual refinement status + [Buka untuk meninjau →]
634–760 next row begins; no generation upon selection

REFINE DETAIL — suggestion
same    Company identity + Refine selected
308–356 [← Pilih pemikiran] [Usulan belum diterima]
380–424 [Bandingkan: Asli] [Usulan AI*] (in-page view controls)
448–650 proposal text (one primary reading surface)
674–758 [Sunting] [Tolak] [Terima versi ini] (wrap; each ≥44px)
below   [Buka kedua teks] [Riwayat versi ▾] [Asal versi ▾]
bottom  global navigation; no fixed acceptance bar obscuring text
```

Mobile comparison initially presents the selected proposal with a prominent
`Asli` switch and persistent origin label. Both texts are available without
navigating away; the read-only original remains in the document/accessible panel.
`Buka kedua teks` expands both sequentially for full comparison. Server-rendered
fallback without JavaScript renders original then proposal; the view switch is
a small enhancement, never a condition for access to source text. These in-page
controls may use an accessible tab pattern with arrow-key navigation because
they switch panels; Company route navigation uses ordinary links instead.

No bottom navigation should cover the keyboard, error message, or submission
controls. Reserve its actual height plus `env(safe-area-inset-bottom)` in content;
test software keyboard opening before choosing keyboard-visible behavior. Do
not fake browser chrome or claim those pixel bands are browser-verified layouts.

## 7. Thought preferred-version presentation rules

Preferred content is a **read projection**, never an UPDATE to Thought or a new
source of truth. Compute it server-side from the owned Thought and valid accepted
row using the same rule on Home, Overview, lists, picker, and focused reader:

```text
valid current ACCEPTED refinement for this owner + Company + Thought?
  yes → user_final_content !== null ? user_final_content : ai_content
  no  → raw_content
```

The current database partial unique index permits one ACCEPTED refinement per
owned Thought. Acceptance transaction supersedes a previous acceptance. Do not
choose the latest refinement of any status, search only the first history page,
or use truthiness instead of the nullable user-final field. Validate the row and
every owner/parent reference before producing a projection. Multiple ACCEPTED
rows or invalid relationships are integrity errors, not an invitation to guess.

| Data state             | Primary text / accessible label                                                                  | Original/history                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| No accepted version    | Exact original or explicit excerpt / `Asli`                                                      | Full original reachable; history optional if present.                                            |
| Accepted, no user edit | Accepted `ai_content` / `Dirapikan dengan AI · Kamu terima`                                      | Original disclosure; immutable AI text and decision date in provenance.                          |
| Accepted with edit     | Accepted `user_final_content` / `Versi pilihan · Kamu sunting`                                   | Original and immutable AI proposal remain separately inspectable.                                |
| Newer SUGGESTED exists | Earlier accepted version remains primary, otherwise original                                     | Secondary `Usulan baru belum ditinjau` entrance; never substitute suggestion.                    |
| REJECTED exists        | Earlier accepted version remains, otherwise original                                             | Rejection retained; not framed as an error or removed.                                           |
| SUPERSEDED exists      | Only current ACCEPTED primary                                                                    | Old version remains historical and labeled, never used as current fallback.                      |
| Query fails            | Reading error with recover/reload option; do not falsely label raw as the current chosen wording | If raw is offered for continuity, explicitly label it `Asli — versi pilihan belum dapat dimuat`. |

Lists may clamp the **projection excerpt**, never mutate source text or imply it
is the full Thought. Full readers preserve whitespace/line breaks and escape all
user/AI text as text. Do not render content as HTML or interpret it as instructions.
Show original capture time and accepted decision time separately; keep list order
based on Thought creation so acceptance does not invalidate existing cursors.

Lifecycle effects:

- Accept/edit: after successful commit, update all presentation surfaces through
  revalidation, show current chosen version, retain original. No change before a
  confirmed receipt; failure retains review edits and previous projection.
- Reject: record rejection; preferred version remains earlier accepted or raw.
- Supersession: new acceptance atomically replaces current presentation; old text
  stays available in history.
- Refresh: recompute from current authenticated data. Stale client form state is
  not a decision receipt; status recovery retains the deliberate full reload.
- Delete Thought: remove it, its refinements/claims and associated domain events
  through existing confirmed deletion; accounting retention follows existing rules.
  No historical orphan shown as a live Thought.
- Delete Company: existing cascade removes its surfaces; redirect to library.
- Archived Company: same projection and read/review access; no new capture/generation.

**Generation continues to use immutable raw text.** Displaying accepted text must
not redirect the AI Gateway's authorized context to the projection. Re-refine is
an intentional new proposal from the original, not an undisclosed chained rewrite.
`Tetap gunakan asli` is navigation/dismissal, not an implicit reversal of an earlier
acceptance. Restoring raw as the chosen version would require a separately designed
domain action and is not added by this blueprint.

## 8. Refine interaction states and comparison behavior

Use the durable claim and validated refinement rows to select the display state.
Do not invent progress percentages, sequence animations, or semantic confidence.

| State                          | Primary surface and action                                                                             | Secondary information / recovery                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No refinement                  | Original plus one-line explanation; `Rapikan dengan AI`                                                | No history block when empty; link back to reader. No AI call until submission.                                                                                                                                 |
| Submitting / persisted PENDING | `Sedang merapikan…` with busy indicator and preserved original; disable duplicate submission           | Actual status only, no promised completion time. Uncertain PENDING: `Status belum pasti. Muat ulang sebelum melanjutkan.` Full-page status reload; no automatic retry or fresh operation creation as recovery. |
| Suggested                      | Selected original/proposal comparison; `Sunting`, `Terima versi ini`, `Tolak usulan`                   | Label unadopted output, show actual warnings. Current earlier accepted version remains reachable.                                                                                                              |
| Editing suggestion             | Proposal textarea with retained user input; `Simpan & terima versi ini`; clear cancel-edit control     | Cancel edit is local only, no rejection/acceptance or regeneration. Original and exact AI proposal remain inspectable.                                                                                         |
| Accepted                       | Current chosen wording and decision provenance; `Lihat asli`, `Lihat riwayat`                          | Remove resolved acceptance form from dominant surface. `Buat usulan baru dari asli` secondary and deliberate; disabled for archive/pending/source ceiling.                                                     |
| Rejected                       | Rejection acknowledgement; current chosen version or raw                                               | Rejected proposal in history; a new proposal is explicit, never an automatic follow-up.                                                                                                                        |
| Multiple versions              | Current accepted version independent of history page; selected suggested proposal if explicitly opened | Historical rows collapsed with state/date; open one on demand; 20-row keyset history retained. Never label the first fetched row automatically as current.                                                     |
| Definitive failure             | Safe human-language feedback and unchanged original/current version                                    | Status reload first. Only after terminal failure is verified may a separate intentional generation be offered; no automatic SDK retry/repair outside normal gateway policy.                                    |
| Budget / disabled AI           | Explain assistance unavailable; reading/writing still usable                                           | No upgrade/payment prompt, spending bypass, artificial budget reset, or UI-only budget guard.                                                                                                                  |
| Archived / too-long source     | Read-only generation reason near disabled action                                                       | Saved proposals can still be reviewed; long original remains fully readable and is not truncated to fit Refine.                                                                                                |

Priority: a matching `proposal`/`resolved` target, then an explicit historical
`version` target, is fetched and displayed even if outside the history window.
Without an explicit target, show current accepted first with a clear entrance to
any unreviewed suggestion; otherwise newest suggestion, then most recent rejection,
then original. Fetch newest suggestion by status independently of the history
window. A pending claim disables generation in every state. If a saved suggestion
is shown while another request is pending, give an honest pending notice, do not
erase the suggestion or allow another generation. Expose other suggestions through
history; each review decision still targets its exact row ID.

Comparison labels name the immutable original and selected proposal. An optional
local text diff can highlight added/removed words after both exact texts load,
with a toggle and a plain-text fallback. This is a textual aid, **not** a verified
meaning-preservation analysis. Do not claim the reason for uncertainty was
preserved because output flags are true. Include one concise review cue:
`Periksa apakah maksud, alasan, dan hal yang belum kamu cek tetap sama.`
The Test 1 substitution (unexamined evidence → insufficient confidence) is a QA
scenario, not a frontend correction rule. Do not silently patch model wording.

Normal Refine continues to use the existing contract, input/output ceiling,
durable identity, budget reservation, zero transport retries, and one bounded
accounted format repair. The server-only one-attempt evaluation safeguard remains
evaluation-only; navigation components cannot control it. No provider calls on
mount, prefetch, selection, GET, cursor load, comparison, acceptance, or rejection.

## 9. Component architecture and Server/Client boundaries

Proposed route tree (all additions await approval):

```text
src/app/(private)/
├── layout.tsx                         existing authenticated global shell
├── page.tsx                           Home composition
└── companies/
    ├── page.tsx                       library
    ├── new/page.tsx                   existing create
    └── [companyId]/
        ├── layout.tsx                 shared owned Company workspace
        ├── page.tsx                   Overview + compatibility dispatch
        ├── edit/page.tsx              existing management route
        ├── thoughts/
        │   ├── page.tsx               Pemikiran
        │   └── [thoughtId]/
        │       ├── page.tsx           focused reader
        │       └── refine/page.tsx    existing Refine detail
        └── refinements/page.tsx       Thought picker, not second generation API
```

| Component / proposed home                                              | Responsibility and boundary                                                                                                                                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GlobalNavigation`, existing private navigation                        | Small client pathname island, server-provided account disclosure/LogoutForm; ordinary links. No private data fetching with elevated credentials.                                              |
| `CompanyWorkspaceShell`, `src/features/companies/`                     | Server-owned Company lookup/header/breadcrumb, archived context, slots. Children remain Server Components.                                                                                    |
| `CompanySectionNavigation`                                             | Small pathname client island; active route policy from section 3.                                                                                                                             |
| `SectionHeader`, `StatusBadge`, `EmptyState`, `src/components/ui/`     | Server-compatible presentational components only where repeated. SectionHeader does not fetch, synthesize summaries, or own routes.                                                           |
| `ActionButton` / `IconButton`                                          | Small semantic controls; actual `<button>` for mutation/disclosure and Link for navigation. Avoid arbitrary “as anything” abstractions masking semantics.                                     |
| `ContextualActionMenu`                                                 | Accessible disclosure with server-rendered management links/forms; small client support only for Escape/focus. No destructive action on trigger click.                                        |
| `ThoughtPreview`, `PreferredThoughtContent`, `ThoughtVersionIndicator` | Server projection input, excerpt/full rendering, provenance label. Same rendering logic shared across pages.                                                                                  |
| `ThoughtVersionHistory`                                                | Server-owned keyset list with native disclosures; optional original access and provenance. Current accepted result passed independently of history page.                                      |
| Existing `ThoughtComposer`, `DraftReceipt`                             | Keep client draft semantics, field names, exact receipt protocol and operation IDs. Update permalink/canonical links only in the route phase.                                                 |
| `RefineComparison`                                                     | Server exact texts plus isolated client mobile panel/diff enhancement; no network AI or persistence.                                                                                          |
| Existing generation/review forms                                       | Preserve explicit Server Actions and bounded state; style and state layout surrounding them, without creating another service.                                                                |
| `LegacyCompanyHashNavigation`                                          | Tiny compatibility-only client island for hash-only old URLs; allowlisted mapping, no arbitrary redirect or data access. Remove only after a separately approved compatibility policy change. |

Installed Next.js 16.4 guidance inspected:
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`,
`01-app/02-guides/redirecting.md`, and `server-and-client-boundary.md`.
Layouts retain state and do not receive fresh `searchParams`/pathname. Await
promised params in server layout/pages; let leaf pages validate query parameters
and let the small navigation client read pathname. Do not conditionally call
React `use()` or pass newly created promises into client rendering.

Shared layout authentication/header is not sufficient authorization for children
or actions. Keep existing per-action authentication, owned lookup predicates, RLS,
and unavailable-resource handling. Request-local deduplication may reduce repeated
owned Company reads; never introduce cross-user persistent caching of private data
or rely on a retained layout after archive/deletion. Refresh/invalidation must
update header state as well as leaf content.

## 10. Design tokens, typography, and visual language

### Typography proposal

Preferred pair: **Source Serif 4** for selected display headings and **Inter** for
UI and Thought reading. Source Serif retains the reflective editorial character;
Inter gives a readable small-size UI and a neutral long-form voice. These are a
proposal, not identification of fonts in the PNGs. Official sources:
[Adobe Source Serif](https://github.com/adobe-fonts/source-serif) and
[Inter](https://rsms.me/inter/). Self-host licensed WOFF2 assets in a future approved
change, retain license notices, load only needed styles, and use `font-display:
swap`; do not add a remote font dependency to private page requests. Georgia and
Segoe UI remain usable fallbacks. Verify supported font axes/weights before loading.

| Role                       | Family / weight     | Desktop / mobile size | Line height / tracking                                  |
| -------------------------- | ------------------- | --------------------- | ------------------------------------------------------- |
| Hero / selected page title | Source Serif 4, 400 | 40–44 / 30–32px       | 1.15 / −0.02em; no forced break that damages long names |
| Company title              | Source Serif 4, 400 | 36 / 28px             | 1.2 / −0.015em; allow natural wrapping                  |
| Section heading            | Inter, 600          | 20–22 / 20px          | 1.35 / normal                                           |
| Full Thought / proposal    | Inter, 400          | 17 / 16px             | 1.75 / normal; ideal 60–68ch, comparison 45–60ch        |
| Form input / main UI       | Inter, 400–500      | 16 / 16px             | 1.5 / normal; keep mobile inputs ≥16px                  |
| Button / navigation        | Inter, 500–600      | 15 / 14–15px          | 1.4 / normal                                            |
| Metadata / secondary copy  | Inter, 400          | 13–14 / 13px          | 1.5 / normal; do not shrink to 9–10px                   |
| Status badge               | Inter, 500          | 12–13 / 12–13px       | 1.4 / normal                                            |
| Optional eyebrow           | Inter, 500          | 12 / 12px             | 1.5 / ≤0.06em; use sparingly                            |

Keep paragraphs sans-serif; serif is a heading contrast, not every section title.
Avoid uppercase for frequent controls. Excerpts preserve colloquial/mixed-language
wording; typography must not rewrite text. Timestamps can use tabular numerals,
but do not use monospace for every metadata item. At 200% text zoom, labels wrap
without overlap. Font failure must not remove affordances or change content order.

### Color and surface roles

| Proposed token                         | Value                 | Function                                                        |
| -------------------------------------- | --------------------- | --------------------------------------------------------------- |
| `--canvas`                             | `#0b141c`             | Existing dark ink foundation; no decoration beneath dense text. |
| `--surface-working`                    | `#14222b`             | Composer/comparison/pending work plane.                         |
| `--surface-interactive`                | `#1b2d37`             | Hover/focus context, selectable list row, secondary button.     |
| `--surface-context`                    | `#101d25`             | Optional context area; quiet, not another primary panel.        |
| `--surface-selected`                   | `#233c35`             | Local/global selected destination and chosen control.           |
| `--text-primary`                       | `#e9edeb`             | Main reading text.                                              |
| `--text-secondary`                     | `#a8b8c4`             | Supporting copy and timestamps.                                 |
| `--accent`                             | `#9fc6b5`             | Mineral green; focus, active destination, primary control.      |
| `--on-accent`                          | `#0b141c`             | Primary button label on solid accent.                           |
| `--divider`                            | `#263740`             | Decorative reading separation only.                             |
| `--control-border`                     | `#607d86`             | Recognizable input/control outline where boundary is essential. |
| `--surface-error` / `--text-error`     | `#352329` / `#e7abab` | Safe error and deliberate destructive emphasis.                 |
| `--surface-warning` / `--text-warning` | `#332d23` / `#e2c18c` | Uncertain status/notice; never a stock-price signal.            |

Calculated opaque-color contrast examples: primary/working 13.74:1,
secondary/interactive 6.99:1, accent/selected 6.34:1, primary button 9.92:1,
control border/working 3.69:1, error text/error surface 7.59:1. These are token
calculations, not proof of a rendered page's contrast. Test disabled states,
opacity, images, actual adjacent backgrounds and warning colors in browser QA.
Low-contrast dividers cannot be the only indication that a control exists.

Keep existing brand mark and palette family. No new logo/stock/company logos.
For Company monogram use name-derived initial(s), fixed calm tint, `aria-hidden`
when adjacent name supplies identity; do not imply verification or rating.
Atmosphere occupies only compact hero/header regions and fades into opaque
reading surfaces. Layout acceptance and reference-asset fidelity are separate.

### Spacing, shape, and width

| Token group  | Proposed values / use                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spacing      | 4, 8, 12, 16, 24, 32, 48, 64px; 8–12 inside controls, 16–24 within task groups, 32–48 between distinct tasks.                                                             |
| Shell        | Max 1280px; gutter 48px desktop, 24px tablet, 16px mobile. Never `min-width:1080px`.                                                                                      |
| Main/context | Flexible main + optional 280px context at ≥1024px, 32px gap; render the context column only for useful saved information. Collapse on smaller widths; omit it when empty. |
| Reading      | 68ch max preferred text, 60ch target side-by-side; use shell width for functional comparison, not a full-monitor paragraph.                                               |
| Radius       | 4px badges, 6px buttons/inputs, 8px contained work/dialog surfaces; no large pill/card system.                                                                            |
| Targets      | ≥44×44px comfortable touch/keyboard controls; icon hit area independent of glyph size.                                                                                    |
| Motion       | 120–160ms subtle color/opacity only; no fake execution animation. Reduced motion removes nonessential transitions/spinner movement.                                       |
| Focus        | 2px accent outline with 3px offset, visible on every control; selected state remains separate.                                                                            |

### Icons and interaction hierarchy

Use one coherent SVG language, preferably [Lucide](https://lucide.dev/guide/).
Choose a small audited local icon subset or, if justified at implementation review,
tree-shaken `lucide-react` imports. No icon dependency is installed by this plan.
Default glyph 20px, metadata 16px, empty state 28px; stroke 1.75, rounded ends.

Mapping: Home/Building2 for global destinations; LayoutDashboard/NotebookPen/
WandSparkles for Company sections; Plus/Pencil/ArrowRight for writing and opening;
Check/CircleAlert/Clock/Archive for state; MoreHorizontal/UserRound for contextual
menus. A sparkle identifies an explicit AI action or an actual AI proposal in
selective version provenance, not every note or a claim of factual verification.
Icons accompany labels; status must never be conveyed by color/icon alone.

| Interaction         | Visual / semantic rule                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary             | Solid mineral green with dark label, one principal action per task area. Save original or accept selected proposal; explicit AI generation only in its initial state.               |
| Secondary           | Lifted dark plane, visible boundary; opening workspace, reading source, canceling edit. Navigation is still Link even if button-shaped.                                             |
| Tertiary/contextual | Labeled control with a recognizable hit area, icon and hover/focus treatment; 44px target for actions. Use bounded secondary controls for important entrances, not tiny text alone. |
| Icon-only           | 44px target, accessible action/record name, visible hover/focus, optional tooltip; tooltip is not the accessible name.                                                              |
| Destructive         | Rose text/outline inside management disclosure; existing checkbox/exact-name confirmation retained. Never inline beside `Terima` as an unlabeled trash glyph.                       |
| Hover / focus       | Row/control tint + clearly visible focus; hover is never required to discover actions.                                                                                              |
| Active / pressed    | Selected plane/marker; `aria-current` for routes, `aria-selected` only for real comparison panels.                                                                                  |
| Disabled / loading  | Preserve readable reason; disabled native buttons, `aria-busy`, honest status text. Do not rely solely on low opacity or replace action labels with an unlabeled spinner.           |
| Error               | Persistent safe feedback beside affected field/action, retained input, `aria-invalid` and described error where appropriate. Success announces only after confirmed save.           |

## 11. CSS organization and gradual migration

Keep `globals.css` as the entry point for reset, base element defaults and existing
styles while migrating one approved surface at a time. Proposed supporting files:

```text
src/styles/tokens.css             roles, type/space/width variables
src/styles/typography.css         shared heading/reading roles
src/styles/controls.css           buttons, fields, badges, disclosures
src/components/app-shell.module.css
src/features/companies/company-workspace.module.css
src/features/thoughts/thought-presentation.module.css
src/features/refinements/refine-workspace.module.css
```

Import tokens/base styles once at app entry. Prefer CSS Modules for feature/shell
ownership; keep each component's responsive rules alongside its base styles.
Do not create a second global override sheet after the current 2,022 lines or add
another generic `h2`, `.thought-meta`, `fieldset` override for a single page.

For each surface: inventory its applied selectors at each breakpoint, migrate
its current styles and new roles together, inspect unaffected auth/create/edit
forms, then remove only proved-unused legacy selectors. No wholesale rewrite,
automatic mass deletion, or framework switch. Keep native fieldset/textarea resets
explicit. A module must not accidentally inherit a destructive/global form layout.
Avoid introducing cascade layers mid-migration without accounting for stronger
unlayered legacy rules; Modules plus an incremental selector map are sufficient.

## 12. Route transition and compatibility plan

Implement new destinations before changing existing links/actions. Keep Company
root as Overview; do not redirect the whole root unconditionally to Pemikiran.
Keep the existing Refine detail URL permanently for this milestone.

| Current input/link                                   | Future exact behavior                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/companies/:c` without history parameters           | Overview; same Company identity and ownership checks.                                                                                                                                                                                                                                                   |
| `/companies/:c?before=:cursor#thought-history-title` | Authenticated server dispatch to `/companies/:c/thoughts?before=:cursor#thought-history-title`; same cursor codec/order/20-row window. Invalid cursor follows current safe reader behavior.                                                                                                             |
| `/companies/:c?focus=:t#thought-:t`                  | Dispatch to `/companies/:c/thoughts?focus=:t#thought-:t`; render focused owned Thought separately if not in fetched window. Preserve `before` when both exist; no cursor replacement. New focus links may use `/thoughts/:t` directly.                                                                  |
| `/companies/:c?saved=:t`                             | Dispatch to `/companies/:c/thoughts?saved=:t#thought-:t`, preserving an existing valid `before`/`focus`. Fetch the owned saved Thought independently for exact DraftReceipt even if not in current page. Never acknowledge from URL text alone.                                                         |
| Root `#thought-:t` with no query                     | Server cannot read fragments. Compatibility island validates UUID fragment and uses `router.replace` to the focused reader; ownership checked at destination. Unknown fragments untouched. No history entry loop.                                                                                       |
| Root `#thought-history-title`                        | Compatibility island replaces location with `/companies/:c/thoughts#thought-history-title`; the new list retains that exact ID. Without JavaScript root exposes a visible `Pemikiran` link at that legacy anchor; no silent dead end.                                                                   |
| Root `#data-control`                                 | Keep exact management disclosure ID in Overview, with original archive/delete forms; open and focus it on explicit old hash/menu action. This is secondary management, not primary Overview content.                                                                                                    |
| Capture success                                      | Final canonical Server Action redirect: `/companies/:c/thoughts?saved=:t#thought-:t`; same operation and exact receipt clearing. Update composer `useActionState` Company permalink to `/thoughts`, keep draft context string `company` unchanged.                                                      |
| Generation success                                   | Existing `/companies/:c/thoughts/:t/refine?proposal=:r#refinement-:r` retained. Page reads/validates `proposal` and fetches owned row independently of paginated history.                                                                                                                               |
| Review success                                       | Existing detail with `resolved=:r#refinement-:r` retained. Confirmed state selects accepted/rejected presentation; current accepted row loaded independently.                                                                                                                                           |
| Old detail `before` or bare `#refinement-:r`         | Preserve cursor/history title ID. If row is rendered, hash enhancement expands it. Otherwise replace the URL with the same detail path plus allowlisted `version=:r#refinement-:r`, retaining valid `before`, `proposal`, and `resolved`; server fetches the owned exact row independently. No AI call. |
| Back / keep original from Refine                     | New links go to focused reader (or existing `/thoughts?focus=:t#thought-:t` for list context). Navigation leaves proposal/acceptance intact; do not claim it changes the preferred selection.                                                                                                           |
| Thought deletion success                             | `/companies/:c/thoughts?deleted=thought`; root old `?deleted=thought` dispatches there. Parent state determines read-only handling.                                                                                                                                                                     |
| Company deletion success                             | Existing `/companies?deleted=company`; descendant routes unavailable afterward, no cached ghost Company.                                                                                                                                                                                                |
| Company archive/create/edit success                  | Existing root remains valid and lands on Overview; archive breadcrumb points to `/companies?view=archived`. Create/edit URLs and field behavior retained.                                                                                                                                               |
| Companies `q`, `view=archived`, `deleted=company`    | Preserve current exact query names and search semantics. No new pseudo-status filter or unsupported sorting.                                                                                                                                                                                            |

For query-driven root compatibility use temporary normal server redirects (307
for GET, existing Server Action POST redirects 303); no broad permanent rewrite
and no provider/action replay. Construct same-origin internal URLs from validated
IDs and allowlisted values. Hash-only compatibility is an enhancement, with
meaningful no-JavaScript entrances. Preserve any allowed combined history values;
do not forward arbitrary `returnTo` or serialize source text into URLs.

Keep `thought-:id`, `refinement-:id`, and history IDs on their final destinations.
Root retains `thought-history-title` as a visible Pemikiran entrance and can retain
anchors for its bounded latest previews. An arbitrary hash-only old Thought bookmark
cannot identify its target to the server without JavaScript: with JavaScript it
opens the exact owned focused reader; without it, Overview remains reachable with
a clear Pemikiran entrance, but exact-target scrolling outside rendered previews
is unavailable. Record this limitation rather than loading every Thought merely
to fabricate anchors. Query-based old links and new focused-reader URLs work
without the hash enhancement. An off-page refinement hash has the analogous
no-JavaScript limit; new history links use `version` for exact server selection.
Add `scroll-margin-top` covering sticky context/navigation. Route transitions
must not lose a local draft: existing store flush-on-blur/pagehide stays in place,
and navigation never changes the storage key just because the URL changed.

Invalidation proposal after confirmed mutation:

| Mutation               | Revalidate                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Capture                | `/`, Company Overview, `/thoughts`, `/refinements`; focused reader if needed.                                                               |
| Generate proposal      | Existing Refine detail and `/refinements`; preferred text does not change.                                                                  |
| Accept / reject        | Existing detail, Company Overview, `/thoughts`, `/refinements`, focused reader, `/`; accept changes projection, reject changes status only. |
| Archive / Company edit | Library, Home, Company shared context/layout and all owned child surfaces using it.                                                         |
| Thought delete         | Home, Company section pages, focus/detail paths affected; do not redirect to deleted detail.                                                |
| Company delete         | Library/Home plus shared Company subtree invalidation.                                                                                      |

Verify installed Next.js invalidation semantics before implementation. Do not
replace the known deliberate full-page Refine status recovery with same-URL
router navigation simply to make transitions look smoother.

## 13. Data and query implications

**No schema migration is required by this design.** Existing Thoughts, refinements,
claims, events, ownership keys and statuses support the projections. No new
`preferred_content`, `current_view`, `last_visited`, summary, or UI-state table.
Do not edit applied migrations. If measured performance later justifies an index
or a database projection, propose an additive migration with evidence and obtain
user approval before execution; that is a separate checkpoint.

Proposed owner-scoped query helpers in existing `src/server/db/` boundaries:

1. Fetch the bounded visible Thought set using existing pagination/recent rules.
2. In **one batch**, read accepted refinements for those UUIDs with ordinary
   authenticated Supabase client: explicit `user_id`, `status=ACCEPTED`,
   `thought_id IN visibleIDs`, Company scope where the page has one Company.
   Across Home Companies, validate each returned parent against the owned Thought
   map. Select only IDs, parent/owner, text, status and provenance/time fields
   needed for the projection; limit cardinality to the requested set, skip empty set.
3. Validate and build a map, then project. No per-Thought query and no unbounded
   refinement history scan. Current accepted uniqueness bounds each batch to ≤20
   rows on a Company list, ≤5 on Home. Duplicates/invalid rows fail safely.
4. On Refine detail independently fetch current accepted, explicitly selected
   proposal/resolved/version, newest suggestion when needed, and pending claim.
   Current accepted and unreviewed suggestions must remain discoverable even after
   20 later rejected proposals. History query stays separate with its existing cursor.
5. Refine picker reuses bounded Thought page and accepted map; get suggestion and
   pending statuses in batches. For suggestions, fetch distinct requested Thought
   IDs/status only and mark `Ada usulan` without downloading every AI text. Preserve
   Supabase response-limit awareness: chunk bounded IDs and union results so a
   Thought with many proposals cannot hide another Thought's status. A tiny owned
   per-batch SQL helper is optional only if measurement proves needed, requiring
   migration review; never revert to N+1 detail/history calls in a picker.
6. Overview: existing bounded Thought page can provide latest/three previews;
   one projection batch plus optional count. Recent domain events query by owner
   and Company, `created_at DESC, id ASC`, limit three, allow only implemented
   THOUGHT_CREATED/REFINEMENT_ACCEPTED with valid live entity links. Event titles
   and summaries remain user data, never prompts or synthesized judgments.

The suggestion-status batch must define boundedness concretely during implementation:
ordinary PostgREST pagination over matching suggestion **IDs only**, with a documented
maximum scanned window and explicit `status belum dimuat` for incomplete summaries;
never show `Belum dirapikan` when a capped query cannot prove absence. Default picker
can simply use accepted/pending plus `Buka untuk meninjau` until accurate suggestion
presence is fetched. This favors truthful UI over a speculative database migration.

Home recent reading may include archived Companies with an archive badge. Extend
its joined public-to-owner Company metadata with actual `state` before deriving
continuation. Continue targets newest _active_ Thought if one is available in the
bounded selection, otherwise first updated active Company; do not pretend this is
true last-browsed work. When only archived Thoughts are recent, retain their read
links and show a separate active Company entrance. Capture list remains active only.

Query budget targets: page fetch + one accepted batch, independent of number of
displayed Thoughts; per-Thought Refine detail has constant bounded read count.
Existing Company auth/owner lookups can remain until profiling motivates request
deduplication. Do not weaken authorization to hit an arbitrary query count.
Measure response size and query count with 1/20 items and many historical proposals.

Separate failure handling for optional context and primary content. Optional
activity unavailable may show `Aktivitas belum dapat dimuat`; do not replace it
with invented zero counts. Projection failure must not silently become “no
accepted version.” Text/IDs never enter analytics or console diagnostics. Keep
elevated credentials solely inside existing narrow accounting/completion/admin
boundaries, never presentation queries or browser bundles.

## 14. Phased implementation plan and rollback controls

The overall design direction and major compositions are approved subject to the
final polishing requirements below. All phases still require a separate explicit
instruction to start application implementation. Implement as reviewable slices;
preserve intermediate routes until their consumers migrate. Referensi is outside
these phases; accommodating its later navigation does not authorize its feature.
Future tests may be adjusted for new route destinations without changing their
security/AI assertions. No tests or application code are changed by this blueprint.

| Phase                           | Affected files / data                                                                                                                                                                    | Preservation and compatibility                                                                                                                       | Test and visual acceptance                                                                                                                                                                        | Rollback risk/control                                                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Foundations                  | Proposed `src/styles/*`, shared UI components, `app-shell` styling, eventual local font/icon assets. No DB change.                                                                       | Existing auth/forms remain functional; current routes unchanged.                                                                                     | Type/lint/format/build; controls with focus/disabled/error; long Indonesian text and fallback fonts at 390/768/1440. Approve token/type sample before pages.                                      | Global CSS could break old forms. Migrate explicit selectors/role classes, retain original unrelated styles; no dependency/framework rewrite.                                                        |
| 2. Navigation and Company shell | PrivateNavigation, AppShell, new Company layout/header/section-nav/account menu. No DB change.                                                                                           | Auth private layout, LogoutForm POST and draft cleanup, Company owned lookup; Overview root and existing detail/edit retained.                       | Navigation active states including nested Refine, keyboard/Back, signed-out/foreign Company, archive header refresh; all three local links discoverable.                                          | Retained layout may be stale. Refresh shared context after mutation; never authorize solely through layout. New section links ship only with functioning leaf routes (phases 3–5 may land together). |
| 3. Overview and compatibility   | Company root composition, new `/thoughts` route using extracted existing workspace body, compatibility helper; existing link/action updates only after destinations exist. No DB change. | Raw capture/history, deletion/archive forms, `before/focus/saved/deleted`, fallback anchors, post-save DraftReceipt.                                 | Legacy URLs with/without JS, pagination boundaries, off-page saved/focus, deletion/archive redirects; Overview has concise orientation and no full history stack.                                 | Losing receipt or hashes can strand drafts/links. Keep temporary dispatch and exact old IDs; rollback links and action redirects together, keep aliases while reverting.                             |
| 4. Preferred reading / focus    | DB accepted-batch helper, projection helper, ThoughtPreview/reader, Home previews, `/thoughts/:id`, history. No DB change.                                                               | Original immutability, old keyset ordering, accepted/rejected/superseded truth, no AI on read; retain raw source for generation.                     | Matrix in section 7; accepted outside first 20 history rows, edited text, fake foreign rows, query error, query-count independence; long text comfortable.                                        | Stale/incorrect accepted display. Revalidate all consumers; rollback presentation to explicitly labeled raw, not data writes.                                                                        |
| 5. Refine workspace/state UI    | New `/refinements`, current detail composition/forms, comparison/history, bounded status helpers. No default service/provider changes.                                                   | Explicit generation/claim/accounting, pending no-replay, 0 SDK retries + 1 accounted format repair, archive review, existing proposal/resolved URLs. | Existing deterministic/live DB tests with mocked provider; all six states, uncertain failure reload, edit failure retention, source ceiling. Desktop compare and mobile panel fallback inspected. | Layout must not create accidental generation or loss of pending IDs. Keep exact Server Actions/services; no live AI QA without new authorization.                                                    |
| 6. Home/library consistency     | Home, Companies, create/edit form compositions and scoped styles. No new metrics/tables.                                                                                                 | Active/archive search, owner-only list, selector/drafts, five recent Thoughts, unchanged management semantics.                                       | Empty/one/many Companies, no ticker/sector, long name/note, archived recent items, primary capture visible; no grid of decorative widgets.                                                        | “Last activity” mislabeling/fabrication. Use exact data-source labels; rollback only composition.                                                                                                    |
| 7. Responsive/accessibility     | Component-owned media rules, labels/focus, comparison enhancement, navigation safe-area behavior. No API/DB changes.                                                                     | Full text and actions remain accessible; no hover-only controls.                                                                                     | Keyboard, screen reader, 320px reflow, 200% text/400% zoom, software keyboard, reduced motion; tablet true single-column comparison.                                                              | Sticky rails can cover actions. Default to document flow, add measured padding, reduce sticky behavior where needed.                                                                                 |
| 8. Regression/visual acceptance | Future focused tests, synthetic QA fixtures/captures, documentation of results.                                                                                                          | Existing auth/RLS/draft/deletion/AI budget suite; no billing/settings changes or additional roles.                                                   | Full appropriate check/build, mock-provider database suite, browser matrix and explicit user visual review. Native zoom limitation recorded separately.                                           | Passing build is not visual approval. Do not close visual acceptance while missing asset/native zoom/sign-off remain unverified; retain recovery plan.                                               |

There is no new provider request in these phases unless separately authorized for
a bounded evaluation. Existing backend behavior is preserved even if its form
placement changes. Atomic review and deletion remain in existing RPCs; CSS and
navigation cannot replace their confirmations or ownership checks.

## 15. Accessibility and responsive requirements

Use [WCAG 2.2 guidance](https://www.w3.org/WAI/WCAG22/quickref/) as the acceptance
reference: normal text contrast ≥4.5:1, large text ≥3:1, meaningful control/focus
contrast ≥3:1, reflow without page-wide horizontal scrolling at 320 CSS pixels.
Our preferred touch size is 44×44px; this is a design target beyond the 24px
minimum target criterion, not a claim that every WCAG rule requires 44px.

| Width / condition   | Required behavior                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥1024px             | Global top navigation; shared Company header/local links; optional 280px context column; original/proposal comparison side-by-side.                                                                               |
| 640–1023px          | Global top navigation stays labeled; one working column; context after task; stacked full comparison; no narrow pseudo-desktop panels.                                                                            |
| <640px              | Compact top account header, two-destination bottom navigation; local links in one dedicated horizontally scrollable region if needed; one primary comparison panel plus explicit original access and expand-both. |
| 320px / zoom reflow | Page fits viewport; only local navigation may scroll horizontally, with selected item scrolled into view on keyboard focus. Thought text wraps; no fixed-width tables/dialogs.                                    |
| Software keyboard   | Textarea/field/error/save button reachable, focused field not obscured; bottom rail handling verified on actual browser/device, not assumed from desktop resize.                                                  |

Keyboard order: skip link → global links/account → breadcrumb/Company management
→ local navigation → primary task → contextual/history content. One page h1
(Company name inside shared shell; section h2 beneath); avoid repeated hero h1s
inside every child. Visible labels for inputs and status; icons decorative unless
sole control, then accessible name includes action and record identity.

Menus/disclosures must work with Enter/Space, close predictably, and return focus
when appropriate. Any real dialog uses proper labeling, focus containment, Escape,
and trigger focus restoration. Prefer native disclosure for simple secondary
content rather than a dialog dependency for everything. Destructive confirmation
has full consequence copy and existing required confirmation fields, not color
alone. No nested link/button and no click-only `<div>` row.

Use polite live regions for actual save/generation progress and confirmed outcome,
not every timer tick. Preserve input on validation failure, focus or describe the
field error, and never render technical AI Run/provider diagnostics as ordinary
feedback. Reduced-motion disables optional movement; busy text still identifies
the state. Full original and proposal remain accessible if JavaScript/font/image
enhancement fails.

## 16. Visual QA and regression criteria

Planning verification here: source audit, actual PNG inspection, read-only reference
source inspection, and token contrast calculation. **No redesigned UI was run or
visually accepted**, because implementation is explicitly forbidden in this task.
Prior native-zoom and landscape/font fidelity limitations in documents 12/14
remain. Future browser screenshots must identify viewport, DPR, browser zoom,
CSS zoom and visual-viewport scale separately. Scale 1 is not proof of native
100% zoom when controls are unavailable.

Future minimum matrix: desktop 1440×900, tablet portrait 768×1024, mobile 390×844,
plus narrow 320px and wide 1920px checks. Inspect Home, library, Overview,
Pemikiran, picker, focus, and each detail state. Use disposable owned data and
mock provider responses for routine QA; no real user's Thought screenshots.

| Fixture / interaction                                           | Visual and behavioral evidence required                                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Empty account / Company                                         | Clear first step, no dead tabs, fake activity or disabled decorative widgets.                                         |
| One / twenty / >20 Thoughts                                     | Composer and pagination coherent; preferred map batched; current/targeted row not lost outside cursor window.         |
| Long Company name, no ticker/sector, long word/link             | Identity readable, row grows, optional metadata truly omitted, no page overflow.                                      |
| Maximum original, multiline colloquial Indonesian/mixed English | Full exact source readable, preserved line breaks, 68ch text width, no auto formalization or hidden truncation.       |
| SUGGESTED with earlier ACCEPTED                                 | Proposal labeled unadopted; accepted primary elsewhere; comparison and independent history truthful.                  |
| ACCEPTED AI / edited ACCEPTED                                   | Correct chosen content on all surfaces after refresh; provenance clear; no acceptance form dominating resolved state. |
| REJECTED / SUPERSEDED / >20 historical versions                 | Rejection not an error; current accepted not inferred from history first page; all old versions reachable.            |
| Pending / timeout / uncertain accounting                        | No duplicate enabled action or automatic retries; reload reveals durable state; edits/previous text retained.         |
| Archived Company                                                | Capture/generate unavailable, reading and saved review available; management remains deliberate.                      |
| Budget exhausted / AI disabled                                  | Manual capture/read work; no upsell or bypass; safe feedback near action.                                             |
| Legacy deep links / save and review redirects                   | Exact anchors, cursors, receipts, Back behavior and selected section remain correct; test hash-only/no-JS paths.      |
| Keyboard / reduced motion / native 100% zoom                    | Focus/order/contrast, touch area, no obscured controls; record limitations and outstanding manual checks explicitly.  |

Capture actual above-fold layouts with representative content and compare hierarchy,
not fabricated pixel-perfect mockups. Verify real interactive controls in hover,
focus, pressed, disabled, loading and error states. Ask for user visual review
after a concrete implemented proposal exists; no generic build-only sign-off.

Functional regression must preserve auth/logout, refreshed sessions, RLS/foreign
parent rejection, immutable original, isolated drafts and exact receipt clearing,
archive constraints, delete confirmations/cascades, stable keyset pagination,
durable request identity, proposal history, and budget settlement. Deterministic
tests may check preferred mapping, bounded batching, route compatibility and active
navigation rules. Browser checks verify pending/failed review states. All AI
responses in routine regression remain mocked.

## 17. Risks, decisions, and explicit tradeoffs

| Decision / risk                             | Recommended resolution / remaining review                                                                                                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| User-approved versus original-first display | Approved: use projection on reading surfaces while original comparison remains explicit. Preserve immutable source and status truth. Starting implementation still requires a separate user instruction.                                   |
| Latest Thought mistaken for company thesis  | Use `Pemikiran terakhir` and capture timestamp. No aggregate Current View until actual domain logic exists.                                                                                                                                |
| Focus route versus modal                    | Include minimal read-only route now; defer parallel/intercepting routes and side panels. Simple deep links outweigh one additional leaf route.                                                                                             |
| Mobile AI comparison                        | One labeled proposal panel with prominent original switch and expand-both; tablet stacks both. Validate discoverability before sign-off. No meaning-check algorithm implied.                                                               |
| Incomplete picker suggestion summaries      | Accepted/pending counts can be bounded; cap/response-limit must not invent absence of suggestions. Ship a truthful simpler picker if complete status aggregation needs a migration.                                                        |
| Layout and cache staleness                  | Leaf/action authorization remains independent; invalidate every preferred display consumer and shared header after mutation.                                                                                                               |
| Draft migration                             | Keep existing `home`/`company` storage namespaces and operation protocol; change URLs/permalinks without changing draft identity. Never mount two simultaneous composers with duplicate form IDs.                                          |
| Missing atmospheric asset                   | Keep dark canvas complete; approved standalone artwork still needed for full landscape fidelity. No silent stock substitution or screenshot background.                                                                                    |
| Font/icon direction                         | Approved typography direction: Source Serif 4/Inter with coherent SVG controls. Verify actual rendered fonts, self-hosted assets and licenses during implementation QA; no application assets or dependencies change in this design stage. |
| CSS extraction                              | Scoped gradual migration, preserve old forms until verified. Do not rewrite backend or CSS wholesale to satisfy appearance.                                                                                                                |
| Visual QA limitation                        | Native browser 100% zoom was previously unverified; future report must either confirm it with available controls or retain a named manual item. Automated pass is separate.                                                                |
| Semantic fidelity                           | Revised prompt reduces a known failure but cannot prove output meaning. Human comparison remains explicit; no further real-provider evaluation in design planning.                                                                         |
| Destructive controls                        | Move placement only; preserve backend confirmation and archive/review semantics. No restore/trash/reset-preferred capability is added implicitly.                                                                                          |

User approval covers the navigation architecture, page separation, preferred-version
rules, compatibility/security preservation, palette, typography direction and major
desktop/mobile compositions. The final polishing requirements below are mandatory,
not optional suggestions. This design approval does not authorize application
implementation, a References feature, database changes or Phase 6.

## 18. Final acceptance checklist

### Blueprint completion

- [x] Current pages, components, persistence/domain boundaries and CSS inspected.
- [x] Requested approved direction/implementation notes read for applicable scope.
- [x] Six actual KRAVV-IENT source files inspected and reference limitations identified.
- [x] All ten actual desktop/mobile PNGs visually inspected.
- [x] Comparative audit, root causes, two-level sitemap and page responsibilities specified.
- [x] Concrete desktop/tablet/mobile placement and above-fold targets documented.
- [x] Preferred-version rule, lifecycle, provenance and original-generation source specified.
- [x] State-driven Refine, component/CSS boundaries and design tokens documented.
- [x] Legacy routes, fragments, cursors, receipts, redirects and invalidation specified.
- [x] Owner-scoped batch retrieval, query risks and no-migration default documented.
- [x] Phases include files/data, preservation, testing/visual criteria and rollback controls.
- [x] Accessibility, QA states, risks and unresolved approval decisions documented.
- [x] Blueprint-only delivery; no production UI/backend/test/migration change or provider request.

### Future implementation acceptance — not yet satisfied

- [ ] Recognizable global and Company navigation; only functional destinations.
- [ ] Overview orients; Pemikiran captures/reads; Refine selects/compares/reviews.
- [ ] Valid accepted/edit wording is primary on every applicable reading surface.
- [ ] Exact original, unadopted AI, accepted wording and all history are distinguishable.
- [ ] Strong readable hierarchy, functional surfaces and consistent labeled SVG controls.
- [ ] Repetitive explanatory copy removed across all five views; necessary safety/privacy/uncertainty and irreversible-action copy retained at the relevant action.
- [ ] Interactive rows, working entrances, secondary actions and contextual controls remain recognizable before hover; selected navigation is unmistakable.
- [ ] Overview context is useful saved information; Pemikiran has no philosophy-only sidebar; empty secondary columns are omitted.
- [ ] Selective version-evolution motif reflects persisted proposal/acceptance state and never implies automatic adoption or factual verification.
- [ ] No decorative card proliferation, fabricated statistics, unsupported sections or automatic AI.
- [ ] Existing links, pagination, draft receipts, auth/RLS, lifecycle and accounting pass regression.
- [ ] Actual empty/long/suggested/accepted/rejected/archived layouts work on desktop/tablet/mobile.
- [ ] Actual font use/loading/fallback, vertical density and all interaction states verified in the implemented browser UI.
- [ ] Real mobile keyboard, focus visibility and save/review reachability checked; accessibility/reflow/motion/contrast validated.
- [ ] Native 100% browser zoom independently verified where accessible; unavailable controls remain an explicit manual acceptance checkpoint, not a claimed pass.
- [ ] Atmospheric asset/font fidelity debt resolved or explicitly accepted as outstanding by user.
- [x] Overall desktop/mobile design direction and major compositions reviewed and approved, with final user-approved polishing requirements.
- [ ] Separate explicit implementation instruction received before coding; real implementation QA and visual acceptance completed afterward.
- [ ] Milestone 5.5 ships no Referensi tab, placeholder route, data model, source records, association controls, fetching or AI integration.

**Stop at this blueprint.** Milestone 5.5 implementation, Phase 6, real AI requests,
billing changes, commits and pushes are not authorized by this planning document.

## Supplementary visual review — 2026-10-08, design only

At the start of this prototype stage, user review had directionally approved the
information architecture, preferred-version rules, compatibility and security;
visual approval was still pending. Following review of the captures below, the
user approved the overall visual direction and major compositions with the final
polishing requirements recorded next. The captures remain the reviewed baseline,
not evidence that those later revisions or implementation QA have been completed.

Artifacts live outside the application in `design/milestone-5.5/`. They use fictional
Indonesian content, self-contained Source Serif 4/Inter fonts, dark ink and mineral
green, local SVG icons, a small original illustrated landscape, functional working
surfaces, selected navigation, buttons and provenance/status badges. No app services,
Supabase, AI requests, production routes/components, or tests are involved.

### Final prototype references

[View the static gallery](../design/milestone-5.5/index.html) and
[artifact instructions / rendering notes](../design/milestone-5.5/README.md).
The optional loopback viewer is `http://127.0.0.1:4175/`; the HTML and screenshots
also remain available from disk independently of the server.

| View                         | Prototype                                                | Desktop 1440×1000                                                       | Mobile 390px full sheet                                                     |
| ---------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Home                         | [home.html](../design/milestone-5.5/home.html)           | [Screenshot](../design/milestone-5.5/screenshots/home-desktop.jpg)      | [Screenshot](../design/milestone-5.5/screenshots/home-mobile-full.jpg)      |
| Companies Index              | [companies.html](../design/milestone-5.5/companies.html) | [Screenshot](../design/milestone-5.5/screenshots/companies-desktop.jpg) | [Screenshot](../design/milestone-5.5/screenshots/companies-mobile-full.jpg) |
| Company Overview             | [overview.html](../design/milestone-5.5/overview.html)   | [Screenshot](../design/milestone-5.5/screenshots/overview-desktop.jpg)  | [Screenshot](../design/milestone-5.5/screenshots/overview-mobile-full.jpg)  |
| Pemikiran                    | [thoughts.html](../design/milestone-5.5/thoughts.html)   | [Screenshot](../design/milestone-5.5/screenshots/thoughts-desktop.jpg)  | [Screenshot](../design/milestone-5.5/screenshots/thoughts-mobile-full.jpg)  |
| Refine / proposal comparison | [refine.html](../design/milestone-5.5/refine.html)       | [Screenshot](../design/milestone-5.5/screenshots/refine-desktop.jpg)    | [Screenshot](../design/milestone-5.5/screenshots/refine-mobile-full.jpg)    |

Also available: [desktop review board](../design/milestone-5.5/screenshots/desktop-board.jpg),
[mobile review board](../design/milestone-5.5/screenshots/mobile-board.jpg),
[expanded mobile comparison](../design/milestone-5.5/screenshots/refine-mobile-comparison.jpg),
and `*-mobile.jpg` first-screen / `*-desktop-full.jpg` captures in the same folder.

Overview presents one latest chosen Thought with saved context and working
entrances; it contains no composer or review form. Pemikiran gives writing a
contained surface and reading a continuous stream. Refine gives proposal states
a compact desktop queue and the selected comparison a working plane; its mobile
review prioritizes the selected proposal with original disclosure above it and
explicit selection/edit/accept/reject affordances. The illustrative proposal keeps
`kayaknya` and `aku belum cek`; it was written locally, not generated by AI.

All ten main desktop/mobile layouts were visually inspected. Width checks at
320px, 390px, 768px and 1440px found no page-wide horizontal overflow. CSS zoom
was 1. Native 100% browser zoom, device pixel ratio and actual phone keyboard
behavior were not independently verified. Main first-screen image files are
1425×990 pixels desktop and 375×811 mobile despite the reported CSS viewports;
the browser capture surface trims the output. Exact dimensions are recorded in
the artifact capture manifest. Default mobile views have fixed bottom
navigation; full-page export variants place that rail at the end in document flow
to avoid capture overlay artifacts. Full sheets therefore do not demonstrate
fixed-rail scrolling behavior. Buttons remain inert visual examples, not implemented
workflows. These limitations are detailed in the artifact README.

### Approved baseline and remaining detail checkpoints

- Approved: overall navigation, page separation, palette, typography direction and
  major desktop/mobile compositions, including Home's composer/recent-thinking
  pairing and Refine's focused proposal review. Separate picker/detail routes remain
  the architecture; prototype controls do not implement those routes or actions.
- Keep the reviewed mobile proposal-first view with prominent original disclosure
  and a full-comparison option; verify discoverability and keyboard access during
  implementation QA. The expanded comparison capture remains a comparison reference.
- The final landscape asset choice remains open. The illustrated atmosphere does
  not resolve photographic reference fidelity; no screenshot becomes a background.
- Actual font rendering, density and interaction-state QA remain required despite
  typography/composition approval. Empty, archived, pending, failed, resolved and
  longer-content variants still require real layout review before acceptance.
- Static prototypes and captures are retained as the approved composition baseline.
  The written final revisions below govern future implementation; they have not
  been rendered into a new prototype revision or applied to the application.

## Final user-approved revisions and milestone boundary

This decision record supersedes earlier proposed copy, philosophy-only sidebars and
affordance details where they conflict. It preserves the approved information
architecture, current ownership/RLS, immutable source, Refine lifecycle, request
identity, AI Gateway/budget guard and compatible routes. Design approval is not
an instruction to begin Milestone 5.5 or Phase 6.

### 1. Microcopy: explain at the point of need

Remove repeated philosophy and instructions when the controls, provenance or state
already communicate them. Do not replace them with another paragraph or tooltip.
Keep concise labels, accessible names, relevant empty-state guidance and error
recovery. User-authored Company notes and Thoughts are content, not microcopy to
shorten or rewrite.

| View            | Final polishing requirement                                                                                                                                                    | Explanations retained where needed                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home            | Keep the compact hero, continuation and capture hierarchy. Remove redundant hero/composer helper lines and repeated encouragement around recent thinking/research spaces.      | Draft privacy/storage limitations in one relevant disclosure; actual save/storage error and exact save acknowledgement; guidance when no active Company permits capture.                                       |
| Companies Index | Let identity, state, search and open/add controls explain the library. Remove philosophy footnotes and redundant add-space invitations on a populated list.                    | Empty/no-results guidance, archived-state meaning and irreversible Company deletion confirmation in management.                                                                                                |
| Overview        | Prioritize latest preferred Thought, saved context and entrances. Remove recurring product-philosophy or “not AI” paragraphs where a compact source/provenance label suffices. | Archive restrictions and meaningful provenance; ownership-safe missing-data feedback. Never remove the distinction between latest Thought and an aggregate thesis.                                             |
| Pemikiran       | Use composer → continuous reading stream. Avoid repeatedly explaining original preservation and acceptance on every row or in an instructional sidebar.                        | One draft privacy disclosure, relevant validation/storage errors, clear source/version indicators, exact original access and irreversible Thought deletion consequences.                                       |
| Refine          | Use one clear proposal-state label and one concise meaning-review cue per comparison; avoid repeating the same unadopted-output warning in header, panel and footer.           | Missing verification/uncertainty in the text itself, actual output warnings, deliberate acceptance consequences, pending/failure status recovery, budget/source/archive restrictions and retained edit errors. |

Acceptance: review all five populated views for repeated explanatory sentences;
remove duplicate copy while preserving necessary safety and privacy information at
its relevant action. Reduction must not alter a Thought's uncertainty, first-person
perspective, reason for a belief or exact original wording.

### 2. Affordances: recognizable before interaction

- Interactive Company rows and section entrances use clear identity, a visible
  open/action control and restrained interactive surface treatment. Hover and
  `focus-within` reinforce the group; they are not the only way to discover it.
- Important secondary actions use a bounded hit area, readable label and coherent
  SVG icon. Plain text links remain suitable for genuinely secondary references,
  not the only language for entering a workspace or reviewing a proposal.
- Active navigation combines selected mineral-green surface, weight/marker and
  `aria-current`; keyboard focus is distinct from selection. All current working
  sections remain identifiable on nested routes and mobile.
- Contextual controls remain visible on touch, with at least 44px comfortable
  targets and accessible record/action names. Ellipsis or account triggers reveal
  management; the trigger itself never performs a destructive operation.
- Preserve semantic links for navigation and buttons for actions. No nested
  interactive children inside a whole-row link, click-only containers, hover-only
  controls, decorative cards around every entry or automatic AI on navigation.

Acceptance: inspect resting, hover, focus, pressed/selected, disabled, loading and
error states. Every primary entrance and contextual action must be discoverable
at rest, keyboard-operable and understandable without color alone.

### 3. Spatial balance and useful secondary context

**Overview:** a secondary column may contain a concise user-authored Company note,
real saved counts or meaningful persisted activity. Show only useful available
context; no fabricated metrics, repeated philosophy or future References preview.
If no useful context exists, omit the column and rebalance the working area rather
than reserving 280px of empty space. Long text still has a comfortable reading width.

**Pemikiran:** remove the prototype's unconditional philosophy sidebar. Default
to the composer and reading stream with count/order/contextual controls near the
task. Add a secondary area only when actual task-relevant context warrants it;
do not retain an explanatory panel merely to fill a grid. Form/tool grouping can
use the wider shell while long-form text stays within the proposed reading width.
The result must not be a narrow article floating in a largely empty desktop canvas.

Tablet/mobile place useful secondary context after the primary task, or omit it.
With empty, short and long content, test the resulting balance and first-screen
visibility; no empty sidebar, duplicated instructions or inaccessible controls.

### 4. Selective MY KRAVV Thought-evolution motif

Use a small **version trail** where relationships matter: **Asli → Usulan AI →
Versi pilihan · Kamu terima**. This is provenance, not a progress meter. A fine
connector and consistent source/proposal/user-decision glyphs echo the notebook's
evolving wording; no large decorative timeline, execution animation or repeated
trail on every Home/library row. Reading previews normally keep one version label.

Visual roles: original/source uses neutral ink/slate; an unadopted proposal uses a
restrained warm outline/label; mineral green marks an actual current accepted
version. The connector from proposal to acceptance represents a **human decision**,
visually interrupted/labeled `Keputusanmu`, never an automatic pipeline. A check
means “you accepted this wording,” never “verified fact” or “correct investment.”
Labels remain readable at ≥12px and accompany icons; decorative connectors are
hidden from assistive technology. Mobile wraps/stacks the relationship without
page overflow. Any actionable version node uses a real accessible control, not
a tiny clickable dot. Reduced motion does not remove state information.

| Persisted state                          | Truthful motif behavior                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No refinement                            | Show original only. Do not draw completed AI/acceptance stages or imply a pending automatic call.                                                                                          |
| SUGGESTED                                | Connect original to the actual proposal; identify the pending human choice. Do not show a completed accepted node. Acceptance and rejection remain deliberate actions.                     |
| ACCEPTED, AI wording                     | Mark the actual accepted version as current with `Kamu terima`; source and immutable AI proposal remain traceable.                                                                         |
| ACCEPTED, user-edited wording            | Mark `Versi pilihan · Kamu sunting & terima`; preserve distinct original and AI wording in history/comparison.                                                                             |
| New SUGGESTED alongside earlier ACCEPTED | Keep earlier acceptance current; depict the new proposal as a separate unadopted branch from the original. Generation still uses raw source, not a chain from accepted wording.            |
| REJECTED / SUPERSEDED                    | Label the historical state explicitly. Rejection ends that proposal branch; a superseded version is historical, not current. An earlier valid acceptance remains primary where applicable. |

Acceptance: the motif follows confirmed stored status and owner/parent validation,
not local form optimism or position in the newest history page. A rejected or
pending proposal must never appear accepted, verified or automatically advanced.
Use it selectively in Refine comparison/history or focused version provenance;
no status change, provider request or new domain model is caused by the motif.

### 5. Implementation QA checkpoints — still outstanding

These checks apply after a separately authorized implementation. Static captures,
CSS zoom 1, computed font-family names, deterministic tests and a successful build
are not substitutes for actual rendering and interaction evidence.

| Checkpoint                     | Evidence required before implementation acceptance                                                                                                                                                                                                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual fonts                   | Confirm the fonts actually used by rendered headings/body through browser font inspection and asset loading, not family declarations alone. Check expected weights, Indonesian/mixed-language text, fallback/load failure and resulting layout shifts.                                                                            |
| Vertical density / balance     | Inspect all five views at desktop/tablet/mobile with empty, short, long and multiline content. Verify useful above-fold actions, comfortable reading, concise copy and sidebar removal when context is absent.                                                                                                                    |
| Interaction states             | Exercise resting/hover/focus/pressed/selected/disabled/loading/error states and contextual menus, capture/save, comparison/edit/review and recovery with synthetic data and mocked AI. No live provider request is authorized by this design approval.                                                                            |
| Real mobile keyboard           | Open capture and review textareas on an actual mobile browser/device where available; confirm caret, label, errors and submit controls remain reachable with the keyboard open, bottom navigation does not obscure them, and draft/edit state survives appropriate navigation. Desktop resizing alone is insufficient.            |
| Accessibility                  | Check keyboard/focus order, screen-reader labels and status announcements, semantic headings/navigation, contrast, comfortable targets, reflow/text zoom and reduced motion. Compare source/proposal and access history without dependence on hover or visual connectors.                                                         |
| Native 100% browser zoom       | Set/confirm native browser zoom using accessible browser controls and record it alongside viewport, DPR, CSS zoom and capture dimensions. A reported scale of 1 is insufficient. If controls/device access are unavailable, leave a named manual check outstanding; do not claim visual acceptance for an unverified requirement. |
| Existing protection/regression | Preserve auth/RLS/owned parent checks, immutable original, preferred-version truth, exact draft receipts, deep links/cursors, archive/delete confirmations, Refine history/claims and budget accounting. Run the relevant suite and build during implementation, with routine provider responses mocked.                          |

### Future Referensi — approved direction, outside Milestone 5.5

**Referensi** is a future Company Workspace section for **manually saved external
source links**. The initial MVP is link-only. It stores contextual source records;
it does not establish verified facts, investment evidence, AI conclusions or a
company thesis. A user-selected “official website” category is not independent
authentication or verification of the destination.

Future supported categories:

- Official company website.
- Investor relations.
- Annual/quarterly financial reports.
- News articles.
- Research and other external references.

Future record contract:

| Field               | Planned meaning                                                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title               | User-entered title; required. No title fetched automatically from the destination.                                                                                                                                                              |
| URL                 | User-entered external source link; required. Validate syntax/safe web scheme locally in the future feature, not through a remote lookup.                                                                                                        |
| Source category     | User-selected category from the supported list; required. No automatic classification, credibility rating or verified badge.                                                                                                                    |
| Publication date    | Optional date supplied by the user; absence remains unknown. Do not substitute save time or infer it from the URL.                                                                                                                              |
| Personal note       | Optional user-authored context, rendered as text. Not an automatic summary.                                                                                                                                                                     |
| Associated Thoughts | Optional zero-to-many owned Thoughts. Validate ownership of the source record and every associated Thought. Whether associations may span owned Companies remains a future MVP design decision. No Thought text is rewritten by an association. |

Future security/product requirements, to be detailed in a separately scoped MVP:
owned source records and association checks on both parents, authenticated normal
RLS reads/writes, safe escaped text and deliberate external-link opening. External
navigation should identify that the user is leaving MY KRAVV and avoid granting the
destination access to the opener. Category, title, date and note are user-supplied,
not automatically verified provenance. Saving a link does not promote it into an
Evidence entity or append its contents to a Refine/AI context.

**Excluded:** document uploads, PDF/file storage, scraping, automatic website
fetching, metadata/link-preview/remote-favicon fetching, automatic summaries,
verification services and AI calls. No HEAD/GET request to a submitted source is
needed to save or locally validate it; visiting the source is a deliberate user
action. A financial-report reference stores a URL, not a copied PDF or its text.

| Boundary            | Milestone 5.5                                                                                                                             | Future separately authorized References MVP                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Company navigation  | Implement only Overview, Pemikiran and Refine when authorized. Use spacing/overflow rules that can accommodate a fourth section later.    | Add functional Referensi after its owned link workflows exist. Keep the three existing sections' order, active-state semantics and routes intact.        |
| Pages / controls    | No Referensi tab, disabled teaser, placeholder route, source form, source count, sample source preview or Thought association control.    | Define actual routes, link capture/list/detail/edit/delete behavior and association UX in its own brief.                                                 |
| Persistence / API   | No References table, join table, migration, API, query helper or association scaffold. Current backend/security/AI scope stays unchanged. | Design ownership-safe persistence and optional associations; propose any required additive migration with its own review and manual approval/checkpoint. |
| Data interpretation | Existing original/proposal/accepted states retain their meaning; no source-verification badge or evidence claim.                          | Contextual user-saved links remain distinct from verified facts and evidence; no automatic conclusions or AI use.                                        |

The future feature's route names, schema, CRUD/association details and final source
presentation remain to be specified. Approval of this direction is not authorization
to implement it now or to fold it into Phase 6.

### Final design-stage acceptance and stop condition

- [x] User-approved visual direction, page separation and major compositions recorded.
- [x] Mandatory microcopy, affordance, spatial-balance and version-motif revisions specified.
- [x] Future link-only Referensi categories/fields, contextual meaning and security expectations recorded.
- [x] Navigation accommodation specified without adding a current tab, placeholder or feature scaffold.
- [x] Implementation QA evidence and remaining asset/detail checkpoints identified.
- [ ] Separate instruction to begin Milestone 5.5 application implementation received.
- [ ] Actual implementation QA, relevant tests/build and final visual acceptance completed.
- [ ] Future References MVP separately scoped and authorized before any implementation/migration.

**Stop at this finalized design record.** Only this blueprint is revised in this
decision-recording stage. Existing static prototypes remain the reviewed baseline;
no application code, database, AI behavior, tests, commits or pushes change. Milestone
5.5 implementation and Phase 6 have not started.
