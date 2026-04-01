# Run 8: Multi-Session Threads (Sidebar)

**Phase:** 10
**Files to modify:** `index.html`, `css/style.css`, `js/app.js`, `js/interactive-board.js`, `js/validator.js`, `js/camera.js`
**Files to create:** `js/sessions.js`
**Goal:** Users can work on multiple equations simultaneously. A sidebar lists all sessions. Switching between sessions preserves state. Sessions persist via localStorage.

---

## UX Design

### Core metaphor

The sidebar works like a **messaging app's conversation list** — each equation is a "thread" with its own state and progress. Users can start new equations without losing work on current ones.

### Layout architecture

```
DESKTOP (>=768px)                    MOBILE (<768px)
┌────────┬─────────────────┐        ┌─────────────────────┐
│        │                 │        │ ☰  2x+3=7     [ + ] │  ← top bar with session hint
│ Sidebar│   Main Area     │        ├─────────────────────┤
│ 220px  │   (flex: 1)     │        │                     │
│        │                 │        │    Main Area         │
│ Fixed  │  Home/Validator │        │    (full width)      │
│ always │  /Board states  │        │                     │
│ visible│                 │        │                     │
│        │                 │        │                     │
└────────┴─────────────────┘        └─────────────────────┘

                                    MOBILE DRAWER (open):
                                    ┌──────────┬──────────┐
                                    │          │          │
                                    │ Sidebar  │ Dimmed   │
                                    │ 280px    │ backdrop │
                                    │ overlay  │          │
                                    │          │          │
                                    └──────────┴──────────┘
```

**Desktop sidebar is 220px** (not 260px). At 1024px viewport: 220px sidebar + 804px main, with max-500px content centered in 804px = 152px margins. Tighter sidebar avoids the off-center feeling.

### Sidebar design

```
┌─────────────────────┐
│  Egyenletek   [ + ] │  ← header: title + new session button
├─────────────────────┤
│                     │
│ ┌─────────────────┐ │
│ │ ● 2x + 3 = 7   │ │  ← active session (highlighted border)
│ │  Megoldva  2 p. │ │     status dot + PLAIN TEXT equation
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ ● x^2 - 4 = 0  │ │  ← in-progress session
│ │  Folyamatban 15p│ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ ● Uj feladat    │ │  ← new/empty session
│ │            1 o. │ │
│ └─────────────────┘ │
│                     │
│   (scrollable)      │
│                     │
└─────────────────────┘
```

**Title is "Egyenletek" (Equations)**, not "Feladatok" (Problems/Tasks). "Feladatok" could confuse students into thinking these are homework assignments. "Egyenletek" is specific and accurate.

### Session card anatomy

Each card in the sidebar is a compact glass-card:

```
┌──────────────────────────────┐
│ ●  2x + 3 = 7           ✕   │  ← status dot + PLAIN TEXT equation + delete
│    Megoldva · 2 perce        │  ← status label + relative time
└──────────────────────────────┘
```

**Equation preview uses plain text, NOT KaTeX.** Reasons:
- KaTeX renders are expensive — sidebar could have 20+ cards, each triggering `katex.render()`
- KaTeX output at 0.85rem font size is cramped and hard to read
- Plain text (`2x + 3 = 7`, `x^2 - 4 = 0`) is perfectly readable for equation previews
- The `displayText` field stores a readable version (strip LaTeX commands, keep operators)

**Status dot colors (CSS-only, no emoji):**
- **New** (`--text-muted`, grey): session created, no equation entered yet
- **In progress** (`--warning`, yellow): equation entered, not yet solved
- **Solved** (`--success`, green): final solution reached on the board

**Active session indicator:**
- Left border accent (gradient, 3px) — same style as step-card `::before`
- Slightly brighter background (`--glass-bg-hover`)

**Delete button:**
- Small `✕` icon, top-right corner
- **Desktop**: visible on card hover only (opacity transition)
- **Mobile**: always visible (no hover on touch devices) — small, subtle, right-aligned
- Drop swipe-to-delete — it's over-engineered for this context, conflicts with scroll, and is undiscoverable
- **Undo toast**: after deletion, a toast appears at the bottom for 4 seconds: "Torolve. Visszavonas" with an undo link. This replaces a confirmation dialog — modern, non-blocking, reversible.

