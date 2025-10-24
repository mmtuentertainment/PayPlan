# Feature 018 Specification Prompt (ULTRA THINK Optimized)

## Context for Claude Code

This prompt is optimized for `/speckit.specify` to create a comprehensive Technical Debt Cleanup feature that systematically addresses all 44 CodeRabbit findings from the ESLint fix review.

---

## The Prompt

Build a Technical Debt Cleanup feature for PayPlan that systematically addresses security vulnerabilities, type safety issues, and architectural improvements identified by CodeRabbit review of the ESLint fix work (commit 80aa6a6). This feature bundles 44 related issues into a cohesive cleanup sprint organized by priority and impact.

### User Story 1 - Critical Security & Business Logic Fixes (P0)

Users are at risk when:
- **Payment validation errors leak to production console** (ResultsThisWeek.tsx) - Exposes sensitive payment details in browser DevTools
- **API errors expose internal implementation details** (plan.ts) - Raw error messages reveal system internals to clients
- **Idempotency cache can crash on malformed data** (idempotency.ts:69) - JSON.parse without validation crashes payment handlers
- **Idempotency failures allow unsafe operations** (idempotency.ts:80-83) - Fail-open pattern permits duplicate payments
- **Idempotency TTL is only 60 seconds** (idempotency.ts:13) - Users can duplicate payments after 1 minute, industry standard is 24 hours

**Why this priority**: These are critical security and business logic issues that directly impact payment safety, user privacy, and system reliability. Must be fixed before production deployment.

**Independent Test**: Can test each fix in isolation - wrap console in DEV check, validate parsed cache data, increase TTL constant, return generic errors.

**Acceptance Scenarios**:
1. **Given** production build deployed, **When** validation error occurs, **Then** no payment details appear in browser console (dev builds still log)
2. **Given** API internal error occurs, **When** error returned to client, **Then** generic message shown, full error logged server-side only
3. **Given** malformed cache data exists, **When** idempotency check runs, **Then** treats as cache miss without crashing
4. **Given** cache check fails, **When** payment operation attempted, **Then** operation aborts with error (fail-closed)
5. **Given** payment retry after 30 minutes, **When** idempotency check runs, **Then** detects duplicate and prevents retry (24hr TTL)

---

### User Story 2 - Type Safety & WCAG Compliance (P1)

Users experience issues when:
- **Touch targets too small on mobile** (button 'sm' variant 40px < 44px WCAG minimum) - Accessibility violation
- **API accepts malformed payment data** (plan.ts request body) - No Zod validation allows invalid amounts, dates, missing fields
- **Financial calculations receive NaN** (plan.ts parseFloat) - Corrupts payment schedules with invalid numeric data
- **UI components accept invalid state values** (InputCard type assertions) - Type assertions bypass runtime validation for tabs/radio inputs
- **Browser API accessed without type safety** (telemetry navigator.doNotTrack) - Untyped access to DoNotTrack property

**Why this priority**: Type safety prevents financial calculation errors and data corruption. WCAG compliance is legally required for accessibility. These issues directly impact user experience and application reliability.

**Independent Test**: Fix button sizes, add Zod schemas, validate parseFloat, add runtime guards - each testable independently.

**Acceptance Scenarios**:
1. **Given** button with 'sm' variant on mobile, **When** user taps it, **Then** touch target is ≥ 44×44px
2. **Given** malformed API request body, **When** validation runs, **Then** returns 400 with descriptive errors before processing
3. **Given** invalid amount string "abc", **When** parseFloat runs, **Then** detects NaN and throws error with item identification
4. **Given** invalid tab value, **When** onChange fires, **Then** runtime validation rejects or defaults safely
5. **Given** browser without doNotTrack, **When** telemetry checks DNT, **Then** typed access prevents errors

---

### User Story 3 - Architecture & Runtime Validation (P2)

