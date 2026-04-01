// ========== VERSION & RELEASE NOTES ==========
const APP_VERSION = '0.2.0';

const RELEASE_NOTES = [
  {
    version: '0.2.0',
    date: '2026-04',
    items: {
      hu: [
        'Színséma váltás: Tábla, Krétatábla, Sötét mód',
        'Összes előzmény törlése gomb',
        'Verziószám megjelenítése az oldalsávban',
        'Változásnapló (kattints a verziószámra)',
        'Törlés gomb jobb láthatósága'
      ],
      en: [
        'Color scheme switching: Whiteboard, Chalkboard, Dark',
        'Clear all history button',
        'Version number display in sidebar',
        'Release notes modal (click version number)',
        'Improved delete button visibility'
      ],
      de: [
        'Farbschema-Wechsel: Whiteboard, Kreidetafel, Dunkel',
        'Alle löschen Schaltfläche',
        'Versionsnummer in der Seitenleiste',
        'Änderungsprotokoll (Versionsnummer anklicken)',
        'Verbesserte Sichtbarkeit der Lösch-Schaltfläche'
      ]
    }
  },
  {
    version: '0.1.0',
    date: '2026-03',
    items: {
      hu: [
        'Lépésenkénti egyenletmegoldás interaktív táblán',
        'Kamera OCR bevitel (Mathpix)',
        'Billentyűzetes egyenlet bevitel',
        'Többszekciós oldalsáv localStorage tárolással',
        'Magyar, angol, német nyelvi támogatás',
        'PWA offline támogatással'
      ],
      en: [
        'Step-by-step equation solving with interactive board',
        'Camera OCR input (Mathpix)',
        'Keyboard equation input',
        'Multi-session sidebar with localStorage',
        'Hungarian, English, German language support',
        'PWA with offline support'
      ],
      de: [
        'Schrittweise Gleichungslösung mit interaktiver Tafel',
        'Kamera-OCR-Eingabe (Mathpix)',
        'Tastatur-Gleichungseingabe',
        'Multi-Session-Seitenleiste mit localStorage',
        'Ungarische, englische, deutsche Sprachunterstützung',
        'PWA mit Offline-Unterstützung'
      ]
    }
  }
];

// ========== THEME MANAGEMENT ==========
const ThemeManager = {
  STORAGE_KEY: 'crackthex_theme',
  DEFAULT_THEME: 'dark',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_THEME;
    this.setTheme(saved, false);

    document.getElementById('theme-select').addEventListener('change', (e) => {
      this.setTheme(e.target.value, true);
    });
  },

  setTheme(theme, animate) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);

    // Update meta theme-color for mobile browser chrome
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const themeColors = { dark: '#080b1a', whiteboard: '#f5f5f7', chalkboard: '#1a2e1a' };
    if (metaTheme) metaTheme.setAttribute('content', themeColors[theme] || themeColors.dark);

    // Update select
    const select = document.getElementById('theme-select');
    if (select) select.value = theme;

    if (animate) {
      document.body.style.transition = 'background 0.4s ease, color 0.3s ease';
      setTimeout(() => { document.body.style.transition = ''; }, 500);
    }
  }
};

// ========== RIPPLE EFFECT ==========
function rippleEffect(btn, e) {
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top  = (e.clientY - rect.top)  + 'px';
  btn.appendChild(ripple);
  gsap.fromTo(ripple,
    { xPercent: -50, yPercent: -50, scale: 0, opacity: 0.5 },
    { xPercent: -50, yPercent: -50, scale: 2.5, opacity: 0, duration: 0.5, ease: 'power2.out',
      onComplete: () => ripple.remove() }
  );
}