### Session lifecycle

```
1. App loads
   → Load sessions from localStorage
   → If no sessions exist: create first session automatically
   → Render sidebar, activate most recent session

2. User taps "+" (or "Uj feladat" on board)
   → Save current session state
   → Create new session { status: 'new' }
   → Activate new session → show Home screen

3. User enters equation (camera or keyboard path)
   → Session updates: status → 'in-progress', equation stored
   → Sidebar card updates with equation text

4. User solves equation on board
   → Session updates: status → 'solved'
   → Sidebar card updates with green dot

5. User taps different session in sidebar
   → Save current session state
   → Load tapped session's state
   → Restore to the correct app state (home / validator / board)
   → On mobile: auto-close drawer

6. User deletes a session
   → Card slides out with animation
   → Session kept in memory for 4s (undo window)
   → Undo toast shown at bottom
   → After 4s or next action: permanently remove from localStorage
   → If active session deleted: switch to next session
   → If no sessions left: create a new one
```

### Mobile interactions

**Opening the drawer:**
- Hamburger button (`☰`) in the top-bar
- (Swipe from left edge is NOT implemented — too complex, conflicts with browser back gesture on iOS. Keep it simple.)

**Closing the drawer:**
- Tap the dimmed backdrop area
- Tap a session card (auto-closes after selection)

**Top bar (mobile only):**
```
┌──────────────────────────────────────┐
│  ☰    2x + 3 = 7             [ + ]  │
└──────────────────────────────────────┘
   │         │                    │
   │         └─ active equation   └─ new session shortcut
   └─ opens drawer     (plain text, truncated)
```

- Shows the **active session's equation** in the center — so the user knows which session they're looking at even with the drawer closed. Displays "Uj feladat" if the session has no equation yet.
- `☰` opens drawer
- `[ + ]` creates new session directly (no need to open drawer)
- Positioned fixed at top, glass-bar style
- Only visible on mobile (`display: none` on desktop)

**First-run discoverability:**
On first app launch (no sessions in localStorage), show a subtle pulse animation on the `☰` button for 3 seconds. This draws attention to the sidebar without being intrusive. Only triggers once (flag in localStorage: `crackthex_sidebar_seen`).

### Desktop sidebar

- Fixed width: `220px`
- Always visible, no toggle needed
- Same glass aesthetic: `backdrop-filter: blur`, subtle right border
- "+" button in sidebar header
- Scrollable session list
- Main content area shifts right by 220px

### Session sorting

Sessions are sorted by **`createdAt` descending** (newest first, stable order). NOT by `updatedAt` — that causes frustrating reshuffling every time you briefly check another session. The active session is highlighted visually but doesn't move in the list.

---

## What to build

### Data model

```js
// Session object structure — ALL fields are JSON-serializable primitives/arrays
{
  id: string,                // crypto.randomUUID() or Date.now().toString() fallback
  equation: string | null,   // LaTeX string, null if new/empty
  displayText: string,       // plain-text equation for sidebar preview (e.g. "2x + 3 = 7")
  status: 'new' | 'in-progress' | 'solved',
  appState: 'state-scanner' | 'state-validator' | 'state-board',
  cameraPhase: 'home',      // always save as 'home' — never resume mid-camera
  validatorData: {
    mode: 'keyboard' | 'ocr',
    latex: string             // current input value
    // NOTE: croppedImageDataURL is NOT stored — too large for localStorage.
    // On restore, the original image card shows "Kep nem elerheto" placeholder.
  } | null,
  boardData: {
    latex: string,            // original equation passed to solver
    solverSteps: [            // array of step objects from Solver.solve()
      {
        latex: string,        // e.g. "2x + 3 = 7"
        rule: string,         // Hungarian rule label
        lhs: string,          // nerdamer text, e.g. "2*x+3" (string, NOT nerdamer object)
        rhs: string,          // nerdamer text, e.g. "7" (string, NOT nerdamer object)
        isFinal: boolean
      }
    ],
    userSteps: [              // steps added by user via drag-and-drop (same shape as above)
      { latex, rule, lhs, rhs, isFinal }
    ],
    currentLhs: string,       // current interactive zone LHS (nerdamer text string)
    currentRhs: string        // current interactive zone RHS (nerdamer text string)
  } | null,
  createdAt: number,          // Date.now()
  updatedAt: number           // Date.now()
}
```

