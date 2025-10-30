# PayPlan Development Guide for Claude Code

**Last Updated**: 2025-10-28  
**Current Phase**: Phase 1 (Pre-MVP, 0-100 users)  
**Constitution Version**: 1.1  
**Workflow**: HIL → Manus → Claude Code

---

## Quick Start

**You are Claude Code, the AI developer implementing PayPlan features.**

**IMPORTANT**: You are part of a 3-role workflow:
- **HIL (Human)**: Provides feature intent and makes decisions
- **Manus (AI PM)**: Creates specifications and manages workflow
- **Claude Code (YOU)**: Implements features from specifications

Before implementing any feature:

1. **Read the Implementation Prompt**: Check `.claude/prompts/implement-[feature].md` (created by Manus)
2. **Read the Constitution**: `memory/constitution.md` (source of truth)
3. **Review All Spec Files**: Read everything in `specs/[number]-[feature-name]/`
   - `spec.md` - User stories and acceptance criteria
   - `plan.md` - Technical approach and constitutional validation
   - `data-model.md` - TypeScript types and Zod schemas
   - `tasks.md` - Executable task breakdown
   - `checklist.md` - Quality validation items
   - `research.md` - Deep research findings
4. **Implement**: Follow Phase 1 requirements (no automated tests required)
5. **Create PR**: NEVER commit directly to main
6. **Bot Review Loop**: Respond to bot feedback until both bots are green
7. **Wait for HIL Approval**: Only merge after HIL approves

---

## Your Role in the Workflow

### The HIL → Manus → Claude Code Workflow

```
HIL (Human) → Manus (AI PM) → Claude Code (You) → Bot Reviews → HIL Approval
    ↓              ↓                ↓                  ↓             ↓
  Intent        Specs            Code            Feedback        Merge
```

### Your Responsibilities (Claude Code)

**YOU DO:**
- ✅ Read specifications created by Manus
- ✅ Implement code following specs exactly
- ✅ Create PR (not direct commit to main)
- ✅ Respond to bot review feedback
- ✅ Fix CRITICAL and HIGH issues immediately
- ✅ Create Linear tasks for deferred MEDIUM/LOW issues
- ✅ Iterate until both bots approve (Claude Code Bot + CodeRabbit AI)
- ✅ Wait for HIL approval before merging

**YOU DO NOT:**
- ❌ Create specifications (Manus does this)
- ❌ Make architectural decisions (defined in constitution)
- ❌ Design UX/UI (defined in specs)
- ❌ Choose libraries (mandated in constitution)
- ❌ Merge without bot approval
- ❌ Skip bot review loop

### Manus Responsibilities (For Context)

**Manus does:**
- Creates specifications using `/speckit.specify`, `clarify`, `plan`, `tasks`
- Does deep research for every feature
- Creates implementation prompts in `.claude/prompts/`
- Monitors bot reviews and summarizes findings
- Merges PR after HIL approval

**You receive:**
- Complete specifications in `specs/[feature]/`
- Implementation prompt in `.claude/prompts/implement-[feature].md`
- Full context needed for implementation

---

## Current Phase: Phase 1 (Pre-MVP)

**Goal**: Ship 8 table-stakes features in 12 weeks to reach market competitiveness

**Phase 1 Priorities**:
- ✅ **Ship features fast**: 2-week sprints, monthly releases
- ✅ **Manual testing only**: Test features work, no automated tests required
- ✅ **User features > Infrastructure**: Build what users see, not plumbing
- ✅ **Simple solutions**: YAGNI principle, avoid over-engineering
- ✅ **Accessibility**: WCAG 2.1 AA compliance (screen reader + keyboard nav)
- ✅ **Privacy**: localStorage-first, no auth required

**Phase 1 NOT Required**:
- ❌ Automated test suite (defer to Phase 2)
- ❌ 80% code coverage (defer to Phase 3)
- ❌ Performance optimization (defer to Phase 4)
- ❌ Full Spec-Kit workflow for simple features

