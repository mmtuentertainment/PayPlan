# Day 8: Code Quality & Refactoring - Atomic Tasks

**Goal**: Clean up code, reduce duplication, improve maintainability
**Time**: 6 hours
**Validation**: Each task must have passing tests AND verification before moving to next

**CRITICAL RULE**: Do NOT proceed to next task until:
1. All tests pass (run from `/frontend` directory)
2. TypeScript compiles with no errors
3. Actual verification completed (not assumed)
4. Changes committed to git

---

## Task 8.1: Identify and Refactor Long Functions (90 min)

### Subtasks:

#### 1. Analyze codebase for long functions (15 min)
**Action**: Find functions >50 lines
```bash
# Search for long functions
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn
grep -n "^export function\|^function\|^const.*= (" src/**/*.ts | head -20
```

**Deliverable**: Create `LONG_FUNCTIONS_ANALYSIS.md` listing:
- Function name
- File location
- Line count
- Complexity assessment (low/medium/high)
- Refactoring priority (1-5)

**Exit Criteria**:
- [ ] Analysis document created
- [ ] At least 3 long functions identified
- [ ] Priority order established

---

#### 2. Refactor highest priority long function (30 min)
**Target**: Based on analysis, likely `extractItemsFromEmails` or similar

**Actions**:
1. Read the function completely
2. Identify logical sections
3. Extract helper functions (e.g., `validateInput`, `parseEmailBlocks`, `handleExtractionErrors`)
4. Keep main function as orchestrator
5. Maintain exact same behavior

**Validation Steps**:
```bash
# Before refactoring
npm test 2>&1 | grep "Tests.*passing"

# After refactoring
npm test 2>&1 | grep "Tests.*passing"
# Numbers MUST match exactly
```

**Exit Criteria**:
- [ ] Function split into smaller helpers
- [ ] Main function < 50 lines
- [ ] All tests still passing (444 tests)
- [ ] TypeScript compiles: `npm run build`
- [ ] Committed: `refactor: Break down [function-name] into smaller helpers`

---

#### 3. Refactor second priority function (30 min)
**Repeat process for next function**

**Exit Criteria**:
- [ ] Function refactored
- [ ] All 444 tests passing
- [ ] TypeScript compiles
- [ ] Committed

---

#### 4. Validate refactoring (15 min)
**Run full validation**:
```bash
cd /home/matt/PROJECTS/PayPlan/frontend
npm test 2>&1 | tee test-results.txt
npm run build 2>&1 | tee build-results.txt
grep "Test Files.*passed" test-results.txt
grep "✓ built" build-results.txt
```

**Exit Criteria**:
- [ ] All 444 tests passing
- [ ] Build succeeds
- [ ] No new TypeScript errors
- [ ] Results saved to files

---

## Task 8.2: Remove Code Duplication (90 min)

### Subtasks:

#### 1. Find duplicated code (20 min)
**Action**: Search for repeated patterns

**Manual inspection targets**:
- Provider detection patterns (Klarna, Affirm, Afterpay, etc.)
- Test fixtures (check if same test data repeated)
- Date parsing logic
- Amount extraction patterns

**Tools**:
```bash
# Find similar function signatures
grep -rn "function.*provider" src/
grep -rn "const.*pattern.*=" src/lib/extraction/

# Check test duplication
find tests -name "*.test.ts*" -exec grep -l "Klarna" {} \;
```

**Deliverable**: Create `CODE_DUPLICATION_ANALYSIS.md` with:
- Duplicated code blocks (with file:line references)
- Common patterns identified
- Proposed shared utilities

**Exit Criteria**:
- [ ] Analysis document created
- [ ] At least 3 duplication instances found
- [ ] Consolidation plan documented

---

#### 2. Extract shared test fixtures (25 min)
**Target**: Consolidate repeated test data

**Actions**:
1. Create `tests/fixtures/common-emails.ts`
2. Move repeated email samples
3. Create `tests/fixtures/common-items.ts`
4. Move repeated item objects
5. Update tests to import fixtures

**Validation**:
```bash
# Before
npm test 2>&1 | grep "Tests.*passing"

# After extraction
npm test 2>&1 | grep "Tests.*passing"
# Must be identical
```

**Exit Criteria**:
- [ ] Fixture files created
- [ ] At least 3 test files updated
- [ ] All 444 tests still passing
- [ ] Committed: `refactor(test): Extract shared test fixtures`

---

#### 3. Consolidate provider patterns (25 min)
**Target**: Reduce duplication in provider-specific code

**Example**: If each provider has similar pattern structure, create shared builder:
```typescript
// Before: Repeated in each provider file
const klarnaPattern = /payment.*klarna/i;
const affirmPattern = /payment.*affirm/i;

// After: Shared utility
function createProviderPattern(name: string, variants: string[]) {
  return new RegExp(`payment.*(${variants.join('|')})`, 'i');
}
```

