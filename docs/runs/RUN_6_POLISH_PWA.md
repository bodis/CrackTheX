# Run 6: Animation Polish + PWA Finalization

**Phases:** 7 + 8
**Files to modify:** All JS files (add GSAP micro-interactions), `css/style.css` (ripple, final tweaks), `sw.js` (finalize caching)
**Goal:** Final polish pass. Every interaction feels buttery. PWA installs. Offline shell works.

---

## What to build

### Animation additions across all modules

**app.js -- button ripple effect**
- Add `rippleEffect(btn, e)` function:
  - Create span.ripple positioned at click point
  - GSAP animate: scale 0 -> 2.5 while opacity 1 -> 0, duration 0.5
  - Remove span on complete
- Attach to all `.btn-primary` and `.btn-accent` click events
- CSS: `.btn-primary { position: relative; overflow: hidden; }`

**app.js -- app logo animation (optional)**
- If an `#app-logo` element exists in scanner state:
  - Split text into `<span>` per character
  - GSAP stagger from `{ y: -20, opacity: 0 }` with `back.out(2)` ease

**camera.js -- capture flash**
- Already has basic flash -- enhance with a GSAP overlay div that flashes white then fades

**validator.js -- loading state**
- Animate spinner with GSAP rotation (supplement CSS animation for smoother feel)
- Fade-in the recognized equation result when it arrives

**interactive-board.js -- equals sign pulse**
- When a valid drag enters the opposite drop zone:
  - `gsap.to('.equals-sign', { scale: 1.3, textShadow: '0 0 20px var(--accent-cyan)', duration: 0.2, yoyo: true, repeat: 1 })`

**interactive-board.js -- step badge count animation**
- Each step card gets a numbered badge ("01", "02", etc.)
- Animate from "00" to target number with GSAP counter

**interactive-board.js -- sign flip pop**
- When a term changes sign: scale to 1.4 then back with `back.out(2.5)` (more dramatic elastic)
- Brief color burst: neon cyan for +, neon pink for -

### CSS final tweaks

- Ensure all hover states have smooth transitions
- Verify gradient text renders correctly on all target browsers
- Check glass-card border-image renders (border-image + border-radius don't combine well in all browsers -- may need fallback to border-color)
- Fine-tune aurora opacity if too bright/dim on real devices
- Verify loading spinner is centered in validator state

### PWA finalization

**sw.js:**
- Verify all CDN URLs are in SHELL_ASSETS array
- Test install -> offline -> refresh cycle:
  1. Load app with network
  2. Check service worker is active (DevTools > Application > Service Workers)
  3. Go offline (DevTools > Network > Offline checkbox)
  4. Refresh -- app should load from cache
  5. Camera + crop + solver should work offline
  6. Only Mathpix OCR should fail (with "Nincs internetkapcsolat" message)

**manifest.json:**
- Verify theme_color matches new `#080b1a` palette
- Generate real PWA icons (192x192 and 512x512):
  - Purple/cyan gradient "X" logo on dark background
  - Can use any online PWA icon generator

**Icons:**
- Create proper `assets/icons/icon-192.png` and `icon-512.png`
- Should look good as a home screen icon on iOS/Android

### Performance check

- Run Chrome Lighthouse audit (PWA + Performance + Accessibility tabs)
- Target scores: Performance > 80, PWA checkmarks, Accessibility > 85
- Check GSAP animations run at 60fps on mobile (DevTools > Performance > Record during drag)
- Verify no layout shifts during state transitions

---

## Review checklist

### Animations
- [ ] Button ripple effect on all button clicks
- [ ] Camera capture flash is satisfying
- [ ] Validator cards stagger in smoothly
- [ ] Loading spinner animates during OCR wait
- [ ] Step cards stagger in with gentle bounce
- [ ] Equals sign pulses/glows when valid drag hovers
- [ ] Sign flip pop is dramatic and clear (color + scale)
- [ ] New step card entrance has bounce easing
- [ ] FAB floats subtly
- [ ] All transitions feel smooth at 60fps
- [ ] No animation jank on lower-end mobile

### PWA
- [ ] Service worker registers and activates
- [ ] App works offline after first load (except OCR)
- [ ] "Add to Home Screen" prompt appears on mobile (or manual add works)
- [ ] App launches in standalone mode from home screen (no browser chrome)
- [ ] Theme color shows in status bar / task switcher
- [ ] Icons display correctly on home screen
- [ ] Lighthouse PWA audit passes all critical checks

### Final end-to-end
- [ ] Full flow: Camera -> Crop -> OCR -> Validate -> Solve -> Drag -> New Problem
- [ ] Repeat cycle works (no state leaks, memory cleanup correct)
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Works on Desktop Chrome
- [ ] Works on Desktop Firefox
- [ ] No console errors or warnings
- [ ] App feels modern, snappy, and delightful to use
