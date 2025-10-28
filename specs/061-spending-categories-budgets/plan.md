# Implementation Plan: Spending Categories & Budget Creation

**Branch**: `061-spending-categories-budgets` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/061-spending-categories-budgets/spec.md`

## Summary

Implement spending categories and monthly budget creation/tracking with visual progress bars. Users can create custom categories, set monthly limits, and track spending progress in real-time. All data stored in localStorage (privacy-first). WCAG 2.1 AA compliant with keyboard navigation and screen reader support.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19  
**Primary Dependencies**: Radix UI (forms), Zod (validation), uuid (IDs), lucide-react (icons)  
**Storage**: localStorage (JSON structure)  
**Testing**: Manual testing only (Phase 1 per constitution)  
**Target Platform**: Web (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), Mobile (iOS Safari, Android Chrome)  
**Project Type**: Web (frontend only)  
**Performance Goals**: <500ms category list render, <500ms budget progress update, <30s category creation, <15s budget creation  
**Constraints**: <5 MB localStorage usage (warn at 80%, block at 95%), WCAG 2.1 AA compliance  
**Scale/Scope**: 100+ categories, 1000+ transactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Privacy-First** (constitution lines 68-120):  
✅ PASS - All data stored in localStorage, no server required

**Accessibility-First** (constitution lines 68-120):  
✅ PASS - WCAG 2.1 AA compliance required, keyboard navigation, screen reader support

**Free Core** (constitution):  
✅ PASS - Categories and budgets are core features, must be free

**UX Principles** (constitution lines 208-253):  
✅ PASS - <30s category creation, <15s budget creation, visual-first design

**Performance Requirements** (constitution lines 275-332):  
✅ PASS - <500ms rendering, debounced localStorage writes

**Data Architecture** (constitution lines 800-1000+):  
✅ PASS - localStorage JSON schema, Zod validation

## Project Structure

### Documentation (this feature)

```text
specs/061-spending-categories-budgets/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This file (implementation plan)
├── data-model.md        # Data schemas and localStorage structure
├── tasks.md             # Task breakdown for implementation
└── checklist.md         # Quality checklist (accessibility, performance)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── categories/
│   │   │   ├── CategoryForm.tsx          # Create/edit category form
│   │   │   ├── CategoryList.tsx          # List of all categories
│   │   │   ├── CategoryCard.tsx          # Single category display
│   │   │   ├── CategorySelector.tsx      # Dropdown for selecting category
│   │   │   └── DeleteCategoryDialog.tsx  # Confirmation dialog
│   │   ├── budgets/
│   │   │   ├── BudgetForm.tsx            # Create/edit budget form
│   │   │   ├── BudgetProgressBar.tsx     # Visual progress bar
│   │   │   ├── BudgetCard.tsx            # Single budget display
│   │   │   └── BudgetList.tsx            # List of all budgets
│   │   └── ui/
│   │       └── (existing Radix UI components)
│   ├── hooks/
│   │   ├── useCategories.ts              # Category CRUD operations
│   │   ├── useBudgets.ts                 # Budget CRUD operations
│   │   └── useBudgetProgress.ts          # Calculate budget progress
│   ├── lib/
│   │   ├── categories/
│   │   │   ├── schema.ts                 # Zod schemas for categories
│   │   │   ├── storage.ts                # localStorage operations
│   │   │   └── predefined.ts             # Pre-defined categories
│   │   ├── budgets/
│   │   │   ├── schema.ts                 # Zod schemas for budgets
│   │   │   ├── storage.ts                # localStorage operations
│   │   │   └── calculations.ts           # Budget progress calculations
│   │   └── storage/
│   │       └── localStorage.ts           # Generic localStorage utilities
│   ├── pages/
│   │   ├── Categories.tsx                # Categories management page
│   │   └── Budgets.tsx                   # Budgets management page
│   ├── types/
│   │   ├── category.ts                   # Category TypeScript types
│   │   └── budget.ts                     # Budget TypeScript types
│   └── routes.ts                         # Add /categories and /budgets routes
└── tests/
    └── (manual testing only in Phase 1)
