// interactive-board.js — Step card rendering + interact.js drag-and-drop

const InteractiveBoard = {
  currentEquation: null,
  steps: [],
  _fabTween: null,
  _animating: false,

  init(data) {
    const stepsContainer = document.getElementById('steps-container');
    const zone = document.getElementById('interactive-zone');
    stepsContainer.innerHTML = '';
    zone.innerHTML = '';

    this.steps = Solver.solve(data.latex);

    if (!this.steps || this.steps.length === 0) {
      const errP = document.createElement('p');
      errP.textContent = STRINGS.errorParsing;
      errP.style.cssText = 'text-align:center;color:var(--text-secondary);padding:2rem;';
      stepsContainer.appendChild(errP);
      return;
    }

    this.steps.forEach((step, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.className = 'step-connector';
        stepsContainer.appendChild(conn);
      }
      stepsContainer.appendChild(this.createStepCard(step, i));
    });

    gsap.from('.step-card', {
      y: 30,
      opacity: 0,
      duration: 0.4,
      stagger: 0.15,
      ease: 'power2.out'
    });

    // Find last non-final step with lhs/rhs for interactive zone
    let interactiveStep = null;
    for (let i = this.steps.length - 1; i >= 0; i--) {
      if (!this.steps[i].isFinal && this.steps[i].lhs && this.steps[i].rhs) {
        interactiveStep = this.steps[i];
        break;
      }
    }
    if (interactiveStep) {
      this.setupInteractiveZone(interactiveStep);
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
      card.style.borderImage = 'none';
      card.style.borderLeft = '3px solid var(--success)';
      card.style.boxShadow = '0 4px 20px var(--success-glow)';
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

    const flashColor = flippedSign === '-' ? 'var(--danger)' : 'var(--success)';

    const tl = gsap.timeline();
    tl.to(termElement, { x: flyX, duration: 0.5, ease: 'power2.inOut' });
    tl.to(termElement, {
      scale: 1.3,
      duration: 0.15,
      onStart() {
        termElement.style.borderColor = flashColor;
        termElement.style.boxShadow = '0 4px 20px ' + flashColor;
      }
    });
    tl.to(termElement, { scale: 1, duration: 0.15 });
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
  }
};
