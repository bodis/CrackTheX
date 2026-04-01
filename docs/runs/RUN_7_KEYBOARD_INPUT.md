# Run 7: Manual Keyboard Input + Entry Screen Redesign

**Phase:** 9
**Files to modify:** `index.html`, `css/style.css`, `js/app.js`, `js/camera.js`, `js/validator.js`, `js/utils.js`
**Files to create:** None
**Goal:** Users choose between keyboard entry (primary) or camera/OCR from a clean home screen. Validator adapts to keyboard-only mode. Plain math notation accepted alongside LaTeX.

---

## UX Design

### Problem with current flow

The app launches directly into a live camera feed. This is:
- **Jarring** — camera permission prompt fires immediately on first load
- **Wasteful** — camera stream runs even when the user would rather just type `2x + 3 = 7`
- **Single-path** — no alternative for users who find typing faster than photographing
- **Confusing** — new users see a camera feed with no context about what to do

### New flow

```
HOME SCREEN (replaces always-on camera)
├── "Begepeles" card (PRIMARY) → Validator (keyboard mode) → Board
└── "Fotozas" card (secondary) → Camera → Crop → Validator (OCR mode) → Board
```

### Home Screen (Scanner state redesigned)

The Scanner state transforms from an always-on camera feed into a **clean home/entry screen** with two clear options. The camera only activates when explicitly chosen.

**Keyboard is the primary path** because:
- Most school equations are simple enough to type (`2x + 3 = 7`)
- Works fully offline (no OCR API needed)
- No camera permission required
- Faster for the common case

**Layout (centered column, vertically centered on screen):**

```
┌──────────────────────────┐
│                          │
│       CrackTheX          │  ← gradient logo, letter stagger (existing)
│                          │
│  Oldd meg az egyenletet  │  ← tagline, text-secondary color
│    lepesrol lepesre!     │
│                          │
│  ┌──────────────────────┐│
│  │  ✏️  Begepeles       ││  ← PRIMARY: larger card, full-width,
│  │  Ird be az egyenletet││    gradient accent border
│  └──────────────────────┘│
│                          │
│  ┌──────────────────────┐│
│  │  📷  Fotozas         ││  ← secondary: smaller card, full-width,
│  │  Fotozd le az        ││    subtle glass style
│  │  egyenletet          ││
│  └──────────────────────┘│
│                          │
└──────────────────────────┘
```

**Why stacked, not side-by-side:** Two equal-weight cards in a grid create decision paralysis. Stacking with the primary (keyboard) on top, larger, and visually heavier makes the default choice clear. Camera is available but clearly secondary.

