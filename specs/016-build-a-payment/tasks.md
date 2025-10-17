# Tasks: Payment History Archive System

## Phase 1: Setup & Dependencies
- [ ] T001 [P] Create React PaymentContext for sharing payment data in frontend/src/contexts/PaymentContext.tsx
- [ ] T002 [P] Update Home.tsx to provide PaymentContext wrapper in frontend/src/pages/Home.tsx
- [ ] T003 [P] Create archive types file with Archive, ArchiveMetadata, PaymentArchiveRecord in frontend/src/lib/archive/types.ts
- [ ] T004 [P] Create archive constants file with storage keys, limits (50 archives, 5MB) in frontend/src/lib/archive/constants.ts
- [ ] T005 [P] Create archive validation schemas using Zod in frontend/src/lib/archive/validation.ts
- [ ] T006 [P] Create archive utils for UUID generation, timestamp formatting in frontend/src/lib/archive/utils.ts

## Phase 2: Foundational Layer
- [ ] T007 [P] Write test: ArchiveStorage.createDefaultIndex() returns empty ArchiveIndex in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T008 Implement ArchiveStorage.createDefaultIndex() in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T009 [P] Write test: ArchiveStorage.loadArchiveIndex() handles missing key in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T010 Implement ArchiveStorage.loadArchiveIndex() with default fallback in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T011 [P] Write test: ArchiveStorage.calculateTotalSize() sums all archive data in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T012 Implement ArchiveStorage.calculateTotalSize() in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T013 [P] Write test: ArchiveStorage.handleStorageError() catches QuotaExceededError in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T014 Implement ArchiveStorage.handleStorageError() with error mapping in frontend/src/lib/archive/ArchiveStorage.ts

## Phase 3: User Story 1 - Create Payment Archive (P1 MVP)
Goal: Users can create named archive, snapshot statuses, reset to pending

- [ ] T015 [P] [US1] Write test: ArchiveService.createArchive() with valid name creates archive in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T016 [US1] Implement ArchiveService.createArchive() skeleton in frontend/src/lib/archive/ArchiveService.ts
- [ ] T017 [P] [US1] Write test: joinPaymentsWithStatuses() combines payment data + status in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T018 [US1] Implement joinPaymentsWithStatuses() to create PaymentArchiveRecord[] in frontend/src/lib/archive/ArchiveService.ts
- [ ] T019 [P] [US1] Write test: calculateArchiveMetadata() returns total/paid/pending/failed counts in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T020 [US1] Implement calculateArchiveMetadata() with date range extraction in frontend/src/lib/archive/ArchiveService.ts
- [ ] T021 [P] [US1] Write test: ensureUniqueName() auto-appends " (2)" for duplicate names in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T022 [US1] Implement ensureUniqueName() with recursive increment logic in frontend/src/lib/archive/ArchiveService.ts
- [ ] T023 [P] [US1] Write test: ArchiveStorage.saveArchive() persists to localStorage with payplan_archive_{id} key in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T024 [US1] Implement ArchiveStorage.saveArchive() with JSON serialization in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T025 [P] [US1] Write test: ArchiveStorage.updateIndex() adds new entry to archive index in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T026 [US1] Implement ArchiveStorage.updateIndex() with payplan_archive_index key in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T027 [P] [US1] Write test: createArchive() calls PaymentStatusStorage.clearAll() to reset statuses in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T028 [US1] Integrate PaymentStatusStorage.clearAll() call after successful archive save in frontend/src/lib/archive/ArchiveService.ts
- [ ] T029 [P] [US1] Write test: validateArchiveName() rejects empty/whitespace-only names in frontend/src/lib/archive/__tests__/validation.test.ts
- [ ] T030 [US1] Implement validateArchiveName() with trimming and Zod schema in frontend/src/lib/archive/validation.ts
- [ ] T031 [P] [US1] Write test: createArchive() throws error when payment list is empty in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T032 [US1] Implement empty payment check with descriptive error message in frontend/src/lib/archive/ArchiveService.ts
- [ ] T033 [P] [US1] Write test: createArchive() throws error when 50 archives exist in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T034 [US1] Implement archive count limit check (MAX_ARCHIVES = 50) in frontend/src/lib/archive/ArchiveService.ts
- [ ] T035 [P] [US1] Write test: createArchive() throws error when storage exceeds 5MB in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T036 [US1] Implement storage size limit check (MAX_STORAGE_SIZE = 5MB) in frontend/src/lib/archive/ArchiveService.ts
- [ ] T037 [P] [US1] Create CreateArchiveDialog component with form and warning text in frontend/src/components/archive/CreateArchiveDialog.tsx
- [ ] T038 [US1] Implement dialog form with name input, validation, and reset warning in frontend/src/components/archive/CreateArchiveDialog.tsx
- [ ] T039 [P] [US1] Create usePaymentArchives hook with createArchive, loading, error state in frontend/src/hooks/usePaymentArchives.ts
- [ ] T040 [US1] Integrate usePaymentArchives hook with CreateArchiveDialog for form submission in frontend/src/components/archive/CreateArchiveDialog.tsx
- [ ] T041 [P] [US1] Write test: CreateArchiveDialog shows success message after archive creation in frontend/src/components/archive/__tests__/CreateArchiveDialog.test.tsx
- [ ] T042 [US1] Implement success feedback and dialog close on successful archive in frontend/src/components/archive/CreateArchiveDialog.tsx

