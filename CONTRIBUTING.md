# Contributing to PayPlan

Welcome! This guide explains how to work with PayPlan's clean, feature-based codebase structure.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Adding a New Feature](#adding-a-new-feature)
3. [File Naming Conventions](#file-naming-conventions)
4. [Import Path Aliases](#import-path-aliases)
5. [Documentation Structure](#documentation-structure)
6. [Feature Specifications](#feature-specifications-specs)
7. [Development Tools](#development-tools-tools)
8. [Feature Organization Principles](#feature-organization-principles)
9. [Testing](#testing)
10. [Constitution Alignment](#constitution-alignment-v31)
11. [Quick Reference](#quick-reference)
12. [Development Workflow](#development-workflow)

---

## Project Structure

### Frontend (`frontend/src/`)

PayPlan uses a **feature-based architecture** where each feature is self-contained:

```
frontend/src/
├── features/              # Self-contained feature modules
│   ├── categories/        # Spending categories feature
│   │   ├── components/    # UI components
│   │   ├── hooks/         # React hooks
│   │   ├── lib/           # Business logic, storage, schemas
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Barrel export (public API)
│   ├── budgets/           # Budget creation & tracking
│   ├── dashboard/         # Dashboard with charts & widgets
│   ├── transactions/      # Transaction entry & management
│   └── archive/           # Transaction archives
│
└── shared/                # Shared across features
    ├── components/        # UI kit, alerts, spinners
    ├── lib/               # Utilities, CSV, API, validation
    ├── hooks/             # Shared custom hooks
    └── types/             # Shared types (bill, goal)
```

---

## Adding a New Feature

### Step 1: Create Feature Directory

```bash
cd frontend/src/features
mkdir -p my-feature/{components,hooks,lib,types}
```

### Step 2: Add Your Code

```
my-feature/
├── components/        # React components
│   ├── MyFeatureCard.tsx
│   └── MyFeatureForm.tsx
├── hooks/             # Custom hooks
│   └── useMyFeature.ts
├── lib/               # Business logic
│   ├── MyFeatureStorageService.ts
│   ├── schemas.ts
│   ├── constants.ts
│   └── index.ts
├── types/             # TypeScript types
│   └── my-feature.ts
└── index.ts           # Barrel export (public API)
```

### Step 3: Create Barrel Export

```typescript
// features/my-feature/index.ts
export { default as MyFeatureCard } from './components/MyFeatureCard';
export { default as MyFeatureForm } from './components/MyFeatureForm';
export { useMyFeature } from './hooks/useMyFeature';
export * from './lib';
export type { MyFeature, MyFeatureInput } from './types/my-feature';
```

### Step 4: Import from Other Code

```typescript
// Clean imports using barrel export
import { MyFeatureCard, useMyFeature } from '@/features/my-feature';

// Instead of:
import { MyFeatureCard } from '@/features/my-feature/components/MyFeatureCard';
import { useMyFeature } from '@/features/my-feature/hooks/useMyFeature';
```

---

## File Naming Conventions

**Components:** `PascalCase.tsx`
- `CategoryCard.tsx`, `BudgetForm.tsx`

**Hooks:** `use*.ts`
- `useCategories.ts`, `useBudgetProgress.ts`

**Business Logic:** `PascalCase.ts` or `kebab-case.ts`
- `CategoryStorageService.ts`, `calculations.ts`, `schemas.ts`

**Types:** `kebab-case.ts`
- `category.ts`, `chart-data.ts`

**Tests:** `*.test.tsx` or `*.test.ts`
- `CategoryCard.test.tsx`, `calculations.test.ts`

---

## Import Path Aliases

PayPlan uses TypeScript path aliases for clean imports:

```typescript
@/features/*         → frontend/src/features/*
@/shared/*           → frontend/src/shared/*
@/components/*       → frontend/src/shared/components/*
@/lib/*              → frontend/src/shared/lib/*
@/hooks/*            → frontend/src/shared/hooks/*
@/types/*            → frontend/src/shared/types/*
```

**Examples:**
```typescript
import { CategoryCard } from '@/features/categories';
import { Button } from '@/shared/components/ui/button';
import { formatCurrency } from '@/shared/lib/utils';
```

---

## Documentation Structure

### Research & Analysis (`docs/`)

```
docs/
├── research/          # Competitor analysis, market research
├── testing/           # Test reports, accessibility testing
├── bugs/              # Critical bug documentation
├── constitution/      # Governance & constitution research
├── architecture/      # ADRs, architecture decisions
├── test_results/      # Analysis results from codebase-architect
└── archive/           # Old files (safely archived, not deleted)
```

**Where to put new docs:**
- Competitor research → `docs/research/`
- Test reports → `docs/testing/`
- Bug documentation → `docs/bugs/`
- Architecture decisions → `docs/architecture/decisions/` (create ADR)

---

## Feature Specifications (`specs/`)

Each feature has its own spec directory:

```
specs/
├── 061-spending-categories-budgets/
│   ├── spec.md           # Feature specification
│   ├── plan.md           # Implementation plan
│   ├── tasks.md          # Task breakdown
│   ├── data-model.md     # Types and schemas
│   └── research.md       # Deep research
└── ...
```

**When adding a feature:** Use `/speckit.specify` to create spec directory

---

## Development Tools (`tools/`)

```
tools/
└── codebase-architect/   # Codebase analysis tool
    ├── scripts/          # 9 analysis scripts
    ├── references/       # Language pattern guides
    └── SKILL.md          # Tool documentation
```

**Using codebase-architect:**
```bash
# Analyze structure
python3 tools/codebase-architect/scripts/analyze_structure.py --root frontend/src

# Find dead code
python3 tools/codebase-architect/scripts/dead_code_detector.py --root frontend/src

# Map dependencies
python3 tools/codebase-architect/scripts/dependency_mapper.py --root frontend/src
```

---

## Feature Organization Principles

### Self-Contained Features

Each feature should be **independent and self-contained:**

✅ **DO:**
- Keep all feature code in one directory
- Use barrel exports (`index.ts`)
- Import from other features via `@/features/other-feature`
- Put shared code in `shared/`

❌ **DON'T:**
- Mix feature code with shared code
- Create circular dependencies between features
- Put feature-specific types in `shared/types/`

---

### Shared vs Feature Code

**Feature code** (`features/`):
- Specific to ONE feature
- Not reused elsewhere
- Example: `CategoryCard.tsx` only used in categories

**Shared code** (`shared/`):
- Used by MULTIPLE features
- Generic and reusable
- Example: `Button.tsx`, `formatCurrency()`

**Rule:** Start in `features/`, move to `shared/` when 2+ features need it

---

## Testing

**Test files live with their code:**

```
features/categories/
├── components/
│   ├── CategoryCard.tsx
│   └── __tests__/
│       └── CategoryCard.test.tsx
└── lib/
    ├── CategoryStorageService.ts
    └── __tests__/
        └── CategoryStorageService.test.ts
```

**Running tests:**
```bash
npm test                              # All tests
npm test features/categories          # Feature tests
npm run test:coverage                 # With coverage
```

---

## Constitution Alignment (v3.1)

PayPlan's structure aligns with constitutional requirements:

**8 Tier 0 MVP Features → 8 Feature Directories:**

1. ✅ Spending Categories → `features/categories/`
2. ✅ Budget Creation → `features/budgets/`
3. ✅ Dashboard → `features/dashboard/`
4. ⚠️ Goal Tracking → (TBD: separate feature or part of dashboard)
5. ❌ Projected Cash Flow → (create `features/cash-flow/`)
6. ❌ Transaction Search → (create `features/search/`)
7. ❌ Reconciliation → (create `features/reconciliation/`)
8. ⚠️ Transaction Entry → `features/transactions/` (needs enhancements)

**Adding missing features:** Follow the structure above!

---

## Quick Reference

### Finding Code

| What | Where |
|------|-------|
| Categories UI | `features/categories/components/` |
| Categories logic | `features/categories/lib/` |
| Budgets UI | `features/budgets/components/` |
| Budgets logic | `features/budgets/lib/` |
| Dashboard widgets | `features/dashboard/components/` |
| Shared UI components | `shared/components/` |
| Shared utilities | `shared/lib/` |
| Entry point | `main.tsx` |
| Routes | `App.tsx`, `routes.ts` |

### Finding Docs

| What | Where |
|------|-------|
| Project overview | `README.md` |
| Development guide | `CLAUDE.md` |
| Constitution | `memory/constitution.md` |
| Research files | `docs/research/` |
| Test reports | `docs/testing/` |
| Bug docs | `docs/bugs/` |
| ADRs | `docs/architecture/decisions/` |
| Feature specs | `specs/` |

---

## Development Workflow

### 1. Check Constitution
```bash
cat memory/constitution.md    # Know what features are required
```

### 2. Check Existing Structure
```bash
ls frontend/src/features/     # See what's already built
```

### 3. Create Feature (if new)
```bash
mkdir -p frontend/src/features/my-feature/{components,hooks,lib,types}
```

### 4. Write Code
- Follow naming conventions
- Create barrel export
- Write tests alongside code

### 5. Test & Build
```bash
npm test                      # Run tests
npm run build                 # Verify build works
```

### 6. Commit
```bash
git add .
git commit -m "feat(my-feature): Add new feature"
```

---

## Safety Features

**Before major changes:**
```bash
# Create backup
python3 tools/codebase-architect/scripts/safety_manager.py backup \
  --description "Before refactoring"

# Use trash instead of rm
python3 tools/codebase-architect/scripts/safety_manager.py trash old_file.ts

# Restore if needed
python3 tools/codebase-architect/scripts/safety_manager.py list-trash
python3 tools/codebase-architect/scripts/safety_manager.py restore-trash <timestamp>
```

---

## Questions?

- **Structure questions:** See this guide
- **Feature requirements:** See `memory/constitution.md`
- **Specific feature details:** See `specs/[feature]/spec.md`
- **Development practices:** See `CLAUDE.md`
- **Architecture decisions:** See `docs/architecture/decisions/`

---

**Welcome to the clean, organized PayPlan codebase!** 🎉
