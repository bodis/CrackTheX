// solver.js — Custom step-by-step solver on nerdamer

const Solver = {

  /**
   * Main entry point. Takes LaTeX equation string, returns array of steps.
   * Each step: { latex, rule, lhs, rhs, isFinal?, alternatives? }
   */
  solve(latexInput) {
    try {
      return this.solveStepByStep(latexInput);
    } catch (err) {
      console.error('Step-by-step solver failed:', err);
      return this.fallbackSolve(latexInput);
    }
  },

  /**
   * Detect if we can divide both sides by a common factor before expanding.
   * Returns { divisor, innerLhs } or null.
   * Matches pattern: N*(expr_with_var) = constant (where constant is divisible by N)
   */
  canDivideFirst(lhsStr, rhsStr, variable) {
    // Pattern: entire LHS is N*(...)  with no terms outside
    const match = lhsStr.match(/^(-?\d+)\*\((.+)\)$/);
    if (!match) return null;

    const divisor = parseInt(match[1]);
    const innerExpr = match[2];
    if (divisor === 0 || divisor === 1 || divisor === -1) return null;
    if (!innerExpr.includes(variable)) return null;

    // Check RHS is a number divisible by divisor
    try {
      const rhsVal = parseFloat(nerdamer(rhsStr).text());
      if (isNaN(rhsVal)) return null;
      if (rhsVal % divisor !== 0) return null;
      return { divisor, innerLhs: innerExpr };
    } catch {
      return null;
    }
  },

  /**
   * Run the standard solve pipeline (expand → move terms → simplify → divide)
   * starting from already-parsed lhs/rhs strings. Used for both primary and alternative paths.
   */
  solveFromExpanded(lhsStr, rhsStr, variable) {
    const steps = [];
    let lhs = nerdamer(lhsStr);
    let rhs = nerdamer(rhsStr);

    // Move variable terms to LHS, constants to RHS
    const lhsTerms = MathUtils.parseTerms(lhs.text());
    const rhsTerms = MathUtils.parseTerms(rhs.text());

    const lhsConstants = lhsTerms.filter(t => !t.raw.includes(variable));
    const rhsVariables = rhsTerms.filter(t => t.raw.includes(variable));

    for (const term of lhsConstants) {
      const op = term.sign === '+' ? '-' : '+';
      const opStr = op + term.raw;
      lhs = nerdamer('expand(' + lhs.text() + opStr + ')');
      rhs = nerdamer('expand(' + rhs.text() + opStr + ')');
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: (op === '-' ? STRINGS.subtractBothSides : STRINGS.addBothSides) + ': ' + term.raw,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    for (const term of rhsVariables) {
      const op = term.sign === '+' ? '-' : '+';
      const opStr = op + term.raw;
      lhs = nerdamer('expand(' + lhs.text() + opStr + ')');
      rhs = nerdamer('expand(' + rhs.text() + opStr + ')');
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: (op === '-' ? STRINGS.subtractBothSides : STRINGS.addBothSides) + ': ' + term.raw,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Simplify
    const lhsSimp = nerdamer('simplify(' + lhs.text() + ')');
    const rhsSimp = nerdamer('simplify(' + rhs.text() + ')');
    if (lhsSimp.text() !== lhs.text() || rhsSimp.text() !== rhs.text()) {
      lhs = lhsSimp;
      rhs = rhsSimp;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: STRINGS.simplify,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Divide by coefficient
    const lhsText = lhs.text();
    const coeffMatch = lhsText.match(new RegExp('(-?\\d+(?:\\.\\d+)?)\\*?' + variable));
    if (coeffMatch) {
      const coeff = parseFloat(coeffMatch[1]);
      if (coeff !== 1 && coeff !== 0) {
        lhs = nerdamer('simplify((' + lhs.text() + ')/(' + coeff + '))');
        rhs = nerdamer('simplify((' + rhs.text() + ')/(' + coeff + '))');
        steps.push({
          latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
          rule: STRINGS.divideBothSides + ': ' + coeff,
          lhs: lhs.text(),
          rhs: rhs.text()
        });
      }
    }

    return { steps, lhs: lhs.text(), rhs: rhs.text() };
  },

  /**
   * Perform layered expansion on an expression string, recording each layer as a step.
   * Returns { expr, steps[] } where steps are the expansion steps generated.
   */
  layeredExpand(exprStr, side) {
    const steps = [];
    let current = exprStr;
    let iterations = 0;

    while (iterations < 10) {
      const result = MathUtils.expandOneLayer(current);
      if (!result.changed) break;

      current = result.expr;
      steps.push({
        expr: current,
        description: result.description,
        isSimplify: result.isSimplify || false
      });
      iterations++;
    }

    // Final simplify pass to combine like terms (only if actual terms are reduced)
    try {
      const simplified = nerdamer('expand(' + current + ')').text();
      if (simplified !== current) {
        const origOps = (current.match(/[+-]/g) || []).length;
        const simpOps = (simplified.match(/[+-]/g) || []).length;
        // Only add step if terms were actually combined, not just reordered
        if (simpOps < origOps || simplified.length < current.length - 2) {
          current = simplified;
          steps.push({ expr: current, description: null, isSimplify: true });
        } else {
          // Accept nerdamer's canonical form silently (no visible step)
          current = simplified;
        }
      }
    } catch { /* keep current */ }

    return { expr: current, steps };
  },

  solveStepByStep(latexInput) {
    const nerdamerStr = MathUtils.latexToNerdamer(latexInput);
    const parts = nerdamerStr.split('=');

    if (parts.length !== 2) {
      throw new Error('Not a valid equation (no = sign or multiple = signs)');
    }

    let lhsStr = parts[0].trim();
    let rhsStr = parts[1].trim();
    const variable = MathUtils.detectVariable(nerdamerStr);

    const steps = [];

    // ── Step 0: Starting equation — preserve original display ──
    const step0Latex = MathUtils.nerdamerStrToDisplayLatex(lhsStr)
                     + ' = '
                     + MathUtils.nerdamerStrToDisplayLatex(rhsStr);
    steps.push({
      latex: step0Latex,
      rule: STRINGS.startingEquation,
      lhs: lhsStr,
      rhs: rhsStr
    });

    // ── Strategy selection ──
    const divideFirst = this.canDivideFirst(lhsStr, rhsStr, variable);

    if (divideFirst) {
      // ── Divide-first strategy ──
      const divisor = divideFirst.divisor;
      const newLhs = divideFirst.innerLhs;
      const newRhs = nerdamer('simplify((' + rhsStr + ')/(' + divisor + '))').text();

      // Compute alternative: what would expand look like?
      let altPreview = '';
      try {
        const expanded = nerdamer('expand(' + lhsStr + ')').text();
        altPreview = MathUtils.nerdamerStrToDisplayLatex(expanded)
                   + ' = '
                   + MathUtils.nerdamerStrToDisplayLatex(rhsStr);
      } catch { /* no alternative */ }

      steps.push({
        latex: MathUtils.nerdamerStrToDisplayLatex(newLhs) + ' = ' + MathUtils.nerdamerStrToDisplayLatex(newRhs),
        rule: STRINGS.divideBothSides + ': ' + divisor,
        lhs: newLhs,
        rhs: newRhs,
        alternatives: altPreview ? [{
          label: STRINGS.expandOuter,
          description: STRINGS.altExpandDesc,
          previewLatex: altPreview
        }] : undefined
      });

      // Continue pipeline with the simplified equation
      lhsStr = newLhs;
      rhsStr = newRhs;

    } else {
      // ── Layered expansion strategy ──
      const lhsExpansion = this.layeredExpand(lhsStr, 'lhs');
      const rhsExpansion = this.layeredExpand(rhsStr, 'rhs');

      // Merge expansion steps from both sides
      const maxSteps = Math.max(lhsExpansion.steps.length, rhsExpansion.steps.length);
      let currentLhs = lhsStr;
      let currentRhs = rhsStr;

      for (let i = 0; i < maxSteps; i++) {
        const lStep = lhsExpansion.steps[i];
        const rStep = rhsExpansion.steps[i];
        if (lStep) currentLhs = lStep.expr;
        if (rStep) currentRhs = rStep.expr;

        // Determine rule label
        let rule;
        const isSimplify = (lStep && lStep.isSimplify) || (rStep && rStep.isSimplify);
        if (isSimplify) {
          rule = STRINGS.simplifyTerms;
        } else {
          const desc = (lStep && lStep.description) || (rStep && rStep.description);
          rule = desc ? STRINGS.expandOuter + ': ' + desc : STRINGS.expandParens;
        }

        // Use nerdamerStrToDisplayLatex to preserve intermediate structure
        // (nerdamer auto-simplifies on parse, collapsing intermediate steps)
        const lhsDisplay = MathUtils.nerdamerStrToDisplayLatex(currentLhs);
        const rhsDisplay = MathUtils.nerdamerStrToDisplayLatex(currentRhs);

        const expandStep = {
          latex: lhsDisplay + ' = ' + rhsDisplay,
          rule: rule,
          lhs: currentLhs,
          rhs: currentRhs
        };

        // On the first expansion step, check if divide-first was an option
        // (it wasn't chosen because canDivideFirst returned null, but maybe a
        // weaker form applies — skip for now, only add for exact matches)

        steps.push(expandStep);
      }

      lhsStr = lhsExpansion.expr;
      rhsStr = rhsExpansion.expr;
    }

    // ── Shared pipeline: move terms, simplify, divide ──
    const remaining = this.solveFromExpanded(lhsStr, rhsStr, variable);
    steps.push(...remaining.steps);

    // ── Final verification with nerdamer.solve() ──
    try {
      const verification = nerdamer.solve(nerdamerStr, variable);
      const solStr = verification.toString();
      const cleaned = solStr.replace(/^\[|\]$/g, '');
      steps.push({
        latex: variable + ' = ' + MathUtils.nerdamerToLatex(nerdamer(cleaned)),
        rule: STRINGS.solution,
        lhs: variable,
        rhs: cleaned,
        isFinal: true
      });
    } catch {
      if (steps.length > 0) {
        steps[steps.length - 1].isFinal = true;
      }
    }

    // Deduplicate consecutive steps with identical latex
    const deduped = [steps[0]];
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].latex !== steps[i - 1].latex) {
        deduped.push(steps[i]);
      }
    }

    return deduped;
  },

  /**
   * Fallback: just show original and final answer.
   */
  fallbackSolve(latexInput) {
    const steps = [];
    const nerdamerStr = MathUtils.latexToNerdamer(latexInput);
    const variable = MathUtils.detectVariable(nerdamerStr);

    steps.push({
      latex: latexInput,
      rule: STRINGS.startingEquation,
      lhs: '',
      rhs: ''
    });

    try {
      const solution = nerdamer.solve(nerdamerStr, variable);
      const solStr = solution.toString();
      const cleaned = solStr.replace(/^\[|\]$/g, '');
      steps.push({
        latex: variable + ' = ' + MathUtils.nerdamerToLatex(nerdamer(cleaned)),
        rule: STRINGS.directSolution,
        lhs: variable,
        rhs: cleaned,
        isFinal: true
      });
    } catch {
      steps.push({
        latex: STRINGS.noSolution,
        rule: STRINGS.errorParsing,
        lhs: '',
        rhs: '',
        isFinal: true
      });
    }

    return steps;
  }
};