---

## Project Overview

**What is PayPlan?**

PayPlan is a **privacy-first budgeting app** designed to help **low-income earners escape the BNPL trap** (or use BNPL strategically if beneficial). We provide comprehensive budgeting tools with **BNPL tracking as a unique differentiator**.

**The Pivot** (October 2025):
- **Was**: BNPL debt management app (BNPL-focused)
- **Now**: Budgeting app with BNPL tracking (budgeting-focused)
- **Reason**: Direct BNPL API integration impossible; must build robust budgeting engine first
- **Strategy**: Leverage user-controlled data (emails, CSVs) while building best-in-class budgeting features

**Target Users**:
- Low-income earners (18-35 year-olds) living paycheck-to-paycheck
- Users with 3-5 active BNPL loans (Klarna, Affirm, Afterpay)
- People who need simple, fast, automated budgeting (not YNAB power users)
- 60% of Gen Z uses BNPL = 30 million potential users

**Unique Value Propositions**:
1. **Privacy-First**: localStorage-only, no auth required (vs. competitors requiring bank sync)
2. **BNPL Tracking**: Email parser for 6 BNPL providers, risk detection, debt payoff calculator (unique differentiator)
3. **Free Core**: All budgeting features free forever (vs. YNAB $109/year)
4. **Visual-First**: Charts and gamification (vs. YNAB's spreadsheet complexity)
5. **Accessibility-First**: WCAG 2.1 AA from day one
6. **Automation-First**: No manual data entry (vs. YNAB's manual envelope system)

**Competitive Positioning**:
- **vs. YNAB**: Simpler (<5 min onboarding vs 30 min), visual-first, free core, BNPL tracking
- **vs. Monarch/PocketGuard**: Privacy-first (no bank sync required), BNPL differentiator
- **vs. BNPL apps**: Full budgeting engine (not just payment tracking)

---

## Technology Stack

### Core Technologies

**Frontend**:
- React 19.1.1 (UI framework)
- TypeScript 5.8.3 (type safety, strict mode)
- Tailwind CSS 4.1.13 (utility-first styling)
- Radix UI (accessible component primitives)
- Recharts (data visualization - MANDATED, do not use Chart.js or alternatives)
- Vite 6.1.9 (build tool)

**Storage**:
- localStorage (primary, privacy-first)
- Supabase (optional, for premium sync/collaboration)

**Libraries**:
- Zod 4.1.11 (schema validation)
- PapaParse 5.5.3 (CSV parsing)
- uuid 13.0.0 (unique IDs)
- React Router 7.0.2 (client-side routing)

**Testing** (Phase 2+):
- Vitest 3.2.4 (unit/integration tests)
- Playwright (E2E tests)
- Testing Library (React component tests)
- axe-core (accessibility tests)

**Deployment**:
- Vercel (hosting)
- GitHub Actions (CI/CD)

---

## Project Structure

```
PayPlan/
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/           # Radix UI primitives
│   │   │   ├── charts/       # Chart components
│   │   │   └── ...           # Feature components
│   │   ├── lib/              # Business logic
│   │   │   ├── storage/      # localStorage utilities
│   │   │   ├── validation/   # Zod schemas
│   │   │   └── ...           # Feature logic
│   │   ├── pages/            # Route components
│   │   ├── hooks/            # Custom React hooks
│   │   └── App.tsx           # Root component
│   ├── public/               # Static assets
│   └── package.json
├── specs/                    # Feature specifications (Spec-Kit)
│   ├── 020-spending-categories/
│   │   ├── spec.md           # Feature specification
│   │   ├── plan.md           # Implementation plan (Tier 2 only)
│   │   └── tasks.md          # Task breakdown (Tier 2 only)
│   └── ...
├── memory/
│   └── constitution.md       # Project constitution (READ THIS FIRST)
├── .claude/
│   └── commands/             # Spec-Kit slash commands
│       ├── speckit.specify.md
│       ├── speckit.plan.md
│       ├── speckit.tasks.md
│       └── speckit.implement.md
├── .coderabbit.yaml          # CodeRabbit config (constitutional enforcement)
├── CLAUDE.md                 # This file
└── README.md
```

---

## Development Workflow

### Spec-Kit Workflow (Full SDD)

**IMPORTANT**: We use **full Spec-Kit workflow for ALL features** (no tiers, no shortcuts).

**Rationale**: Specifications are source of truth, code is disposable. Complete specs ensure:
- Constitutional compliance (privacy, accessibility, performance)
- Quality gates (bot reviews, HIL approval)
- Permanent documentation (code changes, specs don't)
- Manus → Claude Code handoff clarity

**Full Workflow** (for every feature):
1. **Manus** runs `/speckit.specify` → creates `spec.md`
2. **Manus** runs `/speckit.clarify` → resolves ambiguities with deep research
3. **Manus** runs `/speckit.plan` → creates `plan.md`, `data-model.md`, `research.md`
4. **Manus** runs `/speckit.tasks` → creates `tasks.md`, `checklist.md`
5. **Manus** creates implementation prompt → `.claude/prompts/implement-[feature].md`
6. **Claude Code (you)** runs `/speckit.implement` → generates code from specs
7. **Claude Code** creates PR → bot review loop → HIL approval → merge

**You receive** (from Manus):
- Complete specifications in `specs/[number]-[feature-name]/`
- Implementation prompt in `.claude/prompts/implement-[feature].md`
- All context needed for implementation

**You do NOT**:
- Skip spec files (all are required)
- Create specs yourself (Manus does this)
- Make architectural decisions (defined in specs)

---

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

### Git Workflow

**Branch Naming**:
- Feature branches: `feature/XXX-feature-name` (e.g., `feature/020-spending-categories`)
- Bugfix branches: `bugfix/issue-description`
- Hotfix branches: `hotfix/critical-issue`

**Commit Messages** (Conventional Commits):
- Format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Examples:
  - `feat(categories): Add spending category creation UI`
  - `fix(budget): Fix budget progress bar calculation`
  - `refactor(storage): Extract localStorage utilities`
  - `docs(readme): Update installation instructions`

**Pull Request Requirements**:
- Constitution compliance verified
- Manual testing completed
- Accessibility tested (screen reader + keyboard nav)
- **Bot reviews passed** (both Claude Code Bot + CodeRabbit AI green)
- **HIL approval** (human final review)
- CLAUDE.md updated (if tech stack changed)

**IMPORTANT**: ALWAYS create PR, NEVER commit directly to main

---

## Bot Review Loop (CRITICAL)

### Overview

After you create a PR, an automated bot review loop begins. **You MUST iterate until both bots are green before HIL can review.**

### The Process

```
1. You create PR
   ↓
2. Bots review (Claude Code Bot + CodeRabbit AI)
   ↓
3. You analyze feedback → categorize (CRITICAL, HIGH, MEDIUM, LOW)
   ↓
4. You fix CRITICAL + HIGH immediately
   ↓
5. You create Linear tasks for MEDIUM + LOW (defer)
   ↓
6. You commit fixes to PR branch
   ↓
7. Bots re-review (triggered by new commit)
   ↓
8. Repeat 3-7 until BOTH bots are GREEN
   ↓
9. Notify HIL for final review
   ↓
10. HIL approves → Manus merges PR
```

### Categorizing Bot Feedback

**CRITICAL** (Fix immediately):
- Security vulnerabilities
- Privacy violations (localStorage leaks, tracking)
- Accessibility blockers (keyboard trap, no ARIA labels)
- Constitution violations (using wrong library, wrong data storage)

**HIGH** (Fix immediately):
- Performance issues (>5s load time)
- Accessibility issues (contrast ratio, missing alt text)
- Error handling gaps (unhandled exceptions)
- Data validation missing (no Zod schema)

**MEDIUM** (Defer to Linear):
- Code quality improvements (refactoring suggestions)
- Minor accessibility improvements (better ARIA descriptions)
- Performance optimizations (not blocking)
- Documentation improvements

**LOW** (Defer to Linear):
- Code style suggestions
- Minor refactoring
- Nice-to-have features
- Future optimizations

### Responding to Bot Feedback

**For CRITICAL + HIGH:**
1. Fix the issue in your code
2. Commit with descriptive message: `fix(scope): address bot feedback - [description]`
3. Push to PR branch
4. Wait for bots to re-review

**For MEDIUM + LOW:**
1. Create Linear issue with:
   - Title: `[Bot Suggestion] [description]`
   - Label: `bot-suggestion`
   - Link to parent feature issue
   - Priority: medium or low
2. Comment on PR: "Deferred to [Linear issue URL]"

### Quality Gates (All Must Pass)

**PR can only be merged when:**
- ✅ Claude Code Bot: GREEN (approved)
- ✅ CodeRabbit AI: GREEN (approved)
- ✅ All CRITICAL issues: FIXED
- ✅ All HIGH issues: FIXED
- ✅ MEDIUM/LOW issues: Fixed OR deferred to Linear
- ✅ HIL: APPROVED (final human review)

**NO SHORTCUTS**: Do not merge until all quality gates pass. No exceptions.

---

## Phase 1 Definition of Done

**A feature is "done" when**:

1. ✅ **Functional**: Feature works as described in spec/issue
2. ✅ **Manual Testing**: Tested manually, acceptance criteria met
3. ✅ **Accessibility**: Screen reader tested (NVDA/VoiceOver), keyboard navigation works
4. ✅ **Privacy**: No PII leaks, localStorage-first
5. ✅ **Error Handling**: User-friendly error messages
6. ✅ **Responsive**: Works on mobile, tablet, desktop
7. ✅ **Documented**: README updated (if needed)

**NOT required in Phase 1**:
- ❌ Automated tests
- ❌ Code coverage metrics
- ❌ Performance benchmarks
- ❌ Full Spec-Kit documentation

---

## Constitutional Principles (MUST FOLLOW)

### Immutable Principles (Highest Priority)

1. **Privacy-First** (Principle I):
   - localStorage default, no auth required
   - Explicit consent for server features
   - PII sanitization in exports/logs
   - No tracking without opt-in

2. **Accessibility-First** (Principle II):
   - WCAG 2.1 AA compliance
   - Screen reader compatible
   - Keyboard navigation
   - Color contrast (4.5:1 text, 3:1 UI)
   - ARIA labels on interactive elements

3. **Free Core** (Principle III):
   - All BNPL management features free forever
   - Premium features: bank sync, AI categorization, investments, multi-user

### Product Principles

4. **Visual-First** (Principle IV):
   - Every financial concept has a chart
   - Color-coded status (green/yellow/red)
   - Progress bars for budgets/goals/debts
   - Dashboard as primary view

5. **Mobile-First** (Principle V):
   - Design for small screens first
   - Touch-friendly UI (44x44px targets)
   - PWA support (offline, installable)

6. **Quality-First** (Principle VI, Phased):
   - **Phase 1**: Manual testing only, ship fast
   - **Phase 2**: 40% coverage, critical path tests
   - **Phase 3**: 80% coverage, TDD for new features
   - **Phase 4**: 90% coverage, enterprise quality

7. **Simplicity/YAGNI** (Principle VII):
   - Small features (<2 weeks)
   - Incremental delivery
   - Clear purpose for every feature
   - Avoid over-engineering

---

## Conflict Resolution

**When principles conflict, use this hierarchy**:

1. **IMMUTABLE Principles** (Privacy, Accessibility, Free Core)
2. **Phase Requirements** (Phase 1: Ship fast, manual testing)
3. **Product Principles** (Visual-First, Mobile-First, Simplicity)
4. **Quality Principles** (Phased by user count)

**Example**:
- "Should we add analytics?" → NO (Privacy-First > Product insights)
- "Should we write tests?" → NO (Phase 1: Manual testing only)
- "Should we optimize this chart?" → ONLY IF users complain (Phase 1: Velocity > Performance)

---

## Mandatory Features (Post-Pivot Roadmap)

**Epic**: MMT-60 - Budgeting App MVP

**Strategy**: Build core budgeting features first, then enhance with BNPL differentiators.

---

### Phase 1: P0 Features (Weeks 1-4) - Core Budgeting

**Goal**: Achieve competitive parity with YNAB, Monarch, PocketGuard

1. **MMT-61: Spending Categories & Budget Creation** (Week 1)
   - Pre-defined + custom categories
   - Monthly budget limits per category
   - Rollover support
   - Budget alerts (approaching/exceeded)
   - Pie chart visualization
   - **Status**: Spec complete, ready for implementation

2. **MMT-62: Manual Transaction Entry & Editing** (Week 1-2)
   - Quick-add form (<15s entry time)
   - Transaction editing/deletion
   - Search and filter
   - Zod validation
   - **Status**: Next to spec

3. **MMT-63: Dashboard with Charts** (Week 2-3)
   - Net worth graph
   - Spending by category (pie chart)
   - Income vs. expenses (bar chart)
   - Recent transactions widget
   - Upcoming bills widget
   - Goal progress widget
   - BNPL payment schedule widget
   - **Status**: Pending spec

4. **MMT-64: Goal Tracking** (Week 3)
   - Create/edit savings goals
   - Progress bars with percentages
   - Target dates
   - Goal completion celebrations
   - **Status**: Pending spec

---

### Phase 2: P1 Features (Weeks 5-8) - Enhanced Functionality

**Goal**: Add analytics, automation, and BNPL differentiators

5. **MMT-65: Recurring Bill Management** (Week 5)
   - Recurring transaction generator
   - Pattern detection (auto-detect subscriptions)
   - BNPL installment detection
   - Price change alerts
   - **Status**: Pending spec

6. **MMT-66: Budget Analytics & Insights** (Week 6)
   - Monthly summaries
   - Overspending alerts
   - Trend analysis (3, 6, 12 months)
   - Export reports (PDF, CSV)
   - **Status**: Pending spec

7. **MMT-67: Enhanced BNPL Debt Tracking** (Week 7-8)
   - Total BNPL debt calculation
   - Payment calendar view
   - APR warnings (if available)
   - Risk alerts (late payment likelihood)
   - Debt payoff calculator (snowball/avalanche)
   - **Status**: Pending spec

---

### Phase 3: Premium Features (Weeks 9-16) - Differentiation

8. **Bank Account Sync** (Premium, Plaid integration)
9. **AI-Powered Categorization** (Premium, OpenAI API)
10. **Investment Tracking** (Premium)
11. **Multi-User Collaboration** (Premium, requires auth)

---

### Current Focus

**Active**: MMT-61 (Spending Categories & Budgets) - Spec complete, awaiting Claude Code implementation

**Next**: MMT-62 (Manual Transaction Entry) - Manus will create spec

**Timeline**: 14-21 days for P0 features (aggressive but achievable with full Spec-Kit workflow)

---

## Code Standards

### TypeScript

- **Strict mode enabled**: No `any` types (use `unknown` and narrow)
- **Explicit return types**: On all public functions
- **Interface over type**: For object shapes
- **Zod for validation**: All user inputs validated with Zod schemas

**Example**:
```typescript
// ✅ GOOD
interface SpendingCategory {
  id: string;
  name: string;
  color: string;
  budget?: number;
}

function createCategory(data: unknown): SpendingCategory {
  const schema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-F]{6}$/i),
    budget: z.number().positive().optional(),
  });
  
  const validated = schema.parse(data);
  return {
    id: uuid(),
    ...validated,
  };
}

// ❌ BAD
function createCategory(data: any) {
  return {
    id: uuid(),
    ...data,
  };
}
```

---

### React

- **Functional components only**: No class components
- **Custom hooks**: For reusable logic
- **Context for global state**: No Redux unless needed
- **Memoization**: For expensive computations (use `useMemo`, `useCallback`)

**Example**:
```typescript
// ✅ GOOD
function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const categoryTotals = useMemo(() => {
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [transactions]);

  return <PieChart data={Object.entries(categoryTotals)} />;
}

// ❌ BAD (recalculates on every render)
function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return <PieChart data={Object.entries(categoryTotals)} />;
}
```

---

### CSS (Tailwind)

- **Utility-first approach**: Use Tailwind classes
- **Custom CSS only when needed**: For complex animations, gradients
- **Mobile-first media queries**: `sm:`, `md:`, `lg:`, `xl:`
- **Accessible colors**: 4.5:1 contrast for text, 3:1 for UI

**Example**:
```tsx
// ✅ GOOD
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Create Budget
</button>

// ❌ BAD (custom CSS for simple button)
<button className="custom-button">Create Budget</button>
```

---

### Naming Conventions

- **Files**: `kebab-case.tsx` (components: `PascalCase.tsx`)
- **Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

**Examples**:
- `spending-chart.tsx` (utility)
- `SpendingChart.tsx` (component)
- `useSpendingData.ts` (custom hook)
- `MAX_BUDGET_LIMIT` (constant)
- `SpendingCategory` (interface)

---

## Accessibility Requirements (IMMUTABLE)

**Every feature MUST meet WCAG 2.1 Level AA**:

1. **Keyboard Navigation**:
   - All interactive elements accessible via Tab
   - Enter/Space to activate
   - Arrow keys for lists/menus
   - Escape to close modals

2. **Screen Reader Support**:
   - ARIA labels on all interactive elements
   - ARIA live regions for dynamic content
   - Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)

3. **Color Contrast**:
   - Text: 4.5:1 minimum
   - UI components: 3:1 minimum
   - Don't rely on color alone (use icons + text)

4. **Focus Management**:
   - Visible focus indicators
   - Logical focus order
   - Focus trapped in modals

5. **Reduced Motion**:
   - Respect `prefers-reduced-motion`
   - Disable animations for users who request it

**Testing**:
- Manual screen reader testing (NVDA on Windows, VoiceOver on Mac)
- Keyboard-only navigation testing
- Color contrast checker (WebAIM Contrast Checker)

---

## Privacy Requirements (IMMUTABLE)

1. **localStorage-First**:
   - All core features work with localStorage only
   - No server required for BNPL management
   - 5MB storage limit (browser default)

2. **PII Sanitization**:
   - Sanitize emails, names, addresses, SSNs before export
   - Use regex patterns + word boundaries
   - Sanitize logs and telemetry

3. **No Tracking by Default**:
   - No analytics without explicit opt-in
   - No third-party trackers
   - No fingerprinting

4. **Explicit Consent**:
   - Server features (sync, backup) require opt-in
   - Clear privacy disclosure
   - Granular consent (analytics, sync, telemetry separate)

5. **Data Ownership**:
   - Full export capability (JSON, CSV)
   - Full deletion capability
   - No data retention after deletion

---

## Performance Guidelines (Phase 1)

**Phase 1: No performance targets** (optimize only if users complain)

**Manual Testing**:
- Features must feel responsive during manual testing
- Page loads should not feel "obviously slow" (>5s)
- Charts should render without noticeable lag

**Allowed in Phase 1**:
- ✅ Unoptimized images (optimize later if needed)
- ✅ Blocking JavaScript (optimize later if needed)
- ✅ No lazy loading (optimize later if needed)

**Prohibited in Phase 1**:
- ❌ Features that feel obviously slow during manual testing

---

## Common Commands

### Development

```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Testing (Phase 2+)

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

---

## Tooling Integration

### Linear (Project Management)

- Every Spec-Kit spec creates a Linear issue
- Linear tracks progress (To Do → In Progress → Done)
- Labels: `tier-0`, `tier-1`, `tier-2`, `phase-1`, `feature`, `bug`

### CodeRabbit (Code Review)

- Automated code review enforcing constitutional principles
- Rejects PRs that violate IMMUTABLE principles
- Checks accessibility (WCAG 2.1 AA)
- Verifies Phase 1 requirements (no automated tests required)
- **You must respond to ALL feedback** (fix or defer to Linear)

### Claude Code Bot (GitHub Actions)

- Automated code review from AI perspective
- Checks code quality and best practices
- Validates against specifications
- **You must respond to ALL feedback** (fix or defer to Linear)

### Linear (Issue Tracking)

- Use Linear MCP to create issues for deferred bot suggestions
- Link issues to parent feature
- Add `bot-suggestion` label
- Set appropriate priority (medium/low)

---

## Frequently Asked Questions

### Q: What is the bot review loop?

**A: After creating PR, bots review your code.** You must fix CRITICAL/HIGH issues immediately and defer MEDIUM/LOW to Linear. Iterate until both bots are green, then HIL reviews.

### Q: Can I merge without bot approval?

**A: NO.** Both Claude Code Bot and CodeRabbit AI must be green before HIL can review. No shortcuts, no exceptions.

### Q: Do I create specifications?

**A: NO.** Manus creates specifications. You implement from specifications. If specs are unclear, ask HIL to clarify with Manus.

### Q: Do I need to write tests in Phase 1?

**A: NO.** Phase 1 requires manual testing only. Automated tests are deferred to Phase 2 (100-1,000 users). Focus on shipping features fast.

### Q: Should I optimize performance?

**A: ONLY IF users complain.** Phase 1 has no performance targets. Optimize only if users report "slow" or "laggy" features.

### Q: When should I use full Spec-Kit workflow?

**A: Only for Tier 2 (complex) features.** Most features are Tier 1 (medium) and only need spec.md. Simple features (Tier 0) don't even need spec.md.

### Q: What if Privacy conflicts with a feature request?

**A: Privacy wins.** Privacy-First is IMMUTABLE and supersedes all other principles. If a feature violates privacy, reject it or redesign it to be privacy-preserving.

### Q: Can I add a dependency?

**A: YES, but justify it.** Follow Simplicity principle (Principle VII). Only add dependencies that solve real problems. Avoid dependency bloat.

### Q: What if I find a bug in production?

**A: Fix within 48 hours.** Phase 1 allows shipping without automated tests, but user-reported bugs must be fixed quickly. Add regression test in Phase 2.

---

## Resources

- **Constitution**: `memory/constitution.md` (READ THIS FIRST)
- **Implementation Prompts**: `.claude/prompts/implement-*.md` (created by Manus)
- **Spec-Kit Commands**: `.claude/commands/*.md`
- **CodeRabbit Config**: `.coderabbit.yaml`
- **Market Research**: `docs/market-research/*.md`
- **Competitor Analysis**: `docs/reports/analysis/*.md`

---

## Version History

- **2025-10-28**: Added HIL → Manus → Claude Code workflow, bot review loop process
- **2025-10-27**: Updated for Constitution v1.1 (Phase 1 focus, Spec-Kit integration, tooling integration)
- **2025-10-17**: Initial version (auto-generated from feature plans)

---

**Remember**: You are building a privacy-first, BNPL-focused debt management app for 30 million Gen Z users living paycheck-to-paycheck. Ship features fast, maintain accessibility, and always prioritize user privacy. Read the constitution before every feature implementation.

**Current Goal**: Ship 8 table-stakes features in 12 weeks to reach market competitiveness.

**You've got this!** 🚀

