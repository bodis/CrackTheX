# CrackTheX — Product Description & Vision

## What Is CrackTheX?

CrackTheX is a math equation solver designed for Hungarian secondary school students (ages 12-18). It shows **how** to solve an equation, not just the answer — breaking the solution into small, numbered steps with explanations in the student's language.

Students can type an equation or photograph it with their phone camera. The app solves it step by step, and the student can follow along, try their own moves, or ask for hints when stuck.

It runs entirely in the browser as a Progressive Web App — no installation from an app store, no account, no backend. Open the link, start solving.

---

## The Problem It Solves

Math textbooks show the answer. Calculators give the result. Neither teaches the **process**.

A student staring at `5(2(x - 34) - 23) + 12 = 100` needs to understand *what to do first*, *why*, and *what happens next*. Teachers explain this live, but students practice alone — at home, on the bus, before an exam. That's when they need a tool that thinks out loud.

CrackTheX fills this gap: it models the step-by-step reasoning a teacher would demonstrate on a chalkboard, and it lets the student interact with each step.

---

## Current Features (v0.2.0)

### Equation Input

- **Keyboard entry**: Type equations in plain text (`2x + 3 = 7`) or LaTeX. The app handles conversion automatically.
- **Camera OCR**: Photograph a handwritten or printed equation. The image is cropped, sent to Mathpix for recognition, and the result is shown for review before solving. If recognition confidence is low, the student is warned and can edit.
- **Live preview**: As the student types or edits, the equation renders in real time with proper mathematical formatting.

### Step-by-Step Solver

The solver breaks down equation solving into individually numbered steps, each with a rule explanation:

- **Layered expansion**: Nested parentheses like `5(2(x - 34) - 23) + 12 = 100` are expanded one layer at a time — innermost first — so the student sees each distribution separately instead of a wall of algebra.
- **Smart strategy detection**: When the equation has the form `N * (expression) = K` and K is divisible by N, the solver offers a "divide first" shortcut alongside the standard expansion path.
- **Alternative paths**: At decision points, the student can see that a different approach exists. Both paths are valid; the app shows one and describes the other.
- **Term-by-term movement**: Moving terms across the equals sign happens one term at a time with sign changes explained, not all at once.
- **Verification**: The final answer is cross-checked against an independent symbolic solver to catch errors in the step-by-step logic.
- **Fallback**: If the step-by-step engine can't handle an equation, it falls back to showing the direct solution.

### Interactive Learning

The student is not just a passive viewer:

- **Action buttons**: Add, subtract, multiply, or divide both sides by a chosen value. Expand parentheses. Simplify like terms. Each action produces a new step card.
- **Free-form rewrite**: The student can type an equivalent equation from scratch. The app validates it against the actual solution — if it's algebraically equivalent, it's accepted.
- **Hint system**: "Next step" reveals one solver step. "Full solution" reveals everything. The student decides how much help they want.
- **Solved detection**: When the variable is isolated (e.g., `x = 5`), the board recognizes the equation is solved and shows a completion state.

### Multi-Session Workflow

- Students can work on multiple equations in parallel, each tracked as a separate session.
- Sessions persist in the browser — closing the tab and coming back restores everything (except camera images).
- Session sidebar shows equation text, status (New / In Progress / Solved), and relative timestamps.
- Delete with undo (4-second grace period). Clear all with confirmation.

### Language Support

- Hungarian (default), English, German — all UI text, all solver rule descriptions, all error messages.
- Language switch is instant and applies everywhere, including already-rendered steps.
- Persisted per browser.

### Themes

- **Chalkboard** (default): Dark green background, chalk-yellow accents — designed to feel like a real school chalkboard.
- **Whiteboard**: Light theme with clean blue accents.
- **Dark**: Near-black with violet accents for low-light use.

### PWA

- Installable on phone home screen (Android & iOS).
- Works offline after first load (except camera OCR, which needs internet).
- Fast loading — app shell is cached, math libraries are pre-cached from CDN.

---

## Equation Types Supported

### Works Well

| Type | Example |
|------|---------|
| Linear, one variable | `2x + 3 = 7` |
| With parentheses | `5(x - 2) = 15` |
| Nested parentheses | `3(2(x + 1) - 3) = 12` |
| Deeply nested | `5(2(x - 34) - 23) + 12 = 100` |
| Multiply-first pattern | `5(x + 10) = 150` (detects divide-first opportunity) |
| With fractions | `(2x)/3 + 1 = 7` |
| Trivially solved | `x = 5` |

### Solved by Fallback (Direct Answer Only)

| Type | Example |
|------|---------|
| Quadratic | `x^2 - 4 = 0` |
| With roots | `sqrt(x) = 5` |
| Higher degree | `x^3 = 27` |

### Not Supported

