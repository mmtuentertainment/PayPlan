# Implementation Plan: PII Sanitization Pattern Refinement

**Branch**: `019-pii-pattern-refinement` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-pii-pattern-refinement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refine the PII sanitizer pattern matching from substring-based to word boundary-based detection to eliminate false positives (legitimate fields like `filename`, `accountId` incorrectly removed) and false negatives (authentication secrets like `password`, `token`, `apiKey` not detected). This security-critical fix implements precise regex word boundary matching for both camelCase and snake_case field names, adds 8 new authentication secret patterns, and maintains <50ms performance with zero breaking changes to existing 226+ tests.

**Primary Technical Approach**: Replace `includes()` substring matching with regex word boundary patterns `/(^|_|[A-Z])pattern(_|[A-Z]|$)/i` validated by MDN JavaScript standards. Evaluate authentication secrets first for defense-in-depth security.

## Technical Context

**Language/Version**: JavaScript (Node.js 20.x backend) + TypeScript 5.8.3 (type definitions)
**Primary Dependencies**: None (native JavaScript `String` + `RegExp` + `Array` methods only)
**Storage**: N/A (stateless transformation library)
**Testing**: Vitest 3.2.4 (existing test framework from Feature 018)
**Target Platform**: Node.js 20.x server runtime (backend logging library)
**Project Type**: Web application (backend-only modification to existing `PiiSanitizer.js`)
**Performance Goals**: <50ms per sanitization call for typical error objects (10-50 fields, 2-3 nesting levels)
**Constraints**: Zero breaking changes (all 226+ existing tests must pass), zero new dependencies, backward-compatible API
**Scale/Scope**: Single module modification (`backend/src/lib/security/PiiSanitizer.js`), 30-50 new test cases added

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: No project constitution file found at `.specify/memory/constitution.md` (template only). Applying standard quality gates:

### Standard Quality Gates

- ✅ **Test-First**: TDD mandatory per spec (SC-007: 240-250 tests, comprehensive edge case coverage)
- ✅ **Backward Compatibility**: All 226+ existing tests must pass (FR-007, SC-003)
- ✅ **No New Dependencies**: Native JavaScript only (Assumption 6, Technical Context confirms)
- ✅ **Performance**: <50ms target maintained (FR-008, SC-004)
- ✅ **Security**: OWASP-validated approach (6 best practices documented in spec)

### Feature-Specific Gates

- ✅ **Zero Breaking Changes**: Drop-in replacement (Assumption 7)
- ✅ **Industry Standards Compliance**: MDN JavaScript regex patterns (Trust Score: 9.9/10)
- ✅ **ReDoS Safety**: Simple bounded patterns validated by Node.js Best Practices (Trust Score: 9.6/10)

**Result**: All gates PASS - proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/019-pii-pattern-refinement/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (pattern entities)
├── quickstart.md        # Phase 1 output (manual testing scenarios)
├── contracts/           # Phase 1 output (pattern matching API contract)
├── checklists/          # Quality validation
│   └── requirements.md  # Spec quality checklist (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   └── lib/
│       └── security/
│           └── PiiSanitizer.js      # Target file for modification
└── tests/
    └── unit/
        └── PiiSanitizer.test.ts     # Existing 226+ tests + 30-50 new tests