**Why no `croppedImageDataURL` in storage:** A single cropped JPEG data URL is 100-500KB. With 10 OCR sessions, that's 1-5MB — dangerously close to the 5-10MB localStorage limit. Images are kept in-memory only (in `Validator.currentCroppedImage`). On page refresh, the image is gone — the equation LaTeX is what matters, not the original photo.

### index.html changes

**New top-level layout structure:**

```html
<body>
  <!-- Mobile top bar (hidden on desktop) -->
  <div id="mobile-topbar" class="glass-bar mobile-topbar">
    <button id="btn-menu" class="btn-icon" aria-label="Menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
    </button>
    <span id="topbar-equation" class="topbar-equation">Uj feladat</span>
    <button id="btn-new-session" class="btn-icon" aria-label="Uj feladat">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
  </div>

  <!-- Sidebar -->
  <aside id="sidebar" class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">Egyenletek</h2>
      <button id="btn-new-sidebar" class="btn-icon" aria-label="Uj egyenlet">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
    <div id="session-list" class="session-list">
      <!-- Session cards rendered dynamically by sessions.js -->
    </div>
  </aside>

  <!-- Backdrop for mobile drawer -->
  <div id="sidebar-backdrop" class="sidebar-backdrop"></div>

  <!-- Main content area -->
  <main id="main-area">
    <div id="app">
      <!-- ...existing state sections unchanged... -->
    </div>
  </main>

  <!-- Undo toast -->
  <div id="undo-toast" class="undo-toast" style="display:none;">
    <span>Torolve.</span>
    <button id="btn-undo" class="btn-undo">Visszavonas</button>
  </div>

  <!-- JS Libraries (CDN) ... existing ... -->
  <!-- Local JS: add sessions.js before app.js -->
  <script src="js/sessions.js"></script>
  <script src="js/app.js"></script>
</body>
```

### css/style.css additions

