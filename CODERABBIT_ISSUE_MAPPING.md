# CodeRabbit Issue to Feature Mapping
**Created**: 2025-10-23
**Purpose**: Map CodeRabbit findings to feature specs for proper organization

## Feature 017 - Navigation System
**Spec**: `specs/017-navigation-system/spec.md`

### Issues
1. **MobileMenu.tsx:191** (P3 Nitpick)
   - Issue: Redundant backgroundColor inline style
   - Fix: Remove inline style, rely on Tailwind bg-white
   - Add to spec.md under "Technical Refinements" or tasks.md

## Feature 016 - Payment Archive System
**Spec**: `specs/016-build-a-payment/spec.md`

### Issues
1. **ResultsThisWeek.tsx:67-70** (P0 Critical) - **MMT-21**
   - Issue: console.error in production
   - Fix: Wrap in import.meta.env.DEV
   - Add to spec.md under "Security Requirements"

2. **ResultsThisWeek.tsx:177** (P3 Nitpick)
   - Issue: Type assertion instead of type guard
   - Fix: Add hasDefinedId type guard
   - Add to tasks.md as refinement task

3. **PaymentContext.types.ts:17-23** (P2 Potential Issue)
   - Issue: setPayments risks race conditions
   - Fix: Add atomic update methods
   - Add to spec.md under "Data Model" section

4. **PaymentContext.types.ts:28-31** (P3 Nitpick)
   - Issue: Controlled provider pattern unclear
   - Fix: Document or refactor to own state
   - Add to data-model.md

5. **PaymentContext.context.ts:8-9** (P2 Potential Issue)
   - Issue: (Empty prompt - need investigation)
   - Add to research.md for investigation

## Feature 014 - CSV Export System
**Spec**: `specs/014-build-a-csv/spec.md`

### Issues
1. **csvExport.ts:47-49** (P2 Potential Issue)
   - Issue: Negative amounts without business rules
   - Fix: Add validation or document refund handling
   - Add to spec.md under "Data Validation"

2. **csvExport.ts:63-68** (P3 Nitpick)
   - Issue: Date.parse is timezone-dependent
   - Fix: Use explicit UTC component validation
   - Add to spec.md under "Date Handling"

3. **csvExport.ts:74-79** (P2 Potential Issue)
   - Issue: paid_timestamp needs ISO8601 validation
   - Fix: Use Zod .datetime() validator
   - Add to spec.md under "Timestamp Validation"

## Feature 007-0022 - OpenAPI v1 Plan Endpoint
**Spec**: `specs/007-0022-openapi-v1-plan/spec.md`

### Issues
1. **plan.ts:134-135** (P1 Critical) - **MMT-27**
   - Issue: No Zod validation on request body
   - Fix: Add PlanRequestSchema
   - Add to spec.md under "Input Validation"

2. **plan.ts:214-224** (P1 Critical) - **MMT-28**
   - Issue: parseFloat without NaN validation
   - Fix: Validate Number.isFinite()
   - Add to spec.md under "Numeric Processing"

3. **plan.ts:224** (P3 Nitpick)
   - Issue: localeCompare fragile for date sorting
   - Fix: Use timestamp comparison
   - Add to tasks.md

4. **plan.ts:287-294** (P0 Critical) - **MMT-22**
   - Issue: Raw error.message to client
   - Fix: Generic error messages
   - Add to spec.md under "Error Handling"

5. **plan.types.ts:14-22** (P2 Potential Issue)
   - Issue: InstallmentItem needs Zod schema
   - Fix: Create validation schema
   - Add to data-model.md

6. **plan.types.ts:28-36** (P3 Nitpick)
   - Issue: NormalizedInstallment needs branding
   - Fix: Add branded type
   - Add to data-model.md

7. **plan.types.ts:41-51** (P2 Potential Issue)
   - Issue: (Empty prompt)
   - Add to research.md

8. **plan.types.ts:56-79** (P2 Potential Issue)
   - Issue: Inline types should be named interfaces
   - Fix: Extract NormalizedOutputItem, MovedDateItem
   - Add to data-model.md

9. **plan.types.ts:97-115** (P3 Nitpick)
   - Issue: (Empty prompt)
   - Add to research.md