```

**Structure Decision**: Web application structure with frontend only. Categories and budgets are organized into separate component directories for maintainability. Hooks provide reusable business logic. localStorage utilities are centralized for consistency.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitutional requirements are met.

## Implementation Approach

### Phase 0: Research & Design (Completed)

**Research completed in `PHASE1_RESEARCH_FINDINGS.md`:**
- ✅ Budgeting app UX best practices (YNAB analysis)
- ✅ Accessibility for financial apps (WCAG 2.1 AA, charts)
- ✅ localStorage performance & limits (5-10 MB, benchmarks)

**Key findings:**
- Visual progress bars increase budget adherence by 22%
- Pre-defined categories reduce onboarding time by 60%
- Recharts not needed for Phase 1 (simple progress bars sufficient)
- localStorage can handle 1000+ transactions without performance issues

### Phase 1: Data Model & Schemas

**Goal**: Define TypeScript types and Zod validation schemas

**Deliverables**:
1. `data-model.md` - Complete data model documentation
2. `types/category.ts` - Category TypeScript interface
3. `types/budget.ts` - Budget TypeScript interface
4. `lib/categories/schema.ts` - Zod validation for categories
5. `lib/budgets/schema.ts` - Zod validation for budgets

**localStorage Schema**:
```typescript
{
  "version": "1.0",
  "categories": [
    {
      "id": "uuid",
      "name": "Groceries",
      "icon": "shopping-cart",
      "color": "#10b981",
      "isPredefined": true,
      "createdAt": "2025-10-28T20:00:00Z"
    }
  ],
  "budgets": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "monthlyLimit": 500,
      "period": "monthly",
      "rollover": false,
      "createdAt": "2025-10-28T20:00:00Z"
    }
  ],
  "transactions": [
    {
      // existing fields...
      "categoryId": "uuid" // NEW FIELD
    }
  ]
}
```

### Phase 2: Storage Layer

**Goal**: Implement localStorage operations for categories and budgets

**Deliverables**:
1. `lib/storage/localStorage.ts` - Generic localStorage utilities (get, set, update, delete)
2. `lib/categories/storage.ts` - Category-specific storage operations
3. `lib/budgets/storage.ts` - Budget-specific storage operations
4. `lib/categories/predefined.ts` - Pre-defined categories data

**Key Operations**:
- `getCategories()` - Load all categories from localStorage
- `createCategory(category)` - Add new category
- `updateCategory(id, updates)` - Update existing category
- `deleteCategory(id)` - Delete category (with transaction check)
- `getBudgets()` - Load all budgets from localStorage
- `createBudget(budget)` - Add new budget
- `updateBudget(id, updates)` - Update existing budget
- `deleteBudget(id)` - Delete budget

### Phase 3: Business Logic Hooks

**Goal**: Implement React hooks for category and budget operations

**Deliverables**:
1. `hooks/useCategories.ts` - Category CRUD + pre-defined categories initialization
2. `hooks/useBudgets.ts` - Budget CRUD operations
3. `hooks/useBudgetProgress.ts` - Calculate budget progress from transactions
4. `lib/budgets/calculations.ts` - Budget calculation utilities

**Hook APIs**:
```typescript
// useCategories
const {
  categories,
  createCategory,
  updateCategory,
  deleteCategory,
  loading,
  error
} = useCategories();

// useBudgets
const {
  budgets,
  createBudget,
  updateBudget,
  deleteBudget,
  loading,
  error
} = useBudgets();

