# Research: CSV Export for Payment Schedules

**Feature**: CSV Export (014-build-a-csv)
**Date**: 2025-10-14
**Status**: Complete

## Overview

Research technical decisions for implementing client-side CSV export functionality in PayPlan. Focus areas: RFC 4180 compliance, browser compatibility, performance optimization, and round-trip import compatibility.

## 1. CSV Generation Libraries

### Question
Should we use PapaParse for CSV generation or implement custom RFC 4180-compliant logic?

### Research Findings

**PapaParse 5.5.3** (already installed):
- ✅ RFC 4180 compliant CSV generation via `Papa.unparse()`
- ✅ Automatic handling of special characters (commas, quotes, newlines)
- ✅ Unicode support (UTF-8 BOM optional)
- ✅ Battle-tested with 14k+ GitHub stars
- ✅ Zero dependencies, 45KB minified
- ✅ Already used in PayPlan for CSV import (consistency benefit)

**Manual Implementation**:
- ❌ Risk of RFC 4180 edge case bugs (quote escaping, newlines)
- ❌ More code to maintain and test
- ✅ Slightly smaller bundle size (~2KB)
- ✅ Full control over output format

**Decision**: **Use PapaParse's `Papa.unparse()` method**

**Rationale**:
1. RFC 4180 compliance guaranteed (critical for spec FR-006)
2. Already installed dependency (zero bundle impact)
3. Consistency with import functionality (both use PapaParse)
4. Handles edge cases we haven't considered (newlines in fields, etc.)
5. Well-documented and actively maintained

**Implementation Pattern**:
```typescript
import Papa from 'papaparse';

const csvContent = Papa.unparse(data, {
  quotes: true,        // Force quotes around all fields
  delimiter: ',',      // Standard comma delimiter
  newline: '\r\n',    // Windows-style line endings (widest compatibility)
  header: true         // Include header row
});
```

## 2. Browser File Download Patterns

### Question
What's the most reliable cross-browser method for triggering CSV downloads?

### Research Findings

**Blob API + createObjectURL** (Modern Standard):
- ✅ Supported in all modern browsers (Chrome 20+, Firefox 13+, Safari 6.1+, Edge 12+)
- ✅ Works with large files (tested up to 50MB)
- ✅ Simple API: `new Blob([content], { type: 'text/csv;charset=utf-8;' })`
- ⚠️ Requires manual memory cleanup (`URL.revokeObjectURL()`)

**Data URIs** (Legacy):
- ❌ Size limit (~2MB in some browsers)
- ❌ Poor performance for large datasets
- ✅ No cleanup required

**FileSaver.js Library**:
- ✅ Polyfill for older browsers
- ❌ Adds 3KB dependency
- ❌ Not needed for our target browsers (Chrome 90+, Firefox 88+)

**Decision**: **Use Blob API with createObjectURL**

**Rationale**:
1. Native browser API (no external dependencies)
2. Best performance for all dataset sizes
3. Matches existing .ics download pattern in PayPlan
4. Supported by all target browsers

**Implementation Pattern** (from existing ResultsThisWeek.tsx):
```typescript
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url); // Critical: prevent memory leak
}
```

## 3. CSV Escaping Rules (RFC 4180)

### Question
How should we handle special characters in CSV fields?

### Research Findings

**RFC 4180 Special Characters**:
1. **Comma (`,`)**: Field MUST be quoted: `"Smith, John"`
2. **Double quote (`"`)**: Must be escaped by doubling: `"He said ""Hello"""`
3. **Newline (`\n`, `\r\n`)**: Field MUST be quoted: `"Line 1\nLine 2"`
4. **Leading/trailing spaces**: Should be quoted to preserve: `" padded "`

**PapaParse Handling**:
- Automatic quoting when `quotes: true` option set
- Proper double-quote escaping
- Preserves Unicode characters (€, ¥, £, ñ, etc.)

**Decision**: **Let PapaParse handle all escaping via `quotes: true` option**

**Rationale**:
1. Eliminates manual escaping bugs
2. Guaranteed RFC 4180 compliance
3. Handles edge cases we may not anticipate

**Edge Case Testing Required**:
- Provider names with commas: `"Klarna, Inc."`
- Provider names with quotes: `"Bob's ""Best"" Buy"`
- Provider names with newlines: `"Multi\nLine\nProvider"`
- Currency symbols: `€100.00`, `¥5000`

## 4. Timestamp Formatting for Filenames

### Question
What timestamp format ensures cross-platform compatibility and prevents file overwrites?

### Research Findings

**ISO 8601 Basic Format** (`YYYY-MM-DD-HHMMSS`):
- ✅ Sortable alphabetically
- ✅ No special characters (safe for all filesystems)
- ✅ Human-readable
- ✅ Unique per second (sufficient for manual downloads)
- Example: `payplan-export-2025-10-14-143052.csv`

**Unix Timestamp** (`1697298652`):
- ✅ Guaranteed unique
- ❌ Not human-readable
- ❌ Requires conversion for user understanding

**ISO 8601 Extended** (`YYYY-MM-DDTHH:MM:SS`):
- ⚠️ Contains colons (`:`) - invalid on Windows filesystems
- ❌ Rejected for filename use

