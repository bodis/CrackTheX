# CrackTheX v2 — Math AI Platform Design Spec

## Overview

CrackTheX evolves from a vanilla JS equation solver PWA into a full-stack AI math tutoring platform. The product is rebuilt in Next.js on Vercel, with a PostgreSQL backend, Stripe subscriptions, and AI-powered tutoring via the Anthropic API.

**Primary goal**: Portfolio showcase demonstrating full-stack AI product development — frontend, backend, auth, database, AI integration, payments.

**Secondary goal**: Viable freemium product. Not expected to be highly profitable, but designed so it doesn't cost money to run at the free tier.

**Core audience**: Hungarian secondary school students (12-18), widening slightly to older students and international users.

**Key product insight**: The buyer is not the user. Parents pay, students use. Marketing, onboarding, and the parent dashboard serve the buyer. The student-facing experience must be frictionless and genuinely useful — even on the free tier — because the free solver is an investment in future paid users (age-based funnel: free at 13 for linear equations, paid at 16 when math gets hard).

---

## Broader Platform Context

CrackTheX is the first product in a broader AI-powered study platform for Hungarian students. A second product — a curriculum-aligned study helper covering languages (German, English), history, and other subjects — will be built later on the same shared foundation.

### Two Products, One Platform (Future)

For now, only CrackTheX exists and ships under the `crackthex.app` domain. The platform name and second domain will be decided when the study-helper product starts development.

```
crackthex.app            →  Math workspace (the only product for now)
[platform-name].app      →  Subject picker (future, when study-helper exists)
                              Both will route to the same Next.js deployment
```

- **crackthex.app**: The math workspace. This is the only domain at launch.
- **[platform-name].app**: Added later when the study-helper is built. Same deployment, middleware-based routing.
- **Same deployment**: One Vercel app, two domains. Middleware reads hostname and sets `defaultSubject`. Same account, same subscription works on both.

### Monorepo Architecture

```
project/
├── packages/
│   ├── platform/        # Shared: auth, billing, DB, parent dashboard, progress
│   ├── ui/              # Shared: design system, themes, components
│   └── ai/              # Shared: LLM proxy, token budget, rate limiting
├── apps/
│   ├── web/             # Next.js app (single deployment, both domains)
│   │   ├── (marketing)/ # Landing pages (domain-aware)
│   │   ├── (auth)/      # Login, register, OAuth
│   │   ├── (workspace)/ # Subject workspaces
│   │   │   ├── math/    # CrackTheX math workspace
│   │   │   └── ...      # Future: language, history workspaces
│   │   └── api/         # Shared API routes
│   └── ...              # Future: mobile app, admin panel
└── tooling/             # Shared config: eslint, tsconfig, etc.
```

### What's Shared (Platform Layer)

Built once, used by all products — generalized from day one:

| Component | Description |
|-----------|-------------|
| **Auth** | OAuth (Google, GitHub) + email/password, user profiles, roles |
| **Billing** | Stripe subscriptions, tier management, webhooks |
| **AI Budget** | Token tracking per user, tier-based limits, rate limiting, daily caps |
| **LLM Proxy** | `/api/ai/*` routes — provider-agnostic, model selection per use case |
| **Sessions** | Cloud session sync (subject-agnostic: stores JSON state per product) |
| **Progress** | Subject-agnostic progress tracking, aggregated parent dashboard |
| **Design System** | Shared UI components, themes, glassmorphism cards, responsive layout |
| **i18n** | Translation infrastructure (each product adds its own strings) |

### What's Product-Specific

Each product owns its own domain logic:

| CrackTheX (Math) | study-helper (Languages, History) |
|-------------------|-----------------------------------|
| nerdamer solver engine | Artifact/content system |
| Step cards, action buttons | Flash cards, Q&A modes |
| KaTeX rendering | Vocabulary pair rendering |
| Word problem decomposition | Curriculum/textbook alignment |
| Math-specific AI prompts | Language-specific AI prompts |
| Equation OCR (Mathpix) | Content creation pipeline |

### Build Order

1. **Now**: Build shared platform layer + CrackTheX math workspace. Platform layer starts minimal — only what math needs. But structured as reusable packages.
2. **Later**: Build study-helper on the same foundation. Auth, billing, AI budget, parent dashboard — already done. Only subject-specific features needed.
3. **Eventually**: Both products accessible from either domain. One subscription unlocks AI across all subjects.

### This Spec's Focus

**This document focuses on the CrackTheX math workspace.** The shared platform components are designed with generalization in mind, but only built to the depth that the math product requires for its MVP. study-helper will extend them when the time comes.

