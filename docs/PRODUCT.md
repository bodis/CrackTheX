# CrackTheX — Product Reference

> **v2 design documentation**: See [docs/v2/](v2/README.md) for the full platform design (product strategy, architecture, UX, design system, phasing).
>
> **v1 technical reference**: See [docs/ARCHITECTURE.md](ARCHITECTURE.md) for the current vanilla JS codebase internals.

This document covers the v1 product scope — what the current deployed app does, its limitations, and the equation types it supports. For v2 vision and future direction, see the v2 docs.

---

## What Is CrackTheX?

A math equation solver PWA for Hungarian secondary school students (12-18). Shows **how** to solve an equation step by step, not just the answer. Vanilla JS, no backend, runs entirely in the browser.

---

## Equation Types Supported (v0.2.0)

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

| Type | Why | v2 Status |
|------|-----|-----------|
| Systems of equations | Single-equation solver | Deterministic 2-3 var (free), AI for 4+ var (Pro) |
| Inequalities | Not implemented | Deferred |
| Logarithmic / trigonometric | Outside target scope | Deferred |
| Absolute value | Not implemented | Deferred |
| No-solution / infinite-solution | Not handled gracefully | Wave 2 (deterministic detection) |

---

## Current Limitations (v0.2.0)

### Functional

- No quadratic step-by-step (fallback only) → v2: AI-powered in Pro tier
- Single variable only → v2: 2-3 var deterministic + AI for complex systems
- No inequality support → v2: deferred
- No undo for user actions on the board → v2: under consideration
- No export (PDF, image, share link) → v2: shareable links in Wave 2
- No user accounts → v2: OAuth + email/password, optional

### Technical

- OCR requires exposed Mathpix API keys → v2: server-side proxy
- No backend (localStorage only) → v2: Vercel + PostgreSQL
- localStorage size limits (5-10MB) → v2: cloud sync for registered users
- No analytics → v2: progress tracking + parent dashboard
