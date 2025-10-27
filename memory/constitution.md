# PayPlan Constitution
**The immutable principles and mandatory features that define PayPlan as a market-competitive, privacy-first personal finance app**

---

## Current Phase Status

**Current Phase**: Phase 1 (Pre-MVP, 0-100 users)
**Current Focus**: Ship Tier 0 + Tier 1 features (Weeks 1-12)
**Testing Requirements**: Manual testing only (features must work)
**Spec-Kit Requirements**: Tier 1 (spec.md only for medium features)
**Performance Requirements**: None (optimize if users complain)

**Phase 1 Priorities (REQUIRED)**:
- ✅ Ship 8 table-stakes features (Spending Categories, Budgets, Dashboard, Goals, Recurring Detection, Bill Reminders, Cash Flow, Debt Calculator)
- ✅ Manual accessibility testing (screen reader, keyboard navigation)
- ✅ Privacy compliance (localStorage-first, PII sanitization)
- ✅ Features must work reliably

**Phase 1 Priorities (NOT REQUIRED)**:
- ❌ Automated test suite (defer to Phase 2)
- ❌ 80% code coverage (defer to Phase 3)
- ❌ Performance optimization (defer to Phase 4)
- ❌ Full Spec-Kit workflow for simple features (use GitHub issues)

---

## Core Principles

### I. Privacy-First Architecture (IMMUTABLE)

**Principle**: User privacy is paramount and non-negotiable. PayPlan operates privacy-first with optional server features.

**Market Context**: PayPlan targets 18-35 year-olds living paycheck-to-paycheck (67% of Americans) with 3-5 active BNPL loans. These users need financial tools without judgment, tracking, or data monetization. 60% of Gen Z (30M users) uses BNPL; 51% believe BNPL encourages debt. Privacy-first design builds trust with a demographic wary of financial surveillance.

**Requirements**:
- **localStorage-First**: All core features MUST work with localStorage only (no server required)
- **Explicit Consent**: Any server-side features (sync, cloud backup) require explicit opt-in with clear privacy disclosure
- **No Required Authentication**: Core features MUST work without signup, login, or authentication
- **PII Sanitization**: All exports, logs, and telemetry MUST sanitize PII before leaving the client
- **Data Ownership**: Users own their data; full export and deletion capabilities required
- **Zero Tracking by Default**: No analytics, telemetry, or tracking without explicit user consent

**Prohibited**:
- ❌ Requiring authentication for core BNPL management features
- ❌ Server-side storage without explicit opt-in
- ❌ Selling user data to third parties
- ❌ Invasive tracking or fingerprinting
- ❌ Default opt-in for analytics (must be explicit opt-in)

---

### II. Accessibility-First Development (IMMUTABLE)

**Principle**: Financial tools must be accessible to all users, regardless of ability or disability.

**Requirements**:
- **WCAG 2.1 AA Compliance**: All features MUST meet WCAG 2.1 Level AA standards
- **Screen Reader Compatible**: All UI components tested with NVDA, JAWS, or VoiceOver
- **Keyboard Navigation**: Full app functionality via keyboard (Tab, Enter, Space, Arrow keys)
- **Color Contrast**: Minimum 4.5:1 contrast ratios for text, 3:1 for UI components
- **ARIA Labels**: Proper ARIA labeling on all interactive elements
- **Focus Management**: Visible focus indicators and logical focus order
- **Reduced Motion Support**: Respect `prefers-reduced-motion` for animations
- **Accessible Error Messages**: Clear, descriptive errors with recovery guidance

**Testing Requirements**:
- Every feature MUST include accessibility tests
- Manual screen reader testing required before release
- Keyboard navigation testing mandatory

**Prohibited**:
- ❌ Releasing features without accessibility testing
- ❌ Color-only information (must have text/icons too)
- ❌ Auto-playing videos or animations without user control

---

### III. Free Core, Premium Optional (IMMUTABLE)

**Principle**: BNPL debt management features must remain free forever; advanced features may be premium.

**Market Context**: Mint died (Jan 2024) with 3.6M users but no revenue—free-only models are unsustainable. YNAB charges $109/year, which users call "crazy expensive for people trying to save money." PayPlan's target users earn $25k-$60k/year and can't afford premium-only apps. The freemium model (80% free, 20% premium at $49-74/year—50% cheaper than YNAB/Monarch) ensures sustainability while serving users who need free BNPL management most.

