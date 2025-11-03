# Phase 2 Integration Test Plan

**Status**: Draft (for Week 8+)
**Created**: 2025-11-03
**Author**: Claude Code
**Context**: Addressing 25% uncovered error paths from Phase 1 unit tests

---

## Executive Summary

Phase 1 unit tests achieved 74-75% coverage for storage services, with the remaining 25% consisting of browser API error paths that cannot be reliably tested with MockStorage. This plan outlines a **20-40 hour investment in Phase 2** to add integration tests using Playwright, achieving:

- ✅ 90%+ total coverage (unit + integration)
- ✅ Real browser error testing (QuotaExceededError, SecurityError)
- ✅ End-to-end user flow validation
- ✅ Performance benchmarking with realistic data

**ROI**: Excellent - catches bugs unit tests can't, validates real UX

---

## What Phase 1 Left Uncovered

### Storage Service Error Paths (~25% of code)

**CategoryStorageService.ts** (uncovered lines 70-374, 391-392):
- `QuotaExceededError` when localStorage is full (5MB limit)
- `SecurityError` in private browsing/incognito mode
- Deep try-catch branches in saveCategories()

**BudgetStorageService.ts** (uncovered lines 109-413, 428-429):
- `QuotaExceededError` handling in saveBudgets()
- `SecurityError` in private browsing
- Deep error branches in validation

**TransactionStorageService.ts** (uncovered lines 83-184, 195-199):
- `QuotaExceededError` handling
- `SecurityError` in private browsing
- saveTransactions() error paths

### Why Unit Tests Can't Cover This

**MockStorage limitations**:
- In-memory implementation (no size limits)
- No browser security restrictions
- Can't trigger real `QuotaExceededError` or `SecurityError`
- Mocking `Storage.prototype` conflicts with MockStorage

**The solution**: Real browser testing with Playwright

---

## Phase 2 Test Strategy

### Tool: Playwright

**Why Playwright over Cypress/Selenium:**
- ✅ Real browser API interactions
- ✅ localStorage size limits enforced
- ✅ Privacy modes (incognito) supported
- ✅ Fast, parallelizable tests
- ✅ Built-in accessibility testing
- ✅ Network throttling, offline mode

### Test Categories

#### 1. Storage Error Handling (8 tests, 4 hours)

**QuotaExceededError scenarios:**
```typescript
test('shows user-friendly error when localStorage is full', async ({ page }) => {
  // Fill localStorage to 4.5MB (near 5MB limit)
  await page.evaluate(() => {
    for (let i = 0; i < 900; i++) {
      localStorage.setItem(`filler_${i}`, 'x'.repeat(5000));
    }
  });

  await page.goto('/categories');
  await page.click('button:has-text("Create Category")');
  await page.fill('input[name="name"]', 'Test Category');
  await page.click('button:has-text("Save")');

  // User should see helpful error message
  await expect(page.locator('text=Storage limit exceeded')).toBeVisible();
  await expect(page.locator('text=Try deleting old transactions')).toBeVisible();

  // Error should not crash app
  await expect(page.locator('[data-testid="category-list"]')).toBeVisible();
});
```

**SecurityError scenarios:**
```typescript
test('handles localStorage disabled in incognito mode', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: undefined,
    permissions: [], // No storage permission
  });
  const page = await context.newPage();

  await page.goto('/categories');

  // Should show fallback UI
  await expect(page.locator('text=Enable cookies and storage')).toBeVisible();
  await expect(page.locator('text=Your data will not be saved')).toBeVisible();
});
```

**Tests to write:**
1. QuotaExceededError on category creation
2. QuotaExceededError on budget creation
3. QuotaExceededError on transaction creation
4. SecurityError in incognito mode (all services)
5. Graceful degradation when storage unavailable
6. Data export when quota exceeded (backup strategy)
7. Clear old data workflow when quota hit
8. Error recovery after storage permission granted

---

#### 2. End-to-End User Flows (12 tests, 8 hours)

