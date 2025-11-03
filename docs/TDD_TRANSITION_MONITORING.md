# TDD Transition Monitoring - Constitution v3.1

**Purpose:** Track the phased TDD transition and adjust guidance based on real-world usage
**Constitution Version:** v3.1 (Phased TDD: test-after → hybrid → strict)
**Start Date:** 2025-11-03
**Review Schedule:** Weekly during Weeks 1-8

---

## Phased TDD Timeline

### Weeks 1-2: Test-After (Learning Phase)
**Dates:** 2025-11-03 to 2025-11-16
**Approach:** Write code first, then tests
**Target:** 60% overall coverage

**What to Watch:**
- [ ] Are developers writing tests after code?
- [ ] Is 60% coverage achievable?
- [ ] Are tests catching real bugs?
- [ ] How long does test-writing take per feature?

**CodeRabbit Behavior Expected:**
- ✅ APPROVE: Code with tests added after (60%+ coverage)
- ⚠️ WARN: Code without tests (but don't block)

---

### Weeks 3-6: Hybrid (Transition Phase)
**Dates:** 2025-11-17 to 2025-12-14
**Approach:** Mix of TDD and test-after
**Target:** 70% overall coverage

**What to Watch:**
- [ ] Are some features being test-first?
- [ ] Is 70% coverage achievable?
- [ ] Are developers comfortable with TDD?
- [ ] Which approach works better for which features?

**CodeRabbit Behavior Expected:**
- ✅ APPROVE: Test-first approach
- ✅ APPROVE: Test-after with 70%+ coverage
- ⚠️ REQUEST CHANGES: Test-after with <60% coverage

---

### Week 7+: Strict TDD (Full Adoption)
**Dates:** 2025-12-15 onwards
**Approach:** Tests first (Red-Green-Refactor)
**Target:** 80% overall coverage

**What to Watch:**
- [ ] Are all features being test-first?
- [ ] Is 80% coverage achievable?
- [ ] Is TDD slowing down development?
- [ ] Are tests better quality with test-first?

**CodeRabbit Behavior Expected:**
- ✅ APPROVE: Test-first with 80%+ coverage
- ❌ REJECT: Code without tests
- ❌ REJECT: <70% coverage

---

## CodeRabbit Monitoring

### Track Rejections

**Watch for patterns:**
1. **Frequent rejections on business logic tests**
   - Issue: Guidance unclear
   - Action: Add more examples to .coderabbit.yaml

2. **Confusion about UI vs business logic**
   - Issue: Boundary unclear
   - Action: Add specific file path patterns to examples

3. **Coverage targets misunderstood**
   - Issue: 80%/90%/60% confusing
   - Action: Simplify or add visual diagram

### Example Adjustments Needed

**If developers ask:**
- "Is this business logic or UI?" → Add file path examples
- "What counts as financial?" → Add calculation.ts, balance.ts, etc.
- "Why did CodeRabbit reject this?" → Add clearer examples

**How to Update:**
1. Identify pattern in rejections
2. Update `.coderabbit.yaml` examples
3. Test on next PR
4. Document improvement here

---

## Weekly Review Checklist

### Week 1 Review (2025-11-10)
- [ ] PRs reviewed: [count]
- [ ] CodeRabbit rejections: [count]
- [ ] Coverage achieved: [%]
- [ ] Developer feedback: [notes]
- [ ] Adjustments needed: [list]

### Week 2 Review (2025-11-17)
- [ ] PRs reviewed: [count]
- [ ] CodeRabbit rejections: [count]
- [ ] Coverage achieved: [%]
- [ ] Developer feedback: [notes]
- [ ] Transition to hybrid: [ready/not ready]

### Week 4 Review (2025-12-01)
- [ ] PRs reviewed: [count]
- [ ] TDD adoption rate: [%]
- [ ] Coverage achieved: [%]
- [ ] Test quality improvement: [notes]

### Week 7 Review (2025-12-22)
- [ ] PRs reviewed: [count]
- [ ] Strict TDD adoption: [%]
- [ ] Coverage achieved: [%]
- [ ] Decision: Continue strict TDD or adjust?

---

## Metrics to Track

### Coverage Metrics (Weekly)
```
Week | Business Logic | Financial | Overall | Target
-----|----------------|-----------|---------|-------
  1  |       %        |     %     |    %    | 60%
  2  |       %        |     %     |    %    | 60%
  3  |       %        |     %     |    %    | 70%
  4  |       %        |     %     |    %    | 70%
  5  |       %        |     %     |    %    | 70%
  6  |       %        |     %     |    %    | 70%
  7  |       %        |     %     |    %    | 80%
  8  |       %        |     %     |    %    | 80%
```

### CodeRabbit Metrics
```
Week | PRs Reviewed | Approved | Rejected | Feedback Type
-----|--------------|----------|----------|---------------
  1  |              |          |          |
  2  |              |          |          |
  3  |              |          |          |
```

### Developer Velocity
```
Week | Features Shipped | Avg Time/Feature | Test Time %
-----|------------------|------------------|-------------
  1  |                  |                  |
  2  |                  |                  |
  3  |                  |                  |
```

---

## Decision Points

### End of Week 2 (2025-11-17)
**Question:** Is test-after working? Should we move to hybrid?
**Criteria:**
- ✅ 60% coverage achieved
- ✅ Developers comfortable writing tests
- ✅ Tests catching bugs
- ✅ No major velocity slowdown

**Decision:** [Move to hybrid / Stay in test-after / Adjust targets]

---

### End of Week 6 (2025-12-15)
**Question:** Is hybrid working? Ready for strict TDD?
**Criteria:**
- ✅ 70% coverage achieved
- ✅ Some features using test-first
- ✅ Test quality improved
- ✅ Developers comfortable with TDD

**Decision:** [Move to strict TDD / Stay in hybrid / Adjust approach]

---

### End of Week 8 (2025-12-29)
**Question:** Is strict TDD sustainable long-term?
**Criteria:**
- ✅ 80% coverage achieved
- ✅ Most features test-first
- ✅ Developer satisfaction high
- ✅ Velocity acceptable

**Decision:** [Continue strict TDD / Adjust / Create ADR-005]

---

## Feedback Loop

### From Developers
**How to collect:**
- Weekly standup: "How's TDD going?"
- PR comments: "This was easy/hard because..."
- Direct questions: Track and document

**Common Questions to Watch For:**
1. "Do I really need tests for this simple function?"
2. "What's the minimum coverage to pass CodeRabbit?"
3. "Can I skip tests for this deadline?"
4. "How do I test this complex calculation?"

### From CodeRabbit
**What to monitor:**
- Rejection reasons (are they correct?)
- False positives (rejecting when shouldn't)
- False negatives (approving when shouldn't)
- Clarity of feedback messages

### From CI/CD (When test.yml Added)
**What to track:**
- Build time with tests
- Flaky tests (intermittent failures)
- Coverage gates (passing/failing rates)
- Test execution time

---

## Adjustments Made

### Date: [YYYY-MM-DD]
**Issue:** [What problem was observed]
**Evidence:** [PR numbers, CodeRabbit comments, developer feedback]
**Change:** [What was adjusted in .coderabbit.yaml or templates]
**Result:** [Did it help?]

**Example:**
```
Date: 2025-11-10
Issue: CodeRabbit rejecting 50% of PRs for "no tests" when coverage was 65%
Evidence: PRs #70, #72, #74 all rejected despite having tests
Change: Clarified that 60% overall is minimum (not 80%)
Result: Rejection rate dropped to 10%
```

---

## Success Indicators

**We know TDD is working when:**
1. ✅ Coverage targets consistently met (60% → 70% → 80%)
2. ✅ Bug rate decreases (tests catch issues early)
3. ✅ Refactoring confidence increases (tests protect changes)
4. ✅ Developer satisfaction high (TDD helps, not hinders)
5. ✅ CodeRabbit rejection rate low (<20%)
6. ✅ Test quality improves (less trivial tests, more edge cases)

**We know TDD needs adjustment when:**
1. ⚠️ Coverage targets consistently missed
2. ⚠️ Developer frustration high ("TDD is slowing us down")
3. ⚠️ Tests are low quality (just hitting coverage numbers)
4. ⚠️ CodeRabbit rejection rate high (>50%)
5. ⚠️ Velocity drops significantly (features taking 2x longer)
6. ⚠️ Tests are brittle (breaking on every change)

---

## Escalation

**If TDD adoption is failing:**

1. **Week 2:** If <40% coverage → Extend test-after phase by 1 week
2. **Week 4:** If <50% coverage → Reassess targets, maybe 60%→50%
3. **Week 6:** If <60% coverage → Create ADR-005 adjusting approach
4. **Week 8:** If <70% coverage → Consult constitution, consider v3.2 adjustment

**Authority:** Matt (HIL) makes final decision on adjustments

---

## Related Documents

- [Constitution v3.1](../memory/constitution.md) - Source of truth for TDD requirements
- [CLAUDE.md](../CLAUDE.md) - Development guide with Phase 1 DoD
- [.coderabbit.yaml](../.coderabbit.yaml) - Bot enforcement rules
- [ADR-004](./architecture/decisions/004-feature-based-architecture-adoption.md) - Architecture decision

---

**Last Updated:** 2025-11-03
**Next Review:** 2025-11-10 (Week 1)
**Owner:** Matt (@mmtuentertainment)
