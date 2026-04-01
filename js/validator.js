// validator.js — Mathpix OCR + KaTeX rendering + live editing + keyboard mode
const Validator = {
  currentCroppedImage: null,
  debounceTimer: null,
  _boundOnInput: null,
  _boundSolve: null,
  _boundBack: null,
  _initGeneration: 0,
  _mode: 'ocr',
  _focusTimer: null,

  getState() {
    return {
      mode: this._mode,
      latex: document.getElementById('latex-input').value
    };
  },

  init(data) {
    this._initGeneration++;
    this._mode = data.mode || (data.validatorData && data.validatorData.mode) || 'ocr';

    // Wire back button
    const btnBack = document.getElementById('btn-validator-back');
    if (this._boundBack) {
      btnBack.removeEventListener('click', this._boundBack);
    }
    this._boundBack = () => goToState(AppState.SCANNER);
    btnBack.addEventListener('click', this._boundBack);

    const input = document.getElementById('latex-input');
    input.value = '';

    // Wire input listener (bound ref for cleanup)
    if (this._boundOnInput) {
      input.removeEventListener('input', this._boundOnInput);
    }
    this._boundOnInput = (e) => this.onLatexInput(e);
    input.addEventListener('input', this._boundOnInput);

    // Wire solve button (bound ref for cleanup)
    const btnSolve = document.getElementById('btn-solve');
    if (this._boundSolve) {
      btnSolve.removeEventListener('click', this._boundSolve);
    }
    this._boundSolve = () => this.solve();
    btnSolve.addEventListener('click', this._boundSolve);

    // Reset UI
    document.getElementById('ocr-warning').style.display = 'none';
    document.getElementById('latex-render').innerHTML = '';

    const cardOriginal = document.getElementById('card-original');
    const cardLabel = document.querySelector('#card-recognized .card-label');
    const loading = document.getElementById('validator-loading');

    if (data.validatorData) {
      // Restoring session — skip OCR, just restore UI state
      loading.style.display = 'none';
      btnSolve.style.display = '';

      if (this._mode === 'ocr') {
        cardOriginal.style.display = '';
        cardLabel.textContent = STRINGS.recognized;
        input.placeholder = 'LaTeX keplet...';
        // Image not persisted — show placeholder
        const preview = document.getElementById('cropped-preview');
        preview.src = '';
        preview.alt = 'Kep nem elerheto';
        const label = document.querySelector('#card-original .card-label');
        if (label) label.textContent = 'Eredeti (kep nem elerheto)';
      } else {
        cardOriginal.style.display = 'none';
        cardLabel.textContent = STRINGS.equation;
        input.placeholder = STRINGS.inputPlaceholder;
      }

      // Restore input value and render preview
      input.value = data.validatorData.latex || '';
      if (input.value) {
        if (this._mode === 'keyboard' && !input.value.includes('\\')) {
          this.renderLatex(MathUtils.plainMathToLatex(input.value));
        } else {
          this.renderLatex(input.value);
        }
      }

      gsap.from('#card-recognized', {
        y: 50, opacity: 0, duration: 0.5, ease: 'power2.out'
      });
    } else if (this._mode === 'keyboard') {
      // Keyboard mode: hide image card, adjust labels, show solve immediately
      cardOriginal.style.display = 'none';
      cardLabel.textContent = STRINGS.equation;
      input.placeholder = STRINGS.inputPlaceholder;
      loading.style.display = 'none';
      btnSolve.style.display = '';

      // GSAP entrance
      gsap.from('#card-recognized', {
        y: 50, opacity: 0, duration: 0.5, ease: 'power2.out'
      });

      // Auto-focus after entrance animation settles
      this._focusTimer = setTimeout(() => { input.focus(); }, 700);
    } else {
      // OCR mode: show image card, restore labels, run OCR
      cardOriginal.style.display = '';
      cardLabel.textContent = STRINGS.recognized;
      input.placeholder = 'LaTeX keplet...';

      this.currentCroppedImage = data.croppedImageDataURL;
      document.getElementById('cropped-preview').src = data.croppedImageDataURL;

      // GSAP entrance: glass cards stagger in from below
      gsap.from('#state-validator .glass-card', {
        y: 50, opacity: 0, duration: 0.5,
        stagger: 0.2, ease: 'power2.out'
      });

      this.recognizeEquation(data.croppedImageDataURL);
    }
  },

  async recognizeEquation(base64DataURL) {
    const generation = this._initGeneration;
    const loading = document.getElementById('validator-loading');
    const btnSolve = document.getElementById('btn-solve');

    // Show spinner, hide solve button
    loading.style.display = 'flex';
    gsap.from('#validator-loading', { opacity: 0, y: -8, duration: 0.25 });
    btnSolve.style.display = 'none';

    // Offline check
    if (!navigator.onLine) {
      loading.style.display = 'none';
      btnSolve.style.display = '';
      document.getElementById('latex-input').placeholder = STRINGS.offline;
      return;
    }

    try {
      const result = await API.ocr(base64DataURL);

      // Bail if user navigated away during API call
      if (generation !== this._initGeneration) return;

      const latex = this.extractLatex(result);
      const confidence = result.latex_confidence || result.confidence || result.confidence_rate || 0;

      document.getElementById('latex-input').value = latex;
      this.renderLatex(latex);
      gsap.from('#card-recognized', { opacity: 0.4, scale: 0.97, duration: 0.3, ease: 'power2.out' });

      // Show warning for low confidence
      if (confidence > 0 && confidence < 0.8) {
        document.getElementById('ocr-warning').style.display = 'block';
      }
    } catch (err) {
      console.error('Mathpix API error:', err);
      if (generation !== this._initGeneration) return;
      document.getElementById('latex-input').placeholder = STRINGS.apiError;
    } finally {
      if (generation !== this._initGeneration) return;
      loading.style.display = 'none';
      btnSolve.style.display = '';
    }
  },

  extractLatex(mathpixResponse) {
    const raw = mathpixResponse.latex_simplified
      || mathpixResponse.text
      || '';
    return raw.replace(/^\$+|\$+$/g, '').trim();
  },

  renderLatex(latexString) {
    const target = document.getElementById('latex-render');
    try {
      katex.render(latexString, target, {
        throwOnError: false,
        displayMode: true,
        output: 'html'
      });
    } catch (e) {
      target.textContent = latexString;
    }
  },

  onLatexInput(e) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const raw = e.target.value;
      if (this._mode === 'keyboard' && !raw.includes('\\')) {
        this.renderLatex(MathUtils.plainMathToLatex(raw));
      } else {
        this.renderLatex(raw);
      }
    }, 200);
  },

  solve() {
    const latex = document.getElementById('latex-input').value.trim();
    if (!latex) return;

    // Update session with equation info
    if (SessionManager.activeSessionId) {
      SessionManager.updateSession(SessionManager.activeSessionId, {
        status: 'in-progress',
        equation: latex,
        displayText: MathUtils.latexToPlainText(latex)
      });
    }

    goToState(AppState.BOARD, {
      latex: latex,
      croppedImageDataURL: this.currentCroppedImage
    });
  },

  cleanup() {
    this._initGeneration++;
    this.currentCroppedImage = null;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = null;

    clearTimeout(this._focusTimer);
    this._focusTimer = null;

    document.getElementById('latex-render').innerHTML = '';
    document.getElementById('cropped-preview').src = '';

    const input = document.getElementById('latex-input');
    input.value = '';
    input.placeholder = 'LaTeX keplet...';

    document.getElementById('ocr-warning').style.display = 'none';
    document.getElementById('validator-loading').style.display = 'none';

    // Restore card-original visibility for next use
    document.getElementById('card-original').style.display = '';

    // Restore card label for next use
    const cardLabel = document.querySelector('#card-recognized .card-label');
    if (cardLabel) cardLabel.textContent = STRINGS.recognized;

    // Remove input listener
    if (this._boundOnInput) {
      input.removeEventListener('input', this._boundOnInput);
      this._boundOnInput = null;
    }

    // Remove solve listener
    const btnSolve = document.getElementById('btn-solve');
    if (this._boundSolve) {
      btnSolve.removeEventListener('click', this._boundSolve);
      this._boundSolve = null;
    }

    // Remove back button listener
    const btnBack = document.getElementById('btn-validator-back');
    if (this._boundBack) {
      btnBack.removeEventListener('click', this._boundBack);
      this._boundBack = null;
    }

    this._mode = 'ocr';
  }
};
