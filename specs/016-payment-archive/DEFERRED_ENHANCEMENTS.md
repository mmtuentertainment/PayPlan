# Deferred Enhancements - Feature 016

**Purpose**: Track future improvements with clear triggers for when to implement them
**Last Updated**: 2025-10-17
**Feature Status**: Complete (v1.0.0)

---

## 📋 Overview

This document tracks **intentionally deferred** CodeRabbit suggestions and enhancements that should be addressed when specific conditions are met.

**Total Deferred Items**: 16
- Schema v2.0.0 triggers: 4 items
- i18n initiative triggers: 3 items
- Accessibility audit triggers: 3 items
- Performance tuning triggers: 2 items
- Security review triggers: 2 items
- Code refactoring triggers: 2 items

---

## 🔄 TRIGGER 1: Schema v2.0.0 Update

**When to Implement**: Archive schema breaking changes (sourceVersion "1.0.0" → "2.0.0")

### Items to Address:

**D1. PaymentContext State Refactor**
- **File**: `frontend/src/contexts/PaymentContext.tsx:115-166`
- **Issue**: Dual source of truth (internalPayments + value.payments)
- **Why Deferred**: Works correctly, refactor is risky breaking change
- **Fix**: Pick one pattern (owned vs controlled state), refactor consistently
- **Impact**: May break Home.tsx integration
- **Effort**: 30-45 mins
- **Signal**: When refactoring PaymentContext for v2.0.0
- **Code marker**: Search for `// DEFER TO v2.0.0: PaymentContext refactor`

**D2. Schema Migration Framework**
- **File**: `frontend/src/hooks/usePaymentArchives.ts:176-184`
- **Issue**: No migration system for localStorage schema changes
- **Why Deferred**: Not needed until we have v2.0.0
- **Fix**: Implement schema version detection and migration functions
- **Effort**: 2-3 hours
- **Signal**: When adding fields to Archive or changing structure
- **Code marker**: Search for `// DEFER TO v2.0.0: Schema migration`

**D3. Backward Compatibility Tests**
- **File**: `frontend/src/lib/archive/__tests__/ArchiveService.test.ts:1-20`
- **Issue**: No tests for loading older sourceVersion archives
- **Why Deferred**: Only v1.0.0 exists currently
- **Fix**: Add tests for v0.9.0, v2.0.0 compatibility
- **Effort**: 30 mins
- **Signal**: When planning v2.0.0 schema changes
- **Code marker**: Search for `// TODO: Add schema migration tests`

**D4. Forward Compatibility Tests**
- **File**: `frontend/src/lib/archive/__tests__/ArchiveService.test.ts`
- **Issue**: No tests for future schema versions
- **Why Deferred**: Can't test future versions yet
- **Fix**: Test that sourceVersion "999.0.0" is rejected
- **Effort**: 15 mins
- **Signal**: When implementing version validation logic

---

## 🌍 TRIGGER 2: i18n/Localization Initiative

**When to Implement**: Adding multi-language or international support

### Items to Address:

**D5. Grapheme-Splitter Dependency**
- **File**: `frontend/src/lib/archive/__tests__/validation.test.ts:186-193`
- **Issue**: Uses `.length` which miscounts emoji (family emoji = 11 code units, 1 grapheme)
- **Why Deferred**: 99% of cases work fine, adds dependency
- **Fix**:
  ```bash
  npm install grapheme-splitter
  ```
  ```typescript
  import GraphemeSplitter from 'grapheme-splitter';
  const splitter = new GraphemeSplitter();
  const graphemeLength = splitter.countGraphemes(name);
  ```
- **Effort**: 30 mins
- **Signal**: Users complain about emoji names being rejected/truncated
- **Code marker**: Search for `// DEFER TO i18n: Grapheme counting`

**D6. Timezone Normalization**
- **Files**: Multiple components with `toLocaleDateString('en-US')`
- **Issue**: Hardcoded 'en-US' locale, timezone handling inconsistent
- **Why Deferred**: Works for single-region deployment
- **Fix**: Use `undefined` locale, explicit `timeZone: 'UTC'`
- **Effort**: 1-2 hours
- **Signal**: International users or multi-region deployment
- **Code marker**: Search for `// DEFER TO i18n: Timezone handling`

**D7. Locale-Aware Percentage Separators**
- **File**: `frontend/src/components/archive/ArchiveStatistics.tsx:57-76`
- **Issue**: Uses `.toFixed(1)` with dot separator (not locale-aware)
- **Why Deferred**: Works for US/English users
- **Fix**: Use `Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })`
- **Effort**: 15 mins
- **Signal**: European users expect "66,7%" instead of "66.7%"
- **Code marker**: Task T124 in tasks.md

---

## ♿ TRIGGER 3: Accessibility Audit

**When to Implement**: Formal WCAG audit or accessibility complaints

### Items to Address:

**D8. Semantic HTML for Statistics**
- **File**: `frontend/src/components/archive/ArchiveStatistics.tsx:74-114`
- **Issue**: Uses divs instead of semantic `<dl>/<dt>/<dd>`
- **Why Deferred**: Already WCAG 2.1 AA compliant with ARIA
- **Fix**: Replace divs with description list markup
- **Effort**: 20 mins
- **Signal**: Accessibility audit recommends semantic HTML
- **Code marker**: Task T125 in tasks.md

