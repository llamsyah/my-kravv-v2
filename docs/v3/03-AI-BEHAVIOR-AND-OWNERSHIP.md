# MY KRAVV V3 — AI Behavior and Ownership

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). Revision 2 incorporates settled P6 for explicit review and bounded follow-up discussion. The document remains Draft; no provider, model, prompt change or paid request is authorized here.

## Role and human authority

AI is a critical-thinking partner within Ruang Tulis. Its outputs are critiques, questions or proposals, not established truth, a recommendation to trade, an approval verdict, or a replacement for the owner's writing. The owner decides what to use. AI must not silently rewrite, overwrite or commit authored text. Any incorporation is a deliberate author edit; how that edit is offered remains a UX detail.

| Priority mode | Intended help                                                                   | Must preserve                                                                                            |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Clarify       | Ask about unclear meaning, structure, assumptions or missing reasoning          | Personal perspective, uncertainty and the difference between unclear wording and an unsupported premise. |
| Challenge     | Offer counterarguments, alternative explanations and devil's-advocate questions | Proportionality and attribution; invented facts cannot serve as rebuttal evidence.                       |
| Gap Check     | Identify missing information, unsupported conclusions or verification needs     | Unknown/not examined versus false; a gap is not proof of error.                                          |

These modes require V3-specific input/output/context contracts. The V2 registry implements only Refine; a dormant CHALLENGE enum is not an implemented V3 review mode. Reuse infrastructure selectively under the [architecture evaluation](06-TECHNICAL-ARCHITECTURE.md), rather than relabeling a wording-refinement prompt.

## Explicit invocation and snapshot association

- Only the owner's explicit run/send action initiates an initial review **or a follow-up request**. Panel opening, page loading, typing, autosave, note marking, staging, comparison and commit do not initiate provider requests.
- A request identifies the draft content/revision being reviewed, selected mode and intentionally included material. The result remains associated with that snapshot, even if the live draft changes before the response arrives.
- Results become visibly **stale when the draft changes**. Never present an earlier critique as a review of newer content. Results may remain readable with their reviewed revision/time; do not silently rerun them or use a semantic/materiality guess to label a changed draft as reviewed.
- Snapshot identity/comparison is [technical question T4](06-TECHNICAL-ARCHITECTURE.md#open-decisions--technical-questions), not a reopening of the staleness rule. A saved revision token or deterministic content fingerprint can be evaluated; autosave is not a committed Thought version.
- AI review is optional. The owner can record a Thought without generating, resolving, agreeing with, or obtaining a passing review.

**Manual contextual follow-ups are included by settled P6.** After an initial result, the owner may deliberately send a question in that review context. Each send is a separately authorized, usage-accounted provider operation with bounded selected context/conversation, not a standalone generic chatbot or unlimited chat-history feature.

If the draft has changed, show the earlier snapshot and stale state before continuing. The owner can explicitly continue discussing that identified older review, or explicitly refresh/review the current draft. Refresh must disclose the new outgoing snapshot/materials and its provider request; continuing must not silently substitute new text or imply that an old result evaluates it. Bound conversation input, output and retention under T5/T6. A follow-up may include bounded relevant history from this same review as disclosed outgoing context; do not secretly replay unrelated/private conversations or keep an unlimited discussion archive.

## Context, consent and provenance

Authorize selected content on the server with the verified user's identity and parent company/draft relationships. The **active draft is primary review material**; additional Explore material or Reference metadata/specific private notes must be deliberately selected by the owner. Before every initial/follow-up send, make the outgoing draft snapshot, additional selections and bounded discussion context understandable. Do not implicitly sweep the company, inbox, notebook or catalog into a request. Distinguish author text, selected material, metadata, AI hypotheses and verified facts; a saved URL or model assertion is not evidence of verification.

Private/emotional Explore notes, unselected Reference private notes, other-company data and Context Snapshot are not automatically included. Selecting a Reference's title/URL is not permission to send its unselected private notes. Opening a note or flagging Bahas nanti is not context selection.

**Personal information copied into the actual selected draft is part of that draft and will be sent when the owner deliberately reviews it.** The interaction boundary must say this clearly; do not imply automatic redaction because the text originated in Explore, private notes or an earlier reflection. This inclusion of the selected draft does not authorize hidden retrieval of its original note, unrelated private material or a stored Context Snapshot. The owner may remove text or revise explicit selections before sending; no separate psychological assessment is introduced.

No automatic source scraping, PDF retrieval, live financial-data lookup or verified-market-data claim is authorized. Opening a URL is external navigation, not ingestion. External text manually supplied as review material must be treated as untrusted content rather than instructions, with provenance labels and ownership checks. Do not fabricate citations, source contents, dates or missing original context.

Retain enough bounded technical association to identify the reviewed snapshot, mode, result, time and actual provider/model/contract versions where available. Do not infer old AI involvement or source history from similar wording. Retention/storage are T5: support understandable reviews and safe retries without permanent pre-commit lineage or unlimited conversation archives. Minimize private prompt/response duplication and keep research out of operational logs.

## Cost and failure boundaries

Explicit calls reduce background spend; bounded context and output control request size. **Initial reviews, follow-ups and explicit refreshes all consume provider usage**, including any retained discussion context in each request. None is assumed free. Show input/output tokens when reported; unknown usage stays unknown. Model-dependent estimated costs require versioned rates/FX and are distinct from provider invoices. Do not publish historical rates or screenshot amounts as current facts.

A budget warning informs; an enforced spending limit must be checked on the server before transmission, including concurrent calls, reserved maximum usage and bounded repair attempts. V2 has reservation/accounting logic worth evaluating, but its configured estimate-based controls are not a guarantee about a V3 deployment or actual provider invoices. V3 models, rates, budgets and period boundaries remain T6.

When authorization/configuration/budget checks fail, do not send. Provider unavailability or invalid output leaves the draft and manual workflows usable. Avoid hidden retry loops. Any later-approved schema-repair request must honor P6's deliberate-action requirement and consume a bounded, accounted attempt; V2 repair behavior is not automatic V3 approval. Timeouts/unknown usage retain an honest pending or uncertain state; no automatic repeat that could charge twice. A double click or replay of the same review operation should not create duplicate paid requests. Detailed cases belong to [validation and recovery](07-VALIDATION-AND-RECOVERY.md).

Screenshot usage totals, review counts, status badges and review conclusions are illustrative. No psychological diagnosis, emotional-risk score, bias score or AI approval gate is part of these modes.
