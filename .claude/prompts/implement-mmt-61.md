# Implement MMT-61: Spending Categories & Budget Creation

**Human In The Loop (HIL)**: Use this prompt to hand off MMT-61 implementation to Claude Code.

---

## Context

You are implementing **MMT-61: Spending Categories & Budget Creation** for PayPlan, a privacy-first budgeting app.

**Epic**: MMT-69 - Budgeting App MVP  
**Priority**: P0 (Critical)  
**Estimate**: 3-5 days  
**Linear**: https://linear.app/mmtu-entertainment/issue/MMT-61

---

## Specifications

All specs are located in: `specs/061-spending-categories-budgets/`

**Required reading**:
1. `spec.md` - 5 user stories with acceptance criteria
2. `plan.md` - Technical approach and implementation strategy
3. `data-model.md` - TypeScript types, Zod schemas, localStorage structure
4. `tasks.md` - 60 tasks organized by user story
5. `checklist.md` - Quality gate with 150+ validation items

**Source of truth**: `memory/constitution_v1.1_TEMP.md`

---

## Implementation Approach

### Use Spec-Kit Workflow

Run the following command to start:

```
/speckit.implement 061-spending-categories-budgets
```

This will:
1. Read all spec files
2. Execute tasks in dependency order
3. Mark tasks complete as you go
4. Validate against checklist before completion

### Alternative: Manual Implementation

If `/speckit.implement` is not available, follow this process:

1. **Read all specs** in `specs/061-spending-categories-budgets/`
2. **Execute tasks** in order from `tasks.md`:
   - Phase 1: Setup (T001-T005)
   - Phase 2: Foundational (T006-T014) ← CRITICAL - blocks all user stories
   - Phase 3: User Story 1 (T015-T022) ← MVP scope
   - Phase 4-7: User Stories 2-5 (T023-T044)
   - Phase 8: Polish (T045-T060)
3. **Validate** against `checklist.md` before creating PR
4. **Update** Linear MMT-61 with progress

---

## Key Requirements

### From Constitution

- **Privacy-first**: localStorage only, no backend (lines 800-1000+)
- **Accessibility**: WCAG 2.1 AA, keyboard nav, screen readers (lines 68-120)
- **Performance**: <500ms rendering, <30s category creation, <15s budget creation (lines 275-332)
- **Data visualization**: Use Recharts for charts (lines 708-797)

### From Spec

- **5 user stories** with priorities (P0, P1, P2)
- **MVP scope**: User Story 1 only (create/manage categories)
- **Full scope**: All 5 user stories (categories + budgets + progress + assignment + pre-defined)

### From Plan

- **Tech stack**: TypeScript 5.8, React 19, Zod, Radix UI, lucide-react
- **Architecture**: localStorage-first, client-side only
- **Validation**: Zod schemas for all entities
- **Testing**: Manual testing only (Phase 1 per constitution)

---

## Success Criteria

### MVP (User Story 1)

- [ ] Users can create custom categories with name, icon, and color
- [ ] Category names are unique (case-insensitive)
- [ ] Users can edit and delete categories
- [ ] Deleting a category with transactions requires confirmation
- [ ] Category creation takes <30s
- [ ] Keyboard navigation works
- [ ] Screen reader announces all actions

### Full Feature (All 5 User Stories)

- [ ] Users can set monthly budgets for categories
- [ ] Users see visual progress bars showing budget usage
- [ ] Users can assign transactions to categories
- [ ] New users see 9 pre-defined categories
- [ ] All accessibility requirements met (WCAG 2.1 AA)
- [ ] All performance requirements met (<500ms, <1s dashboard)
- [ ] All 150+ checklist items validated

---

## Implementation Notes

### Phase 2 is CRITICAL

**Do NOT skip Foundational phase (T006-T014)!**

This phase creates:
- Type definitions
- Zod schemas
- localStorage utilities
- Pre-defined categories data
- Storage operations

**All user stories depend on this foundation.**

### User Stories are Independent

Each user story should be:
- Independently implementable
- Independently testable
- Independently deployable

You can implement:
- **MVP only**: Phase 1 + Phase 2 + Phase 3 (User Story 1)
- **Incremental**: MVP, then add US2, then US3, etc.
- **Full scope**: All 5 user stories

### Accessibility is CRITICAL

Before marking complete:
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA or VoiceOver)
- [ ] Verify all forms have labels
- [ ] Verify progress bars have ARIA attributes
- [ ] Verify focus indicators are visible

---

## Questions?

If you need clarification:
1. Check `spec.md` for requirements
2. Check `plan.md` for technical decisions
3. Check `data-model.md` for data structures
4. Check `constitution` for architectural principles
5. Ask HIL if still unclear

---

## When Complete

1. **Validate** against `checklist.md` (all 150+ items)
2. **Create PR** with description:
   - What was implemented (MVP vs full scope)
   - Testing notes (keyboard, screen reader, browsers)
   - Known limitations (if any)
3. **Link to Linear MMT-61**
4. **Update session state** (`memory/session-state.json`)
5. **Notify HIL** for review

---

## Ready to Start?

**For Spec-Kit workflow**:
```
/speckit.implement 061-spending-categories-budgets
```

**For manual workflow**:
1. Read `specs/061-spending-categories-budgets/spec.md`
2. Read `specs/061-spending-categories-budgets/plan.md`
3. Read `specs/061-spending-categories-budgets/data-model.md`
4. Read `specs/061-spending-categories-budgets/tasks.md`
5. Start with Phase 1: Setup (T001-T005)

**Let me know when you're ready to begin!**

