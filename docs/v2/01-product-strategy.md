# Product & Strategy

## Overview

CrackTheX evolves from a vanilla JS equation solver PWA into a full-stack AI math tutoring platform. Rebuilt in Next.js on Vercel, with PostgreSQL, Stripe subscriptions, and AI-powered tutoring via the Anthropic API.

**Primary goal**: Portfolio showcase demonstrating full-stack AI product development.

**Secondary goal**: Viable freemium product. Not expected to be highly profitable, but designed so it doesn't cost money to run at the free tier.

**Core audience**: Hungarian secondary school students (12-18), widening slightly to older students and international users.

**Key product insight**: The buyer is not the user. Parents pay, students use. Marketing, onboarding, and the parent dashboard serve the buyer. The student-facing experience must be frictionless and genuinely useful — even on the free tier — because the free solver is an investment in future paid users (age-based funnel: free at 13 for linear equations, paid at 16 when math gets hard).

---

## Broader Platform Context

CrackTheX is the first product in a broader AI-powered study platform. A second product — a curriculum-aligned study helper covering languages (German, English), history, and other subjects — will be built later on the same shared foundation. See `external/product-brief-study-helper-20260222.md` for the study-helper design.

For now, only CrackTheX exists and ships under the `crackthex.app` domain. The platform name and second domain will be decided when the study-helper starts development.

---

## Workspace & Tabs

Math Workspace with AI Co-Pilot approach. Multiple tools (tabs) share a common shell.

| Tab | Description | Phase |
|-----|-------------|-------|
| **Solver** | Step-by-step equation solving with action buttons, hints, and contextual AI | MVP |
| **AI Tutor** | Conversational math tutoring chat interface | MVP (Wave 3) |
| **Practice** | Equation exercises — deterministic generation (free), AI-powered adaptive (Pro) | MVP (Wave 1 basic, Phase 2 adaptive) |
| **Notebook** | Math scratch pad with AI assistance, save/export | Phase 3 |

---

## Design Principles

1. Show the process, not just the answer
2. One step at a time — manage cognitive load
3. Student controls the pace — hints available, never forced
4. No login wall for the free tier — works immediately
5. Offline-first for the free deterministic solver
6. Hungarian first, but multilingual from day one
7. Free tier must be genuinely good — no nagware, no crippled UX
8. The buyer is not the user — design for both student and parent

---

## Tier Structure

MVP launches with two visible tiers. Signing up is free and unlocks account features. The pricing page shows "Free" and "Pro."

| Tier | Price | AI Budget | Key Features |
|------|-------|-----------|-------------|
| **Free** (no account) | $0 | None | Deterministic solver (1-var, 2-3 var linear), basic practice mode, localStorage sessions, all themes/languages, keyboard input |
| **Free** (with account) | $0 | None | Everything above + Camera OCR (registration hook) + cloud session sync + optional parent dashboard visibility |
| **Pro** | ~$10/month | ~500k tokens/month, daily caps | All AI features: AI Tutor chat, "Ask AI why?", word problems, quadratic solving, adaptive practice. 7-day free trial. |

**Future tier (post-launch, if data shows demand):**

| Tier | Price | Notes |
|------|-------|-------|
| **Master** | ~$20/month | Much higher limits (soft caps). All Pro + Socratic mode, Notebook, priority. |

**Cost philosophy:**
- Free tier = zero AI cost (deterministic solver + practice run client-side)
- Pro = controlled budget with per-user daily caps
- 7-day free trial lowers the barrier for uncertain parents

**Future monetization (data-driven):**
- Credit packs ("20 AI questions for 500 HUF")
- Annual pricing ($80/year vs $10/month)
- BYOK (Bring Your Own Key) for power users

---

## Accounts & Onboarding

### Two-Path Onboarding

**Student path** (frictionless):
1. Land on solver — no signup required
2. Type an equation → see it solved step by step (aha moment in 15 seconds)
3. Try practice mode → solve generated equations
4. Registration triggers: "Use your camera to scan equations" (primary hook) or "Save your work across devices"
5. Account is free, unlocks camera OCR + cloud sync

**Parent path** (conversion-focused):
1. Land on parent-oriented page: "See how your child learns math"
2. Demo solve + sample parent dashboard mockup
3. Sign up → create account → add child
4. 7-day free Pro trial starts automatically

### Account Structure

Flexible — no rigid parent-child hierarchy:

| Scenario | How it works |
|----------|-------------|
| Young student (10-13) | Parent creates child account, sees progress dashboard |
| Teen (14-16), involved parent | Student has own account, optionally links to parent (consent required) |
| Teen (14-16), hands-off parent | Parent pays, doesn't link accounts. No monitoring required. |
| Older teen (17-18) | Student has own account, subscribes themselves |
| Student from school | Own account, no parent needed |

