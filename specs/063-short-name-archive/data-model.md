# Data Model: Archive BNPL Code

**Feature**: Archive BNPL Code (Feature 063)
**Branch**: `063-short-name-archive`
**Date**: 2025-10-30
**Status**: Phase 1 Design Complete

---

## Overview

This document defines the complete file relocation mapping for Feature 063 (Archive BNPL Code). Since this is a structural refactor (not a data model change), this document focuses on **file transformations**, **import path changes**, and **directory structure mappings**.

**Key Principle**: This refactor does NOT change any data structures, TypeScript types, or localStorage schemas. All BNPL types remain identical.

---

## File Relocation Mapping

### 1. BNPL Code Files (14 files)

#### Pages (1 file)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `frontend/src/pages/BNPLParser.tsx` | `frontend/src/archive/bnpl/pages/BNPLParser.tsx` | `git mv frontend/src/pages/BNPLParser.tsx frontend/src/archive/bnpl/pages/` |

#### Components (3 files)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `frontend/src/components/bnpl/BNPLEmailInput.tsx` | `frontend/src/archive/bnpl/components/bnpl/BNPLEmailInput.tsx` | `git mv frontend/src/components/bnpl/BNPLEmailInput.tsx frontend/src/archive/bnpl/components/bnpl/` |
| `frontend/src/components/bnpl/PaymentSchedulePreview.tsx` | `frontend/src/archive/bnpl/components/bnpl/PaymentSchedulePreview.tsx` | `git mv frontend/src/components/bnpl/PaymentSchedulePreview.tsx frontend/src/archive/bnpl/components/bnpl/` |
| `frontend/src/components/bnpl/ProviderBadge.tsx` | `frontend/src/archive/bnpl/components/bnpl/ProviderBadge.tsx` | `git mv frontend/src/components/bnpl/ProviderBadge.tsx frontend/src/archive/bnpl/components/bnpl/` |

#### Core Logic (1 file)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `frontend/src/lib/bnpl-parser.ts` | `frontend/src/archive/bnpl/lib/bnpl-parser.ts` | `git mv frontend/src/lib/bnpl-parser.ts frontend/src/archive/bnpl/lib/` |

#### Parsers (7 files)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `frontend/src/lib/parsers/affirm.ts` | `frontend/src/archive/bnpl/lib/parsers/affirm.ts` | `git mv frontend/src/lib/parsers/affirm.ts frontend/src/archive/bnpl/lib/parsers/` |
| `frontend/src/lib/parsers/afterpay.ts` | `frontend/src/archive/bnpl/lib/parsers/afterpay.ts` | `git mv frontend/src/lib/parsers/afterpay.ts frontend/src/archive/bnpl/lib/parsers/` |
| `frontend/src/lib/parsers/klarna.ts` | `frontend/src/archive/bnpl/lib/parsers/klarna.ts` | `git mv frontend/src/lib/parsers/klarna.ts frontend/src/archive/bnpl/lib/parsers/` |
| `frontend/src/lib/parsers/paypal-credit.ts` | `frontend/src/archive/bnpl/lib/parsers/paypal-credit.ts` | `git mv frontend/src/lib/parsers/paypal-credit.ts frontend/src/archive/bnpl/lib/parsers/` |
| `frontend/src/lib/parsers/sezzle.ts` | `frontend/src/archive/bnpl/lib/parsers/sezzle.ts` | `git mv frontend/src/lib/parsers/sezzle.ts frontend/src/archive/bnpl/lib/parsers/` |
| `frontend/src/lib/parsers/zip.ts` | `frontend/src/archive/bnpl/lib/parsers/zip.ts` | `git mv frontend/src/lib/parsers/zip.ts frontend/src/archive/bnpl/lib/parsers/` |
| `frontend/src/lib/parsers/index.ts` | `frontend/src/archive/bnpl/lib/parsers/index.ts` | `git mv frontend/src/lib/parsers/index.ts frontend/src/archive/bnpl/lib/parsers/` |

