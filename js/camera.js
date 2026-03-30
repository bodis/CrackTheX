// camera.js — Camera API + Cropper.js v1.6.2
const Camera = {
  stream: null,
  cropper: null,
  phase: 'camera',
  _boundHandleClick: null,
  _boundFileChange: null,
  _initGeneration: 0,

  init() {
    this.phase = 'camera';
    this._initGeneration++;
    const generation = this._initGeneration;

    const video = document.getElementById('camera-feed');
    const img = document.getElementById('captured-image');
    const btn = document.getElementById('btn-capture');

    video.style.display = '';
    img.style.display = 'none';
    img.onload = null;
    btn.textContent = STRINGS.takePhoto;
    btn.disabled = true;

    // Remove stale listener before wiring new one
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
      // Discard if we navigated away or re-inited
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

  showFileUploadFallback() {
    const video = document.getElementById('camera-feed');
    const btn = document.getElementById('btn-capture');
    const fileInput = document.getElementById('file-input');

    video.style.display = 'none';
    btn.textContent = 'Kep kivalasztasa';
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

    // Flash effect
    gsap.fromTo('#state-scanner',
      { backgroundColor: 'rgba(255,255,255,0.3)' },
      { backgroundColor: 'transparent', duration: 0.3 }
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

    // Remove listeners
    const btn = document.getElementById('btn-capture');
    if (this._boundHandleClick) {
      btn.removeEventListener('click', this._boundHandleClick);
      this._boundHandleClick = null;
    }

    const fileInput = document.getElementById('file-input');
    if (this._boundFileChange) {
      fileInput.removeEventListener('change', this._boundFileChange);
      this._boundFileChange = null;
    }

    // Reset file input value so same file can be re-selected
    fileInput.value = '';
    // Restore capture attribute for next time
    fileInput.setAttribute('capture', 'environment');

    this.phase = 'camera';
  }
};
