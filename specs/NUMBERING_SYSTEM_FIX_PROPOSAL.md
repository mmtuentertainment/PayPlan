# Spec Numbering System Fix Proposal

**Date:** 2025-10-23
**Status:** Proposal (requires user approval before execution)

---

## Current Problems

### 1. Missing Sequential Numbers
- **009** - MISSING
- **010** - MISSING
- **013** - ✅ DELETED (was empty duplicate)

### 2. Duplicate Prefixes
| Prefix | Count | Directories |
|--------|-------|-------------|
| 007 | 2 | `007-0020-csv-import`, `007-0022-openapi-v1-plan` |
| 008 | 3 | `008-0020-1-csv`, `008-0020-2-csv-v1-1`, `008-0020-3-csv-telemetry` |
| 015 | 2 | `015-build-a-payment`, (shared with 016) |
| 016 | 2 | `016-build-a-payment`, (shared with 015) |

### 3. Inconsistent Naming Patterns
- Some use hierarchical IDs: `011-009-008-0020` (nested feature ID)
- Some use patch versions: `008-0020-2-csv-v1-1`
- Some use simple sequential: `001-inbox-paste-phase`
- Two specs share same name: `015` and `016` both = "build-a-payment"

---

## Proposed Solution: Option A (Conservative - Minimal Disruption)

**Philosophy:** Only fix critical duplicates, preserve existing structure for non-conflicting specs.

### Renaming Plan

| Current | New | Reason |
|---------|-----|--------|
| 007-0020-csv-import | **KEEP** | First use of 007 |
| 007-0022-openapi-v1-plan | **→ 009-openapi-v1-plan** | Fill gap, remove duplicate |
| 008-0020-1-csv | **KEEP** | First use of 008 |
| 008-0020-2-csv-v1-1 | **KEEP** | Related patch to 008-1 |
| 008-0020-3-csv-telemetry | **KEEP** | Related patch to 008-1 |
| 011-009-008-0020 | **KEEP** | Unique, no conflict |
| 015-build-a-payment | **KEEP** | First implementation (MVP) |
| 016-build-a-payment | **→ 016-payment-archive** | Clarify distinction from 015 |

### Changes Required
```bash
# Fix duplicate 007
mv specs/007-0022-openapi-v1-plan specs/009-openapi-v1-plan

# Fix duplicate name (015 vs 016)
mv specs/016-build-a-payment specs/016-payment-archive
```

### Files to Update After Rename
1. **spec.md** in renamed directories (update Feature Branch/ID)
2. **plan.md** in renamed directories (update references)
3. **tasks.md** in renamed directories (update path references)
4. **CLAUDE.md** (update feature list)
5. **Cross-references** in other specs (search for old names)

---

## Proposed Solution: Option B (Aggressive - Full Restructure)

**Philosophy:** Complete renumbering to create clean, sequential system.

### Renaming Plan

| Current | New | Reason |
|---------|-----|--------|
| 001-inbox-paste-phase | **KEEP** | |
| 002-realign-payplan-specs | **KEEP** | |
| 003-create-ci-lint | **KEEP** | |
| 004-pr-hygiene-openapi-lint | **KEEP** | |
| 005-ci-guards-refinements | **KEEP** | |
| 006-0019-demo-mode | **→ 006-demo-mode** | Simplify |
| 007-0020-csv-import | **→ 007-csv-import** | Simplify |
| 007-0022-openapi-v1-plan | **→ 008-openapi-v1-plan** | Sequential |
| 008-0020-1-csv | **→ 009-csv-import-hardening** | Sequential, descriptive |
| 008-0020-2-csv-v1-1 | **→ 010-csv-import-v1-1** | Sequential |
| 008-0020-3-csv-telemetry | **→ 011-csv-telemetry** | Sequential |
| 011-009-008-0020 | **→ 012-telemetry-auto-dismiss** | Sequential, descriptive |
| 012-user-preference-management | **→ 013-user-preferences** | Sequential |
| 014-build-a-csv | **→ 014-csv-export** | Descriptive |
| 015-build-a-payment | **→ 015-payment-status** | Descriptive |
| 016-build-a-payment | **→ 016-payment-archive** | Descriptive |
| 017-navigation-system | **KEEP** | |
| 018-technical-debt-cleanup | **KEEP** | |

---

## Recommendation

