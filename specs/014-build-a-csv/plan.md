# Implementation Plan: CSV Export for Payment Schedules

**Branch**: `014-build-a-csv` | **Date**: 2025-10-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-build-a-csv/spec.md`

## Summary

Add client-side CSV export functionality to PayPlan's results view, enabling users to download processed payment schedules in a standardized format compatible with spreadsheet software. Export will include core payment data (provider, amount, currency, dueISO, autopay) plus risk analysis columns (risk_type, risk_severity, risk_message) for round-trip compatibility and external analysis. Implementation uses RFC 4180-compliant CSV generation with PapaParse library, ISO 8601 timestamped filenames, and performance warnings for exports exceeding 500 records.

## Technical Context

**Language/Version**: TypeScript 5.8 (frontend), Node.js 20.x (backend)
**Primary Dependencies**: React 19, PapaParse 5.5.3 (CSV generation), Zod 4.1.11 (validation)
**Storage**: Client-side only (Blob API for downloads), no server storage
**Testing**: Vitest 3.2.4 with React Testing Library, jsdom for DOM simulation
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web application (frontend + backend separation)
**Performance Goals**: Generate and download CSV for 500 records in <2 seconds, warn users for 500+ records
**Constraints**: Client-side only (privacy-first), RFC 4180 compliance, round-trip compatibility
**Scale/Scope**: Support 1-1000 payment records per export, typical use case 5-50 records

## Constitution Check

*No project constitution defined - using standard web application best practices*

**Assumed Principles**:
- ✅ Privacy-first: No server uploads, client-side only processing
- ✅ Test-driven: Unit tests before implementation
- ✅ Accessibility: Keyboard navigation, ARIA labels, screen reader support
- ✅ Performance: <2s for typical datasets, warnings for edge cases

## Project Structure

### Documentation (this feature)

```
specs/014-build-a-csv/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: CSV generation research
├── data-model.md        # Phase 1: Data entities
├── quickstart.md        # Phase 1: Manual testing scenarios
└── tasks.md             # Phase 2: Implementation tasks (from /speckit.tasks)
```

### Source Code (repository root)

```
frontend/
├── src/
│   ├── components/
│   │   ├── ResultsThisWeek.tsx      # Add CSV download button here
│   │   └── ui/                       # shadcn/ui components
│   ├── services/
│   │   └── csvExportService.ts       # NEW: CSV generation logic
│   ├── types/
│   │   └── csvExport.ts              # NEW: TypeScript types for export
│   └── lib/
│       └── utils.ts                  # Utility functions
└── tests/
    ├── unit/
    │   └── csvExportService.test.ts  # NEW: Unit tests
    └── integration/
        └── csvExport.test.tsx        # NEW: Integration tests

backend/
└── (no changes - export is client-side only)
```

**Structure Decision**: Frontend-only feature using existing React component structure. CSV export button will be added to `ResultsThisWeek.tsx` component next to the existing "Download .ics" button. All CSV generation logic will be encapsulated in a new service layer (`csvExportService.ts`) to maintain separation of concerns.

## Complexity Tracking

*No constitution violations - standard web feature implementation*

## Phase 0: Research & Technical Decisions

### Research Tasks

1. **CSV Generation Libraries**: Evaluate PapaParse vs manual CSV generation for RFC 4180 compliance
2. **Browser File Download Patterns**: Research Blob API, URL.createObjectURL, and memory cleanup
3. **CSV Escaping Rules**: RFC 4180 special character handling (commas, quotes, newlines)
4. **Timestamp Formatting**: ISO 8601 format for filenames across platforms
5. **Performance Optimization**: Streaming vs batch generation for large datasets
6. **Round-trip Compatibility**: Ensure exported CSV can be re-imported without data loss

**Output**: `research.md` documenting decisions and rationale

## Phase 1: Design Artifacts

### Data Model

**Entities**:
1. **CSVExportData**: Aggregates payment data for export
2. **CSVRow**: Represents a single row in the export
3. **ExportMetadata**: Filename, timestamp, record count

See `data-model.md` for detailed entity definitions and validation rules.

### Testing Scenarios

1. **Basic Export**: 10 payments, all fields populated
2. **Empty Risk Data**: Payments with no detected risks (empty strings)
3. **Special Characters**: Provider names with commas, quotes, newlines
4. **Unicode**: Currency symbols (€, ¥, £) and non-ASCII characters
5. **Large Dataset**: 600 records with performance warning
6. **Round-trip**: Export → Re-import verification
7. **Edge Cases**: Zero payments, single payment, 1000+ payments

See `quickstart.md` for manual test procedures.

## Phase 2: Implementation Tasks

*Generated via `/speckit.tasks` command - not part of this plan*

## Progress Tracking

- [x] Phase 0: Research started
- [x] Phase 0: Research complete (`research.md`)
- [x] Phase 1: Data model defined (`data-model.md`)
- [x] Phase 1: Test scenarios documented (`quickstart.md`)
- [x] Phase 1: Agent context updated (CLAUDE.md)
- [x] Constitution re-check post-design (no violations)
- [x] Ready for `/speckit.tasks`

## Dependencies

### Existing Features
- CSV import functionality (column format reference)
- .ics download feature (UI placement and download pattern reference)
- Risk detection system (source for risk_type, risk_severity, risk_message)

### External Libraries
- **PapaParse 5.5.3**: Already installed, used for CSV parsing (will also use for generation)
- **Zod 4.1.11**: Already installed, used for schema validation
- No new dependencies required

### Browser APIs
- Blob API (file creation)
- URL.createObjectURL (download trigger)
- document.createElement('a') (programmatic download)

## Risk Assessment

**Low Risk**: Feature is self-contained, client-side only, and builds on existing patterns (.ics download).

**Potential Issues**:
1. **Memory**: Large exports (1000+ records) may cause browser memory issues
   - **Mitigation**: Warn users at 500+ records, consider streaming for 1000+
2. **Special Characters**: RFC 4180 escaping edge cases
   - **Mitigation**: Use battle-tested PapaParse library, comprehensive test coverage
3. **Cross-browser Compatibility**: Download behavior varies across browsers
   - **Mitigation**: Test on Chrome, Firefox, Safari, Edge; use standard Blob API

## Acceptance Criteria

From spec.md:

1. ✅ CSV button appears next to .ics button when payments exist
2. ✅ Exported CSV contains all required columns (provider, amount, currency, dueISO, autopay, risk_type, risk_severity, risk_message)
3. ✅ Filename uses format `payplan-export-YYYY-MM-DD-HHMMSS.csv`
4. ✅ Empty risk data uses empty strings ("")
5. ✅ Special characters properly escaped per RFC 4180
6. ✅ Unicode characters preserved (currency symbols, accents)
7. ✅ Warning displayed for 500+ records
8. ✅ Exported CSV can be re-imported without errors
9. ✅ Compatible with Excel, Google Sheets, LibreOffice
10. ✅ No server uploads (client-side only)

## Next Steps

1. **Now**: Generate Phase 0 research.md
2. **Then**: Generate Phase 1 artifacts (data-model.md, quickstart.md)
3. **Finally**: Run `/speckit.tasks` to generate implementation tasks
