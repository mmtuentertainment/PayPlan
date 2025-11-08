# [Feature/Fix] Title

## Summary

**What**: [Brief description of changes]

**Why**: [Problem this solves or feature this adds]

**Related**: [Link to Linear issue, spec.md, or GitHub issue]

---

## Constitutional Compliance

### Privacy-First (IMMUTABLE)
- [ ] ✅ No PII leaks (emails, names, SSNs sanitized in exports/logs)
- [ ] ✅ localStorage-first (no server required for core features)
- [ ] ✅ Explicit consent for any server features
- [ ] N/A - No privacy-related changes

### Accessibility-First (IMMUTABLE)
- [ ] ✅ WCAG 2.2 AA compliance verified
- [ ] ✅ Keyboard navigation tested (see Manual Testing below)
- [ ] ✅ Screen reader tested (see Manual Testing below)
- [ ] ✅ Color contrast verified (4.5:1 text, 3:1 UI)
- [ ] N/A - No UI changes

### Free Core (IMMUTABLE)
- [ ] ✅ Core budgeting features remain free
- [ ] ✅ Premium features clearly marked
- [ ] N/A - No pricing-related changes

---

## Test Coverage (Phase 1 v3.1)

### Automated Tests
- [ ] ✅ Business logic (`lib/**/*.ts`) tested: **[X]%** coverage
  - **Target**: Week 1-2: 60%, Week 3-6: 70%, Week 7+: 80%
- [ ] ✅ Financial calculations tested: **[X]%** coverage
  - **Target**: 90%+ (non-negotiable)
- [ ] ✅ All tests passing (`npm test`)
- [ ] N/A - No business logic added/changed

### Manual Testing (REQUIRED for UI changes)

**Phase 1 Definition of Done**: All checklist items below MUST be tested and documented.

#### Keyboard Navigation
- [ ] ✅ Tab navigation works (all interactive elements reachable)
- [ ] ✅ Enter/Space activates buttons/links
- [ ] ✅ Escape closes modals/dialogs
- [ ] ✅ Arrow keys work for lists/menus (if applicable)
- [ ] ✅ Focus indicators visible (no invisible focus)
- [ ] N/A - No interactive elements added

**Evidence**: [Describe what you tested, or attach recording]

#### Screen Reader Testing
- [ ] ✅ NVDA (Windows) or VoiceOver (Mac) tested
- [ ] ✅ All interactive elements announced correctly
- [ ] ✅ ARIA labels present and descriptive
- [ ] ✅ Live regions announce dynamic changes
- [ ] ✅ Landmarks (nav, main, aside) present
- [ ] N/A - No UI changes

**Screen Reader Used**: [NVDA/VoiceOver]
**Evidence**: [Describe what screen reader announced, or attach recording]

#### Responsive Design
- [ ] ✅ Mobile tested (375px - iPhone SE)
- [ ] ✅ Tablet tested (768px - iPad)
- [ ] ✅ Desktop tested (1920px)
- [ ] ✅ Touch targets ≥44x44px (mobile)
- [ ] N/A - No layout changes

**Evidence**: [Screenshots for each breakpoint, or describe testing]

#### Error States
- [ ] ✅ Error messages user-friendly (no technical jargon)
- [ ] ✅ Error messages include recovery guidance
- [ ] ✅ Errors don't crash the app (graceful degradation)
- [ ] ✅ Network errors handled
- [ ] N/A - No error handling added

**Evidence**: [Describe error scenarios tested]

#### Empty States
- [ ] ✅ Empty state UI displays correctly
- [ ] ✅ Empty state includes helpful guidance
- [ ] ✅ No "undefined" or blank screens
- [ ] N/A - No empty states

**Evidence**: [Screenshot of empty state]

#### Edge Cases
- [ ] ✅ Large datasets tested (e.g., 100+ goals/transactions)
- [ ] ✅ Special characters tested (emoji, unicode)
- [ ] ✅ Boundary values tested (0, negative, very large numbers)
- [ ] N/A - No edge cases identified

**Evidence**: [Describe edge cases tested]

---

## Bot Review Status

- [ ] ✅ **Claude Code Bot**: GREEN (approved)
- [ ] ✅ **CodeRabbit AI**: GREEN (approved)
- [ ] 🔄 Bot feedback pending
- [ ] ⚠️ CRITICAL/HIGH issues fixed (see below)
- [ ] ⏳ MEDIUM/LOW issues deferred to Linear (see below)

**Bot Feedback Resolution**:
```
[Paste bot feedback summary here, or link to bot comments]

CRITICAL Issues Fixed:
- [List or N/A]

HIGH Issues Fixed:
- [List or N/A]

MEDIUM Issues (Deferred to Linear):
- [List Linear issue URLs or N/A]

LOW Issues (Deferred to Linear):
- [List Linear issue URLs or N/A]
```

---

## Screenshots/Recordings (Optional but Encouraged)

**Before** (if applicable):
[Screenshot or "N/A - new feature"]

**After**:
[Screenshot or screen recording showing the feature working]

**Responsive Breakpoints** (if UI changes):
- Mobile (375px): [Screenshot]
- Tablet (768px): [Screenshot]
- Desktop (1920px): [Screenshot]

---

## Risk Assessment

- [ ] **None** (docs/tests only, no production code changes)
- [ ] **Low** (small UI change, well-tested)
- [ ] **Medium** (new feature, business logic changes)
- [ ] **High** (data model changes, migration required)

**Rollback Plan**: [Describe rollback strategy or "Single revert of this commit"]

---

## Checklist (Before Requesting Review)

- [ ] ✅ Spec.md read and understood (if Tier 1+ feature)
- [ ] ✅ Constitution v3.1 principles followed
- [ ] ✅ All CRITICAL/HIGH bot issues fixed
- [ ] ✅ MEDIUM/LOW bot issues deferred to Linear (with issue URLs)
- [ ] ✅ Manual testing complete (see above)
- [ ] ✅ Screenshots/recordings attached (if UI changes)
- [ ] ✅ ADR created (if architectural decision made)
- [ ] ✅ CLAUDE.md updated (if tech stack/process changed)

---

## Notes for Reviewers

[Anything reviewers should pay special attention to, or areas where you'd like feedback]

---

**Definition of Done**: See [CLAUDE.md:1052-1171](../CLAUDE.md#L1052) and [Constitution v3.1](../memory/constitution.md) for complete Phase 1 requirements.
