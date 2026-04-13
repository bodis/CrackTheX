# Design System

## Themes

Three themes: **Chalkboard** (default), **Light**, **Dark**.

| Theme | Purpose | When |
|-------|---------|------|
| **Chalkboard** | Brand identity, default, screenshots, marketing | Default for new users |
| **Light** | Bright environments, accessibility, classroom projectors | Daytime, classrooms |
| **Dark** | Low light, OLED battery saving, evening use | Night, personal preference |

**First visit = Chalkboard always** (brand impression). After first session, prompt system theme preference. Manual override persisted in localStorage.

---

## Color Tokens

Each theme defines these semantic tokens:

| Token | Purpose |
|-------|---------|
| `--bg-primary` | Main page background |
| `--bg-secondary` | Sidebar, panels, elevated areas |
| `--bg-card` | Step cards, practice cards |
| `--bg-card-hover` | Card hover state |
| `--bg-input` | Input fields |
| `--bg-overlay` | Modal backdrops, drawers |
| `--text-primary` | Main body text |
| `--text-secondary` | Descriptions, labels, meta |
| `--text-muted` | Placeholder, disabled text |
| `--accent` | Primary accent (buttons, active states, links) |
| `--accent-hover` | Accent hover state |
| `--accent-subtle` | Accent backgrounds (badges, tags) |
| `--border` | Card borders, dividers |
| `--border-accent` | Highlighted borders (active card, focused input) |
| `--success` | Correct answers, solved state |
| `--warning` | Skipped, retry |
| `--error` | Parsing errors |
| `--glass-bg` | Glassmorphism background |
| `--glass-border` | Glassmorphism border |
| `--glass-blur` | Backdrop blur amount |

### Chalkboard

```
--bg-primary:       #1a3320
--bg-secondary:     #1e3a25
--bg-card:          rgba(255, 255, 255, 0.06)
--bg-card-hover:    rgba(255, 255, 255, 0.09)
--bg-input:         rgba(255, 255, 255, 0.08)
--bg-overlay:       rgba(10, 20, 12, 0.7)
--text-primary:     #e8e4d9          (warm off-white, like chalk)
--text-secondary:   rgba(232, 228, 217, 0.65)
--text-muted:       rgba(232, 228, 217, 0.35)
--accent:           #dcc050          (chalk yellow)
--accent-hover:     #e8cf6a
--accent-subtle:    rgba(220, 192, 80, 0.15)
--border:           rgba(255, 255, 255, 0.10)
--border-accent:    rgba(220, 192, 80, 0.40)
--success:          #6fcf7d          (soft green)
--warning:          #e8a44c          (warm orange)
--error:            #d4534a          (muted red)
--glass-bg:         rgba(30, 58, 37, 0.65)
--glass-border:     rgba(255, 255, 255, 0.08)
--glass-blur:       12px
```

### Light

```
--bg-primary:       #f8f8f6          (warm off-white)
--bg-secondary:     #f0f0ec
--bg-card:          #ffffff
--bg-card-hover:    #fafafa
--bg-input:         #ffffff
--bg-overlay:       rgba(0, 0, 0, 0.3)
--text-primary:     #1a1a1a
--text-secondary:   #555555
--text-muted:       #999999
--accent:           #2563eb          (clean blue)
--accent-hover:     #1d4ed8
--accent-subtle:    rgba(37, 99, 235, 0.08)
--border:           #e5e5e0
--border-accent:    rgba(37, 99, 235, 0.40)
--success:          #16a34a
--warning:          #d97706
--error:            #dc2626
--glass-bg:         rgba(255, 255, 255, 0.75)
--glass-border:     rgba(0, 0, 0, 0.06)
--glass-blur:       10px
```

### Dark