**Entry card visual treatment:**
- Both cards **full-width** in a stacked column (`max-width: 360px`)
- **Keyboard card (primary):** gradient left border (3px, `--gradient-main`), slightly larger padding, accent glow on hover. Contains inline SVG pencil/edit icon.
- **Camera card (secondary):** standard glass-border (1px), normal padding, standard hover. Contains inline SVG camera icon.
- Icons: **inline SVG** elements in the HTML (not CSS backgrounds — they're unreliable for this). Simple outlined icons, 32x32, `currentColor` stroke. Specific SVG paths provided in the HTML section below.
- GSAP stagger entrance from below on state init, keyboard card first

**Note on Hungarian text:** The existing `STRINGS` in `app.js` uses **ASCII-only Hungarian** (no accents: "Fotozas" not "Fotózás"). All new strings follow the same convention for consistency. The HTML `lang="hu"` attribute handles browser-level language features. Future i18n can add accented versions — don't mix conventions now.

**Camera sub-view:**
- Camera elements (`video`, `canvas`, `img`, file input, controls) remain in the Scanner section HTML but are wrapped in a `#camera-view` container, **hidden by default**
- When "Fotozas" is tapped: home content hides, `#camera-view` shows, camera stream starts
- Existing camera phases (`camera` → `cropping`) work unchanged inside this container
- **Logo is NOT visible during camera view** — intentional, the camera feed should be full-screen. The top-left back button provides enough UI context.
- **Back button** positioned **top-left** of camera view (not in bottom bar) — standard mobile navigation pattern. The bottom bar contains only the primary capture action.

### Camera module changes

`camera.js` currently has two phases: `camera` and `cropping`. Add a third:

```
phase: 'home' → 'camera' → 'cropping'
```

- `init()` now starts at `phase: 'home'` — shows home content, hides camera view, does NOT request camera
- `startCamera()` — new method called when "Fotozas" is tapped — transitions to `phase: 'camera'`, shows camera view, requests `getUserMedia`
- Existing `captureFrame()` and cropping flow unchanged
- `cleanup()` enhanced: also hides camera view, shows home content
- **Back button**: stop stream, destroy cropper if active, return to `phase: 'home'`

**Note on SRP:** `camera.js` now manages both the home screen UI and camera functionality. This is a pragmatic trade-off — extracting a separate `HomeScreen` module would require changes to the state machine (adding a 4th state) which is out of scope. The home screen logic within Camera is minimal (~15 lines: wire 3 click handlers, toggle 2 containers). Acceptable for this scope.

**Logo stagger once:** Add a module-level `let _logoAnimated = false;` flag in `camera.js`. In `init()`, only run the GSAP letter stagger if `_logoAnimated === false`, then set it to `true`. This prevents re-animation when returning from "Uj feladat".

### Validator changes

**Back button on Validator (both modes):**
The Validator screen currently has no way to go back. Add a top-left back button (`#btn-validator-back`) that returns to the Home screen:
- Calls `goToState(AppState.SCANNER)` — which triggers Camera.init() → home phase
- In OCR mode: also cleans up any pending OCR call (existing `_initGeneration` pattern handles this)

**Keyboard mode behavior:**

When entering from "Begepeles" (keyboard entry), `goToState(VALIDATOR, { mode: 'keyboard' })`:

| Aspect | OCR mode (existing) | Keyboard mode (new) |
|--------|---------------------|---------------------|
| `#card-original` (image) | Visible with cropped photo | **Hidden** (`display: none`) |
| Back button | Top-left, returns to home | Same |
| Card title | "Felismert keplet" | **"Egyenlet"** |
| Input placeholder | "LaTeX keplet..." | **"pl. 2x + 3 = 7"** |
| Input focus | Not auto-focused | **Auto-focused (with delay)** |
| Loading spinner | Shows during OCR | **Never shown** |
| OCR call | Yes | **No** |
| Input format | LaTeX only | **Plain math + LaTeX** |
| Solve button | Appears after OCR completes | **Visible immediately** |

**Visual result in keyboard mode:**

```
┌──────────────────────────┐
│ ← Vissza                 │  ← top-left back button
│                          │
│         Egyenlet         │  ← card label
│                          │
│    2x + 3 = 7            │  ← live KaTeX preview (large, centered)
│                          │
│  ┌──────────────────┐    │
│  │ 2x + 3 = 7      │    │  ← glass-input, auto-focused, mono font
│  └──────────────────┘    │
│                          │
│     [ Megoldas! ]        │  ← accent button, ready immediately
│                          │
└──────────────────────────┘
```

**Mobile soft keyboard handling:**
When the input auto-focuses on mobile, the soft keyboard covers ~50% of the viewport. To ensure the KaTeX preview + input remain visible:
- Auto-focus with a **700ms delay** (after GSAP entrance completes) — prevents the keyboard from interfering with the entrance animation
- Add `scroll-padding-bottom: 50vh` on `#state-validator` so the focused input scrolls above the keyboard
- The `#state-validator` already has `overflow-y: auto` — the focused input will scroll into view via the browser's native scroll-to-focus behavior
- Test on iOS Safari (which resizes the visual viewport) and Android Chrome (which resizes layout viewport)

### Plain math input support

Add `MathUtils.plainMathToLatex(input)` in `utils.js` to convert natural notation to LaTeX **for KaTeX preview only**:

| User types | Converted to LaTeX | KaTeX renders |
|---|---|---|
| `2x + 3 = 7` | `2x + 3 = 7` | 2x + 3 = 7 |
| `x^2 + 1 = 5` | `x^2 + 1 = 5` | x² + 1 = 5 |
| `x/2 + 1 = 5` | `\frac{x}{2} + 1 = 5` | fraction |
| `sqrt(x) = 3` | `\sqrt{x} = 3` | sqrt x = 3 |
| `2(x+3) = 10` | `2(x+3) = 10` | 2(x+3) = 10 |
| `3*x = 9` | `3 \cdot x = 9` | 3 dot x = 9 |
| `(x+1)/(x-1) = 2` | `\frac{x+1}{x-1} = 2` | fraction |

**Detection logic:** If input contains backslashes (`\`), treat as raw LaTeX — return unchanged. Otherwise, apply `plainMathToLatex()`.

**Fraction conversion rules (important):**
- Only convert `a/b` where `a` and `b` are **single tokens**: a number (`3`), a variable (`x`), or a parenthesized group (`(x+1)`)
- `x/2` → `\frac{x}{2}` (single token / single token)
- `(x+1)/2` → `\frac{x+1}{2}` (parenthesized group / single token)
- `x + 1/2` → `x + \frac{1}{2}` (the `/` only binds the adjacent `1` and `2`)
- Do NOT attempt multi-token numerators without parentheses — too ambiguous

**Solver input path clarification:**
The `plainMathToLatex` function is cosmetic — it's used **only** for the live KaTeX preview. The actual solver pipeline is:
1. User types raw text (e.g., `2x + 3 = 7`)
2. Validator calls `solve()` with the raw text
3. `Solver.solve()` passes it through `MathUtils.latexToNerdamer()`
4. `latexToNerdamer()` already handles plain math input gracefully — nerdamer's syntax IS close to plain math (`2*x+3=7`). The only conversions needed are LaTeX-specific commands (`\frac`, `\sqrt`), which plain math input won't contain.
5. If the raw text has no backslashes, `latexToNerdamer()` effectively passes it through as-is.

So: plain math → solver already works. Plain math → preview needs `plainMathToLatex()`. No additional solver changes needed.

---

## What to build

### index.html changes

Restructure `#state-scanner`:

```html
<!-- STATE 1: HOME / ENTRY -->
<section id="state-scanner" class="app-state active">
  <!-- Home screen (default view) -->
  <div id="home-content" class="home-content">
    <div id="app-logo" class="gradient-text">CrackTheX</div>
    <p class="home-tagline">Oldd meg az egyenletet lepesrol lepesre!</p>
    <div class="entry-options">
      <button class="glass-card entry-card entry-card--primary" id="entry-keyboard">
        <svg class="entry-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
        <span class="entry-label">Begepeles</span>
        <span class="entry-subtitle">Ird be az egyenletet</span>
      </button>
      <button class="glass-card entry-card" id="entry-camera">
        <svg class="entry-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span class="entry-label">Fotozas</span>
        <span class="entry-subtitle">Fotozd le az egyenletet</span>
      </button>
    </div>
  </div>
  <!-- Camera sub-view (hidden until "Fotozas" tapped) -->
  <div id="camera-view" style="display:none;">
    <button id="btn-camera-back" class="btn-back-nav" aria-label="Vissza">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
      </svg>
    </button>
    <video id="camera-feed" autoplay playsinline></video>
    <canvas id="capture-canvas" style="display:none;"></canvas>
    <img id="captured-image" style="display:none;" alt="Captured" />
    <input type="file" id="file-input" accept="image/*" capture="environment" style="display:none;" />
    <div id="scanner-controls" class="glass-bar">
      <button id="btn-capture" class="btn-primary">Fotozas</button>
    </div>
  </div>
</section>
```

Add back button to Validator:

```html
<!-- Inside #state-validator, before .validator-content -->
<button id="btn-validator-back" class="btn-back-nav" aria-label="Vissza">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
  </svg>
</button>
```

### css/style.css additions

```css
/* ========== HOME SCREEN ========== */

.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  gap: 2rem;
}

/* Logo repositioned: relative in home, not absolute */
.home-content #app-logo {
  position: relative;
  top: auto;
  left: auto;
  transform: none;
  font-size: 2.5rem;
}

.home-tagline {
  color: var(--text-secondary);
  font-size: 1rem;
  text-align: center;
  max-width: 280px;
}

.entry-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 360px;
}

.entry-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  border: none;
  font-family: inherit;
  text-align: left;
}

.entry-card--primary {
  border-left: 3px solid transparent;
  border-image: var(--gradient-main) 1;
  padding: 1.5rem 1.75rem;
}

.entry-card--primary .entry-label {
  font-size: 1.2rem;
}

.entry-icon {
  flex-shrink: 0;
  color: var(--accent-light);
}

.entry-card--primary .entry-icon {
  color: var(--accent-cyan);
}

.entry-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.entry-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: block;
  margin-top: 0.15rem;
}

/* ========== BACK NAVIGATION BUTTON ========== */

.btn-back-nav {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 15;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
  transition: background 0.2s, border-color 0.2s;
}

.btn-back-nav:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-active);
}

/* ========== CAMERA VIEW ========== */

#camera-view {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* Scanner controls: single centered button (back button is top-left, not here) */
#scanner-controls {
  justify-content: center;
}
```

### js/camera.js changes

```
Module-level:
  let _logoAnimated = false;

Camera.init():
  - Set phase = 'home'
  - Show #home-content, hide #camera-view
  - Wire #entry-keyboard click → goToState(AppState.VALIDATOR, { mode: 'keyboard' })
  - Wire #entry-camera click → Camera.startCamera()
  - Wire #btn-camera-back click → Camera.backToHome()
  - Logo stagger: if (!_logoAnimated) { run GSAP stagger; _logoAnimated = true; }

Camera.startCamera():
  - Hide #home-content with GSAP (opacity 0, scale 0.95, 0.3s)
  - Show #camera-view with GSAP fade-in (0.4s)
  - Set phase = 'camera'
  - Request getUserMedia (existing logic)
  - Existing capture + crop flow continues unchanged

Camera.backToHome():
  - Stop camera stream if active
  - Destroy cropper if active
  - Hide #camera-view, show #home-content with GSAP fade
  - Set phase = 'home'

Camera.cleanup():
  - Enhanced: also handles the home/camera-view toggle reset
  - Remove all click listeners (use bound references, same pattern as validator.js)
```

### js/validator.js changes

```
Validator.init(data):
  this._mode = data.mode || 'ocr';

  // Wire back button
  Wire #btn-validator-back click → goToState(AppState.SCANNER)

  If this._mode === 'keyboard':
    - Hide #card-original
    - Change #card-recognized .card-label text to STRINGS.equation
    - Set input placeholder to STRINGS.inputPlaceholder
    - Show solve button immediately (loading.style.display = 'none')
    - Auto-focus input with 700ms delay: setTimeout(() => input.focus(), 700)
    - Skip recognizeEquation() call
  If this._mode === 'ocr':
    - Show #card-original (ensure it's visible — may have been hidden by previous keyboard session)
    - Restore card label to STRINGS.recognized
    - Existing flow unchanged

Validator.onLatexInput(e):
  - Get raw value from input
  - If this._mode === 'keyboard' && !raw.includes('\\'):
      renderLatex = MathUtils.plainMathToLatex(raw)
  - Else:
      renderLatex = raw
  - this.renderLatex(renderLatex)

Validator.solve():
  - Pass raw input text to solver (NOT the plainMathToLatex version)
  - Let latexToNerdamer() handle conversion

Validator.cleanup():
  - Enhanced: remove back button listener
  - Show #card-original (reset for next use)
  - Restore card label text
```

### js/utils.js changes

```
MathUtils.plainMathToLatex(input):
  - If input contains '\', return as-is (user is typing LaTeX)
  - Replace 'sqrt(...)' → '\sqrt{...}' (match balanced parens)
  - Replace fraction patterns a/b → '\frac{a}{b}' where a and b are:
    - Single number: 1/2, 3/4
    - Single variable: x/2, y/3
    - Parenthesized group: (x+1)/2, (x+1)/(x-1)
    - NOT multi-token without parens: "x + 1/2" → "x + \frac{1}{2}" (only 1 and 2 are bound)
  - Replace '*' → ' \cdot '
  - Return converted string

  Implementation approach: use a regex that matches
  (\([^)]+\)|[a-zA-Z0-9]+)\s*\/\s*(\([^)]+\)|[a-zA-Z0-9]+)
  and replaces with \frac{$1}{$2} (stripping outer parens from groups).
```

### js/app.js changes

```
STRINGS additions:
  - typing: 'Begepeles'
  - typingSubtitle: 'Ird be az egyenletet'
  - photoSubtitle: 'Fotozd le az egyenletet'
  - equation: 'Egyenlet'
  - back: 'Vissza'
  - inputPlaceholder: 'pl. 2x + 3 = 7'
  - homeTagline: 'Oldd meg az egyenletet lepesrol lepesre!'

DOMContentLoaded:
  - Remove the inline logo stagger code (moved to Camera.init with _logoAnimated flag)
```

---

## Interaction details

### Home screen entrance animation
- Logo: letter stagger from above (runs once, `_logoAnimated` flag)
- Tagline: fade in 0.3s after logo completes
- Entry cards: stagger from below, keyboard first, camera second, 0.15s apart, `power2.out` ease
- Aurora background visible and animated (existing)

### Camera entry transition
- Home content: GSAP fade out (opacity 0, scale 0.95, 0.3s)
- Camera view: GSAP fade in (opacity 0 → 1, 0.4s)
- Camera stream starts during the animation
- Back button (top-left chevron) visible immediately

### Keyboard entry transition
- Standard `goToState(VALIDATOR, { mode: 'keyboard' })` — existing GSAP state transition
- Input auto-focuses after 700ms delay (after entrance animation + time for layout to settle)
- On mobile: soft keyboard should appear, browser scrolls input into view

### Back button (camera → home)
- Camera view fades out (0.3s)
- Home content fades in (0.4s) — no re-animation of cards, instant show
- Camera stream stops immediately

### Back button (validator → home)
- Standard `goToState(SCANNER)` — existing GSAP state transition
- Validator cleanup runs (input cleared, card-original shown, listeners removed)
- Home screen appears in home phase

---

## Edge cases

- **Empty input on solve**: Button does nothing (existing behavior — `if (!latex) return;`)
- **Camera denied + keyboard**: User can still use the app via keyboard entry (major accessibility win — the app is fully usable without camera)
- **Switch from camera to keyboard mid-session**: "Back" returns to home, then user can pick keyboard. Camera stream is properly cleaned up.
- **Back from validator**: Returns to home screen. Any typed equation is lost (no draft saving — keep it simple).
- **PWA offline**: Keyboard entry works fully offline (no API call needed). Camera entry still shows "Nincs internetkapcsolat" for OCR, but user can manually type in the validator input field.
- **Plain math conversion edge cases**: The converter handles common single-token fraction patterns only. Multi-token ambiguous cases like `x + 1/2` bind tightly (`1/2` becomes a fraction, `x` stays). If KaTeX render looks wrong, user can adjust — the live preview makes this self-correcting.
- **Rapid path switching**: User taps camera, immediately taps back, then taps keyboard. Each action properly cleans up the previous state via existing cleanup patterns.
- **Landscape orientation**: Home screen flexbox layout works in landscape. Entry cards may be narrower but functional. Camera view is full-screen in both orientations (existing behavior).

---

## Review checklist

### Home screen
- [ ] Home screen appears on app load (no camera feed, no permission prompt)
- [ ] Logo animates with letter stagger on first load only
- [ ] Tagline visible below logo
- [ ] Keyboard card is visually primary (larger, gradient border, positioned first)
- [ ] Camera card is visually secondary (standard glass, positioned second)
- [ ] Cards stacked vertically, full-width, max 360px
- [ ] SVG icons render correctly in both cards
- [ ] Cards have hover/tap lift effect
- [ ] GSAP stagger entrance on cards
- [ ] Aurora background visible behind home screen
- [ ] Returning from "Uj feladat" shows home screen, logo does NOT re-animate

### Camera path
- [ ] Tapping "Fotozas" hides home, shows camera view with GSAP transition
- [ ] Camera stream starts (permission prompt appears only now, not on load)
- [ ] Back button (chevron) visible at top-left of camera view
- [ ] Bottom bar has ONLY the capture button (no back button in bar)
- [ ] Back button stops camera, returns to home screen
- [ ] Full existing flow works: capture -> crop -> validator (OCR mode)
- [ ] File fallback still works when camera is denied
- [ ] Validator shows original image card in OCR mode

### Keyboard path
- [ ] Tapping "Begepeles" transitions to Validator in keyboard mode
- [ ] `#card-original` (image card) is hidden
- [ ] Card title says "Egyenlet" not "Felismert keplet"
- [ ] Input placeholder shows "pl. 2x + 3 = 7"
- [ ] Input is auto-focused after ~700ms, soft keyboard opens on mobile
- [ ] KaTeX preview + input remain visible when soft keyboard is open
- [ ] No loading spinner, no OCR call
- [ ] "Megoldas!" button visible immediately
- [ ] Typing `2x + 3 = 7` renders correct KaTeX preview
- [ ] Typing `x/2 + 1 = 5` renders a fraction in preview
- [ ] Typing `(x+1)/2 = 3` renders the full numerator as a fraction
- [ ] Typing `\frac{x}{2}` also works (raw LaTeX pass-through)
- [ ] Solving works correctly from keyboard input
- [ ] Full flow: keyboard input -> solve -> board -> drag -> "Uj feladat" -> back to home

### Validator back button (both modes)
- [ ] Back button (chevron) visible at top-left of validator
- [ ] Tapping back returns to home screen
- [ ] Typed equation is discarded (no draft saving)
- [ ] In OCR mode: pending OCR call is cancelled cleanly
- [ ] In keyboard mode: works identically

### Cross-cutting
- [ ] "Uj feladat" (from board) returns to home screen, not camera
- [ ] No console errors in either path
- [ ] Works in landscape orientation (home + camera + validator)
- [ ] Works offline (keyboard path is fully offline-capable)
- [ ] All new strings use ASCII-only Hungarian (matching existing STRINGS convention)
