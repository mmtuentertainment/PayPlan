# Feature 064: Stacked PR Structure

## Overview
Goal Tracking Dashboard feature implemented using **stacked PRs** for easier review and incremental delivery.

## Branch Structure

```
main
 │
 └─ 064-short-name-goal (base feature branch)
     │
     ├─ 064-phase1-setup (PR #74) ✅ CREATED
     │   └─ Phase 1: Setup & Shadcn UI Restructure
     │
     ├─ 064-phase2-foundational (CURRENT BRANCH)
     │   └─ Phase 2: Foundational business logic (25 tasks)
     │       • Types & Schemas (T006-T013)
     │       • Calculation Functions (T014-T021) - 90%+ coverage
     │       • Storage Service (T022-T030) - 80%+ coverage
     │
     ├─ 064-phase3-us1
     │   └─ Phase 3: US1 - Dashboard Overview (T031-T040)
     │
     ├─ 064-phase4-us2
     │   └─ Phase 4: US2 - Create/Edit Goals (T041-T052)
     │
     ├─ 064-phase5-us3
     │   └─ Phase 5: US3 - Visual Progress (T053-T060)
     │
     ├─ 064-phase6-us4
     │   └─ Phase 6: US4 - Quick-Add Contributions (T061-T070)
     │
     ├─ 064-phase7-us5
     │   └─ Phase 7: US5 - Celebrate Completion (T071-T076)
     │
     ├─ 064-phase8-us6
     │   └─ Phase 8: US6 - Target Dates & Warnings (T077-T083)
     │
     ├─ 064-phase9-us7
     │   └─ Phase 9: US7 - Contribution Notes (T084-T088)
     │
     ├─ 064-phase10-us8
     │   └─ Phase 10: US8 - Archive Completed Goals (T089-T092)
     │
     └─ 064-phase11-polish
         └─ Phase 11: Polish & Cross-Cutting (T093-T105)
             • Accessibility (T093-T097)
             • Responsive Design (T098-T100)
             • Error Handling & Integration (T101-T105)
```

## PR Review Strategy

### Review Order (Sequential)
1. **PR #74** (Phase 1) → Review & approve → Merge to `064-short-name-goal`
2. **Phase 2 PR** → Review & approve → Merge to `064-short-name-goal`
3. **Phase 3 PR** → Review & approve → Merge to `064-short-name-goal`
4. Continue until Phase 11...

### Why Stacked PRs?
- ✅ **Smaller, focused reviews** - Each phase is ~10-25 tasks (vs 82 tasks in one PR)
- ✅ **Faster iteration** - Merge phases independently as they pass review
- ✅ **Clear checkpoints** - Each phase has explicit validation criteria
- ✅ **Rollback safety** - Can revert individual phases without losing all work
- ✅ **Parallel work** - Can continue Phase 3 while Phase 2 is in review

### Merge Strategy (CLARIFIED 2025-11-08)

**Sequential Merging** (Standard GitHub workflow):

After each phase PR is approved:
1. **Merge directly to base** (`064-short-name-goal`)
2. Each phase is **self-contained** and independently testable
3. No cascading merges (simpler, safer)
4. Finally merge base `064-short-name-goal` → `main`

**Why Sequential over Cascading?**
- ✅ **Simpler**: Standard GitHub PR workflow (no complex rebase logic)
- ✅ **Faster**: Reviews don't wait for previous phases
- ✅ **Safer**: Each phase independently verified by CI/CD
- ✅ **Phase 1 principle**: Simplicity over complexity

## Current Status

- ✅ **Phase 1**: PR #74 created, awaiting review
- 🔄 **Phase 2**: Branch created (`064-phase2-foundational`), ready for implementation
- ⏳ **Phases 3-11**: Will be created as work progresses

## Commands Reference

```bash
# Check current branch
git branch --show-current

# View stacked branch structure
git log --oneline --graph --all --decorate

# Switch between phases
git checkout 064-phase2-foundational

# Create next phase
git checkout -b 064-phase3-us1
```

## Task Distribution by Phase

| Phase | Tasks | Focus | Coverage Target |
|-------|-------|-------|-----------------|
| Phase 1 | 5 | Setup & dependencies | N/A |
| Phase 2 | 25 | Business logic | 80-90% |
| Phase 3 | 10 | Dashboard overview (US1) | Manual UI |
| Phase 4 | 12 | Create/edit goals (US2) | Manual UI |
| Phase 5 | 8 | Visual progress (US3) | Manual UI |
| Phase 6 | 10 | Quick-add (US4) | Manual UI |
| Phase 7 | 6 | Celebrations (US5) | Manual UI |
| Phase 8 | 7 | Target dates (US6) | Manual UI |
| Phase 9 | 5 | Contribution notes (US7) | Manual UI |
| Phase 10 | 4 | Archive goals (US8) | Manual UI |
| Phase 11 | 13 | Polish & accessibility | Manual |
| **TOTAL** | **82** | **11 phases** | **80%+ business** |

---

**Next**: Implement Phase 2 (foundational business logic with TDD)
