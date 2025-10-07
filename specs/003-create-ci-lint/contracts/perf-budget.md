# Contract: Performance Budget Guard

**Feature**: 003-create-ci-lint
**Date**: 2025-10-07
**Purpose**: Define performance test interface and CI reporting format

---

## Budget Parameters

### Threshold

**Value**: 250ms
**Applies To**: 50 emails extracted (median of 3 runs)
**Rationale**: 10x headroom over current 50-200ms performance

### Baseline

**Value**: 150ms (historical median)
**Purpose**: Calculate regression/improvement delta
**Update Frequency**: Weekly or per major optimization

### Sampling Strategy

**Runs**: 3
**Aggregation**: Median (middle value)
**Rationale**: Reduces CI noise, resistant to outliers

---

## Test File Location

**File**: `frontend/tests/performance/ci-gate.test.ts`

**Test Name**: "50 emails extracted in <250ms (median of 3 runs)"

---

## Test Output Format

### Console Output (Parseable)

**Format**: Key-value pairs for CI parsing

```
PERF_METRIC:extraction_time_ms=145
PERF_THRESHOLD:250
```

**Keys**:
- `PERF_METRIC:extraction_time_ms` - Actual median extraction time
- `PERF_THRESHOLD` - Budget threshold (250ms)

**Usage**: CI workflow parses these lines via `grep` for delta calculation

### Vitest Output (Human-Readable)

**Pass**:
```
✓ CI Performance Gate > 50 emails extracted in <250ms (median of 3 runs) (145ms)
```

**Fail**:
```
✗ CI Performance Gate > 50 emails extracted in <250ms (median of 3 runs) (310ms)
  Expected: < 250
  Received: 310
```

---

## CI Summary Format

### GitHub Actions Job Summary

**Location**: `$GITHUB_STEP_SUMMARY`

**Format**: Markdown table

```markdown
### ⚡ Performance Results
| Metric | Value |
|--------|-------|
| Extraction Time (50 emails) | 145ms |
| Budget Threshold | 250ms |
| Baseline | 150ms |
| Status | ✅ PASS (-5ms, -3.3% improvement) |
```

### Delta Calculation

**Regression (Δ > 0)**:
```markdown
| **Regression** | **+50ms (+33.3%)** ❌ |
```

**Improvement (Δ < 0)**:
```markdown
| Improvement | -15ms (-10%) ✅ |
```

**Formula**:
- `deltaMs = actual - baseline`
- `deltaPercent = (deltaMs / baseline) * 100`

---

## Test Implementation Contract

### Test Structure

```typescript
import { describe, test, expect } from 'vitest';
import { extractFromEmail } from '@/lib/email-extractor';
import { emails50 } from './fixtures/sample-emails';

describe('CI Performance Gate', () => {
  test('50 emails extracted in <250ms (median of 3 runs)', async () => {
    const runs: number[] = [];

    // Execute 3 runs
    for (let i = 0; i < 3; i++) {
      const start = performance.now();

      for (const email of emails50) {
        await extractFromEmail(email);
      }

      const duration = performance.now() - start;
      runs.push(duration);
    }

    // Calculate median
    const median = runs.sort((a, b) => a - b)[1];

    // Output for CI parsing
    console.log(`PERF_METRIC:extraction_time_ms=${median}`);
    console.log(`PERF_THRESHOLD:250`);

    // Assert threshold
    expect(median).toBeLessThan(250);
  });
});
```

### Fixture Requirements

**File**: `frontend/tests/performance/fixtures/sample-emails.ts`

**Content**: Array of 50 representative BNPL emails

```typescript
export const emails50: string[] = [
  // Klarna emails (10)
  `From: klarna@klarna.com\nSubject: Payment due\n...`,
  // Affirm emails (10)
  `From: affirm@affirm.com\nSubject: Your Affirm payment\n...`,
  // Afterpay emails (10)
  `From: afterpay@afterpay.com\nSubject: Payment reminder\n...`,
  // ... 20 more varied emails
];
```

