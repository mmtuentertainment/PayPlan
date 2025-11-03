# Documents That Need Updating for Constitution v3.1

**Generated:** 2025-11-03
**Status:** Informational - No immediate action required

---

## ✅ Already Updated (Complete)

1. **memory/constitution.md** - v3.1 ✅ (merged in PR #66)
2. **CLAUDE.md** - v3.1 ✅ (merged in PR #66)
3. **.coderabbit.yaml** - v3.1 ✅ (PR #67 pending)
4. **.specify/templates/plan-template.md** - v3.1 ✅ (PR #67 pending)
5. **.specify/templates/tasks-template.md** - v3.1 ✅ (PR #67 pending)

---

## ⚠️ Optional Updates (Low Priority)

### 1. Existing Feature Specs (Historical Documents)

**Files:**
- `specs/061-spending-categories-budgets/plan.md` (line 15: "Manual testing only")
- `specs/016-payment-archive/plan.md` (if it mentions manual testing)
- Other specs created before v3.1

**Issue:** Specs say "Manual testing only (Phase 1 per constitution)" but constitution is now v3.1

**Recommendation:**
- **LEAVE AS-IS** - These are historical documents
- They were written under constitution v1.1/v2.0 (which DID allow manual testing only)
- Changing them would be historically inaccurate
- Add a note at the top: "Created under constitution v1.1 - testing requirements have since changed"

**Priority:** LOW (historical accuracy vs current requirements)

---

### 2. README.md

**Current Status:** Doesn't mention testing requirements

**Update Needed:** None! README is user-facing, not developer-facing

**Reason:** Testing is documented in:
- CLAUDE.md (developer guide)
- Constitution (source of truth)
- Templates (Spec-Kit workflow)

**Priority:** N/A (no update needed)

---

### 3. CHANGELOG.md

**Current Status:** Last entry is old

**Update Recommendation:** Add entry for today's work:

```markdown
## [Unreleased]

### Changed (2025-11-03)
- Complete codebase reorganization to feature-based architecture
- Updated constitution to v3.1 (phased TDD, 8-12 features MVP)
- Updated CLAUDE.md to v3.1 (TDD requirements, new structure)
- Updated templates and CodeRabbit config for v3.1 compliance

### Added
- Feature-based architecture (features/ + shared/)
- Barrel exports for all 5 features
- CONTRIBUTING.md (structure guide)
- ADR-004 (feature-based architecture decision)
- codebase-architect tool (analysis + safety)
- Comprehensive documentation organization (docs/)

### Removed
- Flat structure (components/, lib/, hooks/, types/)
- 36 loose files from root → organized into docs/
```

**Priority:** MEDIUM (good practice to keep current)

---

### 4. docs/architecture/decisions/README.md

**Current Status:** Lists ADRs 001-003

**Update Needed:** Add ADR-004 to the list

```markdown
## Architecture Decision Records

1. [ADR-001: Interface-First Type Strategy](001-interface-first-type-strategy.md)
2. [ADR-002: Canonical Zod Schema Locations](002-canonical-zod-schema-locations.md)
3. [ADR-003: Date Arithmetic - setMonth() Boundary Handling](003-date-arithmetic-setmonth-boundary-handling.md)
4. [ADR-004: Feature-Based Architecture Adoption](004-feature-based-architecture-adoption.md) - NEW
```

**Priority:** LOW (nice to have, but not critical)

---

## ✅ Already Covered (No Update Needed)

1. **CONTRIBUTING.md** - Already mentions TDD (created in PR #66)
2. **Spec-Kit prompt** - Already has v3.1 requirements (created today)
3. **.github/** workflows - No test.yml exists yet (create when adding tests)

---

## 🎯 Recommendations

### Immediate (Include in PR #67):
- ✅ Add CHANGELOG.md entry for today's work
- ✅ Update docs/architecture/decisions/README.md (add ADR-004)

### Optional (Future PRs):
- ⚠️ Add note to old specs: "Created under constitution v1.1"
- ⚠️ Create .github/workflows/test.yml when first tests added

### Not Needed:
- ❌ README.md (user-facing, not developer docs)
- ❌ Existing spec files (historical documents, accurate for their time)

---

**Summary:** Only 2 small updates needed (CHANGELOG + ADR README), both low priority and can be included in PR #67 or done separately.

**Priority:** LOW - Templates and CodeRabbit are the critical updates (already done!)
