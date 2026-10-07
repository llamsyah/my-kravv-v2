# MY KRAVV — Core User Journey & Lifecycle

> Status: Draft v0.1  
> Depends on: `01-product-foundation.md`  
> Purpose: Define how a user actually moves through MY KRAVV without forcing one rigid workflow.

---

## 1. Core Idea

MY KRAVV does **not** have one mandatory analysis workflow.

The user may enter from different situations:

- they just discovered a company,
- they already did research,
- they have a messy thought,
- they found new evidence,
- they want to challenge an existing thesis,
- they made an investment decision,
- they want to review an old decision,
- or they simply want to record intuition.

The system should accept the user's current state and organize it from there.

Core rule:

> **The user should not have to understand MY KRAVV's internal structure before they can use it.**

The system adapts to the input.

---

## 2. Universal Entry Point

The safest universal entry point is a freeform input.

Example:

```text
Tulis apa pun yang sedang kamu pikirkan...
```

The user may enter:

```text
Revenue naik 18% tapi margin turun.
Management bilang karena ekspansi.
Aku belum yakin ini temporary atau structural.
```

or:

```text
Cek ASII nanti. Aku penasaran kenapa bisnisnya tahan lama.
```

or:

```text
Aku beli 5 lot karena valuasinya menurutku mulai menarik,
tapi honestly sebagian besar masih intuition.
```

or even:

```text
gue belum ngerti perusahaan ini sebenernya cuannya dari mana
```

All are valid.

The user does not need to select a complicated form first.

---

## 3. What Happens After Freeform Input

After input is submitted, MY KRAVV should perform a lightweight interpretation.

Possible detected intent:

- Raw Thought
- Research Note
- Evidence Update
- Open Question
- Thesis Thought
- Decision Note
- Portfolio Update
- Review / Reflection
- Unknown / Mixed

The detection is **not final authority**.

The user may correct it.

Example:

```text
Detected as:
Research Update

[Correct] [Change type]
```

The purpose is organization, not classification for its own sake.

---

## 4. AI Clarification Rule

AI should only ask a direct question when the meaning cannot be safely understood.

### Ask when:

- the company is unknown,
- the period materially changes meaning,
- the note could refer to two different companies,
- the user refers to something that cannot be resolved from existing memory,
- storing the wrong interpretation would damage the historical record.

Example:

```text
User:
"Margin turun 4%."

AI:
"Ini untuk BBCA yang sedang kamu buka, atau perusahaan lain?"
```

### Do not ask when:

The meaning is clear but incomplete.

Example:

```text
User:
"Margin turun, mungkin karena ekspansi."
```

AI should not immediately ask:

- berapa margin?
- kapan?
- siapa kompetitornya?
- bagaimana moat?
- bagaimana governance?
- apa catalyst?

Instead, it should structure the known content and mark missing context as unknown.

---

## 5. Three Main AI Interaction Modes

### 5.1 Clarify

Used only when needed to understand the user's input.

Behavior:

```text
Input unclear
↓
Ask minimum clarification
↓
Continue processing
```

Goal:

avoid wrong attribution.

---

### 5.2 Suggest

Used when the input is understandable but incomplete.

Behavior:

```text
Understand input
↓
Refine / structure
↓
Show optional gaps
↓
User decides what to explore
```

Example:

```text
You already covered:
- revenue growth
- margin pressure
- management explanation

Possible open areas:
- is margin pressure temporary or structural?
- is competition affecting retention?
```

The user is not forced to answer.

---

### 5.3 Guide

Used when the user explicitly wants help knowing what to do next.

Example:

```text
"aku bingung mulai dari mana"
```

or:

```text
"guide aku analisis fundamental"
```

The AI may then ask progressive questions.

Important:

- one or a few questions at a time,
- based on what is already known,
- no giant checklist,
- no fake completion percentage.

---

## 6. Suggested High-Level Lifecycle

This is a flexible lifecycle, not a wizard.

```text
Capture
↓
Understand
↓
Explore
↓
Build
↓
Challenge
↓
Form Thesis
↓
Lock Snapshot
↓
Decision
↓
Track
↓
Review
↓
Revise
↓
Reflect
```