# No frontend changes required
```

**Structure Decision**: This is a backend-only modification to an existing security library module. The web application structure (backend/ + frontend/) is already established by Feature 018. This feature makes targeted changes to a single backend module without touching frontend code.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - No constitution violations. All standard gates pass.

---

## Phase 0: Research & Outline

**Status**: ✅ Complete

**Output**: [research.md](./research.md)

### Research Questions Resolved

7 research questions resolved using Context7 documentation sources:

1. **Q1: Regex Pattern for Word Boundary Matching** (camelCase + snake_case)
   - **Decision**: `/(^|_|[A-Z])pattern(_|[A-Z]|$)/i` with case-insensitive flag
   - **Source**: MDN JavaScript (Trust: 9.9/10)
   - **Key Finding**: Standard `\b` treats underscore as word character, fails for snake_case

2. **Q2: ReDoS (Regular Expression Denial of Service) Safety**
   - **Decision**: Our patterns are safe - simple bounded patterns without backtracking
   - **Source**: Node.js Best Practices (Trust: 9.6/10)
   - **Key Finding**: Linear time complexity O(n), no nested quantifiers

3. **Q3: Pattern Evaluation Order** (Performance vs Security)
   - **Decision**: Evaluate authentication secrets first (security-first approach)
   - **Source**: OWASP + Node.js Best Practices
   - **Key Finding**: Defense-in-depth principle - security > performance

4. **Q4: Native JavaScript vs External Libraries** (lodash, underscore)
   - **Decision**: Native JavaScript `String.prototype` + `Array.prototype` only
   - **Source**: Node.js Best Practices (Trust: 9.6/10)
   - **Key Finding**: V8 engine optimization makes native methods faster

5. **Q5: Test Organization Strategy**
   - **Decision**: Organize tests by pattern category (hierarchical describe blocks)
   - **Source**: Node.js Testing Best Practices (Trust: 9.6/10)

6. **Q6: Test Data Generation for Unique Fields**
   - **Decision**: Use unique suffixes pattern `'id-${getShortUnique()}'`
   - **Source**: Node.js Testing Best Practices (Trust: 9.6/10)

7. **Q7: Assertion Strategy for Dynamic Fields**
   - **Decision**: Use `expect.any(Type)` for unpredictable fields, `toMatchObject()` for partial validation
   - **Source**: Node.js Testing Best Practices (Trust: 9.6/10)

**Technical Decisions Summary**:

| Decision Area | Choice | Authority Source |
|--------------|--------|------------------|
| Regex Pattern | `/(^|_|[A-Z])pattern(_|[A-Z]|$)/i` | MDN JavaScript (Trust: 9.9/10) |
| ReDoS Safety | Simple bounded patterns (safe) | Node.js Best Practices (Trust: 9.6/10) |
| Evaluation Order | Security-first (auth patterns first) | OWASP + Node.js Best Practices |
| Dependencies | Native JavaScript only | Node.js Best Practices (Trust: 9.6/10) |
| Test Structure | Hierarchical by pattern category | Node.js Testing (Trust: 9.6/10) |
| Test Data | Unique suffixes per test | Node.js Testing (Trust: 9.6/10) |
| Assertions | `expect.any()` + `toMatchObject()` | Node.js Testing (Trust: 9.6/10) |

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### 1. Data Model

**Output**: [data-model.md](./data-model.md)

**Entities Defined**:

1. **PII Pattern** - Represents field name pattern indicating PII/secrets
   - Fields: `pattern`, `category`, `matchingRule`, `evaluationPriority`
   - Categories: `contact | identity | financial | authentication_secret | network | government_id | tax_id`
   - Priority: Auth secrets = 0 (highest), Other PII = 1

2. **Field Match Rule** - Criteria for field name matching
   - Fields: `matchType`, `caseSensitive`, `boundaryDetectionLogic`, `allowedCompounds`
   - Match Types: `word_boundary | exact | specific_compound`
   - Boundary Logic: `combined | camelCase | snake_case`

3. **Sanitization Result** - Outcome of sanitization operation
   - Fields: `sanitizationOccurred`, `originalDataReference`, `sanitizedData`, `performanceMetrics`, `matchedPatterns`
   - Performance Metrics: `executionTimeMs`, `fieldsScanned`, `fieldsRemoved`, `nestingDepth`

**Entity Relationships**:
- PII Pattern (1) → owns → (1) Field Match Rule
- PII Pattern (applied to data) → produces → (0..*) Sanitization Results

### 2. API Contracts

**Output**: [contracts/PiiSanitizer.contract.md](./contracts/PiiSanitizer.contract.md)

**13 Contracts Defined**:

1. **Contract 1**: Word Boundary Detection (FR-001, FR-002, FR-003)
2. **Contract 2**: False Positive Prevention (FR-009)
3. **Contract 3**: Authentication Secret Detection (FR-010)
4. **Contract 4**: Case Insensitivity (FR-004)
5. **Contract 5**: Scoped IP Pattern (FR-011)
6. **Contract 6**: Structural Sharing Optimization (FR-008)
7. **Contract 7**: PII Removal (FR-005)
8. **Contract 8**: Nested Sanitization (FR-005)
9. **Contract 9**: Circular Reference Handling (FR-005)
10. **Contract 10**: Special Object Type Handling (FR-006)
11. **Contract 11**: Prototype Pollution Protection (FR-005)
12. **Contract 12**: Performance Target (FR-008, SC-004)
13. **Contract 13**: Existing Test Compatibility (FR-007, SC-003)

**Contract Validation Strategy**:
- Unit Tests: 240-250 comprehensive tests covering all contracts (SC-007)
- Edge Case Tests: 7 edge cases from spec explicitly tested
- Backward Compatibility Tests: All 226+ existing tests must pass (SC-003)
- Performance Tests: Automated timing validation for <50ms target (SC-004)

### 3. Quickstart Manual Testing

**Output**: [quickstart.md](./quickstart.md)

**10 Manual Test Scenarios Defined**:

1. **Scenario 1**: Validate False Positive Prevention (filename, accountId, dashboard, zip)
2. **Scenario 2**: Validate Authentication Secret Detection (password, token, apiKey, secret)
3. **Scenario 3**: Validate Word Boundary Matching (camelCase + snake_case)
4. **Scenario 4**: Validate Case Insensitivity (name, Name, NAME variations)
5. **Scenario 5**: Validate Scoped IP Pattern (ipAddress vs zip/ship/tip)
6. **Scenario 6**: Validate Authentication Secret Precedence (compound fields)
7. **Scenario 7**: Validate Backward Compatibility (existing behavior unchanged)
8. **Scenario 8**: Validate Performance (<50ms for typical objects)
9. **Scenario 9**: Validate Nested Structure Handling (PII at all levels)
10. **Scenario 10**: Validate Circular Reference Handling (no crashes, placeholder replacement)

Each scenario includes:
- User story reference
- Acceptance criteria reference
- Contract reference
- Step-by-step instructions with expected outputs
- Current behavior (Feature 018 - broken)
- Expected behavior (Feature 019 - fixed)
- Pass criteria

### 4. Agent Context Update

**Output**: Updated [CLAUDE.md](../../CLAUDE.md)

**Changes Applied**:
- Added language: JavaScript (Node.js 20.x backend) + TypeScript 5.8.3 (type definitions)
- Added framework: None (native JavaScript `String` + `RegExp` + `Array` methods only)
- Added database: N/A (stateless transformation library)
- Preserved manual additions between markers

---

## Phase 2: Task Breakdown

**Status**: ✅ Complete

**Output**: [tasks.md](./tasks.md)

**Task Organization by User Story**:

- **Phase 1**: Setup & Branch Creation (3 tasks)
- **Phase 2**: Foundational Test Infrastructure (3 tasks)
- **Phase 3**: User Story 1 - False Positive Prevention (25 tasks: 20 tests + 5 implementation)
- **Phase 4**: User Story 2 - Authentication Secret Detection (30 tasks: 25 tests + 5 implementation)
- **Phase 5**: User Story 3 - Scoped IP Pattern (21 tasks: 16 tests + 5 implementation)
- **Phase 6**: User Story 4 - Backward Compatibility Validation (19 tasks: 15 tests + 4 validation)
- **Phase 7**: Edge Cases & Cross-Story Integration (10 tasks)
- **Phase 8**: Polish & Documentation (9 tasks)

**Total Task Count**: 120 atomic TDD tasks

**Test Task Count**: 76 test writing tasks + 226+ existing tests = **302+ total tests** (exceeds SC-007 target of 240-250)

**Parallel Opportunities**: 92 tasks marked [P] (76.7% of tasks can run in parallel)

**Task Format Validation**: ✅ All tasks follow required format:
- Checkbox: `- [ ]` ✅
- Task ID: T001-T120 ✅
- [P] marker: 92 parallelizable tasks ✅
- [Story] label: US1, US2, US3, US4 labels present ✅
- File paths: All implementation/test tasks include exact file paths ✅

**MVP Scope**: User Stories 1 + 2 (55 tasks) - Delivers critical false positive/negative fixes

---

## Implementation Readiness

**Phase 0 (Research)**: ✅ Complete - All research questions resolved
**Phase 1 (Design)**: ✅ Complete - Data model, contracts, quickstart, agent context ready
**Phase 2 (Tasks)**: ✅ Complete - 120 atomic TDD tasks generated, organized by user story

**Next Step**: `/speckit.implement` to begin TDD implementation (or start with tasks.md manually)

**Generated Artifacts**:
- ✅ [spec.md](./spec.md) - Feature specification (314 lines)
- ✅ [research.md](./research.md) - Technical research (211 lines)
- ✅ [data-model.md](./data-model.md) - Entity definitions (326 lines)
- ✅ [contracts/PiiSanitizer.contract.md](./contracts/PiiSanitizer.contract.md) - API contracts (612 lines)
- ✅ [quickstart.md](./quickstart.md) - Manual testing guide (523 lines)
- ✅ [checklists/requirements.md](./checklists/requirements.md) - Quality validation (143 lines)
- ✅ [tasks.md](./tasks.md) - TDD task breakdown (120 tasks, 302+ tests total)

**Branch**: `feature/019-pii-pattern-refinement` (create in Phase 1, Task T001)

---

## Summary

This implementation plan provides comprehensive design documentation for the PII Sanitization Pattern Refinement feature. All research questions have been resolved using authoritative sources (MDN JavaScript, Node.js Best Practices, OWASP), and detailed contracts ensure testability and backward compatibility.

**Key Technical Decisions**:
- Regex pattern: `/(^|_|[A-Z])pattern(_|[A-Z]|$)/i` (MDN-validated)
- ReDoS-safe: Linear time complexity O(n), no backtracking
- Security-first: Evaluate auth secrets before other PII patterns
- Zero dependencies: Native JavaScript only (V8-optimized)
- Performance: <50ms target maintained
- Backward compatible: All 226+ existing tests must pass

**Ready for**: `/speckit.tasks` command to generate atomic TDD task breakdown