**Variety**:
- Multiple providers (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- Different date formats
- Various currencies
- Edge cases (missing fields, ambiguous dates)

---

## CI Workflow Integration

### Workflow Step

```yaml
- name: Performance Budget Guard
  run: |
    cd frontend
    npm run test:perf -- --reporter=verbose > perf-output.txt

    # Extract metrics
    ACTUAL=$(grep "PERF_METRIC" perf-output.txt | cut -d= -f2)
    THRESHOLD=$(grep "PERF_THRESHOLD" perf-output.txt | cut -d: -f2)
    BASELINE=150  # Update periodically

    # Calculate delta
    DELTA=$((ACTUAL - BASELINE))
    PERCENT=$(awk "BEGIN {printf \"%.1f\", ($DELTA * 100.0) / $BASELINE}")

    # GitHub Actions summary
    echo "### ⚡ Performance Results" >> $GITHUB_STEP_SUMMARY
    echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
    echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
    echo "| Extraction Time (50 emails) | ${ACTUAL}ms |" >> $GITHUB_STEP_SUMMARY
    echo "| Budget Threshold | ${THRESHOLD}ms |" >> $GITHUB_STEP_SUMMARY
    echo "| Baseline | ${BASELINE}ms |" >> $GITHUB_STEP_SUMMARY

    # Status with delta
    if [ "$DELTA" -gt 0 ]; then
      echo "| **Regression** | **+${DELTA}ms (+${PERCENT}%)** ❌ |" >> $GITHUB_STEP_SUMMARY
      exit 1  # Fail build on regression exceeding threshold
    elif [ "$DELTA" -lt 0 ]; then
      ABS_DELTA=$((DELTA * -1))
      ABS_PERCENT=$(awk "BEGIN {printf \"%.1f\", $ABS_DELTA * 100.0 / $BASELINE}")
      echo "| Improvement | -${ABS_DELTA}ms (-${ABS_PERCENT}%) ✅ |" >> $GITHUB_STEP_SUMMARY
    else
      echo "| Status | No change ✅ |" >> $GITHUB_STEP_SUMMARY
    fi

    # Fail if threshold exceeded (regardless of delta)
    if [ "$ACTUAL" -ge "$THRESHOLD" ]; then
      echo "" >> $GITHUB_STEP_SUMMARY
      echo "❌ **Budget exceeded**: ${ACTUAL}ms >= ${THRESHOLD}ms" >> $GITHUB_STEP_SUMMARY
      exit 1
    fi
```

### package.json Script

```json
{
  "scripts": {
    "test:perf": "vitest run tests/performance/ci-gate.test.ts"
  }
}
```

---

## Exit Codes

| Code | Condition | Meaning |
|------|-----------|---------|
| **0** | `actual < threshold` | Performance within budget, build passes |
| **1** | `actual >= threshold` | Performance exceeds budget, build fails |
| **1** | Test error/crash | Test infrastructure failure, build fails |

---

## Failure Scenarios

### Scenario 1: Budget Exceeded (Regression)

**Condition**: Median > 250ms

**CI Output**:
```
✗ CI Performance Gate > 50 emails extracted in <250ms (median of 3 runs) (310ms)
  Expected: < 250
  Received: 310

Test Files  1 failed (1)
     Tests  1 failed (1)

PERF_METRIC:extraction_time_ms=310
PERF_THRESHOLD:250

### ⚡ Performance Results
| Metric | Value |
|--------|-------|
| Extraction Time (50 emails) | 310ms |
| Budget Threshold | 250ms |
| Baseline | 150ms |
| **Regression** | **+160ms (+106.7%)** ❌ |

❌ **Budget exceeded**: 310ms >= 250ms
```

**Exit Code**: 1

**Action**: Optimize code, re-run locally, push fix

### Scenario 2: Close to Threshold (Warning)

**Condition**: 200ms < median < 250ms

**CI Output**:
```
✓ CI Performance Gate > 50 emails extracted in <250ms (median of 3 runs) (225ms)

### ⚡ Performance Results
| Metric | Value |
|--------|-------|
| Extraction Time (50 emails) | 225ms |
| Budget Threshold | 250ms |
| Baseline | 150ms |
| **Regression** | **+75ms (+50%)** ⚠️ |
```

**Exit Code**: 0 (passes, but shows warning)

**Action**: Monitor, consider optimization

### Scenario 3: Performance Improvement

**Condition**: Median < baseline

**CI Output**:
```
✓ CI Performance Gate > 50 emails extracted in <250ms (median of 3 runs) (120ms)

### ⚡ Performance Results
| Metric | Value |
|--------|-------|
| Extraction Time (50 emails) | 120ms |
| Budget Threshold | 250ms |
| Baseline | 150ms |
| Improvement | -30ms (-20%) ✅ |
```

**Exit Code**: 0

**Action**: None (celebrate! 🎉), consider updating baseline

---

## Baseline Updates

### When to Update

- **Weekly**: If performance stable, update to reflect current state
- **After Major Optimization**: When intentional improvement landed (e.g., new cache, algorithm)
- **After Infrastructure Change**: If CI hardware changed

### How to Update

1. **Gather Data**: Run performance test 20 times, calculate median
2. **Update Workflow**: Change `BASELINE=150` to new value in `.github/workflows/ci.yml`
3. **Document**: Add comment explaining update reason and date
4. **Verify**: Next CI run should show ~0% delta

### Example Update

```yaml
# Before
BASELINE=150  # Set 2025-10-01, pre-cache optimization

# After
BASELINE=120  # Updated 2025-10-07, post-LRU cache implementation
```

---

## Testing Contract

### Test Case 1: Performance Within Budget

**Setup**: Mock extractFromEmail to take 50ms per email

**Expected**:
- Median: ~150ms (50ms × 3 runs, median)
- Threshold: 250ms
- **Result**: ✅ Test passes

### Test Case 2: Performance Exceeds Budget

**Setup**: Mock extractFromEmail to take 100ms per email

**Expected**:
- Median: ~300ms (100ms × 3 runs, median)
- Threshold: 250ms
- **Result**: ❌ Test fails with "Expected: < 250, Received: 300"

### Test Case 3: Flaky Performance

**Setup**: Runs: [150ms, 280ms, 160ms] (one outlier)

**Expected**:
- Sorted: [150, 160, 280]
- Median: 160ms (middle value)
- Threshold: 250ms
- **Result**: ✅ Test passes (median < threshold, outlier ignored)

**Rationale**: Median sampling reduces false failures from CI noise

---

## Troubleshooting

### Issue: Test Timeout

**Symptom**: Test hangs for >30s

**Causes**:
- Hanging promise in extraction
- Infinite loop in extractor
- File I/O not completing

**Solution**:
```typescript
test('...', async () => {
  // Add timeout
}, { timeout: 10000 });  // 10s max
```

### Issue: Inconsistent Results Locally

**Symptom**: Median varies 50-300ms across runs

**Causes**:
- Background processes consuming CPU
- Cache not warming up correctly
- Test fixtures not representative

**Solution**:
1. Close resource-intensive apps
2. Run 10 times, check median of medians
3. Verify cache enabled in test

### Issue: CI Slower Than Local

**Symptom**: Local 100ms, CI 200ms

**Causes**:
- CI hardware weaker
- Cold start (no warm cache)
- Parallel tests competing for resources

**Solution**:
- Threshold (250ms) accounts for CI overhead
- If consistently >250ms on CI but <150ms local, investigate CI environment

---

## Rollback Plan

### Temporary Disable

Comment out workflow step:

```yaml
# - name: Performance Budget Guard
#   run: |
#     ...
```

### Adjust Threshold (False Positives)

Increase threshold temporarily:

```yaml
THRESHOLD=300  # Temporary: Investigate performance regression
```

**Note**: Should be temporary - fix underlying issue, revert threshold

### Permanent Revert

```bash
git revert <commit-sha>  # Removes performance test and CI integration
```

---

**Contract Status**: ✅ Complete - Ready for implementation
