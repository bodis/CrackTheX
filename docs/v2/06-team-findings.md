# Team Simulation Findings

This spec was refined through 10 rounds of simulated team conversation with 9 stakeholders:

| Role | Name | Background |
|------|------|-----------|
| Primary school math teacher | Katalin | 18 years teaching ages 10-14. Pragmatic, focused on fundamentals. |
| High school math teacher | Gergő | Ages 14-18 at a gimnázium. Enthusiastic about tech tools. |
| Struggling student | Bence | 15, 9th grade. Uses phone for everything. Won't pay for math apps. |
| Strong student | Lilla | 17, 11th grade. Preparing for university. Wants efficiency. |
| Parent | András | Father of two (12, 16). IT manager. Frustrated with tutor costs. |
| Sales & Marketing | Réka | SaaS marketing. Worked on edtech. Thinks in funnels and CAC. |
| UI/UX Lead | Dávid | Product designer at fintech. Obsessed with onboarding. |
| Edtech Designer | Petra | Senior designer at edtech startup (joined Round 6). Cognitive load, micro-interactions. |
| Mediator | Zsófi | Former teacher turned edtech consultant. |

Rounds 1-4: strategy & product shape. Rounds 5-6: UX deep-dive. Rounds 7-8: scenario-based discovery. Rounds 9-10: design system & visual polish.

---

## Round 1 — Core Value & Product Shape
1. **Buyer ≠ user**: Parents pay, students use. Two-path onboarding and parent dashboard added to MVP.
2. **Word problems are the killer feature**: For struggling students AND advanced students. Lead marketing feature.
3. **Practice mode → MVP**: Basic deterministic practice (free, no AI cost) transforms product from "calculator" to "tutor."
4. **Two tiers, not four**: Simplified to Free + Pro. Pricing page shows two options.
5. **Free tier must be genuinely good**: No nagware. Investment in age-based growth funnel.

## Round 2 — Onboarding & Monetization
6. **Two-path onboarding**: Students → instant solve (no signup). Parents → demo dashboard + pricing.
7. **Parent linking is optional**: Supports involved parents, hands-off parents, and independent teens equally.
8. **7-day free trial**: Lower barrier than credit packs. Credit packs deferred to post-launch.
9. **Homework copying mitigation via UX**: One-step reveal, no hints in practice, practice→solver→practice flow.
10. **$10/month Pro pricing**: Less than one hour of tutoring (10,000 HUF). No-brainer for parents.

## Round 3 — Differentiation & Growth
11. **Differentiation vs Photomath is clear**: Interactive, AI-tutored, verified, Hungarian-first, parent visibility, word problems.
12. **Competitive tagline**: "Photomath shows you the answer. CrackTheX teaches you how to get there."
13. **Acquisition is word-of-mouth**: No paid ads. Students find through peers, parents through Facebook groups.
14. **Practice mode needs structured templates**: Three levels map to different equation structures, not just bigger numbers.
15. **Economics are favorable**: 10K users / 2% conversion = ~$2K revenue vs ~$150 infrastructure.

## Round 4 — Shipping & Practical Decisions
16. **Browser-first, mobile-friendly**: Not mobile-only. Students use phones, tablets, and laptops.
17. **Camera OCR is the registration hook**: Free with account. Best conversion trigger.
18. **Ship in waves**: Wave 1 (solver), Wave 2 (auth + OCR), Wave 3 (AI + billing), Wave 4 (parent dashboard).
19. **No parallel v1**: Clean cut to v2. No maintaining two stacks.
20. **General-purpose AI prompts for MVP**: No teacher-mandated pedagogy. Teacher-configurable style is Phase 3+.
21. **Platform name deferred**: CrackTheX is the only brand for now.
22. **If it fails, investment isn't wasted**: Shared platform layer serves study-helper. Code is portfolio.

## Round 5 — UX Deep-Dive: Waves 1-2
23. **Product IS the landing page**: Hero = equation input with pre-filled example. Below fold = parent content.
24. **Action buttons enforce algebraic rules**: Both sides always. Invalid moves impossible.
25. **Valid-but-inefficient moves are not errors**: Equation updates validly.
26. **"Show all" switches to read-only**: Stagger animation, "Try again" offered.
27. **Alternative paths are gentle suggestions**: One-line + preview. One tap to take.
28. **Practice sessions are 5 equations**: Summary screen after each set.
29. **"Show me how" replaces "Skip"**: In-place drawer. No tab switch.
30. **Camera flow: capture → crop → recognize → edit → solve**: Editable field = safety net.
31. **Session merge on first login**: One-tap merge of localStorage history.

