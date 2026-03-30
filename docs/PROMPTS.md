# CrackTheX -- Implementation Prompts

Copy-paste each prompt into a **new Claude Code conversation** (or the same one after review).
After each run: test using the review checklist in the corresponding `docs/runs/RUN_*.md` file.
Give feedback, then proceed to the next prompt.

---

## Run 1: Skeleton + Theme + State Machine

```
Implement Run 1 of the CrackTheX project: Skeleton + Theme + State Machine.

Read the full implementation plan at IMPLEMENTATION_PLAN.md for context.
Read the detailed run spec at docs/runs/RUN_1_SKELETON_THEME.md for exactly what to build.

Create these files:
- index.html (full SPA shell with 3 state sections + all CDN links)
- css/style.css (complete CSS: Gen Z dark theme, aurora background, glassmorphism, all layouts, micro-interactions)
- manifest.json (PWA manifest)
- sw.js (service worker with shell caching)
- js/app.js (STRINGS object, state machine, goToState with GSAP transitions, DOMContentLoaded init)
- js/utils.js, js/api.js, js/solver.js, js/camera.js, js/validator.js, js/interactive-board.js (empty stubs with init/cleanup methods so app.js doesn't crash)
- assets/icons/ (placeholder PNGs)

After building, serve with `python3 -m http.server 8080` and verify the review checklist in the run doc.
```

---

## Run 2: Camera + Cropping

```
Implement Run 2 of the CrackTheX project: Camera + Cropping.

Read the full implementation plan at IMPLEMENTATION_PLAN.md for context.
Read the detailed run spec at docs/runs/RUN_2_CAMERA_CROPPING.md for exactly what to build.

Replace the js/camera.js stub with the full Camera module:
- getUserMedia with facingMode: { ideal: 'environment' }
- File upload fallback when camera is denied
- Two-phase button: "Fotozas" -> capture frame to canvas -> init Cropper.js v1.6.2 on img -> "Kijeloles Kesz"
- getCroppedCanvas -> data URL -> goToState(VALIDATOR, { croppedImageDataURL })
- GSAP flash on capture
- cleanup() stops streams and destroys cropper

Do NOT modify any other module's logic. Only touch js/camera.js (and app.js if the Camera stub needs removal).
Test the review checklist in the run doc.
```

---

## Run 3: API Layer + OCR + Validator

```
Implement Run 3 of the CrackTheX project: API Layer + OCR + Validator.

Read the full implementation plan at IMPLEMENTATION_PLAN.md for context.
Read the detailed run spec at docs/runs/RUN_3_API_OCR_VALIDATOR.md for exactly what to build.

Replace stubs with full modules:

1. js/api.js -- API abstraction layer:
   - MODE: 'direct' (MVP) vs 'proxy' (production) toggle
   - ocr(base64DataURL): calls Mathpix directly in MVP mode, or /api/ocr in proxy mode
   - Placeholder API keys (YOUR_APP_ID, YOUR_APP_KEY)
   - Stubbed saveEquation() and getHistory() for future backend

2. js/validator.js -- Validator module for State 2:
   - init(data): show cropped preview, GSAP card entrance, call recognizeEquation
   - recognizeEquation(): check online status, call API.ocr(), extract LaTeX (strip $ delimiters), render with KaTeX, show confidence warning if low
   - Live LaTeX editing with debounced KaTeX re-render (200ms)
   - solve(): transition to Board with verified LaTeX
   - cleanup()

Test the review checklist in the run doc.
```

---

## Run 4: Solver Engine + Utils

