# MY KRAVV V3 — Visual References

**Status:** Owner-selected conceptual references; verify actual PNG presence in the repo.  
**Updated:** 20 October 2026 (Asia/Jakarta)  
**Destination:** `design/v3/references/`  
**Authority:** [V3 Documentation Authority](../../../docs/v3/00-V3-INDEX.md) and the owner's latest explicit decisions. This README is not proof of implementation or authorization to start coding.

## Purpose

The images convey visual direction, not a literal feature checklist. The agreed direction is **Hybrid C**: calm, premium SaaS; light-first with thoughtfully designed dark mode; neutral reading surfaces; restrained **green** accents; consistent navigation; accessible and comfortable long-form writing. Avoid an unrelated blue active underline when a green pill already marks a selected tab.

Screenshots contain fabricated sample company details, market figures, dates, links, text, costs, and controls. **Do not treat them as verified facts or automatically implement everything the generator depicted.** The owner's latest decisions and accepted V3 product contracts outrank incidental details in screenshots.

## Canonical PNG filenames

| No. | Filename | What it illustrates |
| --- | --- | --- |
| 01 | `01-home.png` | Beranda: Quick Capture, Penampungan, continue draft, companies |
| 02 | `02-company-directory.png` | Searchable company list |
| 03 | `03-company-overview.png` | Overview within a company workspace |
| 04 | `04-writing-space-guided.png` | Ruang Tulis — Terpandu |
| 05 | `05-writing-space-companion.png` | Ruang Tulis — Pendamping |
| 06 | `06-writing-space-ai-review.png` | Writing editor with AI Review side panel |
| 07 | `07-working-tree.png` | Explicitly staged candidate Thoughts |
| 08 | `08-thought-history.png` | Committed Thought history |
| 09 | `09-thought-detail-diff.png` | Thought detail and committed-version comparison |
| 10 | `10-explore-notebook.png` | Company's freeform Explore notebook |
| 11 | `11-references-library.png` | External-source reference catalog |
| 12 | `12-reference-create.png` | Tambah Referensi URL form/drawer |
| 13 | `13-commit-context-snapshot.png` | Optional emotional/situational context *inside Tinjau & Rekam* |
| 14 | `14-account-settings.png` | Global settings opened from navbar avatar |

**Legacy Home path:** an earlier V3 scaffold named the Home destination `01-home-approved.png`. This consolidated index uses `01-home.png`. When placing the original approved asset, update any old path in `design/v3/README.md` and `docs/v3/00-V3-INDEX.md`; never generate a replacement merely to fill the missing file.

## Navigation and visual rules

- Global navbar: **Beranda**, **Perusahaan**, search/theme/account utilities. Do not implement incidental **Kalender**, global Explore, or other destinations invented by images.
- Collapsible company sidebar: **Overview**, **Ruang Tulis**, **Pemikiran**, **Explore**, **Referensi**. **Pengaturan is global**, accessible from the navbar avatar, not in the company sidebar.
- The Writing Space's contextual right panel can open/close independently and should not crowd the editor. Tabs use a coherent selected state (prefer **green pill**, not green fill *plus* blue underline).
- Images guide composition, spacing, hierarchy, accessibility, responsiveness, and visual tone. Actual product flow is defined in V3 documents and owner decisions.

## Reference-specific intent and corrections

### 01 — Home

Quick Capture creates a fast input in a **separate Penampungan inbox**, not an Explore note or an immutable Thought. The user can resume an unfinished Writing Space draft. The early Home mockup's mountain/hero image is **not required**; a simpler content-first layout is fine.

### 02–03 — Company Directory and Overview

Directory must scale to many companies. Overview provides a company-level orientation, personal summary, continue-writing access, recent committed Thoughts, and references. Use the **revised Overview with contextual left sidebar** rather than superseded horizontal company tabs. Sample summaries, counts, and status labels are fictional and not prescribed taxonomy.

### 04–06 — Writing Space and AI Review

The editor supports three writing approaches: **Terpandu** (six optional fundamental-analysis areas), **Pendamping** (freeform with optional guidance), and **Kosong** (freeform). Sections/checklists are not mandatory gates; custom template management is not MVP scope. Autosave updates an unfinished draft without creating a commit version.