**Always Free (Core Features)**:
1. ✅ BNPL email parser (all 6 providers: Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
2. ✅ Risk detection (COLLISION, CASH_CRUNCH, WEEKEND_AUTOPAY)
3. ✅ CSV import and export
4. ✅ Payment archives (localStorage, 50 limit)
5. ✅ Calendar export (.ics)
6. ✅ Payment status tracking
7. ✅ User preferences
8. ✅ Spending categories (basic set + custom)
9. ✅ Budget creation and tracking (up to 10 budgets)
10. ✅ Goal tracking (up to 5 goals)
11. ✅ Dashboard with charts (spending, net worth, cash flow)
12. ✅ Recurring transaction detection
13. ✅ Bill reminders and alerts
14. ✅ Debt payoff calculator

**May Be Premium (Optional Features)**:
- ⚠️ Bank account sync (Plaid integration)
- ⚠️ AI-powered categorization
- ⚠️ Investment tracking
- ⚠️ Multi-user collaboration (Supabase backend)
- ⚠️ Unlimited archives (>50)
- ⚠️ Advanced analytics and reports
- ⚠️ Priority support

**Premium Pricing** (if implemented):
- Target: $49-74/year (undercut market: YNAB $109/year, Monarch $100/year, PocketGuard $75/year, Copilot $95/year)
- **Competitive Advantage**: 50% cheaper than YNAB/Monarch, 33% cheaper than PocketGuard
- **Revenue Model**: 100K users × 15% conversion × $50/year = $750K ARR (sustainable vs. Mint's $0)
- Free trial: 30 days minimum
- No credit card required for trial
- Clear value proposition (what premium unlocks)

**Prohibited**:
- ❌ Paywalling core BNPL management features
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

**Goal**: Ship features fast, validate market fit, reach table-stakes feature parity

**Requirements**:
- **Manual testing only**: Test features work before shipping (click through UI, verify behavior)
- **No automated tests required**: Focus on feature velocity (ship 8 features in 12 weeks)
- **Basic error handling**: Catch obvious bugs, display user-friendly error messages
- **User feedback**: Real users find bugs faster than tests
- **Manual accessibility testing**: Test with screen reader (NVDA/VoiceOver), verify keyboard navigation

**Allowed**:
- ✅ Ship features without automated tests
- ✅ Manual QA only (no CI/CD test gates)
- ✅ Fix bugs as users report them
- ✅ Focus on feature completion over test coverage

**Prohibited**:
- ❌ Shipping obviously broken features (must manually test before release)
- ❌ Ignoring user-reported bugs (fix within 48 hours)
- ❌ Skipping accessibility testing (WCAG 2.1 AA compliance is IMMUTABLE)

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

## Mandatory Features (Market Competitiveness)

**The Constitution mandates these features to ensure PayPlan is market-competitive with YNAB, Monarch, PocketGuard, and Copilot.**

### Tier 0: MVP Requirements (MUST HAVE)

**Target Completion**: Weeks 1-6

1. **Spending Categories**
   - Pre-defined categories: Groceries, Dining, Transportation, Housing, Utilities, Entertainment, Healthcare, Debt, Savings, etc.
   - Custom categories (user-defined)
   - Category groups (e.g., "Food" contains Groceries + Dining)
   - Visual breakdown (pie chart, bar chart) with color-coded categories
   - Transaction assignment to categories
   - **Gamification**: Visual spending breakdown ("Groceries is 32% of spending!") with colorful, engaging charts
   - **Market Rationale**: Solves YNAB's complexity problem with visual-first design; PayPlan's target users prefer charts over spreadsheets
   - **Acceptance Criteria**: User can categorize transactions and see spending breakdown chart

2. **Budget Creation & Tracking**
   - Set monthly limits per category
   - Visual progress bars ("$567 left of $8,230 budgeted")
   - Budget vs. actual reporting
   - Rollover support (carry unused balance to next month)
   - Budget templates (e.g., 50/30/20 rule)
   - Alerts when approaching budget limits
   - **Gamification**: Progress bars (22% better budget adherence), milestone celebrations at 25%/50%/75%/100%, before/after comparisons ("You spent $200 less on dining this month!")
   - **Market Rationale**: Apps with progress bars see 22% better adherence; PayPlan targets users with impulse spending issues who need visual boundaries
   - **Acceptance Criteria**: User can create budget, track progress, get alerts

3. **Dashboard with Charts**
   - Net worth graph (if tracking accounts)
   - Spending by category (pie chart)
   - Monthly income vs. expenses (bar chart)
   - Recent transactions widget
   - Upcoming bills widget
   - Goal progress widget
   - **Gamification**: Streak tracking ("14-day budget review streak!" = 48% engagement boost), personalized insights ("You spend 40% more on weekends"), recent wins ("You're $200 under budget!")
   - **Market Rationale**: Daily streak features increase engagement by 48%; apps with gamification see 2x daily engagement vs. non-gamified competitors
   - **Acceptance Criteria**: Dashboard loads <1s, shows all widgets, fully responsive

4. **Goal Tracking**
   - Create savings goals (target amount + date)
   - Visual progress (progress bar with percentage)
   - Multiple goal types: Emergency Fund, Vacation, Debt Payoff, Down Payment
   - Automatic contributions (link to budget)
   - Goal completion celebrations
   - **Gamification**: Goal-gradient effect (start at 10% not 0% for psychological boost), milestone badges at 25%/50%/75%/100%, visual countdown to goal date, confetti animations on completion
   - **Market Rationale**: Progress bars increase goal completion by 22%; users save 20% more with gamified apps; PayPlan's target users ($0-$400 emergency fund) need emergency fund goal with visual progress
   - **Acceptance Criteria**: User can create goal, track progress, receive completion notification

---

### Tier 1: Competitive Parity (SHOULD HAVE)

**Target Completion**: Weeks 7-12

5. **Recurring Transaction Detection**
   - Auto-detect subscriptions from patterns
   - Mark transactions as recurring (frequency: weekly, monthly, yearly)
   - Alert on price changes ("Netflix increased from $15.99 to $17.99")
   - Quick view of all recurring charges
   - Pause/cancel reminders
   - **BNPL Focus**: Auto-detect BNPL installments (Klarna, Affirm, Afterpay, etc.) and subscription creep (major user pain point)
   - **Market Rationale**: 33% of BNPL users lose track of payments across multiple providers; subscription fatigue is a top complaint; total recurring cost visibility ("$347/month in subscriptions") helps users manage debt
   - **Acceptance Criteria**: App detects 80% of recurring transactions automatically

6. **Bill Reminders & Alerts**
   - Upcoming bill notifications (7 days, 3 days, 1 day)
   - Overdue payment warnings
   - Low balance alerts
   - Budget exceeded notifications
   - Unusual spending alerts (anomaly detection)
   - **BNPL Focus**: Proactive late fee prevention (7d/3d/1d reminders) for BNPL payments; fraud detection ("Did you authorize this?")
   - **Market Rationale**: 24% of BNPL users make late payments (up from 18% in 2023); $35 late fees add up; solves Monarch's support crisis with automation; users fear late fees and credit score damage
   - **Acceptance Criteria**: User receives timely, actionable alerts

7. **Cash Flow Reports**
   - Monthly income vs. expenses summary
   - Year-over-year comparisons
   - Spending trends over time (last 3, 6, 12 months)
   - Forecasting based on history
   - Exportable reports (PDF, CSV)
   - **Market Rationale**: YNAB users request year-over-year comparisons; PayPlan's target users (paycheck-to-paycheck) need trend forecasting ("You'll run out of money by the 25th") to avoid cash crunches
   - **Acceptance Criteria**: User can view cash flow trends and export reports

8. **Debt Payoff Calculator**
   - Snowball method (smallest balance first)
   - Avalanche method (highest interest first)
   - Interest savings calculator
   - Payoff timeline projections
   - Extra payment impact modeling
   - Visual debt-free date countdown ("473 days until debt-free!")
   - **BNPL Focus**: BNPL-specific version focusing on late fee savings rather than interest; visualize light at end of tunnel for users with 3-5 active BNPL loans
   - **Market Rationale**: 40% of BNPL users regret purchases once full costs hit; PayPlan's target users need debt payoff calculator to see path out of BNPL debt; visual countdown motivates completion
   - **Acceptance Criteria**: User can model debt payoff strategies and see interest savings

---

### Tier 2: Differentiation (MAY HAVE - Optional Premium)

**Target Completion**: Weeks 13-24

9. **Bank Account Sync (OPTIONAL)**
   - Plaid integration for 10,000+ institutions
   - Explicit opt-in with privacy disclosure
   - Real-time transaction import
   - Multi-institution support
   - Manual account option (localStorage only)
   - Sync on/off toggle
   - **Acceptance Criteria**: User can optionally sync accounts while maintaining privacy

10. **AI-Powered Categorization (Premium)**
    - Machine learning transaction categorization
    - Learn from user corrections
    - Custom rule suggestions
    - Confidence scoring
    - Privacy-preserving (client-side ML model using TensorFlow.js)
    - **AI Market Context**: AI in personal finance growing from $1B (2025) → $3.7B (2033) = 270% growth; apps with AI see 2x daily engagement; ML categorization improves accuracy by 22%; users save 20% more with AI-powered apps
    - **Implementation**: Client-side TensorFlow.js for privacy preservation; no data leaves device
    - **Acceptance Criteria**: 90% categorization accuracy after 30 days of use

11. **Investment Tracking (Premium)**
    - Connect brokerage accounts (Plaid)
    - Stock, ETF, mutual fund, bond tracking
    - Asset allocation visualization
    - Performance over time
    - Net worth including investments
    - **Acceptance Criteria**: User can track investments and see portfolio performance

12. **Multi-User Collaboration (Premium)**
    - Share budget with partner/family (up to 6 users)
    - Real-time sync across devices (Supabase)
    - Permission controls (view-only, edit)
    - Shared expense tracking
    - Activity log (who changed what)
    - **Acceptance Criteria**: Multiple users can collaborate on shared budget in real-time

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

**Validation & Data**:
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

## Security Standards

### Data Protection
- **PII Sanitization**: Regex patterns + word boundaries for emails, names, addresses, SSNs
- **Input Validation**: Zod schemas for all user inputs
- **XSS Protection**: Sanitize HTML outputs, use CSP headers
- **CSV Injection**: Escape `=`, `+`, `-`, `@` prefixes
- **CSRF Protection**: Use CSRF tokens for server requests

### Authentication (Optional Premium Features)
- **Supabase Auth**: Email/password, Google OAuth, magic links
- **Session Management**: HTTP-only cookies, secure flag
- **Password Requirements**: Min 12 chars, no common passwords
- **2FA Support**: TOTP (Google Authenticator, Authy)

### Privacy Compliance
- **GDPR**: Right to access, delete, export data
- **CCPA**: California privacy rights supported
- **Data Retention**: 30-day telemetry retention max
- **Consent Management**: Granular opt-in for analytics, sync, telemetry

**Prohibited**:
- ❌ Storing passwords in plain text
- ❌ Logging PII to console or telemetry
- ❌ Third-party trackers without consent

---

## Development Workflow

### Spec-Kit Workflow (PHASED BY FEATURE COMPLEXITY)

**Principle**: Use the right tool for the job. Not every feature needs full Spec-Kit ceremony.

---

#### Tier 0: Simple Features (<3 days, trivial changes) **← MOST PHASE 1 WORK**

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

#### Tier 1: Medium Features (3-7 days, moderate complexity)

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

#### Tier 2: Complex Features (7-14 days, high complexity)

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

**Decision Tree**:
- **<3 days + straightforward** → Tier 0 (GitHub issue only)
- **3-7 days + moderate complexity** → Tier 1 (spec.md only)
- **7-14 days + high complexity** → Tier 2 (full Spec-Kit)
- **>14 days** → Break into smaller features (violates Principle VII: Simplicity)

### Git Workflow

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

### Pre-Merge Checklist

- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] All accessibility tests passing (axe-core, manual)
- [ ] Screen reader tested (NVDA or VoiceOver)
- [ ] Keyboard navigation tested
- [ ] Mobile responsive tested (iPhone, Android)
- [ ] Performance benchmarks met
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

## Governance

### Constitutional Authority

1. **Supremacy**: This Constitution supersedes all other development practices, style guides, and preferences
2. **Immutability**: Core Principles (I-III) are IMMUTABLE and cannot be changed
3. **Amendment Process**: Other principles may be amended with:
   - Written justification
   - Stakeholder approval
   - Migration plan for affected code
   - Version increment (e.g., v1.0 → v1.1)

### Compliance Enforcement

1. **Pre-Commit Hooks**: Lint, format, test on commit
2. **CI/CD Pipeline**: Block merge if tests fail or coverage drops
3. **Code Review**: All PRs must verify constitutional compliance
4. **Quarterly Audits**: Review codebase for drift from principles

### Violation Response

**Minor Violations** (e.g., missing tests, low coverage):
- Fix in current PR
- Document why it happened
- Add safeguards to prevent recurrence

**Major Violations** (e.g., privacy breach, accessibility failure):
- Block release immediately
- Root cause analysis
- Remediation plan with timeline
- Post-mortem documentation

---

## Appendix: Competitor Analysis

### Competitor Feature Matrix

**PayPlan must match or exceed these capabilities**:

| Feature | YNAB | Monarch | PocketGuard | Copilot | PayPlan (Target) |
|---------|------|---------|-------------|---------|------------------|
| Bank Sync | ✅ | ✅ | ✅ | ✅ | ⚠️ (Optional) |
| Spending Categories | ✅ | ✅ | ✅ | ✅ | ✅ (Mandated) |
| Budget Creation | ✅ | ✅ | ✅ | ✅ | ✅ (Mandated) |
| Goal Tracking | ✅ | ✅ | ✅ | ✅ | ✅ (Mandated) |
| Net Worth Tracking | ✅ | ✅ | ✅ | ✅ | ✅ (Mandated) |
| Charts/Graphs | ✅ | ✅ | ✅ | ✅ | ✅ (Mandated) |
| Debt Payoff Calc | ✅ | ✅ | ✅ | ❌ | ✅ (Mandated) |
| Recurring Detection | ✅ | ✅ | ✅ | ✅ | ✅ (Mandated) |
| Bill Reminders | ✅ | ✅ | ✅ | ✅ | ✅ (Mandated) |
| AI Categorization | ❌ | ✅ | ✅ | ✅ | ⚠️ (Premium) |
| Investment Tracking | ❌ | ✅ | ❌ | ✅ | ⚠️ (Premium) |
| Multi-User | ✅ | ✅ | ❌ | ❌ | ⚠️ (Premium) |
| Privacy-First | ❌ | ❌ | ❌ | ❌ | ✅ (Unique) |
| BNPL Focus | ❌ | ❌ | ❌ | ❌ | ✅ (Unique) |
| Free Core | ❌ | ❌ | ⚠️ | ❌ | ✅ (Unique) |

**PayPlan's Unique Advantages** (Constitutional Mandates):
- ✅ Privacy-first (localStorage, no auth required)
- ✅ BNPL-specific (email parser, risk detection)
- ✅ Free core features (no paywalling debt management)
- ✅ Accessibility-first (WCAG 2.1 AA from day one)

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

### Target User Profile (BNPL Debt Crisis Demographics)

**Who PayPlan Serves**:
- Age: 18-35 (Gen Z + Young Millennials)
- Income: $25k-$60k/year
- BNPL Loans: 3-5 active (Klarna, Affirm, Afterpay, etc.)
- Emergency Fund: $0-$400 (can't cover unexpected expenses)
- Living: Paycheck-to-paycheck (67% of Americans)
- Market Size: 60% of Gen Z uses BNPL = 30 million users

**Pain Points PayPlan Solves**:
1. Lost track of payment schedules (33% lose track across providers)
2. Fear of late fees (24% make late payments, up from 18% in 2023)
3. Credit score damage worry
4. Subscription fatigue
5. No savings cushion
6. Low financial literacy
7. Impulse spending (40% regret purchases once full costs hit)

---

**Version**: 2.0.0 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-26

**Version History**:
- **v2.0.0 (2025-10-26)**: MAJOR CHANGE - Replaced Test-First Development (Principle VI) with Quality-First Development (Phased). Added phased approach to testing, performance, and Spec-Kit workflow. Softened code standards to guidelines. Added Current Phase Status indicator.
- **v1.2.0 (2025-10-26)**: Integrated market intelligence throughout constitution (BNPL crisis stats, competitor failures, gamification data, AI market growth)
- **v1.1.0 (2025-10-26)**: Added Market Intelligence appendix
- **v1.0.0 (2025-10-25)**: Initial ratification

---

## Summary: What This Constitution Mandates

**PayPlan MUST have these features to be market-competitive**:

### Always Free (Core)
1. ✅ BNPL management (email parser, risk detection, CSV)
2. ✅ Spending categories with charts
3. ✅ Budget creation and tracking
4. ✅ Goal tracking
5. ✅ Dashboard with visualizations
6. ✅ Recurring transaction detection
7. ✅ Bill reminders & alerts
8. ✅ Cash flow reports
9. ✅ Debt payoff calculator

### May Be Premium (Optional)
10. ⚠️ Bank sync (Plaid)
11. ⚠️ AI categorization
12. ⚠️ Investment tracking
13. ⚠️ Multi-user collaboration

### Immutable Principles
- **Privacy-First**: localStorage default, no auth required
- **Accessibility-First**: WCAG 2.1 AA compliance
- **Free Core**: BNPL features always free
- **Visual-First**: Charts for everything
- **Test-First**: TDD mandatory

**This Constitution ensures PayPlan becomes a comprehensive, market-competitive personal finance app while maintaining its unique privacy-first, BNPL-focused identity.**