**Critical user journeys:**
```typescript
test('complete budget setup flow', async ({ page }) => {
  await page.goto('/');

  // Create category
  await page.click('text=Create Category');
  await page.fill('input[name="name"]', 'Groceries');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Category created')).toBeVisible();

  // Create budget
  await page.click('text=Set Budget');
  await page.fill('input[name="amount"]', '500');
  await page.click('button:has-text("Save Budget")');
  await expect(page.locator('text=Budget created')).toBeVisible();

  // Add transaction
  await page.click('text=Add Transaction');
  await page.fill('input[name="description"]', 'Whole Foods');
  await page.fill('input[name="amount"]', '87.50');
  await page.click('button:has-text("Save Transaction")');

  // Verify dashboard updates
  await page.goto('/dashboard');
  await expect(page.locator('text=$87.50 / $500.00')).toBeVisible();
  await expect(page.locator('text=17.5%')).toBeVisible(); // Progress
});
```

**Flows to test:**
1. First-time user onboarding (create category → budget → transaction)
2. Overspending workflow (budget exceeded → warning shown → adjust budget)
3. Category deletion (check for budgets/transactions → prevent if in use)
4. Budget editing (change amount → recalculate progress)
5. Transaction reassignment (change category → update budget progress)
6. Data export (download JSON/CSV)
7. Data import (upload CSV → validate → import)
8. Month-end rollover (unused budget → carry forward)
9. Multi-period budget management
10. Search and filter transactions
11. Goal tracking workflow
12. Accessibility keyboard navigation flow

---

#### 3. Performance Benchmarks (6 tests, 4 hours)

**Load testing with realistic volumes:**
```typescript
test('dashboard loads in <1s with 1000 transactions', async ({ page }) => {
  // Pre-populate with realistic data
  const profile = createTypicalUserProfile();
  await page.evaluate((data) => {
    localStorage.setItem('payplan_transactions_v1', JSON.stringify({
      version: '1.0.0',
      transactions: data.transactions.slice(0, 1000),
      lastModified: new Date().toISOString(),
    }));
  }, profile);

  await page.goto('/dashboard');

  // Measure load time
  const metrics = await page.evaluate(() => ({
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    renderTime: performance.now(),
  }));

  expect(metrics.loadTime).toBeLessThan(1000); // <1s load
  await expect(page.locator('svg.recharts-surface')).toBeVisible({ timeout: 2000 });
});
```

**Benchmarks to establish:**
1. Dashboard with 1000 transactions: <1s load, <500ms chart render
2. Category list with 50 categories: <500ms render
3. Transaction search across 5000 transactions: <1s results
4. Budget calculations for 12 months: <200ms
5. Chart rendering with 365 data points: <1s
6. CSV export of 10,000 transactions: <5s

---

#### 4. Accessibility Testing (6 tests, 4 hours)