```css
/* ========== Z-INDEX LAYER MAP ==========
   Layer 0:  aurora background (body::before/::after)
   Layer 1:  .app-state sections
   Layer 10: #scanner-controls, #app-logo
   Layer 15: .btn-back-nav (camera/validator back buttons)
   Layer 20: .fab (#btn-new)
   Layer 30: #undo-toast
   Layer 40: #mobile-topbar
   Layer 45: #sidebar-backdrop
   Layer 50: #sidebar
   ======================================== */

/* ========== LAYOUT: SIDEBAR + MAIN ========== */

/* Body stays as-is (height:100%, overflow:hidden) — just add flex for desktop */
@media (min-width: 768px) {
  body {
    display: flex;
    flex-direction: row;
  }
}

/* ---- SIDEBAR ---- */

.sidebar {
  width: 220px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: rgba(8, 11, 26, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid var(--glass-border);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ---- SESSION CARD ---- */

.session-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  padding-left: 1.75rem;     /* space for status dot */
  cursor: pointer;
  position: relative;
  transition: background 0.2s, border-color 0.2s;
  flex-shrink: 0;
}

.session-card:hover {
  background: var(--glass-bg-hover);
}

.session-card.active {
  background: var(--glass-bg-hover);
  border-left: 3px solid;
  border-image: var(--gradient-main) 1;
}

.session-equation {
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 1.5rem;    /* space for delete button */
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.session-status-dot {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-new         { background: var(--text-muted); }
.status-in-progress { background: var(--warning); }
.status-solved      { background: var(--success); }

.session-card .btn-delete {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  transition: opacity 0.15s, color 0.15s;
  padding: 4px 6px;
  line-height: 1;
}

/* Desktop: hide delete until hover */
@media (min-width: 768px) {
  .session-card .btn-delete {
    opacity: 0;
  }
  .session-card:hover .btn-delete {
    opacity: 1;
  }
}

/* Mobile: always show delete (no hover on touch) */
@media (max-width: 767px) {
  .session-card .btn-delete {
    opacity: 0.5;
  }
}

.session-card .btn-delete:hover {
  color: var(--danger);
}

/* ---- MAIN AREA ---- */

#main-area {
  flex: 1;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

@media (min-width: 768px) {
  #main-area {
    margin-left: 220px;
  }
}

/* #app keeps its existing styles — it's now inside #main-area */
/* Verify: width:100%, height:100%, position:relative, overflow:hidden still work */

/* ---- MOBILE TOP BAR ---- */

.mobile-topbar {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  gap: 0.75rem;
}

.topbar-equation {
  flex: 1;
  text-align: center;
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-icon:hover {
  background: var(--glass-bg-hover);
}

/* Hamburger pulse animation for first-run */
@keyframes pulse-hint {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 0 4px var(--accent-glow); }
}

.btn-icon.pulse-hint {
  animation: pulse-hint 1.5s ease-in-out 2;    /* pulse twice */
}

/* ---- SIDEBAR BACKDROP ---- */

.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 45;
}

.sidebar-backdrop.visible {
  display: block;
}

/* ---- UNDO TOAST ---- */

.undo-toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  background: var(--bg-tertiary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  box-shadow: 0 8px 32px var(--glass-shadow);
}

.btn-undo {
  background: none;
  border: none;
  color: var(--accent-cyan);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
}

.btn-undo:hover {
  text-decoration: underline;
}

/* ---- RESPONSIVE ---- */

@media (max-width: 767px) {
  .mobile-topbar {
    display: flex;
  }

  .sidebar {
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 50;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  #main-area {
    margin-left: 0;
    padding-top: 48px;         /* offset for top bar height */
  }

  /* Home screen needs padding-top to clear mobile topbar */
  .home-content {
    padding-top: 0;             /* already under #main-area which has padding-top */
  }
}
```

### js/sessions.js -- SessionManager module