## Phase 4: User Story 2 - View Archived Payment History (P2)
Goal: Users can view archive list and detail pages (read-only)

- [ ] T043 [P] [US2] Write test: ArchiveStorage.loadArchive() retrieves archive by ID in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T044 [US2] Implement ArchiveStorage.loadArchive() with JSON parsing in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T045 [P] [US2] Write test: loadArchive() validates archive schema with Zod in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T046 [US2] Implement archive schema validation in loadArchive() with error handling in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T047 [P] [US2] Write test: loadArchive() handles corrupted JSON gracefully in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T048 [US2] Implement corrupted archive error handling with descriptive messages in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T049 [P] [US2] Create ArchiveListPage component with header and list container in frontend/src/pages/ArchiveListPage.tsx
- [ ] T050 [US2] Implement archive list rendering with usePaymentArchives hook in frontend/src/pages/ArchiveListPage.tsx
- [ ] T051 [P] [US2] Create ArchiveListItem component with name, date, counts display in frontend/src/components/archive/ArchiveListItem.tsx
- [ ] T052 [US2] Implement ArchiveListItem with click handler to navigate to detail in frontend/src/components/archive/ArchiveListItem.tsx
- [ ] T053 [P] [US2] Create ArchiveDetailView component with archive header and payment list in frontend/src/pages/ArchiveDetailView.tsx
- [ ] T054 [US2] Implement ArchiveDetailView with archive loading by ID from route params in frontend/src/pages/ArchiveDetailView.tsx
- [ ] T055 [P] [US2] Write test: ArchiveDetailView shows read-only payment records (no edit controls) in frontend/src/pages/__tests__/ArchiveDetailView.test.tsx
- [ ] T056 [US2] Ensure ArchiveDetailView UI has no edit buttons, checkboxes, or inputs in frontend/src/pages/ArchiveDetailView.tsx
- [ ] T057 [P] [US2] Write test: loadArchiveIndex() completes in <100ms for 20 archives in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T058 [US2] Optimize loadArchiveIndex() with lazy loading and caching in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T059 [P] [US2] Write test: ArchiveListPage shows empty state when no archives exist in frontend/src/pages/__tests__/ArchiveListPage.test.tsx
- [ ] T060 [US2] Implement empty state UI with "Create your first archive" message in frontend/src/pages/ArchiveListPage.tsx

