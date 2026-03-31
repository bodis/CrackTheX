// validator.js — Mathpix OCR + KaTeX rendering + live editing
const Validator = {
  currentCroppedImage: null,
  debounceTimer: null,
  _boundOnInput: null,
  _boundSolve: null,
  _initGeneration: 0,

  init(data) {
    this._initGeneration++;

    this.currentCroppedImage = data.croppedImageDataURL;
    document.getElementById('cropped-preview').src = data.croppedImageDataURL;

    // GSAP entrance: glass cards stagger in from below
    gsap.from('#state-validator .glass-card', {
      y: 50,
      opacity: 0,
      duration: 0.5,
      stagger: 0.2,
      ease: 'power2.out'
    });

    const input = document.getElementById('latex-input');
    input.value = '';
    input.placeholder = 'LaTeX keplet...';

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

    this.recognizeEquation(data.croppedImageDataURL);
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
      this.renderLatex(e.target.value);
    }, 200);
  },

  solve() {
    const latex = document.getElementById('latex-input').value.trim();
    if (!latex) return;
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

    document.getElementById('latex-render').innerHTML = '';
    document.getElementById('cropped-preview').src = '';

    const input = document.getElementById('latex-input');
    input.value = '';
    input.placeholder = 'LaTeX keplet...';

    document.getElementById('ocr-warning').style.display = 'none';
    document.getElementById('validator-loading').style.display = 'none';

    if (this._boundOnInput) {
      input.removeEventListener('input', this._boundOnInput);
      this._boundOnInput = null;
    }

    const btnSolve = document.getElementById('btn-solve');
    if (this._boundSolve) {
      btnSolve.removeEventListener('click', this._boundSolve);
      this._boundSolve = null;
    }
  }
};
