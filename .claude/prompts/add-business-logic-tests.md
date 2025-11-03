# Prompt for `/speckit.specify` - Add Business Logic Tests

## Feature Description (Copy this after the command)

```
Add comprehensive TDD test coverage for existing business logic to meet Constitution v3.1 requirements.

**Scope:**
- Add tests for categories business logic (features/categories/lib/)
- Add tests for budgets business logic (features/budgets/lib/)
- Add tests for dashboard business logic (features/dashboard/lib/)

**Target Coverage:**
- 80% coverage for all lib/**/*.ts files
- 90%+ coverage for financial calculations (budgets/lib/calculations.ts)
- 60% overall coverage minimum

**Business Logic to Test:**

1. **Categories (features/categories/lib/)**
   - CategoryStorageService.ts - CRUD operations for categories
   - predefined.ts - Predefined category logic
   - schemas.ts - Zod validation

2. **Budgets (features/budgets/lib/)**
   - BudgetStorageService.ts - CRUD operations for budgets
   - calculations.ts - Budget progress, rollover calculations (FINANCIAL!)
   - schemas.ts - Zod validation

3. **Dashboard (features/dashboard/lib/)**
   - storage.ts - Dashboard data persistence
   - gamification.ts - Streak calculation, insights generation
   - aggregation.ts - Data aggregation for charts
   - schemas.ts - Zod validation

**Success Criteria:**
- All business logic has test files with 80% coverage
- Financial calculations have 90%+ coverage
- Tests follow TDD best practices (Arrange-Act-Assert)
- All edge cases covered
- Build passes with 0 errors
- Overall codebase reaches 60% coverage

**Constitutional Requirement:**
- Phase 1 (v3.1) requires TDD for business logic
- This addresses technical debt from features built under v1.1/v2.0
- Sets foundation for future test-first development

**Out of Scope:**
- UI component tests (manual testing acceptable in Phase 1)
- Integration tests (Phase 2)
- E2E tests (Phase 2)
```

---

## How to Use This Prompt

### Step 1: Run the Specify Command

```bash
/speckit.specify Add comprehensive TDD test coverage for existing business logic to meet Constitution v3.1 requirements. **Scope:** Add tests for categories business logic (features/categories/lib/), budgets business logic (features/budgets/lib/), dashboard business logic (features/dashboard/lib/). **Target Coverage:** 80% coverage for all lib/**/*.ts files, 90%+ coverage for financial calculations (budgets/lib/calculations.ts), 60% overall coverage minimum. **Business Logic to Test:** 1. Categories (features/categories/lib/) - CategoryStorageService.ts CRUD operations, predefined.ts logic, schemas.ts validation. 2. Budgets (features/budgets/lib/) - BudgetStorageService.ts CRUD operations, calculations.ts budget progress and rollover (FINANCIAL!), schemas.ts validation. 3. Dashboard (features/dashboard/lib/) - storage.ts data persistence, gamification.ts streak calculation, aggregation.ts data aggregation, schemas.ts validation. **Success Criteria:** All business logic has test files with 80% coverage, financial calculations have 90%+ coverage, tests follow TDD best practices (Arrange-Act-Assert), all edge cases covered, build passes with 0 errors, overall codebase reaches 60% coverage. **Constitutional Requirement:** Phase 1 (v3.1) requires TDD for business logic. This addresses technical debt from features built under v1.1/v2.0. Sets foundation for future test-first development. **Out of Scope:** UI component tests (manual testing acceptable in Phase 1), integration tests (Phase 2), E2E tests (Phase 2).
```

### Step 2: Review Generated Spec

Claude Code will:
1. Generate a short name (e.g., "business-logic-tests")
2. Create `specs/XXX-business-logic-tests/spec.md`
3. Fill in all required sections from template
4. Mark any unclear areas with [NEEDS CLARIFICATION]

### Step 3: Clarify If Needed

If Claude marks items as [NEEDS CLARIFICATION], run:
```bash
/speckit.clarify
```

This will ask targeted questions and update the spec.

### Step 4: Generate Plan

After spec is complete:
```bash
/speckit.plan
```

This generates:
- `plan.md` - Technical approach
- `data-model.md` - Types and schemas (if needed)
- `research.md` - Deep research on testing patterns

### Step 5: Break Down Tasks

```bash
/speckit.tasks
```

This generates:
- `tasks.md` - Executable task breakdown
- `checklist.md` - Quality validation checklist

### Step 6: Implement

```bash
/speckit.implement
```

This executes the tasks and creates the tests!

---

## Best Practices (Based on Research)

### From Official Docs:

1. **Focus on "what" and "why"** - Not technical details
2. **Be specific about scope** - What's included, what's not
3. **Define success criteria** - Measurable outcomes
4. **Iterate with Claude** - First attempt isn't final
5. **Use constitution** - Ensure spec aligns with project values

### From Expert Users:

1. **Start with user value** - Why does this matter?
   - "Enables constitutional compliance (v3.1 TDD requirement)"
   - "Prevents bugs in financial calculations"

2. **Be explicit about scope boundaries**
   - "In scope: Business logic tests"
   - "Out of scope: UI tests, E2E tests"

3. **Provide context**
   - "This addresses technical debt from v1.1/v2.0 era"
   - "Sets foundation for test-first going forward"

4. **Reference existing code**
   - "Test features/categories/lib/CategoryStorageService.ts"
   - Specific file paths help Claude understand

5. **Quantify success**
   - "80% coverage for lib/**/*.ts"
   - "90%+ for financial calculations"
   - Measurable targets

---

## Alternative: Shorter Version

If you want a more concise prompt:

```bash
/speckit.specify Add TDD tests for categories, budgets, and dashboard business logic. Target: 80% coverage for lib/**/*.ts, 90%+ for financial calculations. Test CategoryStorageService, BudgetStorageService, calculations.ts, gamification.ts, aggregation.ts. Follow Constitution v3.1 TDD requirements. Out of scope: UI tests.
```

---

## What Happens Next

After `/speckit.specify`:

1. Claude creates `specs/XXX-short-name/` directory
2. Generates comprehensive `spec.md`
3. Creates quality checklist
4. You review and approve or clarify
5. Then run `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`

**Total Time:** ~5-10 minutes to generate full spec

---

## Tips for Success

1. **Use @ to reference files**
   - `@memory/constitution.md` - Ensures spec aligns
   - `@CLAUDE.md` - Claude knows project context

2. **Mention constitutional alignment**
   - "Per constitution v3.1..."
   - "Required by Phase 1 Definition of Done..."

3. **Be specific about test types**
   - "Unit tests for business logic"
   - "Not integration or E2E tests"

4. **Reference existing patterns**
   - "Follow existing test structure in features/archive/lib/__tests__/"
   - "Use Vitest as configured"

---

**Ready to use!** Copy the command from Step 1 and run it in Claude Code. 🚀
