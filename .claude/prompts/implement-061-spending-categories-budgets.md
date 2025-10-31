# Implementation Prompt: Spending Categories & Budget Creation (MMT-61)

**Feature ID**: 061-spending-categories-budgets  
**Linear Issue**: MMT-61  
**Priority**: P0 (Table Stakes - Pre-MVP Phase 1)  
**Estimated Time**: 3-5 days  
**Target**: Ship 5 user stories with full WCAG 2.1 AA accessibility

---

## Context

You are implementing the **Spending Categories & Budget Creation** feature for PayPlan, a privacy-first budgeting app targeting Gen Z users living paycheck-to-paycheck. This is a **table-stakes feature** required for Pre-MVP Phase 1.

**Your Role**: You are Claude Code, the AI developer. You will use the **7-phase feature-dev workflow** to implement this feature:
1. Discovery
2. Exploration
3. Clarification
4. Architecture
5. Implementation
6. Review
7. Summary

---

## Constitutional Requirements (MUST READ)

Before starting, read and internalize these files:
1. **`memory/constitution.md`** - Immutable architectural principles
2. **`CLAUDE.md`** - Your workflow and responsibilities

**Critical Constitutional Principles**:
- ✅ **Privacy-First**: localStorage-first, no auth required for core features
- ✅ **Accessibility-First**: WCAG 2.1 AA compliance mandatory (use React Aria for progress bars)
- ✅ **Free Core**: All budgeting features free forever
- ✅ **Visual-First**: Charts for everything (but use React Aria for progress bars, NOT Recharts)
- ✅ **Manual Testing Only**: Phase 1 = no automated tests (per constitution)

---

## Specification Documents (READ ALL)

All specification documents are in: **`specs/061-spending-categories-budgets/`**

### Required Reading (in order):
1. **`spec.md`** - Feature specification with 5 user stories
2. **`research-verified-2025.md`** - Verified research findings (100% confidence)
3. **`plan.md`** - Technical implementation approach
4. **`data-model.md`** - TypeScript types and Zod schemas
5. **`tasks.md`** - 60 atomic tasks organized by user story
6. **`checklist.md`** - Quality validation checklist

### Key Decisions from Research (Verified 2025-10-29):
- ✅ **Use React Aria `useProgressBar` v3.44.0** for progress bars (WCAG 2.1 AA compliant)
- ❌ **Do NOT use Recharts** for progress bars (has accessibility issues)
- ✅ **Use Radix UI** for modals, dialogs, and form components
- ✅ **Use Lucide React** for icons (already installed)
- ✅ **Use Zod** for form validation (already in tech stack)
- ✅ **Debounce localStorage writes to 300ms** for optimal performance
- ✅ **3:1 contrast ratio + dual encoding** (color + icon + text) for status indicators

---

## User Stories to Implement

### User Story 1 (P0): Create and Manage Categories 🎯 MVP
**Goal**: Users can create custom categories with name, icon, and color

**Acceptance Criteria**:
- User can create a custom category (e.g., "Coffee Shops")
- User can assign an icon from Lucide React icon set
- User can assign a color (hex code)
- User can edit existing categories
- User can delete categories (with confirmation dialog)
- User sees 9 pre-defined categories on first load

### User Story 2 (P0): Set Monthly Budgets
**Goal**: Users can set monthly spending limits for each category

**Acceptance Criteria**:
- User can set a monthly budget amount for any category
- Budget amounts are stored in cents (integers)
- User can edit existing budgets
- User can delete budgets
- Budgets persist in localStorage

### User Story 3 (P0): Track Budget Progress
**Goal**: Users see visual progress bars showing how much of their budget they've spent

**Acceptance Criteria**:
- Progress bars use React Aria `useProgressBar` (WCAG 2.1 AA compliant)
- Progress bars show: percentage spent, amount spent, amount remaining
- Status indicators use dual encoding (color + icon + text):
  - Under budget: Green + "✓" icon + "$X left"
  - Warning (80%+): Yellow + "⚠" icon + "$X left"
  - Over budget: Red + "✕" icon + "$X over budget"
- Progress bars have proper ARIA attributes (role, aria-valuenow, aria-valuemin, aria-valuemax, aria-valuetext)
- Progress bars update in <500ms when transactions are categorized

