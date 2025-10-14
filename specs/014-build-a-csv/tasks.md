# Implementation Tasks: CSV Export for Payment Schedules

**Feature**: CSV Export (014-build-a-csv)
**Branch**: `014-build-a-csv`
**Created**: 2025-10-14
**Estimated Time**: 6-8 hours

## Task Overview

Total: 23 tasks (8 setup/tests, 8 core implementation, 7 polish/integration)

**Parallelization**: Tasks marked with `[P]` can be run in parallel. Tasks without `[P]` must be run sequentially.

**TDD Approach**: All test tasks precede their implementation tasks.

## Task List

### Phase 1: Setup & Foundation (1-2 hours)

**T001** [P] - Create TypeScript types file
- **File**: `frontend/src/types/csvExport.ts`
- **Action**: Create type definitions from data-model.md
- **Includes**: PaymentRecord, CSVRow, ExportMetadata, CSVExportData interfaces
- **Includes**: Zod schemas (csvRowSchema, exportMetadataSchema, csvExportDataSchema)
- **Dependencies**: None
- **Estimated Time**: 30 min

**T002** [P] - Create CSV export service stub
- **File**: `frontend/src/services/csvExportService.ts`
- **Action**: Create empty service with function signatures
- **Functions**: `transformPaymentToCSVRow()`, `generateExportMetadata()`, `generateCSV()`, `downloadCSV()`
- **Dependencies**: None (can run parallel with T001)
- **Estimated Time**: 15 min

**T003** - Write unit test: transformPaymentToCSVRow
- **File**: `frontend/tests/unit/csvExportService.test.ts`
- **Action**: Write tests for PaymentRecord → CSVRow transformation
- **Test Cases**:
  - Basic transformation (all fields populated)
  - Empty risk data (undefined → empty strings)
  - Number formatting (45 → "45.00", 45.5 → "45.50")
  - Boolean conversion (true → "true", false → "false")
- **Dependencies**: T001, T002
- **Estimated Time**: 30 min

**T004** - Implement transformPaymentToCSVRow
- **File**: `frontend/src/services/csvExportService.ts`
- **Action**: Implement PaymentRecord → CSVRow transformation logic
- **Requirements**:
  - Format amount to 2 decimal places
  - Convert boolean to string
  - Handle undefined risk fields (use empty strings)
  - Validate output with Zod schema
- **Dependencies**: T003 (TDD: test first)
- **Estimated Time**: 20 min

**T005** - Write unit test: generateExportMetadata
- **File**: `frontend/tests/unit/csvExportService.test.ts`
- **Action**: Write tests for metadata generation
- **Test Cases**:
  - Filename format matches `payplan-export-YYYY-MM-DD-HHMMSS.csv`
  - Timestamp is valid ISO 8601
  - Record count accurate
  - shouldWarn = true for 501+ records, false for ≤500
- **Dependencies**: T001, T002
- **Estimated Time**: 20 min

**T006** - Implement generateExportMetadata
- **File**: `frontend/src/services/csvExportService.ts`
- **Action**: Implement metadata generation
- **Requirements**:
  - Generate timestamp in ISO 8601 basic format (no colons)
  - Create filename with timestamp
  - Set shouldWarn flag based on record count threshold (500)
  - Validate output with Zod schema
- **Dependencies**: T005 (TDD: test first)
- **Estimated Time**: 20 min

**T007** - Write unit test: generateCSV (PapaParse integration)
- **File**: `frontend/tests/unit/csvExportService.test.ts`
- **Action**: Write tests for CSV content generation
- **Test Cases**:
  - Header row present with correct column order
  - Special characters escaped (commas, quotes, newlines)
  - Unicode characters preserved (€, ¥, ñ)
  - Empty dataset produces header-only CSV
  - RFC 4180 compliance (use PapaParse.parse to verify)
- **Dependencies**: T001, T002
- **Estimated Time**: 30 min

**T008** - Implement generateCSV
- **File**: `frontend/src/services/csvExportService.ts`
- **Action**: Implement CSV content generation using PapaParse
- **Requirements**:
  - Use `Papa.unparse()` with config: `{ quotes: true, delimiter: ',', newline: '\r\n', header: true }`
  - Accept array of CSVRow objects
  - Return RFC 4180-compliant CSV string
  - Validate output is non-empty string
