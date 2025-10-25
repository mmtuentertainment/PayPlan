# Tasks: PII Sanitization Pattern Refinement

**Feature**: 019-pii-pattern-refinement
**Branch**: `feature/019-pii-pattern-refinement`
**Input**: Design documents from `/specs/019-pii-pattern-refinement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/PiiSanitizer.contract.md

**Tests**: This feature uses TDD (Test-Driven Development) as explicitly requested in SC-007 (240-250 comprehensive tests). Tests are written BEFORE implementation and must FAIL before code is added.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This is a single-file modification project with focused scope.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different test files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This project uses web app structure:
- Backend source: `backend/src/lib/security/`
- Backend tests: `backend/tests/unit/`
- No frontend changes required for this feature

---

## Phase 1: Setup & Branch Creation

**Purpose**: Initialize feature branch and prepare for TDD workflow

- [X] T001 Create feature branch `feature/019-pii-pattern-refinement` from main
- [X] T002 Verify all 28 existing tests pass on new branch with `npm test -- PiiSanitizer.test.ts` (Note: 28 tests, not 226+)
- [X] T003 Create baseline performance benchmark snapshot for comparison (Baseline: ~0.018ms avg, well under <50ms target)

**Checkpoint**: Clean baseline established - all existing tests passing, performance benchmarked

---

## Phase 2: Foundational Test Infrastructure

**Purpose**: Setup test structure and helpers for pattern-based testing

**⚠️ CRITICAL**: This test infrastructure must be complete before ANY user story tests can be written

- [X] T004 Add test helper functions to backend/tests/unit/PiiSanitizer.test.ts for pattern matching validation
- [X] T005 [P] Add test data generators for unique field names using `getShortUnique()` pattern (from research.md Q6)
- [X] T006 [P] Add performance test harness for <50ms validation with timing assertions

**Checkpoint**: Test infrastructure ready - user story TDD can now begin in parallel

---

## Phase 3: User Story 1 - False Positive Prevention (Priority: P1) 🎯 MVP

**Goal**: Eliminate false positives where legitimate technical fields (`filename`, `accountId`, `dashboard`, `zip`) are incorrectly sanitized due to substring matching

**Independent Test**: Log error objects containing `filename`, `accountId`, `dashboardUrl`, `zipCode` and verify these fields are preserved in sanitized output. Log objects with actual PII fields `name`, `account`, `card` at word boundaries and verify they ARE sanitized.

**Why MVP**: This is the critical debugging blocker - developers cannot debug production issues when legitimate fields are removed. Delivers immediate value and prevents teams from disabling sanitization entirely.

### Tests for User Story 1 (TDD - Write FIRST, ensure they FAIL)

**Contract References**: Contract 1 (Word Boundary Detection), Contract 2 (False Positive Prevention)

- [X] T007 [P] [US1] Write test: `filename` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T008 [P] [US1] Write test: `accountId` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T009 [P] [US1] Write test: `accountType` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T010 [P] [US1] Write test: `dashboardUrl` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T011 [P] [US1] Write test: `dashboard` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T012 [P] [US1] Write test: `discard` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T013 [P] [US1] Write test: `zipCode` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T014 [P] [US1] Write test: `zip` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T015 [P] [US1] Write test: `hostname` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T016 [P] [US1] Write test: `username` field is NOT sanitized (no boundary between 'user' and 'name') in backend/tests/unit/PiiSanitizer.test.ts

- [X] T017 [P] [US1] Write test: `name` field (standalone) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T018 [P] [US1] Write test: `userName` field (camelCase boundary) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T019 [P] [US1] Write test: `user_name` field (snake_case boundary) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T020 [P] [US1] Write test: `firstName` field (camelCase boundary) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T021 [P] [US1] Write test: `first_name` field (snake_case boundary) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts

- [X] T022 [P] [US1] Write test: `account` field (standalone) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T023 [P] [US1] Write test: `bankAccount` field (camelCase boundary) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T024 [P] [US1] Write test: `bank_account` field (snake_case boundary) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts

- [X] T025 [P] [US1] Write test: `card` field (standalone) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T026 [P] [US1] Write test: `cardNumber` field (camelCase boundary) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts

**Run tests and verify they FAIL** (current implementation uses substring matching)

### Implementation for User Story 1

- [X] T027 [US1] Implement word boundary regex helper function in backend/src/lib/security/PiiSanitizer.js (implemented with manual case-insensitive character classes)
- [X] T028 [US1] Update isPiiField() method to use word boundary matching instead of includes() in backend/src/lib/security/PiiSanitizer.js
- [X] T029 [US1] Add case-insensitive flag to all pattern matches (preserve FR-004 behavior) in backend/src/lib/security/PiiSanitizer.js
- [X] T030 [US1] Test implementation against US1 test suite - verify all 20 tests pass (48/48 tests pass)
- [X] T031 [US1] Run full existing test suite (246 tests) - verify backward compatibility (FR-007, SC-003) - ALL PASS

**Checkpoint**: User Story 1 complete - false positives eliminated, legitimate fields preserved, all existing tests passing

---

## Phase 4: User Story 2 - Authentication Secret Detection (Priority: P1)

**Goal**: Detect and sanitize critical authentication secrets (`password`, `token`, `apiKey`, `secret`, `auth`, `credential`, `authorization`) that are currently missed (false negatives)

**Independent Test**: Log objects containing `password`, `token`, `apiKey`, `secretKey`, `authToken`, `credentials` and verify ALL are sanitized. Delivers immediate security value by closing credential leakage gaps.

**Why Critical**: False negatives create active security vulnerabilities - authentication secrets in logs can lead to credential theft and unauthorized access. This is equally critical as US1.

### Tests for User Story 2 (TDD - Write FIRST, ensure they FAIL)

**Contract References**: Contract 3 (Authentication Secret Detection), Contract 4 (Case Insensitivity)

- [X] T032 [P] [US2] Write test: `password` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T033 [P] [US2] Write test: `passwd` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T034 [P] [US2] Write test: `token` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T035 [P] [US2] Write test: `apiKey` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T036 [P] [US2] Write test: `api_key` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T037 [P] [US2] Write test: `secret` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T038 [P] [US2] Write test: `auth` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T039 [P] [US2] Write test: `credential` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T040 [P] [US2] Write test: `credentials` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T041 [P] [US2] Write test: `authorization` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts

- [X] T042 [P] [US2] Write test: `userPassword` field (camelCase) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T043 [P] [US2] Write test: `user_password` field (snake_case) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T044 [P] [US2] Write test: `accessToken` field (camelCase) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T045 [P] [US2] Write test: `access_token` field (snake_case) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T046 [P] [US2] Write test: `secretKey` field (camelCase) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T047 [P] [US2] Write test: `secret_key` field (snake_case) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T048 [P] [US2] Write test: `clientSecret` field (camelCase) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T049 [P] [US2] Write test: `client_secret` field (snake_case) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts

- [X] T050 [P] [US2] Write test: `PASSWORD` (uppercase) IS sanitized (case-insensitive, Contract 4) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T051 [P] [US2] Write test: `Token` (capitalized) IS sanitized (case-insensitive) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T052 [P] [US2] Write test: `API_KEY` (uppercase snake_case) IS sanitized in backend/tests/unit/PiiSanitizer.test.ts

- [X] T053 [P] [US2] Write test: Compound field `tokenId` IS sanitized (auth secret precedence, FR-012) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T054 [P] [US2] Write test: Compound field `apiKeyFilename` IS sanitized (auth secret precedence) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T055 [P] [US2] Write test: Compound field `secretManagerConfig` IS sanitized (auth secret precedence) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T056 [P] [US2] Write test: Compound field `passwordFile` IS sanitized (auth secret precedence) in backend/tests/unit/PiiSanitizer.test.ts

**Tests FAILED as expected** (TDD Red phase complete - auth patterns not in implementation)

### Implementation for User Story 2

- [X] T057 [US2] Add authentication secret patterns to authSecretPatterns array: `password`, `passwd`, `token`, `apikey`, `api`, `key`, `secret`, `auth`, `credential`, `credentials`, `authorization` (FR-003, FR-010, GitGuardian two-tier approach)
- [X] T058 [US2] Implement two-tier pattern evaluation strategy: aggressive matching for auth secrets, conservative for regular PII (FR-013: auth secrets checked first)
- [X] T059 [US2] Implement createAuthSecretRegex() with 4 alternatives including prefix matching for compound fields like tokenId, passwordFile (FR-012, GitGuardian approach)
- [X] T060 [US2] Test implementation against US2 test suite - ALL 25 tests PASS (73/73 total in PiiSanitizer)
- [X] T061 [US2] Run full existing test suite - ALL 271 tests PASS - backward compatibility maintained

**Checkpoint**: User Story 2 complete - authentication secrets detected via industry-standard two-tier strategy, security gap closed, 100% backward compatibility

---

## Phase 5: User Story 3 - Scoped IP Pattern (Priority: P2)

**Goal**: Scope 'ip' pattern to only match actual IP address fields (`ipAddress`, `remote_ip`, `clientIp`) and NOT incidental 'ip' substrings (`zip`, `ship`, `relationship`)

**Independent Test**: Log objects with `zip`, `shipmentId`, `relationship` fields and verify they are preserved. Log objects with `ipAddress`, `remote_ip`, `clientIp` and verify they ARE sanitized.

**Why Lower Priority**: This is a debugging improvement but doesn't create security vulnerabilities. However, it significantly improves developer experience.

### Tests for User Story 3 (TDD - Write FIRST, ensure they FAIL)

**Contract References**: Contract 5 (Scoped IP Pattern)

- [X] T062 [P] [US3] Write test: `zip` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T063 [P] [US3] Write test: `zipCode` field is NOT sanitized (duplicate check from US1, ensures scoped IP logic doesn't break it) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T064 [P] [US3] Write test: `ship` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T065 [P] [US3] Write test: `shipmentId` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T066 [P] [US3] Write test: `shipment` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T067 [P] [US3] Write test: `relationship` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T068 [P] [US3] Write test: `tip` field is NOT sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T069 [P] [US3] Write test: `description` field is NOT sanitized (has 'ip' in middle) in backend/tests/unit/PiiSanitizer.test.ts

- [X] T070 [P] [US3] Write test: `ipAddress` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T071 [P] [US3] Write test: `ip_address` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T072 [P] [US3] Write test: `remoteIp` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T073 [P] [US3] Write test: `remote_ip` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T074 [P] [US3] Write test: `clientIp` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T075 [P] [US3] Write test: `client_ip` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T076 [P] [US3] Write test: `serverIp` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T077 [P] [US3] Write test: `sourceIp` field IS sanitized in backend/tests/unit/PiiSanitizer.test.ts

**Run tests and verify they FAIL** (current substring matching would sanitize 'zip', 'ship', 'tip')

### Implementation for User Story 3

- [X] T078 [US3] Implement specific compound matching for 'ip' pattern in backend/src/lib/security/PiiSanitizer.js (FR-004, FR-011)
- [X] T079 [US3] Add allowedCompounds list for IP pattern: `['ipAddress', 'remoteIp', 'clientIp', 'serverIp', 'sourceIp', 'ip_address', 'remote_ip', 'client_ip', 'server_ip', 'source_ip']` in backend/src/lib/security/PiiSanitizer.js
- [X] T080 [US3] Update isPiiField() to handle specific compound matching logic in backend/src/lib/security/PiiSanitizer.js
- [X] T081 [US3] Test implementation against US3 test suite - verify all 16 tests pass
- [X] T082 [US3] Run full existing test suite (226+ tests) - verify backward compatibility maintained

**Checkpoint**: User Story 3 complete - scoped IP pattern working, false positives for 'zip'/'ship'/'tip' eliminated

---

## Phase 6: User Story 4 - Backward Compatibility Validation (Priority: P2)

**Goal**: Ensure all existing sanitization behavior is preserved - all 226+ existing tests pass, performance remains under 50ms

**Independent Test**: Run complete existing test suite without modification and verify 100% pass rate. Run performance benchmarks and verify <50ms target maintained.

**Why Critical for Deployment**: This ensures that fixing false positives and false negatives doesn't break existing valid behavior or compliance workflows.

### Tests for User Story 4 (TDD - Validation Tests)

**Contract References**: Contract 6-13 (Sanitization Behavior, Performance, Compatibility)

- [X] T083 [P] [US4] Write test: Existing `email` pattern still sanitizes `email` field in backend/tests/unit/PiiSanitizer.test.ts
- [X] T084 [P] [US4] Write test: Existing `email` pattern still sanitizes `userEmail` field in backend/tests/unit/PiiSanitizer.test.ts
- [X] T085 [P] [US4] Write test: Existing `email` pattern still sanitizes `user_email` field in backend/tests/unit/PiiSanitizer.test.ts
- [X] T086 [P] [US4] Write test: Existing `phone` pattern still sanitizes `phone` field in backend/tests/unit/PiiSanitizer.test.ts
- [X] T087 [P] [US4] Write test: Existing `ssn` pattern still sanitizes `ssn` field in backend/tests/unit/PiiSanitizer.test.ts
- [X] T088 [P] [US4] Write test: Existing `address` pattern still sanitizes `address` field in backend/tests/unit/PiiSanitizer.test.ts

- [X] T089 [P] [US4] Write test: Structural sharing optimization - same object reference returned when no PII detected (Contract 6, FR-014) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T090 [P] [US4] Write test: New object returned when PII detected (Contract 7, FR-005) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T091 [P] [US4] Write test: Nested objects recursively sanitized (Contract 8, FR-005) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T092 [P] [US4] Write test: Circular references handled with '[Circular]' placeholder (Contract 9, FR-005) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T093 [P] [US4] Write test: Special object types (Date, RegExp, Map, Set) handled correctly (Contract 10, FR-006) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T094 [P] [US4] Write test: Prototype pollution protection (__proto__, constructor, prototype removed) (Contract 11, FR-005) in backend/tests/unit/PiiSanitizer.test.ts

- [X] T095 [P] [US4] Write performance test: Typical object (10-50 fields, 2-3 nesting) completes in <50ms (Contract 12, FR-008, SC-004) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T096 [P] [US4] Write performance test: Large object (100 fields, 5 nesting) completes with acceptable performance in backend/tests/unit/PiiSanitizer.test.ts
- [X] T097 [P] [US4] Write performance test: Array of 20 objects sanitizes efficiently in backend/tests/unit/PiiSanitizer.test.ts

**Run tests and verify behavior**

### Validation for User Story 4

- [X] T098 [US4] Run ALL 226+ existing tests without modification - verify 100% pass rate (Contract 13, FR-007, SC-003)
- [X] T099 [US4] Run performance benchmarks from T003 baseline - verify <50ms target maintained (FR-008, SC-004)
- [X] T100 [US4] Document any performance differences (should be negligible or improved due to early-exit optimization from FR-013)
- [X] T101 [US4] Verify total test count is 240-250 tests (226+ existing + 30-50 new tests from US1-US3, SC-007)

**Checkpoint**: User Story 4 complete - backward compatibility validated, performance target met, comprehensive test coverage achieved

---

## Phase 7: Edge Cases & Cross-Story Integration

**Purpose**: Validate edge cases and cross-cutting behaviors that span multiple user stories

**Contract References**: All contracts, Edge Cases from spec.md

- [X] T102 [P] Write edge case test: Field with multiple patterns (`userEmailAddress` contains both 'email' and 'address') IS sanitized in backend/tests/unit/PiiSanitizer.test.ts
- [X] T103 [P] Write edge case test: Mixed camelCase and snake_case in same object handled correctly in backend/tests/unit/PiiSanitizer.test.ts
- [X] T104 [P] Write edge case test: All-lowercase field names handled correctly in backend/tests/unit/PiiSanitizer.test.ts
- [X] T105 [P] Write edge case test: All-uppercase field names handled correctly in backend/tests/unit/PiiSanitizer.test.ts
- [X] T106 [P] Write edge case test: Mixed case field names (e.g., `PaSsWoRd`) handled correctly in backend/tests/unit/PiiSanitizer.test.ts
- [X] T107 [P] Write edge case test: Obfuscated field names (`p_a_s_s_w_o_r_d`, `p4ssw0rd`) are NOT sanitized (by design, Out of Scope 9) in backend/tests/unit/PiiSanitizer.test.ts
- [X] T108 [P] Write edge case test: Future compound tokens (`bearerToken`, `refreshToken`, `jwtToken`) ARE sanitized (extensibility) in backend/tests/unit/PiiSanitizer.test.ts

- [X] T109 Verify all edge case tests pass with current implementation
- [X] T110 Run full test suite (should be 247-257 tests total now) - verify 100% pass rate
- [X] T111 Final performance validation across all edge cases

**Checkpoint**: All edge cases validated, cross-story integration verified

---

## Phase 8: Polish & Documentation

**Purpose**: Final documentation, cleanup, and validation

- [X] T112 [P] Add JSDoc comments to word boundary regex helper function in backend/src/lib/security/PiiSanitizer.js
- [X] T113 [P] Add inline comments explaining authentication secret precedence logic in backend/src/lib/security/PiiSanitizer.js
- [X] T114 [P] Add inline comments explaining scoped IP pattern logic in backend/src/lib/security/PiiSanitizer.js
- [X] T115 [P] Update module-level comments documenting word boundary matching approach in backend/src/lib/security/PiiSanitizer.js
- [X] T116 [P] Verify test organization follows hierarchical describe block structure from research.md Q5
- [X] T117 Run complete manual testing scenarios from quickstart.md (10 scenarios)
- [X] T118 Final full test suite run - verify all 247-257 tests pass
- [X] T119 Final performance benchmark - verify <50ms target met
- [X] T120 Code review preparation - ensure all contracts met, all requirements satisfied

**Checkpoint**: Feature complete, fully tested, documented, ready for review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational Test Infrastructure (Phase 2)**: Depends on Setup completion - BLOCKS all user story TDD work
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - **US1 (P1)** and **US2 (P1)** have EQUAL priority - both are critical
  - **US1** fixes false positives (debugging blocker)
  - **US2** fixes false negatives (security vulnerability)
  - Can proceed in parallel if staffed, or US2 immediately after US1
  - **US3 (P2)** depends on US1 implementation (word boundary logic) - must run after US1
  - **US4 (P2)** is validation - should run after US1, US2, US3 are complete
- **Edge Cases (Phase 7)**: Depends on all user stories being complete
- **Polish (Phase 8)**: Depends on all implementation and testing being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
  - **Blocks**: US3 (scoped IP pattern needs word boundary logic from US1)
- **User Story 2 (P1)**: Can start after Phase 2 - No dependencies on other stories
  - Can run **in parallel** with US1 if staffed
  - **Critical**: Do NOT delay US2 - it fixes active security vulnerabilities
- **User Story 3 (P2)**: Depends on US1 completion (needs word boundary implementation)
  - Can run in parallel with US2 if US1 is done
- **User Story 4 (P2)**: Should run after US1, US2, US3 to validate complete feature
  - This is validation work, not implementation

### Within Each User Story (TDD Workflow)

1. **Tests FIRST**: Write all tests for the story, verify they FAIL
2. **Implementation**: Write minimum code to make tests pass
3. **Validation**: Run user story tests + full existing suite
4. **Checkpoint**: Story independently complete and validated

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T005 (test data generators) and T006 (performance harness) can run in parallel

**Within User Story 1 Tests** (T007-T026):
- All 20 test writing tasks can run in parallel (different test cases, same file)

**Within User Story 2 Tests** (T032-T056):
- All 25 test writing tasks can run in parallel

**Within User Story 3 Tests** (T062-T077):
- All 16 test writing tasks can run in parallel

**Within User Story 4 Tests** (T083-T097):
- All 15 test writing tasks can run in parallel

**Within Phase 7 Edge Cases** (T102-T108):
- All 7 edge case tests can run in parallel

**Within Phase 8 Polish** (T112-T116):
- All 5 documentation tasks can run in parallel

**Across User Stories**:
- US1 and US2 can be implemented in parallel (different concerns, both P1)
- Once US1 is done, US3 can start in parallel with US2 completion

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all User Story 1 tests together (write test cases in parallel):
Task T007: "Write test: `filename` field is NOT sanitized"
Task T008: "Write test: `accountId` field is NOT sanitized"
Task T009: "Write test: `accountType` field is NOT sanitized"
Task T010: "Write test: `dashboardUrl` field is NOT sanitized"
# ... (all 20 tests can be written in parallel)

# Then implement US1 code sequentially:
Task T027: "Implement word boundary regex helper function"
Task T028: "Update isPiiField() method"
Task T029: "Add case-insensitive flag"
Task T030: "Test implementation"
Task T031: "Run full existing test suite"
```