```
const SessionManager = {
  sessions: [],
  activeSessionId: null,
  _transitioning: false,        // guard against rapid session switching
  _undoTimeout: null,           // timer for undo toast
  _pendingDelete: null,         // session pending permanent deletion
  STORAGE_KEY: 'crackthex_sessions',
  SEEN_KEY: 'crackthex_sidebar_seen',

  // ---- Persistence ----

  load():
    - try { JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { [] }
    - Validate: filter out entries missing required fields
    - Set this.sessions

  save():
    - try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions)) }
      catch (e) {
        // QuotaExceededError: localStorage full
        console.warn('localStorage full, sessions in-memory only');
        // Optionally: prune oldest solved sessions and retry
      }
    - Called after every mutation

  // ---- CRUD ----

  createSession():
    - const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString())
    - Build session with defaults: { id, equation: null, displayText: '', status: 'new',
        appState: 'state-scanner', cameraPhase: 'home', validatorData: null,
        boardData: null, createdAt: Date.now(), updatedAt: Date.now() }
    - Unshift to this.sessions (newest first by createdAt)
    - save()
    - renderSessionList()
    - Return session

  getSession(id):
    - Find by id in this.sessions

  updateSession(id, updates):
    - Find session, merge updates, set updatedAt = Date.now()
    - save()
    - updateSessionCard(id)   // targeted DOM update, NOT full re-render

  deleteSession(id):
    - Find session index, remove from array
    - Store in _pendingDelete for undo
    - Show undo toast (GSAP fade in)
    - Clear any previous _undoTimeout
    - _undoTimeout = setTimeout(() => { _pendingDelete = null; hide toast; save(); }, 4000)
    - If was active: activate next session, or create new if empty
    - Remove card from DOM with GSAP slide-out (x: -100%, opacity: 0, 0.25s)
    - Do NOT call save() yet — save happens after undo window closes

  undoDelete():
    - If _pendingDelete: splice back into this.sessions at original index
    - clearTimeout(_undoTimeout)
    - _pendingDelete = null
    - Hide undo toast
    - renderSessionList()  // full rebuild since we need to re-insert

  // ---- Activation ----

  activateSession(id):
    - If _transitioning, return (guard against rapid switching)
    - _transitioning = true
    - Save current session's state: captureCurrentState()
    - Set activeSessionId = id
    - save()
    - Determine target session's app state and data
    - Call goToState() with appropriate data
      NOTE: does NOT call goToState directly — uses a callback:
      this._onActivate(targetState, targetData)
      The callback is set by app.js during init (see app.js changes).
      This avoids circular dependency.
    - Update sidebar highlighting (toggle .active class)
    - Update mobile topbar equation text
    - On mobile: closeDrawer()
    - After goToState transition completes (~700ms): _transitioning = false
      Use gsap.delayedCall(0.8, () => { _transitioning = false; })

  captureCurrentState():
    - If no activeSessionId, return
    - Read current app state from currentState variable (global)
    - IMPORTANT: only capture if NOT mid-animation — check _transitioning flag
    - If currentState === SCANNER:
        Update session: { appState: 'state-scanner', cameraPhase: 'home' }
        (Always save as 'home' — never resume mid-camera/crop)
    - If currentState === VALIDATOR:
        Update session: {
          appState: 'state-validator',
          validatorData: Validator.getState()  // { mode, latex }
        }
    - If currentState === BOARD:
        Update session: {
          appState: 'state-board',
          boardData: InteractiveBoard.getState()  // { latex, solverSteps, userSteps, currentLhs, currentRhs }
        }

  // ---- UI Rendering ----

  renderSessionList():
    - Clear #session-list innerHTML
    - For each session: createElement via createSessionCard(), append
    - Highlight active session (.active class)
    - Attach click handlers via event delegation on #session-list (not per-card)

  updateSessionCard(id):
    - Find existing card DOM element by [data-session-id="..."]
    - If not found: return (card may have been deleted)
    - Update equation text, status dot class, meta text
    - Do NOT rebuild the entire card — just update the changed parts
    - This is the method called by updateSession() — NOT renderSessionList()

  createSessionCard(session):
    - div.session-card with data-session-id
    - span.session-status-dot with class based on session.status
    - div.session-equation: session.displayText || 'Uj feladat' (plain text, NOT KaTeX)
    - div.session-meta: status label + formatRelativeTime(session.updatedAt)
    - button.btn-delete: ✕

  formatRelativeTime(timestamp):
    - < 60s: "most"
    - < 60m: "X p." (X perccel ezelott, abbreviated)
    - < 24h: "X o." (X oraval ezelott, abbreviated)
    - else: "X nap" (X nappal ezelott)

  // ---- Mobile Drawer ----

  openDrawer():
    - Add .open class to #sidebar
    - Show #sidebar-backdrop with .visible class
    - GSAP animate sidebar transform (handled by CSS transition)
    - GSAP fade in backdrop opacity

  closeDrawer():
    - Remove .open class from #sidebar
    - Remove .visible from #sidebar-backdrop
    - Handled by CSS transition

  // ---- Mobile Topbar ----

  updateTopbarEquation():
    - Set #topbar-equation textContent to active session's displayText or 'Uj feladat'
    - Called after session activation and equation updates

  // ---- Init ----

  init(onActivateCallback):
    - Store callback: this._onActivate = onActivateCallback
    - load() from localStorage
    - If no sessions: createSession()
    - renderSessionList()
    - activateSession(sessions[0].id)  // most recent

    - Wire event listeners:
      - #session-list: event delegation for card clicks + delete button clicks
      - #btn-menu → openDrawer()
      - #btn-new-session → createSession() + activateSession(newId) + closeDrawer()
      - #btn-new-sidebar → createSession() + activateSession(newId)
      - #sidebar-backdrop → closeDrawer()
      - #btn-undo → undoDelete()

    - First-run hint:
      if (!localStorage.getItem(SEEN_KEY)):
        Add .pulse-hint class to #btn-menu
        After 3s: remove class, set SEEN_KEY in localStorage

    - Save on page unload (safety net, NOT primary mechanism):
      window.addEventListener('beforeunload', () => captureCurrentState(); save())
}
```

