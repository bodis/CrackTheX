# Architecture Deep-Dive — Design Spec

**Date:** 2026-04-13
**Team:** Backend Architect (Mark), DevOps/Vercel Specialist (Tamas), Product Owner (Reka), Marketing (Andras)
**Context:** Deepening the high-level architecture from `docs/02-architecture.md` for implementation readiness, grounded in real experience from the Lipoti Vercel project.

---

## Decisions Summary

| Question | Decision | Rationale |
|----------|----------|-----------|
| AI integration | Vercel AI Gateway | Proven in Lipoti. Single budget, multi-model, logging/caching/rate-limiting built in. |
| Database | Neon Postgres (direct) | Already used in Lipoti. Vercel Postgres is just a Neon wrapper with markup. Direct = simpler, cheaper. |
| ORM | Drizzle | Type-safe, lightweight. Same as Lipoti. |
| Environment isolation | Neon branching + Vercel env config | Mirror Lipoti: separate prod DB, shared preview branch, test branch, dev branch. |
| Project structure | Single Next.js app (no Turborepo) | Solo developer. Monorepo adds complexity without benefit for a single app. |
| Code organization | Two-level `lib/` split: `platform/` + `math/` | Clean boundary for future monorepo extraction. Zero overhead today. |
| Future extraction | `lib/platform/` → `packages/platform/` when study-helper starts | Mechanical refactor if dependency rule is maintained. |

---

## 1. AI Integration — Vercel AI Gateway

**Use Vercel AI Gateway, not direct Anthropic SDK calls.**

AI Gateway sits between the app and Anthropic. API routes (`/api/ai/*`) call the gateway, which proxies to Claude.

**What the gateway handles:**
- Single budget across all models (Haiku for "Ask AI why?", Sonnet for tutoring/word problems)
- Logging, caching, model switching, rate limiting — managed in Vercel dashboard
- Hard budget enforcement at the gateway level

**What our code handles (`lib/platform/ai/`):**
- Prompt templates and construction
- Response parsing
- Token usage logging to Neon (for user-facing usage dashboard)
- Tier-check middleware (free vs Pro feature gating)

**What this simplifies from the original docs:** The `proxy.ts`, `budget.ts`, `rate-limit.ts` infrastructure layer is no longer needed. Budget enforcement is gateway-side. Our AI layer is thin — prompts in, parsed responses out, usage logged.

---

## 2. Database — Neon Postgres Direct

**Use Neon directly, not through the Vercel Postgres wrapper. Drizzle ORM.**

- Neon project with connection pooling enabled
- Drizzle ORM for type-safe schema and queries
- Connection string from Vercel dashboard env vars

**Schema split across the lib/ boundary:**

```
lib/platform/db/
  schema.ts        # users, subscriptions, token_usage, progress, account_links
  queries.ts       # shared query helpers
  client.ts        # Drizzle client init, connection config

lib/math/db/
  schema.ts        # math_sessions, math_practice, equations, math_chat_history
  queries.ts       # math-specific query helpers
```

**Dependency rule:** `lib/math/db/schema.ts` can reference `lib/platform/db/schema.ts` (e.g., foreign key to `users`). Never the reverse. Platform tables have zero knowledge of math tables.

---

## 3. Environment Isolation

**Mirror Lipoti's proven pattern: Neon branching + Vercel env config.**

| Environment | Database | Vercel deployment | Purpose |
|-------------|----------|-------------------|---------|
| Production | Neon `main` branch (separate) | Production deployment | Live users |
| Preview | Neon `preview` branch (shared across PRs) | Preview deployments | PR review, demo |
| Test | Neon `test` branch (separate) | Dedicated test deployment | Testing |
| Local dev | Neon `dev` branch | `next dev` | Development |

**Env config strategy:**
- `.env.local` for local dev (database URL, API keys, gateway config)
- All other environments: Vercel dashboard env vars
- `.env.example` checked into git with placeholder keys
- No `.env.production` files committed

---

## 4. Project Structure — Single Next.js App

**Single Next.js app with two-level `lib/` domain split. No Turborepo.**

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
│   └── middleware.ts               # Domain routing
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

**Dependency rules (enforced by convention):**

| From | To | Allowed? |
|------|----|----------|
| `lib/math/` | `lib/platform/` | Yes — math depends on platform |
| `lib/platform/` | `lib/math/` | **No** — platform never imports math |
| `components/math/` | `lib/math/` | Yes |
| `components/ui/` | `lib/platform/` | Yes — only for types/config |

**Future monorepo extraction:** When study-helper development starts, `lib/platform/` becomes `packages/platform/`, `components/ui/` becomes `packages/ui/`. Import paths change, code doesn't. This is a mechanical refactor if the dependency rule is maintained.

---

## 5. What Changes From the Original Architecture Doc

| Original (`docs/02-architecture.md`) | Updated |
|---------------------------------------|---------|
| Turborepo monorepo with `packages/` | Single Next.js app with `lib/` domain split |
| `packages/platform/`, `packages/ai/`, `packages/ui/` | `lib/platform/`, `lib/math/`, `components/ui/` |
| `apps/web/` | Root-level Next.js app |
| Vercel Postgres | Neon Postgres (direct) |
| Anthropic API (direct) | Vercel AI Gateway |
| Custom rate-limit/budget code | Gateway-side enforcement + usage logging |
| `tooling/` for Turborepo orchestration | `tooling/` for ESLint/Tailwind config only |

---

## Tech Stack (Updated)

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
| AI | Vercel AI Gateway → Anthropic (Claude) | Haiku for explanations, Sonnet for tutoring |
| OCR | Mathpix API (server-side) | LaTeX from images, keys stay on server |
| Payments | Stripe | Subscriptions, webhooks, customer portal |
| Animations | Framer Motion | React-idiomatic replacement for GSAP |
| Image cropping | react-cropper (Cropper.js v1.6.2) | Thin React wrapper |
| Image storage | Vercel Blob | If needed for user uploads |