## Phase 5: User Story 3 - View Archive Statistics (P3)
Goal: Users see totals, percentages, date range in statistics panel

- [ ] T061 [P] [US3] Write test: ArchiveService.calculateStatistics() returns count and percentage data in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T062 [US3] Implement calculateStatistics() with paid/pending/failed percentages in frontend/src/lib/archive/ArchiveService.ts
- [ ] T063 [P] [US3] Write test: formatDateRange() formats start and end dates consistently in frontend/src/lib/archive/__tests__/utils.test.ts
- [ ] T064 [US3] Implement formatDateRange() helper with locale-aware formatting in frontend/src/lib/archive/utils.ts
- [ ] T065 [P] [US3] Create ArchiveStatistics component with statistics panel layout in frontend/src/components/archive/ArchiveStatistics.tsx
- [ ] T066 [US3] Implement statistics display with counts, percentages, date range in frontend/src/components/archive/ArchiveStatistics.tsx
- [ ] T067 [P] [US3] Write test: calculateStatistics() handles all pending (0% paid) without error in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T068 [US3] Handle division by zero and 0% edge case in calculateStatistics() in frontend/src/lib/archive/ArchiveService.ts
- [ ] T069 [P] [US3] Write test: calculateStatistics() handles all paid (100% paid) without error in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T070 [US3] Handle 100% case and ensure proper rounding in calculateStatistics() in frontend/src/lib/archive/ArchiveService.ts
- [ ] T071 [P] [US3] Integrate ArchiveStatistics component into ArchiveDetailView in frontend/src/pages/ArchiveDetailView.tsx
- [ ] T072 [US3] Style ArchiveStatistics with consistent spacing and typography in frontend/src/components/archive/ArchiveStatistics.tsx

## Phase 6: User Story 4 - Export Archived Data to CSV (P4)
Goal: Users export archive with metadata columns to CSV

- [ ] T073 [P] [US4] Write test: ArchiveService.exportArchiveToCSV() generates CSV with 12 columns in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T074 [US4] Implement exportArchiveToCSV() skeleton with PapaParse integration in frontend/src/lib/archive/ArchiveService.ts
- [ ] T075 [P] [US4] Write test: transformArchiveToCSVRow() maps PaymentArchiveRecord to CSV row in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T076 [US4] Implement transformArchiveToCSVRow() with archive_name, archive_date columns in frontend/src/lib/archive/ArchiveService.ts
- [ ] T077 [P] [US4] Write test: CSV column order matches spec (10 payment + 2 archive columns) in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T078 [US4] Implement CSV column mapping in correct order per spec in frontend/src/lib/archive/ArchiveService.ts
- [ ] T079 [P] [US4] Write test: generateArchiveFilename() creates slugified filename with date in frontend/src/lib/archive/__tests__/utils.test.ts
- [ ] T080 [US4] Implement generateArchiveFilename() with slugify and ISO date in frontend/src/lib/archive/utils.ts
- [ ] T081 [P] [US4] Write test: exportArchiveToCSV() preserves Unicode characters in archive_name in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T082 [US4] Handle Unicode encoding in CSV export with UTF-8 BOM in frontend/src/lib/archive/ArchiveService.ts
- [ ] T083 [P] [US4] Write test: exportArchiveToCSV() completes in <3s for 50 payments in frontend/src/lib/archive/__tests__/ArchiveService.test.ts
- [ ] T084 [US4] Optimize CSV generation with streaming or batching if needed in frontend/src/lib/archive/ArchiveService.ts
- [ ] T085 [P] [US4] Create ExportArchiveButton component with download icon in frontend/src/components/archive/ExportArchiveButton.tsx
- [ ] T086 [US4] Integrate exportArchiveToCSV() with button click and blob download in frontend/src/components/archive/ExportArchiveButton.tsx
- [ ] T087 [P] [US4] Add ExportArchiveButton to ArchiveDetailView header in frontend/src/pages/ArchiveDetailView.tsx
- [ ] T088 [US4] Write test: CSV download triggers browser download with correct filename in frontend/src/components/archive/__tests__/ExportArchiveButton.test.tsx

