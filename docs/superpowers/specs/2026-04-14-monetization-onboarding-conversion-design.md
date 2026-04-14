# Monetization, Onboarding Flows & Conversion UX — Design Spec

**Date:** 2026-04-14
**Team:** Growth/Conversion Specialist (Eszter), UX Designer (Petra), Product Owner (Reka), Marketing (Andras)
**Status:** Approved (brainstorm complete)

---

## Context

CrackTheX has tiers and a growth funnel defined at a high level (see `docs/01-product-strategy.md`), but the actual conversion flow — anonymous to registered to Pro trial to paid — was not specified screen-by-screen. This spec makes it concrete: exact screen sequences, upgrade prompt copy, Polar integration decisions, and pricing.

**Key architectural decision:** Use Polar (polar.sh) as Merchant of Record instead of direct Stripe integration. Polar handles international tax compliance (EU VAT, UK VAT, US state sales tax), embedded checkout, customer portal, trials, and subscription management — built on Stripe underneath. This eliminates tax compliance burden entirely.

---

## 1. Tier Structure (Revised)

MVP launches with three tiers. Differentiation is by **usage limits**, not feature gating — all Pro/Pro Plus users get the same AI features.

| Tier | Price | AI Questions | AI Model | Key Features |
|------|-------|-------------|----------|-------------|
| **Free** (no account) | $0 | 0 | — | Deterministic solver (1-var, 2-3 var linear), basic practice mode, localStorage sessions, all themes/languages, keyboard input |
| **Free** (with account) | $0 | 0 | — | Everything above + Camera OCR + cloud session sync |
| **Pro** | 1,990 HUF / €4.99 / $4.99 /month | 50/week | Full (Sonnet) | All AI features: AI Tutor chat, "Ask AI why?", word problems, quadratic solving, adaptive practice, progress insights |
| **Pro Plus** | 2,990 HUF / €7.99 / $7.99 /month | 200/week | Full (Sonnet) | Same AI features, higher limits |

**Future (not in MVP):**
- Annual pricing (shown as "coming soon" on pricing page, not implemented)
- Credit packs
- BYOK (Bring Your Own Key)

### Three-Zone Usage Model

Each tier has a green/yellow/orange degradation model — AI never hard-cuts during homework.

| Zone | Pro | Pro Plus | Experience |
|------|-----|----------|-----------|
| **Green** | 0-50/week | 0-200/week | Full quality. Best models. No usage messaging. |
| **Yellow** | 51-60/week | 201-210/week | One-time dismissable banner: "You've used your 50 AI questions this week. 10 bonus questions available. Resets Monday." Same model quality. Upsell to Pro Plus shown. |
| **Orange** | 61-100/week | 211-400/week | Cheaper model (Haiku instead of Sonnet). Small "lite" badge on AI responses. Tooltip: "AI running in lite mode — upgrade for full quality." AI still works, never cuts off. |
| **Hard stop** | 100+/week | 400+/week | "You've reached this week's maximum. Resets [day]." Safety net for abuse/botting. |

