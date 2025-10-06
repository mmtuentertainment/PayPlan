# PayPlan v0.1.5-a.2 — Locale Enhancements & Financial Validation

**Parent Feature**: v0.1.5-a (Locale + Date Quick Fix)
**Sprint**: v0.1.5-a.2 (Enhancement)
**Status**: Planned
**Created**: 2025-10-06

---

## Overview

Address remaining review items from v0.1.5-a.1 PR, focusing on:
1. Auto-detection of user locale (not hardcoded US default)
2. Financial validation edge cases
3. Audit trail (locale in ExtractionResult)
4. Error handling in re-extraction flow
5. Comprehensive test coverage

**Scope**: Frontend-only, backward compatible
**Priority**: P1 (Critical for international users)

---

## Tasks

### T1: Auto-Detect User Locale (P0 - Critical)

**Issue**: Default locale hardcoded to 'US' may cause financial inaccuracies for international users.

**Changes**:
1. `frontend/src/utils/detect-locale.ts` (new):
   ```typescript
   export function detectUserLocale(): DateLocale {
     // Priority 1: Browser language (navigator.language)
     const lang = navigator.language.toLowerCase();

     // EU locales: en-GB, de-DE, fr-FR, es-ES, it-IT, nl-NL, etc.
     const euLocales = ['en-gb', 'de', 'fr', 'es', 'it', 'nl', 'pt', 'pl', 'se', 'no', 'dk', 'fi'];
     if (euLocales.some(locale => lang.startsWith(locale))) {
       return 'EU';
     }

     // Priority 2: Timezone heuristic
     const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
     if (tz.startsWith('Europe/') || tz.startsWith('Africa/')) {
       return 'EU';
     }

     // Default: US
     return 'US';
   }
   ```

2. `frontend/src/components/EmailInput.tsx`:
   ```typescript
   import { detectUserLocale } from '../utils/detect-locale';

   const [dateLocale, setDateLocale] = useState<DateLocale>(() => detectUserLocale());
   ```

3. Add JSDoc warning about auto-detection and override capability

**Tests** (`frontend/tests/unit/detect-locale.test.ts`):
- Mock navigator.language for US, GB, DE, FR
- Mock timezone for Europe/London, America/New_York
- Test fallback to 'US' when detection fails
- Test override via LocaleToggle

**Acceptance**:
- ✅ UK user (en-GB) defaults to EU locale
- ✅ German user (de-DE) defaults to EU locale
- ✅ US user (en-US) defaults to US locale
- ✅ User can override auto-detected locale
- ✅ Auto-detection documented in README

---

### T2: Add Locale to ExtractionResult (Audit Trail) (P1)

**Issue**: Locale not included in result, making it impossible to audit which format was used.

**Changes**:
1. `frontend/src/lib/email-extractor.ts`:
   ```typescript
   export interface ExtractionResult {
     items: Item[];
     issues: Issue[];
     duplicatesRemoved: number;
     dateLocale: DateLocale; // NEW: audit trail
   }

   // In extractItemsFromEmails():
   return {
     items: deduplicated,
     issues,
     duplicatesRemoved: items.length - deduplicated.length,
     dateLocale: safeOptions.dateLocale || 'US'
   };
   ```

2. `frontend/src/components/EmailPreview.tsx`:
   - Display locale badge in header: "Parsed with US format (MM/DD/YYYY)"

**Tests**:
- Verify `dateLocale` appears in result
- Test US vs EU extraction returns correct locale value

**Acceptance**:
- ✅ ExtractionResult includes dateLocale field
- ✅ UI shows which locale was used for parsing
- ✅ No breaking changes to existing code

---

### T3: Financial Validation Edge Cases (P1)

**Issue**: Missing tests for leap years, month boundaries, invalid dates.

**Tests** (`frontend/tests/unit/locale-parsing-edge-cases.test.ts`):

