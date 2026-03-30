# CrackTheX - Complete Implementation Plan

## Interactive Math Equation Solver PWA (MVP)

A browser-based PWA for Hungarian students. Photographs handwritten math equations, OCR-recognizes them via Mathpix API, solves step-by-step, and features interactive drag-and-drop where students move terms across the equals sign (sign flips automatically).

**Design language:** Dark mode, Glassmorphism, Gen Z aesthetic -- animated aurora background, gradient text, neon accents, micro-interactions
**Tech:** No build tools -- pure HTML/CSS/JS with CDN-loaded libraries
**API layer:** All backend calls go through `js/api.js` abstraction from day one (backend-ready)

---

## Table of Contents

1. [File Structure](#1-file-structure)
2. [Phase 1: Skeleton + Theme](#2-phase-1-skeleton--theme)
3. [Phase 2: State Machine + Transitions](#3-phase-2-state-machine--transitions)
4. [Phase 3: Camera + Cropping](#4-phase-3-camera--cropping)
5. [Phase 4: OCR + Validation](#5-phase-4-ocr--validation)
6. [Phase 5: Step-by-Step Solver Engine](#6-phase-5-step-by-step-solver-engine)
7. [Phase 6: Interactive Board + Drag-and-Drop](#7-phase-6-interactive-board--drag-and-drop)
8. [Phase 7: Animation Polish](#8-phase-7-animation-polish)
9. [Phase 8: PWA + Testing](#9-phase-8-pwa--testing)
10. [Technical Decisions + Risks](#10-technical-decisions--risks)

---

## 1. File Structure

```
CrackTheX/
├── index.html                 # SPA entry point (3 state containers + CDN imports)
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker (cache-first for shell)
├── css/
│   └── style.css              # Dark theme, glassmorphism, all layouts
├── js/
│   ├── app.js                 # State machine, transitions, GSAP orchestration, i18n strings
│   ├── api.js                 # API abstraction layer -- all backend calls go here
│   ├── camera.js              # Camera API + Cropper.js v1.6.2 (State 1)
│   ├── validator.js           # Mathpix API + KaTeX rendering + live editing (State 2)
│   ├── solver.js              # Custom step-by-step solver on nerdamer (State 3 logic)
│   ├── interactive-board.js   # Step card rendering + interact.js drag-and-drop (State 3 UI)
│   └── utils.js               # LaTeX<->nerdamer conversion, term parsing
└── assets/
    └── icons/
        ├── icon-192.png       # PWA icon 192x192
        └── icon-512.png       # PWA icon 512x512
```

**Total: 12 new files** (plus 2 icon images). No build tools. Every JS file is a plain `<script>` tag loaded in order.

---

## 2. Phase 1: Skeleton + Theme

### 2.1 index.html

The single HTML entry point. Contains all 3 SPA state containers and loads all CDN dependencies.

**CDN dependencies (load in this order):**

```html
<!-- Typography: Space Grotesk (modern, slightly rounded, reads young) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<!-- CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">

<!-- JS Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/nerdamer.core.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Algebra.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Calculus.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Solve.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/interact.js/1.10.27/interact.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
```

> **CRITICAL: Cropper.js v1.6.2, NOT v2.x.** Version 2 is a Web Components rewrite with a completely different API. Version 1 uses the classic `new Cropper(imgElement, options)` pattern.

**HTML structure -- three state containers:**

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#0a0e27">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="manifest" href="manifest.json">
  <title>CrackTheX</title>
  <!-- CDN CSS links here -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">

    <!-- STATE 1: SCANNER -->
    <section id="state-scanner" class="app-state active">
      <video id="camera-feed" autoplay playsinline></video>
      <canvas id="capture-canvas" style="display:none;"></canvas>
      <img id="captured-image" style="display:none;" alt="Captured" />
      <input type="file" id="file-input" accept="image/*" capture="environment" style="display:none;" />
      <div id="scanner-controls" class="glass-bar">
        <button id="btn-capture" class="btn-primary">Fotozas</button>
      </div>
    </section>

    <!-- STATE 2: VALIDATOR -->
    <section id="state-validator" class="app-state">
      <div class="validator-content">
        <div class="glass-card" id="card-original">
          <h3 class="card-label">Eredeti</h3>
          <img id="cropped-preview" alt="Cropped equation" />
        </div>
        <div class="glass-card" id="card-recognized">
          <h3 class="card-label">Felismert keplet</h3>
          <div id="latex-render"></div>
          <input type="text" id="latex-input" class="glass-input" placeholder="LaTeX keplet..." />
          <div id="ocr-warning" class="warning-banner" style="display:none;">
            Alacsony felismeresi biztonsag - ellenorizd a kepletet!
          </div>
        </div>
        <div id="validator-loading" class="loading-spinner" style="display:none;">
          <div class="spinner"></div>
          <span>Felismeres...</span>
        </div>
        <button id="btn-solve" class="btn-primary btn-accent">Megoldas!</button>
      </div>
    </section>

    <!-- STATE 3: INTERACTIVE BOARD -->
    <section id="state-board" class="app-state">
      <div id="board-content">
        <div id="steps-container"></div>
        <div id="interactive-zone" class="glass-card interactive-card"></div>
      </div>
      <button id="btn-new" class="fab">Uj feladat</button>
    </section>

  </div>

  <!-- CDN JS links here -->
  <!-- Local JS (load order matters) -->
  <script src="js/utils.js"></script>
  <script src="js/api.js"></script>
  <script src="js/solver.js"></script>
  <script src="js/camera.js"></script>
  <script src="js/validator.js"></script>
  <script src="js/interactive-board.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

**Key HTML notes:**
- `<video>` needs `playsinline` attribute -- without it, iOS Safari forces fullscreen video
- Hidden `<canvas>` captures a frame from the video stream
- Hidden `<img>` receives the captured frame for Cropper.js (v1 works on `<img>` elements)
- Hidden `<input type="file">` is the fallback when camera is unavailable
- Each `.app-state` section is shown/hidden via CSS class toggling

### 2.2 css/style.css

**CSS Variables (Gen Z dark theme):**

```css
:root {
  /* Background layers -- deep space base */
  --bg-primary: #080b1a;
  --bg-secondary: #0d1130;
  --bg-tertiary: #141840;

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-bg-hover: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-active: rgba(255, 255, 255, 0.18);
  --glass-shadow: rgba(0, 0, 0, 0.5);
  --glass-blur: 24px;

  /* Text */
  --text-primary: #f4f4f8;
  --text-secondary: #9898c0;
  --text-muted: #50507a;

  /* Accent: electric violet -> cyan gradient system */
  --accent: #7c3aed;          /* Deep violet */
  --accent-mid: #a855f7;      /* Purple */
  --accent-light: #c084fc;    /* Soft purple */
  --accent-cyan: #22d3ee;     /* Cyan pop */
  --accent-pink: #f472b6;     /* Pink highlight */

  /* Gradient (used on headings, buttons, borders) */
  --gradient-main: linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #22d3ee 100%);
  --gradient-text: linear-gradient(135deg, #c084fc 0%, #22d3ee 100%);
  --gradient-card-border: linear-gradient(135deg, rgba(124,58,237,0.4), rgba(34,211,238,0.2));

  /* Glow */
  --accent-glow: rgba(124, 58, 237, 0.25);
  --accent-glow-strong: rgba(124, 58, 237, 0.5);
  --cyan-glow: rgba(34, 211, 238, 0.2);
  --pink-glow: rgba(244, 114, 182, 0.2);

  /* Semantic */
  --success: #34d399;
  --success-glow: rgba(52, 211, 153, 0.25);
  --danger: #f87171;
  --danger-glow: rgba(248, 113, 113, 0.25);
  --warning: #fbbf24;

  /* Shape */
  --radius-sm: 14px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --transition-speed: 0.25s;

  /* Typography -- Space Grotesk for UI, JetBrains Mono for math input */
  --font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

**Global reset and base:**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  overflow: hidden;
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

#app {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
```

**Animated aurora background (add to `<body>` or `#app::before`):**

```css
/* Aurora mesh background -- two slow-drifting gradient orbs */
body::before,
body::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
  pointer-events: none;
  z-index: 0;
  animation: aurora-drift 12s ease-in-out infinite alternate;
}

body::before {
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, #7c3aed, transparent 70%);
  top: -15vw;
  left: -10vw;
  animation-delay: 0s;
}

body::after {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, #22d3ee, transparent 70%);
  bottom: -10vw;
  right: -10vw;
  animation-delay: -6s;
}

@keyframes aurora-drift {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(5vw, 3vw) scale(1.08); }
  100% { transform: translate(-3vw, 5vw) scale(0.95); }
}

/* Ensure all state content sits above the aurora */
.app-state {
  z-index: 1;
}
```

**Gradient text utility (for headings and app name):**

```css
.gradient-text {
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Micro-interactions -- button lifts, card hover glow:**

```css
/* Buttons lift on hover */
.btn-primary {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--accent-glow);
}
.btn-primary:active {
  transform: translateY(0) scale(0.97);
}

/* Accent button gradient border + glow */
.btn-accent {
  background: var(--gradient-main);
  border: none;
  box-shadow: 0 4px 20px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.15);
}
.btn-accent:hover {
  box-shadow: 0 8px 32px var(--accent-glow-strong), 0 0 0 1px rgba(192,132,252,0.3);
}

/* Glass cards lift + brighten border on hover */
.glass-card {
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.glass-card:hover {
  transform: translateY(-3px);
  border-color: var(--glass-border-active);
  box-shadow: 0 12px 40px var(--glass-shadow), 0 0 0 1px rgba(124,58,237,0.15);
}

/* Step cards: colored left accent bar per step */
.step-card {
  border-left: 3px solid transparent;
  border-image: var(--gradient-main) 1;
  padding-left: 1.25rem;
}

/* Step rule badge: gradient background */
.step-rule {
  background: var(--gradient-main);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border: 1px solid rgba(124,58,237,0.3);
  background-color: rgba(124,58,237,0.1);
}

/* Draggable terms: gradient border on hover */
.draggable-term:hover {
  border-color: var(--accent-mid);
  box-shadow: 0 2px 12px var(--accent-glow);
}

/* FAB: gradient background */
.fab {
  background: var(--gradient-main);
  box-shadow: 0 4px 20px var(--accent-glow-strong);
}
.fab:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 8px 32px var(--accent-glow-strong);
}
```

**Glassmorphism core class:**

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px var(--glass-shadow);
  padding: 1.5rem;
}

.glass-bar {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-top: 1px solid var(--glass-border);
  padding: 1rem 1.5rem;
}

.glass-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.95rem;
  outline: none;
  transition: border-color var(--transition-speed);
}

.glass-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
```

**State visibility system:**

```css
.app-state {
  display: none;
  opacity: 0;
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.app-state.active {
  display: flex;
  flex-direction: column;
  opacity: 1;
}
```

**State 1 -- Scanner layout:**

```css
#state-scanner {
  position: relative;
}

#camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#captured-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--bg-primary);
}

#scanner-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  z-index: 10;
}
```

**State 2 -- Validator layout:**

```css
#state-validator {
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  overflow-y: auto;
}

.validator-content {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

#card-original img {
  width: 100%;
  border-radius: var(--radius-sm);
  max-height: 150px;
  object-fit: contain;
}

#card-recognized {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

#latex-render {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
```

**State 3 -- Board layout:**

```css
#state-board {
  overflow-y: auto;
  padding: 1.5rem;
  padding-bottom: 5rem;
}

#board-content {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-card {
  position: relative;
}

.step-card .step-equation {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  font-size: 1.25rem;
}

.step-card .step-rule {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-light);
  background: var(--accent-glow);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.step-connector {
  width: 2px;
  height: 20px;
  background: var(--glass-border);
  margin: 0 auto;
}
```

**Buttons:**

```css
.btn-primary {
  padding: 0.875rem 2.5rem;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all var(--transition-speed);
}

.btn-primary:active {
  transform: scale(0.96);
}

.btn-accent {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 4px 20px var(--accent-glow);
}

.btn-accent:active {
  background: var(--accent-light);
}

.fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: auto;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--accent);
  box-shadow: 0 4px 20px var(--accent-glow);
  cursor: pointer;
  z-index: 20;
  transition: all var(--transition-speed);
}
```

**Interactive zone (drag-and-drop):**

```css
.interactive-card {
  padding: 1.5rem;
}

.equation-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.equation-side {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 60px;
  min-width: 80px;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 2px dashed transparent;
  transition: all 0.2s;
}

.equation-side.drop-active {
  background: var(--accent-glow);
  border-color: var(--accent);
}

.draggable-term {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  cursor: grab;
  touch-action: none;          /* CRITICAL for mobile drag */
  user-select: none;
  -webkit-user-select: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  will-change: transform;      /* GPU-accelerated drag */
  font-size: 1.2rem;
}

.draggable-term:active,
.draggable-term.dragging {
  cursor: grabbing;
  box-shadow: 0 4px 20px var(--accent-glow);
  border-color: var(--accent);
  z-index: 100;
}

.equals-sign {
  font-size: 2rem;
  color: var(--text-secondary);
  padding: 0 12px;
  display: flex;
  align-items: center;
  user-select: none;
}
```

**Loading spinner:**

```css
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--glass-border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Warning banner:**

```css
.warning-banner {
  background: rgba(255, 217, 61, 0.1);
  border: 1px solid rgba(255, 217, 61, 0.3);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--warning);
}
```

**Responsive (tablet/desktop constraint):**

```css
@media (min-width: 768px) {
  .validator-content,
  #board-content {
    max-width: 600px;
  }
}
```

### 2.3 manifest.json

```json
{
  "name": "CrackTheX - Egyenletmegoldo",
  "short_name": "CrackTheX",
  "description": "Interaktiv matematikai egyenletmegoldo",
  "start_url": "/index.html",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0a0e27",
  "background_color": "#0a0e27",
  "icons": [
    {
      "src": "assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2.4 sw.js (Service Worker)

```javascript
const CACHE_NAME = 'crackthex-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/camera.js',
  '/js/validator.js',
  '/js/solver.js',
  '/js/interactive-board.js',
  '/js/utils.js',
  // CDN assets
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
  'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/nerdamer.core.js',
  'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Algebra.js',
  'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Calculus.js',
  'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Solve.js',
  'https://cdnjs.cloudflare.com/ajax/libs/interact.js/1.10.27/interact.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js'
];

// Install: precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for shell, network-only for Mathpix API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for all API/OCR calls (both direct Mathpix and backend proxy)
  if (url.hostname === 'api.mathpix.com' || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

---

## 3. Phase 2: State Machine + Transitions

### js/app.js

The central orchestrator. Owns state enum, transitions, module initialization, and Hungarian UI strings.

```javascript
// ========== HUNGARIAN UI STRINGS ==========
const STRINGS = {
  takePhoto: 'Fotozas',
  selectionDone: 'Kijeloles Kesz',
  solve: 'Megoldas!',
  newProblem: 'Uj feladat',
  recognizing: 'Felismeres...',
  original: 'Eredeti',
  recognized: 'Felismert keplet',
  lowConfidence: 'Alacsony felismeresi biztonsag - ellenorizd a kepletet!',
  startingEquation: 'Kiindulo egyenlet',
  expandParens: 'Zarojelek felbontasa',
  subtractBothSides: 'Kivonas mindket oldalbol',
  addBothSides: 'Hozzaadas mindket oldalhoz',
  simplify: 'Egyszerusites',
  divideBothSides: 'Osztas mindket oldalon',
  multiplyBothSides: 'Szorzas mindket oldalon',
  solution: 'Megoldas',
  directSolution: 'Kozvetlen megoldas',
  noSolution: 'Nincs megoldas',
  errorParsing: 'Nem sikerult ertelmezni az egyenletet. Probald egyszerubb formaban!',
  cameraError: 'Kamera nem elerheto. Hasznald a fajlfeltoltest!',
  apiError: 'Hiba a kepletfelismeresnel. Probald ujra vagy ird be kezzel!',
  offline: 'Nincs internetkapcsolat. A felismeres nem elerheto.'
};

// ========== STATE MACHINE ==========
const AppState = {
  SCANNER: 'state-scanner',
  VALIDATOR: 'state-validator',
  BOARD: 'state-board'
};

let currentState = null;

function goToState(newState, data = {}) {
  const oldEl = currentState ? document.getElementById(currentState) : null;
  const newEl = document.getElementById(newState);

  const tl = gsap.timeline();

  if (oldEl) {
    tl.to(oldEl, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        oldEl.classList.remove('active');
        // Cleanup old state
        if (currentState === AppState.SCANNER) Camera.cleanup();
        if (currentState === AppState.VALIDATOR) Validator.cleanup();
        if (currentState === AppState.BOARD) InteractiveBoard.cleanup();
      }
    });
  }

  tl.call(() => {
    newEl.classList.add('active');
    gsap.set(newEl, { opacity: 0, y: 20 });

    // Init new state
    if (newState === AppState.SCANNER) Camera.init();
    if (newState === AppState.VALIDATOR) Validator.init(data);
    if (newState === AppState.BOARD) InteractiveBoard.init(data);
  });

  tl.to(newEl, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    ease: 'power2.out'
  });

  currentState = newState;
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }

  // Wire global buttons
  document.getElementById('btn-new').addEventListener('click', () => {
    goToState(AppState.SCANNER);
  });

  // Start
  goToState(AppState.SCANNER);
});
```

**Data flow between states:**
- Scanner -> Validator: `{ croppedImageDataURL: string }`
- Validator -> Board: `{ latex: string, croppedImageDataURL: string }`
- Board -> Scanner: `{}` (reset)

---

## 4. Phase 3: Camera + Cropping

### js/camera.js

Manages State 1: camera access -> capture frame -> crop -> hand off to State 2.

```javascript
const Camera = {
  stream: null,
  cropper: null,
  phase: 'camera', // 'camera' | 'cropping'

  async init() {
    this.phase = 'camera';
    const video = document.getElementById('camera-feed');
    const img = document.getElementById('captured-image');
    const btn = document.getElementById('btn-capture');

    video.style.display = 'block';
    img.style.display = 'none';
    btn.textContent = STRINGS.takePhoto;

    btn.onclick = () => this.handleButtonClick();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // 'ideal' not 'exact' -- desktop fallback
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      video.srcObject = this.stream;
      await video.play();
    } catch (err) {
      console.warn('Camera not available:', err);
      this.showFileUploadFallback();
    }
  },

  showFileUploadFallback() {
    const video = document.getElementById('camera-feed');
    const fileInput = document.getElementById('file-input');
    const btn = document.getElementById('btn-capture');

    video.style.display = 'none';
    btn.textContent = 'Kep kivalasztasa';
    btn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.showCropper(ev.target.result);
      };
      reader.readAsDataURL(file);
    };
  },

  handleButtonClick() {
    if (this.phase === 'camera') {
      this.captureFrame();
    } else {
      this.finishCrop();
    }
  },

  captureFrame() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('capture-canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL('image/jpeg', 0.85);

    // Flash effect
    gsap.fromTo('#state-scanner',
      { backgroundColor: 'rgba(255,255,255,0.3)' },
      { backgroundColor: 'transparent', duration: 0.3 }
    );

    // Stop camera
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
    video.style.display = 'none';

    this.showCropper(dataURL);
  },

  showCropper(dataURL) {
    const img = document.getElementById('captured-image');
    const btn = document.getElementById('btn-capture');

    img.src = dataURL;
    img.style.display = 'block';

    // Wait for image to load before init Cropper
    img.onload = () => {
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
    };

    this.phase = 'cropping';
    btn.textContent = STRINGS.selectionDone;
    btn.onclick = () => this.handleButtonClick();
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
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    this.phase = 'camera';
  }
};
```

**Key notes:**
- `facingMode: { ideal: 'environment' }` -- uses `ideal` not `exact` so desktop without rear camera doesn't throw
- File upload fallback when camera denied or unavailable
- Cropper.js on `<img>` element (v1 requirement)
- No `aspectRatio` set -- equations can be any shape

---

## 5. Phase 4: OCR + Validation

### js/validator.js

Manages State 2: display cropped image, call Mathpix API, render LaTeX, allow editing.

```javascript
const Validator = {
  currentCroppedImage: null,
  debounceTimer: null,

  // API calls go through API.ocr() -- see js/api.js
  // No keys here. Swap backend endpoint without touching this file.

  init(data) {
    this.currentCroppedImage = data.croppedImageDataURL;

    // Show cropped preview
    const preview = document.getElementById('cropped-preview');
    preview.src = data.croppedImageDataURL;

    // Entrance animation
    gsap.from('#state-validator .glass-card', {
      y: 50, opacity: 0, duration: 0.5, stagger: 0.2, ease: 'power2.out'
    });

    // Wire events
    const input = document.getElementById('latex-input');
    input.value = '';
    input.addEventListener('input', (e) => this.onLatexInput(e));

    document.getElementById('btn-solve').onclick = () => this.solve();
    document.getElementById('ocr-warning').style.display = 'none';

    // Call OCR
    this.recognizeEquation(data.croppedImageDataURL);
  },

  async recognizeEquation(base64DataURL) {
    const loading = document.getElementById('validator-loading');
    const btnSolve = document.getElementById('btn-solve');
    loading.style.display = 'flex';
    btnSolve.style.display = 'none';

    // Check connectivity
    if (!navigator.onLine) {
      loading.style.display = 'none';
      btnSolve.style.display = 'block';
      document.getElementById('latex-input').placeholder = STRINGS.offline;
      return;
    }

    try {
      // All API calls go through the API abstraction layer (js/api.js)
      // Swap from direct Mathpix to backend proxy by editing api.js only
      const result = await API.ocr(base64DataURL);
      const latex = this.extractLatex(result);
      const confidence = result.confidence || result.confidence_rate || 0;

      // Fill input
      const input = document.getElementById('latex-input');
      input.value = latex;

      // Render with KaTeX
      this.renderLatex(latex);

      // Show low confidence warning
      if (confidence < 0.8 && confidence > 0) {
        document.getElementById('ocr-warning').style.display = 'block';
      }
    } catch (err) {
      console.error('Mathpix API error:', err);
      document.getElementById('latex-input').placeholder = STRINGS.apiError;
    } finally {
      loading.style.display = 'none';
      btnSolve.style.display = 'block';
    }
  },

  extractLatex(mathpixResponse) {
    let latex = mathpixResponse.latex_simplified
             || mathpixResponse.text
             || '';
    // Strip $ delimiters
    latex = latex.replace(/^\$+|\$+$/g, '').trim();
    return latex;
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
    this.currentCroppedImage = null;
    clearTimeout(this.debounceTimer);
    document.getElementById('latex-render').innerHTML = '';
    document.getElementById('latex-input').value = '';
  }
};
```

**Key notes:**
- Mathpix response wraps LaTeX in `$...$` delimiters -- strip them before KaTeX/nerdamer
- Input debounced at 200ms for live re-rendering
- Low confidence (< 0.8) triggers warning banner
- Offline check before API call

---

## 5b. API Abstraction Layer

### js/api.js

This is the single file that all network calls go through. **Never call external APIs directly from other modules.** Swapping from client-side Mathpix keys to a backend proxy = editing this one file only.

```javascript
const API = {

  // ====================================================
  // MVP MODE: direct Mathpix call with client-side keys
  // PRODUCTION MODE: change ENDPOINT to your backend URL
  //   and remove APP_ID / APP_KEY entirely
  // ====================================================

  // Replace with real keys from https://mathpix.com
  MATHPIX_APP_ID:  'YOUR_APP_ID',
  MATHPIX_APP_KEY: 'YOUR_APP_KEY',

  // Toggle between 'direct' (MVP) and 'proxy' (production)
  MODE: 'direct',

  // Backend base URL (used in proxy mode)
  BACKEND_URL: 'https://your-backend.com',

  /**
   * Send a cropped image for math OCR.
   * Returns: { latex_simplified, confidence, text }
   *
   * MVP:        calls api.mathpix.com directly (keys in client)
   * Production: calls /api/ocr on your backend (keys server-side)
   */
  async ocr(base64DataURL) {
    if (this.MODE === 'proxy') {
      const res = await fetch(this.BACKEND_URL + '/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: base64DataURL })
      });
      if (!res.ok) throw new Error('OCR proxy error: ' + res.status);
      return res.json();
    }

    // Direct mode (MVP)
    const res = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_id':  this.MATHPIX_APP_ID,
        'app_key': this.MATHPIX_APP_KEY
      },
      body: JSON.stringify({
        src: base64DataURL,
        math_inline_delimiters: ['$', '$'],
        rm_spaces: true,
        formats: ['latex_simplified']
      })
    });
    if (!res.ok) throw new Error('Mathpix API error: ' + res.status);
    return res.json();
  },

  /**
   * Save a solved equation to history (future backend feature).
   * No-op in MVP -- wire up when backend exists.
   */
  async saveEquation(latex, steps) {
    if (this.MODE !== 'proxy') return; // backend not ready yet
    await fetch(this.BACKEND_URL + '/api/equations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex, steps, solvedAt: new Date().toISOString() })
    });
  },

  /**
   * Fetch equation history (future backend feature).
   */
  async getHistory() {
    if (this.MODE !== 'proxy') return [];
    const res = await fetch(this.BACKEND_URL + '/api/equations');
    return res.json();
  }
};
```

**Switching to backend (when ready):**
1. Set `API.MODE = 'proxy'`
2. Set `API.BACKEND_URL` to your server URL
3. Remove `MATHPIX_APP_ID` and `MATHPIX_APP_KEY`
4. Your backend `POST /api/ocr` receives `{ src }` and calls Mathpix server-side

**Backend extension points already stubbed:** `saveEquation()` and `getHistory()` are no-ops in MVP but the calling convention is defined. When you add a backend, just flip `MODE` and implement the endpoints.

---

## 6. Phase 5: Step-by-Step Solver Engine

This is the most complex phase. Nerdamer does NOT provide step-by-step solutions. We build a custom step generator.

### js/utils.js -- LaTeX/Algebra Utilities

```javascript
const MathUtils = {

  /**
   * Convert LaTeX (from Mathpix OCR) to nerdamer-compatible format.
   * Handles common patterns for linear/quadratic equations.
   */
  latexToNerdamer(latex) {
    let expr = latex;

    // Remove display math delimiters
    expr = expr.replace(/\\left|\\right/g, '');

    // Convert fractions: \frac{a}{b} -> (a)/(b)
    // Handle nested fractions by running multiple passes
    for (let i = 0; i < 3; i++) {
      expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    }

    // Convert sqrt: \sqrt[n]{x} -> (x)^(1/n), \sqrt{x} -> sqrt(x)
    expr = expr.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '($2)^(1/$1)');
    expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');

    // Convert powers: x^{2} -> x^(2)
    expr = expr.replace(/\^{([^}]+)}/g, '^($1)');

    // Convert cdot/times to *
    expr = expr.replace(/\\cdot/g, '*');
    expr = expr.replace(/\\times/g, '*');
    expr = expr.replace(/\\div/g, '/');

    // Remove LaTeX spacing commands
    expr = expr.replace(/\\[,;:!]\s*/g, '');
    expr = expr.replace(/\\quad|\\qquad/g, '');

    // Remove remaining backslash commands (but not the content)
    expr = expr.replace(/\\(?:text|mathrm|mathit)\{([^}]+)\}/g, '$1');

    // Add implicit multiplication: 2x -> 2*x, )(  -> )*(, x( -> x*(
    expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    expr = expr.replace(/\)\(/g, ')*(');
    expr = expr.replace(/([a-zA-Z])\(/g, '$1*(');
    expr = expr.replace(/\)([a-zA-Z0-9])/g, ')*$1');

    // Clean up whitespace
    expr = expr.replace(/\s+/g, '');

    return expr;
  },

  /**
   * Convert nerdamer expression to display LaTeX.
   */
  nerdamerToLatex(nerdamerExpr) {
    try {
      return nerdamerExpr.toTeX();
    } catch {
      return nerdamerExpr.text();
    }
  },

  /**
   * Parse an equation side string into individual terms.
   * Input: "2*x+3-5*y" -> [{sign:'+', raw:'2*x', latex:'2x'}, ...]
   */
  parseTerms(exprStr) {
    const terms = [];
    // Normalize
    let str = exprStr.replace(/\s/g, '');

    // Split on + and - while preserving sign
    // Regex matches: optional leading sign, then the term content
    const matches = str.match(/[+-]?[^+-]+/g);
    if (!matches) return terms;

    for (const match of matches) {
      let sign = '+';
      let raw = match.trim();

      if (raw.startsWith('-')) {
        sign = '-';
        raw = raw.substring(1);
      } else if (raw.startsWith('+')) {
        raw = raw.substring(1);
      }

      if (raw === '' || raw === '0') continue;

      // Generate display LaTeX for this term
      let latex;
      try {
        latex = nerdamer(raw).toTeX();
      } catch {
        latex = raw;
      }

      terms.push({ sign, raw, latex });
    }

    return terms;
  },

  /**
   * Reconstruct nerdamer expression from terms array.
   */
  termsToExpr(terms) {
    if (terms.length === 0) return '0';
    return terms.map((t, i) => {
      const prefix = t.sign === '-' ? '-' : (i > 0 ? '+' : '');
      return prefix + t.raw;
    }).join('');
  },

  /**
   * Detect the variable to solve for (first alphabetic variable found).
   */
  detectVariable(equationStr) {
    const match = equationStr.match(/[a-zA-Z]/);
    return match ? match[0] : 'x';
  }
};
```

### js/solver.js -- Step-by-Step Engine

```javascript
const Solver = {

  /**
   * Main entry point. Takes LaTeX equation string, returns array of steps.
   * Each step: { latex: string, rule: string, lhs: string, rhs: string }
   */
  solve(latexInput) {
    try {
      return this.solveStepByStep(latexInput);
    } catch (err) {
      console.error('Step-by-step solver failed:', err);
      return this.fallbackSolve(latexInput);
    }
  },

  solveStepByStep(latexInput) {
    const nerdamerStr = MathUtils.latexToNerdamer(latexInput);
    const parts = nerdamerStr.split('=');

    if (parts.length !== 2) {
      throw new Error('Not a valid equation (no = sign or multiple = signs)');
    }

    let lhsStr = parts[0].trim();
    let rhsStr = parts[1].trim();
    const variable = MathUtils.detectVariable(nerdamerStr);

    const steps = [];

    // Step 0: Starting equation
    let lhs = nerdamer(lhsStr);
    let rhs = nerdamer(rhsStr);
    steps.push({
      latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
      rule: STRINGS.startingEquation,
      lhs: lhs.text(),
      rhs: rhs.text()
    });

    // Step 1: Expand both sides
    const lhsExpanded = nerdamer('expand(' + lhs.text() + ')');
    const rhsExpanded = nerdamer('expand(' + rhs.text() + ')');
    if (lhsExpanded.text() !== lhs.text() || rhsExpanded.text() !== rhs.text()) {
      lhs = lhsExpanded;
      rhs = rhsExpanded;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: STRINGS.expandParens,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Step 2: Move variable terms to LHS, constants to RHS
    const lhsTerms = MathUtils.parseTerms(lhs.text());
    const rhsTerms = MathUtils.parseTerms(rhs.text());

    // Find constant terms on LHS (move to RHS)
    const lhsConstants = lhsTerms.filter(t => !t.raw.includes(variable));
    // Find variable terms on RHS (move to LHS)
    const rhsVariables = rhsTerms.filter(t => t.raw.includes(variable));

    // Move constants from LHS to RHS
    for (const term of lhsConstants) {
      const op = term.sign === '+' ? '-' : '+';
      const opStr = op + term.raw;
      lhs = nerdamer('expand(' + lhs.text() + opStr + ')');
      rhs = nerdamer('expand(' + rhs.text() + opStr + ')');

      const ruleLabel = op === '-' ? STRINGS.subtractBothSides : STRINGS.addBothSides;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: ruleLabel + ': ' + term.raw,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Move variable terms from RHS to LHS
    for (const term of rhsVariables) {
      const op = term.sign === '+' ? '-' : '+';
      const opStr = op + term.raw;
      lhs = nerdamer('expand(' + lhs.text() + opStr + ')');
      rhs = nerdamer('expand(' + rhs.text() + opStr + ')');

      const ruleLabel = op === '-' ? STRINGS.subtractBothSides : STRINGS.addBothSides;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: ruleLabel + ': ' + term.raw,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Step 3: Simplify
    const lhsSimp = nerdamer('simplify(' + lhs.text() + ')');
    const rhsSimp = nerdamer('simplify(' + rhs.text() + ')');
    if (lhsSimp.text() !== lhs.text() || rhsSimp.text() !== rhs.text()) {
      lhs = lhsSimp;
      rhs = rhsSimp;
      steps.push({
        latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
        rule: STRINGS.simplify,
        lhs: lhs.text(),
        rhs: rhs.text()
      });
    }

    // Step 4: Divide by coefficient of variable
    // Extract coefficient: if LHS is like "3*x", coefficient is 3
    const lhsText = lhs.text();
    const coeffMatch = lhsText.match(new RegExp('(-?\\d+(?:\\.\\d+)?)\\*?' + variable));
    if (coeffMatch) {
      const coeff = parseFloat(coeffMatch[1]);
      if (coeff !== 1 && coeff !== 0) {
        lhs = nerdamer('(' + lhs.text() + ')/(' + coeff + ')');
        rhs = nerdamer('(' + rhs.text() + ')/(' + coeff + ')');
        lhs = nerdamer('simplify(' + lhs.text() + ')');
        rhs = nerdamer('simplify(' + rhs.text() + ')');
        steps.push({
          latex: MathUtils.nerdamerToLatex(lhs) + ' = ' + MathUtils.nerdamerToLatex(rhs),
          rule: STRINGS.divideBothSides + ': ' + coeff,
          lhs: lhs.text(),
          rhs: rhs.text()
        });
      }
    }

    // Step 5: Verify with nerdamer.solve()
    try {
      const verification = nerdamer.solve(nerdamerStr, variable);
      const lastStep = steps[steps.length - 1];
      // Add solution label
      steps.push({
        latex: variable + ' = ' + MathUtils.nerdamerToLatex(nerdamer(verification.toString())),
        rule: STRINGS.solution,
        lhs: variable,
        rhs: verification.toString(),
        isFinal: true
      });
    } catch {
      // Verification failed, last step is the best we have
      if (steps.length > 0) {
        steps[steps.length - 1].isFinal = true;
      }
    }

    return steps;
  },

  /**
   * Fallback: just show original and final answer.
   */
  fallbackSolve(latexInput) {
    const steps = [];
    const nerdamerStr = MathUtils.latexToNerdamer(latexInput);
    const variable = MathUtils.detectVariable(nerdamerStr);

    steps.push({
      latex: latexInput,
      rule: STRINGS.startingEquation,
      lhs: '',
      rhs: ''
    });

    try {
      const solution = nerdamer.solve(nerdamerStr, variable);
      steps.push({
        latex: variable + ' = ' + MathUtils.nerdamerToLatex(nerdamer(solution.toString())),
        rule: STRINGS.directSolution,
        lhs: variable,
        rhs: solution.toString(),
        isFinal: true
      });
    } catch {
      steps.push({
        latex: STRINGS.noSolution,
        rule: STRINGS.errorParsing,
        lhs: '',
        rhs: '',
        isFinal: true
      });
    }

    return steps;
  }
};
```

**MVP scope:** Linear equations (`ax + b = cx + d`), simple quadratics. More complex types fall back to direct `nerdamer.solve()`.

---

## 7. Phase 6: Interactive Board + Drag-and-Drop

### js/interactive-board.js

The signature feature. Renders step-by-step solution and makes the last step interactive.

```javascript
const InteractiveBoard = {
  currentEquation: null, // { lhs: nerdamerExpr, rhs: nerdamerExpr }
  steps: [],

  init(data) {
    const stepsContainer = document.getElementById('steps-container');
    const interactiveZone = document.getElementById('interactive-zone');
    stepsContainer.innerHTML = '';
    interactiveZone.innerHTML = '';

    // Solve the equation
    this.steps = Solver.solve(data.latex);

    if (this.steps.length === 0) {
      stepsContainer.innerHTML = '<p style="color:var(--text-secondary);text-align:center;">'
        + STRINGS.errorParsing + '</p>';
      return;
    }

    // Render step cards
    this.steps.forEach((step, index) => {
      const card = this.createStepCard(step, index);
      stepsContainer.appendChild(card);

      // Add connector line between cards (except after last)
      if (index < this.steps.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'step-connector';
        stepsContainer.appendChild(connector);
      }
    });

    // Stagger entrance animation
    gsap.from('.step-card', {
      y: 30,
      opacity: 0,
      duration: 0.4,
      stagger: 0.15,
      ease: 'power2.out'
    });

    // Make the last non-final step interactive
    const lastStep = this.steps[this.steps.length - 1];
    if (!lastStep.isFinal && lastStep.lhs && lastStep.rhs) {
      this.setupInteractiveZone(lastStep);
    } else if (this.steps.length >= 2) {
      // Use the step before the final answer for interaction
      const preLastStep = this.steps[this.steps.length - 2];
      if (preLastStep.lhs && preLastStep.rhs) {
        this.setupInteractiveZone(preLastStep);
      }
    }

    // FAB animation
    gsap.to('#btn-new', {
      y: -5, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1
    });
  },

  createStepCard(step, index) {
    const card = document.createElement('div');
    card.className = 'glass-card step-card';
    card.dataset.step = index;

    // Rule badge
    const rule = document.createElement('span');
    rule.className = 'step-rule';
    rule.textContent = step.rule;
    card.appendChild(rule);

    // Equation
    const eqDiv = document.createElement('div');
    eqDiv.className = 'step-equation';
    eqDiv.id = 'step-eq-' + index;

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

    // Final step highlight
    if (step.isFinal) {
      card.style.borderColor = 'var(--success)';
      card.style.boxShadow = '0 4px 20px var(--success-glow)';
    }

    return card;
  },

  // ====== INTERACTIVE DRAG-AND-DROP ZONE ======

  setupInteractiveZone(step) {
    const zone = document.getElementById('interactive-zone');
    zone.innerHTML = '';

    // Parse terms
    const lhsTerms = MathUtils.parseTerms(step.lhs);
    const rhsTerms = MathUtils.parseTerms(step.rhs);

    // Store current equation state
    this.currentEquation = {
      lhs: step.lhs,
      rhs: step.rhs,
      lhsTerms,
      rhsTerms
    };

    // Build interactive equation layout
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

    // Create draggable terms for LHS
    lhsTerms.forEach((term, i) => {
      lhsZone.appendChild(this.createTermElement(term, 'lhs', i));
    });

    // Create draggable terms for RHS
    rhsTerms.forEach((term, i) => {
      rhsZone.appendChild(this.createTermElement(term, 'rhs', i));
    });

    row.appendChild(lhsZone);
    row.appendChild(equalsSign);
    row.appendChild(rhsZone);
    zone.appendChild(row);

    // Add instruction hint
    const hint = document.createElement('p');
    hint.className = 'drag-hint';
    hint.textContent = 'Huzd at a tagokat az egyenlojegjel masik oldalara!';
    hint.style.cssText = 'text-align:center;color:var(--text-muted);font-size:0.75rem;margin-top:1rem;';
    zone.appendChild(hint);

    // Initialize interact.js
    this.initDragAndDrop();
  },

  createTermElement(term, side, index) {
    const el = document.createElement('div');
    el.className = 'draggable-term';
    el.dataset.side = side;
    el.dataset.index = index;
    el.dataset.sign = term.sign;
    el.dataset.value = term.raw;

    // Display with sign
    const displayLatex = (term.sign === '-' ? '-' : (index > 0 ? '+' : '')) + term.latex;

    try {
      katex.render(displayLatex, el, { throwOnError: false });
    } catch {
      el.textContent = displayLatex;
    }

    return el;
  },

  initDragAndDrop() {
    // Make terms draggable
    interact('.draggable-term').draggable({
      inertia: true,
      autoScroll: true,
      listeners: {
        start: (event) => {
          gsap.to(event.target, { scale: 1.15, duration: 0.2 });
          event.target.classList.add('dragging');
        },
        move: (event) => {
          const target = event.target;
          const x = (parseFloat(target.dataset.x) || 0) + event.dx;
          const y = (parseFloat(target.dataset.y) || 0) + event.dy;
          target.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(1.15)';
          target.dataset.x = x;
          target.dataset.y = y;
        },
        end: (event) => {
          const target = event.target;
          if (!target.classList.contains('dropped')) {
            gsap.to(target, {
              x: 0, y: 0, scale: 1,
              duration: 0.4,
              ease: 'back.out(1.7)',
              onComplete: () => {
                target.style.transform = '';
                target.dataset.x = 0;
                target.dataset.y = 0;
              }
            });
          }
          target.classList.remove('dragging');
        }
      }
    });

    // Make equation sides dropzones
    interact('.drop-zone').dropzone({
      accept: '.draggable-term',
      overlap: 0.3,

      ondragenter: (event) => {
        const dragSide = event.relatedTarget.dataset.side;
        const dropSide = event.target.dataset.side;
        if (dragSide !== dropSide) {
          event.target.classList.add('drop-active');
        }
      },

      ondragleave: (event) => {
        event.target.classList.remove('drop-active');
      },

      ondrop: (event) => {
        const dragSide = event.relatedTarget.dataset.side;
        const dropSide = event.target.dataset.side;
        event.target.classList.remove('drop-active');

        if (dragSide !== dropSide) {
          event.relatedTarget.classList.add('dropped');
          this.handleTermMove(event.relatedTarget, dragSide, dropSide);
        }
      }
    });
  },

  handleTermMove(termElement, fromSide, toSide) {
    const termValue = termElement.dataset.value;
    const termSign = termElement.dataset.sign;
    const flippedSign = termSign === '+' ? '-' : '+';

    // GSAP fly-across animation
    const equalsEl = document.querySelector('.equals-sign');
    const equalsRect = equalsEl.getBoundingClientRect();
    const termRect = termElement.getBoundingClientRect();

    const tl = gsap.timeline();

    // Fly to the other side
    const flyX = toSide === 'rhs'
      ? equalsRect.right - termRect.left + 60
      : equalsRect.left - termRect.right - 60;

    tl.to(termElement, {
      x: flyX,
      duration: 0.5,
      ease: 'power2.inOut'
    });

    // Pop + color flash for sign change
    tl.to(termElement, {
      scale: 1.3,
      duration: 0.15,
      onStart: () => {
        termElement.style.color = flippedSign === '-'
          ? 'var(--danger)' : 'var(--success)';
      }
    });

    tl.to(termElement, { scale: 1, duration: 0.15 });

    // After animation: rebuild equation
    tl.call(() => {
      // Apply operation to both sides
      const opStr = (flippedSign === '-' ? '-' : '+') + termValue;
      let newLhs, newRhs;

      try {
        newLhs = nerdamer('expand(' + this.currentEquation.lhs + opStr + ')');
        newRhs = nerdamer('expand(' + this.currentEquation.rhs + opStr + ')');
      } catch (err) {
        console.error('Failed to apply operation:', err);
        return;
      }

      // Determine rule label
      const ruleLabel = flippedSign === '-'
        ? STRINGS.subtractBothSides
        : STRINGS.addBothSides;

      // Create new step
      const newStep = {
        latex: MathUtils.nerdamerToLatex(newLhs) + ' = ' + MathUtils.nerdamerToLatex(newRhs),
        rule: ruleLabel + ': ' + termValue,
        lhs: newLhs.text(),
        rhs: newRhs.text()
      };

      // Append step card with animation
      const stepsContainer = document.getElementById('steps-container');
      const connector = document.createElement('div');
      connector.className = 'step-connector';
      stepsContainer.appendChild(connector);

      const card = this.createStepCard(newStep, this.steps.length);
      stepsContainer.appendChild(card);
      this.steps.push(newStep);

      gsap.from(card, {
        y: 40, opacity: 0, duration: 0.5, ease: 'back.out(1.7)'
      });

      // Re-render interactive zone with updated equation
      this.setupInteractiveZone(newStep);

      // Scroll new step into view
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  },

  cleanup() {
    // Destroy interact.js instances
    try {
      interact('.draggable-term').unset();
      interact('.drop-zone').unset();
    } catch { /* may not exist */ }

    this.currentEquation = null;
    this.steps = [];
    document.getElementById('steps-container').innerHTML = '';
    document.getElementById('interactive-zone').innerHTML = '';
  }
};
```

**Critical CSS note:** `touch-action: none` on `.draggable-term` is essential. Without it, mobile browsers interpret touch-drag as page scrolling and steal the event from interact.js.

---

## 8. Phase 7: Animation Polish

No new files. GSAP calls integrated throughout existing modules.

### Animation inventory

| Location | Animation | GSAP Call |
|----------|-----------|-----------|
| `app.js: goToState()` | Old state fades out + slides up, new state fades in + slides down | `gsap.to` with opacity/y |
| `camera.js: captureFrame()` | White flash on photo capture | `gsap.fromTo` backgroundColor |
| `validator.js: init()` | Glass cards stagger entrance from below | `gsap.from` with stagger: 0.2 |
| `interactive-board.js: init()` | Step cards stagger in | `gsap.from` with stagger: 0.15 |
| `interactive-board.js: handleTermMove()` | Term flies across equals sign, pops + color flash | `gsap.timeline` with x/scale/color |
| `interactive-board.js: handleTermMove()` | New step card slides in with bounce | `gsap.from` with `back.out(1.7)` |
| `interactive-board.js: init()` | FAB subtle floating | `gsap.to` with yoyo: true, repeat: -1 |
| Drag start | Scale up to 1.15, glow ring appears | `gsap.to` scale + boxShadow |
| Drag end (no drop) | Snap back with overshoot | `gsap.to` with `back.out(1.7)` |
| Drop zone enter | Zone pulses / glows | `gsap.to` borderColor + boxShadow |
| Sign flip | Pop scale + color burst | `gsap.to` scale 1.4 then back, color change |

### Gen Z micro-interactions (GSAP additions)

These go into each module on top of the base animations:

```javascript
// 1. Button press ripple effect (add to all .btn-primary clicks)
function rippleEffect(btn, e) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `
    position:absolute; border-radius:50%;
    width:${size}px; height:${size}px;
    left:${e.clientX - rect.left - size/2}px;
    top:${e.clientY - rect.top - size/2}px;
    background: rgba(255,255,255,0.2);
    pointer-events:none; transform:scale(0);
  `;
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(ripple);
  gsap.to(ripple, {
    scale: 2.5, opacity: 0, duration: 0.5, ease: 'power2.out',
    onComplete: () => ripple.remove()
  });
}

// 2. Equals sign pulse when a valid drag enters hover zone
function pulseEqualsSign() {
  gsap.to('.equals-sign', {
    scale: 1.3,
    textShadow: '0 0 20px var(--accent-cyan)',
    duration: 0.2,
    yoyo: true,
    repeat: 1
  });
}

// 3. Step card number badge count-up (purely visual delight)
// Each card gets a badge like "01", "02" -- animate from 00 to the number
function animateStepBadge(badgeEl, targetNum) {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: targetNum, duration: 0.4, ease: 'power2.out',
    onUpdate: () => {
      badgeEl.textContent = String(Math.round(obj.val)).padStart(2, '0');
    }
  });
}

// 4. App name logo on first load (scanner state entrance)
// "CrackTheX" letters stagger in with slight vertical bounce
function animateAppLogo() {
  const logo = document.getElementById('app-logo');
  if (!logo) return;
  const chars = logo.textContent.split('').map(c => `<span>${c}</span>`).join('');
  logo.innerHTML = chars;
  gsap.from(logo.querySelectorAll('span'), {
    y: -20, opacity: 0, duration: 0.4,
    stagger: 0.04, ease: 'back.out(2)'
  });
}
```

**CSS for ripple button (add to style.css):**

```css
.btn-primary {
  position: relative;
  overflow: hidden;
}
```

### Easing reference

- Entrances: `power2.out` (smooth deceleration)
- Exits: `power2.in` (smooth acceleration)
- Bouncy landings: `back.out(1.7)` (slight overshoot, Gen Z loves this)
- Elastic pop: `back.out(2.5)` (more dramatic, use sparingly -- sign flip)
- Oscillating: `sine.inOut` (for FAB float)
- Quick feedback: 0.12-0.2s duration
- Transitions: 0.3-0.4s duration
- Staggers: 0.1-0.15s between elements

---

## 9. Phase 8: PWA + Testing

### PWA checklist

- [x] `manifest.json` with name, icons, display: standalone
- [x] Service worker with shell caching
- [x] `<meta name="theme-color">` matching bg
- [x] `<meta name="apple-mobile-web-app-capable" content="yes">`
- [x] Viewport meta with `user-scalable=no`
- [ ] Generate icon-192.png and icon-512.png (use any icon generator tool)

### Offline behavior

| Feature | Offline? | Notes |
|---------|----------|-------|
| App shell (HTML/CSS/JS) | Yes | Cached by SW |
| Camera + Cropping | Yes | Client-side APIs |
| Mathpix OCR | No | Requires network; show offline message |
| Manual LaTeX input | Yes | Skip OCR, type directly |
| Solver engine | Yes | nerdamer runs client-side |
| Drag-and-drop | Yes | Fully client-side |

### Test matrix

**Browsers:**
- iOS Safari (primary mobile target)
- Android Chrome (primary mobile target)
- Desktop Chrome
- Desktop Firefox

### Test equations (increasing complexity)

| Equation | Type | Expected |
|----------|------|----------|
| `x + 5 = 10` | Simplest linear | x = 5 |
| `2x - 3 = 7` | Coefficient + constant | x = 5 |
| `3x + 2 = x - 4` | Variables on both sides | x = -3 |
| `2(x + 3) = 10` | Parentheses | x = 2 |
| `\frac{x}{2} + 1 = 5` | Fractions (tests LaTeX conversion) | x = 8 |

### Edge cases to handle

| Scenario | Expected behavior |
|----------|-------------------|
| Camera permission denied | File upload fallback |
| Mathpix returns error | Show manual input prompt |
| Nerdamer can't parse | Error message + "try simpler equation" |
| Equation has no solution | Display "Nincs megoldas" state |
| User drags term back to same side | Snap back, no new step generated |
| Very long equation | Horizontal scroll within glass card |
| Offline + OCR attempt | "Nincs internetkapcsolat" message |
| Empty LaTeX input + Solve click | Button does nothing (guarded) |

### Verification steps (end-to-end)

1. Serve locally: `npx serve .` or `python3 -m http.server 8080`
2. Open on mobile device (same WiFi, use local IP)
3. Full flow: Camera -> Crop -> OCR -> Validate -> Solve -> Drag terms
4. Test file upload fallback: deny camera permission on desktop
5. Test offline: load app, disconnect network, verify solver still works
6. Run Chrome Lighthouse PWA audit
7. Test touch drag-and-drop on real mobile device
8. Test with all 5 reference equations

---

## 10. Technical Decisions + Risks

### Key decisions

| Decision | Why |
|----------|-----|
| Cropper.js v1.6.2, not v2 | v2 is Web Components rewrite; v1 has simpler imperative API for vanilla JS |
| Custom step-by-step solver on nerdamer | No JS library provides step-by-step algebra out of the box |
| Vanilla JS, no framework | App is small; a framework adds complexity without benefit |
| `js/api.js` abstraction from day one | All network calls isolated: swap Mathpix for backend proxy by editing one file |
| Client-side Mathpix key (MVP only) | Acceptable for MVP; change `API.MODE = 'proxy'` and set `BACKEND_URL` for production |
| Hungarian UI strings in single object | Easy i18n extraction later |
| CDN-loaded libs, no build tools | Maximum simplicity for operation and deployment |
| Space Grotesk + JetBrains Mono fonts | Space Grotesk reads modern/young; JetBrains Mono for math LaTeX input is legible and technical |
| Aurora animated background | Signature visual identity; two gradient orbs via CSS only, no JS, no perf cost |
| Electric violet + cyan accent palette | Dominant Gen Z color system (matches Discord, Notion AI, Linear aesthetics) |

### Risk mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| API key in client-side code | Medium | MVP only; document proxy recommendation for production |
| LaTeX -> nerdamer conversion fails | High | Handle common patterns; catch errors + prompt simpler notation; fallback to direct solve |
| Drag-and-drop slow on low-end mobile | Medium | `will-change: transform`, minimal DOM, interact.js GPU inertia |
| Complex equations beyond MVP scope | Low | Graceful fallback to direct `nerdamer.solve()` result |
| Cropper.js touch conflicts on iOS | Low | v1 is well-tested on iOS; ensure image container has proper dimensions |
| Service worker caches stale resources | Low | Version cache name; delete old caches on activate |

---

## Dependency Graph

```
Phase 1 (Skeleton + Theme)
    |
Phase 2 (State Machine)
    |
    +--- Phase 3 (Camera)
    |        |
    |        v
    +--- Phase 4 (OCR + Validation)
    |        |
    |        v
    +--- Phase 5 (Solver Engine)  <-- can be developed in parallel with Phases 3-4
    |        |                        using hardcoded test equations
    |        v
    +--- Phase 6 (Drag & Drop)
             |
             v
Phase 7 (Animation Polish)  <-- layered on top of all phases
    |
Phase 8 (PWA + Testing)
```

**Parallel dev tip:** Phase 5 (solver) can be built and tested independently with hardcoded LaTeX strings, without the camera/OCR pipeline. It's the hardest module and benefits from early development.

---

## Backend Extension Roadmap

When ready to add a backend, these are the steps in order. No frontend refactoring needed -- the `js/api.js` layer absorbs all changes.

### Step 1: OCR proxy (hides API keys)
- Deploy a simple server (Node/Express, Python/FastAPI, or Cloudflare Worker)
- Implement `POST /api/ocr` that proxies to Mathpix
- Set `API.MODE = 'proxy'` and `API.BACKEND_URL` in `js/api.js`
- Remove client-side keys

### Step 2: Equation history
- Add `POST /api/equations` and `GET /api/equations` endpoints
- `API.saveEquation()` and `API.getHistory()` are already stubbed -- just un-no-op them
- Add a history screen (State 4) to the SPA

### Step 3: User accounts
- Add auth endpoints (sign up, login, JWT)
- Add login screen (State 0) before Scanner
- Attach user ID to equation history saves

### Step 4: Sharing
- Add `GET /api/equations/:id` -- shareable link to a solved problem
- State 3 board gets a "Share" button that calls `API.saveEquation()` and copies link

The frontend SPA pattern (3 states + FAB) extends naturally: each new feature is either a new state or a new card type on the board.
