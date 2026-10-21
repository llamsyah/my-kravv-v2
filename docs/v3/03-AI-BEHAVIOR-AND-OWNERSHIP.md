# MY KRAVV V3 — AI Behavior and Ownership

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). Revision 3 preserves settled P6 and incorporates T4 numeric saved revisions, T5 bounded persistent draft reviews and T6 server budgets/one configured model. The document remains Draft; no provider, model, prompt change or paid request is authorized here.

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
- Settled T4 uses a monotonically advancing numeric saved content revision. Local unsaved edits show differing-content feedback immediately; a review of an older saved revision stays stale. Exact no-op saves do not advance content revision; guidance-only changes do not stale unchanged text. Local editor generation, saved draft revision, reviewed revision and committed Thought version number have different meanings. See the [save protocol](06-TECHNICAL-ARCHITECTURE.md#draft-save-and-recovery-protocol).
- AI review is optional. The owner can record a Thought without generating, resolving, agreeing with, or obtaining a passing review.

**Manual contextual follow-ups are included by settled P6.** After an initial result, the owner may deliberately send a question in that review context. Each send is a separately authorized, usage-accounted provider operation with bounded selected context/conversation, not a standalone generic chatbot or unlimited chat-history feature.

If the draft has changed, show the earlier snapshot and stale state before continuing. The owner can explicitly continue discussing that identified older review, or explicitly refresh/review the current draft. Refresh must disclose the new outgoing snapshot/materials and its provider request; continuing must not silently substitute new text or imply that an old result evaluates it. Bound conversation input, output and retention under T5/T6. A follow-up may include bounded relevant history from this same review as disclosed outgoing context; do not secretly replay unrelated/private conversations or keep an unlimited discussion archive.

## Context, consent and provenance

Authorize selected content on the server with the verified user's identity and parent company/draft relationships. The **active draft is primary review material**; additional Explore material or Reference metadata/specific private notes must be deliberately selected by the owner. Before every initial/follow-up send, make the outgoing draft snapshot, additional selections and bounded discussion context understandable. Do not implicitly sweep the company, inbox, notebook or catalog into a request. Distinguish author text, selected material, metadata, AI hypotheses and verified facts; a saved URL or model assertion is not evidence of verification.

Private/emotional Explore notes, unselected Reference private notes, other-company data and Context Snapshot are not automatically included. Selecting a Reference's title/URL is not permission to send its unselected private notes. Opening a note or flagging Bahas nanti is not context selection.

**Personal information copied into the actual selected draft is part of that draft and will be sent when the owner deliberately reviews it.** The interaction boundary must say this clearly; do not imply automatic redaction because the text originated in Explore, private notes or an earlier reflection. This inclusion of the selected draft does not authorize hidden retrieval of its original note, unrelated private material or a stored Context Snapshot. The owner may remove text or revise explicit selections before sending; no separate psychological assessment is introduced.

No automatic source scraping, PDF retrieval, live financial-data lookup or verified-market-data claim is authorized. Opening a URL is external navigation, not ingestion. External text manually supplied as review material must be treated as untrusted content rather than instructions, with provenance labels and ownership checks. Do not fabricate citations, source contents, dates or missing original context.

Settled T5 requires **bounded persistent sessions associated with the owned draft**, reopenable after closing the workspace. Preserve exact disclosed snapshot/material values, mode, saved revision, result, bounded manual discussion and actual provider/model/prompt/contract versions where available. Reopening is a read, never a provider call. Do not infer old AI involvement or source history from similar wording. Store private context in the authorized session only, not operational logs/accounting. Delete sessions/messages with the permanently deleted draft; a late response cannot resurrect them. Review history is separate from committed history and is not copied into a Thought automatically.

The single [retention and context bounds table](06-TECHNICAL-ARCHITECTURE.md#recommended-mvp-bounds--requiring-review) proposes session/message capacity, disclosed follow-up range and expiry for technical receipts/recovery. Every number is a recommendation requiring review. At capacity, require deliberate replacement of an identified completed idle session before a new review; never silently evict current/uncertain work. No separate archive-management UI, automatic summarizer or unlimited chat log is proposed. An old-session follow-up sends its existing disclosed snapshot and bounded relevant discussion; new materials/current content require an explicit refreshed context preview.

## Cost and failure boundaries

Explicit calls reduce background spend; bounded context and output control request size. **Initial reviews, follow-ups and explicit refreshes all consume provider usage**, including any retained discussion context in each request. None is assumed free. Show input/output tokens when reported; unknown usage stays unknown. Model-dependent estimated costs require versioned rates/FX and are distinct from provider invoices. Do not publish historical rates or screenshot amounts as current facts.

A budget warning informs; settled T6 also requires **server-enforced monthly budget limits** configured by the owner. Reserve conservatively before transmission under an owner-level lock, including concurrent calls; deny when insufficient budget remains. Use one server-configured active model for Clarify/Challenge/Gap Check, with reviewed mode-specific instructions, no Settings model picker and server-only credentials. V2 reservation/accounting is a reuse candidate, not proof of V3 deployment. [Architecture](06-TECHNICAL-ARCHITECTURE.md#ai-budget-dispatch-and-reconciliation) defines reservation, known/unknown usage, late settlement, period boundaries, budget edits and frozen rate/FX handling. Exact timezone, warning thresholds, request caps and model/provider/rates still need validation; no current price, FX rate or provider allowance is asserted.

When authorization/configuration/budget checks fail, do not send. Provider unavailability or invalid output leaves the draft and manual workflows usable. Avoid hidden retry loops. Any later-approved schema-repair request must honor P6's deliberate-action requirement and consume a bounded, accounted attempt; V2 repair behavior is not automatic V3 approval. Timeouts/unknown usage retain an honest pending or uncertain state; no automatic repeat that could charge twice. A double click or replay of the same review operation should not create duplicate paid requests. Detailed cases belong to [validation and recovery](07-VALIDATION-AND-RECOVERY.md).

Screenshot usage totals, review counts, status badges and review conclusions are illustrative. No psychological diagnosis, emotional-risk score, bias score or AI approval gate is part of these modes.

## Revision 3 execution recommendation

Recommend one transmission per explicit action and **no automatic schema repair** in initial V3. Validate bounded structured review points/questions and uncertainty rather than a replacement document or verdict. Each follow-up and explicit refresh is a separate operation with a stable deduplicated identity. Reusing that identity retrieves known status/result and cannot authorize another paid send. STARTED/unknown operations retain honest uncertainty and conservative holds; time alone is not evidence of zero cost or permission to retry. Provider exactly-once execution cannot be promised after crashes/timeouts.

Review snapshots are saved revisions, never silently rebuilt from a changed draft. Authorize and freeze exact selected source values before transmission; selected/unselected private-note fields are distinct. A response arriving after the user changes guidance/mode/draft remains with its original session and cannot replace current editor content or masquerade as the new mode's result. Failures, deletion, capacity limits and exhausted budget leave manual writing, save, References and Thought recording useful. All implementation and paid evaluation remain separately unauthorized by this Draft.
