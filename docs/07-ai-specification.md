# AI Features & Prompt Engineering Specification

**Date:** 2026-04-13
**Team:** Zoltán (AI/ML Engineer), Gergő (Math Pedagogy Expert), Réka (Product Owner), András (Marketing/Sales)
**Context:** Specifying AI features from `docs/02-architecture.md` (AI Integration section) for implementation. Concrete prompt templates, model assignments, cost estimates.

---

## Decisions Summary

| Question | Decision | Rationale |
|----------|----------|-----------|
| Model strategy | Provider-agnostic, tier-based | AI Gateway supports any provider. Pick best quality-per-dollar per feature. Model names are config, not code. |
| Model tiers | Nano / Mini / Standard | Maps features to capability levels, not specific models. Swap models without code changes. |
| Quality gate | Hungarian eval benchmark (20 equations, 4+/5) | Every model swap candidate must pass. Native speaker scores correctness, naturalness, pedagogy. |
| "Ask AI why?" output | Plain text + inline KaTeX | Simple, cheap, cacheable. |
| Word problem output | Structured (Zod schema via `generateObject()`) | Equations feed into deterministic solver. Parsing free-form text is fragile. |
| AI Tutor method | Socratic with escalation at 6 exchanges | Teaches, doesn't give answers. Escalates to direct guidance when student is stuck. |
| Math verification | Cross-check all math output against nerdamer | AI interprets language, computer does algebra. Key differentiator vs ChatGPT. |
| Budget enforcement | Per-user daily caps (our code) + global ceiling (Gateway) | Two layers. Friendly cap messages, not hard errors. |
| Prompt caching | Three levels: prompt prefix, response cache, decomposition cache | Reduces cost 40-60%. Response caching eliminates calls for repeated equations. |

---

## 1. Model Strategy & Architecture

### Core Principle

Provider-agnostic, quality-gated, tier-based. Every AI feature routes through Vercel AI Gateway. Model assignment is config, not code. Each prompt template works with any provider. Before any model ships for any feature, it passes the Hungarian math eval benchmark.

### Capability Tiers

| Tier | Purpose | Candidate models (examples, not commitments) |
|------|---------|-----------------------------------------------|
| **Nano** | Simple, high-volume, cheapest possible | GPT-5.4 nano, Gemini 2.5 Flash, Haiku 4.5 |
| **Mini** | Structured output, moderate reasoning | GPT-5.4 mini, GPT-5 mini, Sonnet 4.6 |
| **Standard** | Multi-turn reasoning, pedagogical nuance | Sonnet 4.6, GPT-5.4, Gemini 2.5 Pro |

No "Pro/Opus" tier for MVP — overkill for this domain.

### Feature-to-Tier Mapping

| Feature | Tier | Why | SDK Method |
|---------|------|-----|------------|
| "Ask AI why?" | Nano | Short output, simple task | `generateText()` |
| Word problem contextualization | Nano | Sentence from known values | `generateText()` |
| Word problem decomposition | Mini | Structured output + Hungarian comprehension | `generateObject()` |
| Quadratic step-by-step | Mini | Math reasoning + structured steps | `generateObject()` |
| AI Tutor chat | Standard | Multi-turn, pedagogical quality is the product | `streamText()` |

### Config Structure

Model assignments live in config, swappable without deploy:

```typescript
const MODEL_CONFIG = {
  nano: "google:gemini-2.5-flash",        // swap anytime
  mini: "anthropic:claude-sonnet-4-6",     // swap anytime
  standard: "anthropic:claude-sonnet-4-6", // swap anytime
}
```

When a cheaper model passes the Hungarian eval for a given tier, swap in one config change. Zero code changes.

### API Route Structure

```
/api/ai/explain    → "Ask AI why?"         (Nano)
/api/ai/tutor      → AI Tutor chat         (Standard, streaming)
/api/ai/word       → Word problem decomp   (Mini)
/api/ai/quadratic  → Quadratic step-by-step (Mini)
```

All routes follow the same flow:

