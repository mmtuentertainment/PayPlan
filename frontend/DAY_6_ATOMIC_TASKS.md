# Day 6: Error Handling & User Feedback - Atomic Tasks

**Goal**: Improve error handling and user experience
**Time**: 6 hours
**Validation**: Each task must have passing tests before moving to next

---

## Task 6.1: Create React ErrorBoundary Component (45 min)

### Subtasks:
1. **Create ErrorBoundary component** (15 min)
   - File: `src/components/ErrorBoundary.tsx`
   - Implement componentDidCatch lifecycle
   - Create fallback UI with error message
   - Add "Try Again" button

2. **Write ErrorBoundary tests** (20 min)
   - File: `tests/unit/error-boundary.test.tsx`
   - Test: catches errors from child components
   - Test: displays fallback UI
   - Test: "Try Again" button resets error state
   - Test: logs error to console

3. **Validate** (10 min)
   - ✅ Run: `npx vitest run tests/unit/error-boundary.test.tsx`
   - ✅ All tests must pass
   - ✅ TypeScript compiles: `npx tsc --noEmit`
   - ✅ Commit: `feat(error): Add ErrorBoundary component with tests`

**Exit Criteria**:
- [ ] Component created and tested
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Committed to git

---

## Task 6.2: Add ErrorBoundary to Main App (30 min)

### Subtasks:
1. **Wrap App with ErrorBoundary** (10 min)
   - File: `src/App.tsx` or `src/main.tsx`
   - Import ErrorBoundary
   - Wrap main content
   - Add custom error message

2. **Create manual error test component** (10 min)
   - File: `src/components/ErrorTest.tsx` (dev only)
   - Button that throws error
   - Use for manual testing

3. **Validate** (10 min)
   - ✅ Manual test: Click error button, see fallback
   - ✅ Manual test: Click "Try Again", app recovers
   - ✅ Run full test suite: `npx vitest run`
   - ✅ All existing tests still pass
   - ✅ Commit: `feat(error): Wrap app with ErrorBoundary`

**Exit Criteria**:
- [ ] ErrorBoundary integrated
- [ ] Manual testing successful
- [ ] All tests still passing
- [ ] Committed to git

---

## Task 6.3: Improve Extraction Error Messages (60 min)

### Subtasks:
1. **Create user-friendly error messages helper** (20 min)
   - File: `src/lib/extraction/helpers/error-messages.ts`
   - Function: `getUserFriendlyError(error: Error): string`
   - Map technical errors to user-friendly messages
   - Example: "Amount not found" → "No payment amount found. Try pasting the full email including the amount."

2. **Write error message tests** (20 min)
   - File: `tests/unit/error-messages.test.ts`
   - Test: maps "Amount not found" correctly
   - Test: maps "Provider not found" correctly
   - Test: maps "Date not found" correctly
   - Test: handles unknown errors gracefully

3. **Update email-extractor to use friendly errors** (10 min)
   - File: `src/lib/email-extractor.ts`
   - Import getUserFriendlyError
   - Wrap extraction errors
   - Return friendly messages in issues array

4. **Validate** (10 min)
   - ✅ Run: `npx vitest run tests/unit/error-messages.test.ts`
   - ✅ Run full suite: `npx vitest run`
   - ✅ All tests passing
   - ✅ Commit: `feat(error): Add user-friendly error messages`

**Exit Criteria**:
- [ ] Error messages helper created and tested
- [ ] Integration complete
- [ ] All tests passing
- [ ] Committed to git

---

## Task 6.4: Add Error Display to UI (45 min)

### Subtasks:
1. **Create ErrorAlert component** (15 min)
   - File: `src/components/ErrorAlert.tsx`
   - Display error message with icon
   - Dismissable (X button)
   - Auto-dismiss after 5 seconds
   - Use Tailwind for styling

2. **Write ErrorAlert tests** (15 min)
   - File: `tests/unit/error-alert.test.tsx`
   - Test: displays error message
   - Test: dismisses on X click
   - Test: auto-dismisses after 5s
   - Test: handles multiple errors

3. **Integrate ErrorAlert into EmailPreview** (10 min)
   - File: `src/components/EmailPreview.tsx`
   - Show ErrorAlert when issues exist
   - Display user-friendly messages

4. **Validate** (5 min)
   - ✅ Run: `npx vitest run tests/unit/error-alert.test.tsx`
   - ✅ Run full suite: `npx vitest run`
   - ✅ Manual test: Paste bad email, see friendly error
   - ✅ Commit: `feat(error): Add ErrorAlert component to display extraction errors`

**Exit Criteria**:
- [ ] ErrorAlert component created and tested
- [ ] Integrated into UI
- [ ] Manual testing successful
- [ ] All tests passing
- [ ] Committed to git

---

## Task 6.5: Add Loading State (45 min)

### Subtasks:
1. **Create LoadingSpinner component** (15 min)
   - File: `src/components/LoadingSpinner.tsx`
   - Simple CSS spinner
   - Optional text prop
   - Accessible (role="status", aria-label)

2. **Write LoadingSpinner tests** (10 min)
   - File: `tests/unit/loading-spinner.test.tsx`
   - Test: renders spinner
   - Test: displays custom text
   - Test: has correct ARIA attributes

3. **Add loading state to useEmailExtractor** (10 min)
   - File: `src/hooks/useEmailExtractor.ts`
   - Add `isLoading` state
   - Set true during extraction
   - Set false when complete/error

