# CLAUDE.md — Agent Instructions for CrackTheX

## Project Identity

Hungarian math equation solver PWA. Vanilla HTML/CSS/JS, no build tools, no npm dependencies. All libraries via CDN. Dark glassmorphism theme (violet-cyan gradients, aurora background).

## Critical Constraints

- **No build tools.** No webpack, no vite, no TypeScript compilation. All JS is plain ES6+ loaded via `<script>` tags in order.
- **Cropper.js MUST be v1.6.2.** Version 2.x is a Web Components rewrite with an incompatible API. Never upgrade.
- **nerdamer auto-simplifies on parse.** Calling `nerdamer(expr)` transforms the expression. Use `MathUtils.nerdamerStrToDisplayLatex()` to display intermediate forms without parsing.
- **nerdamer objects are NOT JSON-serializable.** Always call `.text()` before storing in localStorage.
- **No images in localStorage.** Cropped photos are too large (100-500KB). Only LaTeX strings and equation state are persisted.
- **All UI strings are Hungarian.** Centralized in the `STRINGS` object in `app.js`.
- **Relative paths (`./`) everywhere.** Required for GitHub Pages subpath deployment. Never use root-relative (`/`) paths.

## Architecture

### State Machine (3 states in app.js)

```
SCANNER (home / camera) → VALIDATOR (OCR / keyboard edit) → BOARD (solve / interact)
```

Transitions via `goToState(newState, data)` with GSAP animations. Each module has `init(data)` and `cleanup()`.

### JS Module Load Order (matters!)

```
utils.js → api.js → solver.js → camera.js → validator.js → interactive-board.js → sessions.js → app.js
```

### Key Data Flow

```
User input → Validator passes LaTeX string → Board calls Solver.solve(latex)
→ Solver: latexToNerdamer() → nerdamer operations → step array
→ Board: renders step cards with KaTeX, sets up drag-and-drop zone
```

### Step Object Shape

```javascript
{ latex: string, rule: string, lhs: string, rhs: string, isFinal?: boolean, alternatives?: [] }
```

- `latex`: display string for KaTeX rendering
- `lhs`/`rhs`: nerdamer-syntax strings (for calculations and session persistence)
- `alternatives`: optional array of `{ label, description, previewLatex }` at decision points

### Solver Strategy

1. **Step 0**: Preserve original equation display (bypass nerdamer auto-simplify)
2. **Strategy check**: If `N*(expr) = K` where K % N === 0 → divide-first
3. **Layered expansion**: `expandOneLayer()` finds innermost `coeff*(...)`, expands one layer at a time
4. **Move terms**: Constants LHS→RHS, variables RHS→LHS (each term = separate step)
5. **Divide by coefficient**: Extract and divide
6. **Verify**: `nerdamer.solve()` for final answer
7. **Fallback**: If step-by-step fails, show direct solution

### Session Persistence (localStorage)

```javascript
{ id, equation, displayText, status, appState, validatorData, boardData, createdAt, updatedAt }
```

- `boardData.solverSteps` + `boardData.userSteps` = full step history
- `InteractiveBoard.getState()` returns steps even when `currentEquation` is null (solved state)
- `captureCurrentState()` fires on session switch and `beforeunload`

## File Responsibilities

| File | What it does |
|------|-------------|
| `utils.js` | `latexToNerdamer()`, `nerdamerToLatex()`, `nerdamerStrToDisplayLatex()`, `expandOneLayer()`, `parseTerms()`, `plainMathToLatex()` |
| `solver.js` | `Solver.solve()`, `canDivideFirst()`, `layeredExpand()`, `solveFromExpanded()`, `fallbackSolve()` |
| `interactive-board.js` | Step card rendering, drag-and-drop with interact.js, step-by-step reveal (`_revealNextStep`, `_revealAllSteps`), session state capture |
| `sessions.js` | localStorage CRUD, sidebar UI, session switching, undo delete, mobile drawer |
| `camera.js` | Camera stream, Cropper.js lifecycle, file upload fallback, 3-phase flow (home/camera/cropping) |
| `validator.js` | Mathpix OCR, KaTeX preview, keyboard/OCR mode switching, live input editing |
| `app.js` | State machine (`goToState`), STRINGS, ripple effect, service worker registration, SessionManager init |
| `api.js` | API abstraction layer (direct Mathpix / proxy backend), mode switching |

## Common Gotchas

- `parseTerms()` splits on `+`/`-` without respecting parentheses — only call on fully expanded expressions.
- Unicode math operators (`⋅`, `−`, `×`, `÷`) from copy-paste are converted to ASCII in `latexToNerdamer()` and `plainMathToLatex()`.
- KaTeX must always use `throwOnError: false` to prevent crashes on malformed LaTeX.
- Camera uses `facingMode: { ideal: 'environment' }` (not `exact`) for desktop compatibility.
- Session list sorts by `createdAt` descending (stable), never by `updatedAt` (would cause reshuffling).
- The board saves state immediately after init AND on page unload — both are needed.

## When Modifying

- Test with: `2x+3=7`, `5(23-X)+34=345`, `5(2(X-34)-23)+12=100`, `5*(x+10)=150`, `x=5`
- Run `node -e "..."` with nerdamer from `/tmp/node_modules/nerdamer` for quick solver tests
- Verify session persistence: solve → refresh → click old session → steps should restore
- Check syntax: `new Function(require('fs').readFileSync('js/file.js', 'utf8'))` for each file
