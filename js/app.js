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
  latexPlaceholder: 'LaTeX képlet...'
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
    });
  });

  // Initialize SessionManager (replaces direct goToState call)
  SessionManager.init((targetState, targetData) => {
    goToState(targetState, targetData);
  });
});
