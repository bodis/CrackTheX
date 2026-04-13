# UI/UX Specification

## Landing Page

The product IS the landing page. No marketing-first approach.

**Above the fold (students):**
- Equation input field, front and center, with pre-filled example: `5(2x - 3) = 25`
- "Solve" button with subtle pulsing glow (first visit only)
- Below: partial solution teaser — Step 0 and Step 1 visible, rest faded with "Try it yourself"
- Camera link: "Use camera" (with "Sign up free" label for anonymous users)

**Below the fold (parents):**
- "Why CrackTheX?" section with comparison table
- Parent dashboard preview mockup (static, sample data)
- Pricing (Free + Pro)
- **Trust signals**: "Built by a Hungarian developer and parent", student count (when available), "Your data stays in the EU"
- **Privacy page** link (plain-language GDPR: what's collected, what's NOT, deletion rights, EU storage)

**Mobile landing:** Simplified — equation input + "Solve" button. Solution appears after tap. No teaser.

---

## Workspace Shell

### Desktop (≥1024px) — 3-Column

```
┌─────────────────────────────────────────────────────┐
│  Logo   [Solver] [Practice]  [AI Tutor]    ⚙ 👤    │  ← Top bar (56px)
├────────┬────────────────────────────────────────────┤
│Session │              Main Content                   │
│Sidebar │         (Solver / Practice / Tutor)         │
│(260px) │                                             │
│        │                                             │
│  + New │         Action bar at bottom                │
├────────┴────────────────────────────────────────────┤
```

- Top bar: `--bg-secondary`, 56px, fixed. Tab indicator: accent underline on active.
- Sidebar: 260px, collapsible to 56px (icons only). Sessions listed.
- Main content: fills remaining space, scrollable.
- Right column: reserved for AI co-pilot panel (Wave 3+). Empty in Wave 1-2.

### Mobile (<768px) — Stacked

```
┌──────────────────────────┐
│  ☰  CrackTheX  [Solver▾] │  ← App bar (48px)
├──────────────────────────┤
│      Main Content          │
│      (full width)          │
│      Step cards scroll     │
├──────────────────────────┤
│  [+] [−] [×] [÷] [Exp]  │  ← Fixed action bar (56px)
└──────────────────────────┘
```

- App bar: hamburger left (→ sidebar drawer), tab dropdown right
- Fixed action bar: bottom of screen, thumb zone, thin top border/shadow for separation
- Tab switch: dropdown in app bar (not bottom tabs until Wave 3+ with 3+ tabs)

**Settings**: Gear icon in sidebar (desktop) or hamburger menu (mobile). Theme, language, account, help, privacy.

---

## Solver Tab

### Equation Input Area

- Input field: accepts plain text, LaTeX, Unicode copy-paste
- Live KaTeX preview below, updating as student types
- Placeholder: "Írd be az egyenletedet... pl. 2x + 3 = 7" (teaches format)
- Camera link: greyed "Sign up free" tooltip for anonymous users
- Multi-variable (Wave 2): "+" button adds stacked rows. Max 3. "Solve System" button.

**Error handling:**
- `==` → single `=`. No `=` → "Add an = sign." Unparseable → wavy underline. Non-math → helpful message.
- Never blocks typing.

**Edge case equations:**

| Input | Response |
|-------|----------|
| `x = x` | "Always true — any value of x is a solution." |
| `x + 1 = x` | "No solution — subtracting x gives 1 = 0." |
| `5 = 5` | "True but no variable to solve for." |
| `x^2 - 4 = 0` | Direct answer + "Upgrade to Pro for step-by-step." (Natural upsell.) |
| `sin(x) = 0.5` | Answer if possible, otherwise "Not supported yet." |
| Dependent system | "Infinitely many solutions: y = 5 - x." (Wave 2) |
| Contradictory system | "No solution — equations are inconsistent." (Wave 2) |

**Empty state:** Input field + 3 tappable example equation chips at different complexity levels. Chips fill the input on tap.

### Step Cards

Each step is a card with:
- Step number badge (00, 01, 02...)
- KaTeX-rendered equation
- Rule description in connector BETWEEN cards (tappable → concept card)
- Optional alternative path panel

**Visual progress:**
- Connector lines shorten and shift color as steps advance (visual compression = algebraic simplification)
- Equation font weight subtly increases toward solution
- Terms that moved between steps briefly glow on new position (highlights what changed)