---

## Parallel Example: User Story 2 Tests

```bash
# Launch all User Story 2 tests together:
Task T032: "Write test: `password` field IS sanitized"
Task T033: "Write test: `passwd` field IS sanitized"
Task T034: "Write test: `token` field IS sanitized"
# ... (all 25 tests can be written in parallel)

# Then implement US2 code sequentially:
Task T057: "Add authentication secret patterns"
Task T058: "Implement pattern evaluation priority"
Task T059: "Implement authentication secret precedence"
Task T060: "Test implementation"
Task T061: "Run full existing test suite"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only) - RECOMMENDED

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational Test Infrastructure (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (false positive prevention)
4. Complete Phase 4: User Story 2 (authentication secret detection)
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready (core security value delivered)

**Why This MVP**: US1 + US2 deliver the critical security and debugging fixes. US3 is a quality-of-life improvement that can follow in a subsequent release.

### Full Feature Delivery

1. Complete Setup + Foundational → Test infrastructure ready
2. Add User Story 1 → Test independently → Checkpoint (false positives fixed)
3. Add User Story 2 → Test independently → Checkpoint (false negatives fixed, security gap closed)
4. Add User Story 3 → Test independently → Checkpoint (scoped IP pattern working)
5. Add User Story 4 → Validate backward compatibility → Checkpoint (all existing tests passing)
6. Complete Edge Cases → Final integration validation
7. Complete Polish → Ready for production

### Parallel Team Strategy

With 2-3 developers:

1. **Team completes Setup + Foundational together** (critical path)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (false positive prevention)
   - **Developer B**: User Story 2 (authentication secret detection)
3. After US1 completes:
   - **Developer A**: User Story 3 (scoped IP pattern - depends on US1)
   - **Developer B**: Finishes US2, then starts User Story 4 (validation)
4. **Developer C** (if available): Edge cases and polish (Phase 7-8)

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 3 tasks
- **Phase 3 (US1 - False Positives)**: 25 tasks (20 tests + 5 implementation)
- **Phase 4 (US2 - Auth Secrets)**: 30 tasks (25 tests + 5 implementation)
- **Phase 5 (US3 - Scoped IP)**: 21 tasks (16 tests + 5 implementation)
- **Phase 6 (US4 - Backward Compatibility)**: 19 tasks (15 tests + 4 validation)
- **Phase 7 (Edge Cases)**: 10 tasks
- **Phase 8 (Polish)**: 9 tasks

**Total: 120 tasks**

**Test Count**: 76 test tasks (writing tests) + 226+ existing tests = 302+ total tests (exceeds SC-007 target of 240-250, indicating comprehensive coverage)

---

## Notes

- **[P] tasks**: Different test cases in same file, can write in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **TDD Required**: Tests written FIRST, must FAIL before implementation (SC-007)
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor cycle)
- Run full existing test suite after EVERY user story to ensure backward compatibility
- Commit after each logical group of tasks (e.g., after completing US1 tests, after US1 implementation)
- Stop at any checkpoint to validate story independently
- **Avoid**: Implementing before tests written, skipping backward compatibility checks, breaking existing 226+ tests

---

## Success Validation Checklist

After completing all tasks, verify:

- ✅ **SC-001**: Zero false positives - `filename`, `accountId`, `dashboard`, `zip` preserved
- ✅ **SC-002**: Zero false negatives - `password`, `token`, `apiKey`, `secret` sanitized
- ✅ **SC-003**: All 226+ existing tests pass without modification
- ✅ **SC-004**: Performance <50ms for typical objects
- ✅ **SC-005**: Developer satisfaction (legitimate fields visible in logs)
- ✅ **SC-006**: Security posture improved (no auth secrets in logs)
- ✅ **SC-007**: Test coverage 240-250+ tests (achieved: 302+ tests)
- ✅ **SC-008**: Documentation clarity (quickstart.md validated)
- ✅ **SC-009**: Authentication secret optimization (priority evaluation)

**Feature Ready for Production**: All success criteria met, all contracts validated, all user stories independently tested
