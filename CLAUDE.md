# PayPlan Development Guide for Claude Code

**Last Updated**: 2025-10-27  
**Current Phase**: Phase 1 (Pre-MVP, 0-100 users)  
**Constitution Version**: 1.1

---

## Quick Start

**You are Claude Code, the AI developer implementing PayPlan features.**

Before implementing any feature:

1. **Read the Constitution**: `/home/ubuntu/PayPlan/memory/constitution.md`
2. **Check Current Phase**: Phase 1 (Pre-MVP) - Ship fast, manual testing only
3. **Review Spec**: Read the feature spec in `specs/XXX-feature-name/spec.md`
4. **Implement**: Follow Phase 1 requirements (no automated tests required)
5. **Test Manually**: Verify feature works before committing
6. **Commit**: Use conventional commits (`feat(scope): description`)

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

PayPlan is a privacy-first BNPL (Buy Now, Pay Later) debt management app targeting 18-35 year-olds living paycheck-to-paycheck with 3-5 active BNPL loans (Klarna, Affirm, Afterpay, etc.). PayPlan solves the BNPL debt crisis where 33% of users lose track of payments and 24% make late payments.

**Unique Value Propositions**:
1. **Privacy-First**: localStorage-only, no auth required (vs. competitors requiring bank sync)
2. **BNPL-Specific**: Email parser for 6 BNPL providers, risk detection for late fees
3. **Free Core**: All debt management features free forever (vs. YNAB $109/year)
4. **Visual-First**: Charts and gamification (vs. YNAB's spreadsheet complexity)
5. **Accessibility-First**: WCAG 2.1 AA from day one

**Target Market**: 60% of Gen Z uses BNPL = 30 million users

---

## Technology Stack

### Core Technologies

**Frontend**:
- React 19.1.1 (UI framework)
- TypeScript 5.8.3 (type safety, strict mode)
- Tailwind CSS 4.1.13 (utility-first styling)
- Radix UI (accessible component primitives)
- Recharts or Chart.js (data visualization)
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

### Spec-Kit Decision Tree

**Use this to decide which Spec-Kit tier to use**:

#### Tier 0: Simple Features (<3 days)

**Examples**: UI tweaks, bug fixes, minor enhancements

**Workflow**:
1. Create GitHub issue (user story + acceptance criteria)
2. Implement directly (no spec.md)
3. Manual testing
4. Commit and merge

**Skip**: spec.md, plan.md, tasks.md

---

#### Tier 1: Medium Features (3-7 days) **← MOST COMMON**

**Examples**: Spending categories, goal tracking, budget creation

**Workflow**:
1. Use `/speckit.specify` to create spec.md
2. Implement directly from spec (skip plan.md and tasks.md)
3. Manual testing + accessibility testing
4. Commit and merge

**Skip**: plan.md, tasks.md (too heavy for this complexity)

---

#### Tier 2: Complex Features (7-14 days)

**Examples**: Bank sync, AI categorization, multi-user collaboration

**Workflow** (Full Spec-Kit):
1. `/speckit.constitution` - Review principles
2. `/speckit.specify` - Create spec.md
3. `/speckit.clarify` - Resolve ambiguities
4. `/speckit.plan` - Generate plan.md
5. `/speckit.tasks` - Generate tasks.md
6. `/speckit.implement` - Execute tasks.md
7. `/speckit.analyze` - Verify consistency

**Use All Tools**: Full ceremony justified for this complexity

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
- Code review approved (1+ reviewer)
- CLAUDE.md updated (if tech stack changed)

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

## Mandatory Features (Roadmap)

### Tier 0: MVP Requirements (Weeks 1-6)

1. **Spending Categories** (Weeks 1-2)
   - Pre-defined + custom categories
   - Pie chart visualization
   - Transaction assignment

2. **Budget Creation & Tracking** (Weeks 3-4)
   - Monthly limits per category
   - Progress bars
   - Alerts when approaching limits

3. **Dashboard with Charts** (Weeks 5-6)
   - Net worth graph
   - Spending by category (pie chart)
   - Income vs. expenses (bar chart)
   - Recent transactions widget
   - Upcoming bills widget
   - Goal progress widget

4. **Goal Tracking** (Weeks 5-6)
   - Create savings goals
   - Progress bars with percentages
   - Goal completion celebrations

---

### Tier 1: Competitive Parity (Weeks 7-12)

5. **Recurring Transaction Detection** (Weeks 7-8)
   - Auto-detect subscriptions
   - BNPL installment detection
   - Price change alerts

6. **Bill Reminders & Alerts** (Weeks 9-10)
   - Upcoming bill notifications (7d, 3d, 1d)
   - Overdue payment warnings
   - Low balance alerts

7. **Cash Flow Reports** (Week 11)
   - Monthly income vs. expenses
   - Spending trends (3, 6, 12 months)
   - Exportable reports (PDF, CSV)

8. **Debt Payoff Calculator** (Week 12)
   - Snowball method
   - Avalanche method
   - Interest savings calculator
   - Payoff timeline projections

---

### Tier 2: Differentiation (Weeks 13-24, Optional Premium)

9. **Bank Account Sync** (Premium)
10. **AI-Powered Categorization** (Premium)
11. **Investment Tracking** (Premium)
12. **Multi-User Collaboration** (Premium)

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

### Claude Code Bot (GitHub Actions)

- Automated spec implementation
- Triggers on PR with `specs/**/spec.md` changes
- Reads constitution + spec
- Implements feature following Phase 1 requirements
- Creates implementation PR

---

## Frequently Asked Questions

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
- **Spec-Kit Commands**: `.claude/commands/*.md`
- **CodeRabbit Config**: `.coderabbit.yaml`
- **Market Research**: `docs/market-research/*.md`
- **Competitor Analysis**: `docs/reports/analysis/*.md`

---

## Version History

- **2025-10-27**: Updated for Constitution v1.1 (Phase 1 focus, Spec-Kit integration, tooling integration)
- **2025-10-17**: Initial version (auto-generated from feature plans)

---

**Remember**: You are building a privacy-first, BNPL-focused debt management app for 30 million Gen Z users living paycheck-to-paycheck. Ship features fast, maintain accessibility, and always prioritize user privacy. Read the constitution before every feature implementation.

**Current Goal**: Ship 8 table-stakes features in 12 weeks to reach market competitiveness.

**You've got this!** 🚀

