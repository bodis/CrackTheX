// solver.js — Custom step-by-step solver on nerdamer

const Solver = {

  /**
   * Main entry point. Takes LaTeX equation string, returns array of steps.
   * Each step: { latex: string, rule: string, lhs: string, rhs: string, isFinal?: boolean }
   */
  solve(latexInput) {
    try {
      return this.solveStepByStep(latexInput);
    } catch (err) {
      console.error('Step-by-step solver failed:', err);
      return this.fallbackSolve(latexInput);
    }
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

    // Step 0: Starting equation
    let lhs = nerdamer(lhsStr);
    let rhs = nerdamer(rhsStr);
    steps.push({
      latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
      rule: STRINGS.startingEquation,
      lhs: lhs.text(),
      rhs: rhs.text()
    });

    // Step 1: Expand both sides
    const lhsExpanded = nerdamer('expand(' + lhs.text() + ')');
    const rhsExpanded = nerdamer('expand(' + rhs.text() + ')');
    if (lhsExpanded.text() !== lhs.text() || rhsExpanded.text() !== rhs.text()) {
      lhs = lhsExpanded;
      rhs = rhsExpanded;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: STRINGS.expandParens,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Step 2: Move variable terms to LHS, constants to RHS
    const lhsTerms = MathUtils.parseTerms(lhs.text());
    const rhsTerms = MathUtils.parseTerms(rhs.text());

    // Find constant terms on LHS (move to RHS)
    const lhsConstants = lhsTerms.filter(t => !t.raw.includes(variable));
    // Find variable terms on RHS (move to LHS)
    const rhsVariables = rhsTerms.filter(t => t.raw.includes(variable));

    // Move constants from LHS to RHS
    for (const term of lhsConstants) {
      const op = term.sign === '+' ? '-' : '+';
      const opStr = op + term.raw;
      lhs = nerdamer('expand(' + lhs.text() + opStr + ')');
      rhs = nerdamer('expand(' + rhs.text() + opStr + ')');

      const ruleLabel = op === '-' ? STRINGS.subtractBothSides : STRINGS.addBothSides;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: ruleLabel + ': ' + term.raw,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Move variable terms from RHS to LHS
    for (const term of rhsVariables) {
      const op = term.sign === '+' ? '-' : '+';
      const opStr = op + term.raw;
      lhs = nerdamer('expand(' + lhs.text() + opStr + ')');
      rhs = nerdamer('expand(' + rhs.text() + opStr + ')');

      const ruleLabel = op === '-' ? STRINGS.subtractBothSides : STRINGS.addBothSides;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: ruleLabel + ': ' + term.raw,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Step 3: Simplify
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

    // Step 4: Divide by coefficient of variable
    const lhsText = lhs.text();
    const coeffMatch = lhsText.match(new RegExp('(-?\\d+(?:\\.\\d+)?)\\*?' + variable));
    if (coeffMatch) {
      const coeff = parseFloat(coeffMatch[1]);
      if (coeff !== 1 && coeff !== 0) {
        lhs = nerdamer('(' + lhs.text() + ')/(' + coeff + ')');
        rhs = nerdamer('(' + rhs.text() + ')/(' + coeff + ')');
        lhs = nerdamer('simplify(' + lhs.text() + ')');
        rhs = nerdamer('simplify(' + rhs.text() + ')');
        steps.push({
          latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
          rule: STRINGS.divideBothSides + ': ' + coeff,
          lhs: lhs.text(),
          rhs: rhs.text()
        });
      }
    }

    // Step 5: Verify with nerdamer.solve()
    try {
      const verification = nerdamer.solve(nerdamerStr, variable);
      const solStr = verification.toString();
      // nerdamer.solve returns [val] format -- strip brackets
      const cleaned = solStr.replace(/^\[|\]$/g, '');
      steps.push({
        latex: variable + ' = ' + MathUtils.nerdamerToLatex(nerdamer(cleaned)),
        rule: STRINGS.solution,
        lhs: variable,
        rhs: cleaned,
        isFinal: true
      });
    } catch {
      // Verification failed, last step is the best we have
      if (steps.length > 0) {
        steps[steps.length - 1].isFinal = true;
      }
    }

    return steps;
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
