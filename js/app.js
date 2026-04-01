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
  offline: 'Nincs internetkapcsolat. A felismeres nem elerheto.',
  dragHint: 'Huzd at a tagokat az egyenlojegjel masik oldalara!',
  equation: 'Egyenlet',
  inputPlaceholder: 'pl. 2x + 3 = 7',
  back: 'Vissza',
  homeTagline: 'Oldd meg az egyenletet lepesrol lepesre!',
  expandInner: 'Belso zarojel felbontasa',
  expandOuter: 'Zarojel felbontasa',
  simplifyTerms: 'Osszevonas',
  divideFirstHint: 'Mindket oldal oszthato',
  alternativePath: 'Mas ut',
  altExpandDesc: 'A zarojelek felbontasaval is megoldhato',
  altDivideDesc: 'Eloszor osztas mindket oldalon',
  nextStep: 'Kovetkezo lepes',
  showAll: 'Teljes megoldas'
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

  // Initialize SessionManager (replaces direct goToState call)
  SessionManager.init((targetState, targetData) => {
    goToState(targetState, targetData);
  });
});