**D9. Extended Accessibility Test Coverage**
- **Files**: Multiple test files
- **Issue**: Missing keyboard nav assertions, ARIA attribute tests
- **Why Deferred**: Components are accessible, just tests don't validate it
- **Fix**: Add userEvent.tab(), role queries, aria-label assertions
- **Effort**: ~2 hours across all components
- **Signal**: QA accessibility testing phase
- **Code marker**: Search for `// DEFER TO ACCESSIBILITY AUDIT:`

**D10. Enhanced ARIA Labels**
- **Files**: Various components
- **Issue**: Could add more descriptive aria-labels
- **Why Deferred**: Current labels are sufficient for WCAG AA
- **Fix**: More verbose descriptions
- **Effort**: 30 mins
- **Signal**: Screen reader user feedback

---

## 🚀 TRIGGER 4: Performance Issues

**When to Implement**: Production monitoring shows degradation

### Items to Address:

**D11. Web Workers for Heavy Operations**
- **File**: `frontend/src/hooks/usePaymentArchives.ts:57`
- **Issue**: Synchronous localStorage reads may block UI
- **Why Deferred**: Current performance meets targets (<100ms)
- **Fix**: Offload to Web Worker
- **Effort**: 2-3 hours
- **Signal**: Performance monitoring shows >100ms loads
- **Code marker**: Search for `// DEFER TO PERFORMANCE TUNING:`

**D12. Advanced Performance Tests**
- **File**: `frontend/src/lib/archive/__tests__/performance.test.ts`
- **Issue**: Missing SLA validation, semantic assertions
- **Why Deferred**: Current tests cover basic functionality
- **Fix**: Add SLA threshold guards, ratio validations
- **Effort**: 1 hour
- **Signal**: Performance regressions in CI
- **Code marker**: Search for `// TODO: Add SLA guard tests`

---

## 🔐 TRIGGER 5: Security Review

**When to Implement**: Security audit or compliance requirements

### Items to Address:

**D13. Audit Logging Framework**
- **File**: Tasks T119-T120 in tasks.md
- **Issue**: No audit trail for exports
- **Why Deferred**: Not required for MVP
- **Fix**: Add export confirmation dialog, log user/archive/timestamp
- **Effort**: 45 mins
- **Signal**: Compliance requirements (GDPR, SOC2, etc.)
- **Code marker**: Search for `// DEFER TO SECURITY REVIEW: Audit logging`

**D14. Archive-Specific Error Classes**
- **File**: `frontend/src/components/archive/ArchiveErrorBoundary.tsx:91-93`
- **Issue**: Uses string matching instead of error classes
- **Why Deferred**: Current implementation works
- **Fix**: Create ArchiveParseError, ArchiveValidationError classes
- **Effort**: 20 mins
- **Signal**: Error handling becomes complex
- **Code marker**: Search for `// DEFER TO SECURITY REVIEW: Error classes`

---

## 🔨 TRIGGER 6: Code Refactoring Sprint

**When to Implement**: Dedicated refactoring/tech debt sprint

### Items to Address:

**D15. Routes Constants Extraction**
- **Files**: Multiple components with hardcoded "/archives"
- **Issue**: Route strings duplicated
- **Why Deferred**: Small duplication, not causing issues
- **Fix**: Create `src/routes.ts` with ROUTES constant
- **Effort**: 30 mins
- **Signal**: Adding more routes or refactoring navigation
- **Code marker**: Search for `// DEFER TO REFACTORING: Routes constants`

**D16. Test Helper Factories**
- **Files**: Test files with duplicated mocks
- **Issue**: Mock duplication across tests
- **Why Deferred**: Tests work, just verbose
- **Fix**: Create createMockUsePaymentArchives factory
- **Effort**: 1 hour
- **Signal**: Test maintenance becomes painful
- **Code marker**: Search for `// DEFER TO REFACTORING: Test helpers`

---

## 📝 How to Use This Document

### When Starting New Work:

1. **Check if trigger conditions are met**:
   ```bash
   # Are we doing v2.0.0?
   git log --oneline | grep "v2.0.0"

   # Are we adding i18n?
   grep -r "i18n\|locale\|translation" package.json

   # Did we get accessibility audit?
   ls docs/ | grep -i "accessibility\|wcag\|audit"
   ```

2. **Find relevant deferred items**:
   ```bash
   # Search codebase for markers
   grep -r "DEFER TO v2.0.0" frontend/src/
   grep -r "DEFER TO i18n" frontend/src/
   grep -r "DEFER TO ACCESSIBILITY" frontend/src/
   ```

3. **Execute the deferred items** listed for that trigger

4. **Update this document** - Mark items as complete, add new deferrals

---

## 🎯 Quick Reference

| Trigger | Items | Effort | When |
|---------|-------|--------|------|
| v2.0.0 | 4 | ~4 hours | Schema breaking changes |
| i18n | 3 | ~2 hours | Multi-language support |
| A11y Audit | 3 | ~3 hours | WCAG review or complaints |
| Performance | 2 | ~3 hours | Monitoring shows issues |
| Security | 2 | ~1 hour | Audit or compliance |
| Refactoring | 2 | ~1.5 hours | Tech debt sprint |

---

## 📌 Maintenance Notes

**How to add new deferrals**:
1. Add item to appropriate trigger section
2. Include: File, Issue, Why Deferred, Fix, Effort, Signal
3. Add code marker comment in actual file
4. Update trigger item count in overview

**How to complete deferrals**:
1. Find items for current trigger
2. Execute fixes
3. Mark with ✅ and completion date
4. Move to "Completed Deferrals" section at bottom

---

**Last Review**: 2025-10-17 (Feature 016 v1.0.0 complete)
**Next Review**: When any trigger condition is met
