// camera.js — Home screen + Camera API + Cropper.js v1.6.2

let _logoAnimated = false;

const Camera = {
  stream: null,
  cropper: null,
  phase: 'home',
  _boundHandleClick: null,
  _boundFileChange: null,
  _boundEntryKeyboard: null,
  _boundEntryCamera: null,
  _boundCameraBack: null,
  _initGeneration: 0,

  init() {
    this.phase = 'home';
    this._initGeneration++;

    const homeContent = document.getElementById('home-content');
    const cameraView = document.getElementById('camera-view');

    // Show home, hide camera
    homeContent.style.display = '';
    gsap.set(homeContent, { opacity: 1, scale: 1 });
    cameraView.style.display = 'none';

    // Logo letter stagger (runs once only)
    if (!_logoAnimated) {
      const logoEl = document.getElementById('app-logo');
      if (logoEl) {
        const chars = logoEl.textContent.split('');
        logoEl.innerHTML = chars.map(c =>
          `<span class="logo-char">${c === ' ' ? '&nbsp;' : c}</span>`
        ).join('');
        gsap.from('.logo-char', {
          y: -20, opacity: 0, duration: 0.4,
          stagger: 0.04, ease: 'back.out(2)', delay: 0.3
        });
        _logoAnimated = true;
      }
    }

    // GSAP entrance for tagline + entry cards
    gsap.from('.home-tagline', {
      opacity: 0, y: 10, duration: 0.4, delay: 0.5, ease: 'power2.out'
    });
    gsap.from('.entry-card', {
      y: 30, opacity: 0, duration: 0.5,
      stagger: 0.15, ease: 'power2.out', delay: 0.6
    });

    // Wire entry button listeners
    const entryKeyboard = document.getElementById('entry-keyboard');
    const entryCamera = document.getElementById('entry-camera');
    const btnCameraBack = document.getElementById('btn-camera-back');

    if (this._boundEntryKeyboard) {
      entryKeyboard.removeEventListener('click', this._boundEntryKeyboard);
    }
    if (this._boundEntryCamera) {
      entryCamera.removeEventListener('click', this._boundEntryCamera);
    }
    if (this._boundCameraBack) {
      btnCameraBack.removeEventListener('click', this._boundCameraBack);
    }

    this._boundEntryKeyboard = () => goToState(AppState.VALIDATOR, { mode: 'keyboard' });
    this._boundEntryCamera = () => this.startCamera();
    this._boundCameraBack = () => this.backToHome();

    entryKeyboard.addEventListener('click', this._boundEntryKeyboard);
    entryCamera.addEventListener('click', this._boundEntryCamera);
    btnCameraBack.addEventListener('click', this._boundCameraBack);
  },

  startCamera() {
    this._initGeneration++;
    const generation = this._initGeneration;

    const homeContent = document.getElementById('home-content');
    const cameraView = document.getElementById('camera-view');
    const video = document.getElementById('camera-feed');
    const img = document.getElementById('captured-image');
    const btn = document.getElementById('btn-capture');

    // Transition: hide home, show camera
    gsap.to(homeContent, {
      opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in',
      onComplete: () => { homeContent.style.display = 'none'; }
    });
    cameraView.style.display = '';
    gsap.fromTo(cameraView,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    );

    this.phase = 'camera';
    video.style.display = '';
    img.style.display = 'none';
    img.onload = null;
    btn.textContent = STRINGS.takePhoto;
    btn.disabled = true;

    // Remove stale capture listener before wiring new one
    if (this._boundHandleClick) {
      btn.removeEventListener('click', this._boundHandleClick);
    }
    this._boundHandleClick = () => this.handleButtonClick();
    btn.addEventListener('click', this._boundHandleClick);

    // Request camera
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    })
    .then(stream => {
      if (generation !== this._initGeneration) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      this.stream = stream;
      video.srcObject = stream;
      video.play().catch(() => {});
      btn.disabled = false;
    })
    .catch(() => {
      if (generation !== this._initGeneration) return;
      this.showFileUploadFallback();
    });
  },

  backToHome() {
    this._initGeneration++;

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    // Clear video
    const video = document.getElementById('camera-feed');
    video.srcObject = null;

    // Destroy cropper
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }

    // Clear image
    const img = document.getElementById('captured-image');
    img.onload = null;
    img.src = '';

    // Remove capture button listener
    const btn = document.getElementById('btn-capture');
    if (this._boundHandleClick) {
      btn.removeEventListener('click', this._boundHandleClick);
      this._boundHandleClick = null;
    }

    // Reset file input
    const fileInput = document.getElementById('file-input');
    if (this._boundFileChange) {
      fileInput.removeEventListener('change', this._boundFileChange);
      this._boundFileChange = null;
    }
    fileInput.value = '';
    fileInput.setAttribute('capture', 'environment');

    // Transition: hide camera, show home
    const homeContent = document.getElementById('home-content');
    const cameraView = document.getElementById('camera-view');

    gsap.to(cameraView, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => { cameraView.style.display = 'none'; }
    });
    homeContent.style.display = '';
    gsap.fromTo(homeContent,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
    );

    this.phase = 'home';
  },

  showFileUploadFallback() {
    const video = document.getElementById('camera-feed');
    const btn = document.getElementById('btn-capture');
    const fileInput = document.getElementById('file-input');

    video.style.display = 'none';
    btn.textContent = STRINGS.selectImage || 'Kép kiválasztása';
    btn.disabled = false;

    // Remove capture attribute so iOS shows file picker, not camera
    fileInput.removeAttribute('capture');

    // Replace button handler to trigger file picker
    btn.removeEventListener('click', this._boundHandleClick);
    this._boundHandleClick = () => fileInput.click();
    btn.addEventListener('click', this._boundHandleClick);

    // Wire file input
    this._boundFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => this.showCropper(ev.target.result);
      reader.readAsDataURL(file);
    };
    fileInput.addEventListener('change', this._boundFileChange);
  },

  handleButtonClick() {
    if (this.phase === 'camera') {
      this.captureFrame();
    } else if (this.phase === 'cropping') {
      this.finishCrop();
    }
  },

  captureFrame() {
    const video = document.getElementById('camera-feed');

    // Guard: video not ready yet
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataURL = canvas.toDataURL('image/jpeg', 0.85);

    // Release canvas memory
    canvas.width = 0;
    canvas.height = 0;

    // Flash effect — full-screen white overlay
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;pointer-events:none;z-index:9999;';
    document.body.appendChild(flash);
    gsap.fromTo(flash,
      { opacity: 0.85 },
      { opacity: 0, duration: 0.4, ease: 'power2.out', onComplete: () => flash.remove() }
    );

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    video.srcObject = null;

    video.style.display = 'none';
    this.showCropper(dataURL);
  },

  showCropper(dataURL) {
    const generation = this._initGeneration;
    const img = document.getElementById('captured-image');
    const btn = document.getElementById('btn-capture');

    img.src = dataURL;
    img.style.display = 'block';

    img.onload = () => {
      img.onload = null;

      // Bail if cleanup already ran
      if (generation !== this._initGeneration) return;

      // Destroy previous cropper if any
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }

      this.cropper = new Cropper(img, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.6,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        background: false
      });

      this.phase = 'cropping';
      btn.textContent = STRINGS.selectionDone;
    };
  },

  finishCrop() {
    if (!this.cropper) return;

    const croppedCanvas = this.cropper.getCroppedCanvas({
      maxWidth: 1200,
      maxHeight: 800
    });
    const dataURL = croppedCanvas.toDataURL('image/jpeg', 0.9);

    this.cropper.destroy();
    this.cropper = null;

    goToState(AppState.VALIDATOR, { croppedImageDataURL: dataURL });
  },

  cleanup() {
    this._initGeneration++;

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    // Clear video srcObject
    const video = document.getElementById('camera-feed');
    video.srcObject = null;

    // Destroy cropper
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }

    // Clear image references
    const img = document.getElementById('captured-image');
    img.onload = null;
    img.src = '';

    // Remove capture button listener
    const btn = document.getElementById('btn-capture');
    if (this._boundHandleClick) {
      btn.removeEventListener('click', this._boundHandleClick);
      this._boundHandleClick = null;
    }

    // Remove file input listener
    const fileInput = document.getElementById('file-input');
    if (this._boundFileChange) {
      fileInput.removeEventListener('change', this._boundFileChange);
      this._boundFileChange = null;
    }
    fileInput.value = '';
    fileInput.setAttribute('capture', 'environment');

    // Remove entry button listeners
    const entryKeyboard = document.getElementById('entry-keyboard');
    if (this._boundEntryKeyboard) {
      entryKeyboard.removeEventListener('click', this._boundEntryKeyboard);
      this._boundEntryKeyboard = null;
    }

    const entryCamera = document.getElementById('entry-camera');
    if (this._boundEntryCamera) {
      entryCamera.removeEventListener('click', this._boundEntryCamera);
      this._boundEntryCamera = null;
    }

    const btnCameraBack = document.getElementById('btn-camera-back');
    if (this._boundCameraBack) {
      btnCameraBack.removeEventListener('click', this._boundCameraBack);
      this._boundCameraBack = null;
    }

    // Reset views: show home, hide camera
    document.getElementById('home-content').style.display = '';
    document.getElementById('camera-view').style.display = 'none';

    this.phase = 'home';
  }
};
