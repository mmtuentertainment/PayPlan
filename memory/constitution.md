<!--
SYNC IMPACT REPORT - Constitution v3.1.0 Update
Generated: 2025-11-02

VERSION CHANGE: v3.0.0 → v3.1.0 (MINOR - Evidence-based adjustments)

ADJUSTMENTS BASED ON INDUSTRY RESEARCH:
- MVP scope: 42 features → 8-12 features (research: successful MVPs have 3.2 features avg)
- Coverage targets: Phased ramp 60%→70%→80% (respects 2-4 month TDD learning curve)
- TDD approach: Phased transition test-after→hybrid→strict (56% find TDD difficult)
- Pre-commit hooks: Fast only <15s (research: >15-20s leads to --no-verify bypass)
- SDD classification: IMMUTABLE → EVOLVABLE (methodologies adapt, values don't)

RECLASSIFIED PRINCIPLES:
- Principle IX: SDD moved from IMMUTABLE to EVOLVABLE (methodologies should adapt)

MODIFIED SECTIONS:
- Current Phase Status: 42 features → 8-12 features, 18 weeks → 8-12 weeks
- Phase 1 Requirements: Phased coverage (60%→80%), phased TDD (test-after→strict)
- Quality Gates: Fast pre-commit (<15s), comprehensive CI/CD
- MVP scope: 8-12 core features (validate market, then expand)

RATIONALE:
- Industry research: Minimal MVP launches 3x faster, validates market need
- Coverage research: 60%→80% ramp aligns with TDD learning curve (2-4 months)
- Pre-commit research: >15s hooks cause bypass, <15s enables TDD workflow
- Governance research: Methodologies evolvable, user-facing values immutable

TEMPLATES REQUIRING UPDATES:
- ⚠️ PENDING: templates/plan-template.md (phased coverage targets)
- ⚠️ PENDING: templates/tasks-template.md (phased TDD workflow)
- ⚠️ PENDING: .coderabbit.yaml (phased coverage enforcement)
- ⚠️ PENDING: .github/workflows/test.yml (phased coverage gates)
- ⚠️ PENDING: CLAUDE.md (Phase 1: 8-12 features, phased TDD)

FOLLOW-UP TODOS:
- Create ADR-004: Hybrid TDD adoption decision (business logic only)
- Create ADR-005: Phased coverage ramp (60%→80%) rationale
- Set up husky pre-commit hooks (lint + TypeScript only, <15s)
- Configure CI/CD coverage gates (phased: 50%→60%→70%)
- Update feature roadmap (8-12 features for Phase 1)
-->

# PayPlan Constitution v3.1

**The immutable principles and mandatory features that define PayPlan as a market-competitive, privacy-first budgeting app**

**Ratification Date**: 2025-10-17
**Last Amended**: 2025-11-02
**Version**: 3.1.0 (MINOR - Evidence-based adjustments: phased TDD/coverage ramp, minimal MVP scope 8-12 features, fast pre-commit hooks, SDD as EVOLVABLE)

---

## Document Purpose

This constitution serves as the **single source of truth** for all development decisions on PayPlan. It defines:

1. **Immutable Principles** - Core values that cannot be changed
2. **Mandatory Features** - Features required for market competitiveness  
3. **Phased Requirements** - How quality standards evolve with product maturity
4. **Development Workflow** - How to use Spec-Kit with Claude Code
5. **Tooling Integration** - How Linear, CodeRabbit, and Claude Code Bot work together

**For Claude Code**: Read this constitution before every feature implementation. It defines what you MUST do, what you MUST NOT do, and how to make decisions when requirements conflict.

---

## Current Phase Status

**Current Phase**: Phase 1 (Pre-MVP, 0-100 users)
**Current Focus**: Ship 8-12 core features to validate market need (Weeks 1-12)
**Testing Requirements**: Phased TDD (test-after weeks 1-2, hybrid weeks 3-6, strict week 7+), phased coverage (60%→70%→80%), financial logic 90%+ always
**Spec-Kit Requirements**: Mandatory for Tier 1+ features (spec.md + plan.md minimum)
**Performance Requirements**: None (optimize if users complain)
**Quality Approach**: Quality > Velocity, Evidence-Based > Theoretical, Sustainable Pace > Burnout Risk

**Phase 1 Priorities (REQUIRED)** - UPDATED v2.0:
- ✅ Ship **8 Tier 0 MVP features**:
  1. Spending Categories (with custom rules, templates)
  2. Budget Creation (multi-methodology, auto-adjusting)
  3. Dashboard (with customization, dark mode, 6 widgets)
  4. Goal Tracking (create, track, celebrate)
  5. **Projected Cash Flow** (NEW - forecasting, warnings)
  6. **Transaction Search** (NEW - <300ms, filters, saved searches)
  7. **Reconciliation** (NEW - duplicate detection, bank matching)
  8. **Transaction Entry** (notes, receipts, splitting, bulk actions)
- ✅ Manual accessibility testing (screen reader, keyboard navigation, WCAG 2.2 AA)
- ✅ Privacy compliance (localStorage-first, PII sanitization, no tracking)
- ✅ Features must work reliably (Phase 1 DoD including <5min onboarding)

**MVP Definition** (What "ready for 100 users" means):
- All 8 Tier 0 features functional and tested
- Guided onboarding (<5 minutes to first budget view)
- Dark mode support (2025 standard)
- WCAG 2.2 AA compliant (not 2.1)
- No critical bugs blocking core workflows

**Phase 1 Priorities (REQUIRED in v3.0)**:
- ✅ TDD for business logic (80% coverage for lib/**/*.ts)
- ✅ 40% overall test coverage minimum (business logic 80% + UI 0% = weighted 40%)
- ✅ Spec-Kit for Tier 1+ features (spec.md + plan.md mandatory)
- ✅ Quality gates (4-layer enforcement: pre-commit → CI/CD → bot → human)

**Phase 1 Priorities (NOT REQUIRED)**:
- ❌ TDD for UI components (manual testing acceptable)
- ❌ Integration test suite (defer to Phase 2)
- ❌ 80% overall coverage (defer to Phase 3)
- ❌ Performance optimization (defer to Phase 4, optimize if users complain)

---

## Core Principles

### I. Privacy-First Architecture (IMMUTABLE)

**Principle**: User privacy is paramount and non-negotiable. PayPlan operates privacy-first with optional server features.

**Market Context**: PayPlan targets 18-35 year-olds living paycheck-to-paycheck (67% of Americans). These users need financial tools without judgment, tracking, or data monetization. 80% of Gen Z (40M users) uses budgeting apps. Privacy-first design builds trust with a demographic wary of financial surveillance and data breaches.

**Requirements**:
- **localStorage-First**: All core features MUST work with localStorage only (no server required)
- **Explicit Consent**: Any server-side features (sync, cloud backup) require explicit opt-in with clear privacy disclosure
- **No Required Authentication**: Core features MUST work without signup, login, or authentication
- **PII Sanitization**: All exports, logs, and telemetry MUST sanitize PII before leaving the client
- **Data Ownership**: Users own their data; full export and deletion capabilities required
- **Zero Tracking by Default**: No analytics, telemetry, or tracking without explicit user consent

**Prohibited**:
- ❌ Requiring authentication for core budgeting features
- ❌ Server-side storage without explicit opt-in
- ❌ Selling user data to third parties
- ❌ Invasive tracking or fingerprinting
- ❌ Default opt-in for analytics (must be explicit opt-in)

---

### II. Accessibility-First Development (IMMUTABLE)

**Principle**: Financial tools must be accessible to all users, regardless of ability or disability.

**Requirements**:
- **WCAG 2.2 AA Compliance** (UPDATED): All features MUST meet WCAG 2.2 Level AA standards (October 2023 current standard)
- **Section 508 Compliance**: For US government/federal users, meet Section 508 standards
- **Future-Proofing**: Monitor WCAG 2.3 developments (expected 2026) and implement proactively
- **Screen Reader Compatible**: All UI components tested with NVDA, JAWS, or VoiceOver
- **Keyboard Navigation**: Full app functionality via keyboard (Tab, Enter, Space, Arrow keys)
- **Color Contrast**: Minimum 4.5:1 contrast ratios for text, 3:1 for UI components
- **ARIA Labels**: Proper ARIA labeling on all interactive elements
- **Focus Management**: Visible focus indicators, logical focus order, focus not obscured (WCAG 2.2: 2.4.11)
- **Touch Targets**: Minimum 24x24px (WCAG 2.2: 2.5.8), prefer 44x44px for comfort
- **Dragging Alternatives**: Single-pointer alternatives for all drag operations (WCAG 2.2: 2.5.7)
- **Pointer Cancellation**: Actions complete on up-event, not down-event (WCAG 2.1: 2.5.2)
- **Reduced Motion Support**: Respect `prefers-reduced-motion` for animations
- **Accessible Error Messages**: Clear, descriptive errors with recovery guidance
- **Consistent Help**: Help mechanism in same location across app (WCAG 2.2: 3.2.6)
- **Accessible Authentication**: No cognitive function tests for login (WCAG 2.2: 3.3.8)

**WCAG 2.2 New Success Criteria** (vs. 2.1):
- 2.4.11 Focus Not Obscured (Minimum) - AA: Focus indicator not fully hidden
- 2.4.12 Focus Not Obscured (Enhanced) - AAA: Focus indicator not obscured at all
- 2.5.7 Dragging Movements - AA: Provide single-pointer alternative to dragging
- 2.5.8 Target Size (Minimum) - AA: Touch targets ≥24x24 CSS pixels
- 3.2.6 Consistent Help - A: Help in same relative location
- 3.3.7 Redundant Entry - A: Don't ask for same information twice
- 3.3.8 Accessible Authentication (Minimum) - AA: No cognitive puzzles for auth

**Testing Requirements**:
- Every feature MUST include accessibility tests (automated + manual)
- Manual screen reader testing required before release
- Keyboard navigation testing mandatory
- Automated axe-core tests in CI/CD (Phase 2+)
- Test with real users with disabilities (Phase 3+)

**Prohibited**:
- ❌ Releasing features without accessibility testing
- ❌ Color-only information (must have text/icons too)
- ❌ Auto-playing videos or animations without user control
- ❌ Touch targets <24x24px (WCAG 2.2 violation)
- ❌ Drag-only interactions without keyboard/single-tap alternative

---

### III. Free Core, Premium Optional (IMMUTABLE)

**Principle**: All budgeting features must remain free forever; advanced features may be premium.

**Market Context**: Mint died (Jan 2024) with 3.6M users but no revenue—free-only models are unsustainable. YNAB charges $109/year, which users call "crazy expensive for people trying to save money." PayPlan's target users earn $25k-$60k/year and can't afford premium-only apps. The freemium model (80% free, 20% premium at $49-74/year—50% cheaper than YNAB/Monarch) ensures sustainability while serving users who need free budgeting most.

**Always Free (Core Features)**:
1. ✅ Manual transaction entry and editing
2. ✅ Spending categories (pre-defined + unlimited custom)
3. ✅ Budget creation and tracking (unlimited budgets)
4. ✅ Goal tracking (unlimited goals)
5. ✅ Dashboard with charts (spending, income/expenses, goals, gamification)
6. ✅ Recurring transaction detection
7. ✅ Bill reminders and alerts
8. ✅ CSV import and export
9. ✅ Transaction archives (localStorage, 50 limit)
10. ✅ Calendar export (.ics)
11. ✅ User preferences
12. ✅ Budget analytics and insights

**May Be Premium (Optional Features)**:
- ⚠️ Bank account sync (Plaid integration)
- ⚠️ AI-powered categorization
- ⚠️ Investment tracking
- ⚠️ Multi-user collaboration (Supabase backend)
- ⚠️ Unlimited archives (>50)
- ⚠️ Advanced analytics and reports
- ⚠️ Priority support

**Premium Pricing** (if implemented) - UPDATED 2025-11-02 (Competitive Research v2.1):
- Target: **$80/year** ($6.67/month) - **MID-TIER PRICING WITH BEST FREE TIER**
- Introductory offer: **$40/year first year** (50% off early adopter)
- **Competitive Positioning** (2025 ACTUAL pricing - validated Nov 2):
  - Simplifi: $35.88-71.88/year ($2.99-5.99/mo) - **PayPlan: mid-tier pricing**
  - PocketGuard: $74.99/year ($6.25/mo) - **PayPlan: $5 more annually for AI categorization (unique feature)**
  - Monarch: $99.99/year ($8.33/mo) - **PayPlan: 20% cheaper**
  - YNAB: $109/year ($9.08/mo) - **PayPlan: 27% cheaper**
- **Freemium Conversion Target**: 5-8% (industry standard for finance apps)
- **Revenue Model**: 10K users × 7% conversion × $80/year = $56K ARR (break-even: 20 users at $1-2/user/mo cost)
- **Cost Structure**: Plaid ($0.60-1.20/user/mo) + OpenAI ($0.10-0.30/user/mo) + Supabase ($0.05-0.15/user/mo) = $0.75-1.65/user/mo total
- **Gross Margin**: 70-85% ($4.87-5.87/user/mo profit)
- Free trial: **7 days** (industry standard, all 4 competitors use 7-34 days)
- No credit card required for free tier (forever free)
- Clear value proposition: "Premium = Save 30 min/week (Bank Sync + AI Categorization) + Investments + Multi-User + Priority Support"
- **Market Rationale**: ALL 4 competitors are paid-only (YNAB $109, Simplifi $36-72, Monarch $100, PocketGuard $75 - eliminated free tier in 2025); PayPlan's TRUE FREE TIER is massive competitive advantage; $80/year is mid-tier pricing that funds API costs while remaining 20-27% cheaper than YNAB/Monarch; 5-8% conversion validated across multiple finance apps

**Prohibited**:
- ❌ Paywalling core budgeting features
- ❌ Bait-and-switch (making free features premium later)
- ❌ Requiring premium for basic budgeting/categorization
- ❌ Ads in free tier (compromises privacy)

---

### IV. Visual-First Insights (PRINCIPLE)

**Principle**: Every financial concept must have a visual representation. Users should understand their finances at a glance.

**Market Context**: YNAB users complain about "overwhelming" complexity and 30-minute onboarding. PayPlan's target users have low financial literacy and prefer visual-first design (charts > spreadsheets). Apps with gamification see 2x daily engagement; progress bars alone increase goal completion by 22%. Visual design solves YNAB's core weakness while leveraging proven engagement patterns.

**Requirements**:
- **Charts for Everything**: Net worth, spending, income, goals, debts get charts
- **Color-Coded Status**: Green (good), Yellow (warning), Red (critical)
- **Progress Bars**: Visual progress for budgets, goals, debt payoff
- **Dashboard as Primary View**: Default landing page shows key insights
- **Responsive Visualizations**: Charts work on mobile, tablet, desktop
- **Accessible Charts**: Alt text, ARIA labels, keyboard navigation for chart interactions

**Chart Types Required**:
1. **Net Worth Over Time** (line chart)
2. **Spending by Category** (pie chart or bar chart)
3. **Income vs. Expenses** (stacked bar chart, monthly)
4. **Goal Progress** (progress bars with percentages)
5. **Debt Payoff Timeline** (line chart with projections)
6. **Budget vs. Actual** (horizontal bar charts)

**Ethical Gamification Principles** (Non-Negotiable):
- ✅ **User agency**: Users control notifications, can disable gamification features
- ✅ **Positive reinforcement**: Celebrate wins, don't punish failures
- ✅ **No dark patterns**: No fake urgency, no pay-to-win, no public shaming
- ✅ **Privacy-first**: No forced social comparison (all comparisons anonymous/opt-in)

**Prohibited**:
- ❌ Text-only displays for financial data (must have visual option)
- ❌ Charts without accessible alternatives
- ❌ Inaccessible color schemes (red/green only)
- ❌ Manipulative gamification (dark patterns, forced social comparison, pay-to-win)

---

### V. Mobile-First, Responsive Design (PRINCIPLE)

**Principle**: Users check their finances on-the-go. Mobile experience is paramount.

**Requirements**:
- **Mobile-First CSS**: Design for small screens first, scale up
- **Touch-Friendly UI**: Minimum 44x44px touch targets
- **Fast Load Times**: <3s initial load on 3G connections
- **Progressive Web App (PWA)**: Offline support, installable, app-like experience
- **Responsive Charts**: Charts adapt to screen size
- **Mobile Navigation**: Bottom nav or hamburger menu for small screens

**Performance Targets**:
- Index loading: <100ms
- Page transitions: <200ms
- Chart rendering: <500ms
- CSV export (1000 payments): <3s

**Prohibited**:
- ❌ Desktop-only features
- ❌ Horizontal scrolling on mobile
- ❌ Tiny touch targets (<40px)

---

### VI. Quality-First Development (PHASED)

**Principle**: Code quality matters, but timing matters more. Testing rigor scales with product maturity.

**Market Context**: Monarch has a 1.8-star TrustPilot rating with "transaction auto-deletion bugs unfixed for 5+ months." However, Mint "stood still on innovation" and died with 0 revenue. PayPlan must balance quality (prevent Monarch's bugs) with velocity (prevent Mint's stagnation). Testing requirements scale with product maturity to optimize for the right outcomes at each stage.

---

#### Phase 1: Pre-MVP (0-100 users, Weeks 1-12) **← CURRENT PHASE**

**Goal**: Ship 8-12 core features to validate market need, achieve minimal viable product for privacy-first budgeting

**Requirements (v3.1 - Phased Quality Ramp)**:

**Phased TDD Adoption** (Respects 2-4 Month Learning Curve):
- **Weeks 1-2 (Features 1-2): Test-After Learning**
  - Write implementation first, comprehensive tests before merge
  - Goal: Learn Vitest syntax, understand coverage tools
  - Acceptable: Imperfect tests, refactoring to make code testable
  - Gate: Tests required before merge (timing flexible)

- **Weeks 3-6 (Features 3-5): Hybrid Approach**
  - Test-first for business logic (calculations, validations)
  - Test-after acceptable for UI (React components, pages)
  - Goal: Build test-first muscle memory on critical code
  - Gate: Business logic has tests written first

- **Week 7+ (Features 6+): Strict Test-First**
  - Red-Green-Refactor for ALL code
  - TDD becomes default workflow (not optional)
  - Exception: 30-min exploratory spikes (must delete or test afterward)
  - Gate: All code follows Red-Green-Refactor cycle

- **Financial Logic (ALL PHASES): ALWAYS Test-First**
  - Budget calculations, transaction math, goal progress, currency handling
  - No exceptions - "even minor errors can have devastating financial consequences"
  - Coverage: 90%+ minimum (blocking gate at CI/CD)

**Phased Coverage Targets** (Evidence-Based Ramp):
- **Features 1-3**: Business logic 60% (50% gate), Overall 30%
- **Features 4-6**: Business logic 70% (60% gate), Overall 40%
- **Features 7-8**: Business logic 80% (70% gate), Overall 50%
- **Features 9+**: Business logic 90% (80% gate), Overall 60%
- **Financial calculations**: 95%+ (90% gate) - ALL phases

**Manual Testing for UI**:
- React components, charts, pages: 0% coverage acceptable
- Requires: Screenshot evidence in PR, manual accessibility testing
- Quality bar: Visual correctness, keyboard navigation works, screen reader announces properly

**Accessibility Testing**: WCAG 2.2 AA (screen reader + keyboard nav, manual + automated axe-core)
**Privacy Compliance**: localStorage-first, PII sanitization, zero tracking (constitutional requirement)

**Quality Gates** (v3.1 - Fast Pre-Commit, Phased Coverage):

**Layer 1 - Pre-Commit Hooks** (Fast Only, <15s total):
- [ ] ESLint + Prettier (staged files only, cached) ~5-7s
- [ ] TypeScript strict mode (incremental, no emit) ~5-8s
- [ ] ❌ NO tests in pre-commit (too slow, move to CI/CD)
- [ ] ❌ NO a11y checks in pre-commit (too slow, move to CI/CD)
- **Total Time**: ~10-15 seconds (enables TDD workflow, prevents --no-verify bypass)

**Layer 2 - CI/CD Gates** (Comprehensive, 3-5 min):
- [ ] All tests pass (business logic + accessibility)
- [ ] Phased coverage gates (Features 1-3: 50%, Features 4-6: 60%, Features 7+: 70%)
- [ ] Financial logic coverage ≥90% (ALL phases, no exceptions)
- [ ] Overall coverage ≥30% minimum (phased: 30%→40%→50%)
- [ ] Bundle size <500KB
- [ ] axe-core accessibility tests pass
- [ ] TypeScript strict mode (no errors)

**Layer 3 - Bot Reviews**:
- [ ] CodeRabbit: IMMUTABLE principle compliance (Privacy, Accessibility, Free Core, Ethical Gamification)
- [ ] Claude Code Bot: Spec-code alignment verification

**Layer 4 - Human Review**:
- [ ] HIL approval required (final quality check)
- [ ] Manual accessibility testing (screen reader + keyboard navigation)
- [ ] Manual privacy testing (no unauthorized server requests, PII sanitization)

**Allowed**:
- ✅ Ship UI components without tests (screenshot evidence required in PR)
- ✅ Manual testing for visual correctness
- ✅ Defer integration tests to Phase 2 (document manual integration testing)
- ✅ Skip performance optimization (optimize when users complain)

**Prohibited**:
- ❌ Merging business logic without tests (lib/**/*.ts blocks at CI/CD)
- ❌ Shipping accessibility violations (WCAG 2.2 AA blocks at bot review)
- ❌ Skipping privacy compliance (constitutional violation, auto-blocks)
- ❌ Ignoring critical bugs (fix within 48 hours, add regression test)

---

#### Phase 2: Early Adoption (100-1,000 users, Weeks 13-24)

**Goal**: Stabilize core features, reduce bug reports, maintain velocity

**Requirements**:
- **Critical path tests**: Test core user flows (budget creation, payment tracking, CSV export)
- **Test coverage target**: 40% (focus on business logic)
- **Bug fix tests**: Add regression tests when fixing user-reported bugs
- **Accessibility tests**: Automated axe-core tests + manual screen reader testing
- **CI/CD**: Critical path tests must pass before merge

**Allowed**:
- ✅ Ship new features without full test coverage
- ✅ Add tests incrementally (prioritize high-risk areas)
- ✅ Prioritize user-facing bugs over test coverage

**Prohibited**:
- ❌ Shipping features that break existing functionality (regression tests required)
- ❌ Ignoring accessibility issues (axe-core failures block merge)

---

#### Phase 3: Growth (1,000-10,000 users, Weeks 25+)

**Goal**: Prevent regressions, maintain quality at scale, professional-grade reliability

**Requirements**:
- **TDD for new features**: Write tests before implementation (Red-Green-Refactor)
- **Test coverage target**: 80% for new code
- **Full test suite**: Unit + integration + business + accessibility
- **CI/CD gates**: All tests must pass before merge
- **Regression prevention**: Every bug gets a test

**Test Organization**:
```
tests/
  unit/              # Isolated function tests
  integration/       # Component interaction tests
  business/          # User story acceptance tests
  accessibility/     # A11y compliance tests
  e2e/               # End-to-end Playwright tests
```

**Prohibited**:
- ❌ Merging code without tests
- ❌ Test coverage <80% for new features
- ❌ Skipping accessibility tests

---

#### Phase 4: Scale (10,000+ users, Post-Launch)

**Goal**: Enterprise-grade quality, zero downtime, five-nines reliability

**Requirements**:
- **TDD mandatory**: Red-Green-Refactor cycle for all code
- **Test coverage**: 90%+ for critical paths, 80%+ overall
- **Performance tests**: Load testing, stress testing, profiling
- **Security tests**: Penetration testing, vulnerability scanning, OWASP compliance
- **Chaos engineering**: Test failure scenarios (network issues, data corruption, localStorage limits)
- **Monitoring**: Error tracking (Sentry), performance monitoring (Web Vitals)

**Prohibited**:
- ❌ Deploying without full test coverage
- ❌ Skipping security audits
- ❌ Ignoring performance regressions

---

**Phase Transitions**: Move to next phase when user count threshold is reached AND core features are stable (bug report rate <5/week).

---

### VII. Simplicity and YAGNI (PRINCIPLE)

**Principle**: Start simple, add complexity only when necessary. You Ain't Gonna Need It.

**Market Context**: Mint "stood still on innovation" and "hasn't released new features in years"—stagnation kills apps. PocketGuard suffers from "slow updates and feature releases" with a neglected community. PayPlan mandates 2-week sprint cadence, monthly feature releases, and public roadmap to avoid competitor stagnation while maintaining code simplicity through disciplined scoping.

**Requirements**:
- **Small Features**: Features should be implementable in <2 weeks
- **Incremental Delivery**: Ship MVPs, iterate based on feedback
- **Clear Purpose**: Every feature must solve a user problem
- **Technical Debt Budget**: Max 10% of sprint for refactoring/debt
- **Dependency Minimalism**: Avoid unnecessary dependencies

**Code Standards (GUIDELINES, NOT RULES)**:

**Readability First**:
- Functions should do ONE thing well
- Files should have ONE clear purpose
- Components should have ONE responsibility (Single Responsibility Principle)
- Complexity should be minimized

**Guidelines** (aim for these, but readability > metrics):
- Functions: Aim for <50 lines, but readability > line count
- Files: Aim for <300 lines, but cohesion > arbitrary limits
- Components: Aim for <200 lines, but usability > size
- Cyclomatic complexity: Aim for <10, but clarity > metrics

**When to break guidelines**:
- ✅ Breaking the rule improves readability
- ✅ The alternative is worse (e.g., over-abstraction into tiny files)
- ✅ The code is well-documented and easy to understand
- ✅ The component naturally has multiple concerns that are tightly coupled

**When NOT to break guidelines**:
- ❌ Laziness or rushing ("I'll refactor later")
- ❌ Lack of planning (should have been split during design)
- ❌ "It works, ship it" mentality without considering maintainability

**Prohibited**:
- ❌ Over-engineering (building for hypothetical futures)
- ❌ Feature bloat (adding features without user demand)
- ❌ Premature optimization (optimize when users complain or metrics show issues)

---

### VIII. Ethical Gamification (IMMUTABLE) - NEW PRINCIPLE

**Principle**: Gamification must empower users, never exploit or manipulate them. Financial progress should feel rewarding without psychological manipulation.

**Market Context**: Apps with gamification see 2x daily engagement and users save 20% more (research-proven benefits). Daily streaks increase engagement by 48%, progress bars improve goal completion by 22%. However, manipulative gamification (dark patterns, social pressure, pay-to-win) damages user trust and violates PayPlan's privacy-first values. PayPlan uses ethical gamification: celebrate user wins without punishment, support intrinsic motivation, respect user autonomy.

**Requirements**:
- **User Control (Mandatory)**:
  - Users can disable ALL gamification features globally in Settings
  - Per-feature disable (turn off streaks, keep progress bars)
  - No penalties for disabling (full functionality maintained)
  - "Disable Gamification" toggle prominently placed

- **Positive Reinforcement Only**:
  - Celebrate achievements: "You saved $200 this month!"
  - Never punish failures: NO "You broke your 30-day streak - start over!"
  - Focus on progress, not perfection: "You completed 4/7 days - that's progress!"
  - Growth mindset language: "Try again tomorrow" not "You failed"

- **No Manipulation Tactics**:
  - ❌ No fake urgency: "Only 2 hours left to save your streak!"
  - ❌ No countdown timers creating pressure
  - ❌ No scarcity tactics: "Only 3 spots left in challenge!"
  - ❌ No guilt-tripping: "Your friends are disappointed you quit"

- **Privacy-First Social Features**:
  - ALL social features are opt-in and anonymous
  - No public leaderboards without explicit consent
  - No forced friend comparison
  - Anonymous aggregate comparisons only: "You save more than 65% of users" (no names, no profiles)
  - Users can opt out of ALL social features
  - Social data never sold or shared with third parties

- **No Pay-to-Win Mechanics**:
  - Premium users get features (bank sync, AI), NOT gameplay advantages
  - Cannot buy streak recovery, badge unlocks, or shortcut progress
  - Free and Premium users compete equally in challenges (if challenges implemented)
  - Progression based on behavior, not payment

- **Transparent Mechanics**:
  - Users understand how points, badges, streaks work
  - No hidden algorithms or opaque scoring
  - "How This Works" explanation for every gamification feature
  - Show progress calculation: "5 days logged ÷ 7 days = 71% completion"

- **Data Ownership**:
  - Gamification data (streaks, badges, points) stored in localStorage
  - Never sold, shared, or monetized
  - Included in data export (CSV includes gamification history)
  - Full deletion on user request

**Allowed Gamification Features**:
- ✅ Progress bars for budgets, goals, debt payoff (visual feedback, not manipulation)
- ✅ Streak tracking for daily budget reviews, bill payments (encourages consistency)
- ✅ Milestone badges at 25%, 50%, 75%, 100% goal completion (celebrates achievements)
- ✅ Confetti animations on goal completion (momentary celebration)
- ✅ "Recent wins" widget on dashboard (positive reinforcement)
- ✅ Anonymous comparison ("You save more than 65% of users") (motivation without pressure)
- ✅ Opt-in challenges ("Try a no-spend week") (user chooses participation)
- ✅ Level-up system based on financial behaviors (savings milestones, debt reduction)

**Prohibited Gamification Features**:
- ❌ Streak punishment or shame ("You lost your 30-day streak!")
- ❌ Public shaming or forced leaderboards showing real names
- ❌ Pay-to-win mechanics ("Buy gems to unlock budget insights")
- ❌ Fake urgency timers ("Save your streak in 2 hours!")
- ❌ Social pressure notifications ("Your friends are ahead of you")
- ❌ Loot boxes or randomized rewards (gambling mechanics)
- ❌ Manipulative push notifications ("Don't let us down!")
- ❌ Forced social comparison (must be opt-in)
- ❌ Endless scrolling/infinite rewards (addiction patterns)

**Testing Requirements**:
- Every gamification feature MUST include:
  - [ ] Disable toggle in Settings UI
  - [ ] Clear explanation of mechanics ("How This Works" section)
  - [ ] Privacy disclosure if any data shared (must be none for free tier)
  - [ ] Accessibility testing (screen reader announces achievements clearly)
  - [ ] Psychological review: Does this empower or manipulate?

**Enforcement**:
- CodeRabbit AI blocks PRs with manipulative gamification patterns
- Design review required for all new gamification features
- User testing required: "Does this feel manipulative?" feedback

**Violation Response**:
- Any gamification feature violating these principles must be disabled immediately
- Root cause analysis: Why was manipulative pattern introduced?
- Re-design with user psychologist consultation (Phase 3+)
- Cannot re-enable until ethical compliance verified

**Market Rationale**:
- Gamification drives 2x engagement and 20% more savings (proven benefits)
- BUT manipulative gamification causes backlash (see Duolingo streak shaming criticism)
- Ethical gamification builds long-term trust with privacy-conscious users
- Differentiates PayPlan from competitors who use dark patterns

**Related Features**:
- Dashboard (Tier 0 #3): Streak tracking, insights, wins widgets
- Goal Tracking (Tier 0 #4): Progress bars, badges, celebrations
- Alerts (Tier 1 #10): Positive reinforcement notifications

---

### IX. Specification-Driven Development (SDD) (EVOLVABLE) - NEW PRINCIPLE v3.0, RECLASSIFIED v3.1

**Principle**: Specifications are source of truth. Code is disposable. All features MUST have specifications before implementation.

**Classification Rationale (v3.1)**: SDD is a METHODOLOGY, not a moral/ethical principle. If AI tooling evolves to make specifications unnecessary or if alternative approaches prove superior, PayPlan must be able to adapt without requiring MAJOR version changes. IMMUTABLE status is reserved for user-facing values (Privacy, Accessibility, Free Core, Ethical Gamification).

**Market Context**: PayPlan is built using Spec-Kit workflow (HIL → Manus → Claude Code). Manus creates specifications, Claude Code implements from specifications. This ensures architectural consistency, constitutional compliance at spec phase (not code phase), and permanent documentation (specs don't change, code does). The SDD framework mandates test-first, library-first, and spec-first development for maintainability at scale.

**Requirements**:
- **Spec-First**: Specifications written BEFORE code (no implementation without spec for Tier 1+)
- **Constitution Compliance**: Every spec includes constitutional validation section
- **Spec-Kit Workflow**: Use `/speckit.specify`, `clarify`, `plan`, `tasks`, `implement` for Tier 1+
- **Spec-Code Alignment**: Implementation MUST match specification (bots verify alignment)
- **Test-First**: Tests written BEFORE implementation (Red-Green-Refactor cycle)
  - Business logic (lib/**/*.ts): TDD mandatory, 80% coverage minimum
  - UI components (components/**/*.tsx): Manual testing acceptable, 0% coverage allowed
  - Overall coverage: 40% minimum (weighted average)
- **Library-First**: Features implemented as reusable libraries when possible
- **ADRs for Decisions**: Major architectural decisions documented in `docs/architecture/decisions/`

**Spec-Kit Tiers** (Mandatory for Tier 1+):

**Tier 0 (Simple, <2 days)**: GitHub issues only
- Linear issue with user story and acceptance criteria
- No formal spec required
- Examples: Bug fixes, minor UI tweaks, small refactors

**Tier 1 (Medium, 2-7 days)**: spec.md + plan.md REQUIRED
- `spec.md`: User stories, acceptance criteria, success metrics
- `plan.md`: Technical approach, constitutional validation, test plan
- Examples: Dashboard widgets, chart types, form enhancements

**Tier 2 (Complex, 1-2 weeks)**: Full Spec-Kit REQUIRED
- All Tier 1 files PLUS:
- `data-model.md`: TypeScript types, Zod schemas
- `tasks.md`: Dependency-ordered implementation tasks
- `checklist.md`: Quality validation items
- `research.md`: Deep research findings (if needed)
- `.claude/prompts/implement-[feature].md`: Implementation prompt
- Examples: Transaction entry, goal tracking, reconciliation, bank sync

**Test-First Workflow** (Red-Green-Refactor):
1. **Red**: Write failing test first (define expected behavior)
2. **Green**: Write minimum code to pass test
3. **Refactor**: Improve code quality while keeping tests green
4. **Review**: Manual testing (UI), automated (business logic), accessibility (WCAG 2.2 AA)

**Enforcement**:
- Manus creates specs using `/speckit.*` commands (cannot skip for Tier 1+)
- Claude Code implements from specs (cannot create own specs)
- Bot reviews verify spec-code alignment (reject PRs that diverge from spec)
- Pre-commit hooks run business logic tests (block commit if fail)
- CI/CD enforces 80% business logic coverage, 40% overall (block merge if below)
- CodeRabbit blocks untested business logic functions

**Prohibited**:
- ❌ Implementing Tier 1+ features without specifications
- ❌ Changing architecture without updating constitution or creating ADR
- ❌ Skipping constitutional validation in specs
- ❌ Diverging from approved spec without amendment
- ❌ Merging business logic without tests (lib/**/*.ts requires 80% coverage)
- ❌ Shipping UI with accessibility violations (WCAG 2.2 AA blocks merge)

**Rationale**:
- Specifications are permanent documentation, code changes frequently
- Constitutional compliance enforced at spec phase prevents violations in code
- Spec-first prevents architectural drift and technical debt
- Test-first prevents regressions and improves design
- ADRs document evolution, constitutions govern future
- Quality gates catch issues early (pre-commit > CI/CD > bot > human)

---

## Spec-Kit Workflow Integration

### Decision Tree: When to Use Spec-Kit

**Tier 0: Simple Features (<3 days, trivial changes)**

**Examples**:
- UI tweaks (button colors, spacing adjustments)
- Bug fixes (fix broken validation, fix display issue)
- Minor enhancements (add tooltip, improve error message)
- Small refactors (rename variable, extract utility function)

**Workflow**:
1. Create GitHub issue with:
   - User story (As a [user], I want [feature], so that [benefit])
   - Acceptance criteria (1-3 bullet points)
   - Screenshots/mockups (if UI change)
2. Implement directly (no spec.md, no plan.md, no tasks.md)
3. Manual testing (verify acceptance criteria met)
4. Commit and merge

**Skip**: Spec.md, plan.md, tasks.md, analyze  
**Time Saved**: 2-4 hours per feature

---

**Tier 1: Medium Features (3-7 days, moderate complexity)**

**Examples**:
- Spending categories (new data model + UI)
- Goal tracking (CRUD + progress visualization)
- Budget creation (form + validation + storage)
- Recurring detection (algorithm + UI display)

**Workflow**:
1. **Specification Phase**:
   - Use `/speckit.specify` to create spec.md
   - Define user stories, requirements, success criteria
   - Review with stakeholders (if applicable)
2. **Implementation Phase**:
   - Implement directly from spec (skip plan.md and tasks.md)
   - Manual testing + accessibility testing
3. **Optional**: Use `/speckit.clarify` if ambiguities arise

**Skip**: Plan.md, tasks.md, analyze (too heavy for this complexity)  
**Time Saved**: 4-8 hours per feature

---

**Tier 2: Complex Features (7-14 days, high complexity)**

**Examples**:
- Bank sync (Plaid integration, OAuth, sync logic)
- AI categorization (ML model, training, inference)
- Multi-user collaboration (real-time sync, permissions, conflict resolution)
- Investment tracking (brokerage integration, portfolio calculations)

**Workflow** (Full Spec-Kit):
1. **Constitution Phase**: Use `/speckit.constitution` to review principles
2. **Specification Phase**: Use `/speckit.specify` to create spec.md
3. **Clarification Phase**: Use `/speckit.clarify` to resolve ambiguities
4. **Planning Phase**: Use `/speckit.plan` to generate plan.md
5. **Task Breakdown Phase**: Use `/speckit.tasks` to generate tasks.md
6. **Implementation Phase**: Use `/speckit.implement` to execute tasks.md
7. **Analysis Phase**: Use `/speckit.analyze` for cross-artifact consistency

**Use All Tools**: Full Spec-Kit ceremony justified for this complexity

---

**Decision Summary**:
- **<3 days + straightforward** → Tier 0 (GitHub issue only)
- **3-7 days + moderate complexity** → Tier 1 (spec.md only)
- **7-14 days + high complexity** → Tier 2 (full Spec-Kit)
- **>14 days** → Break into smaller features (violates Principle VII: Simplicity)

---

## Definition of Done (By Phase)

### Phase 1 (Current): Pre-MVP Definition of Done ← v3.1 PHASED QUALITY

A feature is "done" when:

1. ✅ **Functional**: Feature works as described in spec/issue

2. ✅ **Tested** (v3.1 - Phased Approach):
   - **Features 1-2**: Tests written before merge (test-after acceptable), 50% business logic coverage
   - **Features 3-5**: Test-first for business logic, test-after OK for UI, 60% business logic coverage
   - **Features 6+**: Red-Green-Refactor for all code, 70%+ business logic coverage
   - **Financial logic**: ALWAYS test-first, 90%+ coverage (all features, no exceptions)
   - All tests pass (CI/CD blocks merge if failures)

3. ✅ **Manual Testing**: UI tested manually, screenshots in PR, acceptance criteria met
3. ✅ **Guided Onboarding** (NEW):
   - New users complete setup in <5 minutes
   - Progressive disclosure (features revealed as needed, not all upfront)
   - Personalized setup (ask primary goal: save money, pay off debt, track spending)
   - Quick wins (user sees value within first 2 minutes)
   - Optional skip (power users can bypass onboarding)
4. ✅ **Accessibility**: Screen reader tested (NVDA/VoiceOver), keyboard navigation works, WCAG 2.2 AA compliant
5. ✅ **Privacy**: No PII leaks, localStorage-first, consent explicit
6. ✅ **Error Handling**: User-friendly error messages with recovery guidance
7. ✅ **Responsive**: Works on mobile (iOS/Android), tablet, desktop
8. ✅ **Light & Dark Mode**: Theme support with system preference sync (NEW - 2025 standard)
9. ✅ **Documented**: README updated (if needed)

**Onboarding Flow Requirements** (NEW):
- Step 1: Welcome + value proposition (30 seconds)
- Step 2: Choose primary goal: Save money | Pay off debt | Track spending (30 seconds)
- Step 3: Optional account connection OR skip to manual entry (2 minutes)
- Step 4: Quick tour of 3 key features (Dashboard, Categories, Budgets) (2 minutes)
- **Total Time**: <5 minutes to first budget view
- **Skip Option**: "Skip setup, explore on my own" always visible

**NOT required in Phase 1**:
- ❌ Automated tests
- ❌ Code coverage metrics
- ❌ Performance benchmarks (unless users complain)
- ❌ Full Spec-Kit documentation (use for Tier 2 features only)

---

### Phase 2: Early Adoption Definition of Done

A feature is "done" when:

1. ✅ All Phase 1 criteria met
2. ✅ **Critical Path Tests**: Core flows have automated tests
3. ✅ **40% Coverage**: Business logic tested
4. ✅ **CI/CD**: Tests pass in pipeline
5. ✅ **Regression Tests**: Bug fixes have tests

---

### Phase 3: Growth Definition of Done

A feature is "done" when:

1. ✅ All Phase 2 criteria met
2. ✅ **TDD**: Tests written before code
3. ✅ **80% Coverage**: New code fully tested
4. ✅ **Full Test Suite**: Unit + integration + accessibility
5. ✅ **Performance**: Meets Phase 3 targets

---

### Phase 4: Scale Definition of Done

A feature is "done" when:

1. ✅ All Phase 3 criteria met
2. ✅ **90% Coverage**: Critical paths fully tested
3. ✅ **Security**: Penetration tested
4. ✅ **Performance**: Meets Phase 4 targets
5. ✅ **Monitoring**: Instrumented with Sentry + Web Vitals

---

## Conflict Resolution Hierarchy

When principles conflict, resolve using this hierarchy:

### Level 1: IMMUTABLE Principles (Highest Priority)

1. **Privacy-First** (Principle I)
2. **Accessibility-First** (Principle II)
3. **Free Core** (Principle III)

**Example Conflict**:
- "Should we add analytics to track user behavior?"
- **Resolution**: NO. Privacy-First (IMMUTABLE) > Product insights

---

### Level 2: Phase Requirements

4. **Current Phase Requirements** (Phase 1: Ship fast, manual testing)

**Example Conflict**:
- "Should we write automated tests for this feature?"
- **Resolution**: NO (Phase 1). Manual testing sufficient. Defer to Phase 2.

---

### Level 3: Product Principles

5. **Visual-First** (Principle IV)
6. **Mobile-First** (Principle V)
7. **Simplicity/YAGNI** (Principle VII)

**Example Conflict**:
- "Should we add a complex dashboard with 20 widgets?"
- **Resolution**: NO. Simplicity (Principle VII) > Feature richness. Start with 6 widgets.

---

### Level 4: Quality Principles (Phased)

8. **Quality-First** (Principle VI, phased by user count)

**Example Conflict**:
- "Should we optimize this chart rendering?"
- **Resolution**: DEPENDS. Phase 1: Only if users complain. Phase 3: Yes, proactively.

---

## Tooling Integration

### Linear Integration (Project Management)

**Purpose**: Track features, bugs, and tasks in Linear

**Workflow**:
1. Every Spec-Kit spec creates a Linear issue
2. Linear issue links to spec file in GitHub
3. Spec updates sync to Linear (manual for now)
4. Linear tracks progress (To Do → In Progress → Done)

**Linear Issue Template**:
```markdown
**Feature**: [Spec Title]
**Spec**: [Link to specs/XXX-feature-name/spec.md]
**Tier**: [0, 1, or 2]
**Phase**: [1, 2, 3, or 4]
**User Story**: [Primary user story from spec]
**Acceptance Criteria**: [From spec]
```

**Labels**:
- `tier-0` (simple), `tier-1` (medium), `tier-2` (complex)
- `phase-1` (pre-MVP), `phase-2` (early adoption), etc.
- `feature`, `bug`, `refactor`, `docs`

---

### CodeRabbit Integration (Code Review)

**Purpose**: Automated code review enforcing constitutional principles

**Configuration**: See `.coderabbit.yaml` for full config

**Constitutional Checks**:
1. **IMMUTABLE Principles**:
   - Privacy: No user data collection without consent
   - Accessibility: WCAG 2.1 AA compliance (color contrast, keyboard nav, ARIA)
   - Free Core: All Tier 0 features must be free

2. **Phase 1 Requirements**:
   - Manual testing only (no automated tests required)
   - Ship fast (2-week sprints)
   - Simple solutions (YAGNI principle)
   - User features > Infrastructure

3. **Code Quality**:
   - TypeScript strict mode
   - No console.log in production
   - Error handling for all async operations
   - Descriptive variable names

4. **Budget Focus**:
   - All features must serve core budgeting use case
   - No feature creep outside roadmap

**Rejection Criteria**:
- ❌ Violates IMMUTABLE principles
- ❌ Adds infrastructure without user feature
- ❌ Introduces automated tests (Phase 1)
- ❌ Adds dependencies without justification

**Approval Criteria**:
- ✅ Implements roadmap feature
- ✅ Follows Phase 1 principles
- ✅ Maintains accessibility
- ✅ Includes manual testing notes

---

### Claude Code Bot Integration (GitHub Actions)

**Purpose**: Automated spec implementation via GitHub Actions

**Workflow**:
1. Create spec with `/speckit.specify`
2. Create PR with spec file (title: "Spec: Feature Name")
3. Claude Code Bot triggers on PR
4. Bot reads spec.md and implements code
5. Bot creates implementation PR (title: "Implement: Feature Name")
6. CodeRabbit reviews implementation
7. Merge if CodeRabbit approves

**GitHub Action** (`.github/workflows/claude-code-bot.yml`):
- Triggers on PR with `specs/**/spec.md` changes
- Reads constitution + spec
- Implements feature following Phase 1 requirements
- Creates implementation PR
- Links back to spec PR

---

## Claude Code Prompt Templates

**Note**: Actual prompt templates are in `.claude/commands/*.md`. This section provides guidance on how to use them.

### Thinking Modes (By Feature Complexity)

**Simple Features (Tier 0)**:
- Use default thinking mode
- Quick implementation, minimal planning

**Medium Features (Tier 1)**:
- Use `think` mode for specification
- Consider edge cases, accessibility

**Complex Features (Tier 2)**:
- Use `think hard` mode for planning
- Evaluate multiple approaches
- Consider security, performance, scalability

**Critical Features** (authentication, payments, data migration):
- Use `think harder` or `ultrathink` mode
- Exhaustive analysis of risks
- Multiple validation passes

---

### Subagent Usage

**When to use subagents**:
- Verification of complex logic
- Security review of authentication code
- Accessibility audit of new UI components
- Performance analysis of data processing

**How to invoke**:
```
/subagent verify [component] against [criteria]
```

**Example**:
```
/subagent verify spending-categories accessibility against WCAG 2.1 AA
```

---

### Visual Iteration (UI Features)

**For UI-heavy features**:
1. Generate initial implementation
2. Take screenshot
3. Analyze screenshot for:
   - Visual hierarchy
   - Color contrast (accessibility)
   - Touch target sizes (mobile)
   - Responsive layout
4. Iterate based on visual analysis
5. Repeat until acceptance criteria met

---

### Git/GitHub Integration

**Mandatory Workflow** (IMMUTABLE):

1. **NEVER push directly to `main`** - All changes MUST go through PRs
2. **Create feature branch** - Use naming convention: `feature/XXX-feature-name` or `fix/XXX-bug-name`
3. **Create PR before merging** - All features require PR review, even in Phase 1
4. **Link Linear issue** - PR description MUST link to Linear issue (e.g., "Closes MMT-61")
5. **Wait for CI/CD** - PRs MUST pass all checks before merging
6. **Get approval** - At least one approval required (human or CodeRabbit)
7. **Squash and merge** - Keep `main` history clean

**Branch Naming Convention**:
- Features: `feature/XXX-short-description` (e.g., `feature/061-spending-categories`)
- Bugs: `fix/XXX-short-description` (e.g., `fix/076-budget-progress-crash`)
- Docs: `docs/XXX-short-description` (e.g., `docs/061-retrospective`)
- Chores: `chore/XXX-short-description` (e.g., `chore/update-dependencies`)

**PR Title Convention**:
- Features: `feat(scope): description` (e.g., `feat(budgets): add budget progress tracking`)
- Bugs: `fix(scope): description` (e.g., `fix(storage): prevent infinite loop in useLocalStorage`)
- Docs: `docs(scope): description` (e.g., `docs(readme): update feature list`)
- Chores: `chore(scope): description` (e.g., `chore(deps): update React to 19.1.1`)

**PR Description Template**:
```markdown
## Description
[Brief description of changes]

## Linear Issue
Closes [MMT-XXX](link)

## Changes
- [ ] Change 1
- [ ] Change 2

## Testing
- [ ] Manual testing completed
- [ ] Accessibility tested (keyboard + screen reader)
- [ ] Mobile tested

## Screenshots
[If UI changes]
```

**Claude Code handles 90%+ of git operations**:
- Branch creation (automatic via Spec-Kit)
- Commits (descriptive messages)
- Push to remote
- PR creation
- PR updates based on review

**Human handles**:
- PR approval
- Merge decisions
- Conflict resolution (if complex)

---

## Mandatory Features (Market Competitiveness)

**The Constitution mandates these features to ensure PayPlan is market-competitive with YNAB, Monarch, PocketGuard, and Copilot.**

### Tier 0: MVP Requirements (MUST HAVE)

**Target Completion**: Weeks 1-6

1. **Spending Categories**
   - Pre-defined categories: Groceries, Dining, Transportation, Housing, Utilities, Entertainment, Healthcare, Debt, Savings, etc.
   - Custom categories (user-defined, unlimited)
   - Category groups (e.g., "Food" contains Groceries + Dining)
   - Visual breakdown (pie chart, bar chart) with color-coded categories
   - Transaction assignment to categories
   - **Category Templates**: Pre-configured budget templates (50/30/20 rule, Zero-based, Envelope method)
   - **Custom Categorization Rules**: Auto-assign transactions by merchant ("All Amazon → Shopping")
   - **Gamification**: Visual spending breakdown ("Groceries is 32% of spending!") with colorful, engaging charts
   - **Market Rationale**: Solves YNAB's complexity problem with visual-first design; PayPlan's target users prefer charts over spreadsheets; 100% of competitors support custom rules
   - **Acceptance Criteria**: User can categorize transactions, create custom categories, set auto-rules, see spending breakdown chart

2. **Budget Creation & Tracking**
   - Set monthly limits per category
   - **Multiple Budget Methodologies**: Zero-based (assign every dollar), Envelope (virtual envelopes), 50/30/20 rule, Custom methodology
   - Visual progress bars ("$567 left of $8,230 budgeted")
   - Budget vs. actual reporting
   - Rollover support (carry unused balance to next month)
   - Budget templates (e.g., 50/30/20 rule)
   - Alerts when approaching budget limits (50%, 75%, 90%, 100% thresholds)
   - **Auto-Adjusting Spending Plan**: Budget recalculates based on actual spending patterns
   - **Gamification**: Progress bars (22% better budget adherence), milestone celebrations at 25%/50%/75%/100%, before/after comparisons ("You spent $200 less on dining this month!")
   - **Market Rationale**: Apps with progress bars see 22% better adherence; Simplifi supports multiple methodologies (vs. YNAB's rigid zero-based causing 30% user churn); PayPlan targets users with impulse spending issues who need visual boundaries
   - **Acceptance Criteria**: User can create budget, choose methodology, track progress, get alerts, switch methods without data loss

3. **Dashboard with Charts**
   - Net worth graph (if tracking accounts)
   - Spending by category (pie chart)
   - Monthly income vs. expenses (bar chart)
   - Recent transactions widget
   - Upcoming bills widget
   - Goal progress widget
   - **Projected Cash Flow Widget** (NEW): 30-day balance forecast with warnings
   - **Dashboard Customization**: Drag-and-drop widgets, hide/show, resize, reorder
   - **Light/Dark Mode**: Theme support with system preference sync
   - **Daily Spendable Amount**: "You have $147 left to spend today" (PocketGuard-style)
   - **Gamification**: Streak tracking ("14-day budget review streak!" = 48% engagement boost), personalized insights ("You spend 40% more on weekends"), recent wins ("You're $200 under budget!")
   - **Market Rationale**: Daily streak features increase engagement by 48%; 100% of competitors have dark mode (2025 standard); dashboard customization in 5/6 apps; daily spendable amount is PocketGuard's signature feature
   - **Acceptance Criteria**: Dashboard loads <1s, shows all widgets, fully responsive, customizable layout, supports light/dark themes

4. **Goal Tracking**
   - Create savings goals (target amount + date)
   - Visual progress (progress bar with percentage)
   - Multiple goal types: Emergency Fund, Vacation, Debt Payoff, Down Payment
   - Automatic contributions (link to budget)
   - Goal completion celebrations
   - **Gamification**: Goal-gradient effect (start at 10% not 0% for psychological boost), milestone badges at 25%/50%/75%/100%, visual countdown to goal date, confetti animations on completion
   - **Market Rationale**: Progress bars increase goal completion by 22%; users save 20% more with gamified apps; PayPlan's target users ($0-$400 emergency fund) need emergency fund goal with visual progress
   - **Acceptance Criteria**: User can create goal, track progress, receive completion notification

5. **Projected Cash Flow & Forecasting** (NEW - CRITICAL GAP)
   - Future balance projections (7, 14, 30, 90 days ahead)
   - "What-if" scenario modeling ("What if I spend $200 extra on dining?")
   - Intelligent warnings ("You'll run out of money by the 25th if current spending continues")
   - Daily/weekly projected balance timeline with visual graph
   - Income/expense forecasting using 3-month rolling averages
   - Seasonal pattern detection (holidays, tax refunds)
   - **Algorithm**: Linear regression on 3 months of historical data
   - **Accuracy Target**: 80% within ±$50 for 30-day projections
   - **Market Rationale**: 100% of premium competitors include cash flow forecasting; users living paycheck-to-paycheck (#1 target demo) NEED to know when money runs out; addresses YNAB user request for better planning tools
   - **Acceptance Criteria**: User can view projected balance for next 30 days, run "what-if" scenarios, receive low balance warnings 5 days in advance, projections achieve 80% accuracy

6. **Transaction Search & Advanced Filtering** (NEW - CRITICAL GAP)
   - **Quick Search**: Real-time search across all transactions (<300ms for 10,000 items)
   - **Search Fields**: Merchant name, amount, category, notes, tags, date range
   - **Advanced Filters**: Date range, amount min/max, category, payment method, recurring/one-time, flagged
   - **Saved Searches**: Save frequently-used filter combinations, one-click access
   - **Fuzzy Matching**: "star bucks" finds "Starbucks"
   - **Voice Search** (Mobile): Hands-free search via Web Speech API
   - **Export Filtered Results**: CSV export of search results
   - **Performance**: Indexed search using Fuse.js or IndexedDB fulltext
   - **Market Rationale**: 100% of competitors have robust search; users with >500 transactions cannot function without search; power users perform 5-10 searches per session; search is #2 most-used feature after dashboard
   - **Acceptance Criteria**: User can search 10,000 transactions in <300ms, filter by multiple criteria, save searches, export results, works offline

7. **Transaction Reconciliation & Duplicate Management** (NEW - CRITICAL GAP)
   - **Automatic Duplicate Detection**: Match manual entries with bank imports (85% similarity, ±3 days, same amount ±$0.01)
   - **Reconciliation Workflow**: Mark accounts as "reconciled", compare with bank statement, identify discrepancies
   - **Import Matching**: Preview duplicates before CSV import, swipe-to-match on mobile, bulk merge high-confidence (95%+)
   - **Confidence Scoring**: 95-100% auto-merge, 75-94% suggest merge, <75% no action
   - **Undo Support**: Undo merges within 30 days
   - **Market Rationale**: 100% of competitors have reconciliation; prevents double-counting (major user complaint); essential for users mixing manual entry + bank sync; Goodbudget made this a 2025 premium feature (high demand)
   - **Acceptance Criteria**: System detects 95%+ of true duplicates, false positive rate <5%, user can reconcile account in <5 minutes, bulk import with duplicate detection completes in <10s

8. **Manual Transaction Entry & Editing** (ENHANCED from previous implicit mention)
   - Quick-add form (<15 seconds entry time)
   - Transaction editing/deletion with undo
   - **Transaction Notes & Receipt Attachments**: Add notes, attach receipt photos (base64 in localStorage)
   - **Transaction Splitting**: Split one transaction across multiple categories or people
   - **Bulk Actions**: Edit multiple transactions at once (category, merchant name, tags)
   - **Transaction Tags**: Custom hashtags (#business, #reimbursable, #tax-deductible)
   - Search and filter (see Feature #6)
   - Zod validation (amount >0, date valid, category exists)
   - **Market Rationale**: Transaction notes/receipts in 4/6 competitors (critical for tax documentation); bulk actions in 5/6 apps (efficiency); splitting in 3/6 apps (shared expenses, roommates)
   - **Acceptance Criteria**: User can enter transaction in <15s, add notes/receipts, split across categories, bulk-edit 50 transactions in <30s

---

### Tier 1: Competitive Parity (SHOULD HAVE)

**Target Completion**: Weeks 7-12

9. **Recurring Transaction Detection**
   - Auto-detect subscriptions from patterns (same merchant, similar amount, regular interval)
   - Mark transactions as recurring (frequency: weekly, monthly, yearly)
   - Alert on price changes ("Netflix increased from $15.99 to $17.99")
   - Quick view of all recurring charges with total monthly cost
   - **Calendar/List View**: Toggle between calendar and list display (Monarch-style)
   - **Pause/Cancel Tracking**: Mark subscriptions as paused, set resume date, track cancelled with cancellation date
   - **Manual Recurring Entry**: User can manually mark transactions as recurring
   - **Recurring Categories**: Bills, Subscriptions, Paychecks (income)
   - **Market Rationale**: Subscription fatigue is top complaint; Copilot shows "$347/month in subscriptions" prominently; users need total visibility to reduce unnecessary spending; pause tracking prevents forgotten subscriptions
   - **Acceptance Criteria**: App detects 80% of recurring transactions automatically, users can manually flag/unflag, calendar view available, pause tracking works

10. **Bill Reminders & Real-Time Alerts** (ENHANCED - formerly "Bill Reminders & Alerts")
   - **Bill Reminders**:
     - Upcoming bill notifications (7 days, 3 days, 1 day before due date)
     - Overdue payment warnings
     - Bill calendar view (see all upcoming bills at a glance)

   - **Budget Alerts** (NEW):
     - Threshold warnings: 50%, 75%, 90%, 100% of budget spent
     - Category overspending: "You've exceeded Dining budget by $45"
     - Daily spending digest: "You spent $67 today across 4 categories"

   - **Financial Health Alerts** (NEW - Copilot-style):
     - Low balance warnings: "Balance will drop below $50 in 3 days"
     - Overdraft prevention: "3 bills due before next paycheck ($450 total)"
     - Unexpected fees detected: "Bank charged $35 overdraft fee"
     - Price change alerts: "Netflix increased from $15.99 to $17.99"

   - **Fraud & Security Alerts** (NEW):
     - Unusual spending: "$500 transaction at new merchant - did you authorize?"
     - Duplicate transaction warnings: "Possible duplicate charge detected"
     - Large transaction alerts: "Spending >$200 requires confirmation"

   - **Positive Reinforcement Alerts** (NEW - Gamification):
     - Income alerts: "You got paid! $1,200 deposited"
     - Under-budget celebration: "You're $50 under Dining budget - nice!"
     - Streak milestones: "5-day budget review streak! Keep it up!"
     - Goal progress: "You're 75% to your Emergency Fund goal!"

   - **Alert Preferences**:
     - User controls: Frequency (real-time, daily digest, weekly), channels (in-app, email, push), thresholds (custom amounts)
     - Disable by type: Turn off gamification alerts, keep security alerts
     - Quiet hours: No alerts 10pm-7am (customizable)

   - **Market Rationale**: Copilot lists 8 alert types as core value prop ("Build credit, Prevent overdraft, Stick to budgets, Spot fees, Stop fraud, Know when paid, Catch bill changes"); real-time alerts in Simplifi, PocketGuard watchlist; users living paycheck-to-paycheck need proactive warnings to avoid fees
   - **Acceptance Criteria**: User receives timely, actionable alerts; <1% false positive rate; user can customize all alerts; alerts respect quiet hours; no alert fatigue (max 3 alerts/day unless critical)

11. **Cash Flow Reports & Analytics** (ENHANCED)
   - Monthly income vs. expenses summary
   - Year-over-year comparisons
   - Spending trends over time (last 3, 6, 12 months)
   - Historical analysis (complements Feature #5 Projected Cash Flow for forward-looking)
   - **Custom Report Builder** (NEW): Create reports with custom date ranges, category filters, groupings
   - **Exportable Reports**: PDF (formatted with charts), CSV (raw data), .ics (bill calendar), QIF/OFX (import to other apps)
   - **Report Templates**: Monthly summary, year-end tax report, category deep-dive, net worth statement
   - **Scheduled Reports** (Phase 2): Auto-generate monthly reports, email to user
   - **Market Rationale**: YNAB users request year-over-year comparisons; Simplifi offers custom report builder; PDF export in 100% of competitors (tax filing, advisors); users need printable/shareable reports
   - **Acceptance Criteria**: User can view cash flow trends, create custom reports, export in 4 formats (PDF, CSV, .ics, QIF), PDF includes charts and branding

12. **Debt Payoff Calculator**
   - Snowball method (smallest balance first)
   - Avalanche method (highest interest first)
   - Interest savings calculator
   - Payoff timeline projections
   - Extra payment impact modeling
   - Visual debt-free date countdown ("473 days until debt-free!")
   - **Market Rationale**: Users need visual debt payoff tools to see path out of debt; visual countdown motivates completion; helps users living paycheck-to-paycheck plan debt freedom
   - **Acceptance Criteria**: User can model debt payoff strategies and see interest savings

13. **Credit Score Tracking & Monitoring** (NEW - HIGH PRIORITY)
   - Monthly credit score updates via VantageScore API
   - Credit score trend graph (6-month, 12-month history)
   - Notifications for significant changes (+/- 10 points)
   - Credit utilization percentage tracking
   - Factors affecting score breakdown (payment history, credit utilization, account age, etc.)
   - **Privacy Compliance**: Explicit opt-in required; credit data encrypted locally; API calls only for updates
   - **Market Rationale**: 4/6 premium competitors include credit tracking (Monarch, PocketGuard, Simplifi, Copilot); users managing debt fear credit score damage; 67% of target users check credit score monthly
   - **Acceptance Criteria**: User can view credit score, see 12-month trend, receive change alerts, understand factors, opt-in/opt-out easily

14. **Refund & Return Tracker** (NEW - HIGH PRIORITY)
   - Mark transactions as "pending refund" with expected refund date
   - Track refund status (pending, received, denied, partial)
   - Alerts when refund posts to account or is overdue
   - Return deadline tracking (30-day, 90-day store policies)
   - Refund amount vs. original purchase comparison
   - Link refund to original transaction (transaction pairing)
   - **Market Rationale**: Simplifi and Copilot offer this; helps users manage returns and avoid forgotten refunds; average user has $50-100 in pending refunds at any time
   - **Acceptance Criteria**: User can mark transaction as pending refund, track status, receive alerts when refund received or overdue

15. **Real Estate & Asset Tracking** (NEW - HIGH PRIORITY)
   - **Real Estate**: Enter property address, auto-pull Zillow Zestimate for current value, track home equity over time
   - **Vehicles**: Enter make/model/year, estimate value (KBB integration or manual), track depreciation
   - **Other Assets**: Manual entry for jewelry, collectibles, investment property, business equipment
   - **Asset Categories**: Primary Residence, Investment Property, Vehicles, Personal Property, Other
   - **Net Worth Calculation**: Total assets - total liabilities = net worth
   - **Net Worth Chart**: Track net worth growth over time (monthly, quarterly, yearly)
   - **Market Rationale**: Monarch integrates Zillow; Simplifi and Copilot track assets; net worth tracking in 100% of comprehensive budget apps; users need complete financial picture
   - **Acceptance Criteria**: User can add properties with Zillow values, track vehicles, see consolidated net worth chart

16. **Offline Mode & Cross-Device Sync** (NEW - HIGH PRIORITY)
   - **Full Offline Functionality**: All core features work without internet connection
   - **Background Sync**: Auto-sync when connection restored, queue changes offline
   - **Conflict Resolution**: Last-write-wins or user chooses (show both versions side-by-side)
   - **Sync Status Indicator**: Visual indicator (synced, syncing, offline, conflicts)
   - **Offline Indicator**: Banner showing "Working offline - changes will sync when connected"
   - **Manual Sync Trigger**: Pull-to-refresh to force sync check
   - **Privacy Compliance**: Sync is OPT-IN (Premium feature); offline-first is default; no data leaves device unless user opts into sync
   - **Market Rationale**: YNAB explicitly advertises "works offline!"; users expect budget apps to work on subway, airplane, low-signal areas; 5/6 competitors support offline
   - **Acceptance Criteria**: User can use all core features offline, data syncs automatically when online, conflicts resolved gracefully, sync status always visible

---

### Tier 2: Differentiation (MAY HAVE - Optional Premium)

**Target Completion**: Weeks 13-24

17. **Bank Account Sync (OPTIONAL PREMIUM)** (ENHANCED)
   - **Multi-Aggregator Strategy**: Plaid + MX for redundancy (if one fails, try other)
   - **Connectivity Requirement**: Minimum 12,000+ financial institutions (competitive with industry standard 11K-18K)
   - Explicit opt-in with privacy disclosure
   - Real-time transaction import
   - Multi-institution support (unlimited accounts)
   - Manual account option (localStorage only, always available as fallback)
   - Sync on/off toggle per account
   - **Connection Health Monitoring**: Auto-retry failed connections, notify after 3 failures, guide user through re-authorization
   - **Biometric Authentication** (NEW): Face ID, Touch ID, fingerprint for quick secure access on mobile
   - **Market Rationale**: PocketGuard uses 18K+ institutions as differentiator; Monarch uses multiple aggregators for 99% uptime; bank sync failures are #1 complaint (Monarch 32% of complaints); biometric auth is mobile standard in 2025
   - **Acceptance Criteria**: 95% of US users can connect primary bank, sync succeeds >99% of time, failed connections auto-retry 3x before alerting user, biometric auth available on supported devices

18. **AI-Powered Categorization (Premium)** (ENHANCED)
    - Machine learning transaction categorization
    - **Accuracy Target**: 90% correct out-of-box (matches Copilot), improves to 95%+ after 30 days with user corrections
    - Learn from user corrections (reinforcement learning)
    - Custom rule suggestions ("Noticed you always categorize Chipotle as Dining - create auto-rule?")
    - Confidence scoring per transaction (High/Medium/Low visual indicator)
    - **Fallback**: Rule-based categorization if ML model unavailable or confidence <50%
    - Privacy-preserving (client-side TensorFlow.js model, no data leaves device)
    - **Performance**: Categorization completes in <500ms per transaction, batch processing for imports
    - **AI Market Context**: AI in personal finance growing from $1B (2025) → $3.7B (2033) = 270% growth; apps with AI see 2x daily engagement; ML categorization improves accuracy by 22%; users save 20% more with AI-powered apps
    - **Implementation**: Client-side TensorFlow.js for privacy preservation; model trained on anonymized dataset; no PII sent to server
    - **Acceptance Criteria**: 90% accuracy in first 7 days, 95% after 30 days, <500ms categorization time, works offline, suggests useful rules

11. **Investment Tracking (Premium)**
    - Connect brokerage accounts (Plaid)
    - Stock, ETF, mutual fund, bond tracking
    - Asset allocation visualization
    - Performance over time
    - Net worth including investments
    - **Acceptance Criteria**: User can track investments and see portfolio performance

20. **Multi-User Collaboration (Premium)** (ENHANCED)
    - Share budget with partner/family (**up to 6 users, matching YNAB Together**)
    - Real-time sync across devices (Supabase)
    - Permission controls (Owner, Editor, Viewer roles)
    - Shared expense tracking with split suggestions
    - Activity log (who changed what, timestamp)
    - **Invite System**: Email invites, shareable links, QR codes
    - **Privacy Controls**: Each user controls their own notifications, theme, view preferences
    - **Market Rationale**: YNAB Together (6 users for price of 1) is major selling point; Monarch includes partner access free; couples/families are high-value segment (lower churn, higher engagement)
    - **Acceptance Criteria**: Multiple users can collaborate on shared budget in real-time, permissions enforced, activity log visible, each user has independent preferences

21. **Educational Content & Financial Literacy** (NEW - HIGH PRIORITY)
    - **Interactive Guides**: In-app tutorials for budgeting basics, debt management, goal setting
    - **Video Library**: Short (<5 min) videos on financial topics (How to budget, Emergency funds, Debt payoff)
    - **Blog/Articles**: Weekly personal finance tips, success stories, feature announcements
    - **Free Workshops** (Phase 3): Live webinars on budgeting strategies (inspired by YNAB's daily workshops)
    - **Budget Bootcamp**: 7-day email course for beginners (Goodbudget-style)
    - **Help Center**: Searchable FAQ, troubleshooting guides, feature documentation
    - **Tooltips & Contextual Help**: "?" icons throughout app explaining features
    - **Market Rationale**: YNAB's educational content is #1 differentiator (user surveys); Goodbudget has Budget Bootcamp course; users rate educational apps 30% higher; low-income target demo needs financial literacy support
    - **Acceptance Criteria**: 10+ interactive guides, 20+ video tutorials, weekly blog posts, searchable help center, tooltips on all complex features

22. **Community & Support Ecosystem** (NEW - HIGH PRIORITY)
    - **Community Forums**: Reddit-style discussion board for PayPlan users
    - **Discord Server**: Real-time chat for questions, feature requests, troubleshooting
    - **GitHub Discussions**: Open-source community for contributors
    - **User Success Stories**: Showcase debt payoff wins, savings milestones (with permission)
    - **Feature Voting**: Public roadmap where users vote on next features (Linear integration)
    - **Support Channels**:
      - Email support (response within 48 hours)
      - Community support (peer-to-peer help)
      - Documentation (self-serve help center)
      - Premium: Priority support (24-hour response)
    - **Market Rationale**: YNAB's r/ynab has 100K+ members ("nicest subreddit ever" per reviews); Goodbudget has active forums; community-driven apps have 40% lower churn; users want peer support
    - **Acceptance Criteria**: Forum launched with 100+ members, Discord server active, public roadmap published, email support <48hr response time, help center searchable

---

## Technology Stack & Standards

### Core Technologies (Immutable)

**Frontend**:
- React 19.1.1 (UI framework)
- TypeScript 5.8.3 (type safety)
- Tailwind CSS 4.1.13 (styling)
- Radix UI (accessible component primitives)
- Recharts or Chart.js (data visualization)

**Backend** (optional, for premium features):
- Node.js 20.x
- Supabase (database + auth + real-time)

**Testing**:
- Vitest 3.2.4 (unit/integration tests)
- Playwright (E2E tests)
- Testing Library (React component tests)
- axe-core (accessibility tests)

**Build & Deploy**:
- Vite 6.1.9 (build tool)
- Vercel (hosting)

**Libraries**:
- Zod 4.1.11 (schema validation)
- PapaParse 5.5.3 (CSV parsing)
- uuid 13.0.0 (unique IDs)

**Storage**:
- localStorage (primary, privacy-first)
- Supabase (optional, for sync/collaboration)

### Code Standards

**TypeScript**:
- Strict mode enabled
- No `any` types (use `unknown` and narrow)
- Explicit return types on public functions
- Interface over type alias for objects

**React**:
- Functional components only
- Custom hooks for reusable logic
- Context for global state (no Redux unless needed)
- Memoization for expensive computations

**CSS**:
- Tailwind utility-first approach
- Custom CSS only when Tailwind insufficient
- BEM naming for custom CSS
- Mobile-first media queries

**Naming Conventions**:
- Files: `kebab-case.tsx` (components: `PascalCase.tsx`)
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

---

## Performance Standards (PHASED)

**Principle**: Performance matters, but premature optimization is waste. Optimize when users complain or metrics show issues.

---

### Phase 1: Pre-MVP (0-100 users) **← CURRENT PHASE**

**Goal**: Ship features fast, optimize only if users complain

**Requirements**:
- **No performance targets**: Focus on feature velocity
- **Manual testing**: Features must feel responsive during manual testing
- **Optimize if users complain**: If users report "slow" or "laggy", then optimize

**Allowed**:
- ✅ Ship features without performance optimization
- ✅ Unoptimized images (optimize later if needed)
- ✅ Blocking JavaScript (optimize later if needed)

**Prohibited**:
- ❌ Shipping features that feel obviously slow during manual testing (e.g., >5s page loads)

---

### Phase 2: Early Adoption (100-1,000 users)

**Goal**: Ensure decent performance, address user complaints

**Load Time Targets**:
- Initial Page Load: <5s (3G connection)
- Time to Interactive (TTI): <8s
- First Contentful Paint (FCP): <3s

**Operation Performance**:
- Index Loading: <3s (localStorage read)
- CSV Export (1000 payments): <10s
- Chart Rendering: <2s
- Page Transitions: <1s

**Size Budgets**:
- JavaScript Bundle: <500KB (gzipped)
- CSS Bundle: <100KB (gzipped)

---

### Phase 3: Growth (1,000-10,000 users)

**Goal**: Professional-grade performance, competitive with YNAB/Monarch

**Load Time Targets**:
- Initial Page Load: <3s (3G connection)
- Time to Interactive (TTI): <5s
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s

**Operation Performance**:
- Index Loading: <1s (localStorage read)
- CSV Export (1000 payments): <5s
- Chart Rendering: <1s
- Page Transitions: <500ms
- Search Results: <500ms

**Size Budgets**:
- JavaScript Bundle: <350KB (gzipped)
- CSS Bundle: <75KB (gzipped)
- localStorage Storage: 5MB max
- Individual Archive: 50KB max

**Prohibited**:
- ❌ Shipping features that miss targets by >20%
- ❌ Unoptimized images (must use WebP + lazy loading)

---

### Phase 4: Scale (10,000+ users)

**Goal**: Best-in-class performance, faster than competitors

**Load Time Targets**:
- Initial Page Load: <2s (3G connection)
- Time to Interactive (TTI): <3s
- First Contentful Paint (FCP): <1s
- Largest Contentful Paint (LCP): <2s

**Operation Performance**:
- Index Loading: <100ms (localStorage read)
- CSV Export (1000 payments): <3s
- Chart Rendering: <500ms
- Page Transitions: <200ms
- Search Results: <300ms

**Size Budgets**:
- JavaScript Bundle: <250KB (gzipped)
- CSS Bundle: <50KB (gzipped)
- localStorage Storage: 5MB max
- Individual Archive: 50KB max

**Prohibited**:
- ❌ Shipping features that miss targets by >10%
- ❌ Unoptimized images
- ❌ Blocking JavaScript on critical path
- ❌ Synchronous localStorage operations in render path

---

## Security Standards (ENHANCED - 2025 Compliance)

### Encryption & Data Protection

**PCI DSS 4.0.1 Compliance** (NEW - Effective March 31, 2025):
- **Encryption at Rest**: AES-256-GCM for sensitive data in localStorage
- **Encryption in Transit**: TLS 1.3 preferred, TLS 1.2 minimum (TLS 1.0/1.1 prohibited)
- **Cryptographic Hashing**: HMAC-SHA256 for PAN/card data (if storing last 4 digits)
- **Key Management**:
  - Secure key storage (Web Crypto API)
  - Key rotation every 12 months
  - Separate keys for production vs. development
- **No Storage Prohibited**: CVV, full magnetic stripe, full PAN (card numbers)
- **Secure Key Exchange**: RSA 2048-bit minimum for key exchange
- **Access Control**: Multi-factor authentication for admin/premium features

**Browser Security Headers**:
- Content Security Policy (CSP): `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
- X-Frame-Options: DENY (prevent clickjacking)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS): max-age=31536000; includeSubDomains
- Referrer-Policy: no-referrer-when-downgrade

**Data Protection**:
- **PII Sanitization**: Regex patterns + word boundaries for emails, names, addresses, SSNs, credit cards
- **Input Validation**: Zod schemas for ALL user inputs (no exceptions)
- **XSS Protection**: React's built-in escaping + CSP headers + sanitize dangerouslySetInnerHTML
- **CSV Injection**: Escape `=`, `+`, `-`, `@` prefixes in all CSV exports
- **CSRF Protection**: Use CSRF tokens for all state-changing server requests
- **SQL Injection Prevention**: Parameterized queries only (Supabase handles this)

### Authentication (Optional Premium Features) - ENHANCED

**Supabase Auth**:
- Email/password (primary method)
- Google OAuth (social login)
- Magic links (passwordless)
- Apple Sign-In (iOS users)

**Password Security** (NIST 800-63B Standards):
- **Minimum Length**: 12 characters (NIST recommendation, up from common 8-char)
- **No Complexity Requirements**: Passphrases > random character combinations
- **Breach Detection**: Check against Have I Been Pwned API before accepting password
- **No Password Hints**: Security questions prohibited (social engineering risk)
- **No Expiration**: Passwords don't expire (forced rotation reduces security per NIST)

**Session Management**:
- HTTP-only cookies with Secure and SameSite flags
- Session timeout: 30 days idle, 90 days absolute maximum
- Concurrent session limit: 5 devices
- Force logout on password change
- "Log out all devices" option in Settings

**Multi-Factor Authentication (MFA)** - ENHANCED:
- **TOTP** (Time-based One-Time Password): Google Authenticator, Authy, 1Password
- **SMS Backup Codes** (not primary method per NIST - SIM swapping risk)
- **Recovery Codes**: 10 one-time use codes, downloadable on MFA setup
- **Biometric** (NEW): Face ID, Touch ID, fingerprint on supported devices (replaces password for quick access)

### Privacy Compliance (ENHANCED - Multi-Jurisdiction)

**European Union**:
- **GDPR (General Data Protection Regulation)**:
  - Right to access: User can download all data in machine-readable format (JSON, CSV)
  - Right to deletion: All data deleted within 30 days of request (with confirmation)
  - Right to portability: Export includes all metadata for import to competitors
  - Clear affirmative consent: No pre-checked boxes, explicit opt-in for all data collection
  - Data minimization: Collect only what's needed for feature functionality

- **DORA (Digital Operational Resilience Act)** (NEW - Effective January 17, 2025):
  - **Cybersecurity Risk Management**: Documented risk assessment, incident response plan
  - **ICT Incident Reporting**: Report major incidents to authorities within 72 hours
  - **Operational Resilience Testing**: Annual testing of disaster recovery, backup systems
  - **Third-Party Risk Management**: Assess security of Plaid, Supabase, Vercel dependencies
  - **Applies If**: PayPlan has EU users and handles financial data (likely yes)

**United States**:
- **CCPA (California Consumer Privacy Act)**:
  - Privacy policy with data collection disclosure
  - Opt-out rights for data sale/disclosure
  - Deletion rights honored within 45 days
  - **Penalties**: $2,500/violation (unintentional), $7,500/violation (intentional)
  - **Consumer Lawsuits**: $100-$750 per incident for data breaches

- **COPPA (Children's Online Privacy Protection Act)** (NEW - Amendments June 23, 2025):
  - **Age Gate**: If targeting users <18, verify parental consent for <13
  - **Direct Notice**: Disclose third-party data recipients
  - **Separate Consent**: Collection consent separate from sharing consent
  - **PayPlan Consideration**: Target age is 18-35; some 16-17 year-olds may use; implement age verification

- **GLBA (Gramm-Leach-Bliley Act)** (NEW - US Financial Data Standard):
  - **Safeguards Rule**: Administrative, technical, physical security controls
  - **Administrative**: Risk assessments, access controls, employee training
  - **Technical**: Encryption (AES-256), authentication (MFA), monitoring (access logs)
  - **Physical**: Secure facilities, data disposal procedures
  - **Privacy Notices**: Inform users of data practices annually
  - **Applies To**: Any app handling financial account data (yes for PayPlan if bank sync)

**Multi-State Privacy Laws** (20+ US states by 2025):
- Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), etc.
- **Unified Approach**: Meet CCPA + GDPR = covers most state-specific laws
- Monitor new state laws quarterly

**Data Retention Policies**:
- Telemetry/analytics: 30-day maximum, then auto-delete
- User financial data: Retained until user requests deletion (must honor within 30 days)
- Anonymized aggregate data: May retain indefinitely for product improvement (no PII)
- Backup data: 90-day retention, encrypted, auto-purge

**Consent Management** (ENHANCED):
- **Granular Opt-In**: Separate checkboxes for:
  - [ ] Analytics & usage tracking
  - [ ] Cloud sync & backup (Premium)
  - [ ] Email notifications
  - [ ] Marketing communications
  - [ ] Community features (forums, success stories)
- **Easy Opt-Out**: One-click disable in Settings, no dark patterns
- **Consent Dashboard**: Show all active permissions, last modified dates
- **Consent History**: Log all consent changes with timestamps

**Prohibited**:
- ❌ Storing passwords in plain text or reversible encryption
- ❌ Logging PII to console, telemetry, or error tracking
- ❌ Third-party trackers without consent
- ❌ Using deprecated encryption (MD5, SHA-1, DES, 3DES, RC4)
- ❌ TLS 1.0 or 1.1 (must be 1.2+, prefer 1.3)
- ❌ Selling user data to third parties (IMMUTABLE prohibition)

---

## Git Workflow

**Branch Naming**:
- Feature branches: `feature/XXX-feature-name` (e.g., `feature/020-spending-categories`)
- Bugfix branches: `bugfix/issue-description`
- Hotfix branches: `hotfix/critical-issue`

**Commit Messages**:
- Format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Example: `feat(categories): Add spending category creation UI`

**Pull Request Requirements**:
- All tests passing (100%)
- Accessibility tests passing
- Code review approved (1+ reviewer)
- Constitution compliance verified
- CLAUDE.md updated (if stack changes)

---

## Quality Gates

### Pre-Merge Checklist (Phase 1)

- [ ] Feature works as described in spec/issue
- [ ] Manual testing completed
- [ ] Screen reader tested (NVDA or VoiceOver)
- [ ] Keyboard navigation tested
- [ ] Mobile responsive tested (iPhone, Android)
- [ ] PII sanitization verified (if handling sensitive data)
- [ ] Constitution compliance verified
- [ ] CLAUDE.md updated (if tech stack changed)
- [ ] Code review approved
- [ ] User story acceptance criteria met

### Release Checklist

- [ ] All quality gates passed
- [ ] Changelog updated
- [ ] Version bumped (MAJOR.MINOR.PATCH)
- [ ] Documentation updated
- [ ] Demo video recorded (optional)
- [ ] Stakeholder approval
- [ ] Deployment plan reviewed
- [ ] Rollback plan documented

---

## Governance (ENHANCED - ADR Integration)

### Constitutional Authority

1. **Supremacy**: This Constitution supersedes all other development practices, style guides, preferences, and verbal agreements

2. **Immutability Tiers** (NEW - Based on Spec-Kit & ADR Best Practices):
   - **Tier 1 (Immutable)**: Principles I-III, VIII (Privacy, Accessibility, Free Core, Ethical Gamification)
     - Cannot be changed without creating Constitution v3.0+ (MAJOR version)
     - Require HIL approval + 30-day community comment period (if open-source)
     - Backward compatibility assessment mandatory
   - **Tier 2 (Evolvable)**: Principles IV-VII (Visual, Mobile, Quality, Simplicity)
     - Can be amended via standard amendment process
     - Require written RFC + stakeholder review + HIL approval
     - Minor version bump (e.g., v2.0 → v2.1)
   - **Tier 3 (Flexible)**: Mandatory Features, Performance Targets, Tech Stack
     - Can be updated via Architecture Decision Records (ADRs) or patch version bumps
     - Require justification + impact analysis
     - Patch version bump (e.g., v2.1.0 → v2.1.1)

3. **Amendment Process** (ENHANCED):
   - **For Tier 1 (Immutable Principles)**:
     1. Create RFC (Request for Comments) in `docs/rfcs/NNNN-title.md`
     2. 30-day public comment period
     3. Address all feedback, document alternatives considered
     4. Stakeholder review (Manus, DevRel if exists, power users)
     5. HIL final approval (required)
     6. Update constitution with MAJOR version bump (x.0.0)
     7. Create migration guide for affected features in `docs/migrations/`
     8. Announce change in changelog, blog, Discord/community

   - **For Tier 2 (Evolvable Principles)**:
     1. Create RFC with justification, context, consequences
     2. 7-day stakeholder review
     3. HIL approval
     4. Update constitution with MINOR version bump (1.x.0)
     5. Update dependent docs (CLAUDE.md, .coderabbit.yaml)

   - **For Tier 3 (Flexible Features/Standards)**:
     1. Create ADR in `docs/architecture/decisions/NNN-title.md` following Michael Nygard template
     2. Stakeholder review (async, 48-hour window)
     3. Update constitution with PATCH version bump (1.1.x)
     4. No migration needed (should be backward compatible)

4. **ADR Integration** (NEW - Inspired by Rust, React, TypeScript governance):
   - **Constitution vs. ADR Relationship**:
     - **Constitution**: Immutable principles and mandatory features (the "WHY")
     - **ADRs**: Specific architectural decisions implementing principles (the "HOW")
     - **Example**:
       - Constitution: "Privacy-First (localStorage default)" ← Principle
       - ADR-003: "Use IndexedDB over localStorage for >5MB data" ← Implementation decision

   - **When to Create ADR**:
     - ✅ Major refactors (type system changes, validation strategy)
     - ✅ Architectural patterns (interface-first vs schema-first)
     - ✅ Technology choices (library selection, framework decisions)
     - ✅ Cross-cutting concerns (error handling, date arithmetic)
     - ✅ Breaking changes (API changes, storage format migrations)
     - ❌ Minor bug fixes, UI tweaks, documentation updates

   - **ADR Format** (Michael Nygard Template):
     ```markdown
     # ADR NNN: [Title in Present Tense Imperative]

     **Date**: YYYY-MM-DD
     **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX

     ## Context
     [Forces at play, constraints, problem being solved]

     ## Decision
     [Active voice: "We will use IndexedDB for..."]

     ## Consequences
     [Positive, negative, neutral outcomes]

     ## Alternatives Considered
     [Why we didn't choose X, Y, Z]
     ```

   - **ADR Location**: `docs/architecture/decisions/NNN-title.md`
   - **ADR Numbering**: Sequential, never reused, superseded ADRs stay in repo
   - **ADR Immutability**: Once accepted, ADRs are immutable (like git commits)

5. **Versioning Policy** (NEW - Semantic Versioning for Constitution):
   - **MAJOR** (x.0.0): Tier 1 principle changes (backward-incompatible governance)
   - **MINOR** (1.x.0): Tier 2 principle additions/modifications, new mandatory features
   - **PATCH** (1.1.x): Tier 3 updates, clarifications, typo fixes, non-semantic refinements

### Compliance Enforcement (ENHANCED)

1. **Pre-Commit Hooks**: Lint, format, check for `console.log` in production code
2. **CI/CD Pipeline**:
   - **CodeRabbit AI**: Constitutional compliance check (blocks merge if principles violated)
   - **Claude Code Bot**: Spec implementation verification
   - **GitHub Actions**: Run tests (Phase 2+), accessibility checks (axe-core), security scanning
3. **Code Review**: ALL PRs must include "Constitutional Compliance" checkbox
4. **Quarterly Audits** (Phase 3+): Review codebase for drift from principles, update ADRs if patterns emerge
5. **Bot Review Loop** (Current Workflow):
   - Both bots (CodeRabbit + Claude Code Bot) must approve (green) before HIL review
   - CRITICAL/HIGH violations block merge immediately
   - MEDIUM/LOW violations deferred to Linear with `bot-suggestion` label

### Violation Response (ENHANCED)

**Minor Violations** (missing accessibility label, incomplete error handling):
- Fix in current PR before merge
- Document in PR description why it happened
- Add guardrails to prevent recurrence (ESLint rule, type check, etc.)
- No block on merge after fix

**Major Violations** (privacy breach, PII leak, accessibility blocker, WCAG 2.2 failure):
- **BLOCK RELEASE IMMEDIATELY**
- Root cause analysis (RCA) required in `docs/incidents/YYYY-MM-DD-incident-name.md`
- Remediation plan with timeline and responsible party
- Post-mortem documentation (what happened, why, how to prevent)
- Update constitution/ADRs if principle itself was unclear
- Stakeholder notification (HIL, users if data breach, authorities if GDPR/CCPA violation)
- Cannot deploy until fix verified by independent review

**Constitutional Amendment** (when principle itself needs changing):
1. Create RFC in `docs/rfcs/NNNN-title.md` with full context, decision, consequences
2. 30-day public comment period (if open-source) or stakeholder review (if private)
3. Manus reviews for Spec-Kit alignment
4. HIL final approval (required for Tier 1 changes)
5. Update constitution with appropriate version bump
6. Create migration guide in `docs/migrations/vX.Y-migration-guide.md`
7. Announce in changelog, blog post, community channels
8. Update all dependent documents (CLAUDE.md, .coderabbit.yaml, README.md, specs templates)

---

## Appendix: Competitor Analysis

### Competitor Feature Matrix

**PayPlan must match or exceed these capabilities**:

| Feature | YNAB | Monarch | PocketGuard | Copilot | Simplifi | PayPlan v2.0 |
|---------|------|---------|-------------|---------|----------|---------------|
| **Core Features** |
| Spending Categories | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) |
| Budget Creation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) |
| Goal Tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) |
| Dashboard & Charts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) |
| **NEW v2.0 Features** |
| Projected Cash Flow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) ← NEW |
| Transaction Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) ← NEW |
| Reconciliation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) ← NEW |
| Dark Mode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) ← NEW |
| Dashboard Customization | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ (Tier 0) ← NEW |
| Transaction Notes/Receipts | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ (Tier 0) ← NEW |
| Bulk Actions | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 0) ← NEW |
| Transaction Splitting | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ (Tier 0) ← NEW |
| **Tier 1 Features** |
| Recurring Detection | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 1) |
| Bill Reminders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 1) |
| Real-Time Alerts (8 types) | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ (Tier 1) ← ENHANCED |
| Debt Payoff Calc | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (Tier 1) |
| Cash Flow Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 1) |
| Credit Score Tracking | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (Tier 1) ← NEW |
| Refund Tracker | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ (Tier 1) ← NEW |
| Asset Tracking (Real Estate) | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ (Tier 1) ← NEW |
| Offline Mode | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ (Tier 1) ← NEW |
| **Premium Features** |
| Bank Sync (12K+ institutions) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (Tier 2 Premium) |
| AI Categorization (90% accuracy) | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ (Tier 2 Premium) |
| Investment Tracking | ❌ | ✅ | ❌ | ✅ | ✅ | ⚠️ (Tier 2 Premium) |
| Multi-User (6 users) | ✅ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ (Tier 2 Premium) |
| Educational Content | ✅ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ (Tier 2 Premium) ← NEW |
| Community Support | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ (Tier 2 Premium) ← NEW |
| **Unique Advantages** |
| Privacy-First (no auth required) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** |
| Free Core (16 features) | ❌ ($109) | ❌ ($100) | ⚠️ (Limited) | ❌ ($95) | ❌ ($72) | ✅ **UNIQUE** |
| Visual-First & Gamification | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ **UNIQUE** |
| Ethical Gamification Framework | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** |
| WCAG 2.2 AA Compliant | ⚠️ | ⚠️ | ❌ | ⚠️ | ⚠️ | ✅ **UNIQUE** |

**PayPlan's Unique Advantages** (Constitutional Mandates):
- ✅ Privacy-first (localStorage, no auth required)
- ✅ Completely free (all budgeting features free forever)
- ✅ Visual-first (charts, gamification, dashboards)
- ✅ Accessibility-first (WCAG 2.2 AA from day one)

### Competitor Failure Analysis

**What Went Wrong (Learn from Their Mistakes)**:

1. **Mint** (Shut down Jan 2024):
   - ❌ 3.6M users but $0 material revenue—free-only model unsustainable
   - ❌ Plaid costs exceeded revenue per user
   - ❌ Stood still on innovation ("hasn't released new features in years")
   - **PayPlan Lesson**: Freemium model from day one with 15-20% premium conversion target

2. **YNAB** ($109/year):
   - ❌ "Overwhelming", "confusing", "daunting for beginners"
   - ❌ Zero-based budgeting "just doesn't click"
   - ❌ 30-minute onboarding = high drop-off
   - ❌ "Crazy expensive for people trying to save money"
   - **PayPlan Lesson**: <5 minute onboarding, visual-first design, $49-74/year (50% cheaper)

3. **Monarch** (1.8-star rating):
   - ❌ "Zero customer support in 2025"
   - ❌ Transaction auto-deletion bugs unfixed for 5+ months
   - ❌ "Bank accounts disconnected a few times a week"
   - **PayPlan Lesson**: 80% code coverage, localStorage-first = fewer sync issues, community support

4. **PocketGuard**:
   - ❌ "Slow updates and feature releases"
   - ❌ Community feels neglected
   - **PayPlan Lesson**: 2-week sprint cadence, ship features monthly, public roadmap

### Target User Profile (Budget App Demographics)

**Who PayPlan Serves**:
- Age: 18-35 (Gen Z + Young Millennials)
- Income: $25k-$60k/year
- Emergency Fund: $0-$400 (can't cover unexpected expenses)
- Living: Paycheck-to-paycheck (67% of Americans)
- Market Size: 80% of Gen Z uses budgeting apps = 40 million users

**Pain Points PayPlan Solves**:
1. Complex budgeting tools (YNAB too complicated)
2. Expensive subscription costs ($75-109/year)
3. Privacy concerns (bank sync required by competitors)
4. Fear of late fees and overdrafts
5. Subscription fatigue
6. No savings cushion
7. Impulse spending and budget tracking difficulty

---

**Version**: 2.0.0 | **Ratified**: 2025-10-27 | **Last Amended**: 2025-10-31

**Version History**:
- **v2.0 (2025-10-31)**: MAJOR UPDATE - Research-driven enhancements based on 280K+ token competitive analysis:
  - **New Features**: Added 22 features (Projected Cash Flow, Transaction Search, Reconciliation, Dark Mode, Credit Score, Refund Tracker, Asset Tracking, Offline Mode, Educational Content, Community, etc.)
  - **New Principle VIII**: Ethical Gamification (elevated to IMMUTABLE)
  - **Regulatory Updates**: WCAG 2.1 → 2.2, added PCI DSS 4.0.1, DORA, GLBA, COPPA amendments
  - **Governance Framework**: ADR integration, amendment tiers, RFC process
  - **Pricing Strategy**: Updated to $39-59/year (undercut Simplifi), 60-day trial
  - **Enhanced Features**: Categories (custom rules), Budgets (multi-method), Dashboard (customization, dark mode), Alerts (8 types), Reports (PDF/QIF export), Bank Sync (12K+ institutions, biometric auth)
  - **Justification**: Deep competitive analysis of YNAB, Monarch, PocketGuard, Copilot, Simplifi, Goodbudget revealed 33 gaps preventing parity with $75-109/year industry leaders
- **v1.2 (2025-10-31)**: BNPL features removed, pure budget app pivot complete
- **v1.1 (2025-10-27)**: Added Spec-Kit workflow integration, Definition of Done by phase, Conflict Resolution Hierarchy, Tooling Integration
- **v1.0 (2025-10-26)**: Initial ratification based on market research

---

## Summary: What This Constitution Mandates

**PayPlan MUST have these features to compete with $75-109/year industry leaders**:

### Always Free (Core) - Tier 0 (8 Features) ← UPDATED

1. ✅ **Spending Categories** with charts, custom rules, templates
2. ✅ **Budget Creation** with multiple methodologies (zero-based, envelope, 50/30/20, custom)
3. ✅ **Dashboard** with visualizations, customization, dark mode, daily spendable amount
4. ✅ **Goal Tracking** with progress bars, gamification
5. ✅ **Projected Cash Flow** with forecasting, what-if scenarios (NEW)
6. ✅ **Transaction Search** with advanced filters, saved searches (NEW)
7. ✅ **Transaction Reconciliation** with duplicate detection (NEW)
8. ✅ **Manual Transaction Entry** with notes, receipts, splitting, bulk actions (ENHANCED)

### Competitive Parity (Free) - Tier 1 (8 Features) ← UPDATED

9. ✅ **Recurring Detection** with calendar view, pause tracking
10. ✅ **Real-Time Alerts** (8 types: budget, financial health, fraud, positive reinforcement)
11. ✅ **Cash Flow Reports** with custom report builder, PDF/CSV/QIF export
12. ✅ **Debt Payoff Calculator** (snowball/avalanche methods)
13. ✅ **Credit Score Tracking** with trend graphs, change alerts (NEW)
14. ✅ **Refund & Return Tracker** with status tracking (NEW)
15. ✅ **Asset Tracking** (real estate, vehicles) with net worth chart (NEW)
16. ✅ **Offline Mode** with auto-sync, conflict resolution (NEW)

### Premium Differentiators - Tier 2 (6 Features)

17. ⚠️ **Bank Sync** (12K+ institutions, multi-aggregator, biometric auth)
18. ⚠️ **AI Categorization** (90% accuracy, client-side ML)
19. ⚠️ **Investment Tracking** (stocks, ETFs, mutual funds, 401k)
20. ⚠️ **Multi-User Collaboration** (6 users, real-time sync, roles)
21. ⚠️ **Educational Content** (guides, videos, workshops, bootcamp) (NEW)
22. ⚠️ **Community & Support** (forums, Discord, public roadmap, priority support) (NEW)

### Immutable Principles (4 Principles) ← UPDATED

- **I. Privacy-First**: localStorage default, no auth required, zero tracking
- **II. Accessibility-First**: WCAG 2.2 AA compliance (UPDATED from 2.1)
- **III. Free Core**: All budgeting features always free (16 features)
- **VIII. Ethical Gamification**: User control, positive reinforcement, no manipulation (NEW)

### Evolvable Principles (4 Principles)

- **IV. Visual-First**: Charts and gamification for everything
- **V. Mobile-First**: Responsive, PWA, offline-capable
- **VI. Quality-First** (Phased): Testing rigor scales with product maturity
- **VII. Simplicity**: YAGNI, 2-week features, incremental delivery

**This Constitution v2.0 ensures PayPlan meets industry bare minimum standards while maintaining its unique privacy-first, accessibility-first, free-forever, and ethically-gamified identity.**

