# Implementation Plan: Payment History Archive System

**Branch**: `016-build-a-payment` | **Date**: 2025-10-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-build-a-payment/spec.md`

**Note**: This plan follows the established Specify methodology patterns from Feature 015.

## Summary

Build a payment history archive system that allows users to create snapshots of their current payment status tracking data (from Feature 015) with user-defined names (e.g., "October 2025"), view historical archives in a read-only timeline view with summary statistics, export archived data to CSV with archive metadata, and delete old archives to manage storage. The system uses a two-tier localStorage strategy (archive index + individual archives) for optimal performance, maintains the privacy-first approach (local-only, no server), and enforces a 50-archive hard limit to prevent storage quota errors.

## Technical Context

**Language/Version**: TypeScript 5.8.3 (frontend), Node.js 20.x (backend)
**Primary Dependencies**: React 19.1.1, Zod 4.1.11 (validation), uuid 13.0.0 (unique IDs), Vitest 3.2.4 (testing), PapaParse 5.5.3 (CSV export)
**Storage**: Browser localStorage (privacy-first, no server persistence)
**Testing**: Vitest with @testing-library/react, jsdom for browser APIs
**Target Platform**: Web application (Vite 7.1.7 + React 19)
**Project Type**: Web (frontend-only feature, no backend changes)
**Performance Goals**:
  - Archive list loads in <100ms with 20 archives (SC-004)
  - Archive detail view loads in <100ms with 50 payments (SC-003)
  - Create archive in <5 seconds including name input (SC-001)
  - CSV export completes in <3 seconds for 50 payments (SC-006)
**Constraints**:
  - 100% persistence across browser sessions (SC-002)
  - Support 50 archives totaling ~500KB without storage errors (SC-008)
  - Maximum 50 archives hard limit (FR-017)
  - Archive names support Unicode (emoji, international text) (SC-009)
  - Total storage <5MB including Feature 015 current statuses (FR-018)
**Scale/Scope**:
  - 20 functional requirements
  - 5 user stories (P1-P5 prioritized)
  - Integration with 2 existing features (015-Payment Status, 014-CSV Export)
  - Estimated 45-50 TDD tasks across 5 phases

## Constitution Check

**Status**: ✅ PASSED (No project constitution defined - following established patterns)

**Notes**:
- No project constitution defined in `.specify/memory/constitution.md` (template only)
- Following established patterns from Feature 015 (Payment Status Tracking)
- Test-first approach will be applied per existing codebase patterns
- Privacy-first localStorage pattern already established
- Two-tier storage strategy (index + individual keys) optimizes for performance

## Project Structure

### Documentation (this feature)

```
specs/016-build-a-payment/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (already generated)
├── data-model.md        # Phase 1 output (already generated)
├── quickstart.md        # Phase 1 output (generated below)
├── contracts/           # Phase 1 output (generated below)
│   ├── ArchiveService.contract.md
│   └── ArchiveStorage.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
frontend/
├── src/
│   ├── components/
│   │   └── archive/                  # NEW: Archive UI components
│   │       ├── ArchiveList.tsx
│   │       ├── ArchiveListItem.tsx
│   │       ├── ArchiveDetailView.tsx
│   │       ├── ArchiveStatistics.tsx
│   │       ├── CreateArchiveDialog.tsx
│   │       ├── DeleteArchiveDialog.tsx
│   │       └── ExportArchiveButton.tsx
│   ├── hooks/
│   │   └── usePaymentArchives.ts     # NEW: React hook for archive management
│   ├── lib/
│   │   ├── archive/                  # NEW: Archive business logic
│   │   │   ├── ArchiveService.ts
│   │   │   ├── ArchiveStorage.ts
│   │   │   ├── types.ts
│   │   │   ├── validation.ts
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   └── payment-status/           # EXISTING: Feature 015 (integration point)
│   │       ├── PaymentStatusService.ts
│   │       └── PaymentStatusStorage.ts
│   ├── pages/
│   │   └── ArchiveHistoryPage.tsx    # NEW: Archive history view page
│   └── utils/
│       └── csv-export.ts             # UPDATE: Extend for archive export
└── tests/
    ├── unit/
    │   └── archive/                  # NEW: Unit tests
    │       ├── ArchiveStorage.test.ts
    │       ├── ArchiveService.test.ts
    │       └── utils.test.ts
    ├── integration/
    │   └── archive/                  # NEW: Integration tests
    │       ├── create-archive.test.ts
    │       ├── view-archive.test.ts
    │       ├── export-archive.test.ts
    │       └── delete-archive.test.ts
    └── contract/
        └── archive/                  # NEW: Contract tests
            ├── ArchiveStorage.contract.test.ts
            └── ArchiveService.contract.test.ts
