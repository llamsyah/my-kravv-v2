# MY KRAVV — Product Foundation

> Status: Draft v0.1  
> Purpose: Internal project documentation for humans + AI coding assistants  
> Product family: KRAVVIENT / KRAVV ecosystem

---

## 1. Product Definition

**MY KRAVV** is a private personal investment reasoning workspace.

It is designed to help a user:

- capture raw thoughts about a company,
- turn messy thinking into clearer writing,
- structure reasoning without forcing rigid forms,
- challenge assumptions and weak arguments,
- track how a thesis changes over time,
- record decisions and their basis,
- learn from past reasoning,
- and gradually become less dependent on AI as their own thinking improves.

MY KRAVV is not primarily a stock terminal, trading app, AI stock picker, or portfolio tracker.

Its core value is:

> **Preserving how a person thought, why they thought it, what changed their mind, and how their judgment evolved over time.**

---

## 2. Origin

MY KRAVV is the original root of the KRAVV identity.

The name **KRAVV** originally came from:

**Kodrat Ratu Alamsyah Valuation Value**

The earliest MY KRAVV concept was created as a personal stock valuation and thesis archive because PDF-based analysis felt messy, difficult to track, and inconvenient to revisit.

The product later evolved from:

**valuation archive**

into:

**personal investment reasoning system**

The meaning of KRAVV can evolve beyond the original acronym, but its history should remain part of the project story.

---

## 3. Core User Problem

The main user already has thoughts, observations, research results, doubts, and intuition.

The problem is not necessarily:

> “I have nothing to say.”

The problem is more often:

> “I know what I mean, but my thinking is messy, incomplete, hard to structure, or annoying to document.”

This becomes worse for users who:

- are still learning investing,
- are perfectionistic about documentation,
- do not know what a “complete” analysis should look like,
- dislike rigid templates,
- want to reflect on decisions later,
- or want to see how their thinking improves over time.

MY KRAVV should reduce the friction between:

**thinking something**

and

**having that thought preserved clearly enough to revisit later.**

---

## 4. Target User

Primary target:

### Beginner-to-intermediate individual investor / learner

A user who:

- wants to learn how to analyze companies,
- prefers building their own reasoning instead of receiving stock recommendations,
- likes reflection,
- wants a personal archive,
- wants guidance when confused,
- is willing to spend time thinking,
- and values long-term learning more than fast execution.

The product can still remain useful as the user becomes more experienced, but the AI role should naturally decrease.

---

## 5. Not Designed For

MY KRAVV is not optimized for:

- day traders,
- high-frequency decision making,
- people who only want live prices,
- users looking for “what stock should I buy?”,
- users who do not want to document their reasoning,
- professional research teams,
- institutional investment committees,
- advanced market-terminal workflows.

Those use cases may be served better by other tools.

MY KRAVV intentionally accepts that trade-off.

---

## 6. Core Product Philosophy

### 6.1 Freeform first, structure second

The user should be allowed to write naturally.

Example:

> “Revenue naik terus tapi margin malah turun. Management bilang karena ekspansi tapi aku belum yakin temporary atau bukan.”

The system can later structure it into:

- Evidence
- Interpretation
- Assumption
- Uncertainty
- Risk
- Open question

The user should not be forced to fill a large form before they are allowed to think.

---

### 6.2 Preserve raw thinking

Raw input must remain available.

AI-refined writing must never replace the original thought.

Recommended content layers:

- **RAW** — exactly what the user originally wrote
- **REFINED** — AI-cleaned version
- **FINAL** — user-approved version after edits

This allows the user to see both:

- the clean analysis,
- and the evolution of their natural thinking style.

---

### 6.3 AI assists judgment, not replaces it

AI should help the user:

- clarify,
- structure,
- challenge,
- guide,
- compare,
- reflect.

AI should not silently:

- invent the user's thesis,
- decide whether to invest,
- produce autonomous BUY / SELL decisions,
- rewrite history,
- or present model knowledge as verified evidence.

Principle:

> **AI assists the reasoning process. The user owns the judgment.**

---

### 6.4 Automate clerical work, not judgment

Good candidates for automation:

- formatting,
- classification,
- summarization,
- linking related notes,
- calculation,
- transaction aggregation,
- data organization,
- contextual recall.

Things that should remain human-owned:

- conviction,
- thesis,
- uncertainty,
- interpretation,
- investment decision,
- change of mind.

---

### 6.5 History should not be overwritten

MY KRAVV should preserve what the user believed at a specific point in time.

A thesis should be versioned rather than silently edited.

Example:

```text
Thesis v1 — Oct 2026
↓
New evidence
↓
Thesis v2 — Jan 2027
↓
Quarterly result
↓
Review
```

This creates a real decision history instead of hindsight reconstruction.

---

### 6.6 Unknown is a valid state

The product should never force fake completeness.

Valid states include:

- I don't know yet
- Evidence missing
- Still researching
- Unclear
- Not material right now
- Intuition only

A missing answer is better than a fabricated confident answer.

---