**Exit Criteria**:
- [ ] Shared utility created
- [ ] At least 2 provider files updated
- [ ] All tests passing
- [ ] Committed: `refactor: Consolidate provider pattern creation`

---

#### 4. DRY up remaining duplications (15 min)
**Target**: Address smaller duplications found in analysis

**Exit Criteria**:
- [ ] At least 1 more duplication removed
- [ ] All tests passing
- [ ] Committed

---

#### 5. Validate deduplication (5 min)
```bash
npm test 2>&1 | grep "Test Files.*passed"
npm run build
```

**Exit Criteria**:
- [ ] All 444 tests passing
- [ ] Build succeeds
- [ ] No new warnings

---

## Task 8.3: Add JSDoc Comments to Public APIs (90 min)

### Subtasks:

#### 1. Audit documentation coverage (15 min)
**Action**: Find undocumented public functions

```bash
# Find functions without JSDoc
grep -B1 "^export function" src/**/*.ts | grep -v "^\*\|^/\*\*"

# Priority targets:
# - src/lib/email-extractor.ts
# - src/lib/extraction/helpers/*.ts
# - src/hooks/*.ts
```

**Deliverable**: `JSDOC_COVERAGE.md` with:
- List of undocumented public functions
- Total count
- Priority order (by usage frequency)

**Exit Criteria**:
- [ ] Coverage analysis complete
- [ ] At least 10 functions identified
- [ ] Priority order set

---

#### 2. Document email-extractor public API (25 min)
**Target**: `src/lib/email-extractor.ts`

**Required JSDoc format**:
```typescript
/**
 * Extracts BNPL payment items from email text.
 *
 * Parses plain text or HTML emails to identify payment details including
 * provider, amount, due date, and installment information. Supports multiple
 * providers (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle).
 *
 * @param emailText - Raw email content (plain text or HTML)
 * @param timezone - IANA timezone for date parsing (e.g., "America/New_York")
 * @param options - Optional configuration for date locale, cache bypass, etc.
 * @returns Extraction result with items, issues, and metadata
 *
 * @example
 * ```typescript
 * const result = extractItemsFromEmails(
 *   "Your Klarna payment of $25.00 is due on 10/15/2025",
 *   "America/New_York"
 * );
 * console.log(result.items); // [{ provider: 'Klarna', amount: 2500, ... }]
 * ```
 *
 * @throws {Error} If input exceeds maximum length (16,000 characters)
 */
```

**Exit Criteria**:
- [ ] Main function documented
- [ ] All exported helpers documented
- [ ] Examples included
- [ ] TypeScript compiles
- [ ] Committed: `docs: Add JSDoc to email-extractor API`

---

#### 3. Document extraction helpers (20 min)
**Target**: `src/lib/extraction/helpers/*.ts`

**Functions to document**:
- `detectProvider()`
- `extractAmount()`
- `extractDate()`
- `sanitizeHtml()`
- `deduplicateItems()`
- Error message helpers

**Exit Criteria**:
- [ ] All helper functions documented
- [ ] @param and @returns included
- [ ] Committed: `docs: Add JSDoc to extraction helpers`

---

#### 4. Document hooks (15 min)
**Target**: `src/hooks/*.ts`

**Functions to document**:
- `useEmailExtractor()`
- All returned methods

**Exit Criteria**:
- [ ] Hook documented
- [ ] Usage examples included
- [ ] Committed: `docs: Add JSDoc to custom hooks`

---

#### 5. Document remaining high-priority functions (10 min)
**Target**: Any remaining public APIs from audit

**Exit Criteria**:
- [ ] At least 5 more functions documented
- [ ] Committed: `docs: Add JSDoc to utility functions`

---

#### 6. Validate documentation (5 min)
**Generate docs** (if using TypeDoc):
```bash
npx typedoc --entryPoints src/lib/email-extractor.ts --out docs-temp
# Check that docs generate without errors
rm -rf docs-temp
```

**Exit Criteria**:
- [ ] No TypeScript errors
- [ ] All tests still passing
- [ ] Documentation builds cleanly

---

## Task 8.4: Improve Code Readability (60 min)

### Subtasks:

#### 1. Rename unclear variables (20 min)
**Action**: Find and fix unclear names

**Targets**:
```bash
# Find single-letter variables (except loop counters)
grep -rn " [a-z]:" src/ | grep -v " i:\| j:\| k:"

# Find abbreviations
grep -rn "const.*[A-Z][a-z]*[A-Z]" src/
```

**Examples to fix**:
- `extractSingleEmail(emailText, timezone, options)` - parameter names OK?
- `const res = await buildPlan(body)` → `const response = ...`
- `const tz = ...` → `const timezone = ...` (unless widely used abbreviation)

**Exit Criteria**:
- [ ] At least 5 variables renamed
- [ ] All tests passing (444)
- [ ] Committed: `refactor: Improve variable naming clarity`

---

#### 2. Add explanatory comments for complex logic (20 min)
**Target**: Complex algorithms or business logic

