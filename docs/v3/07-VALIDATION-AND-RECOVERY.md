# MY KRAVV V3 — Validation and Recovery

Status: **Draft — awaiting owner review**

Date: **20 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). This is a proposed validation contract for later implementation. Cases below are expected evidence, not tests already run or proof of deployed security. Source behavior is described separately in the [architecture evaluation](06-TECHNICAL-ARCHITECTURE.md).

## Product-contract validation matrix

| Area               | Cases to demonstrate                                                                                             | Required result                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Content separation | Save Quick Capture, autosave Explore, edit a draft, mark Bahas nanti, open AI panel                              | Only the intended mutable destination changes; no automatic promotion, Thought version or provider call.                                       |
| Draft recovery     | Multiple company drafts, reload, interrupted/failed save, newer text after an older acknowledgement              | Exact appropriate text recoverable within the agreed persistence scope; no false saved indicator or clearing newer edits.                      |
| Writing approaches | Skip/adapt framework areas, unknown/not applicable, switch approaches after writing                              | No completion/quality gate and no silent loss of authored text; behavior matches owner P5.                                                     |
| Staging            | Deliberate submit, replay/double click, reopen candidate, Buat Draft Baru                                        | Only explicit submission creates active candidate membership; new-draft action stays in Ruang Tulis.                                           |
| Commit             | New Thought/existing Thought version, exact review preview, repeated/ambiguous submission, concurrent edits      | One result per operation, immutable exact recorded content, correct identity/version order and coherent queue exit.                            |
| History/diff       | Multiple Thoughts, earlier committed versions, later draft edits, reference changes, missing optional provenance | Earlier recorded contents remain inspectable and unchanged; comparisons identify actual versions without fabricated context or AI conclusions. |
| Context Snapshot   | Supply all/some/no fields, skip, late edits before commit                                                        | Skipping never blocks commit; supplied context belongs to that exact version, not Overview or an automatic copy of Explore.                    |
| References         | Valid/invalid URL, manual metadata edits, external unavailable URL, open/copy/use in writing                     | No file upload/fetch required; metadata persists, saved link is not labeled verified, safe explicit source navigation.                         |
| AI Review          | Explicit modes, no configuration, unauthorized context, invalid output, edits before/after response              | Only explicit authorized runs send; draft remains intact, reviewed snapshot identified, materially changed drafts show stale results.          |
| Privacy            | Private/emotional Explore/reference notes and commit context absent from ordinary review selection               | No default provider disclosure or operational-log copy; user/parent authorization covers every context item.                                   |
| Usage/budget       | Known/unknown tokens, concurrent requests, bounded repair, warning-only indicator, limit reached                 | Honest token/cost status; reservation/enforcement tested separately from warnings; no invoice-cap claim.                                       |
| Account            | Login/logout then another user; password change/recovery, verified email change, expired/replayed links          | Provider-supported flows, no prior-user data leakage, no fabricated passphrase challenge and no insecure callback bypass.                      |

## Recovery expectations

An autosave acknowledgement must identify the revision actually persisted. Failure or delayed acknowledgement must not erase newer input. Label browser-local recovery separately from confirmed server persistence; do not promise offline or cross-device durability before T2 is resolved. If concurrent edits conflict, preserve recoverable text and explain the conflict instead of silently overwriting a newer version. The exact recovery buffer/retention policy depends on P4/T5.

Staging and commit use distinct operation identities and expected content revisions. Replaying the same operation should recover its known result. A commit success followed by lost HTTP response must not produce a second version or leave a still-actionable duplicate candidate. Queue membership and history must agree after recovery; if completion cannot be determined, show an honest checking/uncertain state with a bounded way to resolve the operation. Do not invent an elaborate background reconciliation product.

Review responses arriving after an edit remain linked to the submitted snapshot and cannot overwrite the editor or be labeled as reviewing newer content. Unknown provider usage/accounting must not be displayed as zero cost or automatically replayed into another paid request. AI failures and exhausted budgets must leave saving, notebook use, reference metadata and owner recording usable.

Session expiry during editing requires safe reauthentication and recovery without exposing text to another account. Logout/login with a different owner must rescope in-memory state, local recovery keys, queries and cached/private content. Expired recovery/email-verification links must fail safely and must not authorize private routes merely because a browser has a token-looking value.

## Security and integrity evidence

Use deterministic tests with synthetic author text and injected provider/database boundaries for preservation, context selection, replay, staleness, pricing uncertainty and rendering. Retain the relevant V2 regression assertions, adapting only those whose semantics change through reviewed V3 contracts.

Later authorized database/integration testing should cover anonymous access, foreign IDs, malformed/missing IDs, ownership/parent mismatches, row-level policies, column/write permissions, atomic commit/queue transitions, unique operation identities, concurrency and deletion restrictions. UI hiding is not a substitute for these controls. Restrict privileged clients to reviewed administration/accounting paths; never expose credentials in client data, rendered errors or logs. Text/links supplied by the owner, sources or AI require safe rendering and safe URL handling.

Live tests require a designated development environment and explicit authorization, disposable synthetic records and verified cleanup. A mock provider does not prove deployed RLS or real-model semantic quality. Real-provider evaluations, if later approved, need a separately bounded request/cost plan; historical smoke-test authorization and this documentation task grant no provider allowance.

## UX and visual evidence

Evaluate [UX states](05-UX-AND-DESIGN-SYSTEM.md) in light and dark mode, with long/empty text, many companies/drafts/versions, narrow layouts, keyboard-only navigation, visible focus, zoom/reflow, screen-reader feedback, reduced motion and phone keyboard/safe-area conditions. Reading width remains controlled when either panel collapses. Diff changes must be understandable without color alone. Review and record can proceed without AI or optional personal context.

Static PNGs demonstrate none of these runtime behaviors. Avoid bulk screenshot matrices in curated reference folders: temporary captures/logs/measurement JSON belong in ignored `.qa/<task>/`; only deliberately selected documented evidence should be promoted.

## Documentation baseline checks

Before handing these drafts to the owner, check local Markdown targets/section anchors, links to all 14 canonical images, file availability/hashes, exact Draft statuses, obsolete active missing-asset claims and Git change scope. Confirm V2 archives, app code, migrations, dependencies and PNG bytes remain untouched. Report actual results separately from this future validation matrix. Implementation can begin only after the relevant decisions and slice are approved, following the [proposed plan](08-IMPLEMENTATION-PLAN.md).