---

## Product Architecture: CrackTheX Math Workspace

### Approach: Math Workspace with AI Co-Pilot

A workspace layout within the broader platform. Multiple tools (tabs) share a common shell. AI is woven through the tools contextually, not isolated in a single feature.

For simple questions ("solve 2x+3=7", "what is a variable?"), the AI Tutor chat tab handles everything conversationally. For deeper work (step-by-step solving, interactive manipulation), the Solver tab provides the structured experience with AI available as a co-pilot.

### Workspace Tabs

| Tab | Description | Phase |
|-----|-------------|-------|
| **Solver** | Step-by-step equation solving with action buttons, hints, and contextual AI | MVP |
| **AI Tutor** | Conversational math tutoring chat interface | MVP |
| **Practice** | Equation exercises — deterministic generation (free), AI-powered adaptive (Pro) | MVP (basic), Phase 2 (adaptive) |
| **Notebook** | Math scratch pad with AI assistance, save/export | Phase 3 |

### Design Principles (carried from v1)

1. Show the process, not just the answer
2. One step at a time — manage cognitive load
3. Student controls the pace — hints available, never forced
4. No login wall for the free tier — works immediately
5. Offline-first for the free deterministic solver
6. Hungarian first, but multilingual from day one
7. Free tier must be genuinely good — no nagware, no crippled UX. It's an investment in future paid users

---

## Tier Structure

MVP launches with two visible tiers. Signing up is free and unlocks account features (cloud sync, parent dashboard). The pricing page shows only "Free" and "Pro."

| Tier | Price | AI Budget | Key Features |
|------|-------|-----------|-------------|
| **Free** (no account) | $0 | None | Deterministic solver (1-var, 2-3 var linear), basic practice mode (deterministic), localStorage sessions, all themes/languages, keyboard input |
| **Free** (with account) | $0 | None | Everything above + Camera OCR (registration hook) + cloud session sync + optional parent dashboard visibility. Not a separate named tier — just what accounts get. |
| **Pro** | ~$10/month | ~500k tokens/month, daily caps | All AI features: AI Tutor chat, "Ask AI why?", word problem decomposition + solving, quadratic solving, AI-powered adaptive practice. 7-day free trial. |

**Future tier (post-launch, if needed):**

| Tier | Price | AI Budget | Key Features |
|------|-------|-----------|-------------|
| **Master** | ~$20/month | Much higher limits (soft caps) | All Pro features, Socratic mode, Notebook, priority. "Unlimited feel" with safety caps in fine print. Only add this when usage data shows demand for a higher tier. |

**Cost philosophy**:
- Free tier has zero AI cost — deterministic solver and deterministic practice run client-side
- Pro has controlled budget with per-user daily caps
- No truly unlimited tier — all tiers have safety caps to prevent abuse
- 7-day free trial of Pro lowers the barrier for uncertain parents

**Future monetization options (post-launch, data-driven):**
- Credit packs for occasional users ("20 AI questions for 500 HUF") — only if usage data shows demand
- Annual pricing ($80/year vs $10/month) — standard discount for commitment
- BYOK (Bring Your Own Key) for power users — deferred

---

## Accounts & Onboarding

### Two-Path Onboarding

**Student path** (frictionless):
1. Land on solver — no signup required
2. Type or paste an equation → see it solved step by step (aha moment in 15 seconds)
3. Try practice mode → solve generated equations
4. Registration triggers: "Use your camera to scan equations" (primary hook, especially on mobile) or "Save your work across devices" (cloud sync)
5. Account is free, unlocks camera OCR + cloud sync

**Parent path** (conversion-focused):
1. Land on parent-oriented page: "See how your child learns math"
2. Demo solve + sample parent dashboard mockup: "Your child solved 14 equations this week, accuracy up 15%"
3. Sign up → create account → add child (or child links their existing account)
4. 7-day free Pro trial starts automatically

### Account Structure

Accounts are flexible — no rigid parent-child hierarchy:

| Scenario | How it works |
|----------|-------------|
| Young student (10-13) | Parent creates child account, sees progress dashboard |
| Teen (14-16), involved parent | Student has own account, optionally links to parent. Parent sees progress only with student consent |
| Teen (14-16), hands-off parent | Parent pays via their own account (subscription covers linked child). No progress monitoring required |
| Older teen (17-18) | Student has own account, subscribes themselves. No parent involved |
| Student from school | Student creates own account. No parent needed |

**Key principle**: Parent linking is always optional, never required. A student account works fully without any parent connected. Any account can subscribe to Pro independently.

### Parent Dashboard (MVP — Minimal)

