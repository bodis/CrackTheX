---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflowComplete: true
inputDocuments:
  - "_bmad-output/brainstorming/brainstorming-session-2026-02-15.md"
  - "external_idea_20260222.md"
date: "2026-02-22"
author: "Bodist"
---

# Product Brief: study-helper

## Executive Summary

study-helper is a co-teaching language learning platform that helps students
practice curriculum topics — vocabulary, grammar, and comprehension — in the
sequence their class is actually working through them. Content is initially
organized around teaching books as a familiar scaffold, but the long-term
value is community-curated material: the best practice resources for each
topic, refined by real usage across classrooms.

The project begins with a focused Pre-Mini PoC (German language, one family,
7-10 days) to validate the core student learning experience, then grows into
a multi-role platform serving Hungarian schools and eventually a globally
reusable content layer for standardized curriculum systems.

---

## Core Vision

### Problem Statement

Students preparing for language tests in Eastern European schools have no
lightweight tool that mirrors where they actually are in their curriculum.
Generic tools (Quizlet, Duolingo) offer isolated practice but ignore the
book their class is working through, the grammar introduced in that chapter,
and what's actually on the test next Monday. The result: students either
avoid preparation entirely or use tools that don't match their immediate need.

### Problem Impact

- Students practice the wrong things — or nothing at all — before tests
- Parents spend evenings manually quizzing their children
- There is no trusted, community-validated source for "the best way to
  practice Chapter 5 of this textbook"
- The gap between what the class is currently studying and what
  students can practice independently goes unfilled

### Why Existing Solutions Fall Short

| Tool              | Gap                                                          |
|-------------------|--------------------------------------------------------------|
| Quizlet           | Generic flashcards, no curriculum sequence or grammar context |
| Duolingo          | Not aligned to school textbooks or test preparation          |
| Google Classroom  | Communication layer only, no learning mechanics              |
| Tutors            | Expensive, unavailable 24/7, not scalable                    |

None of these understand that a student has a test on a specific chapter
of their assigned textbook and needs to practice exactly what was introduced
there — with intelligent feedback that goes beyond right/wrong.

### Proposed Solution

A platform where learning content is organized around curriculum topics,
initially scaffolded by teaching books and progressively enriched by
community curation. Each lesson unit covers the vocabulary and grammar
introduced in that topic, with practice questions that combine both in
context.

Students start with their exact current chapter. Over time, the platform
accumulates community-validated best-practice materials per topic —
eventually transcending any single book.

**Growth path:**
Family → Kids' class → School → School network → Global curriculum layer

**Development phases:**
- **Pre-Mini PoC** (now): German-only, student-only, validate core
  learning experience with one family in 7-10 days
- **Full PoC** (next): Add parent visibility, light teacher involvement,
  multi-subject, content creation pipeline
- **Beyond**: Multi-school network, community curation mechanics,
  book-agnostic topic assembly, international curriculum support

### Key Differentiators

1. **Curriculum-topic alignment** — content mirrors the actual sequence
   of the teaching book, so students practice exactly what's relevant now
2. **Community content flywheel** — usage generates feedback, feedback
   drives curation, curation improves outcomes, better outcomes attract
   more usage; the best material per topic rises to the top over time
3. **Trust-based growth** — distribution starts with direct school
   relationships (family → class → school), where teacher and parent
   trust carries more weight than any marketing
4. **Designed for standardized curriculum systems** — built specifically
   for school systems where the textbook is law; the model travels to
   any country with assigned curriculum books

---

## Target Users

> **Phase note:** Phase 1 (Pre-Mini PoC) has one active user type: the
> student. Parents and teachers enter in Phase 2 with progressively
> expanding roles.

---

### Primary Users

#### Persona 1: The Student — Zsófi (10) and Bence (12)

**Context:**
Two siblings in a Hungarian school, working through a German language
textbook (Schritte International or similar). Zsófi is in 4th grade,
Bence in 6th. They prepare for tests occasionally — sometimes alone
with printed sheets, sometimes with a parent quizzing them out loud.
Neither particularly enjoys it. Both have a phone and a school laptop.

**How they experience the problem:**
- Test preparation is reactive — they do it the night before, if at all
- Printed vocabulary lists feel like more homework
- No way to self-check without a parent being present
- Getting quizzed by a parent creates pressure and friction for both sides