**Key principle**: Parent linking is always optional, never required.

### Parent Dashboard (MVP — Minimal)

- Child's name and account status
- Equations solved this week (count)
- Practice sessions completed (count)
- Accuracy trend (simple 4-week line chart)
- Weekly progress summary email (automated)
- Self-benchmarking only ("up from 5 to 12 this week"), never peer comparison

---

## Feature Map

### Solver

| Feature | Free | Pro | Phase |
|---------|------|-----|-------|
| 1-var linear step-by-step (deterministic) | Yes | Yes | MVP |
| 2-3 var linear systems (deterministic) | Yes | Yes | MVP |
| Action buttons (add/sub/mul/div/expand/simplify) | Yes | Yes | MVP |
| Quadratic step-by-step (AI) | — | Yes | MVP |
| "Ask AI why?" on steps | — | Yes | MVP |
| N-var / non-linear systems (AI) | — | Yes | Phase 2 |

### AI Tutor

| Feature | Free | Pro | Phase |
|---------|------|-----|-------|
| Full chat tutoring | — | Yes | MVP |
| Error analysis ("why is this wrong?") | — | Yes | MVP |
| Socratic mode (guided, not answers) | — | Yes | Phase 2 |

### Word Problem Solver

| Feature | Free | Pro | Phase |
|---------|------|-----|-------|
| Text input → equation decomposition + solving | — | Yes | MVP |
| Connected sub-problem explanation with annotations | — | Yes | Phase 2 |

### Practice Mode

| Feature | Free | Pro | Phase |
|---------|------|-----|-------|
| Deterministic equation generation (3 difficulty levels) | Yes | Yes | MVP |
| Student solves with action buttons, pass/fail feedback | Yes | Yes | MVP |
| No hints in practice — solver available for learning | Yes | Yes | MVP |
| AI-powered adaptive difficulty | — | Yes | Phase 2 |

### Input

| Feature | No account | With account | Pro | Phase |
|---------|-----------|-------------|-----|-------|
| Keyboard + LaTeX + plain text | Yes | Yes | Yes | MVP |
| Camera OCR (Mathpix, server-side) | — | Yes | Yes | MVP |

Camera OCR = primary registration hook. Typing equations on mobile is painful; camera makes it effortless.

### Platform

| Feature | Free | Pro | Phase |
|---------|------|-----|-------|
| Local sessions (localStorage) | Yes | Yes | MVP |
| Cloud session sync (account) | Yes | Yes | MVP |
| Parent dashboard (optional) | Yes | Yes | MVP |
| Themes (Chalkboard, Light, Dark) | Yes | Yes | MVP |
| Languages (HU, EN, DE) | Yes | Yes | MVP |
| Usage dashboard & token budget | — | Yes | MVP |
| Progress tracking | Basic | Detailed | MVP/Phase 2 |
| Weekly progress email | Yes | Yes | MVP |

---

## Competitive Positioning

"Photomath shows you the answer. CrackTheX teaches you how to get there."

| CrackTheX | Photomath | ChatGPT |
|-----------|-----------|---------|
| Interactive — try your own moves | Passive — watch steps | No structure |
| "Ask AI why?" on any step | No explanations | Explains but hallucinates |
| Word problem decomposition | Equations only | Can do, but unreliable |
| Verified answers (AI + nerdamer) | Generally correct | Frequently wrong on math |
| Parent dashboard | No visibility | No visibility |
| Hungarian pedagogical style | English-first, translated | Generic |
| Practice mode (solve it yourself) | No practice | No practice |

---

## Growth & Acquisition

### First 100 Users

No paid ads. Word-of-mouth only.

1. **Personal network** (10-20) — friends, family, colleagues with school-age kids
2. **Hungarian tech communities** (20-30) — r/hungary, prog.hu
3. **One Facebook parent group** (50-100) — after having a real testimonial
4. **ProductHunt / Hacker News** — portfolio visibility

**Prerequisite**: Use it yourself first, get a real result, THEN share.

### Growth Funnel

```
Student finds CrackTheX (peer, parent, teacher)
    → Uses free solver (aha moment, 15 seconds)
    → Wants camera → creates free account (registration hook)
    → Uses free tier for months/years (age 13-15, linear equations)
    → Math gets harder (age 16+, quadratics, word problems)
    → Free solver can't help → tries Pro (7-day trial)
    → Parent pays $10/month → sees dashboard → keeps paying
```

### Economics

At 10,000 users / 2% conversion (200 Pro users):
- Revenue: ~$2,000/month
- AI costs: ~$25-50/month
- Infrastructure: ~$60-100/month
- **Total: under $150/month. Margins are excellent.**
- Free users cost nearly nothing (client-side solver)