For parents who opt in to see their child's progress:
- Child's name and account status
- Equations solved this week (count)
- Practice sessions completed (count)
- Accuracy trend (simple 4-week line chart)
- Weekly progress summary email (automated)

This dashboard is the primary tool for keeping parents paying. It answers: "Is my child actually using this, and is it working?"

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
| Text input → equation decomposition | — | Yes | MVP |
| Full AI solving + synthesis | — | Yes | MVP |
| Connected sub-problem explanation | — | Yes | Phase 2 |

### Practice Mode

| Feature | Free | Pro | Phase |
|---------|------|-----|-------|
| Deterministic equation generation (3 difficulty levels) | Yes | Yes | MVP |
| Student solves with action buttons, pass/fail feedback | Yes | Yes | MVP |
| No hints in practice — solver available for learning | Yes | Yes | MVP |
| AI-powered adaptive difficulty | — | Yes | Phase 2 |
| AI-generated word problems for practice | — | Yes | Phase 2 |
| Detailed AI feedback on student's approach | — | Yes | Phase 2 |

### Input

| Feature | Free (no account) | Free (with account) | Pro | Phase |
|---------|-------------------|--------------------|----|-------|
| Keyboard + LaTeX + plain text | Yes | Yes | Yes | MVP |
| Camera OCR (Mathpix, server-side) | — | Yes | Yes | MVP |

Camera OCR is the primary registration hook. Typing equations on mobile is painful; camera makes it effortless. Making OCR free-with-account gives students a compelling reason to sign up without being asked to pay. OCR cost per use is low (Mathpix).

### Platform

| Feature | Free | Pro | Phase |
|---------|------|-----|-------|
| Local sessions (localStorage) | Yes | Yes | MVP |
| Cloud session sync (requires account) | Yes | Yes | MVP |
| Parent dashboard (optional linking) | Yes | Yes | MVP |
| Themes (chalkboard, whiteboard, dark) | Yes | Yes | MVP |
| Languages (HU, EN, DE) | Yes | Yes | MVP |
| Usage dashboard & token budget | — | Yes | MVP |
| Progress tracking & stats | Yes (basic) | Yes (detailed) | MVP (basic), Phase 2 (detailed) |
| Weekly progress email to parent | Yes | Yes | MVP |
| Notebook / scratch pad | — | Yes | Phase 3 |
| Community marketplace | — | Yes | Phase 3+ |

---

## Technical Architecture

### System Diagram

```
              crackthex.app          [platform].app
                    │                       │
                    ▼                       ▼
┌─────────────────────────────────────────────────────┐
│              Vercel Platform (single deployment)     │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │  Middleware: hostname → defaultSubject routing  │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │         Next.js App (apps/web)                  │   │
│  │                                                  │   │
│  │  (marketing)/  - Landing pages (domain-aware)    │   │
│  │  (auth)/       - Login, register, OAuth          │   │
│  │  (workspace)/                                    │   │
│  │    ├── math/   - CrackTheX solver + tutor        │   │
│  │    └── .../    - Future subject workspaces        │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │  API Routes (packages/platform + packages/ai)   │   │
│  │                                                  │   │
│  │  /api/auth/*     - Auth (shared)                 │   │
│  │  /api/ai/*       - LLM proxy + budget (shared)   │   │
│  │  /api/sessions/* - CRUD + sync (shared)          │   │
│  │  /api/billing/*  - Stripe webhooks (shared)      │   │
│  │  /api/math/ocr/* - Mathpix proxy (math-specific) │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │         PostgreSQL (Vercel Postgres)             │   │
│  │                                                  │   │
│  │  Shared: users, subscriptions, token_usage,      │   │
│  │          progress                                 │   │
│  │  Math:   math_sessions, equations, chat_history   │   │
│  │  Future: artifacts, lessons, test_results         │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
   Anthropic API          Mathpix API
   (AI features)          (OCR)
```

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | SSR for landing/SEO, client components for workspace |
| Styling | Tailwind CSS | Rapid UI, theming with CSS variables |
| Math rendering | KaTeX | Carried from v1, client-side |
| Deterministic solver | nerdamer (ported) | Client-side, zero backend cost |
| Auth | Existing Vercel auth setup | OAuth (Google, GitHub) + email/password |
| Database | PostgreSQL (Vercel Postgres) | Sessions, users, subscriptions, token usage |
| ORM | Drizzle | Type-safe, lightweight |
| Payments | Stripe | Subscriptions, webhooks, customer portal |
| AI | Anthropic API (Claude) | Math reasoning, multi-language |
| OCR | Mathpix API (server-side) | LaTeX from images, keys stay on server |
| Animations | Framer Motion | React-idiomatic replacement for GSAP |
| Image cropping | react-cropper (Cropper.js v1.6.2) | Thin React wrapper |

