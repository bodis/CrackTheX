// interactive-board.js — Step card rendering + action-based equation operations

const InteractiveBoard = {
  currentEquation: null,
  steps: [],
  _fabTween: null,
  _originalLatex: null,
  _solverSteps: [],
  _userSteps: [],
  _revealedCount: 0,
  _displayedStepCount: 0,

  /** Get a copyable text history of all displayed steps (for testing/debugging) */
  getTextHistory() {
    const lines = [];
    const displayed = [...this._solverSteps.slice(0, this._revealedCount), ...this._userSteps];
    displayed.forEach((step, i) => {
      const rule = step.ruleKey ? (step.ruleParam ? step.ruleKey + ': ' + step.ruleParam : step.ruleKey) : step.rule;
      lines.push((i === 0 ? 'initial' : rule) + ': ' + step.lhs + ' = ' + step.rhs);
    });
    return lines.join('\n');
  },

  getState() {
    // Return steps even if currentEquation is null (e.g. fully solved)
    if (!this._solverSteps || this._solverSteps.length === 0) return null;
    const allSteps = [...this._solverSteps, ...this._userSteps];
    const lastStep = allSteps[allSteps.length - 1];
    return {
      latex: this._originalLatex,
      solverSteps: this._solverSteps,
      userSteps: this._userSteps,
      currentLhs: this.currentEquation ? this.currentEquation.lhs : (lastStep && lastStep.lhs) || '',
      currentRhs: this.currentEquation ? this.currentEquation.rhs : (lastStep && lastStep.rhs) || ''
    };
  },

  init(data) {
    const stepsContainer = document.getElementById('steps-container');
    const zone = document.getElementById('interactive-zone');
    stepsContainer.innerHTML = '';
    zone.innerHTML = '';

    this._userSteps = [];
    this._displayedStepCount = 0;
    this._originalLatex = data.latex || (data.boardData && data.boardData.latex);

    if (data.boardData) {
      // Restoring from saved session
      this._solverSteps = data.boardData.solverSteps || [];
      this._userSteps = [...(data.boardData.userSteps || [])];
      this.steps = [...this._solverSteps, ...this._userSteps];

      if (!this.steps || this.steps.length === 0) {
        const errP = document.createElement('p');
        errP.textContent = STRINGS.errorParsing;
        errP.style.cssText = 'text-align:center;color:var(--text-secondary);padding:2rem;';
        stepsContainer.appendChild(errP);
        return;
      }

      // Render all steps
      this.steps.forEach((step, i) => {
        if (i > 0) {
          stepsContainer.appendChild(this.createStepConnector(step));
        }
        stepsContainer.appendChild(this.createStepCard(step, i));
      });

      gsap.from('.step-card', {
        y: 30, opacity: 0, duration: 0.4, stagger: 0.15, ease: 'power2.out'
      });
      gsap.delayedCall(0.3, () => this.animateStepBadges());

      // Restore interactive zone from saved state
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep && lastStep.isFinal) {
        // Already solved — show solution message
        const msg = document.createElement('p');
        msg.textContent = STRINGS.solution + '!';
        msg.style.cssText = 'text-align:center;color:var(--success);font-size:1.25rem;font-weight:600;padding:1.5rem;';
        zone.appendChild(msg);
      } else if (data.boardData.currentLhs && data.boardData.currentRhs) {
        this.setupInteractiveZone({
          lhs: data.boardData.currentLhs,
          rhs: data.boardData.currentRhs
        });
      }
    } else {
      // Fresh solve — show only Step 0, let user solve or reveal hints
      this._solverSteps = Solver.solve(data.latex);
      this.steps = [...this._solverSteps];

      if (!this.steps || this.steps.length === 0) {
        const errP = document.createElement('p');
        errP.textContent = STRINGS.errorParsing;
        errP.style.cssText = 'text-align:center;color:var(--text-secondary);padding:2rem;';
        stepsContainer.appendChild(errP);
        return;
      }

      // Show only the first step (original equation)
      stepsContainer.appendChild(this.createStepCard(this.steps[0], 0));
      this._revealedCount = 1;

      gsap.from('.step-card', {
        y: 30, opacity: 0, duration: 0.4, ease: 'power2.out'
      });
      gsap.delayedCall(0.3, () => this.animateStepBadges());

      // Set up interactive zone from the first step's lhs/rhs
      const firstStep = this.steps[0];
      if (firstStep.lhs && firstStep.rhs) {
        this.setupInteractiveZone(firstStep);
      }

      // Show hint buttons if there are more steps
      if (this.steps.length > 1) {
        this._renderHintButtons(zone);
      }

      // Persist boardData immediately so it survives page refresh
      if (SessionManager.activeSessionId) {
        SessionManager.updateSession(SessionManager.activeSessionId, {
          boardData: this.getState()
        });
      }
    }

    this._fabTween = gsap.to('#btn-new', {
      y: -5,
      duration: 1.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  },

  /** Resolve a step's rule text from ruleKey+ruleParam (i18n-aware) or fall back to static rule */
  _resolveRule(step) {
    if (step.ruleKey) {
      const base = STRINGS[step.ruleKey] || step.rule || step.ruleKey;
      return step.ruleParam ? base + ': ' + step.ruleParam : base;
    }
    return step.rule || '';
  },

  createStepConnector(step) {
    const rule = typeof step === 'string' ? step : this._resolveRule(step);
    const wrapper = document.createElement('div');
    wrapper.className = 'step-connector-wrapper';

    const line1 = document.createElement('div');
    line1.className = 'step-connector';
    wrapper.appendChild(line1);

    if (rule) {
      const label = document.createElement('span');
      label.className = 'step-rule-label';
      label.textContent = rule;
      wrapper.appendChild(label);
    }

    const line2 = document.createElement('div');
    line2.className = 'step-connector';
    wrapper.appendChild(line2);

    return wrapper;
  },

  createStepCard(step, index) {
    this._displayedStepCount++;
    const displayNum = this._displayedStepCount;

    const card = document.createElement('div');
    card.className = 'glass-card step-card';
    card.dataset.step = index;

    // Only show rule inside card for the first displayed step (starting equation)
    if (displayNum === 1) {
      const ruleText = this._resolveRule(step);
      if (ruleText) {
        const rule = document.createElement('span');
        rule.className = 'step-rule';
        rule.textContent = ruleText;
        card.appendChild(rule);
      }
    }

    const badge = document.createElement('span');
    badge.className = 'step-badge';
    badge.textContent = '00';
    badge.dataset.target = displayNum;
    card.appendChild(badge);

    const eqDiv = document.createElement('div');
    eqDiv.className = 'step-equation';
    try {
      katex.render(step.latex, eqDiv, {
        throwOnError: false,
        displayMode: true,
        output: 'html'
      });
    } catch {
      eqDiv.textContent = step.latex;
    }
    card.appendChild(eqDiv);

    if (step.isFinal) {
      card.classList.add('step-card--final');
      card.style.boxShadow = '0 4px 20px var(--success-glow)';
    }

    // Alternative path badge
    if (step.alternatives && step.alternatives.length > 0) {
      const altBtn = document.createElement('button');
      altBtn.className = 'step-alt-badge';
      altBtn.textContent = STRINGS.alternativePath;
      altBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const existing = card.querySelector('.step-alt-panel');
        if (existing) {
          gsap.to(existing, {
            height: 0, opacity: 0, duration: 0.25, ease: 'power2.in',
            onComplete: () => existing.remove()
          });
          return;
        }
        const panel = document.createElement('div');
        panel.className = 'step-alt-panel';
        panel.style.height = '0';
        panel.style.opacity = '0';
        panel.style.overflow = 'hidden';

        for (const alt of step.alternatives) {
          const label = document.createElement('div');
          label.className = 'step-alt-label';
          label.textContent = alt.label;
          panel.appendChild(label);

          const desc = document.createElement('div');
          desc.className = 'step-alt-desc';
          desc.textContent = alt.description;
          panel.appendChild(desc);

          if (alt.previewLatex) {
            const preview = document.createElement('div');
            preview.className = 'step-alt-preview';
            try {
              katex.render(alt.previewLatex, preview, { throwOnError: false, displayMode: true, output: 'html' });
            } catch {
              preview.textContent = alt.previewLatex;
            }
            panel.appendChild(preview);
          }
        }

        card.appendChild(panel);
        gsap.to(panel, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' });
      });
      card.appendChild(altBtn);
    }

    return card;
  },

  setupInteractiveZone(step) {
    const zone = document.getElementById('interactive-zone');
    zone.innerHTML = '';

    this.currentEquation = {
      lhs: step.lhs,
      rhs: step.rhs
    };

    // 1. Display current equation (read-only KaTeX)
    // Use nerdamerStrToDisplayLatex to avoid auto-simplification
    const eqDisplay = document.createElement('div');
    eqDisplay.className = 'action-equation-display';
    try {
      const lhsLatex = MathUtils.nerdamerStrToDisplayLatex(step.lhs);
      const rhsLatex = MathUtils.nerdamerStrToDisplayLatex(step.rhs);
      katex.render(lhsLatex + ' = ' + rhsLatex, eqDisplay, {
        throwOnError: false, displayMode: true, output: 'html'
      });
    } catch {
      eqDisplay.textContent = step.lhs + ' = ' + step.rhs;
    }
    zone.appendChild(eqDisplay);

    // 2. Action buttons row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'action-buttons-row';

    const actions = [
      { id: 'add',      label: '+',            needsInput: true },
      { id: 'subtract', label: '\u2212',       needsInput: true },
      { id: 'multiply', label: '\u00d7',       needsInput: true },
      { id: 'divide',   label: '\u00f7',       needsInput: true }
    ];

    // Conditionally show Expand if equation has parentheses
    const eqText = step.lhs + '=' + step.rhs;
    if (eqText.includes('(')) {
      actions.push({ id: 'expand', label: STRINGS.expandParens, needsInput: false });
    }
    actions.push({ id: 'simplify', label: STRINGS.simplifyTerms, needsInput: false });

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'action-btn' + (action.needsInput ? '' : ' action-btn--auto');
      btn.dataset.action = action.id;
      btn.textContent = action.label;
      btn.addEventListener('click', () => this._handleAction(action));
      actionsRow.appendChild(btn);
    });
    zone.appendChild(actionsRow);

    // 3. Input area (hidden by default)
    const inputArea = document.createElement('div');
    inputArea.className = 'action-input-area';
    inputArea.id = 'action-input-area';
    inputArea.style.display = 'none';
    zone.appendChild(inputArea);

    // 4. Free rewrite button
    const rewriteBtn = document.createElement('button');
    rewriteBtn.className = 'action-btn action-btn--rewrite';
    rewriteBtn.textContent = STRINGS.freeRewrite;
    rewriteBtn.addEventListener('click', () => this._showRewriteInput());
    zone.appendChild(rewriteBtn);
  },

  _handleAction(action) {
    // Highlight active button
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector('.action-btn[data-action="' + action.id + '"]');
    if (activeBtn) activeBtn.classList.add('active');

    if (!action.needsInput) {
      this._executeAction(action.id, null);
      return;
    }

    const inputArea = document.getElementById('action-input-area');
    inputArea.style.display = '';
    inputArea.innerHTML = '';

    const labels = {
      add: STRINGS.addBothSides,
      subtract: STRINGS.subtractBothSides,
      multiply: STRINGS.multiplyBothSides,
      divide: STRINGS.divideBothSides
    };

    const label = document.createElement('span');
    label.className = 'action-input-label';
    label.textContent = labels[action.id] + ':';
    inputArea.appendChild(label);

    const input = document.createElement('input');
    input.className = 'glass-input action-value-input';
    input.type = 'text';
    input.placeholder = 'pl. 3, 2x, (x+1)';
    inputArea.appendChild(input);

    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn-primary btn-accent action-apply-btn';
    applyBtn.textContent = STRINGS.apply;
    applyBtn.addEventListener('click', () => {
      const value = input.value.trim();
      if (value) this._executeAction(action.id, value);
    });
    inputArea.appendChild(applyBtn);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        if (value) this._executeAction(action.id, value);
      }
    });

    gsap.from(inputArea, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.out' });
    requestAnimationFrame(() => input.focus());
  },

  _executeAction(actionId, value) {
    const eq = this.currentEquation;

    // Convert Unicode math operators to ASCII for nerdamer
    if (value) {
      value = value.replace(/[⋅·]/g, '*').replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    }

    // Expand and simplify use string-level manipulation (expandOneLayer)
    // to avoid nerdamer auto-simplification. Other actions use nerdamer directly.
    if (actionId === 'expand') {
      this._doExpand(eq);
      return;
    }
    if (actionId === 'simplify') {
      this._doSimplify(eq);
      return;
    }

    let newLhs, newRhs, ruleKey, ruleParam;

    try {
      switch (actionId) {
        case 'add':
          newLhs = nerdamer('expand(' + eq.lhs + '+(' + value + '))');
          newRhs = nerdamer('expand(' + eq.rhs + '+(' + value + '))');
          ruleKey = 'addBothSides'; ruleParam = value;
          break;
        case 'subtract':
          newLhs = nerdamer('expand(' + eq.lhs + '-(' + value + '))');
          newRhs = nerdamer('expand(' + eq.rhs + '-(' + value + '))');
          ruleKey = 'subtractBothSides'; ruleParam = value;
          break;
        case 'multiply':
          newLhs = nerdamer('expand((' + eq.lhs + ')*(' + value + '))');
          newRhs = nerdamer('expand((' + eq.rhs + ')*(' + value + '))');
          ruleKey = 'multiplyBothSides'; ruleParam = value;
          break;
        case 'divide':
          try {
            if (nerdamer(value).text() === '0') {
              this._showActionFeedback(STRINGS.divisionByZero);
              return;
            }
          } catch { /* let nerdamer handle it */ }
          newLhs = nerdamer('simplify((' + eq.lhs + ')/(' + value + '))');
          newRhs = nerdamer('simplify((' + eq.rhs + ')/(' + value + '))');
          ruleKey = 'divideBothSides'; ruleParam = value;
          break;
        default:
          return;
      }

      const lhsText = newLhs.text();
      const rhsText = newRhs.text();
      this._createActionStep(lhsText, rhsText, ruleKey, ruleParam, eq);
    } catch (err) {
      console.error('Action failed:', err);
      this._showActionFeedback(STRINGS.actionError);
    }
  },

  /** Expand one layer of innermost parentheses via pure distribution (no combining) */
  _doExpand(eq) {
    try {
      const lhsResult = this._distributeOneLayer(eq.lhs);
      if (lhsResult.changed) {
        this._createStringStep(lhsResult.expr, eq.rhs, 'expandParens', lhsResult.description, eq);
        return;
      }

      const rhsResult = this._distributeOneLayer(eq.rhs);
      if (rhsResult.changed) {
        this._createStringStep(eq.lhs, rhsResult.expr, 'expandParens', rhsResult.description, eq);
        return;
      }

      this._showActionFeedback(STRINGS.nothingToExpand);
    } catch (err) {
      console.error('Expand failed:', err);
      this._showActionFeedback(STRINGS.actionError);
    }
  },

  /**
   * Pure mechanical distribution: finds innermost coeff*(group) and distributes
   * term by term WITHOUT combining. e.g. -3*(23+x-43) → -69-3*x+129
   */
  _distributeOneLayer(exprStr) {
    // Find innermost paren groups (no nested parens inside)
    const groups = [];
    for (let i = 0; i < exprStr.length; i++) {
      if (exprStr[i] === '(') {
        let depth = 1, j = i + 1, hasNested = false;
        while (j < exprStr.length && depth > 0) {
          if (exprStr[j] === '(') { depth++; hasNested = true; }
          if (exprStr[j] === ')') depth--;
          j++;
        }
        if (depth === 0 && !hasNested) {
          groups.push({ start: i, end: j, content: exprStr.substring(i + 1, j - 1) });
        }
      }
    }

    // Try to find coeff*(group) and distribute
    for (const group of groups) {
      const before = exprStr.substring(0, group.start);
      const after = exprStr.substring(group.end);

      const coeffMatch = before.match(/(-?\d+)\*?$/);
      if (!coeffMatch) continue;

      const coeff = coeffMatch[1];
      const coeffStart = group.start - coeffMatch[0].length;
      const description = coeff + '(' + group.content + ')';

      // Split content into signed terms: "23+x-43" → ["23", "+x", "-43"]
      const terms = group.content.match(/[+-]?[^+-]+/g);
      if (!terms) continue;

      // Distribute: multiply each term by coefficient individually
      const distributed = terms.map(t => {
        t = t.trim();
        try { return nerdamer(coeff + '*(' + t + ')').text(); } catch { return coeff + '*' + t; }
      });

      // Join with + and clean up double signs
      let result = distributed.join('+').replace(/\+\-/g, '-').replace(/\+\+/g, '+');
      // Remove leading +
      if (result.startsWith('+')) result = result.substring(1);

      const newExpr = exprStr.substring(0, coeffStart) + result + after;
      if (newExpr !== exprStr) {
        return { expr: newExpr, changed: true, description };
      }
    }

    // Try removing bare grouping parens (no coefficient)
    for (const group of groups) {
      const before = exprStr.substring(0, group.start);
      const after = exprStr.substring(group.end);
      if (!/[\d)]\*?$/.test(before) && !/^\*?[\d(]/.test(after)) {
        const newExpr = before + group.content + after;
        if (newExpr !== exprStr) return { expr: newExpr, changed: true, description: null };
      }
    }

    return { expr: exprStr, changed: false, description: null };
  },

  /** Combine like terms respecting parentheses (does NOT open parens) */
  _doSimplify(eq) {
    try {
      // Priority 1: combine like terms inside parentheses (via expandOneLayer)
      const lhsResult = MathUtils.expandOneLayer(eq.lhs);
      if (lhsResult.changed && lhsResult.isSimplify) {
        this._createStringStep(lhsResult.expr, eq.rhs, 'simplifyTerms', null, eq);
        return;
      }

      const rhsResult = MathUtils.expandOneLayer(eq.rhs);
      if (rhsResult.changed && rhsResult.isSimplify) {
        this._createStringStep(eq.lhs, rhsResult.expr, 'simplifyTerms', null, eq);
        return;
      }

      // Priority 2: combine top-level terms (no parens involved)
      const lhsSimp = nerdamer('simplify(' + eq.lhs + ')').text();
      const rhsSimp = nerdamer('simplify(' + eq.rhs + ')').text();

      if (lhsSimp !== eq.lhs || rhsSimp !== eq.rhs) {
        this._createStringStep(lhsSimp, rhsSimp, 'simplifyTerms', null, eq);
        return;
      }

      this._showActionFeedback(STRINGS.nothingToSimplify);
    } catch (err) {
      console.error('Simplify failed:', err);
      this._showActionFeedback(STRINGS.actionError);
    }
  },

  /** Create step from nerdamer objects (for add/subtract/multiply/divide) */
  _createActionStep(lhsText, rhsText, ruleKey, ruleParam, eq) {
    const variable = MathUtils.detectVariable(eq.lhs + '=' + eq.rhs);
    const lhsVars = nerdamer(lhsText).variables();
    const rhsVars = nerdamer(rhsText).variables();
    const isFinal = (lhsText === variable && rhsVars.length === 0) ||
                    (rhsText === variable && lhsVars.length === 0);

    const ruleLabel = ruleParam ? (STRINGS[ruleKey] || ruleKey) + ': ' + ruleParam : (STRINGS[ruleKey] || ruleKey);
    this._addUserStep({
      latex: MathUtils.nerdamerToLatex(nerdamer(lhsText)) + ' = ' + MathUtils.nerdamerToLatex(nerdamer(rhsText)),
      rule: ruleLabel, ruleKey: ruleKey, ruleParam: ruleParam || null,
      lhs: lhsText, rhs: rhsText, isFinal
    });
  },

  /** Create step from string expressions (for expand/simplify — avoids auto-simplification) */
  _createStringStep(lhsStr, rhsStr, ruleKey, ruleParam, eq) {
    const variable = MathUtils.detectVariable(eq.lhs + '=' + eq.rhs);
    const lhsVars = nerdamer(lhsStr).variables();
    const rhsVars = nerdamer(rhsStr).variables();
    const isFinal = (lhsStr === variable && rhsVars.length === 0) ||
                    (rhsStr === variable && lhsVars.length === 0);

    const ruleLabel = ruleParam ? (STRINGS[ruleKey] || ruleKey) + ': ' + ruleParam : (STRINGS[ruleKey] || ruleKey);
    this._addUserStep({
      latex: MathUtils.nerdamerStrToDisplayLatex(lhsStr) + ' = ' + MathUtils.nerdamerStrToDisplayLatex(rhsStr),
      rule: ruleLabel, ruleKey: ruleKey, ruleParam: ruleParam || null,
      lhs: lhsStr, rhs: rhsStr, isFinal
    });
  },

  _showRewriteInput() {
    // Highlight rewrite button
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    const rewriteBtn = document.querySelector('.action-btn--rewrite');
    if (rewriteBtn) rewriteBtn.classList.add('active');

    const inputArea = document.getElementById('action-input-area');
    inputArea.style.display = '';
    inputArea.innerHTML = '';

    const label = document.createElement('span');
    label.className = 'action-input-label';
    label.textContent = STRINGS.freeRewrite + ':';
    inputArea.appendChild(label);

    const input = document.createElement('input');
    input.className = 'glass-input action-value-input action-value-input--wide';
    input.type = 'text';
    input.placeholder = STRINGS.rewritePlaceholder;
    inputArea.appendChild(input);

    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn-primary btn-accent action-apply-btn';
    applyBtn.textContent = STRINGS.apply;
    applyBtn.addEventListener('click', () => this._validateRewrite(input.value.trim()));
    inputArea.appendChild(applyBtn);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._validateRewrite(input.value.trim());
    });

    const errorMsg = document.createElement('p');
    errorMsg.id = 'rewrite-error';
    errorMsg.className = 'rewrite-error';
    errorMsg.style.display = 'none';
    inputArea.appendChild(errorMsg);

    gsap.from(inputArea, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.out' });
    requestAnimationFrame(() => input.focus());
  },

  _validateRewrite(equationStr) {
    if (!equationStr || !equationStr.includes('=')) {
      this._showRewriteError(STRINGS.rewriteNeedsEquals);
      return;
    }

    try {
      // Convert user input to nerdamer format
      const nerdamerStr = MathUtils.latexToNerdamer(equationStr);
      const parts = nerdamerStr.split('=');
      if (parts.length !== 2) {
        this._showRewriteError(STRINGS.rewriteInvalid);
        return;
      }

      const newLhs = parts[0].trim();
      const newRhs = parts[1].trim();
      const variable = MathUtils.detectVariable(this.currentEquation.lhs + '=' + this.currentEquation.rhs);

      // Solve current and new equations, compare solutions
      const currentEq = this.currentEquation.lhs + '=' + this.currentEquation.rhs;
      const currentSolution = nerdamer.solve(currentEq, variable).toString();
      const newEq = newLhs + '=' + newRhs;
      const newSolution = nerdamer.solve(newEq, variable).toString();

      if (currentSolution !== newSolution) {
        this._showRewriteError(STRINGS.rewriteSolutionMismatch);
        return;
      }

      // Detect if solved
      const lhsVars = nerdamer(newLhs).variables();
      const rhsVars = nerdamer(newRhs).variables();
      const isFinal = (newLhs === variable && rhsVars.length === 0) ||
                      (newRhs === variable && lhsVars.length === 0);

      const newStep = {
        latex: MathUtils.nerdamerToLatex(nerdamer(newLhs)) + ' = ' + MathUtils.nerdamerToLatex(nerdamer(newRhs)),
        rule: STRINGS.freeRewrite,
        ruleKey: 'freeRewrite',
        ruleParam: null,
        lhs: newLhs,
        rhs: newRhs,
        isFinal
      };

      this._addUserStep(newStep);
    } catch (err) {
      console.error('Rewrite validation failed:', err);
      this._showRewriteError(STRINGS.rewriteInvalid);
    }
  },

  _showRewriteError(msg) {
    const el = document.getElementById('rewrite-error');
    if (el) {
      el.textContent = msg;
      el.style.display = '';
      gsap.from(el, { opacity: 0, duration: 0.3 });
    }
  },

  _showActionFeedback(msg) {
    const inputArea = document.getElementById('action-input-area');
    if (!inputArea) return;
    inputArea.style.display = '';
    inputArea.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = msg;
    p.style.cssText = 'text-align:center;color:var(--warning);font-size:0.85rem;margin:0;';
    inputArea.appendChild(p);
    gsap.from(p, { opacity: 0, duration: 0.3 });
    // Auto-hide after 2s
    gsap.to(inputArea, { opacity: 0, duration: 0.3, delay: 2, onComplete: () => {
      inputArea.style.display = 'none';
      inputArea.style.opacity = '1';
    }});
  },

  _addUserStep(newStep) {
    this.steps.push(newStep);
    this._userSteps.push(newStep);

    // Persist board state to session
    if (SessionManager.activeSessionId) {
      const updates = { boardData: this.getState() };
      if (newStep.isFinal) updates.status = 'solved';
      SessionManager.updateSession(SessionManager.activeSessionId, updates);
    }

    // Render step card
    const stepsContainer = document.getElementById('steps-container');
    stepsContainer.appendChild(this.createStepConnector(newStep));

    const card = this.createStepCard(newStep, this.steps.length - 1);
    stepsContainer.appendChild(card);

    gsap.from(card, { y: 40, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
    gsap.delayedCall(0.2, () => this.animateStepBadges());

    if (!newStep.isFinal) {
      this.setupInteractiveZone(newStep);
    } else {
      const zone = document.getElementById('interactive-zone');
      zone.innerHTML = '';
      const msg = document.createElement('p');
      msg.textContent = STRINGS.solution + '!';
      msg.style.cssText = 'text-align:center;color:var(--success);font-size:1.25rem;font-weight:600;padding:1.5rem;';
      zone.appendChild(msg);
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Log textual step history (for testing/debugging)
    console.log('--- Step History ---\n' + this.getTextHistory());
  },

  animateStepBadges() {
    document.querySelectorAll('.step-badge[data-target]').forEach(b => {
      if (b.dataset.animated) return;
      b.dataset.animated = 'true';
      const target = parseInt(b.dataset.target);
      const counter = { val: 0 };
      gsap.to(counter, {
        val: target,
        duration: 0.35,
        ease: 'power2.out',
        delay: 0.1,
        onUpdate() { b.textContent = String(Math.round(counter.val)).padStart(2, '0'); }
      });
    });
  },

  _renderHintButtons(container) {
    // Remove existing hint bar if present
    const existing = document.getElementById('hint-bar');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.id = 'hint-bar';
    bar.className = 'hint-bar';

    const hintBtn = document.createElement('button');
    hintBtn.className = 'btn-primary btn-hint';
    hintBtn.textContent = STRINGS.nextStep;
    hintBtn.addEventListener('click', () => this._revealNextStep());
    bar.appendChild(hintBtn);

    const allBtn = document.createElement('button');
    allBtn.className = 'btn-primary btn-show-all';
    allBtn.textContent = STRINGS.showAll;
    allBtn.addEventListener('click', () => this._revealAllSteps());
    bar.appendChild(allBtn);

    container.appendChild(bar);
  },

  _revealNextStep() {
    if (this._revealedCount >= this.steps.length) return;

    const stepsContainer = document.getElementById('steps-container');
    const step = this.steps[this._revealedCount];

    stepsContainer.appendChild(this.createStepConnector(step));

    const card = this.createStepCard(step, this._revealedCount);
    stepsContainer.appendChild(card);

    gsap.from(card, { y: 40, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
    gsap.delayedCall(0.2, () => this.animateStepBadges());

    this._revealedCount++;

    // Update interactive zone to match revealed step
    if (!step.isFinal && step.lhs && step.rhs) {
      this.setupInteractiveZone(step);
      // Re-render hint buttons (setupInteractiveZone cleared the zone)
      if (this._revealedCount < this.steps.length) {
        const zone = document.getElementById('interactive-zone');
        this._renderHintButtons(zone);
      }
    }

    // If this was the final step or all revealed, remove hint buttons
    if (step.isFinal || this._revealedCount >= this.steps.length) {
      const bar = document.getElementById('hint-bar');
      if (bar) gsap.to(bar, { opacity: 0, height: 0, duration: 0.3, onComplete: () => bar.remove() });

      if (step.isFinal) {
        const zone = document.getElementById('interactive-zone');
        zone.innerHTML = '';
        const msg = document.createElement('p');
        msg.textContent = STRINGS.solution + '!';
        msg.style.cssText = 'text-align:center;color:var(--success);font-size:1.25rem;font-weight:600;padding:1.5rem;';
        zone.appendChild(msg);
      }
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  _revealAllSteps() {
    const stepsContainer = document.getElementById('steps-container');

    while (this._revealedCount < this.steps.length) {
      const step = this.steps[this._revealedCount];

      stepsContainer.appendChild(this.createStepConnector(step));
      stepsContainer.appendChild(this.createStepCard(step, this._revealedCount));
      this._revealedCount++;
    }

    gsap.from('.step-card:not([data-animated])', {
      y: 30, opacity: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out'
    });
    gsap.delayedCall(0.3, () => this.animateStepBadges());

    // Remove hint buttons
    const bar = document.getElementById('hint-bar');
    if (bar) gsap.to(bar, { opacity: 0, height: 0, duration: 0.3, onComplete: () => bar.remove() });

    // Show final state
    const lastStep = this.steps[this.steps.length - 1];
    if (lastStep && lastStep.isFinal) {
      const zone = document.getElementById('interactive-zone');
      zone.innerHTML = '';
      const msg = document.createElement('p');
      msg.textContent = STRINGS.solution + '!';
      msg.style.cssText = 'text-align:center;color:var(--success);font-size:1.25rem;font-weight:600;padding:1.5rem;';
      zone.appendChild(msg);
    } else if (lastStep && lastStep.lhs && lastStep.rhs) {
      this.setupInteractiveZone(lastStep);
    }

    if (stepsContainer.lastElementChild) {
      stepsContainer.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  cleanup() {
    if (this._fabTween) {
      this._fabTween.kill();
      this._fabTween = null;
    }
    document.getElementById('steps-container').innerHTML = '';
    document.getElementById('interactive-zone').innerHTML = '';
    this.currentEquation = null;
    this.steps = [];
    this._originalLatex = null;
    this._solverSteps = [];
    this._userSteps = [];
    this._revealedCount = 0;
    this._displayedStepCount = 0;
  }
};
