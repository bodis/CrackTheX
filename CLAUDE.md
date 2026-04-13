# CLAUDE.md — Agent Instructions for CrackTheX

## Project Identity

Hungarian math equation solver PWA. Vanilla HTML/CSS/JS, no build tools, no npm dependencies. All libraries via CDN.

**Design documentation**: See `docs/README.md` for the full platform design (product, architecture, UX, design system, phasing). The solver algorithm, nerdamer integration, step object shape, and conversion functions are documented in `docs/02-architecture.md` under "v1 Solver Engine (Porting Reference)".

## Critical Constraints (v1 Codebase)

- **No build tools.** No webpack, no vite, no TypeScript. All JS is plain ES6+ loaded via `<script>` tags in order.
- **Cropper.js MUST be v1.6.2.** Version 2.x is an incompatible Web Components rewrite. Never upgrade.
- **No images in localStorage.** Cropped photos too large (100-500KB). Only LaTeX strings and equation state.
- **All UI strings are Hungarian.** Centralized in the `STRINGS` object in `app.js`.
- **Relative paths (`./`) everywhere.** Required for GitHub Pages subpath deployment.
- **KaTeX must always use `throwOnError: false`** to prevent crashes on malformed LaTeX.
- **Camera uses `facingMode: { ideal: 'environment' }`** (not `exact`) for desktop compatibility.

## v1 File Responsibilities

| File | What it does |
|------|-------------|
| `utils.js` | `latexToNerdamer()`, `nerdamerToLatex()`, `nerdamerStrToDisplayLatex()`, `expandOneLayer()`, `parseTerms()`, `plainMathToLatex()` |
| `solver.js` | `Solver.solve()`, `canDivideFirst()`, `layeredExpand()`, `solveFromExpanded()`, `fallbackSolve()` |
| `interactive-board.js` | Step card rendering, action buttons, step-by-step reveal, session state capture |
| `sessions.js` | localStorage CRUD, sidebar UI, session switching, undo delete, mobile drawer |
| `camera.js` | Camera stream, Cropper.js lifecycle, file upload fallback |
| `validator.js` | Mathpix OCR, KaTeX preview, keyboard/OCR mode switching |
| `app.js` | State machine (`goToState`), STRINGS, ripple effect, service worker registration |
| `api.js` | API abstraction (direct Mathpix / proxy backend) |
| `i18n.js` | Translation strings (hu/en/de), DOM binding, language switching |

**JS Load Order** (matters — later modules reference earlier ones):
```
i18n.js → utils.js → api.js → solver.js → camera.js → validator.js → interactive-board.js → sessions.js → app.js
```

## Common Gotchas

- `parseTerms()` splits on `+`/`-` without respecting parentheses — only call on fully expanded expressions.
- Session list sorts by `createdAt` descending (stable), never by `updatedAt` (would cause reshuffling).
- The board saves state immediately after init AND on page unload — both are needed.

For nerdamer-specific gotchas (auto-simplify, JSON serialization, Unicode, etc.), see `docs/02-architecture.md` → "nerdamer Gotchas".

## When Modifying

- Test with: `2x+3=7`, `5(23-X)+34=345`, `5(2(X-34)-23)+12=100`, `5*(x+10)=150`, `x=5`
- Run `node -e "..."` with nerdamer from `/tmp/node_modules/nerdamer` for quick solver tests
- Verify session persistence: solve → refresh → click old session → steps should restore
- Check syntax: `new Function(require('fs').readFileSync('js/file.js', 'utf8'))` for each file