### Key Architectural Decisions

1. **Monorepo with shared platform layer** — Turborepo monorepo separates shared concerns (auth, billing, AI, UI) into reusable packages. Math-specific logic lives in the app. This enables building the study-helper later without rebuilding infrastructure.

2. **Two domains, one deployment** — `crackthex.app` and `[platform].app` both point to the same Vercel deployment. Middleware routes based on hostname. One account, one subscription works everywhere.

3. **Solver runs client-side** — The nerdamer-based deterministic solver is ported as a Next.js client-side utility module. Zero backend cost, works instantly, works offline for free-tier users.

4. **AI goes through the backend** — All LLM calls route through `/api/ai/*` where token budgets, rate limits, and tier checks are enforced. Users never talk to an LLM directly.

5. **OCR moves server-side** — Mathpix API keys stay on the server. Solves the exposed-keys problem from v1. Available to all registered users (free with account) as the primary registration hook. Cost per use is low.

6. **Auth is optional** — Free tier works without any account (localStorage only, like v1). Signing up unlocks cloud sync as a bonus. Required for paid tiers.

7. **Unified app for all tiers** — One Next.js app, one codebase, one deployment. Feature flags control what's visible/enabled per tier. Same UI shell for everyone.

8. **localStorage persists for free** — Even logged-in users have localStorage as a fallback. Cloud sync supplements but doesn't replace local persistence.

9. **Subject-agnostic shared tables** — DB schema separates shared tables (users, subscriptions, token_usage, progress) from product-specific tables (math_sessions, equations). New products add their own tables without touching the shared schema.

### Database Schema

**Shared tables (packages/platform):**

| Table | Purpose |
|-------|---------|
| `users` | Auth profile, current tier, preferences (theme, language) |
| `account_links` | Optional parent-child relationships (parent_id, child_id, consent status) |
| `subscriptions` | Stripe subscription state, tier, billing cycle |
| `token_usage` | Daily/monthly AI token tracking per user (subject-agnostic) |
| `progress` | Subject-agnostic progress records (subject, score, timestamp, session_count) |

**Math-specific tables (apps/web, math context):**

| Table | Purpose |
|-------|---------|
| `math_sessions` | Cloud-synced equation sessions (solver state, steps) |
| `math_practice` | Practice session results (difficulty, equation, pass/fail, timestamp) |
| `equations` | Solved equations with steps (caching, analytics) |
| `math_chat_history` | Math AI Tutor conversation threads per user |

**Future tables (study-helper, added later):**

| Table | Purpose |
|-------|---------|
| `artifacts` | Curriculum-aligned lesson content (vocab, grammar, terms) |
| `lessons` | Lesson units with structured content |
| `test_results` | Student test scores and answer history |

### Project Structure (Monorepo)

