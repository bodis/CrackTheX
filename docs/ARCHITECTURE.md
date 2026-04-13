# CrackTheX — Technical Architecture

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | Vanilla ES6+ JavaScript | — | No TypeScript, no transpilation |
| Animation | GSAP (GreenSock) | 3.13.0 | All transitions, micro-interactions, timeline-based |
| Math rendering | KaTeX | 0.16.9 | Fast LaTeX display, `throwOnError: false` always |
| Math engine | nerdamer | 1.1.13 | Symbolic CAS (core + Algebra + Calculus + Solve modules) |
| Image cropping | Cropper.js | 1.6.2 | **v1 only** — v2 is an incompatible Web Components rewrite |
| Math OCR | Mathpix API | v3 | LaTeX output from images, requires API keys |
| Typography | Figtree + JetBrains Mono | — | Via Google Fonts |
| PWA | Service Worker + Manifest | — | Cache-first shell, network-only for APIs |

**No build tools.** No webpack, vite, or bundlers. All JS files are plain `<script>` tags loaded in dependency order. All libraries are loaded via CDN.

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
│  - File upload   │     │  - Live editing   │     │  - Action buttons   │
│                  │     │  - Confidence     │     │  - Alt paths        │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

Transitions are GSAP-animated (opacity + Y-translation, 0.3-0.4s). Each state corresponds to a `<section>` in index.html toggled via `.active` class.

### Module Pattern

Each module exports a singleton object:

```javascript
const ModuleName = {
  init(data) { /* setup DOM, bind events */ },
  cleanup() { /* remove listeners, reset state */ },
  getState() { /* return serializable state for session persistence */ }
};
```

No framework, no imports — modules communicate through the global scope and direct function calls.

### JS Load Order (dependency chain)

```
i18n.js → utils.js → api.js → solver.js → camera.js → validator.js
→ interactive-board.js → sessions.js → app.js
```

Order matters because later modules reference earlier ones (e.g., `InteractiveBoard` calls `Solver.solve()`, `sessions.js` calls `InteractiveBoard.getState()`).

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

## Solver Engine (solver.js + utils.js)

### Algorithm

1. **Step 0**: Display original equation as-is (bypass nerdamer auto-simplification using `nerdamerStrToDisplayLatex()`)
2. **Strategy selection**: Check if divide-first applies — pattern `N*(expr) = K` where K is divisible by N
3. **Layered expansion**: `expandOneLayer()` finds innermost `coeff*(...)` group, expands one layer at a time (inner → simplify → outer → simplify)
4. **Move terms**: Constants from LHS to RHS, variables from RHS to LHS. Each term movement = separate step
5. **Simplify + divide**: Combine like terms, divide by variable coefficient
6. **Verify**: Cross-check with `nerdamer.solve()` for correctness
7. **Fallback**: If step-by-step fails at any point, show direct nerdamer solution

### Key Conversion Functions (utils.js)

| Function | Purpose |
|----------|---------|
| `latexToNerdamer(latex)` | Converts LaTeX string to nerdamer syntax (handles `\frac`, `\cdot`, `\sqrt`, Unicode operators) |
| `nerdamerToLatex(nerdamerStr)` | Converts nerdamer syntax back to LaTeX for display |
| `nerdamerStrToDisplayLatex(str)` | String-level LaTeX conversion that avoids nerdamer auto-simplification |
| `expandOneLayer(expr)` | Finds innermost `coeff*(...)` group, distributes coefficient — one layer only |
| `parseTerms(expr)` | Splits expression on `+`/`-` into individual terms (only safe on fully expanded expressions) |
| `plainMathToLatex(input)` | Converts plain-text math (e.g., `2x+3=7`) to LaTeX |

### nerdamer Gotchas