The codebase has architectural gaps:
- **Idempotency types lack runtime validation** - TypeScript types but no Zod schemas for cache data
- **Idempotency cache vulnerable to DoS** - Unbounded JSON nesting allows malicious payloads
- **Idempotency cache may store PII** - No sanitization before caching responses
- **Plan API types need Zod schemas** - InstallmentItem and related types lack runtime validation
- **CSV schema allows negative amounts without rules** - No business constraints on negative payments
- **Date/time validation is timezone-dependent** - Date.parse and timestamp validation unreliable
- **PaymentContext risks race conditions** - setPayments replaces entire array, needs atomic updates

**Why this priority**: These are architectural improvements that prevent future bugs, improve maintainability, and strengthen the security posture. Not blocking current functionality but important for long-term quality.

**Independent Test**: Add Zod schemas, implement max-depth validation, add PII sanitization, refactor PaymentContext - each testable via unit tests.

**Acceptance Scenarios**:
1. **Given** deeply nested JSON payload (>10 levels), **When** cache validation runs, **Then** rejects with "Maximum nesting depth exceeded"
2. **Given** cache entry with PII fields, **When** sanitization runs, **Then** strips email/name/accountId before storing
3. **Given** malformed InstallmentItem, **When** Zod validation runs, **Then** returns descriptive errors
4. **Given** concurrent payment updates, **When** using PaymentContext, **Then** atomic methods prevent race conditions
5. **Given** negative amount in CSV, **When** validation runs, **Then** either rejects or validates as refund with clear rules

---

### User Story 4 - Code Quality & Documentation (P3)

Minor improvements needed:
- **Redundant inline styles** (MobileMenu backgroundColor) - Duplicates Tailwind classes
- **Script portability issues** (fix-lint.sh hardcoded paths) - Breaks on different machines
- **Incomplete type guards** (PreferenceStorageService error.code) - TypeScript doesn't narrow properly
- **Fragile date sorting** (plan.ts localeCompare) - Should use timestamp comparison
- **eslint-disable without explanation** - Should be JSDoc @todo tags with ticket references

**Why this priority**: Code quality improvements that don't impact functionality but improve maintainability, developer experience, and future refactoring safety.

**Independent Test**: Each is a small isolated change - remove style prop, update script, add typeof check, fix sort function.

---

### Edge Cases

- What if CodeRabbit finds more issues during this feature's review? Add them to a Future-Issues.md document for next cleanup sprint
- How do we prevent regressions? Add tests for each fix (e.g., test console.error only runs in dev, test NaN rejection)
- What if fixes break existing functionality? Comprehensive test suite (1387 tests) must pass at 100%
- How do we prioritize if time is limited? P0 must be completed, P1-P3 can be deferred to future sprints

---

### Requirements (mandatory)

#### Functional Requirements

**Security (P0)**
- **FR-001**: System MUST NOT log payment validation details in production builds
- **FR-002**: API MUST return generic error messages to clients, logging details server-side only
- **FR-003**: Idempotency cache MUST validate JSON.parse results before use
- **FR-004**: Idempotency check failures MUST fail-closed (abort operation)
- **FR-005**: Idempotency TTL MUST be ≥ 24 hours (configurable via environment)

**Type Safety (P1)**
- **FR-006**: All button variants MUST meet WCAG 44×44px minimum on mobile
- **FR-007**: Plan API MUST validate request body with Zod schema before processing
- **FR-008**: Numeric parsing MUST validate for NaN/Infinity before financial calculations
- **FR-009**: UI component event handlers MUST validate values at runtime
- **FR-010**: Browser API access MUST use proper TypeScript types

**Architecture (P2)**
- **FR-011**: Idempotency MUST have Zod schemas for runtime validation
- **FR-012**: JSON nesting MUST be limited to 10 levels (DoS protection)
- **FR-013**: Cache entries MUST be sanitized to remove PII before storage
- **FR-014**: Plan types MUST have Zod schema companions
- **FR-015**: Date/time validation MUST be timezone-independent