```
study-platform/                     # Monorepo root (Turborepo)
├── packages/
│   ├── platform/                   # Shared platform layer
│   │   ├── auth/                   # Auth utilities, middleware, session
│   │   ├── billing/                # Stripe integration, tier checks
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle schema (shared tables)
│   │   │   └── queries.ts          # Common queries
│   │   ├── progress/               # Subject-agnostic progress tracking
│   │   └── sessions/               # Cloud session sync (generic JSON state)
│   ├── ai/                         # Shared AI layer
│   │   ├── proxy.ts                # LLM provider abstraction
│   │   ├── budget.ts               # Token tracking & enforcement
│   │   └── rate-limit.ts           # Per-user rate limiting
│   └── ui/                         # Shared design system
│       ├── components/             # Glass cards, buttons, inputs, layout
│       ├── themes/                 # Chalkboard, whiteboard, dark
│       └── i18n/                   # Translation infrastructure
│
├── apps/
│   └── web/                        # Next.js app (single deployment)
│       ├── app/
│       │   ├── (marketing)/        # Landing pages (domain-aware)
│       │   │   ├── page.tsx        # Hero + features (adapts to domain)
│       │   │   └── pricing/page.tsx
│       │   ├── (auth)/             # Login, register, OAuth
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── (workspace)/        # Workspace shell
│       │   │   ├── layout.tsx      # Tabs, sidebar, nav (subject-aware)
│       │   │   ├── math/           # CrackTheX math workspace
│       │   │   │   ├── solver/page.tsx
│       │   │   │   ├── tutor/page.tsx
│       │   │   │   ├── practice/page.tsx   # Phase 2
│       │   │   │   └── notebook/page.tsx   # Phase 3
│       │   │   └── ...             # Future subject workspaces
│       │   └── api/
│       │       ├── auth/[...]/route.ts     # Uses packages/platform
│       │       ├── ai/
│       │       │   ├── explain/route.ts    # Uses packages/ai
│       │       │   ├── chat/route.ts
│       │       │   └── decompose/route.ts
│       │       ├── math/
│       │       │   └── ocr/route.ts        # Mathpix (math-specific)
│       │       ├── sessions/route.ts       # Uses packages/platform
│       │       └── billing/route.ts        # Uses packages/platform
│       ├── lib/
│       │   └── math/                       # Math-specific logic
│       │       ├── solver/
│       │       │   ├── engine.ts           # Core solve logic (ported)
│       │       │   ├── utils.ts            # LaTeX/nerdamer conversions
│       │       │   ├── multi-var.ts        # 2-3 var linear systems
│       │       │   └── types.ts
│       │       ├── ai/
│       │       │   ├── prompts.ts          # Math-specific AI prompts
│       │       │   └── verify.ts           # Cross-check AI vs nerdamer
│       │       └── i18n/                   # Math-specific translations
│       ├── components/
│       │   ├── math/                       # Math-specific UI
│       │   │   ├── solver/                 # Step cards, actions, hints
│       │   │   ├── tutor/                  # Math chat interface
│       │   │   └── workspace/              # Math workspace layout
│       │   └── marketing/                  # Landing page sections
│       ├── middleware.ts                    # Domain → subject routing
│       └── public/
│           ├── icons/
│           └── manifest.json
│
└── tooling/                        # Shared config
    ├── eslint/
    ├── tsconfig/
    └── tailwind/
```

**Key structural decisions:**
- `packages/*` are reusable across products — auth, billing, AI budget, design system
- `apps/web/lib/math/` contains all math-specific logic — solver, prompts, verification
- `apps/web/components/math/` contains all math-specific UI — step cards, action buttons
- `middleware.ts` reads hostname (crackthex.app vs [platform].app) and sets routing context
- Future products add their own `lib/[subject]/` and `components/[subject]/` directories

---

## AI Integration

### Two AI Modes

**1. Contextual AI — "Ask AI why?"**
- Triggered from a button on each solver step card
- Input: equation, current step, previous step, applied rule, student's language
- Output: 2-3 sentence explanation of why this step works
- Short prompt, short response, cheap per interaction
- Most common AI interaction in the product

**2. AI Tutor Chat**
- Full conversational interface in the AI Tutor tab
- Math-tutor-specialized system prompt: teaches rather than just answers, uses student's language, follows Hungarian curriculum conventions
- Chat history persisted per user in PostgreSQL
- Can call the deterministic solver as a verification tool

### Word Problem Pipeline

1. Student inputs natural language description (Pro feature)
2. AI identifies variables, constraints, relationships
3. AI generates connected equations, each displayed as a step card
4. AI solves fully, synthesizes results, explains connections back to original problem
5. Phase 2: deeper explanation of sub-problem relationships, connected sub-problems

### LLM Strategy

- Start with Claude (Anthropic API)
- Backend abstracts the provider — can swap models or use different models per use case
- Cheaper/smaller models for contextual "Ask AI why?" (e.g., Haiku)
- Larger models for full tutoring and word problem decomposition (e.g., Sonnet)
- Architecture supports adding providers later

### Token Budget Enforcement

```
Request → /api/ai/* → Verify auth → Check tier
→ Check monthly token usage against tier limit
→ Check daily interaction cap
→ If over budget: return upgrade prompt (graceful degradation to free features)
→ If under budget: call LLM → log tokens used → return response
```

### Cost Optimization

- **Prompt caching**: Common step explanations cached by (rule + equation_type). Many students ask similar questions about similar steps.
- **Model tiering**: Cheaper models for simple contextual queries, expensive models only for complex tutoring.
- **Pre-generation**: Practice mode exercises can be generated in batches and cached, not real-time per user.
- **Rate limiting**: Per-user daily caps even within paid tiers.

### Math Accuracy Safeguard

LLMs can hallucinate math. For any AI-generated equation or solution step:
1. Parse the AI's mathematical output
2. Cross-check against nerdamer (or equivalent symbolic engine)
3. If AI says "x = 5" but nerdamer says "x = 4", flag it and fall back to deterministic solution
4. This is a key differentiator vs generic ChatGPT — verified answers

---

## Multi-Variable Solving

### Hybrid Approach