### User Story 4 (P1): Assign Transactions to Categories
**Goal**: Users can assign transactions to categories so budget progress bars update automatically

**Acceptance Criteria**:
- User can select a category from dropdown when creating/editing transactions
- Transaction form includes CategorySelector component
- Budget progress bars update in real-time when transactions are categorized
- Uncategorized transactions don't affect budget progress

### User Story 5 (P2): Use Pre-defined Categories
**Goal**: Users see 9 pre-defined categories ready to use without setup

**Acceptance Criteria**:
- New users see 9 pre-defined categories on first load:
  1. Groceries (ShoppingCart icon)
  2. Dining (Utensils icon)
  3. Transportation (Car icon)
  4. Housing (Home icon)
  5. Utilities (Zap icon)
  6. Entertainment (Film icon)
  7. Healthcare (Heart icon)
  8. Debt (CreditCard icon)
  9. Savings (PiggyBank icon)
- Pre-defined categories cannot be deleted (only hidden)
- Pre-defined categories can be edited (name, icon, color)

---

## Technical Implementation Details

### Tech Stack (Already Configured)
- **Frontend**: React 19, TypeScript 5.8, Vite
- **State Management**: React hooks (useState, useEffect)
- **Storage**: localStorage (privacy-first, no backend)
- **UI Components**: Radix UI (modals, dialogs, forms)
- **Icons**: Lucide React (already installed)
- **Validation**: Zod (already installed)
- **Accessibility**: React Aria (install `react-aria@3.44.0`)
- **Styling**: Tailwind CSS

### File Structure
```
frontend/src/
├── types/
│   ├── category.ts          # Category interface
│   ├── budget.ts            # Budget interface
│   └── transaction.ts       # Update with categoryId field
├── lib/
│   ├── categories/
│   │   ├── schema.ts        # Zod CategorySchema
│   │   ├── storage.ts       # localStorage operations
│   │   └── predefined.ts    # 9 pre-defined categories
│   ├── budgets/
│   │   ├── schema.ts        # Zod BudgetSchema
│   │   ├── storage.ts       # localStorage operations
│   │   └── calculations.ts  # Budget progress calculations
│   └── storage/
│       └── localStorage.ts  # Generic storage utilities
├── hooks/
│   ├── useCategories.ts     # Category CRUD operations
│   ├── useBudgets.ts        # Budget CRUD operations
│   └── useBudgetProgress.ts # Budget progress calculations
├── components/
│   ├── categories/
│   │   ├── CategoryCard.tsx
│   │   ├── CategoryForm.tsx
│   │   ├── CategoryList.tsx
│   │   ├── CategorySelector.tsx
│   │   └── DeleteCategoryDialog.tsx
│   └── budgets/
│       ├── BudgetCard.tsx
│       ├── BudgetForm.tsx
│       ├── BudgetList.tsx
│       └── BudgetProgressBar.tsx
└── pages/
    ├── Categories.tsx
    └── Budgets.tsx
```

### localStorage Keys
```typescript
// Separate keys for better performance
const STORAGE_KEYS = {
  CATEGORIES: 'payplan_categories',
  BUDGETS: 'payplan_budgets',
  TRANSACTIONS: 'payplan_transactions',
};
```

### React Aria Progress Bar Example
```tsx
import { useProgressBar } from 'react-aria';

function BudgetProgressBar({ budget, spent }) {
  const percentage = (spent / budget) * 100;
  const remaining = budget - spent;
  
  const { progressBarProps, labelProps } = useProgressBar({
    label: 'Budget progress',
    value: spent,
    minValue: 0,
    maxValue: budget,
    formatOptions: { style: 'currency', currency: 'USD' }
  });

  // Determine status
  const status = percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'under';
  const statusConfig = {
    under: { color: 'green', icon: '✓', text: `$${remaining} left` },
    warning: { color: 'yellow', icon: '⚠', text: `$${remaining} left` },
    over: { color: 'red', icon: '✕', text: `$${Math.abs(remaining)} over budget` }
  };

  return (
    <div {...progressBarProps}>
      <div {...labelProps}>
        <span>{statusConfig[status].icon}</span>
        <span>{statusConfig[status].text}</span>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill bg-${statusConfig[status].color}-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
```

