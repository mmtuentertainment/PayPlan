# Long Functions Analysis - Day 8 Task 8.1

**Date**: 2025-10-06
**Analysis Method**: AWK pattern matching for functions >40 lines

## Long Functions Found

### 1. useEmailExtractor (HIGHEST PRIORITY)
- **File**: `src/hooks/useEmailExtractor.ts`
- **Lines**: 31-193 (162 lines)
- **Complexity**: HIGH
- **Priority**: 1 (HIGHEST)
- **Reason**: Custom hook doing too much - state management, extraction logic, error handling, undo/redo

**Refactoring Strategy**:
- Extract `sanitizeError` into separate utility
- Extract extraction logic into separate function
- Extract undo/redo management into separate hook
- Keep main hook as state coordinator

**Estimated Impact**: High - widely used hook

---

### 2. extractSingleEmail (HIGH PRIORITY)
- **File**: `src/lib/email-extractor.ts`
- **Lines**: 158-247 (89 lines)
- **Complexity**: HIGH
- **Priority**: 2
- **Reason**: Sequential extraction logic - provider → date → amount → installment → fees

**Refactoring Strategy**:
- Extract into pipeline pattern
- Create `extractProvider()` helper
- Create `extractPaymentDetails()` helper
- Create `calculateConfidence()` helper (already exists, just call it)
- Keep orchestration in main function

**Estimated Impact**: Medium - core extraction function

---

### 3. extractItemsFromEmails (MEDIUM PRIORITY)
- **File**: `src/lib/email-extractor.ts`
- **Lines**: 81-156 (75 lines)
- **Complexity**: MEDIUM
- **Priority**: 3
- **Reason**: Main entry point - validation, splitting, deduplication, caching

**Refactoring Strategy**:
- Extract `validateExtractionInput()` helper
- Extract `processEmailBlocks()` helper
- Keep caching and orchestration in main function

**Estimated Impact**: Low - already fairly clean structure

---

### 4. validateEmailDomain
- **File**: `src/lib/extraction/helpers/domain-validator.ts`
- **Lines**: 323-373 (50 lines)
- **Complexity**: MEDIUM
- **Priority**: 4
- **Reason**: Exactly 50 lines - borderline case, validation logic

**Refactoring Strategy**:
- Low priority - already at threshold
- Consider extracting sub-validations if needed later

**Estimated Impact**: Very Low

---

## Component Analysis (Not Counted as Long Functions)

Components are naturally longer due to JSX/rendering logic - these are acceptable:
- `InputCard.tsx` - Complex form with multiple states
- `EmailPreview.tsx` - Table rendering with data
- `DateQuickFix.tsx` - Interactive UI component

**Note**: Component refactoring would require splitting into sub-components, which is Day 9 scope.

---

## Refactoring Priority Order

1. **useEmailExtractor** (162 lines) - Extract helpers and sub-hooks
2. **extractSingleEmail** (89 lines) - Extract pipeline steps
3. **extractItemsFromEmails** (75 lines) - Extract validation helpers

---

## Success Criteria

After refactoring Tasks 8.1.2 and 8.1.3:
- [ ] useEmailExtractor < 80 lines (50% reduction)
- [ ] extractSingleEmail < 50 lines (44% reduction)
- [ ] All 444 tests still passing
- [ ] No functional changes
- [ ] Clear helper function names

---

## Test Coverage Verification

Before refactoring, verify test coverage:
```bash
# Email extractor tests
npx vitest run tests/unit/email-extractor.test.ts tests/integration/

# Hook tests
npx vitest run tests/unit/use-email-extractor.test.ts

# Current count: 444 tests passing
```

All refactored code must maintain exact same behavior verified by passing tests.