**AI Review is on demand**: Clarify, Challenge, and Gap Check. It critiques and asks questions rather than automatically editing the user's writing, deciding what is true, or triggering commits. Preserve the reviewed draft snapshot and indicate when results become stale following edits. No mandatory AI chat product, continuous AI calls, live market-data verification, or automatic source scraping.

### 07–09 — Working Tree, Thought History, Detail & Diff

**Working Tree contains intentionally staged/submitted candidates**, not every autosaved unfinished draft. A “Buat Draft Baru” action goes to **Ruang Tulis**. Candidates may reopen in the editor or proceed to review/record. Only the owner's explicit **Rekam/Commit** creates a committed Thought version; autosaves or AI feedback do not. History is for committed Thoughts; detail/diff shows their immutable version records. Screenshot labels such as “Draft Awal,” numbered version examples, and statuses are illustrative, not required rules.

### 10 — Explore Notebook

Explore is a **company-scoped, informal personal notebook**, not the AI chatbot previously pictured and not Quick Capture/Penampungan. Notes are freeform, editable, optionally flagged **Bahas nanti**, and can be deliberately used as writing material. Do not auto-stage them or send private/emotional notes to AI.

### 11–12 — References and Tambah Referensi

**References are an external-link catalog, not file storage.** Manually save URL (prefer a direct PDF link where stable), title, type, and optional description/publisher/date/tags/private notes. A landing-page URL is acceptable when a direct link is unavailable or temporary. **Buka Sumber** opens the original external link; **Salin Tautan** copies it; **Gunakan di Ruang Tulis** references its link or selected notes, not the whole PDF. No internal PDF uploads, object-storage requirement, automatic scraping, or assumed source verification in MVP. Links may expire. Do not blindly enforce every asterisk or secondary tab invented by the mockup.

### 13 — Commit Context Snapshot

The screenshot depicts the optional **Context Snapshot within the Tinjau & Rekam step**, **not** a separate company page, new sidebar item, or second Company Overview. At commit time the owner *may* record emotional/situational state, possible influences, confidence, or an optional reflection. **Skipping it must not block commit.** When supplied, associate it with that committed Thought version for future comparison. No psychological scoring, mandatory `7/10` slider, automatic AI sharing, or required AI Review panel during commit. All sample entries are placeholders.

### 14 — Account Settings

Open through **navbar avatar → Pengaturan**. Core scope: authenticated account details; email/password login and logout; change password; change email with the auth provider's supported verification; forgot-password recovery; basic light/dark preference; and a minimal **AI & Penggunaan** area (model, token usage, estimated cost, budget alerts when meaningful). Switching accounts can be **logout and login**. Data remains isolated per user.

Screenshot cost figures are **examples, not provider billing**; a budget alert is not necessarily a guaranteed hard cap. API secrets and passwords must not be exposed/stored in client-side app data. Use Supabase Auth capabilities instead of inventing a separate security-passphrase challenge: a *passphrase* is simply one kind of password. The screenshot's collaboration reference, speculative settings/notifications, and placeholder identity do not create MVP requirements. Codex may simplify the layout while meeting the approved needs.

## Visual QA checklist

- [ ] Consistent calm light palette and restrained **green** interaction accents; no competing blue active tab indicators.
- [ ] Navbar and company sidebar reflect approved destinations; Account Settings stays global.
- [ ] Clean long-form editor with independently collapsible contextual panel and readable width.
- [ ] Mobile/responsive and keyboard-accessible states; visible focus and reduced motion where needed.
- [ ] Quick Capture, Explore notes, Writing drafts, staged candidates, and committed Thoughts have distinct meanings.
- [ ] AI is explicitly requested; no automatic changes to personal research.
- [ ] Reference sources open via external URLs; no requirement to upload/host raw PDFs.
- [ ] Context Snapshot stays optional within commit; no extra standalone navigation.
- [ ] Screenshots' dates, example financial statements, counts, costs, and source URLs are not treated as verified data.

## Asset provenance and availability

These conceptual images were discussed with the owner in the MY KRAVV V3 design conversation and refined across iterations. **This README does not claim the PNG files are already present in the repository.** After copying each owner-provided original to the filename above, verify existence and record its source filename / SHA-256 and date if precise provenance is needed. Do not silently replace owner-selected images or promote rejected versions such as chatbot Explore, PDF-upload References, old horizontal company tabs, or the standalone Overview-like Context Snapshot.

Product specification consolidation and the Codex implementation prompt are **separate future tasks** and are not included here.