- **Deterministic (free tier)**: 2-3 variable linear systems. Substitution and elimination methods, step-by-step. Covers the secondary school curriculum.
- **AI-powered (Pro+)**: 4+ variable systems, non-linear systems, mixed systems. AI generates step-by-step explanations.

### Deterministic 2-3 Var Solver

Extends the current single-variable engine:
1. Display the system of equations
2. Choose elimination variable (show the choice as an alternative path)
3. Eliminate one variable → reduced system
4. Solve the reduced system (reuses 1-var or 2-var solver)
5. Back-substitute to find remaining variables
6. Verify all solutions against original system

---

## Unified UI/UX

### One App, All Tiers

Free and paid users see the same workspace shell. Differences:
- Locked features show a subtle PRO badge and upgrade prompt on click
- AI Tutor tab visible to all, but free users see a preview/demo state
- Feature flags control enabled state per tier — no separate codebases
- The free tier must not feel crippled — solver + practice is a genuine product

### Homework Copying Mitigation

CrackTheX can't prevent copying (students have ChatGPT, Photomath, etc.) but the UX encourages learning:
- **Solver**: Steps revealed one at a time via "Next Step" button. "Show All" exists but is de-emphasized
- **Practice mode**: No hints, no "Show All." Student uses action buttons to solve, gets pass/fail. If stuck, they switch to the Solver to learn from a similar equation, then return to practice
- **Natural flow**: Practice → get stuck → learn from Solver → return to Practice. This IS studying.

### Visual Identity

Carry the current CrackTheX aesthetic into the Next.js rebuild:
- Three themes: Chalkboard (default), Whiteboard, Dark
- Glassmorphism cards, blur effects, semi-transparent backgrounds
- KaTeX math rendering throughout
- Framer Motion for step card animations and transitions
- Figtree + JetBrains Mono typography

### Input Contexts

Three input methods serve different contexts:
1. **Camera OCR** — Existing equations from homework/textbook. Requires free account. Especially valuable on mobile where typing equations is painful.
2. **Keyboard** — Custom equations, LaTeX, plain text. Works everywhere, no account needed. Primary input on desktop.
3. **Practice mode** — Generated equations. No input friction at all. Works everywhere.

### Responsive Design

Browser-first, mobile-friendly. Not a mobile-only app — students use phones, tablets, and school laptops interchangeably.

- Desktop: full workspace with sidebar visible
- Tablet: collapsible sidebar, full workspace
- Mobile: bottom tab navigation, drawer sidebar, optimized step cards

### Practice Mode UX

- Defaults to Medium difficulty — one tap to start, no forced selection
- Difficulty selector visible but not blocking (Easy / Medium / Hard)
- Three difficulty levels map to different equation structures, not just different numbers:
  - **Easy**: `ax + b = c` (single operation)
  - **Medium**: `a(x + b) = c` or `ax + b = cx + d` (parentheses or variable on both sides)
  - **Hard**: `a(b(x + c) + d) = e` (nested, divide-first opportunities, multiple steps)
- No hints in practice — if stuck, switch to Solver to learn from a similar equation

### Competitive Positioning

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

## Phasing

### v1 Transition

The current vanilla JS app (GitHub Pages) is retired when v2 launches. No parallel maintenance of two stacks. There will be a gap while v2 is built — this is acceptable given the small current user base. v2 must have at least free-tier feature parity (solver + session history) before the old URL redirects.

### MVP — Wave-Based Shipping

The MVP is large. Rather than one big-bang launch, ship in waves (each 1-2 weeks). Each wave is testable independently. User feedback informs the next wave.

**Wave 1 — Core Solver (soft launch):**
- Next.js workspace shell — tabs, sidebar, responsive layout, 3 themes, Hungarian language
- Solver tab — deterministic engine (1-var linear), step cards, action buttons, hints
- Basic practice mode — 3 difficulty levels with structured templates, one-tap start
- Landing page
- No auth, no backend — pure client-side (like v1 but in Next.js)
- Goal: validate the solver works, gather initial feedback from 10-20 people

**Wave 2 — Registration & Input:**
- Auth (OAuth + email/password)
- Camera OCR (free with account — the registration hook)
- Cloud session sync
- 2-3 var linear systems in solver
- English + German language support
- Goal: test registration flow, validate camera OCR as conversion trigger

**Wave 3 — Monetization & AI:**
- Stripe integration, Pro tier ($10/month), 7-day free trial
- AI Tutor chat tab
- "Ask AI why?" on solver steps
- Word problem decomposition + full AI solving
- Quadratic solving via AI
- Token budget system
- AI math verification (cross-check against nerdamer)
- Goal: first paying users, validate AI features