## Round 6 — UX Refinement (with Petra)
32. **Visual progress compression**: Connector lines shorten as steps advance.
33. **Equation visual weight increases toward solution**: `x = 4` feels *arrived at*.
34. **Progressive language in rules**: "First..." → "Almost there..." → "Solution found."
35. **Term-change highlighting**: Moved terms glow briefly.
36. **Theme-specific solved celebrations**: Chalk dust / green underline / violet glow.
37. **Smart suggestions on action buttons**: Context-aware number options. One-tap.
38. **Conditional button states**: Expand/Simplify dimmed when not applicable.
39. **"I think it's..." replaces "Rewrite"**: Student proposes, app verifies.
40. **3+2 difficulty progression**: First 3 at level, last 2 one up.
41. **Quiet streak counter**: localStorage, daily, no notifications.
42. **Solver ↔ Practice cross-promotion**: Natural flow between features.
43. **Fixed action bar at bottom on mobile**: Thumb zone.
44. **Micro-interactions**: Ripple, scale, slide-in, connector draw, swipe.

## Round 7 — Use Case Scenarios: Discovery
45. **Concept cards → Wave 1**: Tappable rule explanations. "Confused in class" scenario.
46. **Session starring → Wave 1**: Pin for exam review.
47. **Shareable links → Wave 2**: Viral mechanic. OG preview.
48. **Topic-based practice filters → Wave 2**: Matches how teachers assign tests.
49. **Trust signals + privacy → Wave 1**: Parents check this first.
50. **Multi-equation OCR → Phase 2**: Entire homework page.
51. **Quick check / batch → Phase 2**: Multiple equations, all answers.
52. **Family plan → Phase 2**: One sub, 2-4 children.
53. **Word problem annotations need "why"**: Reasoning for each step.

## Round 8 — Use Case Scenarios: Edge Cases & Growth
54. **Shared link OG preview → Wave 2**: Equation card for social sharing.
55. **Session archiving → Wave 2**: Auto-archive, starred exempt.
56. **Inactivity nudge → Wave 1**: Rule-based, 5-6 rules. Unfreezes stuck students.
57. **Progressive button labels → Wave 1**: Full text → icons. Progressive disclosure.
58. **Graceful edge cases → Wave 1**: Every unsupported type = Pro upsell.
59. **Beginner difficulty → Wave 2**: Single-step, ages 10-12.
60. **Presentation mode → Phase 2**: Fullscreen, spacebar advance.
61. **Error pattern detection → Phase 2**: Pattern matching on action history.
62. **Practice break suggestion → Phase 2**: Declining accuracy → "take a break."
63. **Dependent/contradictory systems → Wave 2**: Infinite/no solutions.

## Round 9 — Design System
64. **Three themes: Chalkboard (default), Light, Dark**: Renamed Whiteboard → Light.
65. **First visit = Chalkboard always**: Brand impression. System preference after.
66. **Full color palettes**: 20 semantic tokens per theme defined.
67. **Typography**: Figtree UI, JetBrains Mono input, KaTeX display. Scale 12-30px.
68. **Spacing**: 4px base unit. Tokens from 4px to 48px.
69. **Component schemas defined**: Step card, action bar, practice card, sidebar item, input area, settings panel.
70. **Glassmorphism codified**: Where it applies/doesn't. Performance fallback.
71. **Animation tokens**: 100ms/200ms/400ms/150ms stagger. Standard easing curves.

## Round 10 — States, Flows & Polish
72. **First-time experience**: 3 contextual hints, spread across sessions. Each once, one sentence.
73. **Empty states designed**: Sidebar, solver, practice, AI tutor. Each invites action.
74. **Loading states**: Solver instant. OCR scanning animation. AI typing indicator + streaming.
75. **Navigation transitions**: Tab cross-fade, drawer slide-up, settings drawer right.
76. **Settings panel**: Theme preview cards, language dropdown, account section.
77. **Toast system**: 4 types (success/undo/error/info), bottom-center, max 2 stacked.
78. **Accessibility**: WCAG AA contrast, full keyboard nav, screen reader support, reduced motion, 44px touch targets.
79. **Shared link page**: Standalone, Chalkboard always, read-only, OG image generation.
80. **Help page**: Static, 3 sections, accessible from settings.