### js/app.js changes

```
goToState() modifications:
  - Add _transitioning concept: set at start of timeline, clear at end
  - After transition completes (in final tl.call):
    If SessionManager.activeSessionId:
      SessionManager.updateSession(activeId, { appState: newState })
  - When entering BOARD with data.latex (fresh solve, not restore):
      SessionManager.updateSession(activeId, {
        status: 'in-progress',
        equation: data.latex,
        displayText: MathUtils.latexToPlainText(data.latex)  // strip LaTeX commands
      })

"Uj feladat" button:
  - Change from goToState(SCANNER) to:
    SessionManager.captureCurrentState()
    const session = SessionManager.createSession()
    SessionManager.activateSession(session.id)

DOMContentLoaded:
  - Initialize SessionManager with callback:
    SessionManager.init((targetState, targetData) => {
      goToState(targetState, targetData);
    });
  - Remove the direct goToState(AppState.SCANNER) call — SessionManager.init handles it
```

### js/interactive-board.js changes

```
InteractiveBoard additions:

  getState():
    - Return null if no currentEquation (board never fully initialized)
    - Return {
        latex: this._originalLatex,           // store in init()
        solverSteps: this._solverSteps,       // store in init()
        userSteps: this._userSteps,           // accumulated drag steps
        currentLhs: this.currentEquation.lhs, // string
        currentRhs: this.currentEquation.rhs  // string
      }

  init(data) changes:
    - Store this._originalLatex = data.latex || (data.boardData && data.boardData.latex)
    - this._userSteps = []

    - BRANCHING LOGIC:
      If data.boardData exists (restoring session):
        - this._solverSteps = data.boardData.solverSteps
        - this.steps = [...data.boardData.solverSteps, ...data.boardData.userSteps]
        - this._userSteps = [...data.boardData.userSteps]
        - Render ALL steps as step cards (solver + user)
        - Restore interactive zone:
          this.setupInteractiveZone({
            lhs: data.boardData.currentLhs,
            rhs: data.boardData.currentRhs
          })
      Else (fresh solve — existing behavior):
        - this._solverSteps = Solver.solve(data.latex)
        - this.steps = [...this._solverSteps]
        - Render + animate as before
        - Setup interactive zone from last non-final step

  handleTermMove() addition:
    - After _rebuildAfterMove succeeds and newStep is created:
      this._userSteps.push(newStep)
      SessionManager.updateSession(SessionManager.activeSessionId, {
        boardData: this.getState()
      })
    - When equation is solved (isFinal):
      SessionManager.updateSession(SessionManager.activeSessionId, {
        status: 'solved',
        boardData: this.getState()
      })
```

### js/validator.js changes

```
Validator additions:

  getState():
    - Return {
        mode: this._mode,
        latex: document.getElementById('latex-input').value
        // NOTE: no croppedImageDataURL — not persisted
      }

  init(data) changes:
    - If data.validatorData exists (restoring session):
        this._mode = data.validatorData.mode
        Set input value to data.validatorData.latex
        Render KaTeX preview
        If mode === 'ocr':
          Show #card-original with placeholder "Kep nem elerheto" (image not available)
          // The original photo is gone — only the LaTeX matters
        Skip recognizeEquation() — don't re-call OCR
    - Else: existing behavior (keyboard or fresh OCR)

  solve() addition:
    - Before goToState(BOARD):
      const latex = input.value.trim()
      SessionManager.updateSession(SessionManager.activeSessionId, {
        status: 'in-progress',
        equation: latex,
        displayText: latex.replace(/\\[a-zA-Z]+\{?/g, '').replace(/[{}]/g, '')  // rough strip
      })
```

### js/camera.js changes

```
Camera changes:
  - Wire #entry-keyboard: call SessionManager.updateSession() with appState info
    before goToState(VALIDATOR, { mode: 'keyboard' })
  - startCamera(): no session state change needed (camera phase isn't persisted)
```

### Script load order