```
--bg-primary:       #111111
--bg-secondary:     #1a1a1a
--bg-card:          rgba(255, 255, 255, 0.05)
--bg-card-hover:    rgba(255, 255, 255, 0.08)
--bg-input:         rgba(255, 255, 255, 0.07)
--bg-overlay:       rgba(0, 0, 0, 0.6)
--text-primary:     #e5e5e5
--text-secondary:   rgba(229, 229, 229, 0.60)
--text-muted:       rgba(229, 229, 229, 0.30)
--accent:           #a78bfa          (violet)
--accent-hover:     #c4b5fd
--accent-subtle:    rgba(167, 139, 250, 0.12)
--border:           rgba(255, 255, 255, 0.08)
--border-accent:    rgba(167, 139, 250, 0.40)
--success:          #4ade80
--warning:          #fbbf24
--error:            #f87171
--glass-bg:         rgba(25, 25, 25, 0.70)
--glass-border:     rgba(255, 255, 255, 0.06)
--glass-blur:       12px
```

---

## Typography

| Role | Font | Weight | Use |
|------|------|--------|-----|
| Headings | Figtree | 600, 700 | Page titles, section headings, button labels |
| Body | Figtree | 400, 500 | Descriptions, rule labels, UI text |
| Equations (input) | JetBrains Mono | 400 | Equation input field, raw LaTeX |
| Equations (display) | KaTeX default | — | Rendered math (KaTeX handles this) |

### Type Scale (rem, 16px root)

| Token | Size | Use |
|-------|------|-----|
| `text-xs` | 0.75rem (12px) | Badges, timestamps, meta |
| `text-sm` | 0.875rem (14px) | Secondary text, rule descriptions |
| `text-base` | 1rem (16px) | Body text, button labels |
| `text-lg` | 1.125rem (18px) | Step card equations (early steps) |
| `text-xl` | 1.25rem (20px) | Step card equations (later steps) |
| `text-2xl` | 1.5rem (24px) | Solution equation (x = 4) |
| `text-3xl` | 1.875rem (30px) | Hero equation on landing |

Equation visual weight progression: `text-lg` for early steps → `text-xl` for last 1-2 steps → `text-2xl` for solution. Subtle, not staircase.

---

## Spacing

4px base unit:

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Inline gaps, small padding |
| `space-3` | 12px | Compact card padding |
| `space-4` | 16px | Standard padding, gaps |
| `space-6` | 24px | Section gaps, card padding |
| `space-8` | 32px | Major section separation |
| `space-12` | 48px | Page-level vertical spacing |

Step card connector height: `space-4` (early steps) → `space-2` (near solution) — visual compression.

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 6px | Buttons, badges, inputs |
| `radius-md` | 10px | Cards, panels |
| `radius-lg` | 16px | Modals, large containers |
| `radius-full` | 9999px | Pill buttons, chips |

---

## Component Schemas

### Step Card

- Background: `--bg-card` with `--glass-bg` + `--glass-blur`
- Border: `1px solid --border` (normal), `--border-accent` (active/latest)
- Radius: `radius-md`. Padding: `space-6`.
- Badge: `--accent-subtle` bg, `--accent` text, `radius-sm`, `text-xs`
- Rule label: `--text-secondary`, `text-sm`, tappable → concept card
- Equation: KaTeX, `text-lg` → `text-2xl` progression
- Shadow: subtle, theme-appropriate

**Solved card:** `--success` border. Badge with checkmark. Equation `text-2xl`, `font-weight: 600`. "Verified correct ✓" in `--success`. Celebration effect:
- Chalkboard: chalk-dust particles (white/yellow dots floating upward, 2-3s)
- Light: `--success` bottom border 3px, fade-in
- Dark: `box-shadow: 0 0 20px rgba(167, 139, 250, 0.3)` violet glow

**Connector:** `2px solid --border`, centered vertical line. Rule text on `--accent-subtle` pill. Height decreases toward solution.

### Action Button Bar

- Background: solid `--bg-card` (not glass — clear tap targets)
- Border: `1px solid --border`. Radius: `radius-sm`.
- Padding: `space-2` vertical, `space-3` horizontal
- Active/hover: `--accent-subtle` bg, `--border-accent` border
- Disabled: `0.35 opacity`, no pointer events
- Press: `scale(0.95)` for 100ms

**Smart suggestion popover:** Below tapped button. Suggestion chips: `--accent-subtle` bg, `--accent` text, `radius-full` pill. Custom input field. Scale-in animation (100ms).

### Practice Card

