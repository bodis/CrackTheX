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
│  │          progress, account_links                  │   │
│  │  Math:   math_sessions, math_practice,            │   │
│  │          equations, math_chat_history              │   │
│  │  Future: artifacts, lessons, test_results         │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
   Anthropic API          Mathpix API
   (AI features)          (OCR)
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Monorepo | Turborepo | Shared packages + apps |
| Framework | Next.js 14+ (App Router) | SSR for landing/SEO, client components for workspace |
| Styling | Tailwind CSS | Theming with CSS custom properties |
| Component library | shadcn/ui (adapted) | Base components customized to design system |
| Math rendering | KaTeX | Carried from v1, client-side |
| Deterministic solver | nerdamer (ported) | Client-side, zero backend cost |
| Auth | Vercel Auth (Auth.js) | OAuth (Google, GitHub) + email/password |
| Database | PostgreSQL (Vercel Postgres) | Sessions, users, subscriptions, token usage |
| ORM | Drizzle | Type-safe, lightweight |
| Payments | Stripe | Subscriptions, webhooks, customer portal |
| AI | Anthropic API (Claude) | Math reasoning, multi-language |
| OCR | Mathpix API (server-side) | LaTeX from images, keys stay on server |
| Animations | Framer Motion | React-idiomatic replacement for GSAP |
| Image cropping | react-cropper (Cropper.js v1.6.2) | Thin React wrapper |

## Key Architectural Decisions

1. **Monorepo with shared platform layer** — Turborepo separates shared concerns (auth, billing, AI, UI) into reusable packages. Enables building study-helper later without rebuilding infrastructure.
2. **Two domains, one deployment** — `crackthex.app` + future platform domain. Middleware routes based on hostname.
3. **Solver runs client-side** — nerdamer ported as a client-side utility. Zero backend cost, instant, works offline.
4. **AI goes through the backend** — `/api/ai/*` enforces token budgets, rate limits, tier checks.
5. **OCR moves server-side** — Mathpix keys on server. Available to registered users (free) as registration hook.
6. **Auth is optional** — Free tier works without account (localStorage). Signup unlocks cloud sync + OCR.
7. **Unified app for all tiers** — Feature flags control what's visible per tier.
8. **localStorage persists for free** — Cloud sync supplements, doesn't replace.
9. **Subject-agnostic shared tables** — New products add their own tables without touching shared schema.

## Database Schema

**Shared tables (packages/platform):**

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
│       ├── themes/                 # Chalkboard, Light, Dark
│       └── i18n/                   # Translation infrastructure
│
├── apps/
│   └── web/                        # Next.js app (single deployment)
│       ├── app/
│       │   ├── (marketing)/        # Landing pages (domain-aware)
│       │   ├── (auth)/             # Login, register, OAuth
│       │   ├── (workspace)/        # Workspace shell
│       │   │   ├── layout.tsx      # Tabs, sidebar, nav
│       │   │   └── math/           # CrackTheX math workspace
│       │   │       ├── solver/
│       │   │       ├── tutor/
│       │   │       └── practice/
│       │   └── api/
│       │       ├── ai/             # explain, chat, decompose
│       │       ├── math/ocr/       # Mathpix proxy
│       │       ├── sessions/
│       │       └── billing/
│       ├── lib/math/               # Solver engine, AI prompts, verification
│       ├── components/math/        # Step cards, action buttons, workspace
│       └── middleware.ts           # Domain → subject routing
│
└── tooling/                        # eslint, tsconfig, tailwind
```

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

- Start with Claude (Anthropic API)
- Provider-agnostic backend abstraction
- Haiku for "Ask AI why?" (cheap), Sonnet for tutoring/word problems (quality)
- Architecture supports adding providers later

### Token Budget Enforcement

```
Request → /api/ai/* → Verify auth → Check tier
→ Check monthly usage → Check daily cap
→ Over budget: upgrade prompt (graceful degradation)
→ Under budget: call LLM → log tokens → return response
```

### Cost Optimization

- Prompt caching (common explanations cached by rule + equation type)
- Model tiering (cheap for simple, expensive for complex)
- Pre-generation (practice exercises in batches)
- Rate limiting (per-user daily caps)

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