#### Storage (1 file)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `frontend/src/lib/storage/bnpl-storage.ts` | `frontend/src/archive/bnpl/lib/storage/bnpl-storage.ts` | `git mv frontend/src/lib/storage/bnpl-storage.ts frontend/src/archive/bnpl/lib/storage/` |

#### Types (1 file)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `frontend/src/types/bnpl.ts` | `frontend/src/archive/bnpl/types/bnpl.ts` | `git mv frontend/src/types/bnpl.ts frontend/src/archive/bnpl/types/` |

---

### 2. Specification Files (~10 files)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `specs/020-bnpl-parser/spec.md` | `specs/archived/020-bnpl-parser/spec.md` | `git mv specs/020-bnpl-parser specs/archived/` |
| `specs/020-bnpl-parser/plan.md` | `specs/archived/020-bnpl-parser/plan.md` | (included in above move) |
| `specs/020-bnpl-parser/[all files]` | `specs/archived/020-bnpl-parser/[all files]` | (included in above move) |

**Note**: Move entire directory at once to preserve internal references.

---

### 3. Manual Test Files (1 file)

| Current Path | Archive Path | Git Command |
|-------------|--------------|-------------|
| `manual-tests/020-bnpl-parser-test-results.md` | `manual-tests/archived/020-bnpl-parser-test-results.md` | `git mv manual-tests/020-bnpl-parser-test-results.md manual-tests/archived/` |

---

### 4. New Documentation Files (3 files)

| File Path | Type | Purpose |
|-----------|------|---------|
| `frontend/src/archive/bnpl/README.md` | NEW | Archive directory documentation |
| `specs/archived/README.md` | NEW | Archived specs documentation |
| `manual-tests/archived/README.md` | NEW | Archived test results documentation |
| `docs/migrations/archive-bnpl-code.md` | NEW | Migration guide with rollback procedures |

---

## Import Path Transformations

### Transformation Rules

**Pattern**: Add `archive/bnpl/` prefix to all BNPL imports

**Examples**:

```typescript
// BEFORE archival
import BNPLParser from './pages/BNPLParser';
import { BNPLEmailInput } from './components/bnpl/BNPLEmailInput';
import { parseBNPLEmail } from './lib/bnpl-parser';
import type { BNPLProvider } from './types/bnpl';

// AFTER archival
import BNPLParser from './archive/bnpl/pages/BNPLParser';
import { BNPLEmailInput } from './archive/bnpl/components/bnpl/BNPLEmailInput';
import { parseBNPLEmail } from './archive/bnpl/lib/bnpl-parser';
import type { BNPLProvider } from './archive/bnpl/types/bnpl';
```

### Import Search Commands

**Find all files importing BNPL code**:

```bash
# Find imports of BNPL page
grep -rn "from.*pages/BNPLParser" frontend/src/ > /tmp/imports-bnpl-parser.txt

# Find imports of BNPL components
grep -rn "from.*components/bnpl" frontend/src/ > /tmp/imports-bnpl-components.txt

# Find imports of BNPL lib
grep -rn "from.*lib/bnpl-parser" frontend/src/ > /tmp/imports-bnpl-lib.txt

# Find imports of BNPL storage
grep -rn "from.*lib/storage/bnpl-storage" frontend/src/ > /tmp/imports-bnpl-storage.txt

# Find imports of BNPL types
grep -rn "from.*types/bnpl" frontend/src/ > /tmp/imports-bnpl-types.txt

# Find imports of parsers
grep -rn "from.*lib/parsers" frontend/src/ > /tmp/imports-parsers.txt
```

**Expected Import Locations**:

| Importing File | Import Type | Expected Count |
|---------------|-------------|----------------|
| `frontend/src/App.tsx` | Route definition | 1 import (BNPLParser page) |
| `frontend/src/archive/bnpl/pages/BNPLParser.tsx` | Component imports | 3 imports (BNPL components) |
| `frontend/src/archive/bnpl/components/bnpl/*.tsx` | Type imports | ~3 imports (BNPL types) |
| `frontend/src/archive/bnpl/lib/bnpl-parser.ts` | Parser imports | 6 imports (provider parsers) |