**What they need:**
- A fast way to check "do I actually know this?" without asking anyone
- Feedback that feels encouraging, not like another red pen
- Sessions short enough that it doesn't feel like studying (5-10 min max)
- Novelty at first; habit-forming hooks for sustained use

**Success moment:**
*"I got 8/10 — I think I'm ready."* Or even: *"I got 4/10, now I know
exactly which words to review."* Either way: independent confidence,
without a parent in the loop.

**Open question this PoC must answer:**
Will they return voluntarily after the initial novelty wears off?
This is the core validation hypothesis of Phase 1.

---

### Secondary Users

#### Persona 2: The Parent — the Engaged-but-Overwhelmed Parent (Phase 2)

**Context:**
A parent who genuinely wants their child to succeed and feels responsible
for their preparation — but also has limited evening time and doesn't want
to be the daily quiz machine. The mix of universal parenting feelings and
personal experience makes this a broadly relatable archetype.

**Sub-types to design for:**
- **Engaged parent:** checks the dashboard, notices patterns, feels
  informed and in control — "I can see they practiced 3 times this week"
- **Hands-off parent:** just wants the tool to exist and be used —
  "I provided it, that's my job done"

**What they need:**
- Visibility without daily involvement
- Confidence that the tool is aligned with what the school teaches
- A guilt-reducing signal: "my kid has the right tool"
- Not to set it up themselves (minimal friction onboarding)

**Success moment:**
*Kid's grade stays the same or improves — without a single evening
quizzing session.* The parent reclaimed their evening. That's the win.

**Role in Phase 2:** Account creation, adding children, occasional
dashboard check-in. Not a daily active user.

---

#### Persona 3: The Teacher — A Hungarian Language Teacher (Phase 2, light)

**Context:**
One of Bodist's kids' actual teachers — not yet aware of the platform.
Works within the Hungarian standardized curriculum using an assigned
textbook. Uses Google Classroom for communication, but has no lightweight
practice tool to recommend to students beyond printed worksheets.

**What they need (when the time comes):**
- Confirmation that the platform is aligned with what they teach
- Visibility into whether their class is engaging with it
- No extra workload — they're recommending, not maintaining
- Trust that the content is accurate and grade-appropriate

**What they do NOT want:**
- Another system to manage or log into regularly
- To be responsible for content quality
- Complexity that requires onboarding time

**Success moment:**
*Class arrives better prepared. Teacher can spend less time reviewing
basics and more time on new material.*

**Role in Phase 2:** Recommendation channel and optional dashboard viewer.
Content creation and deeper involvement come in later phases.

---

### User Journey

#### Phase 1: Student Journey (Pre-Mini PoC)

