# MY KRAVV V3 — AI Behavior and Ownership

Status: **Draft — awaiting owner review**

Date: **20 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). This document defines proposed product contracts for AI Review. It does not activate a provider, choose a model, change a prompt or authorize paid requests.

## Role and human authority

AI is a critical-thinking partner within Ruang Tulis. Its outputs are critiques, questions or proposals, not established truth, a recommendation to trade, an approval verdict, or a replacement for the owner's writing. The owner decides what to use. AI must not silently rewrite, overwrite or commit authored text. Any incorporation is a deliberate author edit; how that edit is offered remains a UX detail.

| Priority mode | Intended help                                                                   | Must preserve                                                                                            |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Clarify       | Ask about unclear meaning, structure, assumptions or missing reasoning          | Personal perspective, uncertainty and the difference between unclear wording and an unsupported premise. |
| Challenge     | Offer counterarguments, alternative explanations and devil's-advocate questions | Proportionality and attribution; invented facts cannot serve as rebuttal evidence.                       |
| Gap Check     | Identify missing information, unsupported conclusions or verification needs     | Unknown/not examined versus false; a gap is not proof of error.                                          |

These modes require V3-specific input/output/context contracts. The V2 registry implements only Refine; a dormant CHALLENGE enum is not an implemented V3 review mode. Reuse infrastructure selectively under the [architecture evaluation](06-TECHNICAL-ARCHITECTURE.md), rather than relabeling a wording-refinement prompt.

## Explicit invocation and snapshot association

- Only the owner's explicit run action initiates a review. Panel opening, page loading, typing, autosave, note marking, staging, comparison and commit do not initiate provider requests.
- A request identifies the draft content/revision being reviewed, selected mode and intentionally included material. The result remains associated with that snapshot, even if the live draft changes before the response arrives.
- Results become visibly **stale** when material draft changes occur. Never present an earlier critique as a review of newer content. Stale results may remain readable with their reviewed revision/time; do not silently rerun them.
- The definition of material change is [technical question T4](06-TECHNICAL-ARCHITECTURE.md#open-decisions--technical-questions). A conservative revision-based indicator is a recommendation until that rule is reviewed, not an automatic new feature.
- AI review is optional. The owner can record a Thought without generating, resolving, agreeing with, or obtaining a passing review.

Contextual user-initiated follow-up questions may be considered within a bounded review context. Their inclusion in initial MVP is [Open Decision P6](01-PRODUCT-FOUNDATION.md#open-decisions--owner-product-choices). A message box in image 06 does not approve a separate general chatbot, unlimited conversation history or automatic follow-up calls.

## Context, consent and provenance

Authorize selected content on the server with the verified user's identity and parent company/draft relationships. Send the minimum bounded material needed for the chosen review; do not implicitly sweep the whole company, inbox, notebook or reference library into a request. Distinguish author text, manually selected source material, stored metadata, AI hypotheses and verified facts. A saved URL or a model assertion is not evidence of verification.

Private/emotional Explore content, reference private notes and optional commit-time Context Snapshot are excluded from AI context by default. Deliberate reuse in writing does not grant blanket permission for unrelated personal notes. If a future explicitly approved workflow includes sensitive extra material, explain what would be sent and obtain a specific selection/consent; this draft does not introduce default personal-context analysis.

No automatic source scraping, PDF retrieval, live financial-data lookup or verified-market-data claim is authorized. Opening a URL is external navigation, not ingestion. External text manually supplied as review material must be treated as untrusted content rather than instructions, with provenance labels and ownership checks. Do not fabricate citations, source contents, dates or missing original context.

Retain enough bounded provenance to identify the reviewed snapshot, mode, result, time and actual provider/model/contract versions where available. Do not infer old AI involvement or missing source history from similarity of wording. Review retention and storage are T5; minimize private prompt/response duplication and keep personal research out of operational logs.

## Cost and failure boundaries

Explicit calls reduce background spend; bounded context and output control request size. Neither makes calls free or proves provider billing limits. Show input/output token usage when reported; unknown usage stays unknown. A cost estimate depends on the actual model, versioned rates and currency conversion, and is distinct from a provider invoice. Do not publish historical rates or screenshot amounts as current facts.

A budget warning informs; an enforced spending limit must be checked on the server before transmission, including concurrent calls, reserved maximum usage and bounded repair attempts. V2 has reservation/accounting logic worth evaluating, but its configured estimate-based controls are not a guarantee about a V3 deployment or actual provider invoices. V3 models, rates, budgets and period boundaries remain T6.

When authorization/configuration/budget checks fail, do not send. Provider unavailability or invalid output leaves the draft and manual workflows usable. Avoid hidden retry loops. A schema repair, if later approved, consumes an explicitly bounded and accounted attempt. Timeouts/unknown usage retain an honest pending or uncertain state; no automatic repeat that could charge twice. A double click or replay of the same review operation should not create duplicate paid requests. Detailed cases belong to [validation and recovery](07-VALIDATION-AND-RECOVERY.md).

Screenshot usage totals, review counts, status badges and review conclusions are illustrative. No psychological diagnosis, emotional-risk score, bias score or AI approval gate is part of these modes.