---

## Implementation Strategy

### Phase-by-Phase Approach

**Phase 1: Setup (5 tasks)**
- Verify dependencies (TypeScript, React, Zod, Radix UI, Lucide React)
- Install React Aria: `npm install react-aria@3.44.0`
- Install uuid: `npm install uuid @types/uuid`

**Phase 2: Foundational (9 tasks) ⚠️ CRITICAL**
- Create TypeScript interfaces (Category, Budget)
- Create Zod schemas (CategorySchema, BudgetSchema)
- Create localStorage utilities (generic get/set/update/delete)
- Create pre-defined categories data
- Update Transaction interface with `categoryId?: string`

**⚠️ CHECKPOINT**: Foundation must be complete before ANY user story work begins

**Phase 3: User Story 1 (8 tasks)**
- Create useCategories hook
- Create CategoryCard, CategoryForm, CategoryList components
- Create DeleteCategoryDialog
- Create Categories page
- Add /categories route

**✅ CHECKPOINT**: Test User Story 1 independently before proceeding

**Phase 4: User Story 2 (7 tasks)**
- Create useBudgets hook
- Create BudgetCard, BudgetForm, BudgetList components
- Create Budgets page
- Add /budgets route

**✅ CHECKPOINT**: Test User Stories 1 AND 2 independently

**Phase 5: User Story 3 (5 tasks)**
- Create budget calculations utilities
- Create useBudgetProgress hook
- Create BudgetProgressBar component (React Aria)
- Update BudgetCard to include progress bar

**✅ CHECKPOINT**: Test User Stories 1, 2, AND 3 independently

**Phase 6: User Story 4 (5 tasks)**
- Create CategorySelector dropdown
- Update transaction form to include CategorySelector
- Update transaction storage to persist categoryId
- Update useBudgetProgress to recalculate on transaction changes

**✅ CHECKPOINT**: Test all 4 user stories working together

**Phase 7: User Story 5 (5 tasks)**
- Update useCategories to initialize pre-defined categories
- Add first-time user detection
- Seed localStorage with 9 pre-defined categories
- Ensure pre-defined categories cannot be deleted

**✅ CHECKPOINT**: Test all 5 user stories independently

**Phase 8: Polish (16 tasks)**
- Add React.memo for performance
- Implement debounced localStorage writes (300ms)
- Add storage quota monitoring (warn at 80%, block at 95%)
- Manual accessibility testing (keyboard + screen reader)
- Manual cross-browser testing
- Manual mobile testing
- Performance testing (<500ms targets)
- Code cleanup and documentation

---

## Critical Instructions for Claude Code

### 1. Use ALL Available Tools
You have access to powerful tools. **USE THEM EXTENSIVELY**:
- ✅ **Read files** to understand existing code
- ✅ **Search codebase** to find patterns and examples
- ✅ **Create files** for new components
- ✅ **Edit files** to update existing code
- ✅ **Run commands** to install packages, test, and verify
- ✅ **Browse documentation** for React Aria, Radix UI, Lucide React

### 2. Follow the 7-Phase Workflow
1. **Discovery**: Read all spec files, understand requirements
2. **Exploration**: Explore existing codebase, find patterns
3. **Clarification**: Ask questions if anything is unclear
4. **Architecture**: Propose implementation approach (multiple options with trade-offs)
5. **Implementation**: Code only after explicit approval
6. **Review**: Self-review against checklist.md
7. **Summary**: Document what was accomplished

### 3. Accessibility is MANDATORY
- ✅ Use React Aria `useProgressBar` for progress bars
- ✅ Add proper ARIA attributes (role, aria-valuenow, aria-valuemin, aria-valuemax, aria-valuetext)
- ✅ Use dual encoding (color + icon + text) for status indicators
- ✅ Test with keyboard navigation (Tab, Enter, Escape)
- ✅ Ensure 3:1 contrast ratio for UI components
- ❌ Do NOT use Recharts for progress bars (has accessibility issues)

### 4. Performance Requirements
- ✅ Category list renders in <500ms (even with 100+ categories)
- ✅ Budget progress updates in <500ms after transaction categorization
- ✅ Debounce localStorage writes to 300ms
- ✅ Use React.memo, useMemo, useCallback for optimization

