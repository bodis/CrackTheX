// interactive-board.js — Step card rendering + interact.js drag-and-drop

const InteractiveBoard = {
  currentEquation: null,
  steps: [],
  _fabTween: null,
  _animating: false,
  _originalLatex: null,
  _solverSteps: [],
  _userSteps: [],
  _revealedCount: 0,

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
          const conn = document.createElement('div');
          conn.className = 'step-connector';
          stepsContainer.appendChild(conn);
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

  createStepCard(step, index) {
    const card = document.createElement('div');
    card.className = 'glass-card step-card';
    card.dataset.step = index;

    const rule = document.createElement('span');
    rule.className = 'step-rule';
    rule.textContent = step.rule;
    card.appendChild(rule);

    const badge = document.createElement('span');
    badge.className = 'step-badge';
    badge.textContent = '00';
    badge.dataset.target = index + 1;
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
    this._unsetInteract();

    const zone = document.getElementById('interactive-zone');
    zone.innerHTML = '';

    const lhsTerms = MathUtils.parseTerms(step.lhs);
    const rhsTerms = MathUtils.parseTerms(step.rhs);
    this.currentEquation = {
      lhs: step.lhs,
      rhs: step.rhs,
      lhsTerms,
      rhsTerms
    };

    const row = document.createElement('div');
    row.className = 'equation-row';

    const lhsZone = document.createElement('div');
    lhsZone.className = 'equation-side drop-zone';
    lhsZone.dataset.side = 'lhs';

    const equalsSign = document.createElement('div');
    equalsSign.className = 'equals-sign';
    equalsSign.textContent = '=';

    const rhsZone = document.createElement('div');
    rhsZone.className = 'equation-side drop-zone';
    rhsZone.dataset.side = 'rhs';

    lhsTerms.forEach((term, i) => {
      lhsZone.appendChild(this.createTermElement(term, 'lhs', i));
    });

    rhsTerms.forEach((term, i) => {
      rhsZone.appendChild(this.createTermElement(term, 'rhs', i));
    });

    row.appendChild(lhsZone);
    row.appendChild(equalsSign);
    row.appendChild(rhsZone);
    zone.appendChild(row);

    const hint = document.createElement('p');
    hint.textContent = STRINGS.dragHint;
    hint.style.cssText = 'text-align:center;color:var(--text-muted);font-size:0.75rem;margin-top:1rem;';
    zone.appendChild(hint);

    this.initDragAndDrop();
  },

  createTermElement(term, side, index) {
    const el = document.createElement('div');
    el.className = 'draggable-term';
    el.dataset.side = side;
    el.dataset.index = index;
    el.dataset.sign = term.sign;
    el.dataset.value = term.raw;

    // Build display: show sign prefix (omit leading + for first term)
    let displayLatex = term.latex;
    if (term.sign === '-') {
      displayLatex = '-' + term.latex;
    } else if (index > 0) {
      displayLatex = '+' + term.latex;
    }

    try {
      katex.render(displayLatex, el, { throwOnError: false });
    } catch {
      el.textContent = displayLatex;
    }

    return el;
  },

  initDragAndDrop() {
    const self = this;

    interact('.draggable-term').draggable({
      inertia: true,
      autoScroll: true,
      listeners: {
        start(event) {
          const target = event.target;
          gsap.to(target, { scale: 1.15, duration: 0.2 });
          target.classList.add('dragging');
          target.dataset.x = '0';
          target.dataset.y = '0';
        },
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.dataset.x) || 0) + event.dx;
          const y = (parseFloat(target.dataset.y) || 0) + event.dy;
          target.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(1.15)';
          target.dataset.x = x;
          target.dataset.y = y;
        },
        end(event) {
          const target = event.target;
          target.classList.remove('dragging');
          if (!target.classList.contains('dropped')) {
            gsap.to(target, {
              x: 0,
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: 'back.out(1.7)',
              onComplete() {
                target.style.transform = '';
                target.dataset.x = '0';
                target.dataset.y = '0';
              }
            });
          }
        }
      }
    });

    interact('.drop-zone').dropzone({
      accept: '.draggable-term',
      overlap: 0.3,
      ondragenter(event) {
        const dragSide = event.relatedTarget.dataset.side;
        const dropSide = event.target.dataset.side;
        if (dragSide !== dropSide) {
          event.target.classList.add('drop-active');
          gsap.to('.equals-sign', {
            scale: 1.3,
            textShadow: '0 0 20px #22d3ee',
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            overwrite: true
          });
        }
      },
      ondragleave(event) {
        event.target.classList.remove('drop-active');
      },
      ondrop(event) {
        const dragSide = event.relatedTarget.dataset.side;
        const dropSide = event.target.dataset.side;
        event.target.classList.remove('drop-active');
        if (dragSide !== dropSide) {
          event.relatedTarget.classList.add('dropped');
          self.handleTermMove(event.relatedTarget, dragSide, dropSide);
        }
      }
    });
  },

  handleTermMove(termElement, fromSide, toSide) {
    // Bug fix: guard against double-drag during animation
    if (this._animating) return;
    this._animating = true;

    const termValue = termElement.dataset.value;
    const termSign = termElement.dataset.sign;
    const flippedSign = termSign === '+' ? '-' : '+';

    // Bug fix: clear manual inline transform and hand off to GSAP cleanly,
    // then compute flyX from the element's natural (un-transformed) position.
    // GSAP's x is relative to natural position — mixing inline transform with
    // gsap.to({ x }) causes GSAP to animate only the delta, not the full distance.
    const currentX = parseFloat(termElement.dataset.x) || 0;
    const currentY = parseFloat(termElement.dataset.y) || 0;
    termElement.style.transform = '';
    gsap.set(termElement, { x: currentX, y: currentY, scale: 1.15 });

    const equalsEl = document.querySelector('.equals-sign');
    const equalsRect = equalsEl.getBoundingClientRect();
    const termRect = termElement.getBoundingClientRect();
    // naturalLeft = current visual left minus the current GSAP x offset
    const naturalLeft = termRect.left - currentX;

    const flyX = fromSide === 'lhs'
      ? equalsRect.right - naturalLeft + 60
      : equalsRect.left - naturalLeft - termRect.width - 60;

    // Cyan for new positive sign, pink for new negative sign
    const flashColor = flippedSign === '+' ? '#22d3ee' : '#f472b6';

    const tl = gsap.timeline();
    tl.to(termElement, { x: flyX, duration: 0.5, ease: 'power2.inOut' });
    tl.to(termElement, {
      scale: 1.4,
      duration: 0.15,
      ease: 'power2.out',
      onStart() {
        termElement.style.borderColor = flashColor;
        termElement.style.boxShadow = '0 4px 25px ' + flashColor;
        termElement.style.color = flashColor;
      }
    });
    tl.to(termElement, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' });
    tl.call(() => this._rebuildAfterMove(termValue, flippedSign));
  },

  _rebuildAfterMove(termValue, flippedSign) {
    const opStr = flippedSign + termValue;

    try {
      const newLhs = nerdamer('expand(' + this.currentEquation.lhs + opStr + ')');
      const newRhs = nerdamer('expand(' + this.currentEquation.rhs + opStr + ')');

      const ruleLabel = (flippedSign === '-' ? STRINGS.subtractBothSides : STRINGS.addBothSides) + ': ' + termValue;

      // Detect solved state: one side is just the variable, other has no variables.
      // Use nerdamer .variables() instead of regex — handles fractions, negatives, decimals.
      const variable = MathUtils.detectVariable(this.currentEquation.lhs + '=' + this.currentEquation.rhs);
      const lhsText = newLhs.text();
      const rhsText = newRhs.text();
      const rhsVars = nerdamer(rhsText).variables();
      const lhsVars = nerdamer(lhsText).variables();
      const isFinal = (lhsText === variable && rhsVars.length === 0) ||
                      (rhsText === variable && lhsVars.length === 0);

      const newStep = {
        latex: MathUtils.nerdamerToLatex(newLhs) + ' = ' + MathUtils.nerdamerToLatex(newRhs),
        rule: ruleLabel,
        lhs: lhsText,
        rhs: rhsText,
        isFinal
      };

      this.steps.push(newStep);
      this._userSteps.push(newStep);

      // Persist board state to session
      if (SessionManager.activeSessionId) {
        const updates = { boardData: this.getState() };
        if (isFinal) {
          updates.status = 'solved';
        }
        SessionManager.updateSession(SessionManager.activeSessionId, updates);
      }

      const stepsContainer = document.getElementById('steps-container');
      const conn = document.createElement('div');
      conn.className = 'step-connector';
      stepsContainer.appendChild(conn);

      const card = this.createStepCard(newStep, this.steps.length - 1);
      stepsContainer.appendChild(card);

      gsap.from(card, {
        y: 40,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.7)'
      });
      gsap.delayedCall(0.2, () => this.animateStepBadges());

      if (!isFinal) {
        this.setupInteractiveZone(newStep);
      } else {
        // Solved — clear interactive zone
        this._unsetInteract();
        const zone = document.getElementById('interactive-zone');
        zone.innerHTML = '';
        const msg = document.createElement('p');
        msg.textContent = STRINGS.solution + '!';
        msg.style.cssText = 'text-align:center;color:var(--success);font-size:1.25rem;font-weight:600;padding:1.5rem;';
        zone.appendChild(msg);
      }

      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error('Term move failed:', err);
      // Reset interactive zone so user isn't left with stale/broken state
      if (this.currentEquation) {
        this.setupInteractiveZone({ lhs: this.currentEquation.lhs, rhs: this.currentEquation.rhs });
      }
    } finally {
      this._animating = false;
    }
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

    container.insertBefore(bar, container.firstChild);
  },

  _revealNextStep() {
    if (this._revealedCount >= this.steps.length) return;

    const stepsContainer = document.getElementById('steps-container');
    const step = this.steps[this._revealedCount];

    const conn = document.createElement('div');
    conn.className = 'step-connector';
    stepsContainer.appendChild(conn);

    const card = this.createStepCard(step, this._revealedCount);
    stepsContainer.appendChild(card);

    gsap.from(card, { y: 40, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
    gsap.delayedCall(0.2, () => this.animateStepBadges());

    this._revealedCount++;

    // Update interactive zone to match revealed step
    if (!step.isFinal && step.lhs && step.rhs) {
      this.setupInteractiveZone(step);
    }

    // If this was the final step or all revealed, remove hint buttons
    if (step.isFinal || this._revealedCount >= this.steps.length) {
      const bar = document.getElementById('hint-bar');
      if (bar) gsap.to(bar, { opacity: 0, height: 0, duration: 0.3, onComplete: () => bar.remove() });

      if (step.isFinal) {
        this._unsetInteract();
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

      const conn = document.createElement('div');
      conn.className = 'step-connector';
      stepsContainer.appendChild(conn);

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
      this._unsetInteract();
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

  _unsetInteract() {
    try { interact('.draggable-term').unset(); } catch (e) { /* no-op */ }
    try { interact('.drop-zone').unset(); } catch (e) { /* no-op */ }
  },

  cleanup() {
    this._unsetInteract();
    if (this._fabTween) {
      this._fabTween.kill();
      this._fabTween = null;
    }
    document.getElementById('steps-container').innerHTML = '';
    document.getElementById('interactive-zone').innerHTML = '';
    this.currentEquation = null;
    this.steps = [];
    this._animating = false;
    this._originalLatex = null;
    this._solverSteps = [];
    this._userSteps = [];
    this._revealedCount = 0;
  }
};