### 6.7 Structure must not become a prison

Frameworks are useful, but they can create their own bias.

The user must always be allowed to:

- write outside predefined categories,
- record intuition,
- record sudden changes,
- store incomplete thoughts,
- skip irrelevant sections.

Structured reasoning is a tool, not a mandatory worldview.

---

## 7. AI Roles

MY KRAVV AI should have several distinct roles instead of one generic “Ask AI” feature.

### Refine

Turns messy raw writing into clearer language without changing meaning.

Example:

Raw:

> “kayaknya customer susah pindah cuma gatau ini moat apa bukan”

Refined:

> “There may be customer stickiness, but I do not yet have enough evidence to conclude that it represents a durable moat.”

---

### Structure

Extracts possible reasoning components from freeform input.

Possible structure:

- Claim
- Evidence
- Assumption
- Risk
- Catalyst
- Uncertainty
- Open Question

The AI should label uncertainty instead of upgrading it into fact.

---

### Guide

Helps when the user does not know what to investigate next.

Guidance should be contextual.

Example:

> “You already understand the revenue model. The next useful area may be whether customer retention comes from switching costs, contracts, or habit.”

Guidance should become lighter as the user becomes more capable.

---

### Challenge

Acts as a reasoning sparring partner.

It may identify:

- unsupported assumptions,
- weak evidence,
- contradictions,
- missing alternatives,
- confirmation bias,
- overly strong conclusions.

The AI does **not** have to criticize every analysis.

If there is no meaningful challenge, it should say so.

Possible user responses:

- Defend
- Research
- Concede
- Dismiss
- Skip

---

### Compare

Compares versions of the user's own reasoning.

Example:

- Thesis v1 vs Thesis v2
- Expected vs Observed
- Before vs After new evidence

The purpose is to explain what changed, not determine who was “right”.

---

### Reflect

Looks across multiple analyses and helps identify recurring patterns.

Example:

> “Several thesis revisions happened because early claims were made before enough evidence was collected.”

Reflection should be based on actual stored history and examples.

It should not produce personality diagnoses.

---

## 8. AI Behavior Rules

The AI should behave differently depending on the situation.

### If meaning is unclear

Ask a clarification question.

Examples:

- company is unknown,
- time period changes the meaning,
- input has two materially different interpretations.

---

### If meaning is clear but analysis is incomplete

Do not interrogate the user.

Instead:

1. clean/structure the input,
2. save the useful content,
3. show optional gaps.

Example:

> “This note already covers revenue growth and margin pressure. Two open areas remain: whether margin pressure is temporary and whether competition is affecting retention.”

---

### If the user explicitly asks for guidance

The AI may become more mentor-like and ask progressive questions.

It should not dump a 30-field checklist.

---

### Default guidance mode

Recommended default:

**Adaptive**

Optional future controls:

- More Guidance
- Adaptive
- Minimal Guidance

---

## 9. Flexible Usage Model

MY KRAVV should not force one fixed workflow.

Users may enter through:

- raw thought,
- research dump,
- new evidence,
- uncertainty,
- company idea,
- decision,
- review,
- intuition,
- thesis revision.

The system should adapt to the input.

Core principle:

> **One underlying memory system, many valid entry paths.**

---

## 10. Suggested Reasoning Lifecycle

This is not a mandatory wizard.

Possible lifecycle:

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

A user may stop after any stage and continue later.

Example:

Day 1:

```text
Capture → Refine → stop
```

Day 3:

```text
Research → add evidence → stop
```

Day 7:

```text
Challenge → Thesis v1
```

---

## 11. Beginner → Advanced User Evolution

The product should expect the user's capability to improve.

### Early stage

AI may help heavily with:

- structure,
- terminology,
- fundamental gaps,
- research direction,
- writing clarity.

### Intermediate stage

The user naturally produces better raw analysis.

AI shifts toward:

- challenge,
- comparison,
- review,
- memory.

### Advanced stage

The user may barely need Refine or Guide.

The main value becomes:

- decision archive,
- thesis history,
- review,
- reflection,
- personal memory.

This is not a failure.

It means skill has transferred from the software to the user.

---

## 12. Intentional Trade-offs

### Slower than normal investment apps

MY KRAVV requires active thinking and documentation.

This is intentional.

It prioritizes:

**quality of reasoning**

over:

**speed of execution**

---

### Value grows over time

On day one, MY KRAVV may feel like structured notes + AI.

After months or years, the archive itself becomes valuable.

The product has a natural cold-start problem.

This is acceptable.

---

### Manual effort is required

The user must still contribute:

- thoughts,
- research,
- interpretations,
- decisions.

Automation should remove administrative friction, not remove involvement.

---

### AI may influence writing style

Repeated AI refinement may gradually affect how the user writes.

This can be positive if it improves clarity, but it creates a risk of homogenizing the user's voice.

Mitigation:

- always retain RAW,
- make refinement optional,
- preserve user edits,
- avoid silently replacing user reasoning.

---

### Frameworks may introduce bias