- **Dependencies**: T007 (TDD: test first)
- **Estimated Time**: 15 min

---

### Phase 2: Core Implementation (2-3 hours)

**T009** - Write unit test: downloadCSV (Blob API)
- **File**: `frontend/tests/unit/csvExportService.test.ts`
- **Action**: Write tests for file download trigger
- **Test Cases**:
  - Blob created with correct MIME type (`text/csv;charset=utf-8;`)
  - createObjectURL called
  - Anchor element created and clicked
  - revokeObjectURL called (memory cleanup)
  - Filename set correctly
- **Mocking**: Mock `URL.createObjectURL`, `URL.revokeObjectURL`, `document.createElement`
- **Dependencies**: T001, T002
- **Estimated Time**: 30 min

**T010** - Implement downloadCSV
- **File**: `frontend/src/services/csvExportService.ts`
- **Action**: Implement file download using Blob API
- **Requirements**:
  - Create Blob with UTF-8 charset
  - Generate object URL
  - Create anchor element with download attribute
  - Trigger click programmatically
  - Clean up object URL (prevent memory leak)
- **Dependencies**: T009 (TDD: test first)
- **Estimated Time**: 20 min

**T011** - Write integration test: Full export flow
- **File**: `frontend/tests/integration/csvExport.test.tsx`
- **Action**: Write end-to-end export test
- **Test Cases**:
  - Transform 10 PaymentRecords → export CSV
  - Verify CSV content matches expected output
  - Round-trip test: export → re-parse → compare
  - Large dataset (600 records) export
- **Dependencies**: T001-T010 (all core functions implemented)
- **Estimated Time**: 45 min

**T012** [P] - Add CSV download button to ResultsThisWeek component
- **File**: `frontend/src/components/ResultsThisWeek.tsx`
- **Action**: Add "Download CSV" button next to .ics button
- **Requirements**:
  - Position next to existing "Download .ics" button
  - Same styling as .ics button (variant="secondary")
  - Disabled when no payments exist
  - Accessible (keyboard nav, ARIA label)
- **Dependencies**: T010 (downloadCSV function exists)
- **Estimated Time**: 15 min

**T013** - Implement CSV export handler in ResultsThisWeek
- **File**: `frontend/src/components/ResultsThisWeek.tsx`
- **Action**: Wire up button click to export service
- **Requirements**:
  - Import csvExportService functions
  - Get payment data from props (need to pass normalized payments from parent)
  - Call transform → generate metadata → generate CSV → download
  - Handle errors gracefully (try/catch with user feedback)
- **Dependencies**: T012 (button exists)
- **Estimated Time**: 30 min

**T014** - Write component test: ResultsThisWeek with CSV button
- **File**: `frontend/tests/integration/ResultsThisWeek.test.tsx`
- **Action**: Write React Testing Library tests
- **Test Cases**:
  - Button renders when payments exist
  - Button hidden when no payments
  - Button click triggers download
  - Keyboard navigation works (Tab, Enter, Space)
- **Mocking**: Mock csvExportService
- **Dependencies**: T013 (component updated)
- **Estimated Time**: 30 min

**T015** [P] - Update parent component to pass normalized payments
- **File**: `frontend/src/pages/Import.tsx` (or Demo.tsx, check which renders ResultsThisWeek)
- **Action**: Pass normalized payment data to ResultsThisWeek component
- **Requirements**:
  - Extract normalized payments from API response
  - Pass as prop: `normalizedPayments={response.normalized}`
  - Update ResultsThisWeek prop types to accept payments array
- **Dependencies**: T013 (ResultsThisWeek expects payments prop)
- **Estimated Time**: 20 min

**T016** - Write integration test: Large dataset warning
- **File**: `frontend/tests/integration/csvExport.test.tsx`
- **Action**: Write test for 500+ record warning
- **Test Cases**:
  - Export 499 records: no warning
  - Export 500 records: no warning
  - Export 501 records: warning appears
  - Export 1000 records: warning appears, export still works
  - User can dismiss warning and proceed
