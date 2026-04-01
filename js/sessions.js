// sessions.js — Multi-session sidebar manager

const SessionManager = {
  sessions: [],
  activeSessionId: null,
  _transitioning: false,
  _undoTimeout: null,
  _pendingDelete: null,
  _pendingDeleteIndex: null,
  _onActivate: null,
  STORAGE_KEY: 'crackthex_sessions',
  ACTIVE_KEY: 'crackthex_active_session',
  SEEN_KEY: 'crackthex_sidebar_seen',

  _getStatusLabels() {
    return {
      'new': STRINGS.statusNew || 'Új',
      'in-progress': STRINGS.statusInProgress || 'Folyamatban',
      'solved': STRINGS.statusSolved || 'Megoldva'
    };
  },

  // ---- Persistence ----

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) { this.sessions = []; return; }
      const parsed = JSON.parse(raw);
      // Validate: keep only entries with required fields
      this.sessions = Array.isArray(parsed)
        ? parsed.filter(s => s && s.id && s.createdAt)
        : [];
    } catch {
      this.sessions = [];
    }
    // Restore active session id
    this.activeSessionId = localStorage.getItem(this.ACTIVE_KEY) || null;
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessions));
      if (this.activeSessionId) {
        localStorage.setItem(this.ACTIVE_KEY, this.activeSessionId);
      }
    } catch (e) {
      console.warn('localStorage full, sessions in-memory only');
    }
  },

  // ---- CRUD ----

  createSession() {
    const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
    const session = {
      id,
      equation: null,
      displayText: '',
      status: 'new',
      appState: 'state-scanner',
      cameraPhase: 'home',
      validatorData: null,
      boardData: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.sessions.unshift(session);
    this.save();
    this.renderSessionList();
    return session;
  },

  getSession(id) {
    return this.sessions.find(s => s.id === id);
  },

  updateSession(id, updates) {
    const session = this.getSession(id);
    if (!session) return;
    Object.assign(session, updates, { updatedAt: Date.now() });
    this.save();
    this.updateSessionCard(id);
    // Update topbar if this is the active session
    if (id === this.activeSessionId) {
      this.updateTopbarEquation();
    }
  },

  deleteSession(id) {
    const index = this.sessions.findIndex(s => s.id === id);
    if (index === -1) return;

    // Clear any previous pending delete — finalize it
    if (this._pendingDelete) {
      clearTimeout(this._undoTimeout);
      this._pendingDelete = null;
      this._pendingDeleteIndex = null;
      this.save();
    }

    const removed = this.sessions.splice(index, 1)[0];
    this._pendingDelete = removed;
    this._pendingDeleteIndex = index;

    // Animate card out
    const card = document.querySelector('[data-session-id="' + id + '"]');
    if (card) {
      gsap.to(card, {
        x: '-100%', opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => card.remove()
      });
    }

    // Show undo toast
    const toast = document.getElementById('undo-toast');
    toast.style.display = 'flex';
    gsap.fromTo(toast, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });

    this._undoTimeout = setTimeout(() => {
      this._pendingDelete = null;
      this._pendingDeleteIndex = null;
      this.save();
      this._hideUndoToast();
    }, 4000);

    // If was active: force-clear transitioning and activate next session
    if (id === this.activeSessionId) {
      this._transitioning = false;
      if (this.sessions.length > 0) {
        const nextIndex = Math.min(index, this.sessions.length - 1);
        this.activateSession(this.sessions[nextIndex].id);
      } else {
        const newSession = this.createSession();
        this.activateSession(newSession.id);
      }
    }
  },

  undoDelete() {
    if (!this._pendingDelete) return;
    clearTimeout(this._undoTimeout);
    const idx = Math.min(this._pendingDeleteIndex, this.sessions.length);
    this.sessions.splice(idx, 0, this._pendingDelete);
    this._pendingDelete = null;
    this._pendingDeleteIndex = null;
    this._hideUndoToast();
    this.save();
    this.renderSessionList();
  },

  clearAllSessions() {
    if (this._clearingAll) return;
    this._clearingAll = true;

    // Cancel any pending undo
    if (this._pendingDelete) {
      clearTimeout(this._undoTimeout);
      this._pendingDelete = null;
      this._pendingDeleteIndex = null;
      this._hideUndoToast();
    }

    // Animate all cards out
    const cards = document.querySelectorAll('.session-card');
    cards.forEach((card, i) => {
      gsap.to(card, {
        x: '-100%', opacity: 0, duration: 0.25, delay: i * 0.03,
        ease: 'power2.in'
      });
    });

    // Clear data and create fresh session after animation
    const totalDelay = 0.3 + cards.length * 0.03;
    gsap.delayedCall(totalDelay, () => {
      this.sessions = [];
      this.activeSessionId = null;
      this._transitioning = false;
      this.save();
      const session = this.createSession();
      this.activateSession(session.id);
      this._clearingAll = false;
    });
  },

  _hideUndoToast() {
    const toast = document.getElementById('undo-toast');
    gsap.to(toast, {
      opacity: 0, y: 10, duration: 0.2,
      onComplete: () => { toast.style.display = 'none'; }
    });
  },

  // ---- Activation ----

  activateSession(id) {
    if (this._transitioning) return;

    // Validate session exists before committing
    const session = this.getSession(id);
    if (!session) return;

    // Save current session state before switching (must happen before _transitioning is set)
    this.captureCurrentState();

    this._transitioning = true;

    this.activeSessionId = id;
    this.save();

    // Update sidebar highlighting
    document.querySelectorAll('.session-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.querySelector('[data-session-id="' + id + '"]');
    if (activeCard) activeCard.classList.add('active');

    // Update mobile topbar
    this.updateTopbarEquation();

    // Determine target state and data
    let targetState = session.appState || 'state-scanner';
    let targetData = {};

    if (targetState === 'state-validator' && session.validatorData) {
      targetData = { validatorData: session.validatorData };
    } else if (targetState === 'state-board' && session.boardData) {
      targetData = { boardData: session.boardData };
    } else {
      // Default to scanner/home
      targetState = 'state-scanner';
    }

    // Call the activation callback (set by app.js)
    if (this._onActivate) {
      this._onActivate(targetState, targetData);
    }

    // On mobile: close drawer after a short delay
    if (window.innerWidth < 768) {
      setTimeout(() => this.closeDrawer(), 200);
    }

    // Clear transitioning flag after animation completes
    gsap.delayedCall(0.8, () => { this._transitioning = false; });
  },

  captureCurrentState() {
    if (!this.activeSessionId || this._transitioning) return;
    const session = this.getSession(this.activeSessionId);
    if (!session) return;

    if (typeof currentState === 'undefined' || !currentState) return;

    if (currentState === AppState.SCANNER) {
      this.updateSession(this.activeSessionId, {
        appState: 'state-scanner',
        cameraPhase: 'home'
      });
    } else if (currentState === AppState.VALIDATOR) {
      this.updateSession(this.activeSessionId, {
        appState: 'state-validator',
        validatorData: Validator.getState()
      });
    } else if (currentState === AppState.BOARD) {
      this.updateSession(this.activeSessionId, {
        appState: 'state-board',
        boardData: InteractiveBoard.getState()
      });
    }
  },

  // ---- UI Rendering ----

  renderSessionList() {
    const list = document.getElementById('session-list');
    list.innerHTML = '';

    this.sessions.forEach(session => {
      list.appendChild(this.createSessionCard(session));
    });

    // Highlight active
    if (this.activeSessionId) {
      const activeCard = document.querySelector('[data-session-id="' + this.activeSessionId + '"]');
      if (activeCard) activeCard.classList.add('active');
    }
  },

  updateSessionCard(id) {
    const card = document.querySelector('[data-session-id="' + id + '"]');
    if (!card) return;
    const session = this.getSession(id);
    if (!session) return;

    // Update equation text
    const eqEl = card.querySelector('.session-equation');
    if (eqEl) eqEl.textContent = session.displayText || STRINGS.newProblem;

    // Update status dot
    const dot = card.querySelector('.session-status-dot');
    if (dot) {
      dot.className = 'session-status-dot status-' + session.status;
    }

    // Update meta
    const meta = card.querySelector('.session-meta');
    if (meta) {
      const statusLabels = this._getStatusLabels();
      meta.textContent = (statusLabels[session.status] || '') + ' \u00b7 ' + this.formatRelativeTime(session.updatedAt);
    }
  },

  createSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.dataset.sessionId = session.id;

    const dot = document.createElement('span');
    dot.className = 'session-status-dot status-' + session.status;
    card.appendChild(dot);

    const eq = document.createElement('div');
    eq.className = 'session-equation';
    eq.textContent = session.displayText || STRINGS.newProblem;
    card.appendChild(eq);

    const meta = document.createElement('div');
    meta.className = 'session-meta';
    const statusLabels = { 'new': STRINGS.statusNew || 'Új', 'in-progress': STRINGS.statusInProgress || 'Folyamatban', 'solved': STRINGS.statusSolved || 'Megoldva' };
    meta.textContent = (statusLabels[session.status] || '') + ' \u00b7 ' + this.formatRelativeTime(session.updatedAt);
    card.appendChild(meta);

    const del = document.createElement('button');
    del.className = 'btn-delete';
    del.setAttribute('aria-label', STRINGS.delete_ || 'Törlés');
    del.textContent = '\u2715';
    card.appendChild(del);

    return card;
  },

  formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return STRINGS.timeJustNow || 'most';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' ' + (STRINGS.timeMinutes || 'p.');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' ' + (STRINGS.timeHours || 'ó.');
    const days = Math.floor(hours / 24);
    return days + ' ' + (STRINGS.timeDays || 'nap');
  },

  // ---- Mobile Drawer ----

  openDrawer() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-backdrop').classList.add('visible');
    // Scroll active session into view
    const activeCard = document.querySelector('.session-card.active');
    if (activeCard) activeCard.scrollIntoView({ block: 'nearest' });
  },

  closeDrawer() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('visible');
  },

  // ---- Mobile Topbar ----

  updateTopbarEquation() {
    const el = document.getElementById('topbar-equation');
    if (!el) return;
    const session = this.getSession(this.activeSessionId);
    el.textContent = (session && session.displayText) ? session.displayText : STRINGS.newProblem;
  },

  // ---- Init ----

  init(onActivateCallback) {
    this._onActivate = onActivateCallback;
    this.load();

    if (this.sessions.length === 0) {
      this.createSession();
    } else {
      this.renderSessionList();
    }

    // Event delegation for session list
    document.getElementById('session-list').addEventListener('click', (e) => {
      // Delete button
      const deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) {
        e.stopPropagation();
        const card = deleteBtn.closest('.session-card');
        if (card) this.deleteSession(card.dataset.sessionId);
        return;
      }
      // Card click
      const card = e.target.closest('.session-card');
      if (card) {
        this.activateSession(card.dataset.sessionId);
      }
    });

    // Mobile drawer buttons
    document.getElementById('btn-menu').addEventListener('click', () => this.openDrawer());
    document.getElementById('sidebar-backdrop').addEventListener('click', () => this.closeDrawer());

    // New session buttons (captureCurrentState handled inside activateSession)
    document.getElementById('btn-new-session').addEventListener('click', () => {
      const session = this.createSession();
      this.activateSession(session.id);
    });
    document.getElementById('btn-new-sidebar').addEventListener('click', () => {
      const session = this.createSession();
      this.activateSession(session.id);
    });

    // Undo button
    document.getElementById('btn-undo').addEventListener('click', () => this.undoDelete());

    // Clear all button with 2-click confirmation
    const clearAllBtn = document.getElementById('btn-clear-all');
    let clearAllTimeout = null;
    clearAllBtn.addEventListener('click', () => {
      if (clearAllBtn.classList.contains('confirming')) {
        clearTimeout(clearAllTimeout);
        clearAllBtn.classList.remove('confirming');
        clearAllBtn.textContent = STRINGS.clearAll;
        this.clearAllSessions();
      } else {
        clearAllBtn.classList.add('confirming');
        clearAllBtn.textContent = STRINGS.clearAllConfirm;
        clearAllTimeout = setTimeout(() => {
          clearAllBtn.classList.remove('confirming');
          clearAllBtn.textContent = STRINGS.clearAll;
        }, 3000);
      }
    });

    // First-run hint
    if (!localStorage.getItem(this.SEEN_KEY)) {
      const menuBtn = document.getElementById('btn-menu');
      menuBtn.classList.add('pulse-hint');
      setTimeout(() => {
        menuBtn.classList.remove('pulse-hint');
        localStorage.setItem(this.SEEN_KEY, 'true');
      }, 3000);
    }

    // Save on page unload (safety net)
    window.addEventListener('beforeunload', () => {
      this.captureCurrentState();
      this.save();
    });

    // Activate saved active session, or most recent
    const savedActiveId = this.activeSessionId;
    const savedSession = savedActiveId ? this.getSession(savedActiveId) : null;
    const startId = savedSession ? savedSession.id : this.sessions[0].id;
    this.activeSessionId = null; // reset so activateSession doesn't try to capture empty state
    this.activateSession(startId);
  }
};