Structured categories may influence what the user notices.

Mitigation:

- freeform remains primary,
- unknown/other states remain valid,
- frameworks remain optional.

---

### Challenge can become annoying

Too much criticism creates friction.

Too little criticism creates no value.

Challenge intensity may eventually support:

- Light
- Standard
- Deep

Not required for MVP.

---

### MY KRAVV will not become the best market terminal

It does not need to compete with tools focused on:

- realtime market data,
- charting,
- screening,
- order execution,
- professional feeds.

Those can become integrations later if useful.

---

## 13. Personal Context and Intuition

Not every investment thought is fully rational or structured.

MY KRAVV should allow users to record:

- intuition,
- discomfort,
- sudden conviction changes,
- emotional context,
- FOMO,
- fatigue,
- rushed decisions,
- financial pressure.

These should be treated as contextual metadata, not psychological diagnosis.

Example:

```text
Decision basis:
- Evidence: Medium
- Intuition: High
- State: Rushed
```

Later review may compare these contexts with outcomes.

The system should not conclude:

> “You are an impulsive person.”

It may say:

> “Three decisions later revised were originally recorded while marked as rushed.”

---

## 14. Decision Quality vs Investment Outcome

MY KRAVV must keep these separate.

Possible situations:

```text
Good reasoning + bad outcome
Bad reasoning + good outcome
Good reasoning + good outcome
Bad reasoning + bad outcome
```

Profit does not automatically prove a thesis was good.

Loss does not automatically prove a thesis was bad.

Review should focus on:

- what was expected,
- what actually happened,
- which assumptions held,
- which mechanism differed,
- what changed afterward.

---

## 15. Private by Default

Current direction:

**MY KRAVV is a private personal workspace.**

Publishing, social features, public profiles, and community analysis are not current requirements.

If public sharing is ever reconsidered, it should be treated as a separate product/design problem.

Reason:

AI-assisted writing complicates authorship and ownership of public analysis.

For now:

- no public feed,
- no public profile requirement,
- no social system requirement,
- no public thesis requirement.

---

## 16. Non-Goals

MY KRAVV is not currently trying to become:

- a trading terminal,
- a broker,
- an autonomous investment advisor,
- an AI stock picker,
- a social investing network,
- a professional VC workflow,
- a financial news aggregator,
- a realtime market intelligence engine.

These may overlap with future integrations, but they are not the current product identity.

---

## 17. Relationship to KRAVV-IENT

MY KRAVV and KRAVV-IENT share philosophical DNA but serve different environments.

### MY KRAVV

```text
Individual
↓
Personal company research
↓
Reasoning
↓
Thesis
↓
Decision
↓
Personal review
```

### KRAVV-IENT

```text
Investment organization
↓
Cases
↓
Sources / Evidence
↓
Diligence
↓
Analysis
↓
Human review
↓
Recommendation
↓
Final decision
```

Shared principle:

> **Preserve the context behind a decision.**

Difference:

MY KRAVV should feel simple and personal.

KRAVV-IENT may expose more machinery because institutional workflows genuinely require more machinery.

---

## 18. Product Success

MY KRAVV is successful if it helps the user:

- start analysis with less friction,
- preserve raw thinking,
- articulate thoughts more clearly,
- notice unsupported assumptions,
- identify what still needs research,
- track why they changed their mind,
- separate reasoning quality from outcome,
- revisit old decisions honestly,
- and gradually improve their own thinking.

The best long-term success signal may be:

> **The user needs less AI assistance because their own reasoning has become clearer.**

---

## 19. Product Principles — Short Version

```text
Freeform first. Structure second.

Preserve raw thought.

AI assists. Human judges.

Automate clerical work, not judgment.

Unknown is valid.

Do not overwrite history.

Do not fake completeness.

Frameworks guide, not constrain.

Profit is not proof of good reasoning.

Private first.

The product should become quieter as the user becomes better.
```

---

## 20. Locked Decisions So Far

Current agreed direction:

- Keep the name **MY KRAVV**
- Keep the KRAVV historical identity
- Private personal workspace
- Beginner-friendly
- Raw thought is first-class data
- AI refinement is optional
- AI challenge is optional
- AI may ask clarification only when needed
- AI may suggest gaps without forcing answers
- Flexible workflows instead of one wizard
- Thesis/history should be versioned
- Intuition and incomplete reasoning are valid inputs
- Portfolio tracking may be added after the reasoning core
- Social/publishing is out of current scope
- AI should gradually step back as user skill improves

---

## 21. Next Documents

Recommended next project documents:

1. `02-core-user-journey.md`
2. `03-ai-behavior-spec.md`
3. `04-domain-model.md`
4. `05-mvp-scope.md`
5. `06-technical-architecture.md`
6. `07-page-responsibilities.md`
7. `08-design-direction.md`

These documents should remain lightweight and implementation-oriented.

The goal is not corporate documentation.

The goal is to make the product understandable to:

- the project owner,
- future self,
- ChatGPT / Codex,
- and any collaborator who joins later.
