# Data Model: Dependency Cleanup (Phase 3 - Revised)

**Feature**: 064-short-name-dependency
**Date**: 2025-10-30
**Status**: Revised (Documentation update only, no dependency removal)

## Overview

Phase 3 (revised) is a **documentation-only update** with validation. No code changes or data model changes are required. This document describes the minimal entities involved in the documentation update process.

## Entities

### 1. Documentation File

**Description**: Markdown files that describe the project (README.md, CLAUDE.md, etc.)

**Attributes**:
- `path`: string - File path relative to repository root (e.g., "README.md")
- `content`: string - Markdown content
- `sections`: string[] - List of heading sections (e.g., ["Overview", "Features", "Architecture"])
- `last_modified`: timestamp - Last modification date
- `size_bytes`: number - File size in bytes

**Relationships**:
- Describes **Project** (1:1)
- Modified by **Git Commit** (1:many)

**State Transitions**:
```
outdated → updated → committed
```

**Validation Rules**:
- Markdown syntax must be valid
- Headings must follow hierarchy (H1 > H2 > H3)
- Links must be valid (no broken references)
- No PII in documentation

**Example**:
```typescript
interface DocumentationFile {
  path: string; // "README.md"
  content: string; // Full markdown content
  sections: string[]; // ["PayPlan - Privacy-First Budgeting App", "Features", ...]
  last_modified: Date;
  size_bytes: number;
}
```

---

### 2. Git Commit

**Description**: Version control record of changes to files

**Attributes**:
- `hash`: string - Git commit SHA (e.g., "abc123def456...")
- `message`: string - Commit message following Conventional Commits format
- `author`: string - Commit author name and email
- `timestamp`: timestamp - Commit creation date
- `files_changed`: string[] - List of files modified in this commit
- `insertions`: number - Lines added
- `deletions`: number - Lines deleted

**Relationships**:
- Records changes to **Documentation File** (1:many)
- Part of **Feature** (many:1)

**State Transitions**:
```
staged → committed → pushed
```

**Validation Rules**:
- Message must follow Conventional Commits format: `type(scope): description`
- Types: chore, docs, feat, fix, refactor, test
- Message must reference feature number (e.g., "Feature 064")
- Footer must include GitHub signatures

**Example**:
```typescript
interface GitCommit {
  hash: string; // "abc123..."
  message: string; // "docs(readme): update to budget-first architecture (Feature 064)"
  author: string; // "Claude <noreply@anthropic.com>"
  timestamp: Date;
  files_changed: string[]; // ["README.md", "specs/063-short-name-archive/plan.md"]
  insertions: number; // 45
  deletions: number; // 32
}
```

---

### 3. Application Route

**Description**: URL path that maps to a React component/page

**Attributes**:
- `path`: string - URL path (e.g., "/dashboard", "/demo")
- `component`: string - React component name (e.g., "Dashboard", "Demo")
- `lazy_loaded`: boolean - Whether component is lazy-loaded
- `uses_ics`: boolean - Whether this route uses `ics` dependency
- `category`: enum - Route category: "budget" | "bnpl" | "system"

**Relationships**:
- Served by **Application** (many:1)
- Tested in **Manual Test** (1:1)

**State Transitions**:
```
defined → tested → validated
```

**Validation Rules**:
- Path must start with "/"
- Component must exist in codebase
- Route must be defined in App.tsx

**PayPlan Routes** (13 total from App.tsx analysis):
```typescript
const routes: ApplicationRoute[] = [
  // Budget App Routes (Primary)
  { path: "/", component: "Dashboard", lazy_loaded: true, uses_ics: false, category: "budget" },
  { path: "/categories", component: "Categories", lazy_loaded: true, uses_ics: false, category: "budget" },
  { path: "/budgets", component: "Budgets", lazy_loaded: true, uses_ics: false, category: "budget" },
  { path: "/transactions", component: "Transactions", lazy_loaded: true, uses_ics: false, category: "budget" },
  { path: "/archives", component: "ArchiveListPage", lazy_loaded: false, uses_ics: false, category: "budget" },
  { path: "/archives/:id", component: "ArchiveDetailView", lazy_loaded: false, uses_ics: false, category: "budget" },

  // Demo/Import Routes (Use ics dependency - CRITICAL)
  { path: "/demo", component: "Demo", lazy_loaded: true, uses_ics: true, category: "budget" },
  { path: "/import", component: "Import", lazy_loaded: false, uses_ics: true, category: "budget" },

  // BNPL Routes (Archived)
  { path: "/bnpl-home", component: "Home", lazy_loaded: false, uses_ics: false, category: "bnpl" },
  { path: "/bnpl", component: "BNPLParser", lazy_loaded: true, uses_ics: true, category: "bnpl" },

  // System Routes
  { path: "/docs", component: "Docs", lazy_loaded: true, uses_ics: false, category: "system" },
  { path: "/privacy", component: "Privacy", lazy_loaded: true, uses_ics: false, category: "system" },
  { path: "/settings", component: "PreferenceSettings", lazy_loaded: false, uses_ics: false, category: "system" },
];
```

---

### 4. npm Dependency (Reference Only)

**Description**: Third-party package listed in package.json

