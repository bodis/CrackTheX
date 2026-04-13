# CrackTheX v2 — Math AI Platform Design Spec

## Overview

CrackTheX evolves from a vanilla JS equation solver PWA into a full-stack AI math tutoring platform. The product is rebuilt in Next.js on Vercel, with a PostgreSQL backend, Stripe subscriptions, and AI-powered tutoring via the Anthropic API.

**Primary goal**: Portfolio showcase demonstrating full-stack AI product development — frontend, backend, auth, database, AI integration, payments.

**Secondary goal**: Viable freemium product. Not expected to be highly profitable, but designed so it doesn't cost money to run at the free tier.

**Core audience**: Hungarian secondary school students (12-18), widening slightly to older students and international users.

---

## Broader Platform Context

CrackTheX is the first product in a broader AI-powered study platform for Hungarian students. A second product — a curriculum-aligned study helper covering languages (German, English), history, and other subjects — will be built later on the same shared foundation.

### Two Products, One Platform

```
crackthex.app            →  Math-first experience (solver is primary)
[platform-name].app      →  Subject picker (math, German, English, ...)
                              Both route to the same Next.js deployment
```

- **crackthex.app**: Lands directly in the math workspace. Marketed as "AI-powered math tutor." Users may never know the broader platform exists.
- **[platform-name].app**: Lands on a subject picker or dashboard. Math, German, English, History — all accessible. Marketed as "AI study platform for Hungarian students."
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
| **Practice** | AI-generated exercises with adaptive difficulty and progress tracking | Phase 2 |
| **Notebook** | Math scratch pad with AI assistance, save/export | Phase 3 |

### Design Principles (carried from v1)

1. Show the process, not just the answer
2. One step at a time — manage cognitive load
3. Student controls the pace — hints available, never forced
4. No login wall for the free tier — works immediately
5. Offline-first for the free deterministic solver
6. Hungarian first, but multilingual from day one

---

## Tier Structure

| Tier | Price | AI Budget | Key Features |
|------|-------|-----------|-------------|
| **Free** | $0, no account | None | Deterministic solver (1-var, 2-3 var linear), localStorage sessions, all themes/languages, keyboard input |
| **Starter** | $0, account required | ~10k tokens/month | Cloud sync, Camera OCR, word problem decomposition (text → equations, student solves manually), limited "Ask AI why?" |
| **Pro** | ~$5/month | ~500k tokens/month | Full AI Tutor chat, full word problem solving + synthesis, AI-enhanced solver (quadratic, complex), error analysis, practice mode (Ph2), daily caps |
| **Master** | ~$20/month | Much higher limits (soft caps) | All Pro features, Socratic mode (Ph2), Notebook (Ph3), priority, all future features. "Unlimited feel" with safety caps in fine print |

**Cost philosophy**:
- Free tier has zero AI cost — deterministic solver runs client-side
- Starter has near-zero cost — small token budget, OCR is low-volume
- Pro and Master have controlled budgets with per-user daily caps
- No truly unlimited tier — all tiers have safety caps to prevent abuse

**BYOK (Bring Your Own Key)**: Deferred. Not in initial build. Architecture should support adding it later as a power-user option.

---

## Feature Map

### Solver

| Feature | Free | Starter | Pro | Master | Phase |
|---------|------|---------|-----|--------|-------|
| 1-var linear step-by-step (deterministic) | Yes | Yes | Yes | Yes | MVP |
| 2-3 var linear systems (deterministic) | Yes | Yes | Yes | Yes | MVP |
| Action buttons (add/sub/mul/div/expand/simplify) | Yes | Yes | Yes | Yes | MVP |
| Quadratic step-by-step (AI) | — | — | Yes | Yes | MVP |
| "Ask AI why?" on steps | — | Budget | Yes | Yes | MVP |
| N-var / non-linear systems (AI) | — | — | Yes | Yes | Phase 2 |

### AI Tutor

| Feature | Free | Starter | Pro | Master | Phase |
|---------|------|---------|-----|--------|-------|
| Full chat tutoring | — | — | Yes | Yes | MVP |
| Error analysis ("why is this wrong?") | — | — | Yes | Yes | MVP |
| Socratic mode (guided, not answers) | — | — | — | Yes | Phase 2 |

### Word Problem Solver

| Feature | Free | Starter | Pro | Master | Phase |
|---------|------|---------|-----|--------|-------|
| Text input → equation decomposition | — | Yes | Yes | Yes | MVP |
| Student solves decomposed equations manually | — | Yes | Yes | Yes | MVP |
| Full AI solving + synthesis | — | — | Yes | Yes | MVP |
| Connected sub-problem explanation | — | — | Yes | Yes | Phase 2 |

### Input

| Feature | Free | Starter | Pro | Master | Phase |
|---------|------|---------|-----|--------|-------|
| Keyboard + LaTeX + plain text | Yes | Yes | Yes | Yes | MVP |
| Camera OCR (Mathpix, server-side) | — | Yes | Yes | Yes | MVP |

### Platform

