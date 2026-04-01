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