```
Request → verify auth → check tier (Pro required)
  → check daily cap (token_usage table)
  → check response cache (cache hit → return instantly)
  → proxy to Vercel AI Gateway
  → Gateway enforces global budget
  → Over budget: gateway rejects → show upgrade prompt
  → Under budget: gateway calls LLM
  → Verify math output against nerdamer (where applicable)
  → Log tokens to DB → cache response → return
```

### Eval Gate

20 equations across difficulty levels (simple linear through nested parentheses). Native Hungarian speaker scores each model's output on:

- **Correctness** (1-5): Is the math explanation accurate?
- **Naturalness** (1-5): Does it sound like a Hungarian teacher?
- **Pedagogical value** (1-5): Does it help the student understand?

Model must average 4+ across all three dimensions to ship for any tier. Re-run on every model swap candidate.

### Fallback

AI Gateway handles automatic fallback per tier if the primary provider is down. High availability without custom retry logic.

---

## 2. "Ask AI why?" — Prompt Design

**Trigger:** Button on each solver step card. Pro only.
**Tier:** Nano
**SDK:** `generateText()`

### System Prompt (static, cached)

```
You are a math tutor for Hungarian secondary school students (ages 12-18).

Your job: explain WHY a specific algebraic step was taken — not what happened
(the student can see that), but why it's the right move at this point.

Rules:
1. 2-3 sentences maximum.
2. Connect the step to the GOAL of isolating the variable.
3. If alternative paths existed, briefly mention why this path was chosen
   (e.g., "avoids fractions", "simplifies first").
4. Use classroom-level Hungarian. Match complexity to the equation difficulty.
5. Use $...$ for inline math expressions.
6. Do NOT re-solve the equation or show subsequent steps.
7. Respond in the language specified in the user message.
```

### User Message Template (dynamic)

```
Egyenlet: {equation_latex}
Előző lépés: {previous_step_latex}
Jelenlegi lépés: {current_step_latex}
Alkalmazott szabály: {rule_key} (érték: {rule_value})
Alternatív lehetőségek: {alternatives_summary | "nincs"}
Nyelv: {language}
```

**Context fields from the step object:**
- `equation_latex`: the original equation
- `previous_step_latex` / `current_step_latex`: the two steps being explained
- `rule_key`: from the step's `rule` field (e.g., `subtract_both_sides`)
- `rule_value`: the operand (e.g., `3`)
- `alternatives_summary`: from the step's `alternatives` array, if any
- `language`: from user profile or i18n setting

### Response Format

Plain text with inline KaTeX (`$...$`). No structured output — simple text generation.

**Example response:**
> Azért vonjuk ki a $3$-at mindkét oldalból, mert így a $2x$ egyedül marad a bal oldalon — ez visz közelebb ahhoz, hogy megtudjuk $x$ értékét. Osztással is kezdhetnénk, de az törtet eredményezne, ami bonyolítaná a további lépéseket.

### Response Caching

Cache in DB keyed on `(equation_normalized, step_index, rule_key, language)`.

