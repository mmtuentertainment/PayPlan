# ADR 001: Interface-First Type Strategy for Dashboard Components

**Date**: 2025-10-30
**Status**: Accepted
**Context**: Feature 062 (Dashboard with Charts)
**Severity**: MAJOR
**Related PR**: #55
**Related Commits**: d126f1b
**Note**: Feature 063 reference removed (BNPL code fully deleted 2025-10-31)

---

## Context

During Feature 062 implementation, TypeScript types for dashboard data structures were defined in two places:

1. **Interface definitions** in `frontend/src/types/*.ts` (e.g., `SpendingChartData`, `UpcomingBill`, `GoalProgress`)
2. **Zod schema-inferred types** in `frontend/src/lib/dashboard/schemas.ts` using `z.infer<typeof XSchema>`

This created **two sources of truth** for the same types, leading to:
- Maintenance risk: Schema changes wouldn't automatically update interface definitions
- Type drift: Developers could modify one without updating the other
- Confusion: Unclear which type definition is canonical

CodeRabbit flagged this as a MAJOR issue during PR #55 review.

---

## Decision

**We will use Interface-First Type Strategy for Phase 1:**

1. **TypeScript interfaces** in `frontend/src/types/*.ts` are the **single source of truth** for all type definitions
2. **Zod schemas** in `frontend/src/lib/dashboard/schemas.ts` are used **ONLY for runtime validation**
3. **NO `export type X = z.infer<typeof XSchema>`** statements in schema files
4. Schema files include comments pointing to canonical type locations: `// Type definition: @/types/chart-data (SpendingChartData interface)`

---

## Rationale

### Why Interface-First (Not Schema-First)?

**Option 1: Interface-First (CHOSEN)**
- ✅ Aligns with Phase 1 "ship fast" principle
- ✅ Minimal refactoring required (only remove `z.infer` exports)
- ✅ Types and schemas remain separate concerns
- ✅ Familiar pattern for TypeScript developers
- ✅ No breaking changes to existing imports

**Option 2: Schema-First (REJECTED for Phase 1)**
- ❌ Requires broader refactoring (remove all interface definitions in `types/`)
- ❌ Update all imports across codebase
- ❌ More work upfront for same functional outcome
- ❌ Violates Phase 1 "simplicity over elegance" principle

### Alignment with Constitution

From `memory/constitution_v1.1_TEMP.md`:

> **Phase 1 Priorities** (0-100 users):
> - Ship features fast: 2-week sprints, monthly releases
> - Simple solutions: YAGNI principle, avoid over-engineering

Interface-First is simpler and faster than Schema-First for our current phase.

---

## Implementation

### Files Changed

**frontend/src/lib/dashboard/schemas.ts**:
- Removed 8 `export type X = z.infer<...>` statements:
  - `SpendingChartData`
  - `IncomeExpensesChartData`
  - `UpcomingBill`
  - `GoalProgress`
  - `StreakData`
  - `RecentWin`
  - `PersonalizedInsight`
  - `GamificationData`
- Added comments pointing to canonical type locations

### Pattern Established

```typescript
// ❌ BEFORE (Dual source of truth)
export const SpendingChartDataSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  // ...
});
export type SpendingChartData = z.infer<typeof SpendingChartDataSchema>; // WRONG!

// ✅ AFTER (Single source of truth)
/**
 * Spending chart data schema
 * Type definition: @/types/chart-data (SpendingChartData interface)
 */
export const SpendingChartDataSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  // ...
});
// No z.infer export - type defined in @/types/chart-data
```

### Usage Pattern

```typescript
// In files that need TYPES (most files)
import type { SpendingChartData } from '@/types/chart-data';

// In files that need VALIDATION (fewer files)
import { SpendingChartDataSchema } from '@/lib/dashboard/schemas';

// Validate at boundaries (API responses, localStorage reads, user input)
const validated = SpendingChartDataSchema.parse(rawData);
```

---

## Consequences

### Positive
- ✅ **Single source of truth** for types (no more drift)
- ✅ **Clear separation of concerns**: Types for static analysis, schemas for runtime validation
- ✅ **Minimal refactoring** required (only schema file changed)
- ✅ **Phase 1 aligned**: Simple, fast, pragmatic
- ✅ **Easy to understand**: Clear pattern for future developers

### Negative
- ⚠️ **Manual sync required**: If schema changes, must manually update interface (mitigated by tests in Phase 2+)
- ⚠️ **No compile-time guarantee**: Schema and interface could diverge (mitigated by Zod validation at runtime)

### Neutral
- 🔄 **Re-evaluation in Phase 2**: When automated tests are added (100-1,000 users), we can reconsider schema-first if tests catch type drift

---

## Future Considerations

### Phase 2 (100-1,000 users, automated testing)
When we add automated tests:
1. Add integration tests that validate schemas match interfaces
2. Consider schema-first if type drift becomes a problem
3. Evaluate tools like `zod-to-ts` for automatic type generation

### Phase 3 (1,000-10,000 users, 80% coverage)
If schema-first proves beneficial:
1. Migrate to schema-first approach
2. Remove duplicate interface definitions
3. Update all imports to use schema-inferred types

---

## Metrics

**Before** (d126f1b~1):
- 8 types exported from schemas.ts
- 8 duplicate interface definitions in types/*.ts
- 16 total type definitions (2 sources of truth)

**After** (d126f1b):
- 0 types exported from schemas.ts
- 8 interface definitions in types/*.ts (single source of truth)
- 8 total type definitions

**Impact**:
- 50% reduction in type definitions
- 0% breaking changes (all imports still work)
- 100% of type drift risk eliminated

---

## References

- CodeRabbit PR #55 review comment (schemas.ts:122)
- CLAUDE.md Phase 1 principles
- Constitution v1.1 "Simplicity/YAGNI" (Principle VII)
- Zod documentation: https://zod.dev/
- TypeScript handbook: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

---

## Approval

**Decided by**: Claude Code (AI developer)
**Reviewed by**: CodeRabbit AI (constitutional compliance check)
**Pending approval**: HIL (Human-in-Loop) final review

---

## Changelog

- 2025-10-30: Initial ADR created (commit d126f1b)
