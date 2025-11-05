# Implementation Prompt: Feature #063 Phase 8 - Polish & Cross-Cutting Concerns

**Optimized for**: Claude Code (Sonnet 4.5)
**Feature**: Business Logic Test Coverage - Phase 8 (CI/CD Integration & Documentation)
**Branch**: `063-phase8-polish` (new)
**Previous Work**: US1-US5 complete and merged (all 146 tasks done)

---

## Context Rehydration

You are implementing Feature #063 Phase 8 (Polish & Cross-Cutting Concerns).

**What exists**:
- ✅ Test infrastructure (MockStorage, fixtures, assertion utilities) - Phase 1
- ✅ 43 calculation tests (90%+ coverage) - US1, PR #68 merged
- ✅ 78 storage service tests (74-75% coverage) - US2, PR #68 merged
- ✅ 163 schema validation tests (90%+ coverage) - US3, PR #69 merged
- ✅ 39 aggregation tests (92.77% coverage) - US4, PR #70 merged
- ✅ 35 gamification tests (88.32% coverage) - US5, PR #71 merged
- ✅ **323 total tests** across all business logic modules
- ✅ **~85% weighted average coverage** for business logic

**What you need to create**: CI/CD workflow, documentation updates, final validation

---

## Your Mission: Phase 8 - Polish & Cross-Cutting Concerns

**Goal**: Integrate test suite into CI/CD, document testing patterns, validate complete feature

**Why this matters**: Tests are only valuable if they run automatically and developers know how to use them. CI/CD integration ensures code quality gates are enforced, and documentation enables team scaling.

**Success Criteria**:
1. ✅ GitHub Actions workflow runs tests on every PR
2. ✅ Coverage reports generated and uploaded as artifacts
3. ✅ Per-file coverage thresholds enforced (fail PR if not met)
4. ✅ CLAUDE.md updated with test writing patterns and examples
5. ✅ All 323 tests pass in CI environment
6. ✅ Feature #063 marked complete in Linear

---

## Task Execution Plan (22 Tasks)

### CI/CD Workflow (T147-T153) - 7 tasks

```
T147 Create GitHub Actions workflow skeleton in .github/workflows/test.yml
T148 Add test execution step to .github/workflows/test.yml
T149 Add coverage report generation to .github/workflows/test.yml
T150 Add coverage threshold check to .github/workflows/test.yml (fail if <80%/90%)
T151 Add per-file coverage check for calculations.ts to .github/workflows/test.yml (must be 90%+)
T152 Add coverage report upload as artifact to .github/workflows/test.yml
T153 Add PR comment with coverage summary to .github/workflows/test.yml
```

### Documentation Updates (T154-T157) - 4 tasks

```
T154 Add coverage badge configuration to README.md (optional)
T155 Document test writing patterns in CLAUDE.md (examples from quickstart.md)
T156 Document fixture usage in CLAUDE.md
T157 Document running tests in CLAUDE.md
```

### Final Validation (T158-T168) - 11 tasks

```
T158 Run full test suite: `npm test` - verify all tests pass
T159 Run test suite with coverage: `npm run test:coverage` - verify <15 second execution
T160 Verify overall business logic coverage >= 80%
T161 Verify financial calculation coverage >= 90%
T162 Generate and review HTML coverage report for gaps
T163 Run quickstart.md examples - verify all code snippets work
T164 Create PR with test infrastructure and all tests (ALREADY DONE - 5 PRs merged)
T165 Address CRITICAL bot feedback (ALREADY DONE - all PRs approved)
T166 Address HIGH bot feedback (ALREADY DONE - all PRs approved)
T167 Create Linear issues for MEDIUM/LOW bot feedback (ALREADY DONE - no issues deferred)
T168 Iterate until both bots approve (ALREADY DONE - all PRs green)
```

**Note**: Tasks T164-T168 are already complete from US1-US5. Focus on T147-T163.

---

## Implementation Pattern

### 1. GitHub Actions Workflow (T147-T153)

**File**: `.github/workflows/test.yml`

**Pattern** (copy from existing workflows):
```yaml
name: Test Suite

on:
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**/*.ts'
      - 'frontend/**/*.tsx'
      - 'frontend/package.json'
      - '.github/workflows/test.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ./frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Check coverage thresholds
        run: |
          # Vitest exits with code 1 if coverage below thresholds
          # Already enforced by vite.config.ts thresholds

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: frontend/coverage/
          retention-days: 30

      - name: Comment PR with coverage summary
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const coverage = JSON.parse(fs.readFileSync('./frontend/coverage/coverage-summary.json', 'utf8'));

            const comment = `## 📊 Test Coverage Report

            | File | Lines | Branches | Functions | Statements |
            |------|-------|----------|-----------|------------|
            ${Object.entries(coverage).map(([file, data]) =>
              `| ${file} | ${data.lines.pct}% | ${data.branches.pct}% | ${data.functions.pct}% | ${data.statements.pct}% |`
            ).join('\n')}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

