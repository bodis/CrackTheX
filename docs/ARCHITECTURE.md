# CrackTheX — Architecture & Development History

## Overview

CrackTheX is a Progressive Web App for Hungarian students to solve linear equations step-by-step. Users can type or photograph equations, view the solving process with detailed intermediate steps, and interactively manipulate equations by dragging terms across the equals sign.

**Design language:** Dark mode with glassmorphism — animated aurora background, violet-to-cyan gradients, glass-effect cards, neon accents.

**Target audience:** Hungarian secondary school students (ages 12-18).

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Animation | GSAP (GreenSock) | 3.13.0 | All transitions, micro-interactions |
| Math rendering | KaTeX | 0.16.9 | Fast LaTeX display, `throwOnError: false` always |
| Math engine | nerdamer | 1.1.13 | Symbolic solving (core + Algebra + Calculus + Solve) |
| Drag-and-drop | interact.js | 1.10.27 | Touch + mouse support |
| Image cropping | Cropper.js | 1.6.2 | **v1 only** — v2 is incompatible Web Components API |
| Math OCR | Mathpix API | v3 | LaTeX output, requires API keys |
| Typography | Space Grotesk + JetBrains Mono | — | Via Google Fonts |
| PWA | Service Worker + Manifest | — | Cache-first shell, network-only APIs |

**No build tools.** Pure HTML/CSS/JS with CDN-loaded libraries. All JS files are plain `<script>` tags loaded in dependency order.

---

## Application Architecture

### State Machine

Single Page App with 3 states, managed by `goToState(newState, data)` in `app.js`:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  STATE: SCANNER  │────►│ STATE: VALIDATOR  │────►│  STATE: BOARD       │
│                  │     │                   │     │                     │
│  Home screen     │     │  OCR result or    │     │  Step cards         │
│  - Keyboard entry│     │  keyboard input   │     │  - Step-by-step     │
│  - Camera capture│     │  - KaTeX preview  │     │    reveal (hints)   │
│  - File upload   │     │  - Live editing   │     │  - Drag-and-drop    │
│                  │     │  - Confidence     │     │  - Alt paths        │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

Transitions are GSAP-animated (opacity + Y-translation, 0.3-0.4s).

### Module Pattern

Each module exports an object with `init(data)` and `cleanup()`:

```javascript
const ModuleName = {
  init(data) { /* setup DOM, bind events */ },
  cleanup() { /* remove listeners, reset state */ },
  getState() { /* return serializable state for session persistence */ }
};
```

### JS Load Order (dependency chain)

```
utils.js → api.js → solver.js → camera.js → validator.js
→ interactive-board.js → sessions.js → app.js
```

### Data Flow

```
User input (keyboard or camera)
    ↓
Validator: edit/confirm LaTeX string
    ↓
Board: Solver.solve(latex) → step array
    ↓
Render: Step 0 shown → user solves manually or reveals hints
    ↓
Session: boardData persisted to localStorage
```

---

## Solver Engine

### Algorithm (solver.js)

1. **Step 0**: Display original equation (bypass nerdamer auto-simplification using `nerdamerStrToDisplayLatex()`)
2. **Strategy selection**: Check if divide-first applies (`N*(expr) = K` where K is divisible by N)
3. **Layered expansion**: `expandOneLayer()` finds innermost `coeff*(...)` group, expands one layer at a time (inner → simplify → outer → simplify)
4. **Move terms**: Constants from LHS to RHS, variables from RHS to LHS (each movement = separate step)
5. **Simplify + divide**: Combine like terms, divide by variable coefficient
6. **Verify**: Cross-check with `nerdamer.solve()`
7. **Fallback**: If step-by-step fails, show direct solution

### Key Design Decisions

- **nerdamer auto-simplifies** on parse — intermediate forms must use string-level display (`nerdamerStrToDisplayLatex`) to avoid collapsing steps
- **Step-by-step reveal**: Fresh solve shows only Step 0. User can drag terms manually, click "Kovetkezo lepes" for hints, or "Teljes megoldas" to see all steps
- **Alternative paths**: When divide-first is possible, the non-chosen strategy is shown as an expandable alternative on the step card
- **Unicode handling**: Copy-pasted `⋅`, `−`, `×`, `÷` are converted to ASCII operators

### Step Object Shape

```javascript
{
  latex: "2x + 3 = 7",           // display LaTeX for KaTeX
  rule: "Kivonas mindket oldalbol: 3",  // Hungarian description
  lhs: "2*x",                    // nerdamer-syntax string
  rhs: "4",                      // nerdamer-syntax string
  isFinal: false,                // true for solution step
  alternatives: [{               // optional, at decision points
    label: "Zarojel felbontasa",
    description: "A zarojelek felbontasaval is megoldhato",
    previewLatex: "5x + 50 = 150"
  }]
}
```