- Progress dots: `--success` (solved), `--warning` (skipped), `--border` (remaining)
- Difficulty pills: `--accent` bg (active), `--bg-card` (inactive)
- "Check": `--accent` bg, white text, `radius-sm`, prominent
- "Show me how": `--text-secondary`, `text-sm`, underline on hover

**"Show me how" drawer:** Slides from bottom (60-70% screen). `--bg-secondary` + `--glass-blur`. Drag handle. Compact step cards (read-only). "Got it" dismiss button.

### Session Sidebar Item

- Star icon: `--accent` (starred), `--text-muted` (not). Tap to toggle.
- Equation: `--text-primary`, `text-sm`, truncated with ellipsis
- Status + time: `--text-muted`, `text-xs`
- Active: `--accent-subtle` bg, `--border-accent` left border 3px
- Hover: `--bg-card-hover`
- Mobile: swipe-left to delete

### Input Area

- Input: `--bg-input`, `--border`, `radius-sm`, `text-base`, JetBrains Mono
- Camera link: `--text-secondary`, `text-sm`, right-aligned. Anonymous: `--text-muted` + tooltip
- Preview: `--bg-secondary`, centered KaTeX, `text-lg`
- Solve button: `--accent` bg, white text, full width, `radius-sm`, `font-weight: 600`
- Focus: `--border-accent` + subtle `box-shadow` glow

### Settings Panel

- Right drawer: 320px desktop, full-screen mobile
- Theme cards: mini equation preview in each theme's colors. Active = checkmark + `--accent` border. Tap to switch.
- Language: dropdown. Change re-renders all visible strings immediately.
- Account: adapts — sign up/log in (anonymous) or profile/subscription (logged in)
- Help links: How to use, Privacy policy, About, Version

---

## Glassmorphism

**Applies to:** step cards, practice card, session sidebar, popovers, drawers, modals.

**Does NOT apply to:** top bar (solid), action buttons (solid for tap clarity), input fields (solid for legibility), landing hero.

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
```

**Performance fallback:** `prefers-reduced-motion` → solid semi-transparent backgrounds instead of blur.

---

## Animation Tokens

| Token | Value | Use |
|-------|-------|-----|
| `duration-fast` | 100ms | Button press, micro-feedback |
| `duration-normal` | 200ms | Popovers, tooltips, tab cross-fade |
| `duration-slow` | 400ms | Theme transitions, step entrance, drawer slides |
| `duration-stagger` | 150ms | Delay between cascading step cards |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering screen |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Theme switching, position changes |

### Key Animations

1. **Button feedback**: scale(0.95) + ripple + haptic (mobile)
2. **Step card entrance**: slide up 20px + fade in, `duration-slow`, `ease-out`. Connector draws first.
3. **Term-change highlighting**: brief glow on moved terms
4. **Error states**: wavy underline (spell-check style)
5. **Practice transitions**: card slides out, new slides in. Optional swipe-right gesture.
6. **Theme switch**: 400ms all color properties, `ease-in-out`

---

## Accessibility

### Color Contrast (WCAG AA)

- Chalkboard: chalk-white on deep green ~7:1 ✓
- Light: near-black on off-white ~15:1 ✓
- Dark: light gray on near-black ~12:1 ✓
- Status colors always paired with icons/text, never color-alone

### Keyboard Navigation

- All elements focusable with Tab
- Action buttons: arrow keys within bar
- Enter/Space activates buttons
- Escape closes popovers, drawers, modals
- Focus ring: `2px solid --accent`, `2px offset`, visible in all themes

### Screen Readers

- Step cards: `role="list"` + `role="listitem"`. "Step 1: Divide both sides by 5. Equation: 2x minus 3 equals 5"
- Action buttons: `aria-label` with full descriptions
- Dimmed buttons: `aria-disabled="true"` with reason
- Practice progress: "Equation 3 of 5, 2 correct, 0 skipped"
- KaTeX: MathML enabled for textual equation representation

### Reduced Motion

`prefers-reduced-motion: reduce` → all animations disabled, blur → solid backgrounds, instant transitions, no particle effects.

### Touch Targets

Minimum 44x44px for all interactive elements (WCAG mobile guideline). Action buttons: 44px height minimum.