```
Implement Run 4 of the CrackTheX project: Solver Engine + Utils.

Read the full implementation plan at IMPLEMENTATION_PLAN.md for context.
Read the detailed run spec at docs/runs/RUN_4_SOLVER_ENGINE.md for exactly what to build.

Replace stubs with full modules:

1. js/utils.js -- MathUtils module:
   - latexToNerdamer(): convert OCR LaTeX to nerdamer format (fractions, sqrt, powers, implicit multiplication)
   - nerdamerToLatex(): convert back using .toTeX()
   - parseTerms(): split expression into [{sign, raw, latex}] array
   - termsToExpr(): reconstruct from terms array
   - detectVariable(): find the variable to solve for

2. js/solver.js -- Solver module:
   - solve(latexInput): try step-by-step, fallback to direct solve
   - solveStepByStep(): expand -> move terms -> simplify -> divide -> verify
   - Each step: { latex, rule (Hungarian), lhs, rhs, isFinal? }
   - fallbackSolve(): starting equation + nerdamer.solve() result

After building, DO NOT wire to UI yet. Test via browser console only:
- Solver.solve('x + 5 = 10') -> steps ending in x = 5
- Solver.solve('2x - 3 = 7') -> x = 5
- Solver.solve('3x + 2 = x - 4') -> x = -3
- Solver.solve('2(x + 3) = 10') -> x = 2
- Solver.solve('\\frac{x}{2} + 1 = 5') -> x = 8

Verify the full review checklist in the run doc.
```

---

## Run 5: Interactive Board + Drag-and-Drop

```
Implement Run 5 of the CrackTheX project: Interactive Board + Drag-and-Drop.

Read the full implementation plan at IMPLEMENTATION_PLAN.md for context.
Read the detailed run spec at docs/runs/RUN_5_INTERACTIVE_BOARD.md for exactly what to build.

Replace the js/interactive-board.js stub with the full InteractiveBoard module:

- init(data): call Solver.solve(data.latex), render step cards with KaTeX, stagger animation, setup interactive zone
- createStepCard(): glass-card with step-rule badge + KaTeX equation + green highlight for final step
- setupInteractiveZone(): parse equation into draggable term elements on two sides of equals sign
- createTermElement(): div.draggable-term with KaTeX-rendered term and data attributes
- initDragAndDrop(): interact.js draggable + dropzone config
  - Only accept cross-equals-sign drops (dragSide !== dropSide)
  - GSAP animations: scale on grab, snap-back on invalid drop
- handleTermMove(): fly-across animation, sign flip, nerdamer recalculation, new step card with bounce entrance
- cleanup(): destroy interact instances, clear DOM

This is the signature feature. Test on both mouse and touch:
1. Type "3x + 2 = x - 4" in validator manually -> Solve
2. Drag the "+2" from LHS across equals sign to RHS
3. It should become "-2", new step appears
4. Drag "x" from RHS to LHS, repeat until solved

Verify the full review checklist in the run doc.
```

---

## Run 6: Animation Polish + PWA

```
Implement Run 6 of the CrackTheX project: Animation Polish + PWA Finalization.

Read the full implementation plan at IMPLEMENTATION_PLAN.md for context.
Read the detailed run spec at docs/runs/RUN_6_POLISH_PWA.md for exactly what to build.

This is the final polish pass. Add across all modules:

1. Button ripple effect: create span.ripple at click position, GSAP scale+fade animation
2. Equals sign pulse: glow + scale when valid drag enters opposite dropzone
3. Sign flip pop: scale 1.4 + color burst (cyan for +, pink for -) with elastic easing
4. Step badge numbers: "01", "02" etc. with count-up animation
5. App logo letter stagger (if logo element exists)
6. Fine-tune all animation timings and easings

CSS tweaks:
- Fix any border-image + border-radius issues on step cards
- Verify aurora background opacity on real devices
- Ensure ripple overflow hidden works

PWA finalization:
- Verify sw.js caches all CDN assets
- Generate proper icon-192.png and icon-512.png (gradient X logo)
- Update manifest theme_color to #080b1a
- Test offline: load -> go offline -> refresh -> app loads from cache
- Run Chrome Lighthouse PWA audit

Verify the full review checklist in the run doc. This is the final run.
```

---

## Post-implementation

After all 6 runs pass review:

1. **Commit:** `git add . && git commit -m "feat: CrackTheX MVP - interactive math equation solver PWA"`
2. **Deploy:** Push to GitHub Pages, Netlify, or Vercel (static hosting, zero config)
3. **API keys:** Get Mathpix API keys from https://mathpix.com and replace placeholders in js/api.js
4. **Test on real device:** Share local IP on same WiFi, or deploy and test live URL
5. **Next:** Backend extension when ready (see Backend Extension Roadmap in IMPLEMENTATION_PLAN.md)