---

## Interactive Board

### Drag-and-Drop (interact.js)

- Equation split into draggable term elements per side
- Drop zones accept only cross-equals-sign moves
- On valid drop: fly-across GSAP animation → sign flip → nerdamer recalculation → new step card
- Visual feedback: cyan flash for positive, pink for negative

### Step-by-Step Reveal

- Fresh solve: only Step 0 visible + interactive drag zone + hint buttons
- "Kovetkezo lepes" (Next step): reveals one solver step at a time
- "Teljes megoldas" (Full solution): reveals all remaining steps
- Session restore: all previously revealed steps shown immediately

---

## Session Management (sessions.js)

### Storage

localStorage with keys:
- `crackthex_sessions` — JSON array of session objects
- `crackthex_active_session` — active session ID
- `crackthex_sidebar_seen` — first-run hint flag

### Session Object

```javascript
{
  id: "uuid",
  equation: "2x+3=7",
  displayText: "2x+3=7",        // plain text for sidebar card
  status: "new" | "in-progress" | "solved",
  appState: "state-scanner" | "state-validator" | "state-board",
  validatorData: { mode, latex },
  boardData: { latex, solverSteps, userSteps, currentLhs, currentRhs },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Important Rules

- **No images stored** — too large for localStorage (100-500KB each). Lost on refresh.
- **Sort by `createdAt`** descending — `updatedAt` would cause frustrating reshuffling
- **Board data saved immediately** after init and on `beforeunload` — both needed
- **`getState()` returns steps** even when `currentEquation` is null (fully solved state)
- **Undo delete**: 4-second grace period with toast notification

---

## UI & Styling

### CSS Variables (style.css)

```css
--bg-primary: #080b1a;          /* Deep space black */
--accent: #7c3aed;              /* Violet */
--accent-cyan: #22d3ee;         /* Bright cyan */
--gradient-main: 135deg violet → purple → cyan;
```

### Component Classes

- `.glass-card` — blur + semi-transparent background + border + shadow
- `.glass-input` — input fields with focus glow
- `.btn-primary` / `.btn-accent` — button variants
- `.draggable-term` — interactive equation terms
- `.step-card` — solution step with rule badge and KaTeX equation
- `.step-alt-badge` / `.step-alt-panel` — alternative path UI
- `.hint-bar` / `.btn-hint` / `.btn-show-all` — step reveal buttons

### Z-Index Layers

| Z | Element |
|---|---------|
| 50 | Sidebar |
| 45 | Sidebar backdrop |
| 40 | Mobile topbar |
| 30 | Undo toast |
| 20 | FAB |
| 15 | Back buttons |
| 10 | Controls |
| 1 | App state sections |
| 0 | Aurora background |

---

## PWA & Deployment

### Service Worker (sw.js)

- **Install**: Precache shell assets (local files + CDN scripts)
- **Activate**: Delete old caches
- **Fetch**: Cache-first for shell, network-only for Mathpix API and `/api/*`
- Cache name: `crackthex-v5`

### GitHub Pages

Auto-deploys via `.github/workflows/deploy.yml` on push to `main`. All paths use `./` (relative) for subpath compatibility.

### Local Development

```bash
npm run dev       # Node-based (npx serve on port 3000)
```

---

## API Configuration (api.js)

Two modes:
- **`direct`** (MVP): Calls Mathpix API directly from browser. API keys exposed — not for production.
- **`proxy`** (production): Routes through backend at `BACKEND_URL/api/ocr`. Keys stay server-side.

Placeholder endpoints for `saveEquation()` and `getHistory()` ready for future backend.

---

## Development History

| Phase | What was built |
|-------|---------------|
| Run 1 | HTML skeleton, dark theme, CSS variables, state machine, aurora background, GSAP transitions |
| Run 2 | Camera API, Cropper.js integration, file upload fallback, stream lifecycle |
| Run 3 | Mathpix OCR, API abstraction layer, KaTeX validator, live LaTeX editing |
| Run 4 | nerdamer solver engine, LaTeX↔nerdamer conversion, step generation |
| Run 5 | Interactive board, interact.js drag-and-drop, term sign-flipping, step cards |
| Run 6 | Micro-interactions (ripple, hover, animations), PWA finalization, service worker |
| Run 7 | Keyboard-first entry, home screen redesign, plain math input, back navigation |
| Run 8 | Multi-session sidebar, localStorage persistence, mobile drawer, undo delete |
| Run 9 | Gradual expansion, smart strategy (divide-first), alternative paths, step-by-step reveal |
| Run 10 | GitHub Pages deployment, Unicode input handling, session persistence fixes |