### 5. Testing Requirements
- ✅ Manual testing only (Phase 1 per constitution)
- ✅ Test each user story independently before proceeding
- ✅ Test with keyboard navigation
- ✅ Test with screen reader (NVDA or VoiceOver)
- ✅ Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- ✅ Test on mobile (iOS Safari, Android Chrome)

### 6. Code Quality
- ✅ Follow existing code patterns in the codebase
- ✅ Use TypeScript strictly (no `any` types)
- ✅ Use Zod for all form validation
- ✅ Add JSDoc comments for complex functions
- ✅ Keep components small and focused (Single Responsibility Principle)
- ✅ Extract reusable logic into custom hooks

### 7. Git Workflow
- ✅ Create a feature branch: `git checkout -b feature/MMT-61-spending-categories-budgets`
- ✅ Commit after each logical unit of work
- ✅ Use conventional commit messages: `feat(categories): add CategoryCard component`
- ✅ Create PR when complete and link to Linear MMT-61

---

## Verification Checklist

Before marking this feature complete, verify:

### Functional Requirements
- [ ] All 5 user stories work independently
- [ ] All 15 functional requirements from spec.md are met
- [ ] All acceptance criteria are satisfied
- [ ] Pre-defined categories appear on first load
- [ ] Budget progress bars update in real-time

### Accessibility Requirements (CRITICAL)
- [ ] Progress bars use React Aria `useProgressBar`
- [ ] All ARIA attributes are present and correct
- [ ] Dual encoding (color + icon + text) for all status indicators
- [ ] 3:1 contrast ratio for UI components
- [ ] Keyboard navigation works (Tab, Enter, Escape, Delete)
- [ ] Screen reader announces all interactive elements
- [ ] Focus indicators are visible

### Performance Requirements
- [ ] Category list renders in <500ms
- [ ] Budget progress updates in <500ms
- [ ] localStorage writes are debounced to 300ms
- [ ] No unnecessary re-renders (use React.memo)

### Code Quality
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All imports are used
- [ ] No `any` types
- [ ] JSDoc comments for complex functions
- [ ] Code follows existing patterns

### Testing
- [ ] Manual testing with keyboard navigation
- [ ] Manual testing with screen reader
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Android Chrome)

### Documentation
- [ ] README.md updated with Categories and Budgets feature
- [ ] Code comments for complex logic
- [ ] PR description includes screenshots/video

---

## Expected Deliverables

1. **Code**: All 60 tasks from tasks.md completed
2. **Git**: Feature branch with clean commit history
3. **PR**: Pull request linked to Linear MMT-61
4. **Documentation**: README.md updated
5. **Testing**: Manual testing completed (checklist.md)
6. **Summary**: Summary of what was accomplished (Phase 7 of workflow)

---

## Questions to Ask During Clarification Phase

If anything is unclear, ask questions like:
- "Should pre-defined categories be editable or read-only?"
- "What should happen if a user tries to delete a category that has transactions?"
- "Should budget progress bars show historical data or only current month?"
- "What color palette should be used for category colors?"

**Do NOT guess**. Ask for clarification if needed.

---

## Success Criteria

This feature is complete when:
1. ✅ All 5 user stories work independently
2. ✅ All accessibility requirements are met (WCAG 2.1 AA)
3. ✅ All performance targets are met (<500ms)
4. ✅ Manual testing is complete (keyboard + screen reader)
5. ✅ Code review by bots shows no CRITICAL/HIGH issues
6. ✅ PR is approved by HIL (human)

---

## Final Notes

- **Read the constitution first**: `memory/constitution.md`
- **Read your workflow**: `CLAUDE.md`
- **Read all spec files**: `specs/061-spending-categories-budgets/`
- **Use React Aria for progress bars**: NOT Recharts
- **Test accessibility**: Keyboard + screen reader mandatory
- **Ask questions**: Don't guess, clarify during Phase 3

**You've got this!** 🚀

---

**Created by**: Manus AI (Project Manager)  
**Date**: 2025-10-29  
**Linear Issue**: MMT-61  
**Estimated Time**: 3-5 days