**Example**:
```typescript
// Before:
if (score >= 0.8) {
  return { level: 'High', classes: 'bg-green-100' };
}

// After:
// Confidence scoring: ≥0.8 = High (all signals present)
// Provider (0.35) + Date (0.25) + Amount (0.20) + Installment (0.15) + Autopay (0.05)
if (score >= 0.8) {
  return { level: 'High', classes: 'bg-green-100 text-green-800' };
}
```

**Exit Criteria**:
- [ ] At least 10 complex sections commented
- [ ] Comments explain "why" not "what"
- [ ] Committed: `docs: Add explanatory comments to complex logic`

---

#### 3. Format code consistently (10 min)
**Action**: Run formatter and linter

```bash
# If prettier is installed:
npx prettier --write "src/**/*.{ts,tsx}"

# If eslint is installed:
npx eslint --fix "src/**/*.{ts,tsx}"
```

**Exit Criteria**:
- [ ] Code formatted consistently
- [ ] All tests passing
- [ ] Committed: `style: Format code consistently`

---

#### 4. Validate readability improvements (10 min)
```bash
npm test
npm run build
```

**Exit Criteria**:
- [ ] All 444 tests passing
- [ ] Build succeeds
- [ ] No new linter warnings

---

## Day 8 Final Validation

### Before marking Day 8 complete, verify ALL of the following:

#### 1. Test Suite Status
```bash
cd /home/matt/PROJECTS/PayPlan/frontend
npm test 2>&1 | tee day8-final-tests.txt
```

**Required Results**:
- [ ] **444 tests passing** (or more if added)
- [ ] **0 failures**
- [ ] **17 skipped** (security tests)
- [ ] Results saved to `day8-final-tests.txt`

---

#### 2. Build Status
```bash
npm run build 2>&1 | tee day8-final-build.txt
```

**Required Results**:
- [ ] **Build succeeds** (`✓ built in Xs`)
- [ ] **No TypeScript errors**
- [ ] **No new warnings** (bundle size warnings acceptable)
- [ ] Results saved to `day8-final-build.txt`

---

#### 3. Git Commit Count
```bash
git log --oneline | head -15
```

**Required Results**:
- [ ] **At least 8 new commits** for Day 8 tasks
- [ ] All commits have descriptive messages
- [ ] No "WIP" or "fix" commits without context

---

#### 4. Documentation Verification
```bash
# Count JSDoc blocks added
git diff $(git log --oneline | grep "day 7" | head -1 | cut -d' ' -f1)..HEAD | grep "^+.*\*\*/" | wc -l
```

**Required Results**:
- [ ] **At least 15 new JSDoc blocks** added
- [ ] All public APIs documented

---

#### 5. Code Metrics
```bash
# Count functions >50 lines
find src -name "*.ts" -type f -exec awk '/^(export )?function|^const.*= .*function/ {start=NR} /^}/ && start {if(NR-start>50) print FILENAME":"start"-"NR}' {} \;
```

**Required Results**:
- [ ] **Fewer long functions** than before Task 8.1
- [ ] At least 2 functions refactored

---

#### 6. Duplication Check
```bash
# Check for remaining duplications
grep -r "const.*Pattern.*=" src/lib/extraction/providers/ | wc -l
```

**Required Results**:
- [ ] **Less duplication** than before Task 8.2
- [ ] Shared utilities created

---

#### 7. Manual Code Review Checklist
- [ ] Open 3 random files in `src/lib/` - all have clear function names?
- [ ] Open `email-extractor.ts` - main function < 50 lines?
- [ ] Open test fixtures - shared data extracted?
- [ ] Check JSDoc in editor - examples render correctly?

---

## Success Criteria for Day 8

✅ All tests passing (444+)
✅ TypeScript compiles cleanly
✅ At least 8 commits made
✅ At least 2 long functions refactored (< 50 lines each)
✅ At least 3 code duplications removed
✅ At least 15 public functions documented with JSDoc
✅ Code readability improved
✅ No regressions introduced
✅ All validations completed and results saved

---

## Rollback Plan

If any task validation fails:
1. **STOP** - Do not proceed to next task
2. **Document** the failure in task notes
3. **Fix** the issue:
   - Review test output carefully
   - Check TypeScript errors
   - Verify no unintended changes
4. **Re-validate** before proceeding
5. **If stuck >30 min**:
   - Git revert to last working state
   - Create issue documenting blocker
   - Move to next independent task if possible

---

## Estimated Time Breakdown

- Task 8.1: Refactor long functions - 90 min
- Task 8.2: Remove code duplication - 90 min
- Task 8.3: Add JSDoc comments - 90 min
- Task 8.4: Improve readability - 60 min
- Final validation - 30 min

**Total: 6 hours**

---

## Notes for Execution

1. **Always run tests from `/frontend` directory** to avoid path alias issues
2. **Save validation outputs** to files for proof
3. **Never assume tests pass** - always verify
4. **Commit after each subtask** for easy rollback
5. **Document any deviations** from plan in commit messages
6. **Take breaks** between tasks to maintain focus
