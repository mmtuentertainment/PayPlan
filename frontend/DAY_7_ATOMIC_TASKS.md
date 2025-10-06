# Day 7: Performance Optimization - Atomic Tasks

**Goal**: Make extraction faster and more efficient
**Time**: 6 hours
**Validation**: Each task must have passing tests and measurable improvements

---

## Task 7.1: Benchmark Current Performance (45 min)

### Subtasks:
1. **Create performance test suite** (20 min)
   - File: `tests/performance/extraction-benchmark.test.ts`
   - Measure extraction time for small email (100 chars)
   - Measure extraction time for medium email (1KB)
   - Measure extraction time for large email (10KB)
   - Measure time for 10 rapid extractions

2. **Run baseline benchmarks** (10 min)
   - Record current performance numbers
   - Create: `PERFORMANCE_BASELINE.md`
   - Document: avg time, min/max, memory usage

3. **Create performance helper** (10 min)
   - File: `tests/helpers/performance.ts`
   - Function: `measureTime(fn: () => void): number`
   - Function: `runBenchmark(name, fn, iterations)`

4. **Validate** (5 min)
   - ✅ Run: `npx vitest run tests/performance/`
   - ✅ Baseline numbers documented
   - ✅ Commit: `perf(test): Add performance benchmarking suite`

**Exit Criteria**:
- [ ] Baseline performance documented
- [ ] Benchmark tests created
- [ ] Numbers recorded for comparison
- [ ] Committed to git

---

## Task 7.2: Profile and Identify Slow Regex Patterns (60 min)

### Subtasks:
1. **Add regex profiling** (20 min)
   - File: `src/lib/extraction/helpers/regex-profiler.ts`
   - Wrap regex.test() with timing
   - Log slow patterns (>10ms)
   - Create profiling report

2. **Run profiler on all patterns** (15 min)
   - Profile amount patterns
   - Profile date patterns
   - Profile provider detection
   - Document slow patterns

3. **Analyze results** (15 min)
   - Identify patterns taking >10ms
   - Find catastrophic backtracking risks
   - Document in: `REGEX_ANALYSIS.md`
   - List candidates for optimization

4. **Validate** (10 min)
   - ✅ Profiling data collected
   - ✅ Slow patterns identified
   - ✅ Analysis documented
   - ✅ Commit: `perf(analysis): Profile regex patterns and identify bottlenecks`

**Exit Criteria**:
- [ ] Profiling complete
- [ ] Slow patterns identified
- [ ] Analysis documented
- [ ] Committed to git

---

## Task 7.3: Optimize Slow Regex Patterns (90 min)

### Subtasks:
1. **Optimize date patterns** (30 min)
   - File: `src/lib/extraction/providers/patterns.ts`
   - Simplify complex date regex
   - Add early termination
   - Use non-capturing groups (?:...)
   - Avoid nested quantifiers

2. **Test optimized patterns** (20 min)
   - File: `tests/unit/date-detector.test.ts` (update)
   - Ensure all existing tests still pass
   - Add performance assertions
   - Verify accuracy maintained

3. **Optimize amount patterns** (20 min)
   - Simplify amount regex
   - Remove redundant patterns
   - Test against existing fixtures

4. **Benchmark improvements** (10 min)
   - Re-run performance tests
   - Compare to baseline
   - Document improvements (%)
   - Target: 20-30% faster

5. **Validate** (10 min)
   - ✅ Run: `npx vitest run`
   - ✅ All tests passing
   - ✅ Performance improved by 20%+
   - ✅ Commit: `perf(regex): Optimize date and amount patterns for 20%+ speedup`

**Exit Criteria**:
- [ ] Patterns optimized
- [ ] Tests still passing
- [ ] Measurable performance improvement
- [ ] Committed to git

---

## Task 7.4: Implement Extraction Result Caching (75 min)

### Subtasks:
1. **Create cache utility** (25 min)
   - File: `src/lib/extraction/helpers/cache.ts`
   - Implement LRU cache (size: 10)
   - Hash function for email text
   - get(), set(), clear() methods
   - Expiry after 5 minutes

2. **Write cache tests** (20 min)
   - File: `tests/unit/cache.test.ts`
   - Test: stores and retrieves results
   - Test: LRU eviction works
   - Test: hash collision handling
   - Test: expiry works correctly
   - Test: clear() empties cache

3. **Integrate cache into email-extractor** (15 min)
   - File: `src/lib/email-extractor.ts`
   - Check cache before extraction
   - Store results after extraction
   - Add option to bypass cache (force refresh)

4. **Add cache stats** (10 min)
   - Track cache hits/misses
   - Log cache performance
   - Add to extraction result metadata

5. **Validate** (5 min)
   - ✅ Run: `npx vitest run tests/unit/cache.test.ts`
   - ✅ Run full suite: `npx vitest run`
   - ✅ Manual test: Same email = instant result
   - ✅ Commit: `perf(cache): Add LRU caching for extraction results`

**Exit Criteria**:
- [ ] Cache implemented and tested
- [ ] Integrated into extractor
- [ ] Cache hits work correctly
- [ ] All tests passing
- [ ] Committed to git

---

## Task 7.5: Add React.memo to Expensive Components (60 min)

### Subtasks:
1. **Profile component re-renders** (15 min)
   - Install React DevTools Profiler
   - Record render times
   - Identify components that re-render frequently
   - Document in: `COMPONENT_PROFILE.md`

2. **Memoize EmailPreview component** (15 min)
   - File: `src/components/EmailPreview.tsx`
   - Wrap with React.memo()
   - Define custom comparison function
   - Only re-render when items change

3. **Memoize DateQuickFix component** (10 min)
   - File: `src/components/DateQuickFix.tsx`
   - Wrap with React.memo()
   - Prevent unnecessary re-renders