```

**Structure Decision**: Web application structure (frontend-only) following Feature 015 patterns. Archive feature is frontend-only using established localStorage patterns. No backend changes required - privacy-first design means no server persistence. Integrates with existing Feature 015 (PaymentStatusService) for snapshot creation and Feature 014 (CSV export) for archive data export.

## Complexity Tracking

N/A - No constitution violations detected. Following established patterns from Feature 015 with similar architecture (Storage + Service + React Hook + UI Components).

---

## Phase Breakdown

### Phase 0: Research & Design ✅ COMPLETE

**Deliverables**:
- [x] research.md - Technical decisions and architecture
- [x] data-model.md - Entity definitions and relationships
- [x] spec.md - Functional requirements and user stories

**Key Decisions Made**:
- Two-tier localStorage strategy (index + separate archive keys)
- Archive immutability (no update operations)
- 50-archive hard limit with 80% storage warnings
- Deep copy snapshot creation + reset current statuses
- Unicode archive name support with auto-duplicate handling
- Lazy loading pattern for archive details

---

### Phase 1: Setup & Types (Foundational)

**Purpose**: Core type definitions and validation that ALL user stories depend on

**Tasks** (~7-10 tasks):
- Create Archive, ArchiveMetadata, DateRange, ArchiveIndex, ArchiveSummary types
- Create Zod validation schemas for all entities
- Define ArchiveError types and Result<T, E> pattern
- Create archive constants (keys, limits, error messages)
- Create utility functions (UUID generation, metadata calculation, name sanitization)
- Create ArchiveStorage class skeleton
- Create ArchiveService class skeleton

**Checkpoint**: Type system ready - all user stories can reference these types

---

### Phase 2: User Story 1 - Create Payment Archive (Priority: P1) 🎯 MVP

**Goal**: Enable users to snapshot current payment statuses with a name, save to localStorage, and reset current statuses

**Independent Test**: Mark 6/10 payments as paid → create archive "October 2025" → verify archive saved → verify current statuses reset to pending

**Tasks** (~10-12 tasks):
- **Tests** (TDD - write FIRST, must FAIL):
  - Unit test: ArchiveStorage.saveArchive()
  - Unit test: ArchiveStorage.updateIndex()
  - Unit test: ArchiveService.createArchive()
  - Unit test: calculateArchiveMetadata()
  - Unit test: ensureUniqueName()
  - Contract test: ArchiveStorage contract
  - Contract test: ArchiveService contract
  - Integration test: Create archive → localStorage persistence

- **Implementation**:
  - Implement ArchiveStorage.saveArchive()
  - Implement ArchiveStorage.updateIndex()
  - Implement ArchiveStorage.loadArchiveIndex()
  - Implement ArchiveService.createArchive() (integrates with Feature 015)
  - Implement metadata calculation utilities
  - Implement name validation and deduplication
  - Create CreateArchiveDialog component
  - Create usePaymentArchives hook (createArchive action)

**Checkpoint**: User Story 1 complete - users can create archives ✅

---

### Phase 3: User Story 2 - View Archived Payment History (Priority: P2)

**Goal**: Display list of archives and enable viewing individual archive details (read-only)

**Independent Test**: Create 3 archives → navigate to archive history → see list → click archive → view details

**Tasks** (~8-10 tasks):
- **Tests** (TDD - write FIRST, must FAIL):
  - Unit test: ArchiveStorage.loadArchive()
  - Unit test: ArchiveStorage.loadArchiveIndex()
  - Unit test: ArchiveService.getArchiveById()
  - Unit test: ArchiveService.listArchives()
  - Integration test: View archive list → load archive detail

- **Implementation**:
  - Implement ArchiveStorage.loadArchive()
  - Implement ArchiveStorage.loadArchiveIndex() (if not from P1)
  - Implement ArchiveService.getArchiveById()
  - Implement ArchiveService.listArchives()
  - Create ArchiveList component
  - Create ArchiveListItem component (memoized for performance)
  - Create ArchiveDetailView component (read-only display)
  - Create ArchiveHistoryPage (route + layout)
  - Update usePaymentArchives hook (load actions)

**Checkpoint**: User Story 2 complete - users can view archived history ✅

---

### Phase 4: User Story 3 - View Archive Statistics (Priority: P3)

**Goal**: Display summary statistics (counts, percentages, date ranges) for archives

**Independent Test**: Create archive with 15/20 paid → view archive → see "Total: 20, Paid: 15 (75%), Pending: 5 (25%)"

**Tasks** (~5-7 tasks):
- **Tests** (TDD - write FIRST, must FAIL):
  - Unit test: calculateArchiveStatistics()
  - Unit test: formatDateRange()
  - Unit test: calculatePercentages()
  - Integration test: Statistics displayed correctly

- **Implementation**:
  - Implement statistics calculation utilities
  - Implement date range formatting
  - Create ArchiveStatistics component
  - Integrate statistics into ArchiveDetailView
  - Add summary stats to ArchiveListItem

**Checkpoint**: User Story 3 complete - archives show statistics ✅

---

### Phase 5: User Story 4 - Export Archived Data to CSV (Priority: P4)

**Goal**: Export archive contents to CSV with archive metadata columns

**Independent Test**: Create archive → click "Export to CSV" → verify file downloads with correct format

**Tasks** (~6-8 tasks):
- **Tests** (TDD - write FIRST, must FAIL):
  - Unit test: exportArchiveToCSV()
  - Unit test: generateArchiveCSVFilename()
  - Integration test: CSV export with archive metadata
  - Integration test: Empty archive export (edge case)

- **Implementation**:
  - Implement exportArchiveToCSV() (extends Feature 014 pattern)
  - Implement CSV filename generation (sanitization)
  - Create ExportArchiveButton component
  - Integrate with ArchiveDetailView
  - Update usePaymentArchives hook (export action)

**Checkpoint**: User Story 4 complete - archives can be exported ✅

---

### Phase 6: User Story 5 - Delete Old Archives (Priority: P5)

**Goal**: Allow users to delete archives with confirmation dialog to free storage

**Independent Test**: Create archive → click "Delete" → confirm → verify archive removed and storage freed

**Tasks** (~6-8 tasks):
- **Tests** (TDD - write FIRST, must FAIL):
  - Unit test: ArchiveStorage.deleteArchive()
  - Unit test: ArchiveService.deleteArchive()
  - Integration test: Delete with confirmation
  - Integration test: Cancel delete (no changes)
  - Integration test: Storage size decreases after delete

- **Implementation**:
  - Implement ArchiveStorage.deleteArchive()
  - Implement ArchiveStorage.removeFromIndex()
  - Implement ArchiveService.deleteArchive()
  - Create DeleteArchiveDialog component (confirmation)
  - Integrate delete button into ArchiveListItem
  - Update usePaymentArchives hook (delete action)

**Checkpoint**: User Story 5 complete - archives can be deleted ✅

---

### Phase 7: Polish & Integration

**Purpose**: Cross-cutting concerns, accessibility, error handling, final validation

**Tasks** (~8-10 tasks):
- **Accessibility**:
  - ARIA labels for archive list and buttons
  - Keyboard navigation for archive selection
  - Screen reader support for statistics
  - Focus management in dialogs

- **Error Handling**:
  - QuotaExceeded error display (storage full)
  - LimitReached error display (50 archives)
  - Corrupted archive recovery (graceful fallback)
  - Archive not found error handling

- **Performance**:
  - Performance test: Load 20 archives in <100ms
  - Performance test: Load 50-payment archive in <100ms
  - Lazy loading verification
  - Memoization validation

- **Integration**:
  - Cross-tab synchronization testing
  - Integration with Feature 015 reset action
  - CSV export integration testing
  - Final E2E workflow test (create → view → export → delete)

- **Documentation**:
  - Update CLAUDE.md with archive feature technologies
  - Code cleanup and JSDoc comments
  - Contract verification

**Checkpoint**: Feature 016 complete and production-ready ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup & Types (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Phase 1 completion - BLOCKS all other stories
- **User Story 2 (Phase 3)**: Depends on Phase 1 - Can run in parallel with US1 if staffed
- **User Story 3 (Phase 4)**: Depends on Phase 3 (needs archive viewing)
- **User Story 4 (Phase 5)**: Depends on Phase 3 (needs archive loading)
- **User Story 5 (Phase 6)**: Depends on Phase 2 (needs archive list)
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 1 - Independent testable (needs P1's storage but not UI)
- **User Story 3 (P3)**: Depends on User Story 2 (needs archive viewing UI)
- **User Story 4 (P4)**: Depends on User Story 2 (needs archive loading)
- **User Story 5 (P5)**: Depends on User Story 2 (needs archive list UI)

### Parallel Opportunities

**Within Each User Story**:
- All test tasks can be written in parallel
- Storage methods can be implemented in parallel (different methods)
- Service methods can be implemented in parallel (different methods)
- UI components can be built in parallel (different files)

**User Stories**: P2, P4, P5 can be worked on in parallel by different developers (after P1 foundation)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup & Types
2. Complete Phase 2: User Story 1
   - Write tests FIRST ✅
   - Verify tests FAIL ❌
   - Implement
   - Verify tests PASS ✅
3. **STOP and VALIDATE**: Run quickstart.md Scenario 1 manually
4. Deploy/demo if ready - MVP delivered! 🎯

### Incremental Delivery

1. Setup & Types → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! 🎯)
3. Add User Story 2 → Test independently → Deploy/Demo (Viewing ✅)
4. Add User Story 3 → Test independently → Deploy/Demo (Statistics ✅)
5. Add User Story 4 → Test independently → Deploy/Demo (Export ✅)
6. Add User Story 5 → Test independently → Deploy/Demo (Deletion ✅)
7. Polish Phase → Final validation → Production release 🚀

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 together (Setup & Types)
2. Once Phase 1 is done:
   - **Developer A**: User Story 1 (P1) - Core archive creation
   - **Developer B**: User Story 2 (P2) - Archive viewing (needs P1's storage API)
   - **Developer C**: User Story 4 (P4) - CSV export (can start structure)
   - **Developer D**: User Story 5 (P5) - Archive deletion (can start structure)
3. After P2 complete:
   - **Developer C**: User Story 3 (P3) - Statistics (needs P2's viewing UI)
4. Team collaborates on Phase 7 (Polish)

---

## Task Summary

**Estimated Total Tasks**: 45-50

**By Phase**:
- Phase 1 (Setup): ~7-10 tasks
- Phase 2 (US1 - MVP): ~10-12 tasks (5-6 tests + 5-6 implementation)
- Phase 3 (US2): ~8-10 tasks (4-5 tests + 4-5 implementation)
- Phase 4 (US3): ~5-7 tasks (3-4 tests + 2-3 implementation)
- Phase 5 (US4): ~6-8 tasks (3-4 tests + 3-4 implementation)
- Phase 6 (US5): ~6-8 tasks (3-4 tests + 3-4 implementation)
- Phase 7 (Polish): ~8-10 tasks

**By User Story**:
- US1 (Create Archive): ~10-12 tasks
- US2 (View Archives): ~8-10 tasks
- US3 (View Statistics): ~5-7 tasks
- US4 (Export CSV): ~6-8 tasks
- US5 (Delete Archives): ~6-8 tasks

**Test Coverage**:
- Unit tests: ~20 tasks
- Contract tests: ~2 tasks
- Integration tests: ~10 tasks
- Performance tests: ~2 tasks
- **Total test tasks**: ~34 (68% of all tasks are tests)

---

## Integration Points

### With Feature 015 (Payment Status Tracking)

**Dependency**: Feature 015 MUST be fully implemented

**Integration**:
```typescript
// In ArchiveService.createArchive()
const currentStatuses = paymentStatusService.loadStatuses();  // Feature 015
const payments = Array.from(currentStatuses.value.statuses.values());