10. **plan.types.ts:120-125** (P2 Potential Issue)
    - Issue: timezone naming inconsistency
    - Fix: Rename to timeZone
    - Add to spec.md under "Field Naming"

11. **plan.types.ts:130-138** (P2 Refactor)
    - Issue: RiskFlag needs strict unions
    - Fix: Define risk_type and risk_severity unions
    - Add to data-model.md

## API Infrastructure (No specific feature - shared)
**Location**: Create `specs/API-Infrastructure/spec.md` OR add to existing API spec

### Issues
1. **idempotency.ts:13** (P0 Critical) - **MMT-25**
   - Issue: TTL too short
   - Fix: Increase to 24 hours

2. **idempotency.ts:69** (P0 Critical) - **MMT-23**
   - Issue: JSON.parse without validation
   - Fix: Add validation

3. **idempotency.ts:80-83** (P0 Critical) - **MMT-24**
   - Issue: Fail-open pattern
   - Fix: Fail-closed with error

4. **idempotency.ts:114** (P3 Nitpick)
   - Issue: _host parameter unclear
   - Fix: Document or remove

5. **idempotency.types.ts:1-75** (P2 Refactor) - **MMT-32**
   - Issue: Missing Zod schemas
   - Fix: Create idempotency.schemas.ts

6. **idempotency.types.ts:16-22** (P2 Potential Issue)
   - Issue: DoS risk from unbounded nesting
   - Fix: Add max depth validation

7. **idempotency.types.ts:39-42** (P3 Nitpick)
   - Issue: (Empty prompt)

8. **idempotency.types.ts:49-53** (P2 Potential Issue)
   - Issue: Cache stores PII
   - Fix: Sanitize before caching

9. **idempotency.types.ts:59-63** (P2 Refactor)
   - Issue: (Empty prompt)

10. **api.ts:70-76** (P3 Nitpick)
    - Issue: Problem Details not validated
    - Fix: Add Zod schema for RFC 9457

## Feature 008-0020-3 - Telemetry
**Spec**: `specs/008-0020-3-csv-telemetry/spec.md`

### Issues
1. **telemetry.ts:78-79** (P1 High) - **MMT-30**
   - Issue: navigator.doNotTrack untyped
   - Fix: Update nav alias with doNotTrack
   - Add to spec.md under "Browser API Integration"

## Feature 013 - User Preferences
**Spec**: `specs/013-user-preference-management/spec.md`

### Issues
1. **PreferenceStorageService.ts:547** (P3 Nitpick)
   - Issue: Type guard incomplete
   - Fix: Add typeof check for error.code
   - Add to spec.md under "Error Handling"

## Shared UI Components (No specific feature)
**Location**: Add to component documentation or create UI-Components spec

### Issues
1. **button.constants.ts:24-26** (P1 WCAG) - **MMT-26**
   - Issue: 'sm' variant < 44px
   - Fix: Increase to h-11
   - Add to global accessibility requirements

2. **badge.tsx, button.tsx** - Already fixed with eslint-disable
   - Documented as intentional re-exports

## Feature 001 - Inbox/Input
**Spec**: `specs/001-inbox-paste-phase/spec.md`

### Issues
1. **InputCard.tsx:199,259,284** (P1 High) - **MMT-29**
   - Issue: Type assertions bypass checks
   - Fix: Add runtime validation
   - Add to spec.md under "Input Validation"

## Shared/Testing Infrastructure

### Issues
1. **fix-lint.sh:5,7** (P2 Potential Issue)
   - Issue: Error handling + hardcoded paths
   - Fix: Improve script portability
   - Add to development docs or CI spec

2. **ResultsThisWeek.test.tsx:498-537** (P2 Potential Issue)
   - Issue: (Empty prompt)
   - Investigate and document

3. **PaymentStatusStorage.ts:286** (P2 Refactor)
   - Issue: eslint-disable should be @todo
   - Fix: Add JSDoc @todo for T053
   - Add to Feature 016 tasks.md

---

## Next Steps

1. Read each feature's spec.md
2. Add relevant CodeRabbit issues to appropriate sections
3. Ensure issues are contextualized within feature requirements
4. When /speckit.specify runs, it will include these improvements

**Ready to proceed with updating the feature specs?**