**IMPORTANT**: Demo and Import routes (`frontend/src/pages/Demo.tsx`, `frontend/src/pages/Import.tsx`) use `lib/email-extractor.ts` (NEW email extraction system), NOT `lib/bnpl-parser.ts`. These imports should NOT change during archival.

---

## Directory Structure Changes

### Before Archival

```
frontend/src/
├── pages/
│   ├── BNPLParser.tsx          ← BNPL code
│   ├── Dashboard.tsx
│   ├── Demo.tsx
│   └── Import.tsx
├── components/
│   ├── bnpl/                   ← BNPL code
│   │   ├── BNPLEmailInput.tsx
│   │   ├── PaymentSchedulePreview.tsx
│   │   └── ProviderBadge.tsx
│   └── dashboard/
│       └── [dashboard components]
├── lib/
│   ├── bnpl-parser.ts          ← BNPL code
│   ├── email-extractor.ts      ← NEW (used by Demo/Import)
│   ├── parsers/                ← BNPL code
│   │   ├── affirm.ts
│   │   ├── afterpay.ts
│   │   ├── klarna.ts
│   │   ├── paypal-credit.ts
│   │   ├── sezzle.ts
│   │   ├── zip.ts
│   │   └── index.ts
│   └── storage/
│       └── bnpl-storage.ts     ← BNPL code
└── types/
    ├── bnpl.ts                 ← BNPL code
    ├── dashboard.ts
    └── transaction.ts

specs/
└── 020-bnpl-parser/            ← BNPL spec
    ├── spec.md
    └── plan.md

manual-tests/
└── 020-bnpl-parser-test-results.md  ← BNPL test
```

### After Archival

```
frontend/src/
├── archive/
│   └── bnpl/                   🆕 ARCHIVED BNPL CODE
│       ├── README.md           🆕
│       ├── pages/
│       │   └── BNPLParser.tsx  ← MOVED
│       ├── components/
│       │   └── bnpl/           ← MOVED
│       │       ├── BNPLEmailInput.tsx
│       │       ├── PaymentSchedulePreview.tsx
│       │       └── ProviderBadge.tsx
│       ├── lib/
│       │   ├── bnpl-parser.ts  ← MOVED
│       │   ├── parsers/        ← MOVED
│       │   │   ├── affirm.ts
│       │   │   ├── afterpay.ts
│       │   │   ├── klarna.ts
│       │   │   ├── paypal-credit.ts
│       │   │   ├── sezzle.ts
│       │   │   ├── zip.ts
│       │   │   └── index.ts
│       │   └── storage/
│       │       └── bnpl-storage.ts  ← MOVED
│       └── types/
│           └── bnpl.ts         ← MOVED
├── pages/
│   ├── Dashboard.tsx
│   ├── Demo.tsx
│   └── Import.tsx
├── components/
│   └── dashboard/
│       └── [dashboard components]
├── lib/
│   ├── email-extractor.ts      ← UNCHANGED (used by Demo/Import)
│   └── storage/
└── types/
    ├── dashboard.ts
    └── transaction.ts

specs/
└── archived/                   🆕 ARCHIVED SPECS
    ├── README.md               🆕
    └── 020-bnpl-parser/        ← MOVED
        ├── spec.md
        └── plan.md

manual-tests/
└── archived/                   🆕 ARCHIVED TEST RESULTS
    ├── README.md               🆕
    └── 020-bnpl-parser-test-results.md  ← MOVED

docs/
└── migrations/
    └── archive-bnpl-code.md    🆕 MIGRATION GUIDE
```

---

## TypeScript Types (UNCHANGED)