## Phase 7: User Story 5 - Delete Old Archives (P5)
Goal: Users delete archives with confirmation to free storage

- [ ] T089 [P] [US5] Write test: ArchiveStorage.deleteArchive() removes archive from localStorage in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T090 [US5] Implement ArchiveStorage.deleteArchive() with localStorage.removeItem() in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T091 [P] [US5] Write test: deleteArchive() removes entry from archive index in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T092 [US5] Implement ArchiveStorage.removeFromIndex() and call from deleteArchive() in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T093 [P] [US5] Write test: deleteArchive() is idempotent (delete twice returns success) in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T094 [US5] Handle deletion of non-existent archive gracefully in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T095 [P] [US5] Create DeleteArchiveDialog component with confirmation warning in frontend/src/components/archive/DeleteArchiveDialog.tsx
- [ ] T096 [US5] Implement delete confirmation dialog with archive name display in frontend/src/components/archive/DeleteArchiveDialog.tsx
- [ ] T097 [P] [US5] Write test: usePaymentArchives.deleteArchive() updates local state after deletion in frontend/src/hooks/__tests__/usePaymentArchives.test.ts
- [ ] T098 [US5] Implement deleteArchive() in usePaymentArchives hook with state update in frontend/src/hooks/usePaymentArchives.ts
- [ ] T099 [P] [US5] Write test: Cross-tab storage event updates archive list on delete in frontend/src/hooks/__tests__/usePaymentArchives.test.ts
- [ ] T100 [US5] Implement storage event listener for cross-tab delete sync in frontend/src/hooks/usePaymentArchives.ts
- [ ] T101 [P] [US5] Write test: deleteArchive() completes in <3s in frontend/src/lib/archive/__tests__/ArchiveStorage.test.ts
- [ ] T102 [US5] Optimize deleteArchive() performance with minimal index operations in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T103 [P] [US5] Add delete button to ArchiveListItem with confirmation trigger in frontend/src/components/archive/ArchiveListItem.tsx
- [ ] T104 [US5] Add delete button to ArchiveDetailView with confirmation trigger in frontend/src/pages/ArchiveDetailView.tsx

## Phase 8: Polish & Cross-Cutting
- [ ] T105 [P] Write test: Cross-tab storage event updates archive list on create in frontend/src/hooks/__tests__/usePaymentArchives.test.ts
- [ ] T106 Implement storage event listener for cross-tab create sync in frontend/src/hooks/usePaymentArchives.ts
- [ ] T107 [P] Add loading states to ArchiveListPage with skeleton loaders in frontend/src/pages/ArchiveListPage.tsx
- [ ] T108 [P] Add loading states to ArchiveDetailView with skeleton loaders in frontend/src/pages/ArchiveDetailView.tsx
- [ ] T109 [P] Add loading states to CreateArchiveDialog during submission in frontend/src/components/archive/CreateArchiveDialog.tsx
- [ ] T110 [P] Create ArchiveErrorBoundary component for corrupted archive errors in frontend/src/components/archive/ArchiveErrorBoundary.tsx
- [ ] T111 [P] Wrap ArchiveDetailView with ArchiveErrorBoundary in frontend/src/pages/ArchiveDetailView.tsx
- [ ] T112 [P] Add performance logging for loadArchiveIndex() with <100ms target in frontend/src/lib/archive/ArchiveStorage.ts
- [ ] T113 [P] Add performance logging for exportArchiveToCSV() with <3s target in frontend/src/lib/archive/ArchiveService.ts
- [ ] T114 [P] Add ARIA labels to CreateArchiveDialog form elements in frontend/src/components/archive/CreateArchiveDialog.tsx
- [ ] T115 [P] Add keyboard navigation support to ArchiveListItem in frontend/src/components/archive/ArchiveListItem.tsx
- [ ] T116 [P] Add ARIA labels to DeleteArchiveDialog buttons in frontend/src/components/archive/DeleteArchiveDialog.tsx
- [ ] T117 [P] Update CLAUDE.md with Feature 016 technologies and commands in /home/matt/PROJECTS/PayPlan/CLAUDE.md
- [ ] T118 [P] Create archive feature documentation with API examples in /home/matt/PROJECTS/PayPlan/specs/016-build-a-payment/IMPLEMENTATION.md