| Feature | Free | Starter | Pro | Master | Phase |
|---------|------|---------|-----|--------|-------|
| Local sessions (localStorage) | Yes | Yes | Yes | Yes | MVP |
| Cloud session sync | — | Yes | Yes | Yes | MVP |
| Themes (chalkboard, whiteboard, dark) | Yes | Yes | Yes | Yes | MVP |
| Languages (HU, EN, DE) | Yes | Yes | Yes | Yes | MVP |
| Usage dashboard & token budget | — | Yes | Yes | Yes | MVP |
| Practice mode (adaptive exercises) | — | — | Yes | Yes | Phase 2 |
| Progress tracking & stats | — | — | Yes | Yes | Phase 2 |
| Notebook / scratch pad | — | — | — | Yes | Phase 3 |
| Community marketplace | — | — | Yes | Yes | Phase 3+ |

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

5. **OCR moves server-side** — Mathpix API keys stay on the server. Solves the exposed-keys problem from v1. Becomes a paid-tier feature (Starter+).

6. **Auth is optional** — Free tier works without any account (localStorage only, like v1). Signing up unlocks cloud sync as a bonus. Required for paid tiers.

7. **Unified app for all tiers** — One Next.js app, one codebase, one deployment. Feature flags control what's visible/enabled per tier. Same UI shell for everyone.

8. **localStorage persists for free** — Even logged-in users have localStorage as a fallback. Cloud sync supplements but doesn't replace local persistence.

9. **Subject-agnostic shared tables** — DB schema separates shared tables (users, subscriptions, token_usage, progress) from product-specific tables (math_sessions, equations). New products add their own tables without touching the shared schema.

### Database Schema

**Shared tables (packages/platform):**

| Table | Purpose |
|-------|---------|
| `users` | Auth profile, current tier, preferences (theme, language) |
| `subscriptions` | Stripe subscription state, tier, billing cycle |
| `token_usage` | Daily/monthly AI token tracking per user (subject-agnostic) |
| `progress` | Subject-agnostic progress records (subject, score, timestamp) |

**Math-specific tables (apps/web, math context):**

| Table | Purpose |
|-------|---------|
| `math_sessions` | Cloud-synced equation sessions (solver state, steps) |
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

1. Student inputs natural language description
2. AI identifies variables, constraints, relationships
3. AI generates connected equations, each displayed as a step card
4. Starter tier: student solves decomposed equations manually with the deterministic solver
5. Pro tier: AI solves fully, synthesizes results, explains connections back to original problem
6. Phase 2: deeper explanation of sub-problem relationships

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
- Locked features show a subtle badge (PRO/MASTER) and upgrade prompt on click
- AI Tutor tab visible to all, but free users see a preview/demo state
- Feature flags control enabled state per tier — no separate codebases

### Visual Identity

Carry the current CrackTheX aesthetic into the Next.js rebuild:
- Three themes: Chalkboard (default), Whiteboard, Dark
- Glassmorphism cards, blur effects, semi-transparent backgrounds
- KaTeX math rendering throughout
- Framer Motion for step card animations and transitions
- Figtree + JetBrains Mono typography

### Responsive Design

- Desktop: full workspace with sidebar visible
- Tablet: collapsible sidebar, full workspace
- Mobile: bottom tab navigation, drawer sidebar, optimized step cards

---

## Phasing

### MVP (First Deploy)

1. Next.js workspace shell — tabs, sidebar, responsive layout, 3 themes, 3 languages
2. Solver tab — deterministic engine (1-var + 2-3 var linear), step cards, action buttons, hints
3. AI Tutor tab — chat interface, math-specialized prompts, conversation history
4. "Ask AI why?" — contextual AI on solver steps
5. Word problem decomposition — text → equations (Starter), full AI solve (Pro)
6. Quadratic solving via AI (Pro+)
7. Camera OCR — Mathpix server-side proxy (Starter+)
8. Auth — OAuth + email/password, optional for free tier
9. Cloud session sync — for logged-in users
10. Stripe subscriptions — 3 tiers (Free, Pro, Master) — exact tier count to be finalized
11. Token budget system — usage tracking, limits, dashboard
12. Landing page — hero, features, pricing
13. AI math verification — cross-check against nerdamer

### Phase 2 (Incremental Additions)

1. Practice mode tab — AI-generated exercises, adaptive difficulty, progress tracking (Pro+)
2. Socratic mode — AI guides instead of answers (Master)
3. N-variable / non-linear systems via AI (Pro+)
4. Full word problem synthesis — connected sub-problem explanation
5. Progress tracking — solve history, accuracy stats, difficulty visualization

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

## What This Portfolio Demonstrates

> "I built a complete, production-grade AI product from concept to deployment — and designed it as a platform that scales to multiple subjects."

- **Architecture**: Turborepo monorepo, shared platform packages, multi-domain single deployment
- **Frontend**: Next.js App Router, Tailwind, Framer Motion, KaTeX, responsive design
- **Backend**: Vercel serverless API routes, PostgreSQL, Drizzle ORM
- **AI**: Anthropic API integration, prompt engineering, token budget management, math verification, multi-model strategy
- **Payments**: Stripe subscriptions, 3-tier freemium model, webhook handling
- **Auth**: OAuth + email/password, optional auth for free tier
- **Product**: Tiered feature gating, usage dashboards, progressive disclosure, multi-product platform
- **Domain**: Mathematical symbolic computation (nerdamer), OCR integration, multi-language
- **Infrastructure**: Vercel deployment, PWA, offline-first free tier