**IMPORTANT**: This refactor does NOT change any TypeScript interfaces or Zod schemas. All BNPL types remain identical. Only file locations change.

### BNPL Types (from `frontend/src/types/bnpl.ts`)

**These types are NOT modified, only relocated**:

```typescript
// File location changes: types/bnpl.ts → archive/bnpl/types/bnpl.ts
// Type definitions remain IDENTICAL

export type BNPLProvider =
  | 'klarna'
  | 'affirm'
  | 'afterpay'
  | 'sezzle'
  | 'zip'
  | 'paypal-credit';

export interface BNPLPayment {
  id: string;
  provider: BNPLProvider;
  amount: number;
  dueDate: string;  // ISO 8601
  status: 'upcoming' | 'due' | 'overdue' | 'paid';
  description?: string;
}

export interface BNPLSchedule {
  provider: BNPLProvider;
  payments: BNPLPayment[];
  totalAmount: number;
  remainingAmount: number;
}

export interface ParsedBNPLEmail {
  provider: BNPLProvider;
  schedule: BNPLSchedule;
  confidence: number;  // 0-100%
  warnings?: string[];
}
```

**No Zod schema changes**: All validation logic remains identical, only import paths change.

---

## localStorage Schema (UNCHANGED)

**IMPORTANT**: This refactor does NOT change any localStorage keys or data structures.

### BNPL Storage Keys (UNCHANGED)

```typescript
// File location changes: lib/storage/bnpl-storage.ts → archive/bnpl/lib/storage/bnpl-storage.ts
// Storage keys remain IDENTICAL

const STORAGE_KEYS = {
  BNPL_SCHEDULES: 'bnpl_schedules',        // UNCHANGED
  BNPL_SETTINGS: 'bnpl_settings',          // UNCHANGED
  BNPL_LAST_SYNC: 'bnpl_last_sync',        // UNCHANGED
};

// Data structure remains IDENTICAL
interface BNPLStorageData {
  schedules: BNPLSchedule[];
  lastUpdated: string;  // ISO 8601
}
```

**Validation**: After archival, verify localStorage keys unchanged:
```javascript
// In browser console
Object.keys(localStorage).filter(key => key.includes('bnpl'))
// Expected: ['bnpl_schedules', 'bnpl_settings', 'bnpl_last_sync']
```

---

## Route Configuration Changes

### App.tsx Route Updates

**File**: `frontend/src/App.tsx`

**Change Type**: Import path update ONLY (route path unchanged)

```typescript
// BEFORE archival
import BNPLParser from './pages/BNPLParser';

const routes = [
  { path: '/bnpl', element: <BNPLParser /> },  // Route path UNCHANGED
  { path: '/demo', element: <Demo /> },        // Route path UNCHANGED
  { path: '/import', element: <Import /> },    // Route path UNCHANGED
];

// AFTER archival
import BNPLParser from './archive/bnpl/pages/BNPLParser';  // ← Import path changed

const routes = [
  { path: '/bnpl', element: <BNPLParser /> },  // Route path UNCHANGED
  { path: '/demo', element: <Demo /> },        // Route path UNCHANGED
  { path: '/import', element: <Import /> },    // Route path UNCHANGED
];
```

**User-Facing Impact**: ZERO (routes work identically)

---

## Validation Checklist

### 1. File Relocation Validation

After running `git mv` commands:

```bash
# Verify all 14 BNPL code files moved
find frontend/src/archive/bnpl -type f -name "*.ts" -o -name "*.tsx" | wc -l
# Expected: 14

# Verify original locations empty (parsers directory removed)
ls frontend/src/lib/parsers 2>/dev/null
# Expected: No such file or directory

# Verify original BNPL component directory empty
ls frontend/src/components/bnpl 2>/dev/null
# Expected: No such file or directory
```

### 2. Import Path Validation