| Type | Why |
|------|-----|
| Systems of equations | Single-equation solver only |
| Inequalities | Not implemented |
| Logarithmic / trigonometric | Outside target curriculum scope |
| Absolute value | Not implemented |
| No-solution / infinite-solution cases | Not handled gracefully |

---

## Target Audience

**Primary**: Hungarian students aged 12-18 in general secondary education (altalanos iskola upper years and gimnazium), solving linear equations as part of the standard math curriculum.

**Secondary**: Teachers who want to demonstrate step-by-step solving in class, and parents helping with homework.

**Language reach**: English and German translations make it usable beyond Hungary, but the pedagogical approach follows the Hungarian math curriculum's conventions (e.g., how terms are grouped, which operations come first).

---

## Current Limitations

### Functional

- **No quadratic step-by-step**: The solver's step logic is built for linear equations. Quadratic and higher-degree equations get a direct answer via fallback, not a pedagogical breakdown.
- **Single variable only**: No systems of equations, no multi-variable support.
- **No inequality support**: Only equations with `=`.
- **No undo for user actions on the board**: If a student makes a wrong move, they can't step back — they'd need to start over or use hints.
- **No export**: Solutions can't be saved as PDF, image, or shared via link.
- **No user accounts**: Everything is local to the browser. Switching devices means losing history.

### Technical

- **OCR requires API keys**: Mathpix is a paid service. The app ships with placeholder keys — camera OCR doesn't work without configuration.
- **No backend**: Sessions, preferences, and history are all localStorage. No sync, no backup.
- **localStorage size limits**: Browsers typically allow 5-10MB. With many sessions, this could fill up (though without images, each session is small).
- **No analytics**: No way to know how students use the app, which equations they struggle with, or where they drop off.

---

## Vision & Future Directions

CrackTheX v2 is being redesigned as an AI-powered math tutoring platform, rebuilt in Next.js on Vercel. It is the first product in a broader study platform that will also cover languages and other subjects.

**Full design spec**: `docs/superpowers/specs/2026-04-12-crackthex-v2-platform-design.md`

### v2 Summary

- **Full-stack rebuild**: Next.js, Vercel, PostgreSQL, Drizzle, Stripe, Anthropic API
- **Workspace with tabs**: Solver, AI Tutor, Practice (MVP), Notebook (Phase 3)
- **AI integration**: "Ask AI why?" on steps, conversational tutoring, word problem decomposition, math accuracy verification against nerdamer
- **Free tier**: Deterministic solver (1-var + 2-3 var linear) + basic practice mode. No AI, no account needed. Genuinely useful on its own.
- **Pro tier** (~$10/month): All AI features — tutoring, word problems, OCR, quadratics, adaptive practice. 7-day free trial.
- **Broader platform**: Monorepo with shared platform layer (auth, billing, AI budget). A curriculum-aligned study-helper for languages and other subjects will be built later on the same foundation. Two domains (`crackthex.app` + platform domain), one deployment.
- **Account model**: Optional parent-child linking. Students can use independently. Parents who link accounts get a progress dashboard. Parent is the buyer, student is the user.

### Remaining v1 Ideas (Superseded or Deferred)

These ideas from the original vision are either addressed differently in v2 or deferred:

| Original Idea | v2 Status |
|---------------|-----------|
| Quadratic step-by-step | AI-powered in Pro tier |
| Systems of equations | Deterministic 2-3 var (free), AI for 4+ var (Pro) |
| Word problems | AI decomposition + solving in Pro tier |
| Guided practice | Practice tab in MVP (basic), adaptive in Phase 2 |
| Error analysis | AI Tutor feature in Pro tier |
| User accounts | OAuth + email/password, optional for free tier |
| Progress tracking | MVP (basic), Phase 2 (detailed) |
| Shareable links | Phase 3+ |
| Classroom mode / teacher dashboard | Phase 2+ (after school validation) |
| Own OCR model | Deferred — Mathpix via server proxy for now |
| Mobile native apps | Phase 3+ |

---

## Design Philosophy

Principles that guide development — original v1 principles plus additions from v2 design:

1. **Show the process, not just the answer.** Every feature should make the solving process more transparent, not less.
2. **One step at a time.** Cognitive load matters. The student should never see more than they can process — expand one layer, move one term, simplify one side.
3. **The student controls the pace.** Hints are available but never forced. The student decides when they're stuck.
4. **No login wall.** The app should work immediately, from any device, with zero friction.
5. **Offline-first.** A student on a bus without data should still be able to solve equations they've started.
6. **Hungarian first, but not Hungarian only.** The pedagogical approach follows the Hungarian curriculum, but the app is multilingual from day one.
7. **Free tier must be genuinely good.** No nagware, no crippled UX. The free solver + practice is a real product — an investment in the age-based growth funnel.
8. **The buyer is not the user.** Parents pay, students use. Design for both: frictionless student experience, visible-progress parent experience.