**NOTE**: No changes to dependencies in Phase 3. This entity is included for reference only.

**Attributes**:
- `name`: string - Package name (e.g., "ics", "luxon")
- `version`: string - Semantic version (e.g., "3.8.1")
- `type`: enum - "dependencies" | "devDependencies"
- `used_by_files`: string[] - List of files that import this dependency
- `is_transitive`: boolean - Whether dependency is transitive (pulled in by another package)

**Validation Rules**:
- Semantic versioning format (e.g., "^3.8.1", "~2.0.0")
- Must be actively used by at least one file (YAGNI principle)

**PayPlan Dependencies** (All actively used):
```typescript
const dependencies: NpmDependency[] = [
  {
    name: "ics",
    version: "3.8.1",
    type: "dependencies",
    used_by_files: ["Demo.tsx", "Import.tsx", "lib/ics-generator.js (archived)"],
    is_transitive: false,
  },
  {
    name: "luxon",
    version: "3.7.2",
    type: "dependencies",
    used_by_files: ["Demo.tsx", "Import.tsx", "email-extractor.ts", "..."],
    is_transitive: false,
  },
  {
    name: "papaparse",
    version: "5.5.3",
    type: "dependencies",
    used_by_files: ["Import.tsx", "..."],
    is_transitive: false,
  },
  {
    name: "recharts",
    version: "3.3.0",
    type: "dependencies",
    used_by_files: ["Dashboard.tsx", "..."],
    is_transitive: false,
  },
];
```

---

## Entity Relationships

```
Project
  ↓ (described by)
DocumentationFile (README.md)
  ↓ (modified by)
GitCommit
  ↓ (records changes to)
DocumentationFile
  ↓ (references)
ApplicationRoute (13 routes)
  ↓ (uses)
NpmDependency (ics, luxon, papaparse, recharts)
```

---

## Data Model Changes (Phase 3)

**No data model changes** - This is a documentation-only update.

**Files Modified**:
- `README.md` - Update to budget-first architecture
- `specs/063-short-name-archive/plan.md` - Mark Phase 3 complete

**Files NOT Modified**:
- `frontend/package.json` - No dependency changes
- `frontend/src/**/*.tsx` - No code changes
- `frontend/src/archive/bnpl/**/*` - Archived code untouched

---

## Validation Criteria

### Documentation File Validation

**Pre-Commit Checks**:
1. ✅ Markdown syntax is valid (no broken links, proper heading hierarchy)
2. ✅ No PII in documentation (names, emails, addresses, SSNs)
3. ✅ Product description reflects budget-first architecture
4. ✅ Feature list shows budget features first, BNPL as secondary
5. ✅ Architecture section reflects `frontend/src/` (active) and `frontend/src/archive/bnpl/` (archived)

### Git Commit Validation

**Conventional Commits Format**:
```
docs(readme): update to budget-first architecture (Feature 064)

- Update product description to "Privacy-First Budgeting App"
- Reorder feature list (budget features first, BNPL secondary)
- Update architecture section to reflect archived code structure
- Mark Phase 3 complete in specs/063-short-name-archive/plan.md

Validation:
- README.md product description: "Privacy-First Budgeting App"
- Budget features listed before BNPL features
- All 13 routes tested: 100% availability
- Browser console: 0 errors
- ics dependency confirmed as actively used (Demo, Import)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Application Route Validation

**Manual Testing Checklist** (13 routes):
1. ✅ `/` - Dashboard loads
2. ✅ `/categories` - Categories loads
3. ✅ `/budgets` - Budgets loads
4. ✅ `/transactions` - Transactions loads
5. ✅ `/archives` - Archive list loads
6. ✅ `/archives/:id` - Archive detail loads
7. ✅ `/demo` - Demo loads + "Download .ics Calendar" button works
8. ✅ `/import` - CSV import loads + "Download .ics" button works
9. ✅ `/bnpl-home` - BNPL home loads (archived)
10. ✅ `/bnpl` - BNPL parser loads (archived)
11. ✅ `/docs` - Documentation loads
12. ✅ `/privacy` - Privacy policy loads
13. ✅ `/settings` - Settings loads

**Critical Routes** (must validate `.ics` functionality):
- `/demo` - Test "Download .ics Calendar" button (this week's demo payments)
- `/import` - Test "Download .ics" button after CSV import

---

## TypeScript Interfaces (For Reference)

```typescript
// Documentation file entity
interface DocumentationFile {
  path: string;
  content: string;
  sections: string[];
  last_modified: Date;
  size_bytes: number;
}

// Git commit entity
interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: Date;
  files_changed: string[];
  insertions: number;
  deletions: number;
}

// Application route entity
interface ApplicationRoute {
  path: string;
  component: string;
  lazy_loaded: boolean;
  uses_ics: boolean;
  category: "budget" | "bnpl" | "system";
}

// npm dependency entity (reference only)
interface NpmDependency {
  name: string;
  version: string;
  type: "dependencies" | "devDependencies";
  used_by_files: string[];
  is_transitive: boolean;
}
```

---

**Data Model Status**: ✅ Complete
**Next**: Generate `quickstart.md` for developer implementation guide
