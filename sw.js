const CACHE_NAME = 'crackthex-v2';
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
  '/js/api.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
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