4. **Test memoization works** (10 min)
   - File: `tests/unit/email-preview.test.tsx` (update)
   - Test: doesn't re-render with same props
   - Test: re-renders with different props
   - Use @testing-library/react for render counting

5. **Validate** (10 min)
   - ✅ Run: `npx vitest run`
   - ✅ All tests passing
   - ✅ Profile shows fewer re-renders
   - ✅ Commit: `perf(react): Add React.memo to expensive components`

**Exit Criteria**:
- [ ] Components memoized
- [ ] Tests verify memoization
- [ ] Fewer re-renders measured
- [ ] Committed to git

---

## Task 7.6: Optimize useMemo for Heavy Computations (45 min)

### Subtasks:
1. **Identify heavy computations** (10 min)
   - Review useEmailExtractor hook
   - Find expensive calculations
   - Look for array filtering/mapping
   - Document candidates

2. **Add useMemo to filtered lists** (15 min)
   - File: `src/hooks/useEmailExtractor.ts`
   - Memoize filtered item lists
   - Memoize sorted arrays
   - Add dependency arrays correctly

3. **Add useCallback to handlers** (10 min)
   - Wrap applyRowFix with useCallback
   - Wrap revertLastFix with useCallback
   - Prevent function recreation

4. **Validate** (10 min)
   - ✅ Run: `npx vitest run`
   - ✅ All tests passing
   - ✅ Profile shows stable references
   - ✅ Commit: `perf(hooks): Add useMemo and useCallback for optimization`

**Exit Criteria**:
- [ ] Computations memoized
- [ ] Callbacks wrapped
- [ ] Tests passing
- [ ] Committed to git

---

## Task 7.7: Bundle Size Analysis (45 min)

### Subtasks:
1. **Analyze current bundle** (15 min)
   ```bash
   npm run build
   npx vite-bundle-visualizer
   ```
   - Document current bundle size
   - Identify large dependencies
   - Create: `BUNDLE_ANALYSIS.md`

2. **Remove unused dependencies** (15 min)
   - Check package.json
   - Remove any unused packages
   - Run: `npm prune`
   - Verify app still works

3. **Add code splitting** (10 min)
   - Use React.lazy() for heavy components
   - Add Suspense boundaries
   - Lazy load DateQuickFix if large

4. **Validate** (5 min)
   - ✅ Re-build and measure size
   - ✅ Compare before/after
   - ✅ Target: 10% smaller bundle
   - ✅ Commit: `perf(bundle): Optimize bundle size with code splitting`

**Exit Criteria**:
- [ ] Bundle analyzed
- [ ] Size reduced
- [ ] App still works
- [ ] Committed to git

---

## Day 7 Final Validation

### Before marking Day 7 complete, verify:

1. **Performance Improvements Measured**
   ```bash
   npx vitest run tests/performance/
   ```
   - ✅ Extraction 20-30% faster
   - ✅ Cache hits working
   - ✅ Fewer component re-renders

2. **All Tests Passing**
   ```bash
   npx vitest run
   ```
   - ✅ Expected: 345+ tests passing (added ~5 cache tests)
   - ✅ 0 failures
   - ✅ 17 skipped (security tests)

3. **TypeScript Compilation**
   ```bash
   npx tsc --noEmit
   ```
   - ✅ No errors

4. **Performance Comparison**
   - Create: `DAY_7_PERFORMANCE_REPORT.md`
   - Document: Before vs After numbers
   - Calculate: % improvement for each metric
   - Include: Cache hit rate statistics

5. **Manual Testing Checklist**
   - [ ] Extract same email twice → Second is instant (cached)
   - [ ] Click re-extract → Bypasses cache, extracts fresh
   - [ ] Large email (10KB) → Noticeably faster
   - [ ] Multiple rapid extractions → No lag
   - [ ] Components don't flicker/re-render unnecessarily

6. **Git Status**
   ```bash
   git log --oneline | head -7
   ```
   - ✅ Should see 7 new commits for Day 7

7. **Bundle Size Check**
   ```bash
   npm run build
   ls -lh dist/assets/*.js
   ```
   - ✅ Document final bundle size
   - ✅ Compare to Day 6

8. **Tag Release**
   ```bash
   git tag -a day-7-complete -m "Day 7: Performance optimization complete"
   ```

---

## Estimated Time Breakdown

- Task 7.1: Benchmark baseline - 45 min
- Task 7.2: Profile regex patterns - 60 min
- Task 7.3: Optimize regex - 90 min
- Task 7.4: Implement caching - 75 min
- Task 7.5: React.memo - 60 min
- Task 7.6: useMemo/useCallback - 45 min
- Task 7.7: Bundle size - 45 min
- Final validation - 30 min

**Total: 7.5 hours** (buffer built in)

---

## Performance Targets

| Metric | Baseline | Target | Stretch |
|--------|----------|--------|---------|
| Small email extraction | TBD | -20% | -30% |
| Large email extraction | TBD | -25% | -40% |
| Cache hit latency | N/A | <5ms | <1ms |
| Component re-renders | TBD | -30% | -50% |
| Bundle size | TBD | -10% | -20% |

---

## Rollback Plan

If any optimization breaks functionality:
1. Run full test suite immediately
2. If tests fail, git revert the commit
3. Analyze what broke
4. Fix and re-test
5. Document the issue
6. Try alternative optimization approach

---

## Success Criteria for Day 7

✅ 7 performance improvements implemented
✅ 5+ new performance tests
✅ 20-30% faster extraction
✅ Caching working (measurable hit rate)
✅ Bundle size reduced
✅ All tests passing (345+)
✅ TypeScript compiles cleanly
✅ Performance report documented
✅ 7 commits to git