**Use Option A (Conservative)** because:
1. ✅ Fixes critical duplicate prefixes (007, 015/016)
2. ✅ Minimal disruption to existing work
3. ✅ Preserves historical context in directory names
4. ✅ Only 2 directories renamed (lower risk of broken references)
5. ✅ Fills the 009 gap naturally

Option B is cleaner long-term but:
- ❌ Requires renaming 12 directories
- ❌ Breaks ALL historical references in commits/PRs
- ❌ High risk of missing cross-references
- ❌ More time-consuming to execute safely

---

## Implementation Steps (Option A)

### Phase 1: Backup and Verify
```bash
# Create backup
cp -r specs specs-backup-2025-10-23

# Verify no uncommitted changes
git status specs/
```

### Phase 2: Rename Directories
```bash
# Rename 007-0022 → 009
git mv specs/007-0022-openapi-v1-plan specs/009-openapi-v1-plan

# Rename 016-build-a-payment → 016-payment-archive
git mv specs/016-build-a-payment specs/016-payment-archive
```

### Phase 3: Update Internal References
```bash
# Update spec.md in 009
sed -i 's/007-0022/009/g' specs/009-openapi-v1-plan/spec.md
sed -i 's/Feature Branch.*007-0022/Feature Branch: 009/g' specs/009-openapi-v1-plan/spec.md

# Update spec.md in 016
sed -i 's/016-build-a-payment/016-payment-archive/g' specs/016-payment-archive/spec.md
sed -i 's/Feature Branch.*016-build-a-payment/Feature Branch: 016-payment-archive/g' specs/016-payment-archive/spec.md

# Update plan.md and tasks.md file paths
find specs/009-openapi-v1-plan -name "*.md" -exec sed -i 's|specs/007-0022|specs/009|g' {} \;
find specs/016-payment-archive -name "*.md" -exec sed -i 's|specs/016-build-a-payment|specs/016-payment-archive|g' {} \;
```

### Phase 4: Update CLAUDE.md
- Update feature list with new directory names

### Phase 5: Search for Cross-References
```bash
# Find any references to old paths
grep -r "007-0022\|016-build-a-payment" specs/ --exclude-dir=specs-backup-2025-10-23
grep -r "007-0022\|016-build-a-payment" frontend/
grep -r "007-0022\|016-build-a-payment" *.md
```

### Phase 6: Commit Changes
```bash
git add specs/
git commit -m "refactor: Fix spec numbering duplicates (007→009, rename 016)

- Rename 007-0022-openapi-v1-plan → 009-openapi-v1-plan (fills gap, removes duplicate)
- Rename 016-build-a-payment → 016-payment-archive (clarifies distinction from 015)
- Update internal references in spec.md, plan.md, tasks.md
- Update CLAUDE.md with new directory names

Addresses spec audit findings (SPECS_001-016_AUDIT_REPORT.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Risk Assessment

### Option A Risks
- **LOW**: Only 2 directories renamed
- **LOW**: Limited scope reduces chance of missing references
- **MEDIUM**: May still have broken links if specs reference each other

### Mitigation Strategies
1. ✅ Create backup before starting (`specs-backup-2025-10-23`)
2. ✅ Use `git mv` to preserve history
3. ✅ Comprehensive grep search for cross-references
4. ✅ Update all internal documentation
5. ✅ Test that CI/scripts still work after rename

---

## Verification Checklist

After implementation, verify:
- [ ] No duplicate prefixes (001-018 all unique)
- [ ] All spec.md files have correct Feature Branch IDs
- [ ] All plan.md files reference correct paths
- [ ] All tasks.md files reference correct file paths
- [ ] CLAUDE.md updated
- [ ] No broken cross-references (grep search clean)
- [ ] CI passes
- [ ] All tests pass
- [ ] Audit report updated with new structure

---

## Alternative: No Action (Status Quo)

**Not Recommended** because:
- ❌ Duplicate prefixes cause confusion
- ❌ Cannot add new specs between duplicates
- ❌ Two specs with identical names (015, 016 = "build-a-payment")
- ❌ Future specs will compound the problem

---

## Decision Required

**User must approve one option:**
- [ ] **Option A:** Conservative (rename 2 directories)
- [ ] **Option B:** Aggressive (rename 12 directories)
- [ ] **Option C:** No action (status quo)

**Recommended:** Option A

---

**Prepared by:** Claude (Sonnet 4.5)
**Date:** 2025-10-23
**Audit Reference:** SPECS_001-016_AUDIT_REPORT.md