## Dependencies

### Critical Path
Phase 1 (T001-T006) → Phase 2 (T007-T014) → All User Stories
- Phase 1 must complete first (types, constants, utils needed by all)
- Phase 2 must complete before any user stories (foundational storage layer)

### User Story Dependencies
- US1 (T015-T042): Create Archive - Must complete before US2, US3, US4, US5
  - Blocks: US2 needs archives to view, US3 needs archives for stats, US4 needs archives to export, US5 needs archives to delete
- US2 (T043-T060): View Archives - Independent after US1
- US3 (T061-T072): Statistics - Independent after US1, can run parallel with US2
- US4 (T073-T088): CSV Export - Independent after US1, can run parallel with US2, US3
- US5 (T089-T104): Delete Archives - Independent after US1, can run parallel with US2, US3, US4

### Parallel Execution Opportunities
After Phase 2 completes:
- US1 tasks (T015-T042) must run sequentially
After US1 completes:
- US2 tasks (T043-T060) can start
- US3 tasks (T061-T072) can run parallel with US2
- US4 tasks (T073-T088) can run parallel with US2, US3
- US5 tasks (T089-T104) can run parallel with US2, US3, US4
- Phase 8 tasks (T105-T118) can run parallel with US2-US5

### Integration Points
- T002: Home.tsx provides PaymentContext (needed by T040)
- T028: Integrate PaymentStatusStorage.clearAll() (depends on Feature 015)
- T074: Integrate PapaParse for CSV export (depends on Feature 014)
- T087: Add ExportArchiveButton to ArchiveDetailView (depends on T054, T086)
- T103-T104: Add delete buttons to views (depends on T095-T096)

## Task Estimates
- Phase 1 (Setup): 3-4 hours (6 tasks × 30 min)
- Phase 2 (Foundational): 2-3 hours (8 tasks × 20 min)
- Phase 3 (US1): 7-9 hours (28 tasks × 20 min)
- Phase 4 (US2): 4-5 hours (18 tasks × 15 min)
- Phase 5 (US3): 3-4 hours (12 tasks × 20 min)
- Phase 6 (US4): 4-5 hours (16 tasks × 20 min)
- Phase 7 (US5): 4-5 hours (16 tasks × 20 min)
- Phase 8 (Polish): 3-4 hours (14 tasks × 15 min)

**Total Estimate: 30-39 hours (118 tasks)**

## Testing Strategy
- TDD approach: Write test first, then implement
- Unit tests for all service and storage functions
- Component tests for all UI components
- Integration tests for end-to-end flows (create → view → export → delete)
- Performance tests for <100ms load, <3s export/delete targets
- Edge case tests for empty states, limits, corrupted data
- Cross-tab sync tests for storage events

## Success Criteria
- All 118 tasks completed and passing tests
- P1 (US1) complete: Users can create archives and reset statuses
- P2 (US2) complete: Users can view archive list and detail
- P3 (US3) complete: Users see statistics in detail view
- P4 (US4) complete: Users can export archives to CSV
- P5 (US5) complete: Users can delete archives with confirmation
- All performance targets met (<100ms load, <3s export/delete)
- Cross-tab sync working for create and delete operations
- Accessibility standards met (ARIA labels, keyboard navigation)