```bash
# TypeScript compilation must succeed
cd frontend && npm run build
# Expected: Exit code 0 (no errors)

# Verify no broken imports
grep -r "from.*pages/BNPLParser" frontend/src/ | grep -v archive
# Expected: 1 result (App.tsx updated import)

# Verify Demo/Import routes still use email-extractor (NOT bnpl-parser)
grep -r "from.*lib/email-extractor" frontend/src/pages/Demo.tsx frontend/src/pages/Import.tsx
# Expected: 2 results (both files import email-extractor)
```

### 3. Route Functionality Validation

**Manual Testing**:
1. Navigate to `/bnpl` → verify BNPL parser loads
2. Paste sample BNPL email → verify parsing works
3. Navigate to `/demo` → verify demo loads (uses email-extractor, not bnpl-parser)
4. Navigate to `/import` → verify import loads (uses email-extractor, not bnpl-parser)
5. Check browser console → verify no import errors

### 4. Git History Validation

```bash
# Verify git tracks file moves
git log --follow frontend/src/archive/bnpl/pages/BNPLParser.tsx
# Expected: Full commit history (including pre-archival commits)

# Verify git blame works
git blame frontend/src/archive/bnpl/lib/bnpl-parser.ts
# Expected: Author names and dates from original file
```

### 5. Documentation Validation

**Check all new documentation created**:

```bash
# Verify archive README exists
[ -f frontend/src/archive/bnpl/README.md ] && echo "✅ Archive README created" || echo "❌ MISSING"

# Verify specs README exists
[ -f specs/archived/README.md ] && echo "✅ Specs README created" || echo "❌ MISSING"

# Verify manual tests README exists
[ -f manual-tests/archived/README.md ] && echo "✅ Manual tests README created" || echo "❌ MISSING"

# Verify migration doc exists
[ -f docs/migrations/archive-bnpl-code.md ] && echo "✅ Migration doc created" || echo "❌ MISSING"
```

---

## Edge Cases & Special Handling

### Edge Case 1: Circular Dependencies

**Scenario**: BNPL components import from active budget code

**Detection**:
```bash
grep -r "from.*lib/categories" frontend/src/archive/bnpl/
grep -r "from.*lib/budgets" frontend/src/archive/bnpl/
```

**Resolution**: If circular dependencies found, extract shared utilities to `frontend/src/lib/shared/` (per research.md clarification #2). Update imports in both active and archived code.

### Edge Case 2: Shared UI Primitives

**Scenario**: BNPL components use Radix UI primitives from active code

**Detection**:
```bash
grep -r "from.*components/ui" frontend/src/archive/bnpl/
```

**Resolution**: If found, keep imports pointing to active `components/ui/` (do NOT archive Radix primitives). BNPL archived code can depend on active UI primitives.

### Edge Case 3: Import Conflicts with Demo/Import Routes

**Scenario**: Demo or Import routes accidentally import from archived bnpl-parser.ts instead of email-extractor.ts

**Detection**:
```bash
grep -r "from.*archive/bnpl" frontend/src/pages/Demo.tsx frontend/src/pages/Import.tsx
```

**Resolution**: If found, revert changes. Demo and Import must use `lib/email-extractor.ts` (NEW system), NOT archived `bnpl-parser.ts` (OLD system).

---

## Success Criteria

**Data model phase complete when**:

1. ✅ All 14 BNPL code files mapped (pages, components, lib, types)
2. ✅ Import path transformation rules documented
3. ✅ Directory structure before/after diagrams created
4. ✅ Validation commands defined (git, TypeScript, grep)
5. ✅ Edge case detection and resolution strategies documented
6. ✅ TypeScript type preservation confirmed (no schema changes)
7. ✅ localStorage schema preservation confirmed (no key changes)
8. ✅ Route configuration changes documented (import paths only)

**Ready for**: quickstart.md (Phase 1 implementation guide)

---

## References

- **Specification**: [spec.md](./spec.md) - User stories and requirements
- **Research**: [research.md](./research.md) - Git best practices, import patterns
- **Plan**: [plan.md](./plan.md) - Constitution check, project structure