```html
<!-- Add sessions.js before app.js -->
<script src="js/utils.js"></script>
<script src="js/api.js"></script>
<script src="js/solver.js"></script>
<script src="js/camera.js"></script>
<script src="js/validator.js"></script>
<script src="js/interactive-board.js"></script>
<script src="js/sessions.js"></script>
<script src="js/app.js"></script>
```

`sessions.js` loads after the modules it references (`Validator`, `InteractiveBoard`) but before `app.js` which provides `goToState`. The circular reference is resolved via callback: `SessionManager.init(onActivateCallback)` receives `goToState` as a callback from `app.js` at runtime, not at script load time. This means `sessions.js` never references `goToState` directly — it calls `this._onActivate()` instead.

---

## Interaction details

### Sidebar session card tap
1. If `_transitioning`, ignore click (prevents rapid-switch race condition)
2. Current session state is captured via `captureCurrentState()`
3. Target session card gets `.active` class, previous loses it
4. Main area transitions to the target session's last known state:
   - If session.appState === SCANNER → home screen appears (always `cameraPhase: 'home'`)
   - If session.appState === VALIDATOR → validator appears with equation in input
   - If session.appState === BOARD → board rebuilds from saved steps + interactive zone
5. Mobile topbar updates with new active equation text
6. On mobile: drawer auto-closes after 200ms delay (let user see the selection)
7. `_transitioning` flag clears after 800ms

### New session creation (from "+" button)
1. Current session captured and saved
2. New session card slides into top of list (GSAP: `y: -20, opacity: 0` → `y: 0, opacity: 1`)
3. New card gets `.active` highlight
4. Main area transitions to Home screen
5. Mobile topbar shows "Uj feladat"
6. On mobile: drawer auto-closes

### Session deletion with undo
1. Click `✕` → card slides out (GSAP: `x: -100%, opacity: 0`, 0.25s)
2. Undo toast fades in at bottom center
3. Session data kept in `_pendingDelete` for 4 seconds
4. If user clicks "Visszavonas": card re-inserted, toast hidden
5. After 4s without undo: session permanently removed from localStorage
6. If deleted session was active: next session in list becomes active
7. If no sessions left: auto-create new empty one

### State capture timing (save points)
Session state is persisted when:
- User switches to a different session (captureCurrentState before switch)
- User creates a new session (captureCurrentState before create)
- User completes a drag-and-drop step on the board (handleTermMove saves boardData)
- User transitions between app states via goToState (appState updated)
- User clicks solve (equation + status saved)
- Page unload (beforeunload — safety net, not primary mechanism)

**NOT on a timer or interval** — saves are event-driven. This avoids unnecessary writes and potential UI jank.

**iOS Safari note:** `beforeunload` is unreliable on iOS Safari. That's fine — the event-driven save points above cover all meaningful state changes. The `beforeunload` handler is a belt-and-suspenders safety net, not the primary mechanism.

### Sidebar scroll
- Session list is scrollable when many sessions exist
- Sorted by `createdAt` descending (stable order, no reshuffling)
- Active session scrolled into view when sidebar opens on mobile

---

## Edge cases

- **Page refresh**: Sessions restored from localStorage. Active session resumes at its last app state. Board state includes solver steps + user drag steps. Images are NOT restored — validator shows placeholder text for original image.
- **localStorage quota exceeded**: Catch `QuotaExceededError` in `save()`. Log warning, sessions continue in-memory. Consider pruning: remove `boardData` from oldest solved sessions to free space.
- **Very long equations**: Sidebar card truncates with `text-overflow: ellipsis`. Full equation visible in main area.
- **Many sessions (50+)**: Simple DOM, no virtualization needed. Add "Osszes torles" (Clear all) button in sidebar header if `sessions.length > 20`.
- **Board restore fidelity**: Steps are plain objects (latex, rule, lhs, rhs strings). `setupInteractiveZone()` re-parses terms and re-initializes interact.js from the string state. No nerdamer objects are serialized — only `.text()` string output.
- **Rapid session switching**: `_transitioning` flag prevents concurrent `goToState()` calls. Flag auto-clears after 800ms.
- **Camera state on session switch**: Camera sub-phase is always saved as `'home'`. If user was mid-camera/crop and switches session, camera stream is cleaned up by `Camera.cleanup()`. When switching back, they start at home screen, not mid-camera. This is intentional — camera/crop state is ephemeral.
- **Empty sidebar**: Never happens — deleting the last session auto-creates a new one.
- **Session card click during delete animation**: `_transitioning` guard prevents this.
- **HTML restructure safety**: `#app` moves inside `#main-area`. Existing CSS for `#app` (`width: 100%; height: 100%; position: relative; overflow: hidden;`) still works because `#main-area` has the same dimensions. Key: `#main-area` must have `height: 100vh; overflow: hidden;` and `#app` inherits `100%` from that.
- **Circular dependency**: sessions.js never references `goToState` at module level. It receives the function as a callback via `init(onActivateCallback)`. This ensures proper load order and clean decoupling.