**Wave 4 — Retention:**
- Parent dashboard (minimal — activity count, accuracy trend, weekly email)
- Account linking (parent-child, optional)
- Two-path onboarding (student-first vs parent-first landing)
- Usage dashboard for Pro users
- Goal: validate parent retention, test the buyer ≠ user hypothesis

### MVP Full Feature List

**Workspace & Core:**
1. Next.js workspace shell — tabs, sidebar, responsive layout, 3 themes, 3 languages
2. Solver tab — deterministic engine (1-var + 2-3 var linear), step cards, action buttons, hints (steps revealed one at a time, "Show All" de-emphasized)
3. AI Tutor tab — chat interface, math-specialized prompts, conversation history
4. Practice tab (basic) — deterministic equation generation at 3 structured difficulty levels, student solves with action buttons, pass/fail feedback, no hints (free tier, zero AI cost)

**AI Features (Pro):**
5. "Ask AI why?" — contextual AI on solver steps
6. Word problem decomposition + full AI solving and synthesis
7. Quadratic step-by-step solving via AI
8. AI math verification — cross-check AI answers against nerdamer

**Input:**
9. Keyboard + LaTeX + plain text (free, no account)
10. Camera OCR — Mathpix server-side proxy (free with account)

**Platform:**
11. Auth — OAuth + email/password, optional for free tier. Two-path onboarding (student-first vs parent-first)
12. Account linking — parent-child optional, flexible (see Account Structure section)
13. Parent dashboard (minimal) — equations solved, practice sessions, accuracy trend, weekly email
14. Cloud session sync — for logged-in users
15. Stripe subscriptions — Free + Pro ($10/month), 7-day free trial
16. Token budget system — usage tracking, limits, dashboard
17. Landing page — hero, features, pricing

### Phase 2 (Incremental Additions)

1. AI-powered adaptive practice — difficulty adjusts to student's weak spots, AI-generated word problems for practice, detailed AI feedback on approach (Pro)
2. Socratic mode — AI guides instead of answers (Pro)
3. N-variable / non-linear systems via AI (Pro)
4. Full word problem synthesis — connected sub-problem explanation
5. Detailed progress tracking — solve history, accuracy stats, difficulty curve visualization
6. Credit packs — alternative to subscription for occasional users (only if usage data supports it)
7. Master tier — higher limits, additional features (only if usage data shows demand)
8. Annual pricing option ($80/year vs $10/month)

### Phase 3+ (Future — Math)

- Notebook / scratch pad (Master)
- Community marketplace — post problems, AI or humans solve for credit
- BYOK (Bring Your Own Key) for power users
- Export/share solutions (PDF, link)
- Mobile native apps (Capacitor)

### Platform Expansion (Parallel Track — After Math MVP)

- **study-helper product**: Curriculum-aligned study preparation (German, English, History)
  - Artifact-based content system (lessons organized by textbook chapters)
  - Flash cards, Q&A, mixed practice modes
  - AI-evaluated answers (partial credit, explanation)
  - Content creation pipeline (photo → AI extraction → review → publish)
  - Reuses entire shared platform layer (auth, billing, AI budget, progress)
- **[platform-name].app domain**: Subject picker landing, unified dashboard
- **Parent dashboard**: Aggregated view across all subjects (math + languages + history)
- **Teacher dashboard**: Read-only class aggregate view, team join codes
- **Community curation**: Usage feedback drives content quality, best materials rise

See `external/product-brief-study-helper-20260222.md` and `external/brainstorming-session-2026-02-15.md` for the full study-helper design context.

---

## Growth & Acquisition

### First 100 Users

No paid ads. Word-of-mouth only. The free tier IS the acquisition strategy.

1. **Personal network** (10-20 users) — Share with friends, family, colleagues with school-age kids
2. **Hungarian tech communities** (20-30) — Post in r/hungary, prog.hu: "I built an open-source math solver for Hungarian students"
3. **One targeted Facebook parent group** (50-100) — After having a real testimonial from own usage. Genuine parent sharing a tool, not marketing
4. **ProductHunt / Hacker News** — For portfolio visibility in tech communities

**Prerequisite**: Use it yourself (or with own kids/family) first, get a real result, THEN share. The testimonial is the marketing.

### Growth Funnel

```
Student finds CrackTheX (peer, parent, teacher)
    ↓
Uses free solver — aha moment (15 seconds)
    ↓
Wants camera input → creates free account (registration hook)
    ↓
Uses for months/years on free tier (age 13-15, linear equations)
    ↓
Math gets harder (age 16+, quadratics, word problems)
    ↓
Free solver can't help → tries Pro (7-day trial)
    ↓
Parent pays $10/month → sees dashboard → keeps paying
```