The user may:

- skip stages,
- stop temporarily,
- return later,
- revisit earlier stages,
- never reach an investment decision.

---

# 7. Stage Details

## 7.1 Capture

Purpose:

preserve what the user is thinking right now.

Input examples:

- idea,
- question,
- observation,
- intuition,
- research result,
- doubt.

Output:

- raw thought stored,
- timestamp stored,
- company linked if known,
- original text preserved.

Important:

Raw input should not be overwritten by AI.

---

## 7.2 Understand

Purpose:

help the user see what their own note actually contains.

Possible AI actions:

- refine wording,
- separate facts from interpretation,
- detect uncertainty,
- extract open questions,
- organize messy research.

Example:

```text
RAW

"Revenue naik terus tapi margin turun.
Management bilang gara-gara ekspansi.
Aku belum yakin temporary atau bukan."
```

Possible structured interpretation:

```text
Evidence:
- Revenue is growing.
- Margin is declining.
- Management attributes the decline to expansion.

Interpretation:
- Margin pressure may be expansion-related.

Uncertainty:
- Temporary vs structural margin pressure remains unclear.
```

User may:

- accept,
- edit,
- ignore,
- partially use the result.

---

## 7.3 Explore

Purpose:

identify what is still unknown.

Possible output:

```text
Open Gap:
Is margin pressure temporary or structural?
```

An Open Gap is a bookmark, not a mandatory task.

Possible states:

```text
OPEN
RESEARCHING
ANSWERED
UNRESOLVED
DISMISSED
```

The user may research outside MY KRAVV and return later.

---

## 7.4 Add Research

The user may paste raw research directly.

Example:

```text
Q3 call:
management said the higher cost came from new branch expansion
and customer acquisition.
labor cost also increased.
```

AI may transform it into:

```text
Evidence:
- Management attributes cost increase partly to expansion.
- Customer acquisition costs increased.
- Labor costs also increased.

Interpretation:
- The margin decline may not be caused by one factor only.

Open Question:
- How much of the cost increase is temporary?
```

The user should not need to manually pick every field.

---

## 7.5 Build Current View

Purpose:

allow a temporary view before a formal thesis exists.

Example:

```text
Current View

I currently believe the business is still growing strongly,
but I do not yet have enough evidence to conclude that margin
pressure is temporary.
```

This state is intentionally provisional.

Possible status:

```text
Exploring
Developing
```

No requirement to finalize.

---

## 7.6 Challenge

Purpose:

test important reasoning.

Challenge should be optional.

AI may identify:

- unsupported assumption,
- evidence mismatch,
- weak causal link,
- contradiction,
- missing alternative explanation,
- confirmation bias,
- excessive confidence.

Example:

```text
Challenge

You are using recurring revenue as evidence of switching cost.
Recurring revenue shows repeat payment, but it does not by itself
prove customers are difficult to leave.
```

User responses:

```text
Defend
Research
Concede
Dismiss
Skip
```

### Defend

User provides additional reasoning/evidence.

### Research

Creates or links an Open Gap.

### Concede

User acknowledges the claim was too strong.

### Dismiss

User considers the challenge not relevant.

### Skip

User does not want to deal with it now.

The AI should not repeatedly raise the same resolved challenge.

---

## 7.7 Form Thesis

Purpose:

capture the user's current best view.

A thesis can be short.

Example:

```text
The company appears to have strong recurring revenue,
but I am not yet convinced that retention comes from a durable moat.
Margin pressure may be temporary, but the evidence is still incomplete.
```

Optional supporting metadata:

```text
Confidence: 65%

Biggest uncertainty:
Switching cost durability

Biggest risk:
Customer concentration

What may change my mind:
Retention declines materially or margin fails to recover.
```

The thesis is owned by the user.

AI may help write it clearly but should not invent conviction.

---

## 7.8 Lock Snapshot

When the user chooses to finalize a thesis version:

```text
Thesis v1
```

the system stores a historical snapshot of:

- final thesis,
- relevant evidence,
- open gaps,
- unresolved assumptions,
- challenge status,
- confidence,
- risk/catalyst notes,
- timestamp.

After locking:

do not silently edit the historical snapshot.

Future changes create:

```text
Thesis v2
Thesis v3
...
```

---

## 7.9 Decision

A thesis does not automatically mean an investment decision.

Possible decision states:

```text
Keep Researching
Watch
Interested
Invest
Add
Reduce
Exit
Avoid
```

A decision may include:

```text
Reason
Linked thesis
Confidence
Decision basis
Optional personal context
```

Example:

```text
Decision:
Watch

Reason:
Business quality looks attractive, but valuation and margin recovery
are still uncertain.

Decision basis:
Evidence-led with moderate intuition.
```

---

## 7.10 Track

Tracking may exist even before real money is involved.

Possible tracked events:

- new quarterly result,
- management change,
- new competitor,
- new regulation,
- thesis-relevant news,
- valuation change,
- user research update.

If the user actually invests:

possible transaction events:

```text
BUY
SELL
ADD
REDUCE
```

with:

- date,
- price,
- lots,
- notes,
- linked decision.

Portfolio tracking is secondary to reasoning tracking.

---

## 7.11 Review

Purpose:

compare old expectations with what actually happened.

Example:

```text
Expected:
Recurring revenue would support margin stability.

Observed:
Revenue remained recurring, but margin declined because
customer acquisition costs increased faster than expected.
```

Possible thesis review states:

```text
INTACT
STRENGTHENED
WEAKENED
PARTIALLY INVALIDATED
INVALIDATED
UNCLEAR
```

Avoid:

```text
RIGHT
WRONG
```

because outcome and reasoning quality are different.

---

## 7.12 Revise

If the user's view changes:

create a new version.

Example:

```text
Thesis v1
↓
New evidence
↓
Thesis v2
```

The system may compare:

- what was added,
- what was removed,
- confidence change,
- assumptions resolved,
- risk changes,
- new uncertainty,
- changed decision.

Reason for revision may include:

```text
New evidence
Previous assumption invalidated
Valuation changed
Risk increased
Management quality changed
Intuition changed
Other
```

---

## 7.13 Reflect

Reflection happens after enough history exists.

Possible questions:

- What assumptions do I often make too early?
- What kinds of evidence usually change my mind?
- When do I revise most often?
- Do I often confuse growth with moat?
- How often do intuition-led decisions get revised?
- Is my raw thinking becoming clearer over time?

Reflection should use historical data.

It should not invent personality traits.

---

# 8. Multiple Valid User Journeys

## Scenario A — Beginner, no idea where to start

```text
Open company
↓
"I don't know what to analyze"
↓
Guided mode
↓
AI asks one useful question
↓
User answers
↓
AI structures
↓
Next guidance
↓
Current view
```

No thesis required.

---

## Scenario B — User already researched outside MY KRAVV

```text
Paste messy research
↓
AI structures it
↓
User approves
↓
AI shows optional gaps
↓
User saves
```

No interview required.

---

## Scenario C — User has one random thought

```text
"Kayaknya management-nya terlalu agresif."
↓
Save RAW
↓
Optional Refine
↓
Store as thought
```

Done.

---

## Scenario D — User wants to test a thesis

```text
Open Thesis v1
↓
Challenge
↓
AI finds one meaningful weakness
↓
User researches
↓
New evidence
↓
Thesis v2
```

---

## Scenario E — User makes an intuition-led decision

```text
Decision:
Invest

Basis:
High intuition, incomplete evidence
↓
Store honestly
↓
Track outcome
↓
Review later
```

The system should not rewrite the decision into a fake rational framework.

---

## Scenario F — User is already experienced

```text
Paste structured analysis
↓
AI detects that structure is already strong
↓
Minimal cleanup
↓
No unnecessary questions
↓
Optional challenge
```

AI should become quieter.

---

# 9. Adaptive Guidance

Default behavior:

```text
Guidance Mode: Adaptive
```

Possible logic:

### Beginner-like usage

If the current analysis has major obvious gaps and the user asks for help:

AI may guide more actively.

### Mature input