#### Non-Functional Requirements

- **NFR-001**: All 1387 existing tests MUST continue passing
- **NFR-002**: ESLint MUST remain at 0 errors after fixes
- **NFR-003**: TypeScript compilation MUST succeed
- **NFR-004**: No performance regressions (build time, bundle size)
- **NFR-005**: Changes MUST be backwards compatible

---

### Success Criteria (mandatory)

**Measurable Outcomes**:

- **SC-001**: 0 P0 security issues remaining (currently 4)
- **SC-002**: 0 P1 type safety issues remaining (currently 5)
- **SC-003**: Production console has 0 payment-related logs
- **SC-004**: API error responses contain 0 internal details
- **SC-005**: Idempotency cache crash rate = 0% (currently vulnerable)
- **SC-006**: Duplicate payment rate < 0.01% (24hr TTL enforcement)
- **SC-007**: All button touch targets ≥ 44×44px (WCAG compliant)
- **SC-008**: API validation rejects 100% of malformed requests
- **SC-009**: Financial calculations have 0 NaN occurrences
- **SC-010**: Test suite maintains 100% pass rate (1387/1387)

---

### Key Entities

**Security Enhancements**:
- **ConsoleGuard**: Development-only logging wrapper
- **GenericErrorResponse**: Client-safe error messaging
- **IdempotencyCacheValidator**: Runtime validation for cache entries
- **FailClosedHandler**: Error handling that aborts unsafe operations

**Type Safety Additions**:
- **PlanRequestSchema**: Zod validation for API input
- **NumericValidator**: NaN/Infinity detection for financial data
- **RuntimeTypeGuard**: Runtime validation for UI event handlers
- **IdempotencySchemas**: Zod schemas for cache layer

**Architectural Improvements**:
- **PiiSanitizer**: Strips sensitive data before caching
- **MaxDepthValidator**: DoS protection for nested JSON
- **AtomicPaymentUpdater**: Race-condition-free payment updates

---

### Out of Scope

- **New features**: This is cleanup only, no new user-facing functionality
- **UI changes**: No visual changes except button size fix
- **API changes**: No breaking changes to existing endpoints
- **Performance optimization**: Focus on correctness, not speed improvements
- **Refactoring unrelated code**: Only touch files with identified issues

---

### Notes

**Source**: CodeRabbit review generated 44 findings after fixing all 101 ESLint errors
**Linear Epic**: MMT-31 tracks all issues
**Individual Issues**: MMT-21 (P0 console), MMT-22 (P0 errors), MMT-23 (P0 cache), MMT-24 (P0 fail-open), MMT-25 (P0 TTL), MMT-26 (P1 WCAG), MMT-27 (P1 validation), MMT-28 (P1 NaN), MMT-29 (P1 assertions), MMT-30 (P1 telemetry), MMT-32 (P2 schemas)

**Estimated Effort**: 15-21 hours total
- User Story 1 (P0): 2-3 hours
- User Story 2 (P1): 3-4 hours
- User Story 3 (P2): 6-8 hours
- User Story 4 (P3): 4-6 hours

**Files Affected**: 20+ files across API layer, UI components, storage services, type definitions

**Testing Strategy**: Each fix requires unit tests proving the issue is resolved. Full regression suite (1387 tests) must pass.

---

## Why This is Spec-Kit Perfect

✅ **User-centric**: Describes WHAT users need (security, reliability) not HOW to implement
✅ **No technical implementation**: Focuses on requirements and acceptance criteria
✅ **Independent stories**: Each user story delivers value and can be tested separately
✅ **Clear scope**: Bounded to CodeRabbit findings, excludes new features
✅ **Measurable success**: Concrete metrics (0 P0 issues, 0 NaN, 100% tests passing)
✅ **Business value**: Security, compliance, reliability - all user-impacting outcomes

