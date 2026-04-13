# Phasing & Waves

## v1 Transition

The current vanilla JS app (GitHub Pages) is retired when v2 launches. No parallel maintenance. There will be a gap while v2 is built — acceptable given the small current user base. v2 must have at least free-tier feature parity (solver + sessions) before redirecting.

---

## MVP — Wave-Based Shipping

Ship in waves (each 1-2 weeks). Each wave is testable independently. User feedback informs the next.

### Wave 1 — Core Solver (soft launch)

Pure client-side. No auth, no backend. Validate the solver works.

- Next.js workspace shell — tabs, sidebar, responsive layout, 3 themes, Hungarian
- Solver tab — deterministic engine (1-var linear), step cards, action buttons, hints
- Concept cards — tappable rule explanations (~10 rules, pre-written)
- Inactivity nudge — rule-based suggestions after 15-20s idle (5-6 rules)
- Progressive button labels — full text for first-time users, icons for returning
- Graceful edge case handling — identity, contradiction, unsupported types with Pro upsell
- Basic practice mode — 3 levels (Easy/Medium/Hard), structured templates, 5-equation sessions, 3+2 progression
- Session starring/bookmarks — pin to sidebar top
- Landing page — solver as hero, trust signals, privacy page, example equation chips
- First-time experience — 3 contextual hints (Solve glow, action tooltip, Practice badge)
- Help page — static, accessible from settings
- **Goal**: validate solver, gather feedback from 10-20 people

### Wave 2 — Registration & Input

Backend comes online. Registration hook via camera OCR.

- Auth (OAuth + email/password)
- Camera OCR (free with account — registration hook)
- Cloud session sync + localStorage merge on first login
- Session archiving (auto-archive >60 day, starred exempt)
- Shareable solution links — URL-encoded, client-side solve, OG preview for social
- 2-3 var linear systems + dependent/contradictory detection
- Beginner difficulty (single-step equations, ages 10-12)
- Topic-based practice filters (Parentheses / Both sides / Nested / Mixed)
- English + German language support
- **Goal**: test registration, validate camera as conversion trigger, enable viral sharing

### Wave 3 — Monetization & AI

First paying users. AI features go live.

- Stripe integration, Pro tier ($10/month), 7-day free trial
- AI Tutor chat tab
- "Ask AI why?" on solver steps
- Word problem decomposition + full AI solving
- Quadratic solving via AI
- Token budget system — tracking, limits, usage dashboard
- AI math verification (cross-check against nerdamer)
- **Goal**: first paying users, validate AI features

### Wave 4 — Retention

Parent-facing features. Test the buyer ≠ user hypothesis.

- Parent dashboard (minimal — activity count, accuracy trend, weekly email)
- Account linking (parent-child, optional, consent-based)
- Two-path onboarding (student-first vs parent-first landing)
- Usage dashboard for Pro users
- **Goal**: validate parent retention

---

## MVP Full Feature List

**Workspace & Core:**
1. Next.js workspace shell — tabs, sidebar, responsive layout, 3 themes, 3 languages
2. Solver — deterministic (1-var + 2-3 var linear), step cards, action buttons, hints, concept cards, inactivity nudge
3. AI Tutor — chat interface, math-specialized prompts, conversation history
4. Practice — deterministic generation, 4 difficulty levels, 5-equation sessions, topic filters

**AI Features (Pro):**
5. "Ask AI why?" on solver steps
6. Word problem decomposition + solving
7. Quadratic step-by-step via AI
8. AI math verification

**Input:**
9. Keyboard + LaTeX + plain text (free)
10. Camera OCR (free with account)

**Platform:**
11. Auth — OAuth + email/password, optional
12. Account linking — parent-child, optional
13. Parent dashboard — minimal
14. Cloud session sync + session starring/archiving
15. Stripe — Free + Pro ($10/month), 7-day trial
16. Token budget system
17. Landing page with trust signals, privacy page
18. Shareable solution links with OG preview

---

## Phase 2 (Incremental Additions)

**AI & Solver:**
1. AI-powered adaptive practice — adjusts to weak spots, AI word problems, detailed feedback
2. Socratic mode — guides instead of answers
3. N-variable / non-linear systems via AI
4. Full word problem synthesis with "why" annotations

**Learning Features:**
5. Error pattern detection ("sign-change errors 3 times in 15 equations")
6. Practice readiness signal ("16/20 correct on parentheses")
7. Practice break suggestion (declining accuracy → "take a break")
8. Multi-equation OCR (photograph entire homework page)
9. Quick check / batch mode (multiple equations → all answers)

**Platform & Business:**
10. Detailed progress tracking — history, stats, difficulty curves
11. Presentation mode — fullscreen, large fonts, spacebar advance
12. Per-language pedagogical framing (HU vs DE/EN teaching traditions)
13. Family plan (~$15/month, 2-4 children)
14. Challenge sharing ("I scored 4/5 — beat me!")
15. Dark mode suggestion at night
16. Credit packs (if usage data supports)
17. Master tier (if demand exists)
18. Annual pricing ($80/year)

---

## Phase 3+ (Future — Math)

- Notebook / scratch pad
- Community marketplace — post problems, solve for credit
- BYOK (Bring Your Own Key)
- Export/share solutions (PDF, link)
- Mobile native apps (Capacitor)
- Teacher-configurable pedagogical style

---

## Platform Expansion (After Math MVP)

- **study-helper**: Curriculum-aligned languages + history preparation
  - Artifact/content system, flash cards, Q&A, AI-evaluated answers
  - Content creation pipeline (photo → AI extraction → review → publish)
  - Reuses shared platform layer
- **Platform domain**: Subject picker, unified dashboard
- **Aggregated parent dashboard**: All subjects
- **Teacher dashboard**: Class aggregate, team join codes
- **Community curation**: Best materials per topic rise over time

See `external/product-brief-study-helper-20260222.md` for full study-helper design.

---

## What This Portfolio Demonstrates

> "I built a complete, production-grade AI product from concept to deployment — and designed it as a platform that scales to multiple subjects."

- **Architecture**: Turborepo monorepo, shared platform packages, multi-domain deployment
- **Frontend**: Next.js App Router, Tailwind, Framer Motion, KaTeX
- **Backend**: Vercel serverless, PostgreSQL, Drizzle ORM
- **AI**: Anthropic API, prompt engineering, token budgets, math verification
- **Payments**: Stripe subscriptions, freemium model, free trial
- **Auth**: OAuth + email/password, optional, flexible parent-child linking
- **Product**: Buyer ≠ user, two-path onboarding, parent dashboard, age-based funnel
- **Domain**: Symbolic computation (nerdamer), OCR, word problems, multi-language
- **Infrastructure**: Vercel, PWA, offline-first free tier
