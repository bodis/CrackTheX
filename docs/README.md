# CrackTheX — Design Documentation

Full design documentation for CrackTheX, an AI-powered math tutoring platform for Hungarian students.

## Quick Summary

- **Stack**: Next.js, Vercel, PostgreSQL, Drizzle, Stripe, Anthropic API
- **Architecture**: Turborepo monorepo with shared platform layer for future multi-product expansion
- **Tiers**: Free (solver + practice, no account) → Free with account (+ camera OCR, cloud sync) → Pro ~$10/month (AI features)
- **Audience**: Hungarian students 12-18, parents as buyers
- **Approach**: Math Workspace with AI Co-Pilot — Solver, Practice, AI Tutor tabs

## Documentation Index

| Document | Contents |
|----------|----------|
| [Product & Strategy](01-product-strategy.md) | Vision, audience, tiers, monetization, growth, competitive positioning, equation types & scope |
| [Architecture](02-architecture.md) | Monorepo structure, tech stack, database schema, AI integration, v1 solver porting reference |
| [UI/UX Specification](03-ux-specification.md) | Workspace layout, solver UX, practice mode, camera flow, sessions, navigation |
| [Design System](04-design-system.md) | Themes, color tokens, typography, spacing, component schemas, animations, accessibility |
| [Phasing & Waves](05-phasing.md) | Wave-based shipping plan, MVP scope, Phase 2, Phase 3+, platform expansion |
| [Team Findings](06-team-findings.md) | 10 rounds of simulated team conversation, 80 numbered insights |

## Related Documents

- `CLAUDE.md` — Agent instructions for the current v1 codebase
- `external/product-brief-study-helper-20260222.md` — study-helper product brief (future second product)
- `external/brainstorming-session-2026-02-15.md` — study-helper brainstorming session
