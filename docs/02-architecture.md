# Technical Architecture

## System Diagram

```
              crackthex.app          [platform].app (future)
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
│  │         Next.js App (single project)            │   │
│  │                                                  │   │
│  │  (marketing)/  - Landing pages (domain-aware)    │   │
│  │  (auth)/       - Login, register, OAuth          │   │
│  │  (workspace)/                                    │   │
│  │    ├── math/   - CrackTheX solver + tutor        │   │
│  │    └── .../    - Future subject workspaces        │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │  API Routes (lib/platform + lib/math)           │   │
│  │                                                  │   │
│  │  /api/auth/*     - Auth (shared)                 │   │
│  │  /api/ai/*       - AI Gateway proxy (shared)     │   │
│  │  /api/sessions/* - CRUD + sync (shared)          │   │
│  │  /api/billing/*  - Stripe webhooks (shared)      │   │
│  │  /api/math/ocr/* - Mathpix proxy (math-specific) │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │         Neon Postgres (direct)                   │   │
│  │                                                  │   │
│  │  Shared: users, subscriptions, token_usage,      │   │
│  │          progress, account_links                  │   │
│  │  Math:   math_sessions, math_practice,            │   │
│  │          equations, math_chat_history              │   │
│  │  Future: artifacts, lessons, test_results         │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
   Vercel AI Gateway      Mathpix API
   → Anthropic API        (OCR)
   (AI features)
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | SSR for landing/SEO, client components for workspace |
| Styling | Tailwind CSS | Theming with CSS custom properties |
| Component library | shadcn/ui (adapted) | Base components customized to design system |
| Math rendering | KaTeX | Carried from v1, client-side |
| Deterministic solver | nerdamer (ported) | Client-side, zero backend cost |
| Auth | Auth.js (NextAuth.js) | OAuth (Google, GitHub) + email/password |
| Database | Neon Postgres (direct) | Connection pooling, branching for environments |
| ORM | Drizzle | Type-safe, lightweight |
| Payments | Stripe | Subscriptions, webhooks, customer portal |
| AI | Vercel AI Gateway → Anthropic (Claude) | Haiku for explanations, Sonnet for tutoring |
| OCR | Mathpix API (server-side) | LaTeX from images, keys stay on server |
| Animations | Framer Motion | React-idiomatic replacement for GSAP |
| Image cropping | react-cropper (Cropper.js v1.6.2) | Thin React wrapper |
| Image storage | Vercel Blob | If needed for user uploads |

## Key Architectural Decisions

1. **Single Next.js app with `lib/` domain split** — No Turborepo. Shared concerns live in `lib/platform/`, math-specific code in `lib/math/`. Clean boundary enables future monorepo extraction when study-helper starts. Dependency rule: platform never imports math.
2. **Vercel AI Gateway (not direct Anthropic SDK)** — Proven in Lipoti project. Single budget across models (Haiku/Sonnet), logging, caching, rate limiting handled by gateway. Our code is thin: prompts, response parsing, usage logging.
3. **Neon Postgres direct (not Vercel Postgres wrapper)** — Already used in Lipoti. Connection pooling, branching for environment isolation. Drizzle ORM.
4. **Environment isolation via Neon branching** — Separate prod DB, shared preview branch, test branch, dev branch. Env config via Vercel dashboard + `.env.local` for dev. Mirrors Lipoti setup.
5. **Two domains, one deployment** — `crackthex.app` + future platform domain. Middleware routes based on hostname.
6. **Solver runs client-side** — nerdamer ported as a client-side utility. Zero backend cost, instant, works offline.
7. **AI goes through the backend** — `/api/ai/*` proxies to AI Gateway. Tier checks in our code, budget enforcement at gateway level.
8. **OCR moves server-side** — Mathpix keys on server. Available to registered users (free) as registration hook.
9. **Auth is optional** — Free tier works without account (localStorage). Signup unlocks cloud sync + OCR.
10. **Unified app for all tiers** — Feature flags control what's visible per tier.
11. **localStorage persists for free** — Cloud sync supplements, doesn't replace.
12. **Subject-agnostic shared tables** — New products add their own tables without touching shared schema.

## Environment Isolation

| Environment | Database | Vercel deployment | Purpose |
|-------------|----------|-------------------|---------|
| Production | Neon `main` branch (separate) | Production deployment | Live users |
| Preview | Neon `preview` branch (shared across PRs) | Preview deployments | PR review, demo |
| Test | Neon `test` branch (separate) | Dedicated test deployment | Testing |
| Local dev | Neon `dev` branch | `next dev` | Development |

- `.env.local` for local dev (database URL, API keys, gateway config)
- All other environments: Vercel dashboard env vars
- `.env.example` checked into git with placeholder keys

## Database Schema

**Shared tables (`lib/platform/db/`):**

| Table | Purpose |
|-------|---------|
| `users` | Auth profile, current tier, preferences (theme, language) |
| `account_links` | Optional parent-child relationships (parent_id, child_id, consent status) |
| `subscriptions` | Stripe subscription state, tier, billing cycle |
| `token_usage` | Daily/monthly AI token tracking per user (subject-agnostic) |
| `progress` | Subject-agnostic progress records (subject, score, timestamp, session_count) |

**Math-specific tables:**

| Table | Purpose |
|-------|---------|
| `math_sessions` | Cloud-synced equation sessions (solver state, steps) |
| `math_practice` | Practice session results (difficulty, equation, pass/fail, timestamp) |
| `equations` | Solved equations with steps (caching, analytics) |
| `math_chat_history` | Math AI Tutor conversation threads per user |

**Future tables (study-helper):**

| Table | Purpose |
|-------|---------|
| `artifacts` | Curriculum-aligned lesson content |
| `lessons` | Lesson units with structured content |
| `test_results` | Student test scores and answer history |

## Project Structure

```
crackthex/                          # Single Next.js project
├── app/
│   ├── (marketing)/                # Landing pages, pricing, privacy
│   ├── (auth)/                     # Login, register, OAuth
│   ├── (workspace)/                # Workspace shell
│   │   ├── layout.tsx              # Tabs, sidebar, nav
│   │   └── math/                   # CrackTheX workspace
│   │       ├── solver/
│   │       ├── tutor/
│   │       └── practice/
│   ├── api/
│   │   ├── ai/                     # AI Gateway proxy routes
│   │   ├── auth/                   # Auth.js handlers
│   │   ├── math/ocr/               # Mathpix proxy
│   │   ├── sessions/               # Session CRUD
│   │   └── billing/                # Stripe webhooks
│   └── middleware.ts               # Domain → subject routing
│
├── lib/
│   ├── platform/                   # Shared, math-agnostic
│   │   ├── auth/                   # Auth utilities, session helpers
│   │   ├── billing/                # Stripe integration, tier checks
│   │   ├── db/                     # Drizzle client, shared schema & queries
│   │   ├── ai/                     # Prompt templates, token usage logging, tier checks
│   │   ├── progress/               # Subject-agnostic progress tracking
│   │   └── sessions/               # Cloud session sync (generic JSON state)
│   └── math/                       # CrackTheX-specific
│       ├── solver/                 # Deterministic solver engine (ported from v1)
│       ├── db/                     # Math schema & queries
│       ├── sessions/               # Math session logic
│       ├── practice/               # Equation generation, difficulty templates
│       └── tutor/                  # AI tutor prompts, chat history logic
│
├── components/
│   ├── ui/                         # Design system — glass cards, buttons, inputs
│   ├── layout/                     # Shell, sidebar, tabs, nav
│   └── math/                       # Step cards, action buttons, workspace
│
├── public/                         # Static assets
├── drizzle/                        # Migration files
└── tooling/                        # ESLint, Tailwind config
```

### Dependency Rules

| From | To | Allowed? |
|------|----|----------|
| `lib/math/` | `lib/platform/` | Yes — math depends on platform |
| `lib/platform/` | `lib/math/` | **No** — platform never imports math |
| `components/math/` | `lib/math/` | Yes |
| `components/ui/` | `lib/platform/` | Yes — only for types/config |

**Future monorepo extraction:** When study-helper starts, `lib/platform/` → `packages/platform/`, `components/ui/` → `packages/ui/`. Import paths change, code doesn't. Mechanical refactor if the dependency rule is maintained.

## AI Integration

### Two AI Modes

**1. Contextual AI — "Ask AI why?"**
- Triggered from button on each solver step card
- Input: equation, current step, previous step, applied rule, language
- Output: 2-3 sentence explanation
- Short prompt, cheap per interaction

**2. AI Tutor Chat**
- Full conversational interface
- Math-tutor-specialized system prompt
- Chat history persisted in PostgreSQL
- Can call deterministic solver for verification

### Word Problem Pipeline

1. Student inputs natural language description (Pro)
2. AI identifies variables, constraints, relationships
3. AI generates connected equations with "why" annotations
4. AI solves fully, synthesizes results, explains connections
5. Phase 2: deeper sub-problem relationship explanations

### LLM Strategy

- Vercel AI Gateway → Anthropic (Claude)
- Single budget across all models, managed in Vercel dashboard
- Haiku for "Ask AI why?" (cheap), Sonnet for tutoring/word problems (quality)
- Gateway handles: budget enforcement, logging, caching, rate limiting, model switching
- Our code handles: prompt construction, response parsing, token usage logging to DB (for user dashboard), tier checks

### Token Budget Enforcement

```
Request → /api/ai/* → Verify auth → Check tier (our code)
→ Proxy to Vercel AI Gateway
→ Gateway enforces budget + rate limits
→ Over budget: gateway rejects → our code shows upgrade prompt
→ Under budget: gateway calls LLM → our code logs tokens to DB → return response
```

### Cost Optimization

- Vercel AI Gateway caching (built-in)
- Model tiering (Haiku for simple, Sonnet for complex)
- Pre-generation (practice exercises in batches)
- Gateway-level rate limiting + per-user daily caps in DB

### Math Accuracy Safeguard

AI answers cross-checked against nerdamer:
1. Parse AI's mathematical output
2. Verify against symbolic engine
3. If mismatch: flag and fall back to deterministic
4. Key differentiator vs ChatGPT — verified answers

## v1 Solver Engine (Porting Reference)

The v1 deterministic solver is ported to v2 as a client-side module. This section documents the current algorithm and nerdamer integration for porting purposes.

### Solver Algorithm (7 steps)

1. **Step 0**: Display original equation as-is (bypass nerdamer auto-simplification using `nerdamerStrToDisplayLatex()`)
2. **Strategy selection**: Check if divide-first applies — pattern `N*(expr) = K` where K is divisible by N
3. **Layered expansion**: `expandOneLayer()` finds innermost `coeff*(...)` group, expands one layer at a time (inner → simplify → outer → simplify)
4. **Move terms**: Constants from LHS to RHS, variables from RHS to LHS. Each term movement = separate step
5. **Simplify + divide**: Combine like terms, divide by variable coefficient
6. **Verify**: Cross-check with `nerdamer.solve()` for correctness
7. **Fallback**: If step-by-step fails at any point, show direct nerdamer solution

### Key Conversion Functions

| Function | Purpose |
|----------|---------|
| `latexToNerdamer(latex)` | LaTeX → nerdamer syntax (handles `\frac`, `\cdot`, `\sqrt`, Unicode) |
| `nerdamerToLatex(nerdamerStr)` | nerdamer syntax → LaTeX for display |
| `nerdamerStrToDisplayLatex(str)` | String-level LaTeX conversion avoiding nerdamer auto-simplification |
| `expandOneLayer(expr)` | Finds innermost `coeff*(...)`, distributes coefficient — one layer only |
| `parseTerms(expr)` | Splits on `+`/`-` into terms (**only safe on fully expanded expressions**) |
| `plainMathToLatex(input)` | Plain text (e.g., `2x+3=7`) → LaTeX |

### nerdamer Gotchas

These quirks carry into v2 since nerdamer is kept:

- **Auto-simplifies on parse**: `nerdamer("2*x + 3 - 3")` → `2*x`. Display intermediate forms via string manipulation, not nerdamer objects.
- **Not JSON-serializable**: Always call `.text()` before storing.
- **Implicit multiplication**: `2x` → `2*x` handled during LaTeX-to-nerdamer conversion.
- **Unicode operators**: `⋅`, `−`, `×`, `÷` from copy-paste normalized to ASCII in conversion functions.
- **Nested fractions**: Conversion handles up to 3 levels of nesting.

### v1 Step Object Shape

```javascript
{
  latex: "2x + 3 = 7",           // display LaTeX for KaTeX
  rule: "subtract_both_sides",   // rule key (translated via i18n)
  lhs: "2*x",                    // nerdamer-syntax string
  rhs: "4",                      // nerdamer-syntax string
  isFinal: false,                // true for solution step
  alternatives: [{               // optional, at decision points
    label: "expand_parentheses",
    description: "...",
    previewLatex: "5x + 50 = 150"
  }]
}
```

v2 step shape may evolve, but the core fields (latex, rule, lhs, rhs, isFinal, alternatives) carry forward.

---

## Multi-Variable Solving

**Deterministic (free):** 2-3 variable linear systems. Substitution/elimination step-by-step. Handles dependent (infinite solutions) and contradictory (no solution) systems.

**AI-powered (Pro):** 4+ variables, non-linear, mixed systems.

### Deterministic 2-3 Var Solver

1. Display system of equations
2. Choose elimination variable (show as alternative path)
3. Eliminate → reduced system
4. Solve reduced system (reuses 1-var or 2-var solver)
5. Back-substitute for remaining variables
6. Verify all solutions against original system
