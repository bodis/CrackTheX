# Run 4: Solver Engine + Utils

**Phase:** 5
**Files to create:** `js/utils.js` (replace stub), `js/solver.js` (replace stub)
**Goal:** `Solver.solve('x + 5 = 10')` returns correct step-by-step array. Test from browser console only -- no UI wiring yet.

---

## What to build

### js/utils.js -- MathUtils module

**`latexToNerdamer(latex)`**
Converts Mathpix OCR LaTeX to nerdamer-compatible string:
- Remove `\left`, `\right`
- Convert `\frac{a}{b}` -> `(a)/(b)` (3 passes for nested fractions)
- Convert `\sqrt[n]{x}` -> `(x)^(1/n)`, `\sqrt{x}` -> `sqrt(x)`
- Convert `^{exp}` -> `^(exp)`
- Convert `\cdot`, `\times` -> `*`, `\div` -> `/`
- Remove LaTeX spacing: `\,`, `\;`, `\:`, `\!`, `\quad`, `\qquad`
- Remove `\text{}`, `\mathrm{}` wrappers (keep content)
- Add implicit multiplication: `2x` -> `2*x`, `)(` -> `)*(`, `x(` -> `x*(`, `)2` -> `)*2`
- Clean whitespace

**`nerdamerToLatex(nerdamerExpr)`**
- Try `expr.toTeX()`, fallback to `expr.text()`

**`parseTerms(exprStr)`**
- Split expression string on `+` and `-` preserving signs
- Return array of `{ sign: '+'/'-', raw: string, latex: string }`
- Skip empty/zero terms
- For each term, try `nerdamer(raw).toTeX()` for display LaTeX

**`termsToExpr(terms)`**
- Reconstruct nerdamer expression string from terms array

**`detectVariable(equationStr)`**
- Find first alphabetic character, default to 'x'

### js/solver.js -- Solver module

**`solve(latexInput)`**
- Try `solveStepByStep(latexInput)`
- On catch: fall back to `fallbackSolve(latexInput)`

**`solveStepByStep(latexInput)`**
1. Convert LaTeX to nerdamer format via `MathUtils.latexToNerdamer()`
2. Split on `=`, validate exactly 2 sides
3. Detect variable
4. **Step 0:** Record starting equation
5. **Step 1:** Expand both sides with `nerdamer('expand(...)') ` -- skip if no change
6. **Step 2:** Parse terms on both sides. Move constant terms from LHS to RHS (subtract/add). Move variable terms from RHS to LHS. Each move = one step with Hungarian rule label.
7. **Step 3:** Simplify both sides with `nerdamer('simplify(...)')` -- skip if no change
8. **Step 4:** Extract coefficient of variable. If != 1, divide both sides. Record step.
9. **Step 5:** Verify with `nerdamer.solve(equation, variable)`. Add final solution step with `isFinal: true`.

Each step returns: `{ latex, rule, lhs, rhs, isFinal? }`

**`fallbackSolve(latexInput)`**
- Show starting equation + direct `nerdamer.solve()` result
- Two steps: start + solution (or "Nincs megoldas" if solve fails)

---

## Console test procedure

Open the app in browser, open DevTools console, run:

```javascript
// Test 1: simplest linear
console.log(Solver.solve('x + 5 = 10'));
// Expected: 3+ steps ending with x = 5

// Test 2: coefficient + constant
console.log(Solver.solve('2x - 3 = 7'));
// Expected: steps ending with x = 5

// Test 3: variables on both sides
console.log(Solver.solve('3x + 2 = x - 4'));
// Expected: steps ending with x = -3

// Test 4: parentheses
console.log(Solver.solve('2(x + 3) = 10'));
// Expected: expansion step + solve, x = 2

// Test 5: LaTeX fraction (simulates OCR output)
console.log(Solver.solve('\\frac{x}{2} + 1 = 5'));
// Expected: steps ending with x = 8

// Test utils directly
console.log(MathUtils.latexToNerdamer('\\frac{x}{2} + 1 = 5'));
// Expected: "(x)/(2)+1=5" or similar

console.log(MathUtils.parseTerms('2*x+3-5'));
// Expected: [{sign:'+', raw:'2*x', ...}, {sign:'+', raw:'3', ...}, {sign:'-', raw:'5', ...}]
```

---

## Review checklist

All testing is in browser console -- no UI changes in this run:

- [ ] `Solver.solve('x + 5 = 10')` returns array with correct steps ending in x = 5
- [ ] `Solver.solve('2x - 3 = 7')` returns steps ending in x = 5
- [ ] `Solver.solve('3x + 2 = x - 4')` returns steps with variable terms moved, ending in x = -3
- [ ] `Solver.solve('2(x + 3) = 10')` shows expansion step, ending in x = 2
- [ ] `Solver.solve('\\frac{x}{2} + 1 = 5')` handles LaTeX fraction, ending in x = 8
- [ ] Each step has a Hungarian `rule` label (not empty, not English)
- [ ] Each step has `lhs` and `rhs` strings (nerdamer format, for use by drag-and-drop later)
- [ ] Final step has `isFinal: true`
- [ ] LaTeX output in each step renders correctly if passed to `katex.render()`
- [ ] `MathUtils.latexToNerdamer()` handles implicit multiplication, fractions, sqrt
- [ ] `MathUtils.parseTerms()` correctly splits terms with signs
- [ ] Invalid input (e.g., `Solver.solve('hello')`) falls back gracefully, no crash
- [ ] No console errors for valid equations