**Progressive rule language:**
- "First, let's divide both sides by 5" → "Now add 3" → "Almost there — divide by 2" → "Solution found"
- Narrative, not mechanical log. Naturally translated per language.

**Solved state:**
- Distinct card: different border, subtle glow
- "Verified correct" line with checkmark
- Theme-specific celebration (see [Design System](04-design-system.md))
- Cross-promotion: "Got it? Try a similar equation → Practice"

**Alternative paths:**
- Subtle panel below step card when alternative strategy exists
- One-line description + preview. One tap to take, zero to ignore.

### Action Buttons

**+** | **−** | **×** | **÷** | **Expand** | **Simplify** | **I think it's...**

**Smart suggestions:** Tapping arithmetic buttons shows 2-3 context-aware number suggestions. For `5(2x-3)=25` with ÷: suggest **5** and **25**. One-tap vs type custom value.

**Conditional states:** Expand dimmed when no parentheses. Simplify dimmed when no like terms. Buttons communicate what's possible.

**"I think it's..."** (replaces "Rewrite"): Student proposes equivalent equation. App validates. Natural framing.

**Every operation applies to BOTH sides.** UI enforces algebraic symmetry. Invalid moves impossible.

**Valid-but-inefficient moves are not errors.** Equation updates validly. Student can continue.

**Progressive labels:** First-time users see full text ("Add to both sides"). Returning users see compact icons. Long-press for tooltip.

### Concept Cards (Tappable Rule Explanations)

Rule labels in step connectors are tappable. Opens tooltip/drawer with:
- 2-3 sentence explanation + simple example
- Pre-written, no AI cost (~10 rule types)

| Rule | Summary |
|------|---------|
| Add to both sides | Like adding equal weight to both sides of a scale |
| Subtract from both sides | Removing the same amount keeps them equal |
| Multiply both sides | Scaling equally maintains the equation |
| Divide both sides | Splitting into equal groups preserves equality |
| Expand/distribute | Number outside parentheses multiplies everything inside |
| Combine like terms | Terms with same variable merge into one |
| Move variable term | Isolate variable by moving variable terms to one side |
| Move constant term | Isolate variable by moving constants to the other side |
| Simplify a fraction | Divide numerator and denominator by same number |
| Verify the answer | Substitute solution back into original to confirm |

Foundation for AI Tutor consistency — AI references these same concepts.

### Inactivity Nudge

After 15-20 seconds of no action, a subtle suggestion fades in:

| Equation State | Nudge |
|---------------|-------|
| Has parentheses | "Try expanding the parentheses" (arrow → Expand) |
| Mixed terms, no parens | "Try moving the constant to the other side" |
| Single variable term, coeff ≠ 1 | "Try dividing both sides" |
| Like terms on same side | "Try simplifying — combine like terms" |

Rule-based, no AI. 5-6 rules. Addresses the "frozen student" problem.

### Hint System

- **"Next step"** button: reveals one solver step
- **"Show all"** link: de-emphasized. Stagger animation (150ms between steps). Switches to read-only.
- After "Show all": **"Try again"** button to restart same equation

---

## Practice Mode

### Session Structure

- **5 equations per set** (not infinite). Creates completion feeling.
- **3+2 progression**: First 3 at selected difficulty, last 2 one level up
- Progress dots at top: ● ● ● ○ ○ (green solved, orange skipped)

### Difficulty Levels

| Level | Structure | Example | Phase |
|-------|-----------|---------|-------|
| **Beginner** | `x + b = c` or `ax = c` | `x + 3 = 7` | Wave 2 |
| **Easy** | `ax + b = c` | `3x + 5 = 14` | Wave 1 |
| **Medium** | `a(x + b) = c` or `ax + b = cx + d` | `4(x + 2) = 20` | Wave 1 |
| **Hard** | `a(b(x + c) + d) = e` | `3(2(x + 1) - 4) = 12` | Wave 1 |

Default: Medium. One tap to start. Friendly numbers (integer answers, small coefficients).

**Topic filters (Wave 2):** Parentheses / Variable on both sides / Nested / Mixed.

### Interaction Flow

1. Equation appears in KaTeX
2. Action buttons (with smart suggestions). NO hint buttons.
3. **"Check"** button (active after 1+ move):
   - Correct: green highlight, checkmark, "Nice! x = 4". New equation auto-generates.
   - Incorrect: gentle specific feedback. "Not fully solved yet" or "Check step 3."