| Stage | Experience |
|-------|-----------|
| **Discovery** | "Dad built something, try it" — direct hand-off |
| **Onboarding** | Opens app, sees German lessons from current chapter, starts immediately |
| **Core usage** | 5-10 min session before a test: flash cards → grammar questions → score |
| **Aha moment** | Sees score, knows what they know and what they don't — without asking anyone |
| **Validation** | Uses it again before next test voluntarily (or doesn't — both are signal) |

#### Phase 2: Parent Journey

| Stage | Experience |
|-------|-----------|
| **Discovery** | Teacher recommendation or word of mouth from another parent |
| **Onboarding** | Creates account, adds child, no complex setup needed |
| **Core usage** | Occasional check on dashboard: "Did they practice this week?" |
| **Aha moment** | Better grade, no evening quizzing sessions — time reclaimed |
| **Long-term** | Default pre-test routine tool, trusted background resource |

#### Phase 2: Teacher Journey

| Stage | Experience |
|-------|-----------|
| **Discovery** | Direct outreach after mini PoC validation |
| **Onboarding** | Demo of what students have been doing, sees curriculum alignment |
| **Core usage** | Recommends to parents, occasionally checks class aggregate view |
| **Aha moment** | Class arrives better prepared; can teach new content instead of reviewing |
| **Long-term** | Standard pre-test recommendation, trusted community resource |

---

## Success Metrics

### Phase 1: Pre-Mini PoC Validation

**Primary success condition:**
At least one child uses the platform voluntarily before a real test,
reports it was helpful, and achieves a grade equal to or better than
their previous result on the same subject.

**Minimum go/no-go for Phase 2:**
≥ 1 child returns for a second session without being prompted.
If this doesn't happen after 3 genuine attempts, Phase 2 does not start.

**Kill criteria:**
- Neither child uses it after 2-3 tries
- Either child says "it's just homework in disguise"
- AI feedback is trusted less than 50% of the time ("it said I was
  wrong but I was right")

**Technical ceiling:**
Monthly infrastructure + AI cost ≤ $5

---

### Phase 2: Full PoC — School Pilot

**Growth target:**
- 2-3 classes onboarded
- ~50% of students per class actively use the platform
  (target: ≥ 30 active students total)
- ≥ 1 teacher recommends it to their class without being asked twice

**Engagement quality:**
- Students use it across ≥ 2 test cycles (not just once-off)
- Parent awareness: ≥ 1 parent mentions it to another parent
  organically (earliest community signal)

**Critical business data to collect:**
- Actual AI cost per active student per month
  (this data drives the Phase 3 pricing model — no guess, measure it)
- Ratio of free vs. paid feature usage (if any paid features exist)
- Which content types generate the most return sessions

**Technical stability:**
- System handles 30+ concurrent users without issues
- No data loss incidents
- Response time acceptable on mobile

---

### Business Objectives by Phase

| Phase | Objective | Success Definition |
|-------|-----------|-------------------|
| Pre-Mini PoC | Validate core learning experience | ≥1 voluntary return session |
| Full PoC | Validate classroom-scale adoption | 30 active students, 2-3 classes |
| Post-PoC | Sustainable growth model | AI cost per user calculated; free + paid tier designed |

---

### Key Performance Indicators

**User KPIs (Phase 1)**

| KPI | Target | Measurement |
|-----|--------|-------------|
| Voluntary session rate | ≥1 return session per child | Session log |
| Perceived helpfulness | "It helped" (qualitative) | Direct feedback |
| Grade outcome | Same or better | Report card comparison |
| AI trust rate | Child doesn't dispute feedback | Observation |

**User KPIs (Phase 2)**

| KPI | Target | Measurement |
|-----|--------|-------------|
| Active students | ≥30 | Session records |
| Class coverage | ≥50% of enrolled students per class | Enrollment vs. active |
| Multi-cycle retention | ≥2 test cycles per active student | Session log |
| Organic referral | ≥1 parent-to-parent mention | Self-reported |

**Business KPIs (Phase 2 — informing Phase 3)**

| KPI | Target | Measurement |
|-----|--------|-------------|
| AI cost per active user/month | Measure, don't cap | Usage log + API billing |
| Free tier sustainability | Identify break-even user count | Cost model |
| Feature usage distribution | Which features drive retention | Event tracking |

---

### Monetization Strategy Signal (Phase 3+)

No payment model in Phase 1 or Phase 2. After Phase 2:

- **Free tier:** Core platform always free — curriculum-aligned content,
  basic practice, progress tracking. Accessible to everyone, always.
- **Paid tier:** AI-intensive features — more detailed feedback, adaptive
  questioning, advanced explanations. AI is the primary payment driver.
- **Usage limits:** Free tier AI usage capped based on Phase 2 cost data
  (calculate real cost per user, then set a sustainable free allocation)
- **Decision point:** Phase 2 AI cost data determines the free tier cap
  and paid tier pricing before Phase 3 begins

---

## MVP Scope

> **MVP = Phase 1: Pre-Mini PoC.** This is the smallest version that
> validates the core hypothesis: does curriculum-aligned, AI-evaluated
> practice help a student feel ready for a real test?

---

### Core Features

#### Authentication
- Passwordless email login via Vercel Auth (magic link)
- Anonymous usage possible — no login required to browse or practice
  (localStorage fallback, data lost on device change)
- Minimal profile: email + nickname only
- No roles, no accounts hierarchy — single user type only

#### Content: German Lessons (3-5 units)
- Lessons created manually by the developer using Gemini for extraction
- Based on kids' current German curriculum (Schritte International
  or equivalent) — what they're studying NOW, not chapter 1
- Each lesson unit contains:
  - Vocabulary list (German ↔ Hungarian word pairs with examples)
  - Grammar focus for that unit (rule + examples)
  - Practice questions combining both in context
- Lesson labeled thematically ("Einkaufen – Shopping"), not by
  chapter number — enables reuse across schools

#### Three Learning Modes
1. **Flash card mode** — card flip, "I knew it ✓ / Didn't know ✗",
   summary at end
2. **Q&A mode** — question display, text input, AI feedback
   (🟢 correct / 🟡 partial / 🔴 incorrect with explanation)
3. **Mixed practice mode** (primary recommended mode):
   - Warm-up: vocabulary flash cards
   - Brief grammar rule display
   - Combined questions using both vocabulary and grammar
   - ~5-10 minutes total, didactically structured

#### AI Answer Evaluation
- Powered by Gemini Flash (~$0.001/question)
- Multi-dimensional feedback by question type:
  - Vocabulary: correct/incorrect + spelling tolerance
  - Grammar: separate assessment of vocabulary usage,
    grammatical correctness, sentence structure
  - Partial credit: "Vocabulary correct, but Dativ form is wrong"
- Feedback tone: bilingual (explanation in Hungarian, example in German),
  encouraging, no red for errors
- Edge cases handled: empty answers, "I don't know", near-correct
  (accent marks, capitalization), nonsense input
- Fallback: if AI times out (10s), show expected answer

#### Results Summary
- Score display after each session
- Improvement vs. previous attempt ("3 more than yesterday!")
  — not absolute percentages
- "Practice these again" list (questions answered incorrectly)
- Configurable session length: Quick (5 questions) / Full (15 questions)

#### Infrastructure
- Next.js App Router on Vercel
- Neon PostgreSQL — 3 tables: `users`, `lessons`, `sessions`
- Rate limiting on AI API routes (upstash/ratelimit)
- Only transformed/derived content stored (no original publisher material)
- Textbook images processed offline only (no blob storage)

**Timeline:** 7-10 days

---

### Out of Scope for Phase 1

| Feature | Reason deferred |
|---------|----------------|
| Teacher dashboard | Teachers enter in Phase 2 |
| Parent dashboard | Parents enter in Phase 2 |
| Teams / class groups | Phase 2 feature |
| Multiple subjects (English, History) | German only for Phase 1 |
| Content creation pipeline UI | Developer creates lessons manually |
| Gamification (streaks, badges, leaderboards) | Phase 2 |
| Spaced repetition algorithm | Phase 2 |
| Payment / subscription tiers | Post-Phase 2 |
| Social features (friends, challenges) | Future |
| Voice mode | Future paid feature |
| Offline / PWA mode | Future |
| Multiple languages in UI | Architecture yes, content no |

---

### MVP Success Criteria

The Phase 1 MVP is successful when:
- ≥ 1 child uses it before a real test without being told to
- ≥ 1 child returns for a second session without prompting
- AI feedback is trusted (child does not complain it's wrong)
- Monthly cost stays under $5

**Go/no-go decision point:** After 3 genuine attempts across both children.
If neither returns voluntarily → stop, run exit interviews, decide
whether to iterate or drop before investing in Phase 2.

---

### Future Vision

**Phase 2 — Full PoC (30-40 days after Phase 1 validates):**
- Three user roles: student, parent, teacher
- Parent dashboard (read-only child progress view)
- Teacher dashboard (read-only class aggregate view)
- Team system with join codes (class groups)
- Content creation pipeline UI (photo → AI extraction → review → publish)
- Multiple subjects: English, History added alongside German
- Basic gamification: streaks, progress bars, achievement badges
- Spaced repetition algorithm
- School pilot: 2-3 classes, ~30 active students

**Phase 3+ — Platform Growth:**
- Community curation mechanics: usage feedback drives content quality,
  best materials per topic rise to the top over time
- Book-agnostic topic assembly: content no longer tied to a single
  textbook, best materials from multiple sources merged into
  optimized topic units
- AI usage tiers: free tier with capped AI allocation, paid tier
  with advanced feedback and adaptive questioning
- School network expansion: beyond one school
- International curriculum support: model travels to any country
  with standardized textbooks
- Content marketplace: educator-created material, community sharing
- Worldwide accessible free tier — always
