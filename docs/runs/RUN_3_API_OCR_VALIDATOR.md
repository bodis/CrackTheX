# Run 3: API Layer + OCR + Validator

**Phases:** API abstraction + Phase 4
**Files to create:** `js/api.js` (replace stub), `js/validator.js` (replace stub)
**Goal:** Photograph equation -> crop -> Mathpix OCR returns LaTeX -> KaTeX renders it -> user can edit -> "Megoldas!" transitions to Board.

---

## What to build

### js/api.js

The `API` abstraction module. All network calls go through here.

**Properties:**
- `MATHPIX_APP_ID`: 'YOUR_APP_ID' (placeholder)
- `MATHPIX_APP_KEY`: 'YOUR_APP_KEY' (placeholder)
- `MODE`: 'direct' (MVP) or 'proxy' (production)
- `BACKEND_URL`: 'https://your-backend.com'

**Methods:**

`async ocr(base64DataURL)`
- If MODE is 'proxy': POST to `BACKEND_URL + '/api/ocr'` with `{ src: base64DataURL }`
- If MODE is 'direct': POST to `https://api.mathpix.com/v3/text` with headers `app_id`, `app_key` and body `{ src, math_inline_delimiters: ['$','$'], rm_spaces: true, formats: ['latex_simplified'] }`
- Return parsed JSON response

`async saveEquation(latex, steps)` -- no-op stub for future backend
`async getHistory()` -- no-op stub returns `[]`

### js/validator.js

The `Validator` module managing State 2.

**Properties:**
- `currentCroppedImage`: null
- `debounceTimer`: null

**`init(data)`**
- Store `data.croppedImageDataURL`
- Set `<img id="cropped-preview">` src
- GSAP entrance: `gsap.from('#state-validator .glass-card', { y: 50, opacity: 0, duration: 0.5, stagger: 0.2, ease: 'power2.out' })`
- Clear latex input, wire input event listener
- Wire btn-solve click to `solve()`
- Hide OCR warning
- Call `recognizeEquation(data.croppedImageDataURL)`

**`async recognizeEquation(base64DataURL)`**
- Show loading spinner, hide solve button
- Check `navigator.onLine` -- if offline, show message and return
- Call `API.ocr(base64DataURL)` (goes through api.js)
- Extract LaTeX: strip `$...$` delimiters, use `latex_simplified` or `text` field
- Fill `#latex-input` with extracted LaTeX
- Render with KaTeX: `katex.render(latex, target, { throwOnError: false, displayMode: true, output: 'html' })`
- If confidence < 0.8: show `#ocr-warning`
- On error: show `STRINGS.apiError` in placeholder
- Finally: hide spinner, show solve button

**`onLatexInput(e)`**
- Debounce 200ms, then re-render KaTeX from input value

**`solve()`**
- Get latex from input, if empty return
- Call `goToState(AppState.BOARD, { latex, croppedImageDataURL })`

**`cleanup()`**
- Clear image, input, render div, timers

---

## Testing notes

To test Mathpix OCR you need real API keys:
1. Register at https://mathpix.com (free tier available)
2. Replace `YOUR_APP_ID` and `YOUR_APP_KEY` in `js/api.js`
3. Test with a photo of a simple handwritten equation like `x + 5 = 10`

If you don't have keys yet, you can test the validator UI by:
1. Opening browser console after cropping
2. Manually calling: `document.getElementById('latex-input').value = 'x + 5 = 10'` and triggering input event
3. KaTeX should render the equation

---

## Review checklist

- [ ] Full flow: Camera -> Crop -> loading spinner appears -> LaTeX recognized
- [ ] Cropped image preview shows in the top glass card
- [ ] KaTeX renders the equation beautifully in the bottom card
- [ ] LaTeX input field is pre-filled with OCR result
- [ ] Editing the input live-updates the KaTeX render (debounced ~200ms)
- [ ] Low confidence warning banner appears when Mathpix is uncertain
- [ ] "Megoldas!" button has gradient and transitions to Board state
- [ ] Glass cards stagger-animate in from below
- [ ] **Offline test:** Disable network -> crop image -> "Nincs internetkapcsolat" message appears
- [ ] **API error test:** Set invalid API key -> error message appears, manual input still works
- [ ] **No API key test:** The app doesn't crash, shows error, user can type LaTeX manually
- [ ] Returning from Board to Scanner and back through Validator works cleanly
- [ ] No console errors (except expected 401 if no API key)