---

## Review checklist

### Sidebar (desktop)
- [ ] Sidebar visible on left side at >=768px viewport, 220px wide
- [ ] Sidebar has glass aesthetic with blur backdrop
- [ ] "Egyenletek" header with "+" button
- [ ] First session auto-created on fresh app load
- [ ] Session card shows status dot, plain-text equation, timestamp
- [ ] Active session has gradient left border highlight
- [ ] Clicking "+" creates new session at top with slide-in animation
- [ ] Clicking a session card switches to that session's state
- [ ] Delete button appears on card hover (desktop)
- [ ] Delete button always subtly visible (mobile)
- [ ] Deleting shows undo toast for 4 seconds
- [ ] Clicking "Visszavonas" restores deleted session
- [ ] Undo toast disappears after 4 seconds, deletion is permanent
- [ ] Deleting active session switches to next one
- [ ] Deleting last session auto-creates a new empty one
- [ ] Session list scrollable with many sessions
- [ ] Main content area properly offset by 220px sidebar

### Sidebar (mobile)
- [ ] Sidebar hidden by default on <768px
- [ ] Mobile top bar visible with hamburger, active equation, and + button
- [ ] Active equation text updates when switching sessions
- [ ] Hamburger opens sidebar as drawer overlay with blurred backdrop
- [ ] Tapping backdrop closes drawer
- [ ] Selecting a session auto-closes drawer
- [ ] Main content has top padding for mobile top bar (48px)
- [ ] First-run: hamburger button pulses briefly to hint at sidebar

### Session state persistence
- [ ] Creating new session → home screen appears
- [ ] Enter equation via keyboard → session updates to "in-progress" with equation text
- [ ] Solve equation → session card shows "in-progress", equation text visible
- [ ] Reach final solution via drag → session updates to "solved" with green dot
- [ ] Switch to different session → previous session's state is saved
- [ ] Switch back → state fully restored (board steps, interactive zone, etc.)
- [ ] Board restore: ALL step cards re-rendered (solver + user), interactive zone functional
- [ ] Validator restore: equation in input, KaTeX preview rendered, image shows placeholder
- [ ] Page refresh → sessions survive via localStorage
- [ ] Page refresh → active session resumes correctly
- [ ] Page refresh → images are NOT restored (expected — placeholder shown)
- [ ] Rapid double-click on session cards → only one switch happens (no race)

### Integration with existing features
- [ ] "Uj feladat" (FAB on board) creates new session (not just goToState)
- [ ] Camera path works within sessions
- [ ] Keyboard path works within sessions
- [ ] Drag-and-drop on board saves progress to session after each step
- [ ] Multiple solved sessions retain their full step history
- [ ] No state leaks between sessions (equation from session A doesn't appear in session B)
- [ ] Session sorting is stable (by createdAt, no reshuffling)

### Performance & cleanup
- [ ] No memory leaks: switching sessions properly cleans up interact.js, camera streams, timers
- [ ] localStorage writes are event-driven, not on timer — no UI jank
- [ ] Sidebar card updates are targeted (updateSessionCard), not full list rebuilds
- [ ] Session card uses plain text, not KaTeX — fast rendering
- [ ] Sidebar animations smooth at 60fps
- [ ] No console errors during any session operation
- [ ] localStorage quota exceeded: graceful fallback (console warning, in-memory only)
