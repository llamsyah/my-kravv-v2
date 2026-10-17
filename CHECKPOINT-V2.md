# MY KRAVV V2 — checkpoint before moving to V3

Date: **17 October 2026 (Asia/Jakarta)**.

V2 is left at the **Milestone 5.5 Phase 4B** implementation. Further development is directed toward V3 at the user's request. This checkpoint records the local state and references to retain; it does not create a commit, tag, database backup, deployment, or V3 implementation.

## Git state

- Branch: `main`.
- HEAD: `6a80f47b87ac9bbb20259e93abafd2b0eb0aa65d` — `milestone 5.5 phase 1-3`.
- Before checkpoint documentation: **370 changed files were staged**, comprising 351 new files and 19 modified files. There were no unstaged changes or untracked files at that initial inspection.
- Those Phase 4A/4B changes are **not included in HEAD**. Checking out or cloning HEAD alone does not reproduce this V2 state.
- Existing code staging was preserved. During the subsequent cleanup, only index entries for removed QA artifacts were removed; artifacts already present in HEAD are recorded as staged deletions. Documentation and runner/ignore changes remain unstaged/untracked for user review.
- The [local-state manifest](docs/checkpoints/2026-10-17-v2-state.json) records the status, path, and SHA-256 of the original 370 changed files, together with HEAD identity and the index hash. It contains no file contents or credentials and is not a backup capable of restoring files by itself.

Do not reset, overwrite, or delete V2 source files when preparing V3. The QA cleanup explicitly requested by the user is recorded below. The original manifest is a pre-cleanup inventory; QA paths listed there do not imply that those files are still retained. Source files and unrelated staging remain preserved.

## QA output cleanup and file classification

| Category                                                            | Checkpoint decision                                                                                  |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Essential `src/` code, package/build configuration, and lockfile    | Retained; application behavior unchanged                                                             |
| Product documentation, blueprint, and implementation notes          | Retained; links to removed QA output replaced with retention notes                                   |
| Eight Supabase migrations                                           | Retained intact; no remote database changes                                                          |
| Deterministic/live tests, mock helpers, and fixtures                | Retained; only the output destinations of two screenshot runners moved to `.qa/`                     |
| Original references in `public/visual-references/`                  | All assets and the reference guide retained intact                                                   |
| Design prototypes in `design/milestone-5.5/`                        | HTML/CSS/generator/viewer, SVG/fonts/licenses, and 23 reference renders retained intact              |
| Selected application visual evidence                                | 13 desktop/mobile and important version-state images, listed in the [visual index](design/README.md) |
| Repetitive QA screenshots, browser logs, and temporary measurements | 621 artifacts removed, including 514 images, 106 JSON files, and one QA status snapshot              |

The removal freed **61,959,478 bytes, approximately 59.09 MiB**, from the working tree. The `design` directory decreased from approximately **63.89 MiB to 4.8 MiB**. Detailed final figures and SHA-256 hashes of selected images are recorded in the [cleanup manifest](docs/checkpoints/2026-10-17-v2-cleanup.json).

**302 previously committed artifacts** were removed from the index/working tree, and **319 newly staged artifacts** were removed from the index and deleted. Commit history was not changed; older images may still exist in `.git`. This reduces checkout/working-tree copy size, but does not guarantee a smaller clone that includes the full history. No history rewrite, garbage collection, commit, or push was performed.

New QA output goes into `.qa/<task>/`, which Git ignores. Former milestone capture locations have specific ignore rules, with exceptions only for deliberately retained application evidence. There are no blanket ignore rules for source, migrations, tests, product JSON, or original references. See the [retention policy and compact gallery](design/README.md).

## Implementation left in V2

| Area                                          | Latest state                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Foundation, authentication, and private shell | Next.js/React/TypeScript, Supabase Auth, ownership checks, and RLS                                                                 |
| Company                                       | Listing, metadata, workspace, archiving, and deletion with existing safeguards                                                     |
| Pemikiran (Thoughts)                          | Original-text capture, local draft/recovery, idempotency, pagination, and access to original wording                               |
| AI infrastructure                             | Server-only gateway, provider routing, output validation, AI Runs, and budget reservation/settlement                               |
| Refine                                        | Explicit generation, proposals, edit/accept/reject, history, and duplicate-request safeguards                                      |
| Phase 4A                                      | Persistent ORIGINAL or exact previously accepted refinement display choice; owned reading projection                               |
| Phase 4B                                      | State-driven comparison and decisions, independent display choice, explicit preview, compact version trail, and responsive layouts |

Phase 4A and its visual polishing were approved. **Phase 4B was implemented and tested, but final visual approval has not been recorded**. Moving to V3 does not automatically mean that all of Milestone 5.5 or subsequent phases are complete or approved.

## Key references

- [Approved UX blueprint](docs/15-milestone-5.5-ux-blueprint.md).
- [Refine workspace notes](docs/19-milestone-5.5-refine-workspace-notes.md).
- [Phase 4A: data and display contracts](docs/20-milestone-5.5-phase-4a-notes.md).
- [Phase 4A: visual polish](docs/21-milestone-5.5-phase-4a-visual-polish.md).
- [Phase 4B: implementation report, UI rules, and limitations](docs/22-milestone-5.5-phase-4b-notes.md).
- [Selected visual evidence and retention policy](design/README.md), with the [Phase 4B index](design/milestone-5.5-phase-4b/README.md). The original report's 115 captures describe historical testing, not the number of images still retained.
- [Refine foundation and semantic evaluation](docs/14-milestone-5-implementation-notes.md).
- [AI infrastructure and accounting](docs/13-milestone-4-implementation-notes.md).