// useBudgetProgress
const {
  spent,
  remaining,
  percentage,
  status // 'safe' | 'warning' | 'danger'
} = useBudgetProgress(categoryId);
```

### Phase 4: UI Components

**Goal**: Build accessible, keyboard-navigable UI components

**Deliverables**:
1. `components/categories/CategoryForm.tsx` - Create/edit form
2. `components/categories/CategoryList.tsx` - List view
3. `components/categories/CategoryCard.tsx` - Single category
4. `components/categories/CategorySelector.tsx` - Dropdown
5. `components/categories/DeleteCategoryDialog.tsx` - Confirmation
6. `components/budgets/BudgetForm.tsx` - Create/edit form
7. `components/budgets/BudgetProgressBar.tsx` - Visual progress
8. `components/budgets/BudgetCard.tsx` - Single budget
9. `components/budgets/BudgetList.tsx` - List view

**Accessibility Requirements**:
- All forms: proper labels, ARIA attributes, keyboard navigation
- Progress bars: ARIA role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
- Progress bars: Icons + text (not color alone) for status
- Keyboard: Tab, Shift+Tab, Enter, Escape
- Screen reader: Descriptive labels on all interactive elements

### Phase 5: Pages & Routing

**Goal**: Create category and budget management pages

**Deliverables**:
1. `pages/Categories.tsx` - Categories management page
2. `pages/Budgets.tsx` - Budgets management page
3. `routes.ts` - Add /categories and /budgets routes
4. `components/navigation/NavigationHeader.tsx` - Update nav to include Categories and Budgets

**Page Structure**:
- Categories page: CategoryList + CategoryForm (modal)
- Budgets page: BudgetList + BudgetForm (modal)

### Phase 6: Integration & Polish

**Goal**: Integrate with existing transaction system and polish UX

**Deliverables**:
1. Update transaction components to include CategorySelector
2. Update transaction storage to persist categoryId
3. Performance optimization (memoization, debounced writes)
4. Accessibility audit (manual testing with keyboard + screen reader)
5. Cross-browser testing (Chrome, Firefox, Safari, Edge)

## Risk Mitigation

### Risk 1: localStorage Quota Exceeded
**Mitigation**: Implement storage monitoring (warn at 80%, block at 95%). Provide export functionality to free space.

### Risk 2: Performance Degradation with 100+ Categories
**Mitigation**: Use React.memo for CategoryCard and BudgetCard. Virtualize lists if >100 items.

### Risk 3: Accessibility Issues
**Mitigation**: Manual testing with NVDA/VoiceOver. Use Radix UI components (built-in accessibility). Follow WCAG 2.1 AA guidelines strictly.

### Risk 4: Budget Calculations Incorrect
**Mitigation**: Write calculation utilities with clear logic. Manual testing with various scenarios (no spending, partial spending, overspending).

## Dependencies

**External**:
- Radix UI (already installed) - Accessible form components
- Zod (already installed) - Validation
- uuid (already installed) - ID generation
- lucide-react (already installed) - Icons

**Internal**:
- localStorage (browser API)
- Transaction system (must support categoryId field)
- Navigation system (must support new routes)

## Timeline Estimate

**Total**: 3-5 days (per Linear MMT-61 estimate)

**Breakdown**:
- Phase 1 (Data Model): 0.5 days
- Phase 2 (Storage Layer): 0.5 days
- Phase 3 (Business Logic): 1 day
- Phase 4 (UI Components): 1.5 days
- Phase 5 (Pages & Routing): 0.5 days
- Phase 6 (Integration & Polish): 1 day

## Success Criteria

Implementation is complete when:
- ✅ All user stories from spec.md are implemented
- ✅ All acceptance criteria are met
- ✅ Manual testing confirms feature works
- ✅ Accessibility tested (keyboard nav, screen reader)
- ✅ Performance targets met (<500ms rendering)
- ✅ No console errors or warnings
- ✅ Code follows TypeScript strict mode
- ✅ PR created and linked to Linear MMT-61

## Next Steps

1. Create `data-model.md` - Document complete data schemas
2. Create `tasks.md` - Break down implementation into tasks
3. Create `checklist.md` - Quality checklist for pre-merge validation
4. Begin implementation following task order