- **Dependencies**: T001-T015 (core export working)
- **Estimated Time**: 30 min

---

### Phase 3: Polish & Edge Cases (2-3 hours)

**T017** - Implement performance warning UI
- **File**: `frontend/src/components/ResultsThisWeek.tsx`
- **Action**: Add warning toast/alert for large exports
- **Requirements**:
  - Check record count before export
  - Show warning if >500: "Generating large export (X records). This may take a moment..."
  - Use existing toast/alert component (check if PayPlan has one, or use shadcn Alert)
  - User can cancel or proceed
- **Dependencies**: T016 (test exists)
- **Estimated Time**: 30 min

**T018** [P] - Write unit tests: Edge cases
- **File**: `frontend/tests/unit/csvExportService.test.ts`
- **Action**: Test edge cases from quickstart.md
- **Test Cases**:
  - Zero payments (empty array)
  - Single payment
  - Provider name with comma: `"Klarna, Inc."`
  - Provider name with quotes: `"Bob's ""Best"" Buy"`
  - Provider name with newline
  - Currency symbols: €, ¥, £
  - Empty risk data (all three fields empty strings)
- **Dependencies**: T001-T010 (core functions implemented)
- **Estimated Time**: 45 min

**T019** [P] - Write accessibility tests
- **File**: `frontend/tests/integration/ResultsThisWeek.a11y.test.tsx`
- **Action**: Test keyboard navigation and screen reader support
- **Test Cases**:
  - Button receives focus (Tab key)
  - Enter key triggers download
  - Space key triggers download
  - ARIA label present: "Download CSV"
  - Warning message has role="alert" for screen readers
- **Use**: vitest-axe for automated a11y checks
- **Dependencies**: T012-T014 (button implemented and tested)
- **Estimated Time**: 30 min

