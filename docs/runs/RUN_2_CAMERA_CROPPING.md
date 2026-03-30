# Run 2: Camera + Cropping

**Phase:** 3
**Files to create:** `js/camera.js` (replace stub)
**Files to modify:** `js/app.js` (remove Camera stub, wire transition to State 2)
**Goal:** Full camera flow works: open camera -> take photo -> crop with Cropper.js -> output data URL. File upload fallback on desktop.

---

## What to build

### js/camera.js

The `Camera` module with these methods:

**`init()`**
- Set phase to 'camera'
- Show `<video>`, hide `<img>`
- Set button text to STRINGS.takePhoto
- Call `getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })`
- **Use `ideal` not `exact`** for facingMode -- `exact` throws on desktop without rear camera
- On success: set video.srcObject, play
- On failure: call `showFileUploadFallback()`

**`showFileUploadFallback()`**
- Hide video, show "Kep kivalasztasa" button
- Button click triggers hidden `<input type="file">` click
- On file selected: FileReader -> readAsDataURL -> call `showCropper(dataURL)`

**`handleButtonClick()`**
- If phase is 'camera': call `captureFrame()`
- If phase is 'cropping': call `finishCrop()`

**`captureFrame()`**
- Draw video frame to hidden `<canvas>` via `ctx.drawImage(video, 0, 0)`
- Canvas dimensions = video.videoWidth x video.videoHeight
- Convert to data URL: `canvas.toDataURL('image/jpeg', 0.85)`
- GSAP flash effect: `gsap.fromTo('#state-scanner', { backgroundColor: 'rgba(255,255,255,0.3)' }, { backgroundColor: 'transparent', duration: 0.3 })`
- Stop all stream tracks
- Hide video, call `showCropper(dataURL)`

**`showCropper(dataURL)`**
- Set `<img id="captured-image">` src to dataURL, display: block
- On img load: init Cropper.js v1:
  ```
  new Cropper(img, {
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
  })
  ```
- NO aspectRatio -- equations can be any shape
- Change phase to 'cropping', button text to STRINGS.selectionDone

**`finishCrop()`**
- `cropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 800 })`
- Convert to data URL: `.toDataURL('image/jpeg', 0.9)`
- Destroy cropper
- Call `goToState(AppState.VALIDATOR, { croppedImageDataURL: dataURL })`

**`cleanup()`**
- Stop all stream tracks
- Destroy cropper if exists
- Reset phase to 'camera'

---

## Review checklist

Test on real device if possible (phone on same WiFi, access via local IP):

- [ ] Camera opens on load (permission prompt appears)
- [ ] Video feed fills the screen
- [ ] "Fotozas" button visible in glass bar at bottom
- [ ] Tap "Fotozas": white flash, image freezes, Cropper.js crop box appears
- [ ] Crop box is movable and resizable (touch + mouse)
- [ ] Button text changes to "Kijeloles Kesz"
- [ ] Tap "Kijeloles Kesz": transitions to Validator state (State 2) with cropped image data
- [ ] **Desktop fallback:** Deny camera permission -> button changes to "Kep kivalasztasa" -> file picker opens -> select image -> Cropper.js appears
- [ ] Camera stream stops after capture (check browser camera indicator turns off)
- [ ] "Uj feladat" from Board state returns to Scanner and camera re-opens
- [ ] No console errors
- [ ] Test on iOS Safari if possible (playsinline attribute working = video not going fullscreen)