```typescript
describe('Locale parsing edge cases (financial validation)', () => {
  describe('Leap year handling', () => {
    test('US: 02/29/2024 → Feb 29, 2024 (valid leap year)', () => {
      expect(parseDate('02/29/2024', 'America/New_York', { dateLocale: 'US' }))
        .toBe('2024-02-29');
    });

    test('EU: 29/02/2024 → Feb 29, 2024 (valid leap year)', () => {
      expect(parseDate('29/02/2024', 'America/New_York', { dateLocale: 'EU' }))
        .toBe('2024-02-29');
    });

    test('US: 02/29/2025 → throws (invalid, not a leap year)', () => {
      expect(() => parseDate('02/29/2025', 'America/New_York', { dateLocale: 'US' }))
        .toThrow('Suspicious date');
    });
  });

  describe('Month boundary edge cases', () => {
    test('US: 01/31/2026 → Jan 31, 2026', () => {
      expect(parseDate('01/31/2026', 'America/New_York', { dateLocale: 'US' }))
        .toBe('2026-01-31');
    });

    test('EU: 31/01/2026 → Jan 31, 2026', () => {
      expect(parseDate('31/01/2026', 'America/New_York', { dateLocale: 'EU' }))
        .toBe('2026-01-31');
    });

    test('US: 04/31/2026 → throws (April only has 30 days)', () => {
      expect(() => parseDate('04/31/2026', 'America/New_York', { dateLocale: 'US' }))
        .toThrow();
    });
  });

  describe('Ambiguous date collision (critical financial risk)', () => {
    test('12/12/2026 is same in both locales (Dec 12)', () => {
      const us = parseDate('12/12/2026', 'America/New_York', { dateLocale: 'US' });
      const eu = parseDate('12/12/2026', 'America/New_York', { dateLocale: 'EU' });
      expect(us).toBe(eu);
      expect(us).toBe('2026-12-12');
    });

    test('01/13/2026 is INVALID in EU (no 13th month)', () => {
      expect(() => parseDate('01/13/2026', 'America/New_York', { dateLocale: 'EU' }))
        .toThrow();
    });

    test('13/01/2026 is INVALID in US (no 13th month)', () => {
      expect(() => parseDate('13/01/2026', 'America/New_York', { dateLocale: 'US' }))
        .toThrow();
    });
  });

  describe('Year boundary edge cases', () => {
    test('12/31/2025 → Dec 31, 2025 (both locales)', () => {
      expect(parseDate('12/31/2025', 'America/New_York', { dateLocale: 'US' }))
        .toBe('2025-12-31');
      expect(parseDate('31/12/2025', 'America/New_York', { dateLocale: 'EU' }))
        .toBe('2025-12-31');
    });

    test('01/01/2026 → Jan 1, 2026 (both locales)', () => {
      expect(parseDate('01/01/2026', 'America/New_York', { dateLocale: 'US' }))
        .toBe('2026-01-01');
      expect(parseDate('01/01/2026', 'America/New_York', { dateLocale: 'EU' }))
        .toBe('2026-01-01');
    });
  });
});
```

**Acceptance**:
- ✅ 15+ new edge case tests pass
- ✅ Leap year validation works
- ✅ Invalid dates properly rejected
- ✅ Month boundary cases handled

---

### T4: Error Handling in Re-Extraction Flow (P1)

**Issue**: LocaleToggle doesn't handle extraction failures during re-extraction.

**Changes**:
1. `frontend/src/components/LocaleToggle.tsx`:
   ```typescript
   interface LocaleToggleProps {
     locale: DateLocale;
     onLocaleChange: (locale: DateLocale) => void;
     onReExtract: () => void;
     hasExtractedData: boolean;
     isExtracting: boolean;
     extractionError?: string; // NEW: show error if re-extraction fails
   }

   // In AlertDialogDescription:
   {extractionError && (
     <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
       ⚠️ Previous re-extraction failed: {extractionError}
     </div>
   )}
   ```

2. `frontend/src/components/EmailInput.tsx`:
   ```typescript
   const [lastError, setLastError] = useState<string>();

   const handleReExtract = () => {
     setLastError(undefined);
     try {
       handleExtract();
     } catch (err) {
       setLastError(err instanceof Error ? err.message : 'Unknown error');
     }
   };

   // Pass extractionError to LocaleToggle
   <LocaleToggle extractionError={lastError} ... />
   ```

**Tests** (`frontend/tests/unit/locale-toggle-error.test.tsx`):
- Mock extraction failure
- Verify error message displays in AlertDialog
- Test error clears on successful re-extraction

**Acceptance**:
- ✅ Extraction errors shown to user
- ✅ Error message appears in re-extract modal
- ✅ Error clears on retry

---

### T5: DST Hour-Level Edge Cases (P2)

**Issue**: DST tests cover dates but not hour-level transitions (2am spring forward).

**Tests** (`frontend/tests/unit/locale-parsing-timezone.test.ts` - append):