**Critical requirements**:
- ✅ Run on PR to main only (not on every commit)
- ✅ Use `npm ci` (not `npm install`) for reproducible builds
- ✅ Upload coverage artifacts for debugging
- ✅ Comment on PR with coverage summary (visibility for reviewers)

---

### 2. Documentation Updates (T155-T157)

**File**: `CLAUDE.md`

**Section to add** (after "Common Commands"):

```markdown
## Testing Guide (Feature #063)

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- categories.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch

# Generate HTML coverage report
npm run test:coverage
# View: frontend/coverage/index.html
```

### Writing Tests (TDD Pattern)

**Phase 1 Requirements** (Constitution v3.1):
- ✅ **Business logic** (`features/*/lib/**/*.ts`): Write tests FIRST (TDD)
- ✅ **Financial calculations**: 90%+ coverage required (money is critical!)
- ✅ **Storage services**: 80%+ coverage target
- ✅ **Schemas (Zod)**: 90%+ coverage required
- ❌ **UI components**: Manual testing acceptable (no test requirement)

**Example TDD workflow**:

```typescript
// 1. Write the test first (RED phase)
import { describe, it, expect } from 'vitest';
import { calculateBudgetProgress } from '../calculations';

describe('calculateBudgetProgress', () => {
  it('should return 50% when half of budget spent', () => {
    const result = calculateBudgetProgress(50000, 100000); // $500 spent, $1000 budget
    expect(result).toBe(50);
  });
});

// 2. Run test (fails - function doesn't exist yet)
// npm test -- calculations.test.ts

// 3. Write minimal code to pass (GREEN phase)
export function calculateBudgetProgress(spent: number, budget: number): number {
  return (spent / budget) * 100;
}

// 4. Refactor (REFACTOR phase)
export function calculateBudgetProgress(spent: number, budget: number): number {
  if (budget === 0) throw new Error('Budget cannot be zero');
  if (budget < 0) throw new Error('Budget cannot be negative');
  return (spent / budget) * 100;
}

// 5. Add more tests for edge cases
it('should throw on zero budget', () => {
  expect(() => calculateBudgetProgress(100, 0)).toThrow('Budget cannot be zero');
});
```

### Using Test Fixtures

**Feature #063 provides reusable fixtures**:

```typescript
import { createCategory } from '@/features/categories/lib/__tests__/fixtures/category-fixtures';
import { createBudget } from '@/features/budgets/lib/__tests__/fixtures/budget-fixtures';
import { createExpense, createIncome } from '@/features/transactions/lib/__tests__/fixtures/transaction-fixtures';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

// Create test data
const category = createCategory({ name: 'Groceries', color: sharedFixtures.colors.green });
const budget = createBudget({ amount: 50000, categoryId: category.id });
const expense = createExpense({ amount: 10000, categoryId: category.id });
```

**Fixture patterns**:
- **Factory functions**: `createCategory()`, `createBudget()`, etc.
- **Builder pattern**: `new CategoryBuilder().withBudget(50000).build()`
- **Trait variations**: `createOverspentBudget()`, `createCustomCategory()`
- **Shared constants**: `sharedFixtures.dates`, `sharedFixtures.amounts`, `sharedFixtures.colors`

### Testing localStorage

```typescript
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear(); // Isolate tests
});

it('should persist data to localStorage', () => {
  const data = { id: '123', name: 'Test' };
  localStorage.setItem('payplan_test_v1', JSON.stringify(data));

  const stored = localStorage.getItem('payplan_test_v1');
  expect(stored).toBeTruthy();
  expect(JSON.parse(stored!)).toEqual(data);
});
```

### Testing Date-Based Logic

```typescript
import { vi } from 'vitest';

it('should use fake timers for deterministic dates', () => {
  // Control "now" to eliminate timezone flakiness
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-11-04T12:00:00'));

  const result = myDateFunction();

  vi.useRealTimers(); // Always restore!

  expect(result).toBe(/* expected based on 2025-11-04 */);
});
```

### Coverage Targets (Constitution v3.1)