**Automated a11y audits:**
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('dashboard is WCAG 2.2 AA compliant', async ({ page }) => {
  await page.goto('/dashboard');
  await injectAxe(page);

  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

**Screen reader testing:**
```typescript
test('screen reader can navigate categories', async ({ page }) => {
  await page.goto('/categories');

  // Check ARIA labels
  const createButton = page.locator('button[aria-label="Create new category"]');
  await expect(createButton).toBeVisible();

  // Check landmark regions
  await expect(page.locator('main[role="main"]')).toBeVisible();
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

  // Check focus management
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(focused).toBeTruthy();
});
```

**Tests to write:**
1. WCAG 2.2 AA audit (all pages)
2. Keyboard navigation (Tab, Enter, Escape)
3. Screen reader announcements (ARIA live regions)
4. Focus management (modals, forms)
5. Color contrast validation
6. Reduced motion support

---

## Implementation Timeline

### Week 8: Foundation (8 hours)
- Install Playwright
- Configure test environment
- Write first 5 integration tests
- Set up CI/CD pipeline

### Week 10: Core Flows (12 hours)
- Complete storage error tests (8 tests)
- Write critical user flows (12 tests)
- Add performance benchmarks (6 tests)

### Week 12: Polish (8 hours)
- Accessibility tests (6 tests)
- Flaky test fixes
- Documentation
- CI integration

**Total**: 28 hours (within 20-40 hour estimate)

---

## Success Metrics

### Coverage Goals
- **Overall coverage**: 85-90% (unit + integration)
- **Storage service coverage**: 90%+ (including error paths)
- **E2E flow coverage**: 100% of critical paths

### Quality Goals
- ✅ All error paths tested in real browser
- ✅ Performance benchmarks established
- ✅ WCAG 2.2 AA compliance verified
- ✅ No flaky tests (deterministic with seeded faker)

### Business Goals
- ✅ Confidence to ship premium features
- ✅ Fewer production bugs reported
- ✅ Evidence for investors ("90% test coverage")

---

## Academic Datasets for Phase 2.5

### Recommended Sources

**1. Berka Dataset (Czech Bank, 1999)**
- Source: https://data.world/lpetrocelli/czech-financial-dataset
- Contains: 1M+ transactions, realistic spending patterns
- Use for: Performance testing, stress testing, UI edge cases

**2. Kaggle Credit Card Fraud Dataset**
- Source: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
- Contains: 284K transactions (anonymized)
- Use for: Outlier detection, data visualization testing

**3. CFPB Consumer Finance Data**
- Source: https://www.consumerfinance.gov/data-research/consumer-complaints/
- Contains: Complaint narratives, financial products
- Use for: UX testing, error message validation

### Integration Script (Week 10)

```typescript
// frontend/tests/data/import-academic-data.ts
import berkaTransactions from './berka-1999.json';
import { TransactionStorageService } from '@/features/transactions/lib/TransactionStorageService';

export const loadAcademicDataset = (
  dataset: 'berka' | 'kaggle' | 'cfpb',
  maxRecords: number = 1000
) => {
  const service = new TransactionStorageService();

  if (dataset === 'berka') {
    const transactions = berkaTransactions.slice(0, maxRecords).map((row) => ({
      amount: parseFloat(row.amount) * 100, // Convert to cents
      description: row.description,
      date: row.date,
      categoryId: mapToCategoryId(row.type),
    }));

    return service.bulkCreate(transactions);
  }

  // ... other datasets
};
```

---

## Estimated ROI

### Time Investment
- **Phase 1.5** (faker.js): 2 hours ✅ DONE
- **Phase 2** (integration tests): 28 hours
- **Phase 2.5** (academic data): 8 hours
- **Total**: 38 hours

### Value Delivered
- **Coverage**: 74% → 90% (+16%)
- **Confidence**: Medium → Very High
- **Bug prevention**: High (catches browser-specific issues)
- **UX validation**: Tests real user flows
- **Performance**: Establishes benchmarks

### Cost of NOT Doing This
- 🚨 Production bugs from untested error paths
- 🚨 Performance regressions (no benchmarks)
- 🚨 Accessibility issues missed
- 🚨 User frustration (quota exceeded with no guidance)

**Recommendation**: Invest 28 hours in Week 8-12 after validating market need with first users.

---

## Decision Framework

### Ship Phase 1 Now If:
- ✅ You need users immediately (validate market)
- ✅ Business logic is tested (100% calculations, 74-75% storage)
- ✅ Manual testing shows no critical bugs
- ✅ Market window is closing (competitors moving fast)

### Do Phase 2 Integration Tests If:
- ✅ You have 100+ active users (validated market need)
- ✅ Production errors show storage issues
- ✅ Planning premium features (bank sync, multi-user)
- ✅ Fundraising requires quality metrics

### Do Academic Data Integration If:
- ✅ Performance becomes a user complaint
- ✅ Need to test with 10,000+ transactions
- ✅ Building data visualization features
- ✅ Want realistic demo data for investors

---

## Immediate Next Steps (Phase 1)

1. ✅ **Ship current work** - PR #68 with 121 tests
2. ✅ **Add faker.js** - Done! 14 realistic tests added
3. ✅ **Document strategy** - This plan
4. ✅ **Move to next feature** - Build Dashboard (Feature 062), Categories UI, etc.

**Phase 2 starts**: Week 8 or when 100+ users achieved

---

## The Honest Truth

**Phase 1**: We have **excellent coverage** for what matters most (business logic)

**Phase 2**: We'll have **complete confidence** for production readiness

**The gap**: Intentional, documented, evidence-based trade-off

**Ship it.** 🚀

---

## Appendix: Quick Reference

### Run Realistic Tests
```bash
npm test -- realistic
# 14 tests, validates faker.js fixtures
```

### Run Unit Tests
```bash
npm test
# 135 tests total (121 unit + 14 realistic)
```

### Run Integration Tests (Phase 2)
```bash
npm run test:e2e
# Playwright tests (not yet implemented)
```

### Coverage Report
```bash
npm run test:coverage
# CategoryStorageService: 74.66%
# BudgetStorageService: 75.51%
# TransactionStorageService: 74.49%
# calculations.ts: 100%
```

---

**Document Version**: 1.0
**Review Date**: Week 8 (before Phase 2 implementation)
