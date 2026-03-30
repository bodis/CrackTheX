# Run 5: Interactive Board + Drag-and-Drop

**Phase:** 6
**Files to create:** `js/interactive-board.js` (replace stub)
**Goal:** Full end-to-end flow works. Step cards render with KaTeX. Drag terms across equals sign -- sign flips, new step generates.

---

## What to build

### js/interactive-board.js -- InteractiveBoard module

**Properties:**
- `currentEquation`: `{ lhs, rhs, lhsTerms, rhsTerms }` -- current state for drag-and-drop
- `steps`: array of all steps

**`init(data)`**
1. Clear `#steps-container` and `#interactive-zone`
2. Call `Solver.solve(data.latex)` to get step array
3. If no steps: show error message
4. Render each step as a glass card via `createStepCard(step, index)` with connector lines between them
5. GSAP stagger entrance: `gsap.from('.step-card', { y: 30, opacity: 0, stagger: 0.15, ease: 'power2.out' })`
6. Find the last non-final step and call `setupInteractiveZone(step)` on it
7. Start FAB floating animation: `gsap.to('#btn-new', { y: -5, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })`

**`createStepCard(step, index)`**
- Create `div.glass-card.step-card` with `data-step` attribute
- Add `span.step-rule` badge with step.rule text
- Add `div.step-equation` with KaTeX render of step.latex
- If `step.isFinal`: add green border + glow (success color)
- Return the DOM element

**`setupInteractiveZone(step)`**
- Parse `step.lhs` and `step.rhs` into term arrays via `MathUtils.parseTerms()`
- Store as `this.currentEquation`
- Build interactive layout inside `#interactive-zone`:
  - `div.equation-row` containing:
    - `div.equation-side.drop-zone[data-side=lhs]` with draggable term elements
    - `div.equals-sign` (text "=")
    - `div.equation-side.drop-zone[data-side=rhs]` with draggable term elements
  - Hint text: "Huzd at a tagokat az egyenlojegjel masik oldalara!"
- Call `initDragAndDrop()`

**`createTermElement(term, side, index)`**
- Create `div.draggable-term` with data attributes: side, index, sign, value (raw)
- Render display LaTeX with sign prefix using KaTeX
- Return element

**`initDragAndDrop()`**
- **interact.js draggable** on `.draggable-term`:
  - start: GSAP scale 1.15, add .dragging class
  - move: translate by dx/dy, store position in dataset
  - end: if not .dropped, snap back with `gsap.to` + `back.out(1.7)` ease, remove .dragging
- **interact.js dropzone** on `.drop-zone`:
  - accept: `.draggable-term`
  - overlap: 0.3
  - ondragenter: if dragSide !== dropSide, add .drop-active class
  - ondragleave: remove .drop-active
  - ondrop: if cross-side, add .dropped class, call `handleTermMove()`

**`handleTermMove(termElement, fromSide, toSide)`**
1. Get term value and sign from data attributes
2. Flip sign: + becomes -, - becomes +
3. **GSAP fly-across animation:**
   - Get equals sign position via getBoundingClientRect
   - Animate term x-position to fly across equals sign (0.5s, power2.inOut)
   - Pop scale to 1.3 then back (0.15s each)
   - Color flash: red for minus, green for plus
4. After animation (tl.call):
   - Apply flipped operation to both sides via nerdamer: `nerdamer('expand(lhs + opStr)')` and same for rhs
   - Determine Hungarian rule label
   - Create new step object
   - Append connector + step card to `#steps-container` with GSAP entrance (`back.out(1.7)`)
   - Re-render interactive zone with new equation
   - Scroll new card into view smoothly

**`cleanup()`**
- Destroy interact.js instances: `interact('.draggable-term').unset()`, `interact('.drop-zone').unset()`
- Clear containers, reset state

---

## End-to-end test flow

1. Open app -> Camera -> take photo (or use file fallback)
2. Crop equation -> "Kijeloles Kesz"
3. Validator: see recognized LaTeX (or type manually: `3x + 2 = x - 4`)
4. Click "Megoldas!"
5. Board: step cards appear with stagger animation
6. Interactive zone at bottom: equation split into draggable terms
7. Drag a constant from LHS across the equals sign to RHS
8. **Expected:** term flies across, sign flips, new step card appears below, interactive zone updates
9. Repeat until equation is solved
10. Click "Uj feladat" -> back to Scanner

---

## Review checklist

- [ ] Step cards render with correct KaTeX equations
- [ ] Step rule badges show Hungarian labels
- [ ] Final step has green border/glow
- [ ] Step cards stagger-animate in from below
- [ ] Connector lines visible between steps
- [ ] Interactive zone shows equation split into individual draggable terms
- [ ] Each term shows its sign (+/-) and value
- [ ] **Desktop drag:** Click and drag a term across the equals sign -> sign flips, new step appears
- [ ] **Mobile drag:** Touch and drag works (touch-action: none prevents scroll hijacking)
- [ ] Drag to same side: term snaps back, no new step
- [ ] Drag to opposite side: fly-across animation, color flash, pop effect
- [ ] New step card slides in with bounce animation
- [ ] Auto-scroll to new step card
- [ ] Interactive zone updates with new equation after each drag
- [ ] Multiple consecutive drags work correctly (equation state tracks properly)
- [ ] FAB floats with subtle animation
- [ ] "Uj feladat" returns to Scanner cleanly
- [ ] Full end-to-end: Camera -> Crop -> OCR/manual -> Solve -> Drag -> New problem cycle
- [ ] No console errors
