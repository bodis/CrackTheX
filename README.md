# CrackTheX

Interactive math equation solver PWA for Hungarian students. Photograph or type an equation, get step-by-step solutions with drag-and-drop interaction.

## Quick Start

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

> **Note**: Opening `index.html` directly as a `file://` URL won't work — service workers and CDN scripts require HTTP.

## Features

- **Keyboard input** — type equations like `2x + 3 = 7`
- **Camera OCR** — photograph handwritten equations (Mathpix API)
- **Step-by-step solver** — gradual expansion, smart strategy selection
- **Drag-and-drop** — move terms across the equals sign (sign flips automatically)
- **Alternative paths** — shows when multiple solving approaches exist
- **Multi-session sidebar** — work on multiple equations with localStorage persistence
- **PWA** — installable, works offline after first load (except OCR)

## Tech Stack

Pure vanilla HTML/CSS/JS — no build tools, no bundlers.

| Library | Version | Purpose |
|---------|---------|---------|
| GSAP | 3.13.0 | Animations & transitions |
| KaTeX | 0.16.9 | Math rendering |
| nerdamer | 1.1.13 | Symbolic equation solving |
| interact.js | 1.10.27 | Drag-and-drop |
| Cropper.js | 1.6.2 | Image cropping (v1 only, v2 incompatible) |

All libraries loaded via CDN.

## Project Structure

```
CrackTheX/
├── index.html              # SPA entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first)
├── package.json            # Dev server script
├── css/
│   └── style.css           # Dark theme, glassmorphism, all layouts
├── js/
│   ├── app.js              # State machine, GSAP transitions, Hungarian strings
│   ├── api.js              # API abstraction (Mathpix direct / backend proxy)
│   ├── camera.js           # Camera + Cropper.js
│   ├── validator.js        # OCR result + LaTeX editor
│   ├── solver.js           # Step-by-step solver engine
│   ├── interactive-board.js # Step cards + drag-and-drop UI
│   ├── sessions.js         # Multi-session sidebar + localStorage
│   └── utils.js            # LaTeX/nerdamer conversion, term parsing
├── assets/icons/           # PWA icons
└── docs/                   # Architecture documentation
```

## Deployment

**GitHub Pages** — auto-deploys on push to `main` via `.github/workflows/deploy.yml`.

Live at: `https://bodis.github.io/CrackTheX/`

All asset paths use `./` (relative), so the app works from any base path.

## Configuration

### Mathpix API (for camera OCR)

Edit `js/api.js`:
```javascript
MATHPIX_APP_ID: 'YOUR_APP_ID'
MATHPIX_APP_KEY: 'YOUR_APP_KEY'
```

For production, change `API.MODE` from `'direct'` to `'proxy'` to route through a backend.

## License

Private project.