**T020** - Add error handling and user feedback
- **File**: `frontend/src/components/ResultsThisWeek.tsx`
- **Action**: Improve error handling in export flow
- **Requirements**:
  - Try/catch around export logic
  - Display error toast if export fails
  - Log errors to console for debugging
  - Graceful degradation (don't crash app)
- **Dependencies**: T013 (export handler exists)
- **Estimated Time**: 20 min

**T021** - Write round-trip compatibility test
- **File**: `frontend/tests/integration/csvRoundTrip.test.ts`
- **Action**: Test export → re-import → compare
- **Test Cases**:
  - Export 10 payments, re-import, verify exact match
  - Export with special characters, re-import, verify preserved
  - Export with unicode, re-import, verify preserved
  - Export with empty risk data, re-import, verify empty strings
- **Mocking**: Mock file upload for re-import
- **Dependencies**: T011 (integration tests exist)
- **Estimated Time**: 45 min

**T022** [P] - Update documentation: README and inline comments
- **Files**: `README.md`, service files
- **Action**: Document CSV export feature
- **README Updates**:
  - Add "CSV Export" section to features list
  - Note round-trip compatibility
  - Mention RFC 4180 compliance
- **Code Comments**:
  - JSDoc comments for all public functions
  - Explain RFC 4180 escaping logic
  - Note performance considerations (500-record threshold)
- **Dependencies**: T001-T021 (all implementation complete)
- **Estimated Time**: 30 min

**T023** - Manual testing: Run quickstart.md scenarios
- **File**: `specs/014-build-a-csv/quickstart.md`
- **Action**: Execute all 10 manual test scenarios
- **Scenarios**:
  - Basic export (Dataset 1)
  - Empty risk data (Dataset 2)
  - Special characters (Dataset 3)
  - Unicode (Dataset 4)
  - Large dataset warning (Dataset 5)
  - Round-trip (Scenario 6)
  - Button states (Scenario 7)
  - Filename timestamp (Scenario 8)
  - Browser compatibility (Chrome, Firefox, Safari, Edge)
  - Edge cases (zero/single/500/1000+ payments)
- **Dependencies**: T001-T022 (all features implemented)
- **Estimated Time**: 90 min

---

## Execution Order

### Sequential (No Parallelization)

```
T001, T002 → T003 → T004 → T005 → T006 → T007 → T008 →
T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 →
T017 → T018, T019 → T020 → T021 → T022 → T023
```

### With Parallelization (Recommended)

**Batch 1** (parallel):
```bash
T001 [P] Create types
T002 [P] Create service stub
```

**Batch 2** (sequential, TDD cycle 1):
```bash
T003 Test: transformPaymentToCSVRow
T004 Implement: transformPaymentToCSVRow
```

**Batch 3** (sequential, TDD cycle 2):
```bash
T005 Test: generateExportMetadata
T006 Implement: generateExportMetadata
```

**Batch 4** (sequential, TDD cycle 3):
```bash
T007 Test: generateCSV
T008 Implement: generateCSV
```

**Batch 5** (sequential, TDD cycle 4):
```bash
T009 Test: downloadCSV
T010 Implement: downloadCSV
```

**Batch 6** (sequential):
```bash
T011 Integration test: full export flow
```

**Batch 7** (parallel):
```bash
T012 [P] Add CSV button to component
T015 [P] Update parent to pass payments
```

**Batch 8** (sequential):
```bash
T013 Implement CSV export handler
T014 Component test: ResultsThisWeek
```

**Batch 9** (sequential):
```bash
T016 Test: large dataset warning
T017 Implement: performance warning UI
```

**Batch 10** (parallel):
```bash
T018 [P] Edge case tests
T019 [P] Accessibility tests
```

**Batch 11** (sequential):
```bash
T020 Error handling
T021 Round-trip test
T022 [P] Documentation
```

**Batch 12** (final):
```bash
T023 Manual testing
```

## Task Dependencies Graph

```
         T001 [P]     T002 [P]
           │             │
           └─────┬───────┘
                 │
         ┌───────┴────────┬─────────────┬─────────────┐
         │                │             │             │
        T003             T005          T007          T009
         │                │             │             │
        T004             T006          T008          T010
         │                │             │             │
         └────────────────┴─────────────┴─────────────┘
                          │
                        T011
                          │
         ┌────────────────┴────────────────┐
         │                                 │
     T012 [P]                          T015 [P]
         │                                 │
         └────────────────┬────────────────┘
                          │
                        T013
                          │
                        T014
                          │
                        T016
                          │
                        T017
                          │
         ┌────────────────┴────────────────┐
         │                                 │
     T018 [P]                          T019 [P]
         │                                 │
         └────────────────┬────────────────┘
                          │
                        T020
                          │
                        T021
                          │
                     T022 [P]
                          │
                        T023
```

## Completion Checklist

### Phase 1: Setup & Foundation
- [X] T001: Types created
- [X] T002: Service stub created
- [X] T003: Transform test written
- [X] T004: Transform implemented
- [X] T005: Metadata test written
- [X] T006: Metadata implemented
- [X] T007: CSV generation test written
- [X] T008: CSV generation implemented

### Phase 2: Core Implementation
- [X] T009: Download test written
- [X] T010: Download implemented
- [X] T011: Integration test written
- [X] T012: Button added
- [X] T013: Export handler implemented
- [ ] T014: Component test written
- [X] T015: Parent updated
- [ ] T016: Warning test written

### Phase 3: Polish & Edge Cases
- [ ] T017: Warning UI implemented
- [ ] T018: Edge case tests written
- [ ] T019: A11y tests written
- [ ] T020: Error handling added
- [ ] T021: Round-trip test written
- [ ] T022: Documentation updated
- [ ] T023: Manual testing complete

## Notes

- **TDD Approach**: All test tasks (T003, T005, T007, T009, etc.) MUST pass before their implementation tasks
- **Parallel Execution**: Tasks marked `[P]` can be run simultaneously to save time
- **Estimated Total Time**: 6-8 hours (with parallelization), 8-10 hours (sequential)
- **Critical Path**: T001→T003→T004→T007→T008→T009→T010→T011→T013→T016→T017→T023
- **Quick Wins**: T001, T002 can start immediately in parallel

## Success Criteria

All tasks complete AND:
- ✅ All unit tests passing (T003-T010, T018)
- ✅ All integration tests passing (T011, T014, T016, T019, T021)
- ✅ Manual test scenarios passing (T023)
- ✅ No console errors during export
- ✅ CSV validates in Excel/Google Sheets
- ✅ Round-trip import works without data loss