### Economics

At 10,000 users / 2% conversion (200 Pro users):
- Revenue: ~$2,000/month
- AI costs (200 users × ~500k tokens): ~$25-50/month
- Vercel hosting: ~$20/month
- PostgreSQL: ~$20-50/month
- Mathpix OCR: ~$10-20/month
- **Total infrastructure: under $150/month. Margins are excellent.**
- Free users cost nearly nothing (client-side solver, minimal bandwidth)

---

## What This Portfolio Demonstrates

> "I built a complete, production-grade AI product from concept to deployment — and designed it as a platform that scales to multiple subjects."

- **Architecture**: Turborepo monorepo, shared platform packages, multi-domain single deployment
- **Frontend**: Next.js App Router, Tailwind, Framer Motion, KaTeX, responsive design
- **Backend**: Vercel serverless API routes, PostgreSQL, Drizzle ORM
- **AI**: Anthropic API integration, prompt engineering, token budget management, math verification, multi-model strategy
- **Payments**: Stripe subscriptions, freemium model with free trial, webhook handling
- **Auth**: OAuth + email/password, optional auth for free tier, flexible parent-child account linking
- **Product thinking**: Buyer ≠ user analysis, two-path onboarding, parent dashboard for retention, age-based growth funnel, homework-copying UX mitigation
- **Domain**: Mathematical symbolic computation (nerdamer), OCR integration, word problem decomposition, multi-language
- **Infrastructure**: Vercel deployment, PWA, offline-first free tier

---

## Appendix: Team Simulation Findings

This spec was refined through 4 rounds of simulated team conversation with 8 stakeholders: primary school teacher (Katalin), high school teacher (Gergő), struggling student (Bence), strong student (Lilla), parent (András), sales/marketing (Réka), UI/UX (Dávid), and mediator (Zsófi).

### Round 1 — Core Value & Product Shape
1. **Buyer ≠ user**: Parents pay, students use. Two-path onboarding and parent dashboard added to MVP.
2. **Word problems are the killer feature**: For struggling students AND advanced students. Lead marketing feature.
3. **Practice mode → MVP**: Basic deterministic practice (free, no AI cost) transforms product from "calculator" to "tutor."
4. **Two tiers, not four**: Simplified to Free + Pro. Pricing page shows two options.
5. **Free tier must be genuinely good**: No nagware. Investment in age-based growth funnel.

### Round 2 — Onboarding & Monetization
6. **Two-path onboarding**: Students → instant solve (no signup). Parents → demo dashboard + pricing.
7. **Parent linking is optional**: Supports involved parents, hands-off parents, and independent teens equally.
8. **7-day free trial**: Lower barrier than credit packs. Credit packs deferred to post-launch.
9. **Homework copying mitigation via UX**: One-step reveal, no hints in practice, practice→solver→practice flow.
10. **$10/month Pro pricing**: Less than one hour of tutoring (10,000 HUF). No-brainer for parents.

### Round 3 — Differentiation & Growth
11. **Differentiation vs Photomath is clear**: Interactive, AI-tutored, verified, Hungarian-first, parent visibility, word problems.
12. **Competitive tagline**: "Photomath shows you the answer. CrackTheX teaches you how to get there."
13. **Acquisition is word-of-mouth**: No paid ads. Students find through peers, parents through Facebook groups.
14. **Practice mode needs structured templates**: Three levels map to different equation structures, not just bigger numbers.
15. **Economics are favorable**: 10K users / 2% conversion = ~$2K revenue vs ~$150 infrastructure.

### Round 4 — Shipping & Practical Decisions
16. **Browser-first, mobile-friendly**: Not mobile-only. Students use phones, tablets, and laptops interchangeably.
17. **Camera OCR is the registration hook**: Free with account. Typing equations on mobile is painful; camera makes it effortless. Best conversion trigger.
18. **Ship in waves**: Wave 1 (solver), Wave 2 (auth + OCR), Wave 3 (AI + billing), Wave 4 (parent dashboard). Each 1-2 weeks.
19. **No parallel v1**: Clean cut to v2. No maintaining two stacks.
20. **General-purpose AI prompts for MVP**: No teacher-mandated pedagogy. Teacher-configurable teaching style is Phase 3+ when classroom features exist.
21. **Platform name deferred**: CrackTheX is the only brand for now. Platform name decided when study-helper starts.
22. **If it fails, investment isn't wasted**: Shared platform layer serves study-helper. Code is a portfolio asset.