- **Auto-simplifies on parse**: `nerdamer("2*x + 3 - 3")` immediately becomes `2*x`. Display intermediate forms via string manipulation, not nerdamer objects
- **Not JSON-serializable**: Always call `.text()` before storing in localStorage
- **Implicit multiplication**: `2x` → `2*x` handled during LaTeX-to-nerdamer conversion
- **Unicode operators**: `⋅`, `−`, `×`, `÷` from copy-paste are normalized to ASCII in conversion functions
- **Nested fractions**: Conversion handles up to 3 levels of nesting

### Step Object Shape

```javascript
{
  latex: "2x + 3 = 7",                     // display LaTeX for KaTeX
  rule: "subtract_both_sides",             // rule key (translated via i18n)
  lhs: "2*x",                              // nerdamer-syntax string
  rhs: "4",                                // nerdamer-syntax string
  isFinal: false,                           // true for solution step
  alternatives: [{                          // optional, at decision points
    label: "expand_parentheses",
    description: "...",
    previewLatex: "5x + 50 = 150"
  }]
}
```

---

## Interactive Board (interactive-board.js)

### User Actions

The board provides action buttons instead of free-form drag-and-drop:

| Action | What it does |
|--------|-------------|
| **+ / -** | Add or subtract a value from both sides |
| **x / ÷** | Multiply or divide both sides by a value |
| **Expand** | Distribute one layer of parentheses (mechanical, step-by-step) |
| **Simplify** | Combine like terms on each side |
| **Rewrite** | Free-form equation entry — validated against nerdamer solution for equivalence |

Actions are conditionally shown based on the current equation state (e.g., Expand only appears when parentheses exist).

### Step-by-Step Reveal (Hint System)

- Fresh solve: only Step 0 visible + interactive zone + hint buttons
- "Next step" button: reveals one solver step at a time
- "Full solution" button: reveals all remaining steps at once
- Session restore: all previously revealed steps shown immediately (no re-animation)

### Step Card Rendering

Each step is a `.step-card` with:
- Step number badge (01, 02, ...)
- Rule description (translated string)
- KaTeX-rendered equation
- Optional alternative path panel (expandable)
- Connector line to next step

---

## Session Management (sessions.js)

### localStorage Keys

| Key | Content |
|-----|---------|
| `crackthex_sessions` | JSON array of session objects |
| `crackthex_active_session` | Active session UUID |
| `crackthex_sidebar_seen` | First-run hint flag |
| `crackthex_theme` | Current theme name |
| `crackthex_lang` | Current language code |

### Session Object

```javascript
{
  id: "uuid",
  equation: "2x+3=7",
  displayText: "2x+3=7",
  status: "new" | "in-progress" | "solved",
  appState: "state-scanner" | "state-validator" | "state-board",
  validatorData: { mode, latex },
  boardData: { latex, solverSteps, userSteps, currentLhs, currentRhs, revealedCount },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Persistence Rules

- **No images stored** — too large for localStorage (100-500KB each)
- **Sort by `createdAt`** descending — `updatedAt` would cause frustrating list reshuffling
- **Dual save points**: Board data saved immediately after init AND on `beforeunload` — both needed for reliability
- **`getState()` returns steps** even when `currentEquation` is null (fully solved state)
- **Undo delete**: 4-second grace period with toast notification

---

## Internationalization (i18n.js)

### Architecture

- Centralized `_translations` object with 100+ keys per language
- Languages: Hungarian (hu, default), English (en), German (de)
- Fallback: requested key → Hungarian
- Persisted in localStorage (`crackthex_lang`)

### DOM Binding

| Attribute | Purpose |
|-----------|---------|
| `data-i18n` | Sets `textContent` |
| `data-i18n-placeholder` | Sets input `placeholder` |
| `data-i18n-aria` | Sets `aria-label` |
| `data-i18n-opt` | Sets `<option>` text |

Calling `I18n.applyTranslations()` walks the DOM and applies all translations. Called on language switch and after dynamic content creation.

---

## Theming (app.js + style.css)

### Three Themes

| Theme | Background | Accent | Feel |
|-------|-----------|--------|------|
| **Chalkboard** (default) | Deep green `#1e3a22` | Chalk yellow `#dcc050` | Warm, school-authentic |
| **Whiteboard** | Off-white `#fafaf8` | Blue `#2563eb` | Clean, bright |
| **Dark** | Near-black `#191919` | Violet `#a78bfa` | Modern, high-contrast |

