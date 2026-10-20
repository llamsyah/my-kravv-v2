# MY KRAVV V3 — Product Foundation

Status: **Draft — awaiting owner review**

Date: **20 October 2026 (Asia/Jakarta)**

Authority: [V3 documentation authority](00-V3-INDEX.md). This draft records the owner's current Product & UX Documentation Consolidation brief. Owner-directed intentions below do not constitute acceptance of this specification or implementation authorization.

## Purpose and product philosophy

MY KRAVV is a private, personal investment research and reasoning workspace. It helps the owner capture observations, investigate companies, develop and challenge reasoning, record conclusions, and inspect how those conclusions evolve. The owner retains judgment and decision ownership. The product is not an automatic trading assistant, price-prediction service, market-data terminal, or generic AI chatbot.

The useful outcome is recoverable work and an understandable record of reasoning, including uncertainty. Templates assist thinking; they do not certify quality. AI supplies questions and critique; it does not establish truth or silently become the author. Flexible entry paths matter: an informal observation need not become formal analysis, and formal writing need not wait for AI approval.

Distinct content types protect this flexibility. A fast capture, a personal notebook entry, an editable analysis, an intentionally staged candidate, and a committed Thought version have different meanings. Saving one must not silently create another. See the [workflow contract](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) and [conceptual domain](04-DOMAIN-AND-PROVENANCE.md).

## Owner-directed initial MVP boundary

| Area              | Intended useful capability                                                                                                                                                             | Boundary                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Beranda           | Quick Capture to a separate Penampungan inbox; resume writing, recent captures, company access/activity                                                                                | Capturing does not automatically create an Explore note, writing draft, candidate, or committed Thought.             |
| Company workspace | Overview, Ruang Tulis, Pemikiran, Explore, Referensi in a contextual collapsible sidebar                                                                                               | Account Settings is global; company switching must scale.                                                            |
| Explore           | Multiple editable, autosaved personal notes per company, optional Bahas nanti, explicit reuse as writing material                                                                      | No chatbot or automatic AI disclosure.                                                                               |
| Ruang Tulis       | Multiple recoverable drafts per company; Terpandu, Pendamping, Kosong in one writing system                                                                                            | Six-area guidance is optional; autosave is not a Thought commit.                                                     |
| AI Review         | Explicit Clarify, Challenge and Gap Check against an identified draft snapshot                                                                                                         | Critique/proposal, no silent rewriting, mandatory AI gate, live typing calls, scraping or claimed live verification. |
| Pemikiran         | Explicit candidate queue, Tinjau & Rekam, immutable committed versions, history/detail and comparison                                                                                  | Draft revisions and AI sessions are not committed versions.                                                          |
| Context Snapshot  | Optional private reflection inside Tinjau & Rekam, associated with that committed version                                                                                              | Skippable; no separate page, diagnosis, bias score or automatic AI analysis.                                         |
| Referensi         | Company-scoped external-source catalog with manual metadata and explicit writing reuse                                                                                                 | No required uploads, hosted PDFs, object storage, or automatic fetching.                                             |
| Account           | Existing identity, email/password login, logout/login with another account, password change/recovery, verified email change, light/dark preference, minimal AI usage/budget visibility | No additional security-passphrase challenge or account-switching infrastructure.                                     |

The accepted visual direction is Hybrid C: calm, premium modern SaaS, light-first with deliberate dark mode, neutral reading surfaces and restrained green accents. The [visual decision ledger](DESIGN-DISCOVERY.md) distinguishes source images from requirements. Fourteen committed conceptual images exist; they are not implemented screens or blanket approval of their controls.

## Deliberate exclusions

Initial MVP excludes custom template management, a standalone general AI chat product, automated trading, predictions, market feeds, source scraping, internal document hosting, collaboration, unrelated notification systems, extensive preferences, and incidental global Kalender/Explore destinations. An image icon or toolbar is not authority for attachments, uploads, export, comments, or a new workflow.

Existing V2 Refine is historical technical evidence. The new AI Review priorities do not require carrying Refine into primary V3 Company navigation. No V2 roadmap, data model, visual style or earlier provider authorization is inherited as a V3 implementation decision.

## Success criteria for owner review

The proposed MVP succeeds when the owner can save and resume private work, distinguish informal material from committed conclusions, deliberately record and compare versions, use external references without storing source files, and request bounded AI critique without losing ownership or control of cost. Manual workflows remain usable when AI is unavailable. Acceptance should be supported by the [validation and recovery cases](07-VALIDATION-AND-RECOVERY.md), not by visual resemblance alone.

## Open Decisions — owner product choices

These decisions remain open; the alternatives are questions, not selected defaults. Technical choices are tracked separately in [architecture](06-TECHNICAL-ARCHITECTURE.md#open-decisions--technical-questions).

| ID  | Question and alternatives                                                                                                                                                                 | Implication / dependent area                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P1  | Can Penampungan items be unassigned to a company, or must capture select one? Which explicit actions copy/link/move an item into writing or Explore, and when is it considered processed? | Entry friction, ownership context and inbox lifecycle; no automatic promotion is allowed either way.       |
| P2  | Does a staged candidate track the editable draft, or freeze a submitted revision until explicitly resubmitted? How is withdrawal handled?                                                 | Queue accuracy and edit-after-staging behavior. Commit must always show the exact version being recorded.  |
| P3  | How does the owner choose new Thought versus new version of an existing Thought? Is a title/commit rationale required or optional?                                                        | Thought boundaries, meaningful history and commit validation; no template-based automatic splitting.       |
| P4  | What archive/delete/correction rules apply to captures, notes, drafts, candidates, reference metadata and committed records?                                                              | Privacy and historical integrity. V2's permanent-deletion behavior does not settle V3 policy.              |
| P5  | What happens when switching writing approach after text exists, especially adding/removing an outline?                                                                                    | Editor interaction and preservation expectations; no mode switch may silently lose authored content.       |
| P6  | Are contextual AI Review follow-ups included initially or deferred? Which explicitly selected extra materials may be included?                                                            | Interaction scope and consent; neither permits a separate chatbot or default inclusion of private context. |
| P7  | Which reference fields are required, what source-type vocabulary is sufficient, and does writing reuse link metadata, copy selected notes, or both?                                       | Form validation and source provenance without file ingestion.                                              |
| P8  | How should optional confidence/reflection be expressed: free text, qualitative choices, or another optional treatment? Is commit-time context later correctable?                          | Skippable capture and historical meaning; no mandatory numerical score.                                    |

Questions should be resolved only where they block an implementation slice. The [proposed implementation sequence](08-IMPLEMENTATION-PLAN.md) is planning for review, not permission to start.