4. **Integrate loading UI** (5 min)
   - File: `src/components/EmailPreview.tsx`
   - Show LoadingSpinner when isLoading
   - Disable extract button during loading

5. **Validate** (5 min)
   - ✅ Run: `npx vitest run tests/unit/loading-spinner.test.tsx`
   - ✅ Run full suite: `npx vitest run`
   - ✅ Manual test: See spinner during extraction
   - ✅ Commit: `feat(ux): Add loading state with spinner`

**Exit Criteria**:
- [ ] LoadingSpinner created and tested
- [ ] Loading state implemented in hook
- [ ] UI shows loading state
- [ ] All tests passing
- [ ] Committed to git

---

## Task 6.6: Add Success Feedback (45 min)

### Subtasks:
1. **Create SuccessToast component** (15 min)
   - File: `src/components/SuccessToast.tsx`
   - Green toast notification
   - Auto-dismiss after 3 seconds
   - Slide-in animation
   - Accessible

2. **Write SuccessToast tests** (10 min)
   - File: `tests/unit/success-toast.test.tsx`
   - Test: renders success message
   - Test: auto-dismisses after 3s
   - Test: has correct ARIA role

3. **Add success state to useEmailExtractor** (10 min)
   - File: `src/hooks/useEmailExtractor.ts`
   - Track successful extractions
   - Return success message (e.g., "Found 3 payments")

4. **Integrate SuccessToast** (5 min)
   - File: `src/components/EmailPreview.tsx`
   - Show toast on successful extraction
   - Display count of items found

5. **Validate** (5 min)
   - ✅ Run: `npx vitest run tests/unit/success-toast.test.tsx`
   - ✅ Run full suite: `npx vitest run`
   - ✅ Manual test: Extract email, see success toast
   - ✅ Commit: `feat(ux): Add success toast feedback`

**Exit Criteria**:
- [ ] SuccessToast created and tested
- [ ] Success state implemented
- [ ] UI shows success feedback
- [ ] All tests passing
- [ ] Committed to git

---

## Task 6.7: Add Button Disable During Processing (30 min)

### Subtasks:
1. **Update button states in EmailPreview** (15 min)
   - File: `src/components/EmailPreview.tsx`
   - Disable "Extract" button when isLoading
   - Disable "Re-extract" button when isLoading
   - Add visual disabled state (opacity, cursor)

2. **Write button state tests** (10 min)
   - File: `tests/unit/email-preview.test.tsx` (update existing)
   - Test: Extract button disabled during loading
   - Test: Re-extract button disabled during loading
   - Test: Buttons enabled after completion

3. **Validate** (5 min)
   - ✅ Run: `npx vitest run tests/unit/email-preview.test.tsx`
   - ✅ Run full suite: `npx vitest run`
   - ✅ Manual test: Buttons disabled during extraction
   - ✅ Commit: `feat(ux): Disable buttons during extraction`

**Exit Criteria**:
- [ ] Buttons disabled appropriately
- [ ] Tests updated and passing
- [ ] Manual testing successful
- [ ] Committed to git

---

## Day 6 Final Validation

### Before marking Day 6 complete, verify:

1. **All Tests Passing**
   ```bash
   npx vitest run
   ```
   - ✅ Expected: 340+ tests passing (added ~10 new tests)
   - ✅ 0 failures
   - ✅ 17 skipped (security tests)

2. **TypeScript Compilation**
   ```bash
   npx tsc --noEmit
   ```
   - ✅ No errors

3. **Manual Testing Checklist**
   - [ ] Paste valid email → See loading spinner → Success toast → Items displayed
   - [ ] Paste invalid email → See error message with helpful guidance
   - [ ] Trigger component error → See ErrorBoundary fallback → Click "Try Again" → Recovers
   - [ ] Click extract during loading → Button disabled
   - [ ] Error message auto-dismisses after 5s
   - [ ] Success toast auto-dismisses after 3s

4. **Git Status**
   ```bash
   git log --oneline | head -7
   ```
   - ✅ Should see 7 new commits for Day 6

5. **Create Day 6 Summary**
   - File: `DAY_6_SUMMARY.md`
   - Document what was accomplished
   - List all new components
   - Screenshot of UI improvements
   - Note any blockers or issues

6. **Tag Release**
   ```bash
   git tag -a day-6-complete -m "Day 6: Error handling & user feedback complete"
   ```

---

## Estimated Time Breakdown

- Task 6.1: ErrorBoundary component - 45 min
- Task 6.2: Integrate ErrorBoundary - 30 min
- Task 6.3: User-friendly error messages - 60 min
- Task 6.4: Error display UI - 45 min
- Task 6.5: Loading state - 45 min
- Task 6.6: Success feedback - 45 min
- Task 6.7: Button disable - 30 min
- Final validation - 30 min

**Total: 6 hours**

---

## Rollback Plan

If any task fails validation:
1. Don't proceed to next task
2. Fix the failing tests
3. If stuck >30 min, create GitHub issue
4. Mark task as blocked in TODO
5. Move to next independent task if possible
6. Circle back when unblocked

---

## Success Criteria for Day 6

✅ 7 new components/features added
✅ 10+ new tests written
✅ All tests passing (340+)
✅ TypeScript compiles cleanly
✅ Manual testing successful
✅ 7 commits to git
✅ User experience significantly improved
✅ Error handling robust and user-friendly