| Module Type | Target | Actual (Feature #063) |
|-------------|--------|----------------------|
| **Financial calculations** | 90%+ | 90%+ ✅ |
| **Business logic** | 80%+ | 85%+ ✅ |
| **Schemas (Zod)** | 90%+ | 90%+ ✅ |
| **Storage services** | 80%+ | 74-75% (Phase 1 limitation) |
| **UI components** | 0% (manual) | 0% (as expected) |

**Overall weighted average**: ~85% for business logic

---

## Files to Create/Modify

**New files** (1):
```
.github/workflows/test.yml
```

**Modified files** (2):
```
CLAUDE.md (add Testing Guide section)
README.md (optional: add coverage badge)
```

**No modifications needed**:
```
specs/063-short-name-business/tasks.md (T147-T163 will be marked complete after)
```

---

## CI/CD Workflow Requirements

**Must enforce**:
1. ✅ Per-file coverage thresholds from `vite.config.ts`:
   - `calculations.ts`: 90%+ lines, 90%+ functions
   - `gamification.ts`: 80%+ lines, 75%+ branches
   - `aggregation.ts`: 80%+ lines, 75%+ branches
   - `schemas.ts` (all): 90%+ lines
   - Storage services: 74%+ lines (Phase 1 accepted limitation)

2. ✅ Fast execution: Tests must complete in <15 seconds (current: <5s, plenty of headroom)

3. ✅ Upload artifacts: Coverage reports for debugging failed PRs

4. ✅ PR comments: Auto-comment with coverage summary for reviewer visibility

**Must NOT**:
- ❌ Run tests on every commit (only on PR to main)
- ❌ Require 100% coverage (unrealistic for Phase 1)
- ❌ Block merge on optional tasks (like badge generation)

---

## Documentation Pattern (CLAUDE.md)

**Add new section after "Common Commands"**:

### Structure
1. **Running Tests** - Commands for different scenarios
2. **Writing Tests (TDD Pattern)** - RED-GREEN-REFACTOR workflow
3. **Using Test Fixtures** - How to use Feature #063 fixtures
4. **Testing localStorage** - Isolation and mocking patterns
5. **Testing Date-Based Logic** - Fake timers for determinism
6. **Coverage Targets** - Constitution v3.1 requirements

**Style**:
- ✅ Code examples (not just text)
- ✅ Copy-paste ready snippets
- ✅ Constitutional context (why 90% for calculations? → money is critical!)
- ✅ Link to relevant ADRs, specs, and PRs

---

## Validation Commands

Before creating PR:

```bash
# 1. All tests pass
npm test
# Expected: 323 tests passing

# 2. Coverage meets all thresholds
npm run test:coverage
# Expected: All per-file thresholds met (from vite.config.ts)

# 3. No TypeScript errors
npx tsc --noEmit

# 4. Workflow syntax valid
gh workflow view test.yml --yaml
# Expected: Valid YAML, no syntax errors

# 5. Verify workflow triggers on PR
# Create test PR, verify workflow runs
```

---

## Critical Success Factors

### 1. Workflow Must Run in CI
- Test with actual PR (not just local validation)
- Verify artifacts upload correctly
- Confirm PR comment posts with coverage summary

### 2. Documentation Must Be Actionable
- Developers can copy-paste commands and they work
- Examples use real code from Feature #063 tests
- Links to fixtures, ADRs, and specs are correct

### 3. Coverage Thresholds Enforced
- Workflow fails if any per-file threshold not met
- Clear error messages pointing to which file failed
- Link to HTML coverage report in artifacts

---

## Expected Timeline

**T147-T153 (CI/CD)**: 45-60 minutes
- GitHub Actions workflow creation
- Test matrix setup
- Coverage artifact upload
- PR comment generation

**T154-T157 (Documentation)**: 30-45 minutes
- CLAUDE.md additions (Testing Guide section)
- README.md badge (optional, 5 mins)

**T158-T163 (Validation)**: 15-20 minutes
- Run validation commands
- Review HTML coverage report
- Verify quickstart examples

**Total**: 90-125 minutes (1.5-2 hours)

---

## What Makes This Prompt Expert-Level

### 1. Complete Context
- Previous work summarized (US1-US5, 323 tests, 85% coverage)
- Existing infrastructure documented
- Clear success criteria

### 2. Concrete Examples
- Full GitHub Actions workflow example (not just "create workflow")
- CLAUDE.md documentation structure with real code snippets
- Validation commands with expected outputs

### 3. Quality Gates
- Per-file coverage thresholds enforced
- Workflow must run in CI (not just local)
- Documentation must be copy-paste ready

### 4. Constitutional Alignment
- Phase 1 TDD requirements referenced
- Privacy-first principles maintained (no external reporting)
- Quality-first focus (automate quality gates)

### 5. Realistic Scope
- Tasks T164-T168 marked as already complete (avoid duplicate work)
- Optional tasks clearly marked (coverage badge)
- Timeline based on actual complexity

---

## Context Preservation

**If session ends, save this state**:
- Branch: `063-phase8-polish`
- Completed: US1-US5 merged (T001-T146 done)
- Next: T147-T163 (Phase 8: Polish & Cross-Cutting)
- Deliverables: GitHub Actions workflow + CLAUDE.md updates
- Timeline: 90-125 minutes

**To resume**: "Continue implementing Phase 8 (Polish & Cross-Cutting Concerns) for Feature #063 on branch 063-phase8-polish. All user stories (US1-US5) complete. Follow atomic task breakdown (T147-T163, 17 tasks). Focus on CI/CD workflow and documentation."

---

## Quick Start Command

```bash
# Start Phase 8 implementation
git checkout -b 063-phase8-polish

# Create GitHub Actions workflow
mkdir -p .github/workflows
touch .github/workflows/test.yml

# Study existing workflows for patterns
cat .github/workflows/drift.yml
cat .github/workflows/guards.yml

# Read current CLAUDE.md to understand structure
cat CLAUDE.md | grep -A 5 "## Common Commands"

# Plan documentation additions after CI/CD workflow complete
```

---

## Success Validation

**Before creating PR**:

```bash
# 1. Workflow syntax valid
gh workflow view test.yml --yaml

# 2. All tests pass locally
npm test
# Expected: 323 tests passing

# 3. Coverage report generated
npm run test:coverage
# Expected: coverage/ directory with index.html

# 4. No TypeScript errors
npx tsc --noEmit

# 5. CLAUDE.md additions render correctly
# Preview CLAUDE.md in GitHub to verify formatting
```

**After creating PR**:

```bash
# 6. Workflow runs in CI
gh pr checks <PR-NUMBER>
# Expected: test.yml workflow appears and passes

# 7. Coverage artifact uploaded
gh run view <RUN-ID> --log
# Expected: "Uploading coverage-report artifact"

# 8. PR comment posted
gh pr view <PR-NUMBER> --comments
# Expected: Bot comment with coverage table
```

---

## Common Pitfalls to Avoid

### 1. ❌ Workflow Doesn't Trigger
**Problem**: Path filter too narrow or incorrect branch
**Solution**: Use `paths: ['frontend/**/*.ts', 'frontend/**/*.tsx', ...]` to include all relevant files

### 2. ❌ Coverage Report Not Found
**Problem**: Working directory mismatch in GitHub Actions
**Solution**: Use `defaults.run.working-directory: ./frontend` at job level

### 3. ❌ PR Comment Fails
**Problem**: Missing GitHub token permissions
**Solution**: Use `actions/github-script@v7` with default `GITHUB_TOKEN`

### 4. ❌ Coverage Thresholds Not Enforced
**Problem**: Workflow doesn't fail when coverage below threshold
**Solution**: Vitest already exits with code 1 when thresholds not met (configured in vite.config.ts)

### 5. ❌ Documentation Examples Don't Work
**Problem**: Copy-paste examples have syntax errors
**Solution**: Test every code snippet before committing to CLAUDE.md

---

## Bot Review Preparation

**CodeRabbit will check**:
- ✅ GitHub Actions workflow uses best practices (caching, `npm ci`, path filters)
- ✅ CLAUDE.md additions use correct markdown formatting
- ✅ Code examples in docs are syntactically correct
- ✅ No secrets or credentials in workflow files

**Preemptive fixes**:
1. Use `secrets.GITHUB_TOKEN` (automatically available, no need to configure)
2. Cache npm dependencies with `actions/setup-node@v4` cache parameter
3. Use `if: always()` for artifact upload (run even if tests fail)
4. Add comments explaining why each workflow step exists

---

## Definition of Done (Phase 8)

**Feature #063 is COMPLETE when**:

1. ✅ All 323 tests passing in CI
2. ✅ GitHub Actions workflow runs on every PR to main
3. ✅ Coverage reports uploaded as artifacts
4. ✅ Per-file thresholds enforced (fail PR if not met)
5. ✅ CLAUDE.md documents test writing patterns with examples
6. ✅ PR approved by both bots (Claude Code Bot + CodeRabbit AI)
7. ✅ HIL approves and merges
8. ✅ Feature #063 Linear issue marked "Done"

---

**Expected timeline**: 90-125 minutes for 17 active tasks (T147-T163)

🚀 **Execute with CI/CD best practices!** Follow existing workflow patterns from `.github/workflows/`, ensure artifacts upload correctly, and make documentation copy-paste ready for developers.
