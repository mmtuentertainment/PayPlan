# Delta: CSV Import MVP (0020)

**Feature**: Client-only CSV import for BNPL payment schedule visualization
**Branch**: `007-0020-csv-import`
**Date**: 2025-10-08

## Scope

Add `/import` page enabling users to upload CSV files with payment data, process them client-side through the existing extraction system, view schedules with confidence/risk pills (COLLISION, WEEKEND_AUTOPAY), and download ICS calendar files filtered to "This Week" events.

**Key Characteristics**:
- Client-only processing (zero network requests)
- Simple CSV format (comma-delimited, no quotes)
- ISO week filtering (Mon-Sun, America/New_York)
- No VALARM in ICS (MVP constraint)
- Reuses existing extraction infrastructure

## Files Changed

| File | Status | LOC Added | LOC Removed | Net |
|------|--------|-----------|-------------|-----|
| `frontend/src/pages/Import.tsx` | NEW | 134 | 0 | +134 |
| `frontend/src/App.tsx` | MODIFIED | 2 | 0 | +2 |
| `frontend/tests/integration/import-page.test.tsx` | NEW | ~357 | 0 | +357 (tests) |
| `ops/deltas/0020_csv_import_mvp.md` | NEW | - | - | (this file) |
| **Total Code** | | **136** | **0** | **+136** |

**Budget Status**: ✅ 136 LOC (target ≤150, hard cap 180)
**File Count**: ✅ 4 files total (cap ≤8)

## Verification Commands

### Automated Tests
```bash
# Lint check
pnpm -C frontend lint

# Run tests
pnpm -C frontend test

# Specific import tests
pnpm -C frontend test import-page.test.tsx
```

**Expected**: All tests pass (13 import tests + existing tests)

### Manual Testing

```bash
# Start dev server
pnpm -C frontend dev

# Navigate to http://localhost:5173/import
```

## Manual Test Scenarios

(From [specs/007-0020-csv-import/quickstart.md](../../specs/007-0020-csv-import/quickstart.md))

- [ ] **Happy path**: Valid CSV (5 rows) → results table → confidence pills → risk pills (COLLISION) → Download .ics → verify "This Week" events only
- [ ] **Invalid CSV (missing field)**: Upload CSV with missing currency → error message "Invalid currency in row N" → page remains usable
- [ ] **Invalid date format**: Upload CSV with MM/DD/YYYY → error "Invalid date format" → page usable
- [ ] **Empty CSV**: Upload header-only CSV → error "No data rows found" → page usable
- [ ] **This Week filtering**: Upload CSV with past/current/future week dates → all rows in table → only current week in ICS
- [ ] **Drag-and-drop**: Drag CSV onto drop zone → works same as file chooser
- [ ] **No network requests**: Open DevTools Network tab → upload and process CSV → verify 0 requests

### Sample CSV (valid)

```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,USD,2025-10-16,true
Afterpay,37.50,USD,2025-10-15,false
PayPal Pay-in-4,45.00,USD,2025-10-18,true
Zip,30.00,USD,2025-10-22,false
```

## Rollback

Single revert of feature branch commit removes all changes cleanly:

```bash
git revert <commit-hash>
```

**Impact**: Zero production impact; `/import` route becomes 404, existing features unaffected.

## Constitutional Compliance

- ✅ **LOC Budget**: 136/180 (25% buffer remaining)
- ✅ **File Count**: 4/8 files
- ✅ **No Network**: Verified in tests (fetch mock never called)
- ✅ **Import Rules**: Only `@/lib/email-extractor` and `luxon`/`ics` (allowed dependencies)
- ✅ **Risks**: COLLISION + WEEKEND_AUTOPAY only (no CASH_CRUNCH)
- ✅ **CSV Format**: Simple comma-delimited (no RFC 4180 complexity)
- ✅ **ISO Week**: Explicit Mon-Sun calculation (America/New_York)
- ✅ **ICS**: No VALARM, no explicit TZID (matches 0019 pattern)
- ✅ **Reversible**: Single revert, zero API changes

## Dependencies

**No new dependencies added** - reuses existing:
- `luxon` (timezone handling)
- `ics` (calendar generation)
- `@/lib/email-extractor` (orchestrator)

## Known Limitations (MVP Scope)

- CSV must be simple format (no quotes, no commas in field values)
- No CASH_CRUNCH risk detection (requires paycheck data not in CSV)
- No ICS reminders/VALARM (can add in future)
- Client-side only (no server persistence)

---

**Status**: ✅ Complete
**Verified**: 2025-10-08
**Approved for Merge**: Pending manual QA