**Weekly reset:** Every Monday at midnight (user's local time).

**Trial:** 7-day trial gives Pro Plus limits (200/week) so the student experiences the full product.

### Cost Analysis

| Tier | Revenue/month | AI cost/month (estimated) | Margin |
|------|--------------|--------------------------|--------|
| Free | $0 | $0 (no AI) | N/A |
| Pro (50/week = ~200/month) | $5.25 | ~$0.10 | 98% |
| Pro Plus (200/week = ~800/month) | $7.90 | ~$0.35 | 96% |
| Pro in orange zone (100/week, Haiku) | $5.25 | ~$0.05 extra | Negligible |

---

## 2. Two Separate Funnels

### Registration Hooks (Anonymous -> Free Account)

Registration is free and unlocks non-AI features. Triggers:

1. **Camera OCR** (primary): Student taps "Use camera" -> "Sign up free to use camera" -> after auth, camera opens immediately.
2. **Cloud sync** (secondary): After 3+ solved equations, subtle prompt in session sidebar: "Save your work across devices."
3. **Pro feature tap** (tertiary): Tapping any locked Pro feature requires registration first, then shows trial offer.

### Monetization Hooks (Free -> Pro Trial -> Paid)

Two hook types for two audiences:

**Conversion hooks** (trigger first purchase — high intent, lower frequency):
- Unsupported equation type (quadratic, trig) -> free answer shown, step-by-step is Pro
- Word problem input -> AI decomposition is Pro
- "Check my work" mode -> AI step verification is Pro
- Batch homework (photograph full page) -> Pro

**Retention hooks** (prevent churn — frequent, cumulative):
- "Ask AI why?" on solver steps -> most frequent Pro touchpoint
- Practice mistake explanation -> "Why did I get stuck?" after reveal
- Adaptive practice weakness targeting -> data-driven after 20+ equations
- Progress insights -> blurred chart teaser after sufficient data

**Acquisition hooks** (bring new users):
- Viral share with Pro teaser on shared solution pages

---

## 3. Registration Flow

**Auth method:** Google OAuth only (MVP). No email/password, no magic link, no Apple Sign-In.

**Rationale:** Hungarian schools overwhelmingly use Google Workspace. A 14-year-old already has a school Google account. One tap, done.

**Screen sequence:**

```
[Registration trigger] -> Modal overlay (not a new page):

┌─────────────────────────────┐
│                             │
│   [G] Continue with Google  │   <- Single prominent button
│                             │
│   By signing up you agree   │
│   to our Terms & Privacy    │
│                             │
│   ------- or -------        │
│                             │
│   Continue without account  │   <- De-emphasized text link
│                             │
└─────────────────────────────┘
```

- Modal overlay — student stays in context
- "Continue without account" dismisses — never blocks the student
- After Google auth: modal closes, student is back where they were, now logged in
- If trigger was camera: camera opens immediately
- If trigger was cloud sync: sessions sync silently, toast "Sessions syncing..."
- If trigger was Pro feature: registration completes -> trial offer appears (Section 5)

**First login merge:**

One-time prompt: "You have N equations saved locally. Sync them to your account?" -> [Yes] / [Not now]. "Yes" merges localStorage to cloud. "Not now" keeps both, asks again later.

**Account data collected:** Google profile name, email, avatar. No age, no role, no extra fields.

---

## 4. Upgrade Prompt Strategy — "Guided Discovery" (Approach 2)

Pro features are visible and discoverable throughout the free experience, but never block or nag. The student should think "I know that exists, and I'll try it when I need it."

### Persistent Signals (always visible, never pop up)

1. **"Ask AI why?" button on solver steps** — visible on every step card with a small lock icon. Looks like a real button, just locked. Tap -> trial/upgrade prompt.

2. **AI Tutor tab badge** — tab shows "Pro" badge next to the name. Tapping opens the tab with example questions, a description, and CTA buttons.

### Moment-of-Need Prompts (appear only at boundaries)

3. **Unsupported equation type** — student enters e.g. `x^2 - 4 = 0`. Free answer shown (nerdamer computes it). "Want to see how to get there, step by step?" with Pro CTA. Honest, not punitive — the student gets the answer, just not the walkthrough.

4. **Word problem input** — text area visible in solver input with placeholder. Typing triggers Pro prompt: "AI can break this into equations and solve each one."

5. **Practice insight teaser** — after 20+ practice equations, one-time card in practice summary: blurred progress chart + "Unlock detailed insights -> Pro". Appears once, dismissable.

6. **"Explain my mistake" in practice** — after "Show me how" reveals the solution: "Want to know why you got stuck? AI can explain your specific mistake." Subtle inline link, not a modal.

### Things That Are NOT Upgrade Prompts

- No banners on the main solver when using free features
- No "you've used X of Y free solves" counters (free tier is unlimited for supported types)
- No popup modals that interrupt flow
- No "upgrade" in the nav bar or settings

### "Someone Else Is Paying?" Button

Instead of "Ask a parent to pay" (patronizing for older students/adults), all Pro walls show:

- **Primary CTA:** "Try Pro free — 7 days"
- **Secondary link:** "Someone else is paying?"

Universal framing — covers parents, siblings, teachers, employers. No age assumption.

---

## 5. Trial Flow (Free -> Pro Trial -> Paid)

### Trial Start

Triggered at any Pro wall. If not registered, registration modal first (Section 3), then:

```
┌─────────────────────────────────────┐
│  Try CrackTheX Pro free             │
│  for 7 days                         │
│                                     │
│  ✓ AI step-by-step for any equation │
│  ✓ "Ask AI why?" on every step      │
│  ✓ AI Tutor chat                    │
│  ✓ Word problem solving             │
│  ✓ Detailed practice insights       │
│  ✓ 200 AI questions/week            │
│                                     │
│  From 1,990 Ft/month after trial    │
│  Cancel anytime — you won't         │
│  be charged.                        │
│                                     │
│  [Polar embedded checkout]          │
│  Payment info collected here.       │
│                                     │
│  Someone else is paying? ->         │
└─────────────────────────────────────┘
```

- Polar embedded checkout overlay — stays inside our app
- **Trial product:** The checkout is for **Pro** (1,990 Ft/month) by default, but the trial period grants elevated Pro Plus limits (200/week) as a trial perk. This way the student experiences the full product. After trial, if not cancelled, they auto-convert to Pro (50/week). The trial ended screen (below) and account settings both offer upgrade to Pro Plus.
- Currency auto-detected by Polar (HUF/EUR/USD based on location)
- Checkout language matches app language via `?locale=` param
- After payment info submitted -> overlay closes -> Pro unlocked immediately
- Toast: "Welcome to Pro! Your 7-day trial has started."
- The feature the student originally tried now works — immediate payoff

### During Trial

- **Day 1-4:** No banners. Let them explore. Lock icons disappear. AI features just work.
- **Day 5:** Dismissable banner: "Your Pro trial ends in 2 days"
- **Day 6:** Slightly more prominent: "Last day of your free trial tomorrow"
- **Day 7 (not cancelled):** Polar auto-charges at Pro rate (1,990 Ft). Seamless. Toast on next visit: "You're now a Pro subscriber." Limits drop from 200/week (trial) to 50/week (Pro). If the student notices, the usage bar in settings shows the new limit with a subtle "[Upgrade to Pro Plus for 200/week ->]" link. This is the natural upsell moment from Pro to Pro Plus.

### Trial End (Cancelled During Trial)

First time the student taps any Pro feature after trial expiry, dedicated "Trial Ended" screen:

```
┌─────────────────────────────────────┐
│  Your Pro trial has ended           │
│                                     │
│  During your trial you:             │
│  - Asked AI "why?" 12 times         │
│  - Solved 3 quadratic equations     │
│  - Had 2 AI Tutor conversations     │
│                                     │
│  Continue with Pro  1,990 Ft/month  │
│  [Subscribe]                        │
│                                     │
│  Need more? Pro Plus  2,990 Ft/mo   │
│  [Subscribe]                        │
│                                     │
│  Someone else is paying? ->         │
│                                     │
│  [Not now — continue with Free]     │
└─────────────────────────────────────┘
```

- Shows personalized usage stats from trial — makes value concrete
- Offers both Pro and Pro Plus (student can self-select based on trial usage)
- "Not now" -> back to free, lock icons return
- This screen appears **once**. After dismissal, normal Pro walls (Section 4) return.

### Cancellation During Trial

- Student goes to account settings -> "Pro Trial - Ends April 21 - [Manage billing ->]"
- "Manage billing" -> Polar customer portal (pre-authenticated link)
- After cancellation: Pro features remain active until trial end date, then lock

---

## 6. Parent / Third-Party Payment Handoff

### Trigger

Student taps "Someone else is paying?" at any Pro wall or trial screen.

### Step 1: Share Screen (In-App Modal)

```
┌─────────────────────────────────────┐
│  Send a payment link                │
│                                     │
│  Share this link with the person    │
│  who'll pay for your Pro access.    │
│                                     │
│  [crackthex.app/pay/abc123] [Copy]  │
│                                     │
│  Or send directly:                  │
│  [parent@email.com]                 │
│  [Send email]                       │
│                                     │
│  The link is valid for 7 days.      │
└─────────────────────────────────────┘
```

- Copy link -> student sends via WhatsApp, Messenger, etc.
- Email option -> server sends branded email with the link
- Link = unique Polar checkout session URL tied to student's account

### Step 2: Payment Page (`/pay/[token]`)

What the payer sees:

```
┌─────────────────────────────────────┐
│  CrackTheX Pro                      │
│                                     │
│  [Student name] would like          │
│  access to CrackTheX Pro.           │
│                                     │
│  What they get:                     │
│  ✓ AI step-by-step for any equation │
│  ✓ AI Tutor chat for homework help  │
│  ✓ Word problem solving             │
│  ✓ Detailed progress insights       │
│                                     │
│  1,990 Ft/month (Pro)               │
│  2,990 Ft/month (Pro Plus)          │
│  First 7 days free — cancel anytime │
│                                     │
│  [Polar embedded checkout]          │
│                                     │
│  Questions? -> crackthex.app/parents│
└─────────────────────────────────────┘
```

- Self-contained page — payer doesn't need an account
- Payer chooses Pro or Pro Plus
- After payment -> student's account upgraded immediately
- Student sees toast on next visit: "Pro activated! Someone subscribed for you."
- Payer's email = Polar billing contact (receives receipts, manages subscription via Polar portal)

### Step 3: Ongoing Billing Relationship

- **Payer** manages subscription via Polar portal (link in receipt emails)
- **Student** sees subscription status in settings but cannot manage billing
- Student's settings: "Pro - Paid by [payer email] - Contact them to manage"
- If payer cancels -> student's Pro ends at period end -> normal downgrade

### `/parents` Landing Page (Cold Parent Path)

For parents who discover CrackTheX independently (less common):

- Headline: "Your child's math homework helper"
- Brief product explanation
- Interactive demo (solve 2x+3=7)
- What Pro adds (feature list)
- Pricing + Polar checkout
- Trust signals: "Built by a Hungarian developer and parent", EU data, GDPR, no ads
- "Start free trial" -> parent creates Google account -> subscription -> enters child email to link

---

## 7. Pricing Page (`/pricing` + `?ref=parent`)

### Default View (Student-Facing)

Two plan cards side by side: Free and Pro (with Pro Plus as upgrade within Pro card or as a third card).

**Free card:** Features list + "Current plan" if on free.

**Pro card (highlighted):**
- 1,990 Ft/month / €4.99 / $4.99
- 7 days free
- All AI features, 50 questions/week
- [Try free for 7 days]
- Someone else is paying? ->

**Pro Plus card:**
- 2,990 Ft/month / €7.99 / $7.99
- All AI features, 200 questions/week
- "For heavy users — exam prep, daily homework"
- [Try free for 7 days]
- Someone else is paying? ->

**Below cards:**
- "Annual plan coming soon — save 33%" (not implemented, just teaser)
- "Currency shown based on your location. Also available in EUR and USD." — tap cycles through currencies

### Parent View (`/pricing?ref=parent`)

Same page, these elements change:

| Element | Student view | Parent view |
|---------|-------------|-------------|
| Headline | "Pick your plan" | "Pick a plan for your child" |
| Pro CTA | "Try free for 7 days" | "Start your child's free trial" |
| Below cards | Annual teaser | Parent trust section |
| "Someone else is paying?" | Shown | Hidden (parent IS the payer) |

**Parent section** (only visible with `?ref=parent`):
- "Why parents choose CrackTheX" — tutoring value prop, progress insights (coming soon), safety/privacy/GDPR, cancel anytime

### Currency Behavior

- Polar auto-detects location -> shows HUF for Hungary, EUR for EU, USD for others
- Small text link "Also available in EUR and USD" -> tap cycles through the three
- No dropdown picker — just cycle link

### CTA Button Behavior

- Not logged in -> registration modal -> trial checkout
- Logged in, no trial -> trial checkout directly
- On trial -> "You're on a Pro trial (X days left)"
- Subscribed -> "You're on Pro" + "[Manage billing ->]"

---

## 8. Polar Integration Architecture

### Products in Polar

| Product | Type | Prices | Trial | Benefits |
|---------|------|--------|-------|----------|
| **CrackTheX Pro Monthly** | Recurring (monthly) | 1,990 HUF / €4.99 / $4.99 | 7 days, payment upfront, abuse prevention on | Feature flag: `pro_access` |
| **CrackTheX Pro Plus Monthly** | Recurring (monthly) | 2,990 HUF / €7.99 / $7.99 | 7 days, payment upfront, abuse prevention on | Feature flag: `pro_access`, `pro_plus_limits` |

Two products, three currencies each, same trial config.

### Feature Gating

```
Request -> check customer state -> has `pro_access` benefit?
  -> yes -> check `pro_plus_limits` for limit tier -> serve AI
  -> no -> show upgrade prompts (Section 4)
```

- On login: fetch Polar customer state via API, cache in session
- Webhook `customer.state_changed` -> update cached state
- Server-side check on AI API routes (never trust client-only gating)
- Client-side check for UI (lock icons, Pro badges) — read from session

### Polar External ID Mapping

- Our user ID (from NextAuth Google OAuth) = Polar `externalId`
- On first registration: create Polar customer with `externalId` = our user ID
- All subsequent lookups by `externalId`

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/checkout` | Create Polar checkout session (trial start or re-subscribe) |
| `POST /api/checkout/pay-link` | Create checkout session for third-party payment |
| `GET /api/portal` | Redirect to Polar customer portal (pre-authenticated) |
| `POST /api/webhooks/polar` | Receive Polar webhook events, update subscription state |
| `GET /api/subscription/status` | Current user's Pro status, tier, usage counts for client |

### Webhook Events

| Event | Action |
|-------|--------|
| `subscription.active` | Set user as Pro/Pro Plus, record trial start |
| `subscription.canceled` | Mark pending cancellation, Pro remains until period end |
| `subscription.revoked` | Remove Pro access immediately |
| `order.paid` | Log payment, update billing status |
| `customer.state_changed` | Refresh cached customer state |

### "Someone Else Is Paying" Flow (Technical)

- Student triggers `/api/checkout/pay-link` -> creates Polar checkout session with student's `externalId` as customer
- Returns unique URL: `/pay/[session-id]`
- Payer opens URL -> Polar embedded checkout
- On completion -> webhook fires -> student's account gets `pro_access`
- Payer email stored as Polar billing contact

### AI Usage Tracking

- Counter stored in database: `user_id`, `week_start`, `question_count`
- Incremented on each AI API call (server-side, not client)
- Weekly reset: Monday midnight UTC (or user local time if we track timezone)
- Tier limits checked before serving AI response:
  - Green zone: serve with primary model (Sonnet)
  - Yellow zone: serve with primary model, include `zone: "yellow"` in response for client banner
  - Orange zone: serve with cheaper model (Haiku), include `zone: "orange"` for client badge
  - Hard stop: return 429 with reset time

---

## 9. Account Settings & Subscription Management

### Settings Page

Accessible from gear icon. Contains:

- **Account section:** Avatar, name, email, "Signed in with Google"
- **Plan section:** Plan card showing current tier, price, renewal date, manage billing link
- **AI Usage section:** Visual bar showing weekly usage (green/yellow/orange zones)
- **Preferences:** Language selector, theme selector
- **Footer:** Privacy policy, Terms, Help, Delete my account

### Plan Card Variants

| State | Display |
|-------|---------|
| Free | "Free plan" + [Upgrade to Pro ->] |
| Pro (self-paying) | "Pro - 1,990 Ft/month - Renews May 14" + [Manage billing ->] + [See plans ->] |
| Pro (someone else paying) | "Pro - Paid by anna@gmail.com - Renews May 14" + "Contact them to manage billing" |
| Pro trial | "Pro trial - 4 days left - Converts to 1,990 Ft/month May 14" + [Manage billing ->] |
| Pro Plus | Same patterns as Pro with Pro Plus label and pricing |

### AI Usage Bar

Green zone: `████████████░░░░░░░░ 34 of 50 · Resets Monday`

Yellow zone: `████████████████████▓▓ 54 of 50 (+4 bonus) · 10 bonus questions · Resets Monday · [Need more? -> Pro Plus]`

Orange zone: `████████████████████▓▓▓▓░░ 72 — lite mode · AI running on lite model · Resets Monday · [Upgrade for full quality ->]`

### Billing Management

"Manage billing ->" opens Polar customer portal in new tab (pre-authenticated via Polar API). Handles invoices, payment method updates, cancellation, subscription history. We build none of this — Polar covers it.

---

## 10. Changes to Existing Docs

This spec supersedes or modifies several sections in the existing documentation:

### `docs/01-product-strategy.md`

- **Tier Structure:** Replace current Free/Pro table with revised three-tier (Free/Pro/Pro Plus) with usage limits instead of feature gating
- **Pricing:** Update from ~$10/month to 1,990 HUF / €4.99 / $4.99 (Pro) and 2,990 HUF / €7.99 / $7.99 (Pro Plus)
- **Accounts & Onboarding:** Update to reflect Google OAuth only, Polar MoR instead of Stripe, "Someone else is paying?" instead of explicit parent flow
- **Growth Funnel:** Update to reflect three-zone usage model and guided discovery approach

### `docs/03-ux-specification.md`

- **Landing Page:** Add registration modal overlay spec, "Someone else is paying?" copy
- **Solver Tab:** Add "Ask AI why?" lock icon spec, unsupported equation upgrade prompt spec, word problem input gate
- **Practice Mode:** Add practice insight teaser spec, "explain my mistake" upgrade prompt
- **Camera OCR Flow:** Update to reflect Google OAuth registration modal
- Add new sections: Pricing page, Trial flow screens, Trial ended screen, Parent payment handoff, Account settings with plan/usage display

### `docs/05-phasing.md`

- **Wave 2:** Registration now uses Google OAuth only (not OAuth + email/password)
- **Wave 3:** Replace "Stripe integration" with "Polar integration" throughout. Add Pro Plus tier. Add three-zone usage model.
- Update MVP feature list items 11, 15 accordingly

---

## 11. Open Questions (To Resolve Before Implementation)

1. **Weekly reset day:** Monday midnight UTC, or Monday midnight in user's timezone? UTC is simpler but means Hungarian students reset at 1-2 AM Tuesday. Timezone-aware is better UX but more complex.
2. **Trial tier:** Trial gives Pro Plus limits (200/week). Should trial always default to Pro Plus, or should the student choose Pro vs Pro Plus before starting trial? Recommendation: always Pro Plus — let them experience the best, then choose.
3. **Pay link expiry:** 7 days. Is this the right duration? Could be shorter (3 days) to create urgency or longer (14 days) for busy parents.
4. **Model selection in orange zone:** Haiku is the current plan. Should this be configurable per-feature? (e.g., AI Tutor can stay on Sonnet since it's conversational, but "Ask AI why?" drops to Haiku since it's a shorter response)
5. **Upgrade path UX:** When a Pro user wants Pro Plus, do they go through Polar portal or do we handle in-app? Polar supports subscription upgrades with proration — check `docs.polar.sh/guides/subscription-upgrades` for implementation.
