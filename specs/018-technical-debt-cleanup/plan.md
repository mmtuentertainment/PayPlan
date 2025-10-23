# Implementation Plan: Technical Debt Cleanup

**Branch**: `018-technical-debt-cleanup` | **Date**: 2025-10-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/018-technical-debt-cleanup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature systematically addresses 44 security vulnerabilities, type safety issues, and architectural improvements identified by CodeRabbit review. The technical approach focuses on four priority levels (P0-P3): critical security fixes (production console logging, generic error messages, idempotency validation, fail-closed patterns, 24-hour TTL), type safety improvements (WCAG button sizing, Zod validation, NaN detection, runtime guards), architectural enhancements (PII sanitization, JSON depth validation, atomic updates), and code quality improvements (style cleanup, script portability, documentation).

## Technical Context

**Language/Version**: TypeScript 5.8.3 (frontend), Node.js 20.x (backend)
**Primary Dependencies**: React 19.1.1, Zod 4.1.11 (validation), Vitest 3.2.4 (testing), PapaParse 5.5.3 (CSV), uuid 13.0.0
**Storage**: Browser localStorage (privacy-first, no server persistence)
**Testing**: Vitest 3.2.4 (1387 existing tests must continue passing at 100%)
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge) + Node.js backend
**Project Type**: Web application (frontend + backend separation)
**Performance Goals**: Build time increase ≤10%, bundle size increase ≤5% compared to baseline
**Constraints**: Zero new linting errors, TypeScript compilation must succeed, 100% backward compatibility, WCAG 2.1 AA compliance
**Scale/Scope**: 20+ files across API layer, UI components, storage services, type definitions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: No constitution.md is currently defined for this project. This cleanup feature will establish baseline quality gates:

### Quality Gates (Established by this feature)
- ✅ Test coverage: 100% pass rate for 1387 existing tests (NFR-001)
- ✅ Type safety: Zero TypeScript compilation errors (NFR-003)
- ✅ Code quality: Zero linting errors (NFR-002)
- ✅ Performance: Build time ≤110% baseline, bundle size ≤105% baseline (NFR-004)
- ✅ Security: No PII in logs/cache, generic client errors, 24-hour idempotency (FR-001, FR-002, FR-005, FR-013)
- ✅ Accessibility: WCAG 2.1 AA compliance (44×44px touch targets) (FR-006)

### Complexity Justification
This cleanup feature does not introduce new complexity - it reduces technical debt and establishes quality gates. All changes maintain backward compatibility.

## Project Structure

### Documentation (this feature)

```text
specs/018-technical-debt-cleanup/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── validation-api.md      # Validation patterns contract
│   ├── error-handling.md      # Error sanitization contract
│   └── idempotency-cache.md   # Cache validation contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── plan.ts                    # P0: Generic errors, P1: Zod validation
│   ├── services/
│   │   └── idempotency.ts             # P0: Cache validation, TTL, fail-closed
│   └── lib/
│       ├── validation/
│       │   ├── NumericValidator.ts    # P1: NaN/Infinity detection (NEW)
│       │   ├── PlanRequestSchema.ts   # P1: Zod schema for API (NEW)
│       │   └── IdempotencySchemas.ts  # P2: Runtime validation (NEW)
│       ├── security/
│       │   ├── ErrorSanitizer.ts      # P0: Generic error messages (NEW)
│       │   ├── ConsoleGuard.ts        # P0: Dev-only logging (NEW)
│       │   └── PiiSanitizer.ts        # P2: Remove PII from cache (NEW)
│       └── utils/
│           ├── MaxDepthValidator.ts   # P2: JSON depth limit (NEW)
│           └── dateUtils.ts           # P3: Timestamp comparison (MODIFY)
└── tests/
    ├── unit/
    │   ├── NumericValidator.test.ts
    │   ├── ErrorSanitizer.test.ts
    │   ├── ConsoleGuard.test.ts
    │   ├── PiiSanitizer.test.ts
    │   └── MaxDepthValidator.test.ts
    └── integration/
        ├── idempotency.test.ts
        └── validation.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.tsx             # P1: WCAG 44×44px touch targets
│   │   ├── results/
│   │   │   └── ResultsThisWeek.tsx    # P0: Remove console.error in prod
│   │   └── inputs/
│   │       └── InputCard.tsx          # P1: Runtime type guards
│   ├── contexts/
│   │   └── PaymentContext.tsx         # P2: Atomic updates
│   ├── lib/
│   │   ├── validation/
│   │   │   └── RuntimeTypeGuard.ts    # P1: UI event validation (NEW)
│   │   └── telemetry/
│   │       └── telemetry.ts           # P1: Typed navigator.doNotTrack
│   └── styles/
│       └── components/
│           └── MobileMenu.tsx         # P3: Remove redundant styles
└── tests/
    ├── components/
    │   ├── button.test.tsx
    │   └── ResultsThisWeek.test.tsx
    └── lib/
        └── RuntimeTypeGuard.test.ts

scripts/
└── fix-lint.sh                         # P3: Remove hardcoded paths
```

