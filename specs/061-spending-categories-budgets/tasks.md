# Tasks: Spending Categories & Budget Creation

**Input**: Design documents from `/specs/061-spending-categories-budgets/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md  
**Tests**: Manual testing only (Phase 1 per constitution)  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `frontend/tests/`
- Paths shown below use web app structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify TypeScript 5.8 and React 19 are configured
- [ ] T002 [P] Install uuid package (`npm install uuid @types/uuid`)
- [ ] T003 [P] Verify Zod is installed (already in package.json)
- [ ] T004 [P] Verify Radix UI is installed (already in package.json)
- [ ] T005 [P] Verify lucide-react is installed (already in package.json)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create `frontend/src/types/category.ts` with Category interface
- [ ] T007 Create `frontend/src/types/budget.ts` with Budget interface
- [ ] T008 [P] Create `frontend/src/lib/categories/schema.ts` with Zod CategorySchema
- [ ] T009 [P] Create `frontend/src/lib/budgets/schema.ts` with Zod BudgetSchema
- [ ] T010 [P] Create `frontend/src/lib/storage/localStorage.ts` with generic get/set/update/delete utilities
- [ ] T011 Create `frontend/src/lib/categories/predefined.ts` with 9 pre-defined categories data
- [ ] T012 [P] Create `frontend/src/lib/categories/storage.ts` with category localStorage operations
- [ ] T013 [P] Create `frontend/src/lib/budgets/storage.ts` with budget localStorage operations
- [ ] T014 Update `frontend/src/types/transaction.ts` to add optional `categoryId?: string` field

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Manage Categories (Priority: P0) 🎯 MVP

**Goal**: Users can create custom categories with name, icon, and color

**Independent Test**: User can create a custom category (e.g., "Coffee Shops"), assign it an icon and color, and see it appear in the category list

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create `frontend/src/hooks/useCategories.ts` hook with CRUD operations
- [ ] T016 [P] [US1] Create `frontend/src/components/categories/CategoryCard.tsx` component
- [ ] T017 [P] [US1] Create `frontend/src/components/categories/CategoryForm.tsx` form component
- [ ] T018 [US1] Create `frontend/src/components/categories/CategoryList.tsx` list component (uses CategoryCard)
- [ ] T019 [US1] Create `frontend/src/components/categories/DeleteCategoryDialog.tsx` confirmation dialog
- [ ] T020 [US1] Create `frontend/src/pages/Categories.tsx` page (uses CategoryList + CategoryForm)
- [ ] T021 [US1] Add `/categories` route to `frontend/src/routes.ts`
- [ ] T022 [US1] Update navigation to include "Categories" link

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Set Monthly Budgets (Priority: P0)

**Goal**: Users can set monthly spending limits for each category

**Independent Test**: User can set a $500 monthly budget for "Groceries" category and see it saved

### Implementation for User Story 2

- [ ] T023 [P] [US2] Create `frontend/src/hooks/useBudgets.ts` hook with CRUD operations
- [ ] T024 [P] [US2] Create `frontend/src/components/budgets/BudgetForm.tsx` form component
- [ ] T025 [P] [US2] Create `frontend/src/components/budgets/BudgetCard.tsx` component
- [ ] T026 [US2] Create `frontend/src/components/budgets/BudgetList.tsx` list component (uses BudgetCard)
- [ ] T027 [US2] Create `frontend/src/pages/Budgets.tsx` page (uses BudgetList + BudgetForm)
- [ ] T028 [US2] Add `/budgets` route to `frontend/src/routes.ts`
- [ ] T029 [US2] Update navigation to include "Budgets" link

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Track Budget Progress (Priority: P0)

**Goal**: Users see visual progress bars showing how much of their budget they've spent

**Independent Test**: User with a $500 Groceries budget and $300 spent sees a progress bar showing "60% spent - $200 left"

### Implementation for User Story 3

- [ ] T030 [P] [US3] Create `frontend/src/lib/budgets/calculations.ts` with budget progress calculation utilities
- [ ] T031 [US3] Create `frontend/src/hooks/useBudgetProgress.ts` hook (uses calculations.ts)
- [ ] T032 [US3] Create `frontend/src/components/budgets/BudgetProgressBar.tsx` component with ARIA attributes
- [ ] T033 [US3] Update `frontend/src/components/budgets/BudgetCard.tsx` to include BudgetProgressBar
- [ ] T034 [US3] Update `frontend/src/components/budgets/BudgetList.tsx` to show progress for all budgets

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Assign Transactions to Categories (Priority: P1)

**Goal**: Users can assign transactions to categories so budget progress bars update automatically

**Independent Test**: User assigns a $50 transaction to "Groceries" category and sees the Groceries budget progress bar update from $0 to $50

### Implementation for User Story 4

- [ ] T035 [P] [US4] Create `frontend/src/components/categories/CategorySelector.tsx` dropdown component
- [ ] T036 [US4] Update transaction form components to include CategorySelector
- [ ] T037 [US4] Update transaction storage to persist categoryId field
- [ ] T038 [US4] Update useBudgetProgress hook to recalculate when transactions change
- [ ] T039 [US4] Test that budget progress bars update in real-time when transactions are categorized

**Checkpoint**: At this point, all 4 user stories should work together seamlessly

---

## Phase 7: User Story 5 - Use Pre-defined Categories (Priority: P2)

**Goal**: Users see 9 pre-defined categories ready to use without setup

**Independent Test**: User opens Categories page and sees 9 pre-defined categories (Groceries, Dining, Transportation, Housing, Utilities, Entertainment, Healthcare, Debt, Savings) ready to use

### Implementation for User Story 5

- [ ] T040 [US5] Update useCategories hook to initialize pre-defined categories on first load
- [ ] T041 [US5] Add logic to detect first-time user (no categories in localStorage)
- [ ] T042 [US5] Seed localStorage with 9 pre-defined categories from predefined.ts
- [ ] T043 [US5] Ensure pre-defined categories cannot be deleted (only hidden)
- [ ] T044 [US5] Test that new users see pre-defined categories immediately

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T045 [P] Add React.memo to CategoryCard component for performance
- [ ] T046 [P] Add React.memo to BudgetCard component for performance
- [ ] T047 [P] Implement debounced localStorage writes (500ms) in storage utilities
- [ ] T048 [P] Add storage quota monitoring (warn at 80%, block at 95%)
- [ ] T049 Manual accessibility testing with keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- [ ] T050 Manual accessibility testing with screen reader (NVDA or VoiceOver)
- [ ] T051 Manual cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] T052 Manual mobile testing (iOS Safari, Android Chrome)
- [ ] T053 Verify all forms have proper labels and ARIA attributes
- [ ] T054 Verify progress bars have ARIA role="progressbar" with aria-valuenow, aria-valuemin, aria-valuemax
- [ ] T055 Verify progress bars use icons + text (not color alone) for status
- [ ] T056 Performance testing: Category list renders in <500ms with 100+ categories
- [ ] T057 Performance testing: Budget progress updates in <500ms after transaction categorization
- [ ] T058 Code cleanup and refactoring
- [ ] T059 Update README.md with Categories and Budgets feature documentation
- [ ] T060 Create PR and link to Linear MMT-61

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P0 → P1 → P2)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P0)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P0)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P0)**: Can start after Foundational (Phase 2) - May use BudgetCard from US2 but should be independently testable
- **User Story 4 (P1)**: Depends on US1 (categories exist) and US2 (budgets exist) - Must run after US1 and US2
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 but doesn't depend on it

### Within Each User Story

- Models before services
- Services before components
- Components before pages
- Pages before routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1, US2, US3, US5 can start in parallel (if team capacity allows)
- US4 must wait for US1 and US2 to complete
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all parallel tasks for User Story 1 together:
Task: "Create useCategories.ts hook" (T015)
Task: "Create CategoryCard.tsx component" (T016)
Task: "Create CategoryForm.tsx component" (T017)

# Then sequential tasks:
Task: "Create CategoryList.tsx" (T018) - depends on CategoryCard
Task: "Create DeleteCategoryDialog.tsx" (T019)
Task: "Create Categories.tsx page" (T020) - depends on CategoryList + CategoryForm
Task: "Add /categories route" (T021)
Task: "Update navigation" (T022)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently
4. Developer D: User Story 4 (after US1 and US2 complete)
5. Developer E: User Story 5 (can start anytime after Foundational)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Manual testing only (Phase 1 per constitution - no automated tests)
- Accessibility is CRITICAL - test with keyboard and screen reader before marking complete
- Performance targets: <500ms rendering, <500ms budget updates, debounced writes
- localStorage monitoring: warn at 80%, block at 95%

---

## Task Summary

**Total Tasks**: 60  
**Setup**: 5 tasks  
**Foundational**: 9 tasks  
**User Story 1**: 8 tasks  
**User Story 2**: 7 tasks  
**User Story 3**: 5 tasks  
**User Story 4**: 5 tasks  
**User Story 5**: 5 tasks  
**Polish**: 16 tasks  

**Parallel Opportunities**: 21 tasks marked [P]  
**Estimated Time**: 3-5 days (per Linear MMT-61 estimate)  
**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 22 tasks