// ========== UI STRINGS (populated by I18n) ==========
const STRINGS = {
  takePhoto: 'Fotózás',
  selectionDone: 'Kijelölés kész',
  solve: 'Megoldás!',
  newProblem: 'Új feladat',
  recognizing: 'Felismerés...',
  original: 'Eredeti',
  recognized: 'Felismert képlet',
  lowConfidence: 'Alacsony felismerési biztonság - ellenőrizd a képletet!',
  startingEquation: 'Kiinduló egyenlet',
  expandParens: 'Zárójelek felbontása',
  subtractBothSides: 'Kivonás mindkét oldalból',
  addBothSides: 'Hozzáadás mindkét oldalhoz',
  simplify: 'Egyszerűsítés',
  divideBothSides: 'Osztás mindkét oldalon',
  multiplyBothSides: 'Szorzás mindkét oldalon',
  solution: 'Megoldás',
  directSolution: 'Közvetlen megoldás',
  noSolution: 'Nincs megoldás',
  errorParsing: 'Nem sikerült értelmezni az egyenletet. Próbáld egyszerűbb formában!',
  cameraError: 'Kamera nem elérhető. Használd a fájlfeltöltést!',
  apiError: 'Hiba a képletfelismerésnél. Próbáld újra vagy írd be kézzel!',
  offline: 'Nincs internetkapcsolat. A felismerés nem elérhető.',
  dragHint: 'Húzd át a tagokat az egyenlőjel másik oldalára!',
  equation: 'Egyenlet',
  inputPlaceholder: 'pl. 2x + 3 = 7',
  back: 'Vissza',
  homeTagline: 'Oldd meg az egyenletet lépésről lépésre!',
  expandInner: 'Belső zárójel felbontása',
  expandOuter: 'Zárójel felbontása',
  simplifyTerms: 'Összevonás',
  divideFirstHint: 'Mindkét oldal osztható',
  alternativePath: 'Más út',
  altExpandDesc: 'A zárójelek felbontásával is megoldható',
  altDivideDesc: 'Először osztás mindkét oldalon',
  nextStep: 'Következő lépés',
  showAll: 'Teljes megoldás',
  freeRewrite: 'Átírás',
  rewritePlaceholder: 'pl. 5x - 3 = 12',
  apply: 'Alkalmaz',
  rewriteNeedsEquals: 'Az egyenletnek tartalmaznia kell egy = jelet',
  rewriteInvalid: 'Nem sikerült értelmezni az egyenletet',
  rewriteSolutionMismatch: 'Az átírt egyenlet megoldása nem egyezik az eredetivel!',
  nothingToExpand: 'Nincs mit felbontani',
  nothingToSimplify: 'Nincs mit egyszerűsíteni',
  divisionByZero: 'Nullával nem lehet osztani',
  actionError: 'A művelet nem sikerült',
  // Session & i18n keys
  equations: 'Egyenletek',
  deleted: 'Törölve.',
  undo: 'Visszavonás',
  delete_: 'Törlés',
  statusNew: 'Új',
  statusInProgress: 'Folyamatban',
  statusSolved: 'Megoldva',
  timeJustNow: 'most',
  timeMinutes: 'p.',
  timeHours: 'ó.',
  timeDays: 'nap',
  typeEntry: 'Begépelés',
  typeEntrySubtitle: 'Írd be az egyenletet',
  photoEntry: 'Fotózás',
  photoEntrySubtitle: 'Fotózd le az egyenletet',
  selectImage: 'Kép kiválasztása',
  imageNotAvailable: 'Kép nem elérhető',
  originalImageNA: 'Eredeti (kép nem elérhető)',
  latexPlaceholder: 'LaTeX képlet...',
  clearAll: 'Összes törlése',
  clearAllConfirm: 'Biztosan törlöd?',
  releaseNotes: 'Újdonságok',
  theme: 'Téma',
  themeWhiteboard: 'Tábla',
  themeChalkboard: 'Krétatábla',
  themeDark: 'Sötét'
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

  const stateToCleanup = currentState;

  if (oldEl) {
    tl.to(oldEl, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        oldEl.classList.remove('active');
        // Cleanup old state (use captured value — currentState has already changed)
        if (stateToCleanup === AppState.SCANNER) Camera.cleanup();
        if (stateToCleanup === AppState.VALIDATOR) Validator.cleanup();
        if (stateToCleanup === AppState.BOARD) InteractiveBoard.cleanup();
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
    ease: 'power2.out',
    onComplete: () => {
      // Update active session's appState after transition
      if (SessionManager.activeSessionId) {
        SessionManager.updateSession(SessionManager.activeSessionId, { appState: newState });
      }
    }
  });

  currentState = newState;
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Initialize i18n (must be first — populates STRINGS)
  I18n.init();

  // Initialize theme (must be before DOM renders to avoid flash)
  ThemeManager.init();

  // Version label
  document.getElementById('version-label').textContent = 'v' + APP_VERSION;

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }

  // Ripple: event delegation on #app catches all buttons including dynamic ones
  document.getElementById('app').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-primary, .btn-accent, .fab');
    if (btn) rippleEffect(btn, e);
  });

  // Wire global buttons (captureCurrentState handled inside activateSession)
  document.getElementById('btn-new').addEventListener('click', () => {
    const session = SessionManager.createSession();
    SessionManager.activateSession(session.id);
  });

  // Wire language selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      I18n.setLanguage(btn.dataset.lang);
      SessionManager.renderSessionList();
      SessionManager.updateTopbarEquation();
      // Re-render entire board if we're in board state (step labels need new language)
      if (currentState === AppState.BOARD) {
        const boardData = InteractiveBoard.getState();
        if (boardData) {
          InteractiveBoard.init({ boardData: boardData });
        }
      }
    });
  });

  // Release notes modal
  document.getElementById('version-label').addEventListener('click', () => {
    const modal = document.getElementById('release-notes-modal');
    const body = document.getElementById('release-notes-body');
    const lang = I18n._lang;

    body.innerHTML = '';
    RELEASE_NOTES.forEach(release => {
      const section = document.createElement('div');
      section.className = 'release-version';

      const label = document.createElement('div');
      label.className = 'release-version-label';
      label.innerHTML = 'v' + release.version +
        '<span class="release-version-date">' + release.date + '</span>';
      section.appendChild(label);

      const list = document.createElement('ul');
      list.className = 'release-items';
      const items = release.items[lang] || release.items['hu'];
      items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      section.appendChild(list);
      body.appendChild(section);
    });

    modal.style.display = 'flex';
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(modal.querySelector('.modal-content'),
      { scale: 0.9, y: 20 },
      { scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' }
    );
  });

  document.getElementById('btn-close-release-notes').addEventListener('click', () => {
    const modal = document.getElementById('release-notes-modal');
    gsap.to(modal, {
      opacity: 0, duration: 0.2,
      onComplete: () => { modal.style.display = 'none'; }
    });
  });

  document.getElementById('release-notes-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('btn-close-release-notes').click();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('release-notes-modal');
      if (modal.style.display !== 'none') {
        document.getElementById('btn-close-release-notes').click();
      }
    }
  });

  // Initialize SessionManager (replaces direct goToState call)
  SessionManager.init((targetState, targetData) => {
    goToState(targetState, targetData);
  });
});