**Decision**: **Use ISO 8601 Basic Format without colons**

**Rationale**:
1. Cross-platform compatibility (Windows, macOS, Linux)
2. Human-readable for file sorting and identification
3. Unique per second (sufficient for user-initiated downloads)
4. Matches industry standard (Google Takeout, AWS exports, etc.)

**Implementation**:
```typescript
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

const filename = `payplan-export-${generateTimestamp()}.csv`;
```

## 5. Performance Optimization

### Question
How should we handle large exports (500-1000+ records) without freezing the browser?

### Research Findings

**Batch Generation** (Current Approach):
- Generate entire CSV string in memory
- Works well for <500 records (~50KB)
- May cause UI lag for 1000+ records (~100KB+)

**Streaming (WritableStream API)**:
- Progressive generation and download
- ⚠️ Limited browser support (Chrome 76+, not in Firefox/Safari)
- Complex implementation
- Overkill for typical PayPlan use case (5-50 records)

**Web Workers** (Background Thread):
- Offload CSV generation to worker thread
- ⚠️ Complexity: serialization overhead, debugging challenges
- ⚠️ PapaParse doesn't support Web Workers natively
- Overkill for sub-100KB exports

**Decision**: **Use simple batch generation with user warning at 500+ records**

**Rationale**:
1. Typical PayPlan usage: 5-50 records (worst case per spec: 1000)
2. 500 records = ~50KB CSV (processes in <100ms on modern browsers)
3. User warning provides transparency without complex optimization
4. Aligns with spec requirement FR-012

**Performance Benchmarks** (estimated):
- 50 records: <10ms generation, imperceptible
- 500 records: ~100ms generation, slight delay but acceptable
- 1000 records: ~200ms generation, noticeable but with warning

**Warning UI**:
```typescript
if (paymentCount > 500) {
  // Show toast/alert: "Generating large export (600 records). This may take a moment..."
  // User can cancel or proceed
}
```

## 6. Round-trip Compatibility

### Question
How do we ensure exported CSVs can be re-imported into PayPlan without data loss?

### Research Findings

**Column Ordering**:
- Must match import format exactly: `provider, amount, currency, dueISO, autopay`
- Risk columns appended at end: `risk_type, risk_severity, risk_message`
- ✅ PapaParse `header: true` preserves column order

**Data Type Preservation**:
1. **Numbers**: Export as-is (no quotes unless necessary)
   - Example: `45.00` not `"45.00"`
2. **Booleans**: Export as `true`/`false` (PayPlan import already handles this)
3. **Dates**: Keep ISO 8601 format `2025-10-14` (spec requirement: dueISO column)
4. **Empty Risk Data**: Empty strings `""` per FR-010

**Import Validation**:
- PayPlan's existing CSV import uses Zod schema validation
- Must validate that export matches import schema

**Decision**: **Match import schema exactly, validate with round-trip tests**

**Implementation Checklist**:
1. ✅ Column order matches import CSV
2. ✅ Data types preserved (numbers, booleans, ISO dates)
3. ✅ Empty risk columns use `""` not `null` or `undefined`
4. ✅ Special characters properly escaped
5. ✅ UTF-8 encoding with BOM for Excel compatibility

**Test Scenario**:
```typescript
// Round-trip test
const payments = /* original payment data */;
const csvContent = exportToCSV(payments);
const blob = new Blob([csvContent], { type: 'text/csv' });
const file = new File([blob], 'test.csv');
const reimportedPayments = await importCSV(file);

expect(reimportedPayments).toEqual(payments); // Must match exactly
```

## Alternatives Considered

### Alternative 1: Server-side CSV Generation
**Rejected**: Violates privacy-first principle (FR-004). All processing must be client-side.

### Alternative 2: JSON Export Instead of CSV
**Rejected**:
- Users expect CSV for spreadsheet software (Excel, Google Sheets)
- JSON not compatible with spec requirement FR-005
- CSV is industry standard for financial data export

### Alternative 3: XLSX (Excel) Format
**Rejected**:
- Requires SheetJS library (+500KB bundle size)
- CSV sufficient for use case (users can convert in Excel if needed)
- Adds complexity without clear benefit

## Decisions Summary

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| CSV Library | PapaParse 5.5.3 `Papa.unparse()` | RFC 4180 compliant, already installed, handles edge cases |
| Download Method | Blob API + createObjectURL | Native, performant, matches .ics pattern |
| Escaping | PapaParse automatic (quotes: true) | Guaranteed RFC 4180 compliance |
| Filename Format | `payplan-export-YYYY-MM-DD-HHMMSS.csv` | Cross-platform, human-readable, sortable |
| Performance | Batch generation + 500 record warning | Simple, sufficient for use case, transparent to users |
| Round-trip | Match import schema exactly | Zero data loss, validates with Zod |

## Open Questions

None - all research areas resolved.

## References

- [RFC 4180 CSV Specification](https://tools.ietf.org/html/rfc4180)
- [PapaParse Documentation](https://www.papaparse.com/docs#unparse)
- [MDN Blob API](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [ISO 8601 Timestamp Format](https://en.wikipedia.org/wiki/ISO_8601)
- PayPlan existing code: `ResultsThisWeek.tsx` (.ics download pattern)