- Common equations like `2x + 3 = 7` will have near-100% cache hit rates
- Cache hit = zero AI cost, instant response
- TTL: 90 days (math explanations don't go stale)
- Normalization: strip whitespace, sort terms canonically

---

## 3. Word Problem Decomposition

**Trigger:** Student types natural language problem in Word Problem input. Pro only.
**Tier:** Mini (decomposition) + Nano (contextualization)
**SDK:** `generateObject()` + `generateText()`

### System Prompt (static, cached)

```
You are a math problem analyzer for Hungarian secondary school students.

Your job: decompose a word problem into mathematical variables and equations.

Rules:
1. Identify each unknown variable with a symbol and Hungarian description.
2. For each equation, cite the EXACT phrase from the input that produces it.
3. Classify the resulting system type.
4. Write a brief solution strategy in Hungarian.
5. If the input is not a valid math problem or is ambiguous, set is_valid to false
   and explain why in Hungarian.
6. All descriptions and explanations in the language specified.
7. Use LaTeX notation for all math expressions.
```

### Structured Output Schema

```typescript
const WordProblemResult = z.object({
  is_valid: z.boolean(),
  rejection_reason: z.string().optional(),
  variables: z.array(z.object({
    symbol: z.string(),           // "x"
    meaning: z.string(),          // "Kata almáinak száma"
  })),
  equations: z.array(z.object({
    latex: z.string(),            // "y = 3x"
    explanation: z.string(),      // "Péter háromszor annyit szedett mint Kata"
    source_text: z.string(),      // exact quote from student's input
  })),
  system_type: z.enum([
    "single_linear",
    "linear_system",
    "quadratic",
    "unsupported"
  ]),
  solution_plan: z.string(),     // "Helyettesítéssel megoldjuk a két egyenletet"
})
```

The `source_text` field enables the UI to highlight the relevant phrase in the original problem when hovering over an equation — a key differentiator.

### Post-Decomposition Flow

```
AI decomposes (Mini tier, generateObject)
  → Validate: is_valid == true?
      false → show rejection_reason, friendly message
      true  → continue
  → Parse equations from structured output
  → Route by system_type:
      single_linear  → deterministic 1-var solver (free engine)
      linear_system  → deterministic multi-var solver (free engine)
      quadratic      → AI quadratic solver (Mini tier)
      unsupported    → friendly "coming soon" message (Pro user already, no upsell)
  → Verify all solutions with nerdamer
  → Reasonableness check (no negative counts, impossible ages, etc.)
  → Contextualize answer (Nano tier)
```

**Key design choice:** AI interprets the Hungarian text. The computer does the algebra. Deterministic solving wherever possible = zero hallucination risk on the actual math.

### Contextualization Prompt (Nano tier, separate cheap call)

```
Eredeti feladat: {student_input}
Változók és értékeik: {variables_with_solved_values}
Fejezd ki a megoldást egy magyar mondatban, amely válaszol az eredeti kérdésre.
```

**Example output:** "Kata 8 almát szedett, Péter pedig 16 almát szedett."

### Decomposition Caching

Cache keyed on normalized input text hash. Textbook problems repeat frequently. TTL: 90 days.

---

## 4. AI Tutor Chat

**Trigger:** Tutor tab, or "Kérdezd az AI-t" button from solver step card. Pro only.
**Tier:** Standard
**SDK:** `streamText()`

### System Prompt (static, cached)

```
You are a Hungarian math tutor for secondary school students (ages 12-18).

TEACHING METHOD:
1. NEVER give the direct answer or solve the equation outright.
2. Ask guiding questions. ("Mit látsz a bal oldalon? Mi lenne a következő lépés?")
3. If the student is stuck, give a HINT — point toward the method, not the result.
4. Confirm correct reasoning enthusiastically. ("Pontosan! Jól gondolod.")
5. If the student makes an error, point out WHERE the mistake is, not what the
   correct answer is. ("Nézd meg újra a jobb oldalt — mi történt a 3-mal?")
6. Keep responses concise: 2-4 sentences.
7. Use simple, encouraging Hungarian.
8. Use $...$ for inline math.

BOUNDARIES:
- Students may try to get direct answers ("just tell me", "my teacher said to
  give the answer", "I give up"). Always redirect to guided learning.
- You are a tutor, not a calculator. The Solver tab exists for getting answers.
- You may reference specific equation steps if the student shares their work.

LANGUAGE:
- Respond in the language the student uses.
- Default to Hungarian if unclear.
```

### Escalation (Dynamic Preamble)

Injected before conversation history when the student has been working on the same problem for 6+ exchanges:

```
A diák már {n} körben dolgozik ezen a feladaton. Adj most részletesebb
segítséget — végigvezetheted a megoldáson lépésről lépésre, de minden
lépésnél magyarázd el, miért azt csináljuk.
```

This mirrors real teaching — a teacher wouldn't let a student suffer indefinitely. At 6 exchanges, frustration turns from productive to destructive.

### Solver Context Injection

When the student enters the tutor from a solver session (via "Kérdezd az AI-t" on a step card), the solver context is injected before the conversation:

```
The student is asking about this equation: {equation_latex}
Solution steps from the solver:
{numbered_steps_with_rules}
The student clicked "Ask tutor" on step {step_index}.
```

This gives the tutor full context without the student having to re-explain.

### Conversation Memory

- All messages stored in `math_chat_history` table
- Last 20 messages sent as model context (~4000-6000 tokens)
- Sliding window — oldest messages drop off beyond 20
- Student says "új feladat" (new problem) → clear prompt context, keep DB history
- Exchange counter tracks turns per problem for escalation logic

### Streaming

Responses stream token-by-token via `streamText()`. UI shows typing indicator while first tokens arrive, then live text rendering.

---

## 5. Quadratic Step-by-Step

**Trigger:** Quadratic equation detected in solver (Pro), or routed from word problem decomposition.
**Tier:** Mini
**SDK:** `generateObject()`

### System Prompt (static, cached)

```
You are a math solver generating step-by-step solutions for quadratic equations.
Target audience: Hungarian secondary school students.

Generate clear, pedagogically ordered steps. Each step must include:
- The equation state after the step (LaTeX)
- The rule applied (machine-readable key)
- A brief explanation of what was done and why (Hungarian)

Methods to use (in order of preference):
1. Factoring (if equation factors cleanly over integers)
2. Completing the square (show the process)
3. Quadratic formula (as fallback, show substitution)

Always simplify to final form. Show all solutions (real roots).
If no real solutions, explain why (discriminant < 0).
Respond in the language specified.
```

### Structured Output Schema

```typescript
const QuadraticResult = z.object({
  method: z.enum(["factoring", "completing_square", "quadratic_formula"]),
  steps: z.array(z.object({
    latex: z.string(),          // "x^2 - 5x + 6 = 0"
    rule: z.string(),           // "factor_trinomial"
    explanation: z.string(),    // "Keressük a két számot, amelyek..."
  })),
  solutions: z.array(z.object({
    latex: z.string(),          // "x = 2"
    decimal: z.number().optional(),
  })),
  has_real_solutions: z.boolean(),
  no_solution_reason: z.string().optional(),
})
```

### Verification

`nerdamer.solve()` handles quadratics — it returns solutions but can't generate pedagogical steps. After AI generates steps:

1. Extract `solutions` from AI output
2. Solve same equation with `nerdamer.solve()`
3. Compare solution sets
4. **Match** → show with "✓ Ellenőrzött megoldás" badge
5. **Mismatch** → discard AI steps, show nerdamer solutions with note that step-by-step isn't available. Log incident.

---

## 6. Math Accuracy Verification Pipeline

### Where Verification Applies

| Feature | AI outputs math? | Verification | How |
|---------|-----------------|-------------|-----|
| "Ask AI why?" | No (text only) | Not needed | — |
| Word problem decomposition | Yes (equations) | Syntax + solvability | Parse LaTeX → nerdamer, check it solves |
| Word problem solutions | Yes (values) | Full verification | Compare AI values vs nerdamer solutions |
| Quadratic steps | Yes (steps + answer) | Answer verification | Compare final answer vs `nerdamer.solve()` |
| AI Tutor | Rarely (hints) | Best-effort | Not systematically verified |

### Three-Tier Response

1. **Match** → show result with "✓ Ellenőrzött megoldás" (Verified solution) badge
2. **Mismatch, nerdamer can solve** → show nerdamer answer, suppress AI result, log incident for prompt improvement
3. **Nerdamer can't solve** → show AI result without checkmark badge (no negative framing — just no badge)

**No "AI might be wrong" warnings.** The checkmark is the positive signal. Absence of checkmark is neutral, not negative.

**For MVP, all supported equation types are verifiable.** Nerdamer solves linear, systems, and quadratic. Truly unverified output only appears in Phase 2 (complex non-linear systems).

### Word Problem Reasonableness Check

After solving, apply simple heuristic rules:
- Negative value for a counting/quantity variable → warning
- Age > 150 or < 0 → warning
- Fractional value where context implies integer (number of people) → warning

These are rule-based post-processing, not AI.

### Verification Implementation

```typescript
async function verifyMathOutput(
  equations: ParsedEquation[],
  aiSolutions: Record<string, string>
): Promise<VerificationResult> {
  const nerdamerSolutions = solveWithNerdamer(equations)

  if (!nerdamerSolutions) {
    return { status: "unverifiable", reason: "nerdamer_cannot_solve" }
  }

  const match = compareSolutions(aiSolutions, nerdamerSolutions)
  if (match) {
    return { status: "verified" }
  }

  logMismatch({ equations, aiSolutions, nerdamerSolutions })
  return { status: "mismatch", correctSolutions: nerdamerSolutions }
}
```

---

## 7. Cost Model & Budget Enforcement

### Per-Interaction Cost Estimates

Costs are approximate and will decrease as model prices drop. The tier-based approach means we automatically benefit from cheaper models.

| Feature | Tier | Est. cost/call | Avg calls/user/month | Monthly/user |
|---------|------|---------------|---------------------|-------------|
| "Ask AI why?" | Nano | ~$0.0002 | 48 | $0.01 |
| Word problem decomp | Mini | ~$0.013 | 8 | $0.10 |
| Word problem context | Nano | ~$0.0001 | 8 | $0.001 |
| AI Tutor (per exchange) | Standard | ~$0.016 | 40 | $0.64 |
| Quadratic solving | Mini | ~$0.015 | 8 | $0.12 |
| **Total** | | | | **~$0.87** |

### Projections at 200 Pro Users

| Scenario | Monthly AI cost | Notes |
|----------|----------------|-------|
| Before caching | ~$175 | Raw model costs |
| With prompt caching | ~$120-140 | System prompt caching (~25% input reduction) |
| With prompt + response caching | ~$80-120 | High hit rate on common equations |
| Optimistic (high cache hits) | ~$50-80 | Mature cache, repetitive equations |
| 6-12 months out (model price drops) | ~$30-60 | AI costs drop ~50%/year |

Against $2,000/month revenue (200 users × $10/month), all scenarios maintain 90%+ margins.

### Daily Caps Per User

| Feature | Daily cap | ~3x avg daily usage |
|---------|-----------|-------------------|
| "Ask AI why?" | 30 calls | Avg ~2/day |
| Word problems | 10 | Avg ~0.3/day |
| AI Tutor exchanges | 50 | Avg ~1.3/day |
| Quadratic solving | 15 | Avg ~0.3/day |

### Worst-Case User

A user maxing every cap every day:
- 30 × $0.0002 + 10 × $0.013 + 50 × $0.016 + 15 × $0.015 = **~$1.16/day → ~$35/month**
- Costs more than their $10 subscription, but this is a 99th-percentile scenario
- The portfolio of users averages out, and power users are the best retention and testimonial cases
- Daily caps prevent anything worse

### Enforcement Layers

1. **Our code** (`lib/platform/ai/`): per-user daily cap check against `token_usage` table before each call
2. **AI Gateway**: global budget ceiling as safety net
3. **Over daily cap**: "Mai kereted elfogyott — holnap újra elérhető!" with link to usage dashboard
4. **Over global budget**: Gateway rejects → show upgrade prompt or "service temporarily limited" message

---

## 8. Prompt Caching Strategy

### Three Levels of Caching

| Level | What's cached | How | Cost impact |
|-------|-------------|-----|-------------|
| **Prompt prefix caching** | System prompts (identical across all users/calls) | Automatic — AI Gateway + provider cache identical prefixes (5 min TTL) | ~25-35% input cost reduction |
| **Response caching** | Full AI responses for identical inputs | Our DB, keyed on normalized input | 50-70% call elimination for "Ask AI why?" |
| **Decomposition caching** | Word problem structured results | Our DB, keyed on normalized text hash | Lower hit rate, but textbook problems repeat |

### Response Cache Implementation

```
Before calling AI Gateway:
  1. Normalize input (strip whitespace, canonical term ordering)
  2. Generate cache key: (feature, normalized_input_hash, language)
  3. Check ai_response_cache table
     → Hit: return cached response instantly (zero cost)
     → Miss: call Gateway, store response, return
```

- **TTL:** 90 days (math explanations don't go stale)
- **Biggest impact on "Ask AI why?"**: 20% of equations account for 80% of student activity. Simple equations like `2x + 3 = 7` will be cached early and served thousands of times at zero cost.
- **No caching for AI Tutor**: every conversation is unique by nature.

### What's Cacheable Per Feature

| Feature | Prompt prefix cacheable? | Response cacheable? | Notes |
|---------|------------------------|-------------------|-------|
| "Ask AI why?" | Yes (system prompt) | Yes (high hit rate) | Same equation + step = same explanation |
| Word problem decomp | Yes (system + schema) | Yes (moderate hit rate) | Textbook problems repeat |
| Word problem context | Yes (system prompt) | Yes (tied to decomp cache) | Same problem + solution = same sentence |
| AI Tutor | Yes (system prompt) | No | Conversations are unique |
| Quadratic solving | Yes (system prompt) | Yes (moderate hit rate) | Same equation = same steps |

---

## 9. Round 11 Findings Summary

This specification was produced through a simulated team conversation (Round 11) with four stakeholders. Key findings:

| # | Finding | Source |
|---|---------|--------|
| 81 | Provider-agnostic model strategy: tier-based (Nano/Mini/Standard), not model-specific. Config swap, not code change. | Zoltán + Réka |
| 82 | Hungarian eval benchmark gates every model swap: 20 equations, native speaker scores 4+/5 on correctness, naturalness, pedagogy. | Gergő + Zoltán |
| 83 | "Ask AI why?" explains the WHY (goal-directed reasoning), not the WHAT (the step card shows that). Includes alternative path reasoning when alternatives existed. | Gergő |
| 84 | Word problem decomposition uses structured output (Zod schema via `generateObject()`). Each equation carries `source_text` linking back to the original problem phrase. | Zoltán |
| 85 | AI interprets language, computer does algebra. Deterministic solver used wherever possible to eliminate hallucination risk on math. | Zoltán + Gergő |
| 86 | Word problem contextualization ("Kata 8 almát szedett") is a separate Nano-tier call after deterministic solving. Cheap and natural. | Zoltán |
| 87 | AI Tutor uses Socratic method with escalation: after 6 exchanges on the same problem, shifts to more direct guidance. Mirrors real teaching. | Gergő |
| 88 | Tutor anti-answer-giving is enforced via system prompt + jailbreak resistance. Students who want answers use the Solver tab — features serve different purposes. | Gergő + Zoltán |
| 89 | Solver context injection: entering tutor from a solver step passes full solution context. Student doesn't re-explain. | Zoltán |
| 90 | Verification uses "checkmark present" (positive) vs "no checkmark" (neutral). No "AI might be wrong" negative framing. | Réka + Zoltán |
| 91 | For MVP, all equation types are fully verifiable via nerdamer. Unverified AI output only in Phase 2. | Zoltán |
| 92 | Cost ~$0.87/user/month before caching, ~$80-120/month at 200 users with caching. 90%+ margin against $10/month subscription. | Zoltán + Réka |
| 93 | AI Tutor dominates cost (74% of per-user spend). The cheapest improvement lever is moving the Tutor to a cheaper model — but only if it passes the Hungarian eval. | Zoltán |
| 94 | Response caching for common equations can eliminate 50-70% of "Ask AI why?" calls. Power law: 20% of equations = 80% of usage. | Zoltán |
| 95 | Daily caps set at ~3x average usage. Generous enough for heavy study sessions, prevents runaway cost from abuse. | Réka + Zoltán |
| 96 | Model costs drop ~50%/year. Architecture is designed to automatically benefit from cheaper models without code changes. | Zoltán + András |