// Create archive...

await paymentStatusService.clearAll();  // Reset Feature 015 statuses
```

**Files to integrate**:
- `frontend/src/lib/payment-status/PaymentStatusService.ts`
- `frontend/src/lib/payment-status/PaymentStatusStorage.ts`
- `frontend/src/lib/payment-status/types.ts`

### With Feature 014 (CSV Export)

**Dependency**: Feature 014 CSV export pattern

**Integration**:
```typescript
// Extend existing CSV export utilities
import Papa from 'papaparse';  // Feature 014

function exportArchiveToCSV(archive: Archive): string {
  const rows = archive.payments.map(payment => ({
    // ... existing payment fields
    archive_name: archive.name,
    archive_date: archive.createdAt.split('T')[0]
  }));

  return Papa.unparse(rows, { /* ... */ });
}
```

**Files to integrate**:
- `frontend/src/utils/csv-export.ts` (may need extension)

---

## Risk Mitigation

### Storage Quota Risks

**Risk**: Users hit 5MB localStorage limit unexpectedly

**Mitigation**:
- Hard limit: 50 archives (FR-017)
- Warning at 80% capacity (research.md Section 4)
- Block new archives at 95% capacity
- Clear deletion workflow (US5)

### Performance Risks

**Risk**: Archive list slow with 50+ archives

**Mitigation**:
- Two-tier storage (load only index, not all archives)
- Lazy loading for archive details
- Memoized list items (React.memo)
- Performance tests for targets (SC-003, SC-004)

### Data Integrity Risks

**Risk**: Corrupted archive data breaks UI

**Mitigation**:
- Zod validation on every read
- Graceful fallback to empty state
- Corrupted archive auto-cleanup option
- localStorage corruption recovery (Feature 015 pattern)

---

## Success Metrics

**Feature is ready for production when**:
- ✅ All 5 user stories pass independent tests
- ✅ All 10 success criteria (SC-001 through SC-010) met
- ✅ All 20 functional requirements (FR-001 through FR-020) implemented
- ✅ Manual testing scenarios (quickstart.md) pass 100%
- ✅ Test coverage >60% (following Feature 015 pattern of 54%)
- ✅ No performance regressions (all <100ms targets met)
- ✅ Cross-browser compatibility verified (Chrome, Firefox, Safari, Edge)
- ✅ Accessibility audit passes WCAG 2.1 AA (if applicable)

---

**Next Phase**: Generate quickstart.md manual testing scenarios and contracts/ directory with API contracts.
