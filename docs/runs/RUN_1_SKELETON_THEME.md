# Run 1: Skeleton + Theme + State Machine

**Phases:** 1 + 2
**Files to create:** `index.html`, `css/style.css`, `manifest.json`, `sw.js`, `js/app.js`, `assets/icons/` (placeholder)
**Goal:** App shell opens in browser with 3 clickable states, aurora background, glassmorphism cards, GSAP transitions.

---

## What to build

### 1. index.html
- Full HTML shell with all 3 `<section class="app-state">` containers (scanner, validator, board)
- All CDN links: Google Fonts (Space Grotesk + JetBrains Mono), Cropper.js v1.6.2 CSS, KaTeX CSS, Cropper.js JS, KaTeX JS, nerdamer (core + Algebra + Calculus + Solve), interact.js, GSAP
- PWA meta tags: viewport, theme-color `#080b1a`, apple-mobile-web-app-capable, manifest link
- Local script tags in order: `utils.js`, `api.js`, `solver.js`, `camera.js`, `validator.js`, `interactive-board.js`, `app.js`
- Placeholder content in each state so we can see the transitions:
  - Scanner: video element, canvas (hidden), img (hidden), file input (hidden), glass-bar with "Fotozas" button
  - Validator: two glass-cards (original + recognized), LaTeX render div, glass-input, loading spinner, "Megoldas!" button
  - Board: steps-container, interactive-zone glass-card, FAB "Uj feladat" button

**CRITICAL:** Cropper.js must be v1.6.2, NOT v2.x

### 2. css/style.css
Full CSS including:
- **CSS Variables:** Gen Z dark theme with `--bg-primary: #080b1a`, electric violet + cyan accent system, gradient variables, glow variables, Space Grotesk + JetBrains Mono fonts
- **Global reset:** box-sizing, body background, font-smoothing
- **Aurora animated background:** Two gradient orbs via `body::before` / `body::after` with `@keyframes aurora-drift` (12s cycle, blur 80px, opacity 0.18)
- **Gradient text utility:** `.gradient-text` class
- **Glassmorphism:** `.glass-card`, `.glass-bar`, `.glass-input` with `backdrop-filter: blur(24px)`
- **State visibility:** `.app-state { display: none }` / `.app-state.active { display: flex }`
- **Layout per state:** Scanner (video fills viewport, controls pinned bottom), Validator (centered column, max-width 500px), Board (scrollable column, max-width 500px)
- **Buttons:** `.btn-primary` (glass pill), `.btn-accent` (gradient), `.fab` (fixed bottom-right, gradient)
- **Micro-interactions:** Button hover lift (-2px), button press scale (0.97), card hover lift (-3px) + border glow, gradient left border on step cards, draggable term hover glow
- **Interactive zone:** `.equation-row`, `.equation-side` (dropzone), `.draggable-term` (touch-action: none, will-change: transform), `.equals-sign`
- **Loading spinner:** CSS-only rotating ring
- **Warning banner:** Yellow tint glass
- **Step cards:** `.step-card`, `.step-rule` badge (top-right pill), `.step-connector` (vertical line)
- **Responsive:** `@media (min-width: 768px)` constrains to 600px

### 3. manifest.json
- name: "CrackTheX - Egyenletmegoldo", short_name: "CrackTheX"
- display: standalone, orientation: portrait
- theme_color + background_color: #080b1a (match new palette)
- Icons: icon-192.png and icon-512.png

### 4. sw.js
- Cache name: `crackthex-v1`
- Precache shell: all local files + all CDN URLs
- Install: precache + skipWaiting
- Activate: delete old caches + clients.claim
- Fetch: network-only for `api.mathpix.com` and `/api/*`, cache-first for everything else

### 5. js/app.js
- `STRINGS` object: all Hungarian UI strings (takePhoto, selectionDone, solve, newProblem, rule labels, error messages)
- `AppState` enum: SCANNER, VALIDATOR, BOARD
- `goToState(newState, data)`: GSAP timeline -- fade out old (opacity 0, y -20, 0.3s), remove active class + cleanup, add active class + init, fade in new (opacity 1, y 0, 0.4s)
- DOMContentLoaded: register service worker, wire btn-new click -> goToState(SCANNER), start with goToState(SCANNER)
- **Stub modules** for this run: create minimal `Camera`, `Validator`, `InteractiveBoard` objects with empty `init()` and `cleanup()` methods so app.js doesn't crash. Also stub `js/utils.js`, `js/api.js`, `js/solver.js` as empty files.

### 6. assets/icons/
- Generate simple placeholder SVG-based PNGs (192x192 and 512x512) -- a purple "X" on dark background, or use a solid color placeholder

---

## Review checklist

After this run, open `index.html` in a browser (serve with `npx serve .` or `python3 -m http.server`) and verify:

- [ ] Aurora background visible -- two purple/cyan gradient orbs slowly drifting
- [ ] Space Grotesk font loads (check Network tab or inspect body computed style)
- [ ] Scanner state visible on load with "Fotozas" button in glass bar at bottom
- [ ] All 3 states have correct glass-card layouts
- [ ] "Megoldas!" button has gradient (violet -> purple -> cyan)
- [ ] FAB "Uj feladat" visible on board state with gradient
- [ ] Button hover: lifts up 2px with glow
- [ ] Glass cards: hover lifts 3px with subtle border glow
- [ ] GSAP transitions work: if you manually call `goToState(AppState.VALIDATOR)` in console, it fades/slides smoothly
- [ ] Test all 3 state transitions via console
- [ ] Mobile responsive: cards constrain to max-width, no horizontal scroll
- [ ] No console errors
- [ ] Service worker registers (check Application tab in DevTools)
- [ ] manifest.json loads (check Application > Manifest in DevTools)