```typescript
describe('DST hour-level edge cases', () => {
  test('Spring forward (2am EDT): payment due date unaffected', () => {
    // March 8, 2026 2:00am EDT → 3:00am EDT
    const date = parseDate('03/08/2026', 'America/New_York', { dateLocale: 'US' });
    expect(date).toBe('2026-03-08'); // Date stays same, only hour shifts
  });

  test('Fall back (2am EST): payment due date unaffected', () => {
    // November 1, 2026 2:00am EST → 1:00am EST
    const date = parseDate('11/01/2026', 'America/New_York', { dateLocale: 'US' });
    expect(date).toBe('2026-11-01'); // Date stays same
  });

  test('Payment timestamp on DST boundary preserves date', () => {
    // If an email says "Due: 03/08/2026 2:30am" during DST gap
    // We only parse dates, not times, so this should not be an issue
    // But verify date parsing is robust
    const date = parseDate('March 8, 2026', 'America/New_York');
    expect(date).toBe('2026-03-08');
  });
});
```

**Acceptance**:
- ✅ 3+ DST hour tests pass
- ✅ Date parsing unaffected by hour-level DST shifts

---

### T6: Validate Before Type Cast (P2 - Code Quality)

**Issue**: `value as DateLocale` in RadioGroup doesn't validate before casting.

**Changes** (`frontend/src/components/LocaleToggle.tsx`):

```typescript
// Before:
onValueChange={(value) => onLocaleChange(value as DateLocale)}

// After:
onValueChange={(value) => {
  if (value === 'US' || value === 'EU') {
    onLocaleChange(value);
  } else {
    console.error(`Invalid locale value: ${value}`);
    // Fallback to US
    onLocaleChange('US');
  }
}}
```

**Tests**:
- Mock RadioGroup emitting invalid value
- Verify fallback to 'US'
- Verify console.error called

**Acceptance**:
- ✅ Invalid values rejected
- ✅ Type-safe without `as` cast
- ✅ Error logged for debugging

---

### T7: Timezone Parameter Respected (P2 - Test Coverage)

**Issue**: Tests don't verify timezone parameter is actually used in parseDate.

**Tests** (`frontend/tests/unit/locale-parsing.test.ts` - append):

```typescript
describe('Timezone parameter respected', () => {
  test('Same date, different timezones, produces same ISO date', () => {
    const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];

    timezones.forEach(tz => {
      const result = parseDate('06/15/2026', tz, { dateLocale: 'US' });
      expect(result).toBe('2026-06-15'); // ISO date should be timezone-agnostic
    });
  });

  test('Timezone affects suspicious date check (30-day window)', () => {
    // Test that timezone shifts don't cause false "suspicious date" errors
    const result = parseDate('10/15/2025', 'Pacific/Auckland', { dateLocale: 'US' });
    expect(result).toBe('2025-10-15'); // Should not throw even if Auckland is +13 hours
  });
});
```

**Acceptance**:
- ✅ 2+ timezone tests pass
- ✅ Verify timezone doesn't break date parsing

---

### T8: Update README & Docs (P2)

**Changes**:
1. `README.md` - Locale section:
   - Document auto-detection behavior
   - Explain override via LocaleToggle
   - Add troubleshooting for wrong locale detection

2. `frontend/src/lib/email-extractor.ts` - JSDoc:
   - Update to mention auto-detection
   - Document audit trail (locale in result)

**Acceptance**:
- ✅ README explains auto-detection
- ✅ JSDoc updated with new behavior

---

## Summary

**Files Changed**: 8-10
**New Files**: 2 (detect-locale.ts, locale-parsing-edge-cases.test.ts)
**Tests Added**: 25+
**Net LOC**: ~200

**Priority Breakdown**:
- P0 (Critical): T1 (auto-detect locale)
- P1 (High): T2 (audit trail), T3 (edge cases), T4 (error handling)
- P2 (Medium): T5-T8 (test coverage, code quality, docs)

**Acceptance Criteria**:
- ✅ Auto-detects EU locale for European users
- ✅ Locale included in ExtractionResult for audit
- ✅ 15+ financial edge case tests pass
- ✅ Re-extraction errors shown to user
- ✅ All TypeScript strict mode checks pass
- ✅ Zero regressions in existing 112 tests

---

## Out of Scope (Future Work)

- Locale selection persistence (localStorage)
- Additional locales (AU, CA, JP)
- Server-side locale validation
- E2E tests for locale switching flow
- Exact version pinning (requires package.json audit)
