# Feature 064: Clarifications Log

**Session Date**: 2025-11-08
**Clarified By**: Claude Code + HIL

---

## Session 2025-11-08: PR Audit Documentation Issues

### Q1: Phase Merge Strategy (PR75-9)

**Question**: Should stacked PRs use cascading merges (Phase 2 → Phase 1 → base) or sequential merges (each phase → base)?

**Answer**: **Sequential merging** (standard GitHub workflow)

**Rationale**:
- ✅ Simpler (no complex rebase logic)
- ✅ Faster reviews (don't wait for previous phases)
- ✅ Safer (each phase independently verified)
- ✅ Aligns with Phase 1 principle: Simplicity over complexity

**Updated**: [STACKED-PR-GUIDE.md](STACKED-PR-GUIDE.md:68-82)

---

### Q2: Test Coverage Targets (PR75-13)

**Question**: What are the official test coverage targets for Phase 1?

**Answer**: **Phased ramp (60% → 70% → 80%)**

**Targets**:
- **Business Logic** (`lib/**/*.ts`):
  - Week 1-2: 60% minimum
  - Week 3-6: 70% minimum
  - Week 7+: 80% target
- **Financial Calculations** (money logic): **90%+ always** (non-negotiable)
- **Overall Project**: 40-60% weighted (business 60-80% + UI 0%)
- **UI Components**: 0% acceptable (manual testing sufficient)

**Rationale**:
- ✅ Evidence-based (Constitution v3.1 phased TDD transition)
- ✅ Realistic learning curve (test-after → hybrid → test-first)
- ✅ Sustainable (prevents burnout from strict 80% Day 1)
- ✅ Financial logic always strict (money errors unacceptable)

**Updated**: [plan.md:175](plan.md#L175)

---

### Q3: Toast vs Sonner Naming (PR75-8)

**Question**: Should documentation use "Toast" or "Sonner"?

**Answer**: **Sonner** (Shadcn deprecated Toast in favor of Sonner)

**Rationale**:
- ✅ Shadcn official recommendation
- ✅ Better accessibility (ARIA live regions)
- ✅ Smaller bundle size (~3KB)
- ✅ Modern UX patterns

**Updated**:
- [plan.md:175](plan.md#L175) - Changed "Toast" → "Sonner"
- [plan.md:180](plan.md#L180) - CLI command already correct: `npx shadcn@latest add sonner`

---

### Q4: Color Consistency (PR79-5)

**Question**: How should color consistency be addressed across goal status indicators?

**Answer**: **Create design system doc (defer to Phase 11)**

**Rationale**:
- ✅ Phase 1 principle: Ship fast, defer polish
- ✅ Proper solution: Design system prevents future inconsistencies
- ✅ Not blocking: Colors work, just need standardization
- ✅ Better timing: Phase 11 is dedicated to polish/accessibility

**Design System Requirements** (for Phase 11):
- Success: `green-600` (accessible 4.5:1 contrast)
- Warning: `yellow-600` (accessible 4.5:1 contrast)
- Danger: `red-600` (accessible 4.5:1 contrast)
- Info: `blue-600` (accessible 4.5:1 contrast)
- Neutral: `gray-600` (accessible 3:1 contrast for UI elements)

**Action**: Create task in Phase 11 (T093-T097 Accessibility section)

---

### Q5: Manual Test Evidence (PR83-4)

**Question**: How should manual testing evidence be enforced in PRs?

**Answer**: **PR template with checklist**

**Rationale**:
- ✅ Standard GitHub practice (most repos use PR templates)
- ✅ Quick implementation (30 min)
- ✅ Flexible (developers can skip sections if not applicable)
- ✅ Phase 1 appropriate (simple, not over-engineered)

**Requirement**: Every PR MUST include manual testing evidence in description:
- ✅ Keyboard navigation tested (Tab, Enter, Escape)
- ✅ Screen reader tested (NVDA/VoiceOver)
- ✅ Responsive tested (mobile, tablet, desktop)
- ✅ Error states tested
- ✅ Empty states tested
- ✅ Screenshots/recordings (optional but encouraged)

**Action**: Create `.github/pull_request_template.md` with comprehensive checklist.

---

## Summary

| Issue | Priority | Status | Updated Files |
|-------|----------|--------|---------------|
| PR75-9 | HIGH (56) | ✅ RESOLVED | STACKED-PR-GUIDE.md |
| PR75-13 | HIGH (54) | ✅ RESOLVED | plan.md:175 |
| PR75-8 | LOW (18) | ✅ RESOLVED | plan.md:175,180 |
| PR79-5 | MEDIUM (32) | ✅ RESOLVED | Deferred to Phase 11 |
| PR83-4 | LOW (14) | ✅ RESOLVED | .github/PULL_REQUEST_TEMPLATE.md |

**Next Steps**:
1. ✅ Update STACKED-PR-GUIDE.md (DONE)
2. ✅ Update plan.md (DONE)
3. ✅ PR79-5: Defer to Phase 11 (DONE)
4. ✅ PR83-4: Create `.github/PULL_REQUEST_TEMPLATE.md` (DONE)
5. ✅ All 5 issues clarified and documented (COMPLETE)

---

**Notes**:
- All clarifications follow Constitution v3.1 principles
- Phased coverage targets align with sustainable TDD transition
- Sequential merging simplifies workflow (Phase 1: Simplicity over complexity)
