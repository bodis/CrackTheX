// utils.js — LaTeX<->nerdamer conversion, term parsing

const MathUtils = {

  /**
   * Convert LaTeX (from Mathpix OCR) to nerdamer-compatible format.
   */
  latexToNerdamer(latex) {
    let expr = latex;

    // Remove display math delimiters
    expr = expr.replace(/\\left|\\right/g, '');

    // Convert fractions: \frac{a}{b} -> (a)/(b)
    // Handle nested fractions by running multiple passes
    for (let i = 0; i < 3; i++) {
      expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    }

    // Convert sqrt: \sqrt[n]{x} -> (x)^(1/n), \sqrt{x} -> sqrt(x)
    expr = expr.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '($2)^(1/$1)');
    expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');

    // Convert powers: x^{2} -> x^(2)
    expr = expr.replace(/\^{([^}]+)}/g, '^($1)');

    // Convert cdot/times to *
    expr = expr.replace(/\\cdot/g, '*');
    expr = expr.replace(/\\times/g, '*');
    expr = expr.replace(/\\div/g, '/');

    // Remove LaTeX spacing commands
    expr = expr.replace(/\\[,;:!]\s*/g, '');
    expr = expr.replace(/\\quad|\\qquad/g, '');

    // Remove remaining backslash commands (but not the content)
    expr = expr.replace(/\\(?:text|mathrm|mathit)\{([^}]+)\}/g, '$1');

    // Add implicit multiplication: 2x -> 2*x, )(  -> )*(, x( -> x*(
    expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    expr = expr.replace(/\)\(/g, ')*(');
    // x( -> x*( but NOT for function names like sqrt(, abs(, log(, etc.
    expr = expr.replace(/(?<![a-zA-Z])([a-zA-Z])\(/g, '$1*(');
    expr = expr.replace(/\)([a-zA-Z0-9])/g, ')*$1');

    // Clean up whitespace
    expr = expr.replace(/\s+/g, '');

    return expr;
  },

  /**
   * Convert nerdamer expression to display LaTeX.
   */
  nerdamerToLatex(nerdamerExpr) {
    try {
      return nerdamerExpr.toTeX();
    } catch {
      return nerdamerExpr.text();
    }
  },

  /**
   * Parse an equation side string into individual terms.
   * Input: "2*x+3-5*y" -> [{sign:'+', raw:'2*x', latex:'2x'}, ...]
   */
  parseTerms(exprStr) {
    const terms = [];
    let str = exprStr.replace(/\s/g, '');

    // Split on + and - while preserving sign
    const matches = str.match(/[+-]?[^+-]+/g);
    if (!matches) return terms;

    for (const match of matches) {
      let sign = '+';
      let raw = match.trim();

      if (raw.startsWith('-')) {
        sign = '-';
        raw = raw.substring(1);
      } else if (raw.startsWith('+')) {
        raw = raw.substring(1);
      }

      if (raw === '' || raw === '0') continue;

      // Generate display LaTeX for this term
      let latex;
      try {
        latex = nerdamer(raw).toTeX();
      } catch {
        latex = raw;
      }

      terms.push({ sign, raw, latex });
    }

    return terms;
  },

  /**
   * Reconstruct nerdamer expression from terms array.
   */
  termsToExpr(terms) {
    if (terms.length === 0) return '0';
    return terms.map((t, i) => {
      const prefix = t.sign === '-' ? '-' : (i > 0 ? '+' : '');
      return prefix + t.raw;
    }).join('');
  },

  /**
   * Detect the variable to solve for (first alphabetic variable found).
   */
  detectVariable(equationStr) {
    const match = equationStr.match(/[a-zA-Z]/);
    return match ? match[0] : 'x';
  },

  /**
   * Strip LaTeX commands to produce readable plain text for sidebar cards.
   * e.g. "\\frac{2x}{3} + 1 = 7" → "(2x)/(3) + 1 = 7"
   */
  latexToPlainText(latex) {
    if (!latex) return '';
    return latex
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\[a-zA-Z]+\{?/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Convert nerdamer-syntax string to display LaTeX WITHOUT parsing through nerdamer.
   * This preserves the original structure (parentheses, grouping) that nerdamer would auto-simplify.
   * e.g. "5*(23-x)+34" → "5(23-x)+34"
   */
  nerdamerStrToDisplayLatex(str) {
    if (!str) return '';
    let result = str;

    // (a)/(b) → \frac{a}{b} (handle nested by running multiple passes)
    for (let i = 0; i < 3; i++) {
      result = result.replace(/\(([^()]+)\)\/\(([^()]+)\)/g, '\\frac{$1}{$2}');
    }

    // ^(n) → ^{n}
    result = result.replace(/\^\(([^()]+)\)/g, '^{$1}');

    // Remove * between digit and letter: 5*x → 5x
    result = result.replace(/(\d)\*([a-zA-Z])/g, '$1$2');
    // Remove * between digit and (: 5*( → 5(
    result = result.replace(/(\d)\*\(/g, '$1(');
    // Remove * between ) and digit: )*5 → )·5 (use cdot here for clarity)
    result = result.replace(/\)\*(\d)/g, ') \\cdot $1');
    // Remove * between ) and (: )*( → )(
    result = result.replace(/\)\*\(/g, ')(');
    // Remove * between ) and letter: )*x → )x
    result = result.replace(/\)\*([a-zA-Z])/g, ')$1');
    // Remove * between letter and (: x*( → x(
    result = result.replace(/([a-zA-Z])\*\(/g, '$1(');

    return result;
  },

  /**
   * Find and expand the innermost coefficient*(…) group in an expression string.
   * Uses parenthesis-depth scanning to find true innermost groups.
   * Returns { expr, changed, description } where description explains what was expanded.
   */
  expandOneLayer(exprStr) {
    // Find all innermost parenthesized groups (those containing no nested parens)
    const groups = [];
    let i = 0;
    while (i < exprStr.length) {
      if (exprStr[i] === '(') {
        let depth = 1;
        let j = i + 1;
        let hasNested = false;
        while (j < exprStr.length && depth > 0) {
          if (exprStr[j] === '(') { depth++; hasNested = true; }
          if (exprStr[j] === ')') depth--;
          j++;
        }
        if (depth === 0 && !hasNested) {
          const content = exprStr.substring(i + 1, j - 1);
          groups.push({ start: i, end: j, content });
        }
      }
      i++;
    }

    // Priority 1: Simplify terms INSIDE a paren group that has multiple like terms
    // e.g. (2*X-68-23) → (2*X-91)
    // Only trigger if actual terms were combined (fewer +/- operators), not just reordered
    for (const group of groups) {
      if (/[+-]/.test(group.content.substring(1))) {
        try {
          const simplified = nerdamer(group.content).text();
          if (simplified !== group.content) {
            // Count operators to detect real simplification vs mere reordering
            const origOps = (group.content.match(/[+-]/g) || []).length;
            const simpOps = (simplified.match(/[+-]/g) || []).length;
            if (simpOps < origOps) {
              const newExpr = exprStr.substring(0, group.start) + '(' + simplified + ')' + exprStr.substring(group.end);
              if (newExpr !== exprStr) {
                return {
                  expr: newExpr,
                  changed: true,
                  description: null,
                  isSimplify: true
                };
              }
            }
          }
        } catch { /* skip */ }
      }
    }

    // Priority 2: Expand innermost coefficient*(…) group
    for (const group of groups) {
      const before = exprStr.substring(0, group.start);
      const after = exprStr.substring(group.end);

      // Check for coefficient before: ...N*(
      const coeffBeforeMatch = before.match(/(-?\d+)\*?$/);
      if (coeffBeforeMatch) {
        const coeff = coeffBeforeMatch[1];
        const coeffStart = group.start - coeffBeforeMatch[0].length;
        const subExpr = coeff + '*(' + group.content + ')';
        try {
          const expanded = nerdamer('expand(' + subExpr + ')').text();
          if (expanded !== subExpr && expanded !== group.content) {
            const newExpr = exprStr.substring(0, coeffStart) + expanded + after;
            return {
              expr: newExpr,
              changed: true,
              description: coeff + '(' + group.content + ')'
            };
          }
        } catch { /* skip */ }
      }

      // Check for coefficient after: (...)*N
      const coeffAfterMatch = after.match(/^\*?(\d+(?:\.\d+)?)/);
      if (coeffAfterMatch && !coeffBeforeMatch) {
        const coeff = coeffAfterMatch[1];
        const subExpr = '(' + group.content + ')*' + coeff;
        try {
          const expanded = nerdamer('expand(' + subExpr + ')').text();
          if (expanded !== subExpr) {
            const newExpr = before + expanded + after.substring(coeffAfterMatch[0].length);
            return {
              expr: newExpr,
              changed: true,
              description: '(' + group.content + ')·' + coeff
            };
          }
        } catch { /* skip */ }
      }
    }

    // Priority 3: Remove bare grouping parens (no adjacent coefficient)
    for (const group of groups) {
      const before = exprStr.substring(0, group.start);
      const after = exprStr.substring(group.end);
      const hasCoeffBefore = /[\d)]\*?$/.test(before);
      const hasCoeffAfter = /^\*?[\d(]/.test(after);
      if (!hasCoeffBefore && !hasCoeffAfter) {
        const newExpr = before + group.content + after;
        if (newExpr !== exprStr) {
          return { expr: newExpr, changed: true, description: null };
        }
      }
    }

    return { expr: exprStr, changed: false, description: null };
  },

  /**
   * Convert plain math notation to LaTeX for KaTeX preview.
   * Only used for rendering — the solver receives the raw input.
   * If input contains backslashes, assume LaTeX and return as-is.
   */
  plainMathToLatex(input) {
    if (!input || input.includes('\\')) return input;

    let result = input;

    // sqrt(...) → \sqrt{...}
    result = result.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

    // Fractions: must run group patterns first to avoid partial matches
    // (group)/(group)
    result = result.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
    // (group)/token
    result = result.replace(/\(([^)]+)\)\s*\/\s*([a-zA-Z0-9]+)/g, '\\frac{$1}{$2}');
    // token/(group)
    result = result.replace(/([a-zA-Z0-9]+)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
    // token/token
    result = result.replace(/([a-zA-Z0-9]+)\s*\/\s*([a-zA-Z0-9]+)/g, '\\frac{$1}{$2}');

    // * → \cdot
    result = result.replace(/\*/g, ' \\cdot ');

    return result;
  }
};