**Structure Decision**: Web application structure with frontend/backend separation. This cleanup feature touches existing files across both layers. The structure follows the established PayPlan architecture with new validation/security libraries added under `lib/` directories. Testing mirrors source structure with unit and integration test separation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations - this feature reduces technical debt and establishes quality baselines without introducing new architectural complexity.

## Phase 0: Research & Unknowns

### Research Questions

1. **Environment Detection Pattern**: How should the system distinguish production from development builds for conditional logging (FR-001)?
   - **Options**: process.env.NODE_ENV, build flags, environment variables
   - **Decision needed**: Which pattern aligns with existing PayPlan build configuration?

2. **Idempotency Cache Format**: What data structure should be used for validated cache entries (FR-011)?
   - **Options**: Zod schemas for cache keys/values, JSON Schema, custom validators
   - **Decision needed**: How to validate without introducing performance overhead?

3. **Atomic Update Pattern**: What mechanism should PaymentContext use for race-free updates (FR-015)?
   - **Options**: Immer for immutable updates, useReducer with atomic actions, custom update queue
   - **Decision needed**: Which pattern fits React 19.1.1 best practices?

4. **Button Size Implementation**: How to ensure 44×44px minimum while preserving existing design system (FR-006)?
   - **Options**: CSS min-width/height, padding adjustments, wrapper components
   - **Decision needed**: Which approach maintains visual consistency?

5. **PII Detection Strategy**: How to identify and remove PII fields from arbitrary cache objects (FR-013)?
   - **Options**: Field name matching, deep object traversal, allowlist vs blocklist
   - **Decision needed**: How to handle nested PII and dynamic field names?

### Technology Best Practices

1. **Zod Validation Patterns** (FR-007, FR-011):
   - Industry standard for TypeScript runtime validation
   - Research: Optimal schema composition, error message customization, performance tuning

2. **WCAG 2.1 AA Touch Targets** (FR-006):
   - 44×44px minimum for mobile accessibility
   - Research: CSS techniques, responsive design patterns, assistive technology testing

3. **Generic Error Handling** (FR-002):
   - Standard format: "An error occurred. Please try again."
   - Research: Error logging strategies, client/server error separation, error boundary patterns

4. **JSON Security** (FR-012):
   - 10-level maximum depth for DoS protection
   - Research: Recursive depth validation, performance impact, parser configuration

5. **Idempotency Patterns** (FR-005):
   - 24-hour TTL industry standard for payment systems
   - Research: Cache invalidation, key generation, collision handling

### Dependencies & Integrations

1. **Existing Test Suite**: 1387 tests must continue passing (NFR-001)
   - Integration: Run full test suite after each fix, monitor for regressions

2. **CodeRabbit Findings**: 44 issues from commit 80aa6a6
   - Integration: Map each issue to functional requirement, track resolution

3. **Linear Issues**: MMT-21 through MMT-32
   - Integration: Update issue status as fixes are implemented

4. **Build System**: TypeScript compilation, ESLint, bundler
   - Integration: Monitor build time and bundle size metrics

## Phase 1: Design Artifacts

### data-model.md

Will define validation schemas, security components, and architectural patterns:

1. **Validation Schemas** (Phase 1)
   - PlanRequestSchema (Zod)
   - IdempotencyCacheSchema (Zod)
   - NumericValidationRules

2. **Security Components** (Phase 1)
   - ErrorSanitizer interface
   - ConsoleGuard interface
   - PiiSanitizer interface (with PII field list)

3. **Architectural Patterns** (Phase 1)
   - MaxDepthValidator configuration
   - AtomicUpdatePattern for PaymentContext
   - TimezoneHandler interface

### contracts/

Will define component contracts and API patterns:

1. **validation-api.md**: Zod schema patterns, validation error formats
2. **error-handling.md**: Generic error response contract, logging requirements
3. **idempotency-cache.md**: Cache entry format, TTL configuration, validation rules

### quickstart.md

Will provide developer testing scenarios:

1. **P0 Security Tests**: Test production console, malformed cache, duplicate payments
2. **P1 Type Safety Tests**: Test button sizes, invalid API requests, NaN detection
3. **P2 Architecture Tests**: Test JSON depth, PII sanitization, concurrent updates
4. **P3 Code Quality Tests**: Test script portability, date sorting

## Phase 2: Task Breakdown

*Generated by `/speckit.tasks` command - not included in this plan*

Will decompose implementation into atomic, testable tasks organized by priority (P0 → P1 → P2 → P3).

## Notes

- **CodeRabbit Source**: Commit 80aa6a6 (ESLint fix work)
- **Linear Epic**: MMT-31
- **Estimated Effort**: 15-21 hours total
- **Rollout Strategy**: Incremental by priority (P0 mandatory, P1-P3 can be deferred)
- **Testing Strategy**: Each fix requires new automated tests proving resolution