4. **"Show me how"** (replaces "Skip"): bottom drawer with solution steps in-place. No tab switch.
5. **Pull-to-refresh**: new equation, same difficulty. No judgment.

### Summary Screen

```
Practice Complete!
● ● ● ◐ ●
3 solved  1 skipped  1 retry
Your streak: 3 days
[Another round]  [Done]
Skipped: 3(x + 2) = 15  → Open in Solver
```

- **Streak counter**: localStorage, daily. Small, quiet. No notifications.
- **Skipped equations**: listed with Solver links.

### Solver ↔ Practice Connection

- **Solver → Practice**: After solving: "Got it? Try a similar equation → Practice"
- **Practice → Solver**: "Show me how" drawer in-place. "Open in Solver" in summary.
- **Landing → Solver → Practice**: Solver is hero, Practice is CTA below.

---

## Camera OCR Flow (Wave 2)

**Anonymous user:** "Use camera" with "Sign up free" → OAuth modal → camera opens immediately.

**Logged-in user:**
1. Camera view (full-screen overlay mobile, modal desktop)
2. Guide frame: "Position the equation inside the frame"
3. Capture → crop (Cropper.js) → "Recognize" → Mathpix API (1-2s)
4. Result: KaTeX preview + editable text field ("Edit if not perfect")
5. "Solve" → proceeds to solver

Handwriting note: "Works best with printed text. Handwriting? You can always edit."

---

## Sessions & Persistence

**Wave 1 (localStorage):**
- Every equation → session. Sidebar: text, status, timestamp. Newest first.
- **Starring**: pin sessions to top (exam review)
- Delete → 4-second undo toast. "Clear all" with confirmation.

**Wave 2 (cloud sync):**
- Lazy sync: state change + page unload
- First login: "Sync existing sessions?" one-tap merge
- Cloud icon on synced sessions
- **Archiving**: auto-archive >60 day sessions (with confirmation). Starred exempt. Collapsed section.

**Session data:** original equation, solver state, practice difficulty/counter, status.

---

## Shared Link Page (Wave 2)

`crackthex.app/s?eq=5(2x-3)=25`

- Always Chalkboard theme. Full solution, read-only. Compact step cards.
- Two CTAs: "Try your own equation" → solver, "What is CrackTheX?" → about section
- Static/SSR — equation in URL, solver runs on page load. No login required.
- OG metadata: title = "5(2x-3) = 25 → x = 4", image = server-generated equation card in chalkboard style

---

## First-Time Experience

Three contextual hints, spread across first sessions. Each appears once, one sentence, dismissable by doing the action:

1. **Landing**: pulsing "Solve" button + "Type any equation or try our example →"
2. **First solve**: tooltip on action buttons: "Try solving it yourself — use these buttons"
3. **Practice discovery**: dot badge on Practice tab after 2-3 solves

**Help page**: accessible from settings. Static: how to solve, how to practice, what buttons do.

---

## Empty States

- **Session sidebar (no sessions)**: "No equations yet" + CTA to Practice
- **Solver (nothing entered)**: input field + 3 tappable example equation chips
- **Practice (never used)**: one-sentence explanation + difficulty selector + Start
- **AI Tutor (free user)**: example questions + soft Pro upsell

---

## Loading States

- **Solver (deterministic)**: instant (<100ms). Stagger animation IS the transition.
- **Camera OCR (1-3s)**: scanning animation (horizontal line sweep) + "Recognizing..."
- **AI responses (2-8s, Wave 3)**: typing indicator → streaming text. Timeout → retry.

---

## Navigation & Transitions

- **Tab switch**: cross-fade (200ms). Action bar morphs between Solver/Practice buttons.
- **"Show me how" drawer**: slide up 400ms, dark overlay, drag handle, swipe-down dismiss. Compact step cards inside.
- **Settings panel**: drawer from right (desktop 320px, mobile full-screen). Theme preview cards.

---

## Toast Notifications

| Type | Border | Duration | Action |
|------|--------|----------|--------|
| Success | `--success` | 3s auto | None |
| Undo | `--warning` | 4s countdown | "Undo" button |
| Error | `--error` | 5s auto | None (auto-retry) |
| Info | `--accent` | 5s auto | None |

Position: bottom-center, above mobile action bar. Max 2 stacked.

---

## Homework Copying Mitigation

- **Solver**: steps one at a time, "Show All" de-emphasized
- **Practice**: no hints. "Show me how" opens solution then generates NEW equation
- **Flow**: Practice → stuck → "Show me how" (learn) → next equation (apply)
