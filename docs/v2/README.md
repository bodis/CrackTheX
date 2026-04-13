# CrackTheX v2 — Design Documentation

CrackTheX v2 is a full-stack rebuild of the math equation solver as an AI-powered tutoring platform.

## Quick Summary

- **Stack**: Next.js, Vercel, PostgreSQL, Drizzle, Stripe, Anthropic API
- **Architecture**: Turborepo monorepo with shared platform layer for future multi-product expansion
- **Tiers**: Free (solver + practice, no account) → Free with account (+ camera OCR, cloud sync) → Pro ~$10/month (AI features)
- **Audience**: Hungarian students 12-18, parents as buyers
- **Approach**: Math Workspace with AI Co-Pilot — Solver, Practice, AI Tutor tabs

## Documentation Index

| Document | Contents |
|----------|----------|
| [Product & Strategy](01-product-strategy.md) | Vision, audience, tiers, monetization, growth, competitive positioning |
| [Architecture](02-architecture.md) | Monorepo structure, tech stack, database schema, platform layer, API routes |
| [UI/UX Specification](03-ux-specification.md) | Workspace layout, solver UX, practice mode, camera flow, sessions, navigation |
| [Design System](04-design-system.md) | Themes, color tokens, typography, spacing, component schemas, animations, accessibility |
| [Phasing & Waves](05-phasing.md) | Wave-based shipping plan, MVP scope, Phase 2, Phase 3+, platform expansion |
| [Team Findings](06-team-findings.md) | Appendix: 10 rounds of simulated team conversation, 63+ numbered insights |

## Related Documents

- `docs/PRODUCT.md` — Product description (v1 + v2 vision summary)
- `docs/ARCHITECTURE.md` — Technical architecture (v1)
- `external/product-brief-study-helper-20260222.md` — study-helper product brief (future second product)
- `external/brainstorming-session-2026-02-15.md` — study-helper brainstorming session

## Original Monolithic Spec

The original single-file spec is preserved at `docs/superpowers/specs/2026-04-12-crackthex-v2-platform-design.md`. These split documents are the authoritative source going forward.