If the user already provides:

- clear claim,
- evidence,
- uncertainty,
- risk,

AI should not repeat basic guidance.

### Explicit user control

Future optional control:

```text
More Guidance
Adaptive
Minimal Guidance
```

---

# 10. Open Gaps

An Open Gap is a lightweight unresolved question.

Example:

```text
Open Gap:
Is margin pressure temporary or structural?
```

The gap can be resolved in two ways.

### Direct route

User opens the gap and writes new research.

### Natural route

User later writes a new raw note.

The system detects that it may answer an existing gap.

Example:

```text
"This may relate to:
Is margin pressure temporary or structural?"

[Link]
```

The user should not need to remember the database structure.

---

# 11. What Counts as "Complete"?

MY KRAVV should avoid fake completion scoring.

Do not use:

```text
Analysis 73% complete
```

Instead, show current state:

```text
Exploring
Developing
Thesis Formed
Tracking
Reviewing
```

A company analysis may remain incomplete forever.

That is acceptable.

A successful session may simply mean:

> A previously messy thought is now preserved clearly.

---

# 12. Session Success Examples

A session is successful if the user:

- captured one useful thought,
- clarified one uncertainty,
- added one piece of evidence,
- discovered one meaningful gap,
- rejected one weak assumption,
- created a thesis snapshot,
- recorded why a decision was made,
- reviewed one old belief honestly.

Not every session needs a major output.

---

# 13. Core UX Principle Derived From the Journey

The UI should follow:

```text
Input first
↓
AI interpretation
↓
User control
↓
Structured memory
```

not:

```text
Choose complex workflow
↓
Fill required form
↓
Finish checklist
```

The visible interface should stay simple even if the underlying data model becomes rich.

---

# 14. Lifecycle State Summary

Possible high-level states:

```text
EXPLORING
DEVELOPING
THESIS_FORMED
TRACKING
REVIEWING
ARCHIVED
```

These are descriptive states, not rigid gates.

The user can move backward or forward.

Example:

```text
THESIS_FORMED
↓
new evidence
↓
DEVELOPING
↓
Thesis v2
↓
THESIS_FORMED
```

---

# 15. MVP Journey

For MVP, the journey should be smaller.

```text
Create / Select Company
↓
Write Raw Thought
↓
AI Refine + Structure
↓
User Approve / Edit
↓
Optional AI Challenge
↓
Defend / Research / Concede / Skip
↓
Create Thesis v1
↓
Lock Snapshot
↓
View History
```

Not required for initial MVP:

- portfolio integration,
- transaction automation,
- advanced reflection,
- external market data,
- automatic document ingestion,
- social/publishing,
- semantic retrieval,
- complex guided curriculum.

---

# 16. Design Implications

This document is not the visual design spec, but it creates several constraints:

- home should support continuation + quick capture,
- company workspace should not look like a terminal,
- freeform input should be easy to reach,
- AI should appear contextually rather than as a giant chatbot,
- open gaps should be visible but non-blocking,
- historical versions should be easy to revisit,
- raw/refined/final should remain distinguishable,
- user should never feel trapped in a wizard.

---

# 17. Locked Journey Decisions

Current agreed behavior:

- no single mandatory workflow,
- freeform input is the universal entry path,
- AI asks only when meaning is unclear,
- incomplete analysis produces suggestions, not interrogation,
- guided mode exists for users who want help,
- Open Gaps are optional bookmarks,
- raw research can be pasted directly,
- structure is generated from context,
- challenge is optional,
- AI may say there is no meaningful challenge,
- thesis versions are historical snapshots,
- decision and thesis are separate,
- intuition may be recorded honestly,
- review compares expectation vs reality,
- reflection becomes valuable only after history exists,
- the system becomes quieter as user capability improves.

---

## Next Document

`03-ai-behavior-spec.md`

That document should define:

- exact AI roles,
- when each role is called,
- context rules,
- model knowledge vs KRAVV memory vs external evidence,
- clarification logic,
- challenge behavior,
- structured output expectations,
- provenance rules,
- failure behavior,
- cost-control behavior,
- and what AI must never do.
