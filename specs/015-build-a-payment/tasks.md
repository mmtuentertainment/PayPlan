# Tasks: Payment Status Tracking System

**Input**: Design documents from `/specs/015-build-a-payment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This feature follows Test-Driven Development (TDD). All tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Backend**: No backend changes required (privacy-first localStorage only)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions that ALL user stories depend on

- [x] T001 Ensure uuid package (v13.0.0) is installed in frontend/package.json
- [x] T002 [P] Create PaymentStatusRecord type in frontend/src/lib/payment-status/types.ts
- [x] T003 [P] Create PaymentStatusCollection type in frontend/src/lib/payment-status/types.ts
- [x] T004 [P] Create StorageError type and Result<T, E> types in frontend/src/lib/payment-status/types.ts
- [x] T005 [P] Create Zod schemas for validation in frontend/src/lib/payment-status/validation.ts
- [x] T006 [P] Define storage constants (keys, version, limits) in frontend/src/lib/payment-status/constants.ts
- [x] T007 [P] Extend Payment type with optional id, paid_status, paid_timestamp fields in frontend/src/types/csvExport.ts

**Checkpoint**: ✅ Type system ready - all user stories can reference these types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create PaymentStatusStorage class skeleton in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [x] T009 Create PaymentStatusService class skeleton in frontend/src/lib/payment-status/PaymentStatusService.ts
- [x] T010 [P] Add UUID generation utility function (v4) in frontend/src/lib/payment-status/utils.ts
- [x] T011 [P] Add timestamp formatting utility (ISO 8601) in frontend/src/lib/payment-status/utils.ts

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Mark Individual Payment as Paid (Priority: P1) 🎯 MVP

**Goal**: Enable users to mark a single payment as paid/pending with visual feedback and localStorage persistence

**Independent Test**: Load payment schedule → click checkbox → verify visual change → refresh page → verify persistence

### Tests for User Story 1 (TDD - Write FIRST, must FAIL)

- [x] T012 [P] [US1] Unit test: PaymentStatusStorage.saveStatus() in frontend/tests/unit/payment-status/PaymentStatusStorage.test.ts
- [x] T013 [P] [US1] Unit test: PaymentStatusStorage.loadStatuses() in frontend/tests/unit/payment-status/PaymentStatusStorage.test.ts
- [x] T014 [P] [US1] Unit test: PaymentStatusStorage.getStatus() in frontend/tests/unit/payment-status/PaymentStatusStorage.test.ts
- [x] T015 [P] [US1] Unit test: PaymentStatusService.markAsPaid() in frontend/tests/unit/payment-status/PaymentStatusService.test.ts
- [x] T016 [P] [US1] Unit test: PaymentStatusService.markAsPending() in frontend/tests/unit/payment-status/PaymentStatusService.test.ts
- [x] T017 [P] [US1] Unit test: PaymentStatusService.toggleStatus() in frontend/tests/unit/payment-status/PaymentStatusService.test.ts
- [x] T018 [P] [US1] Contract test: PaymentStatusStorage contract in frontend/tests/contract/payment-status/PaymentStatusStorage.contract.test.ts
- [x] T019 [P] [US1] Contract test: PaymentStatusService contract in frontend/tests/contract/payment-status/PaymentStatusService.contract.test.ts
- [x] T020 [P] [US1] Integration test: Mark payment → localStorage persistence → page refresh in frontend/tests/integration/payment-status/mark-single-payment.test.ts

**✅ All tests written - Verifying tests FAIL before implementation...**

### Implementation for User Story 1

#### Storage Layer (T021-T027)

- [x] T021 [P] [US1] Implement PaymentStatusStorage.saveStatus() method per contract in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [x] T022 [P] [US1] Implement PaymentStatusStorage.loadStatuses() method per contract in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [x] T023 [P] [US1] Implement PaymentStatusStorage.getStatus() method per contract in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [x] T024 [P] [US1] Implement PaymentStatusStorage.calculateSize() method per contract in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [x] T025 [P] [US1] Implement PaymentStatusStorage.saveCollection() private method in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [x] T026 [P] [US1] Implement PaymentStatusStorage.createDefaultCollection() private method in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [x] T027 [P] [US1] Implement PaymentStatusStorage.handleStorageError() private method in frontend/src/lib/payment-status/PaymentStatusStorage.ts

#### Service Layer (T028-T031)

- [x] T028 [P] [US1] Implement PaymentStatusService.markAsPaid() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts
- [x] T029 [P] [US1] Implement PaymentStatusService.markAsPending() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts
- [x] T030 [P] [US1] Implement PaymentStatusService.toggleStatus() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts
- [x] T031 [P] [US1] Implement PaymentStatusService.getStatus() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts

#### React Hook (T032-T033)

- [x] T032 [US1] Create usePaymentStatus hook with useSyncExternalStore in frontend/src/hooks/usePaymentStatus.ts
- [x] T033 [US1] Unit test: usePaymentStatus hook in frontend/tests/unit/hooks/usePaymentStatus.test.tsx

#### UI Components (T034-T040)

- [x] T034 [P] [US1] Create PaymentCheckbox component in frontend/src/components/payment-status/PaymentCheckbox.tsx
- [x] T035 [P] [US1] Create StatusIndicator component (badge + icon) in frontend/src/components/payment-status/StatusIndicator.tsx
- [x] T036 [P] [US1] Unit test: PaymentCheckbox component in frontend/tests/unit/components/PaymentCheckbox.test.tsx
- [x] T037 [P] [US1] Unit test: StatusIndicator component in frontend/tests/unit/components/StatusIndicator.test.tsx
- [x] T038 [US1] Integrate PaymentCheckbox into existing "This Week" view payment rows
- [x] T039 [US1] Integrate StatusIndicator into existing "This Week" view payment rows
- [x] T040 [US1] Add visual styles (strikethrough, opacity 0.6) for paid payments in frontend/src/components/

**Run all US1 tests - they should now PASS**

**Checkpoint**: User Story 1 complete - users can mark single payments as paid with persistence ✅

---

## Phase 4: User Story 2 - Risk Analysis Excludes Paid Payments (Priority: P2)

**Goal**: Integrate payment status with risk analysis to exclude paid payments from collision warnings

**Independent Test**: Create schedule with 3 payments same day → mark 1 paid → verify warning shows only 2 payments

### Tests for User Story 2 (TDD - Write FIRST, must FAIL)

- [ ] T041 [P] [US2] Unit test: PaymentStatusService.getPaidPayments() in frontend/tests/unit/payment-status/PaymentStatusService.test.ts
- [ ] T042 [P] [US2] Integration test: Risk analysis filters paid payments in frontend/tests/integration/payment-status/risk-analysis-integration.test.ts
- [ ] T043 [P] [US2] Integration test: Undo (pending) re-adds to risk analysis in frontend/tests/integration/payment-status/risk-analysis-undo.test.ts

**Verify all tests FAIL before proceeding to implementation**

### Implementation for User Story 2

- [ ] T044 [P] [US2] Implement PaymentStatusService.getPaidPayments() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts
- [ ] T045 [US2] Locate existing risk analysis service/utility in frontend/src/
- [ ] T046 [US2] Add payment status filtering to risk analysis logic (filter paid payments before analysis)
- [ ] T047 [US2] Update risk analysis UI to reflect accurate collision counts

**Run all US2 tests - they should now PASS**

**Checkpoint**: User Story 2 complete - risk warnings exclude paid payments ✅

---

## Phase 5: User Story 3 - Bulk Mark Multiple Payments (Priority: P3)

**Goal**: Enable bulk operations to mark multiple payments simultaneously for efficiency

**Independent Test**: Select 5 payments → click "Mark as Paid" → verify all 5 marked with same timestamp in <5s

### Tests for User Story 3 (TDD - Write FIRST, must FAIL)

- [ ] T048 [P] [US3] Unit test: PaymentStatusStorage.bulkSaveStatuses() in frontend/tests/unit/payment-status/PaymentStatusStorage.test.ts
- [ ] T049 [P] [US3] Unit test: PaymentStatusService.bulkMarkAsPaid() in frontend/tests/unit/payment-status/PaymentStatusService.test.ts
- [ ] T050 [P] [US3] Unit test: PaymentStatusService.bulkMarkAsPending() in frontend/tests/unit/payment-status/PaymentStatusService.test.ts
- [ ] T051 [P] [US3] Performance test: Bulk 10 payments in <5 seconds in frontend/tests/performance/bulk-operations.test.ts
- [ ] T052 [P] [US3] Integration test: Bulk mark → localStorage single write event in frontend/tests/integration/payment-status/bulk-operations.test.ts

**Verify all tests FAIL before proceeding to implementation**

### Implementation for User Story 3

#### Storage & Service Layer (T053-T055)

- [ ] T053 [P] [US3] Implement PaymentStatusStorage.bulkSaveStatuses() method per contract in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [ ] T054 [P] [US3] Implement PaymentStatusService.bulkMarkAsPaid() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts
- [ ] T055 [P] [US3] Implement PaymentStatusService.bulkMarkAsPending() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts

#### UI Components (T056-T059)

- [ ] T056 [US3] Create BulkStatusActions component (buttons + selection state) in frontend/src/components/payment-status/BulkStatusActions.tsx
- [ ] T057 [US3] Unit test: BulkStatusActions component in frontend/tests/unit/components/BulkStatusActions.test.tsx
- [ ] T058 [US3] Add selection checkboxes to payment list (separate from status checkboxes)
- [ ] T059 [US3] Integrate BulkStatusActions into "This Week" view with selection state management

**Run all US3 tests - they should now PASS**

**Checkpoint**: User Story 3 complete - bulk operations work efficiently ✅

---

## Phase 6: User Story 4 - Export with Payment Status (Priority: P4)

**Goal**: Integrate payment status into CSV and calendar exports

**Independent Test**: Mark 3 paid, leave 3 pending → export CSV → verify paid_status and paid_timestamp columns

### Tests for User Story 4 (TDD - Write FIRST, must FAIL)

- [ ] T060 [P] [US4] Integration test: CSV export includes paid_status column in frontend/tests/integration/payment-status/csv-export.test.ts
- [ ] T061 [P] [US4] Integration test: CSV export includes paid_timestamp column in frontend/tests/integration/payment-status/csv-export.test.ts
- [ ] T062 [P] [US4] Integration test: Export only pending payments option in frontend/tests/integration/payment-status/csv-export-pending-only.test.ts
- [ ] T063 [P] [US4] Integration test: Calendar export includes [PAID] prefix in frontend/tests/integration/payment-status/calendar-export.test.ts

**Verify all tests FAIL before proceeding to implementation**

### Implementation for User Story 4

#### CSV Export Integration (T064-T067)

- [ ] T064 [US4] Locate existing CSV export service/utility in frontend/src/services/ or frontend/src/utils/
- [ ] T065 [US4] Add enrichPaymentWithStatus() helper to join payment + status data in frontend/src/lib/payment-status/utils.ts
- [ ] T066 [US4] Extend CSV export to include paid_status and paid_timestamp columns
- [ ] T067 [US4] Add "Export only pending" option to CSV export UI (filter before export)

#### Calendar Export Integration (T068-T069)

- [ ] T068 [US4] Locate existing calendar export service/utility (uses ics package)
- [ ] T069 [US4] Update calendar export to prefix paid payments with "[PAID]" in SUMMARY field

**Run all US4 tests - they should now PASS**

**Checkpoint**: User Story 4 complete - exports include payment status ✅

---

## Phase 7: User Story 5 - Reset All Payment Statuses (Priority: P5)

**Goal**: Provide maintenance feature to clear all payment statuses with confirmation

**Independent Test**: Mark 5 paid → click "Clear All" → confirm → verify all return to pending in <3s

### Tests for User Story 5 (TDD - Write FIRST, must FAIL)

- [ ] T070 [P] [US5] Unit test: PaymentStatusStorage.clearAll() in frontend/tests/unit/payment-status/PaymentStatusStorage.test.ts
- [ ] T071 [P] [US5] Unit test: PaymentStatusService.clearAll() in frontend/tests/unit/payment-status/PaymentStatusService.test.ts
- [ ] T072 [P] [US5] Integration test: Clear all with confirmation dialog in frontend/tests/integration/payment-status/clear-all.test.ts
- [ ] T073 [P] [US5] Integration test: Cancel clear (no changes) in frontend/tests/integration/payment-status/clear-all-cancel.test.ts
- [ ] T074 [P] [US5] Integration test: Clear when empty (0 statuses) in frontend/tests/integration/payment-status/clear-all-empty.test.ts

**Verify all tests FAIL before proceeding to implementation**

### Implementation for User Story 5

#### Storage & Service Layer (T075-T076)

- [ ] T075 [P] [US5] Implement PaymentStatusStorage.clearAll() method per contract in frontend/src/lib/payment-status/PaymentStatusStorage.ts
- [ ] T076 [P] [US5] Implement PaymentStatusService.clearAll() method per contract in frontend/src/lib/payment-status/PaymentStatusService.ts

#### UI Components (T077-T079)

- [ ] T077 [US5] Create ClearAllButton component with confirmation dialog in frontend/src/components/payment-status/ClearAllButton.tsx
- [ ] T078 [US5] Unit test: ClearAllButton component with confirmation in frontend/tests/unit/components/ClearAllButton.test.tsx
- [ ] T079 [US5] Integrate ClearAllButton into settings or "This Week" view toolbar

**Run all US5 tests - they should now PASS**

**Checkpoint**: User Story 5 complete - clear all works with confirmation ✅

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

### Accessibility & UX Polish (T080-T085)

- [ ] T080 [P] Accessibility audit: WCAG 2.1 AA contrast ratios for status badges in frontend/src/components/payment-status/
- [ ] T081 [P] Accessibility audit: Screen reader support (aria-labels, role="status") in frontend/src/components/payment-status/
- [ ] T082 [P] Accessibility audit: Keyboard navigation (Tab, Space) for checkboxes in frontend/src/components/payment-status/
- [ ] T083 [P] Add visual loading states for async operations (mark, bulk, clear) in frontend/src/components/payment-status/
- [ ] T084 [P] Add error toast notifications for storage errors (QuotaExceeded, Security) in frontend/src/components/payment-status/
- [ ] T085 [P] Add success toast notifications for operations (marked, cleared) in frontend/src/components/payment-status/

### Performance & Error Handling (T086-T090)

- [ ] T086 [P] Performance test: Load 500 payments in <100ms in frontend/tests/performance/load-performance.test.ts
- [ ] T087 [P] Performance test: Mark payment with <200ms visual feedback in frontend/tests/performance/mark-performance.test.ts
- [ ] T088 [P] Error handling test: QuotaExceeded graceful degradation in frontend/tests/integration/payment-status/error-handling.test.ts
- [ ] T089 [P] Error handling test: Corrupted localStorage recovery in frontend/tests/integration/payment-status/corrupted-data.test.ts
- [ ] T090 [P] Cross-tab synchronization test: storage event propagation in frontend/tests/integration/payment-status/cross-tab-sync.test.ts

### Documentation & Validation (T091-T094)

- [ ] T091 [P] Update CLAUDE.md with payment status feature technologies
- [ ] T092 [P] Code cleanup: Remove any console.logs, add JSDoc comments to public methods
- [ ] T093 [P] Code review: Verify all contracts are implemented per specs/015-build-a-payment/contracts/
- [ ] T094 Run manual testing from specs/015-build-a-payment/quickstart.md (all 9 scenarios)

### Final Integration (T095-T097)

- [ ] T095 Add payment ID generation to existing payment import logic (CSV/email parsers)
- [ ] T096 Ensure Payment type with id field is used throughout existing codebase
- [ ] T097 Final E2E test: Complete user workflow (import → mark → export → clear) in frontend/tests/e2e/payment-status-workflow.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independently testable (just needs US1's storage layer)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independently testable (builds on US1's storage)
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Integrates with existing exports (independently testable)
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Independently testable (uses US1's storage)

### Within Each User Story

1. **Tests FIRST**: All test tasks MUST be written and FAIL before implementation
2. **Storage Layer**: Implement PaymentStatusStorage methods
3. **Service Layer**: Implement PaymentStatusService methods (depends on storage)
4. **React Hooks**: Create hooks using services (depends on service layer)
5. **UI Components**: Build UI components (depends on hooks)
6. **Integration**: Wire components into existing views (depends on components)
7. **Verify Tests PASS**: All tests for the story should now pass

### Parallel Opportunities

- **Setup Phase**: T002, T003, T004, T005, T006, T007 (all types/schemas)
- **Foundational Phase**: T010, T011 (utilities)
- **Within Each User Story**:
  - All test tasks marked [P] can run in parallel
  - Storage methods marked [P] can run in parallel (different methods)
  - Service methods marked [P] can run in parallel (different methods)
  - UI components marked [P] can run in parallel (different files)
- **User Stories**: P1, P2, P3, P4, P5 can all be worked on in parallel by different developers (after Foundational phase)
- **Polish Phase**: Most tasks marked [P] can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# Write all tests for User Story 1 together (TDD - MUST FAIL initially):
Task: T012, T013, T014, T015, T016, T017, T018, T019, T020

# Verify all tests FAIL, then implement storage methods in parallel:
Task: T021, T022, T023, T024, T025, T026, T027

# Implement service methods in parallel:
Task: T028, T029, T030, T031

# Build UI components in parallel:
Task: T034, T035, T036, T037

# Verify all tests now PASS
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T011) ⚠️ CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T012-T040)
   - Write tests FIRST (T012-T020) ✅
   - Verify tests FAIL ❌
   - Implement (T021-T040)
   - Verify tests PASS ✅
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 manually
5. Deploy/demo if ready - MVP delivered! 🎯

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! 🎯)
3. Add User Story 2 → Test independently → Deploy/Demo (Risk integration ✅)
4. Add User Story 3 → Test independently → Deploy/Demo (Bulk operations ✅)
5. Add User Story 4 → Test independently → Deploy/Demo (Exports enhanced ✅)
6. Add User Story 5 → Test independently → Deploy/Demo (Maintenance feature ✅)
7. Polish Phase → Final validation → Production release 🚀

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T011)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T012-T040) - Core functionality
   - **Developer B**: User Story 2 (T041-T047) - Risk integration
   - **Developer C**: User Story 3 (T048-T059) - Bulk operations
   - **Developer D**: User Story 4 (T060-T069) - Export integration
   - **Developer E**: User Story 5 (T070-T079) - Clear all feature
3. Stories complete and integrate independently
4. Team collaborates on Polish phase (T080-T097)

---

## Task Summary

**Total Tasks**: 97

**By Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (US1 - MVP): 29 tasks (9 tests + 20 implementation)
- Phase 4 (US2): 7 tasks (3 tests + 4 implementation)
- Phase 5 (US3): 12 tasks (5 tests + 7 implementation)
- Phase 6 (US4): 10 tasks (4 tests + 6 implementation)
- Phase 7 (US5): 10 tasks (5 tests + 5 implementation)
- Phase 8 (Polish): 18 tasks

**By User Story**:
- US1 (Mark Individual Payment): 29 tasks
- US2 (Risk Analysis Integration): 7 tasks
- US3 (Bulk Operations): 12 tasks
- US4 (Export Integration): 10 tasks
- US5 (Clear All): 10 tasks

**Parallel Opportunities**: 62 tasks marked [P] can run in parallel with other tasks in same phase

**Test Coverage**:
- Unit tests: 26 tasks
- Contract tests: 2 tasks
- Integration tests: 13 tasks
- Performance tests: 4 tasks
- Accessibility tests: 3 tasks
- Error handling tests: 3 tasks
- E2E test: 1 task
- **Total test tasks**: 52 (54% of all tasks are tests)

---

## Notes

- **[P]** tasks = different files, no dependencies - can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD CRITICAL**: Write tests FIRST, verify they FAIL, implement, verify they PASS
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Use quickstart.md for manual validation of each user story
- Follow contracts in specs/015-build-a-payment/contracts/ exactly
- Reference data-model.md for entity structures and validation rules
- Reference research.md for technical decisions and patterns