### Implementation

- Entire palette defined in CSS custom properties on `:root`
- Theme switch applies a new set of `--var` values via `ThemeManager.apply()`
- Glassmorphism (backdrop-filter blur + semi-transparent backgrounds) works across all themes
- Meta `theme-color` updated for mobile browser chrome
- Smooth 0.4s transition on all color-dependent properties

---

## CSS Architecture (style.css)

### Component Classes

| Class | Purpose |
|-------|---------|
| `.glass-card` | Blur + semi-transparent bg + border + shadow |
| `.glass-input` | Input with focus glow |
| `.btn-primary` / `.btn-accent` | Button variants |
| `.step-card` | Solution step with rule badge and equation |
| `.step-alt-badge` / `.step-alt-panel` | Alternative path UI |
| `.hint-bar` / `.btn-hint` / `.btn-show-all` | Step reveal buttons |
| `.entry-card` | Home screen entry option |

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
| 0 | Background |

---

## PWA & Service Worker (sw.js)

- **Cache version**: `crackthex-v8` (incremented on updates)
- **Install**: Precache all shell assets (HTML, CSS, JS, icons) + CDN scripts
- **Activate**: Delete old cache versions, claim clients
- **Fetch strategy**:
  - Network-only: Mathpix API calls, `/api/*` paths
  - Cache-first: Everything else (shell assets, CDN libraries)
- **Offline**: Full app shell works offline. OCR disabled (needs Mathpix API)

### Manifest

- Display mode: `standalone`
- Orientation: `portrait`
- Start URL: `./index.html`
- Icons: 192x192 and 512x512 PNG

---

## API Layer (api.js)

Two modes:

| Mode | How it works | When to use |
|------|-------------|-------------|
| `direct` | Browser calls Mathpix API directly | Development / MVP (keys exposed) |
| `proxy` | Routes through backend at `BACKEND_URL/api/ocr` | Production (keys server-side) |

Placeholder stubs for `saveEquation()` and `getHistory()` exist for future backend integration.

---

## Deployment

- **GitHub Pages** via `.github/workflows/deploy.yml` on push to `main`
- All paths use `./` (relative) for subpath compatibility
- Live at: `https://bodis.github.io/CrackTheX/`
- Local dev: `npm run dev` (npx serve on port 3000)

---

## File Map

```
CrackTheX/
├── index.html              # SPA entry point (3 state sections + sidebar + modal)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first shell)
├── package.json            # Dev server script only
├── CHANGELOG.md            # Release history
├── CLAUDE.md               # Agent instructions
├── css/
│   └── style.css           # All themes, glassmorphism, layouts, animations (~2000 lines)
├── js/
│   ├── i18n.js             # Translation strings (hu/en/de), DOM binding, language switching
│   ├── utils.js            # LaTeX↔nerdamer conversion, term parsing, expansion logic
│   ├── api.js              # Mathpix API abstraction (direct/proxy modes)
│   ├── solver.js           # Step-by-step solver engine (strategies, verification, fallback)
│   ├── camera.js           # Camera stream, Cropper.js lifecycle, file upload fallback
│   ├── validator.js        # OCR display, KaTeX preview, keyboard/OCR mode switching
│   ├── interactive-board.js # Step cards, action buttons, hint system, session state capture
│   ├── sessions.js         # localStorage CRUD, sidebar UI, session switching, undo delete
│   └── app.js              # State machine, ThemeManager, ReleaseNotes, ripple effect, init
├── assets/icons/           # PWA icons (192, 512)
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # This file
│   └── PRODUCT.md          # Functional description & vision
└── scripts/
    └── generate-icons.html # Icon generation utility
```