Status sections in older documents describe the stage when they were written. Use this checkpoint and the latest implementation reports to determine the V2 boundary, rather than older “next milestone” instructions.

## Data and configuration

Eight migrations are stored in `supabase/migrations/`, from `20261007000100_user_settings_and_rls.sql` through `20261009000200_display_conflict_response.sql`. The final two implement display preferences and conflict responses. Their application to development was confirmed and verified during earlier work; this checkpoint does not re-audit the remote database, apply migrations, or transfer data.

`.env.local` remains local and ignored by Git. Do not place credentials in the checkpoint or automatically copy them to V3. V3 configuration, the target Supabase project, migrations/data transfer, models, pricing/FX, and budgets must be explicitly determined during V3 work. V3 has not been created or configured through this checkpoint.

Previous Groq smoke-test/evaluation authorizations have been used. This checkpoint grants no new authorization for provider requests. Historical pricing/FX and earlier results do not confirm provider conditions on 17 October 2026.

## Latest validation and limitations

The following results come from the **Phase 4B report dated 12 October 2026**, rather than a rerun on the checkpoint date:

- Lint, typecheck, formatting, and production build passed.
- **89** deterministic tests passed.
- **62** database/HTTP checks using mock providers passed; **11** display checks were repeated after the final correction and passed.
- Browser QA covered 1440, 768, 390, and 320 CSS pixels with 115 screenshots; no horizontal overflow was measured.
- Proposal acceptance did not change display preference; preview did not save automatically; revision conflicts and archived access were tested.
- Original text and the mock AI Run count were preserved; fixture cleanup was recorded in the earlier report.

Native browser zoom at 100%/80%, physical-device keyboard/safe-area behavior, and screen-reader use still require manual checks. A fully JavaScript-disabled development runtime remained at loading; the document fallback without external client chunks was checked, but that does not establish whole-application operation without JavaScript. These limitations remain open.

The initial checkpoint added documentation only. Subsequent cleanup also updated file retention, links, ignore rules, and QA runner output locations. The following checks were **rerun on 17 October 2026 after cleanup**, separately from the historical results above:

| Check                                                                  | Result                                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| ESLint with zero warnings, Next type generation/TypeScript, formatting | Passed                                                                                       |
| Deterministic tests                                                    | 89 passed, 0 failed                                                                          |
| Production build                                                       | Passed                                                                                       |
| Syntax of both screenshot runners                                      | Passed; only output locations changed                                                        |
| Local Markdown/HTML/CSS links                                          | 386 targets checked; none broken                                                             |
| New output ignores / visibility of source and selected evidence        | 7 output patterns and 19 example files checked; correct                                      |
| File and index preservation                                            | 212 essential source/assets unchanged; all index entries outside removed artifacts unchanged |
| HEAD and Git history                                                   | HEAD unchanged; no commit, tag, or rewrite                                                   |

Implementation notes were explicitly formatted because the main formatting check excludes `docs/`. No remote database or browser tests were rerun, and no AI request, billing change, migration, or V3 creation occurred; application behavior was unchanged by this cleanup task.

## Principles to carry forward as V3 references

1. User originals remain intact; AI proposals and user edits are separate data.
2. Accept/reject is a review decision. The displayed reading choice is an independent persistent decision, including when a SUPERSEDED version is selected.
3. Preview does not save. Generation, acceptance/rejection, and display saves occur only through explicit actions with ownership checks.
4. Refine must not conflate uncertainty, unexamined evidence, doubt, and lack of verification; personal perspective and conversational wording must remain intact.
5. Pemikiran focuses on writing/reading; Refine focuses on comparison/review. Both share Company identity without becoming duplicate lists.
6. RLS, draft/recovery, idempotency, bounded pagination, AI Runs, and budget guards must remain testable; do not weaken them to simplify the transition.

These are references, not an automatic decision that V3 must copy the entire V2 implementation. V3 scope and architecture have not been established through this task.

## Not implemented at this V2 boundary

- Further navigation smoothness work and phases after Phase 4B.
- Referensi (References): the future link-only direction is approved, but no functional feature/route exists. It excludes uploads, scraping, fetching, and automatic AI summaries.
- Clarify/Challenge, Portfolio, and Phase 6.
- Final Phase 4B visual approval and the manual checks listed above.

## Suggested commit message — not executed

The following message fits the full staged Phase 4A/4B changes **together with checkpoint documentation if the user later chooses to include it**:

```text
feat: checkpoint V2 display preferences and Refine workspace before V3

- persist explicit Thought display choices independently of Refine acceptance
- polish Overview, Pemikiran and state-driven Refine review/version flows
- retain ownership, immutable originals and AI budget safeguards
- curate essential visual references and remove disposable browser QA artifacts
- isolate future QA output and document the V2 handoff boundary for V3
```

No commit, push, tag, or V3 development was performed. Index changes were limited to removing the QA artifacts explicitly requested for deletion; other code staging remained intact. The commit message above is only a suggestion and was not executed.
