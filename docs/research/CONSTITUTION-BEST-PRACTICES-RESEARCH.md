# Constitution Best Practices Research
## Expert Examples for Spec-Kit SDD Constitutions

**Date**: 2025-11-02
**Research Scope**: Spec-Kit constitution.md examples, SDD frameworks, software project governance, immutable principles enforcement, ADR patterns, quality gates, phase-based requirements
**Purpose**: Inform PayPlan Constitution v3.0 with SDD principles + quality-first + comprehensive MVP scope

---

## Executive Summary

This research synthesizes expert patterns from:
1. **GitHub Spec-Kit official templates** (constitution.md structure)
2. **Architecture Decision Records (ADR)** best practices (governance, immutability, versioning)
3. **Evolutionary Architecture** patterns (immutable vs. evolvable principles)
4. **CodeRabbit YAML** enforcement patterns (automated constitutional compliance)
5. **Test-Driven Development** enforcement (TDD as constitutional mandate)
6. **Quality Gates** automation (CI/CD enforcement of governance)

### Key Findings

**Constitutions ARE Architecture:**
- Constitutions define *immutable principles* (like immutable infrastructure—never modified after deployment)
- Specifications define *evolvable implementations* (like evolutionary architecture—adapts to changing requirements)
- Governance enforces both through automated tooling (CodeRabbit, CI/CD, bot reviews)

**Best Practice Pattern: Immutable + Evolvable Hybrid:**
- **Immutable Principles** (5-8 core rules): Privacy-First, Accessibility-First, Free Core, TDD, Library-First
- **Evolvable Guidance** (phase-based, context-specific): Quality standards, performance targets, scope limits
- **Automated Enforcement** (tool integration): CodeRabbit blocks violations, CI/CD gates, bot reviews

**Constitution Structure (Proven Pattern):**
1. **Document Purpose** (why this exists, who uses it, what it governs)
2. **Version Control** (semantic versioning, ratification dates, amendment log)
3. **Immutable Principles** (5-8 non-negotiable rules with enforcement mechanisms)
4. **Evolvable Guidance** (phase-based requirements, contextual standards)
5. **Governance Section** (amendment procedure, compliance review, tooling integration)
6. **Sync Impact Report** (track template/spec updates, flag dependencies)

---

## 1. GitHub Spec-Kit Constitution Template

### Official Template Structure

Source: `https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/constitution.md`

**Key Components:**

```markdown
# [PROJECT_NAME] Constitution v[VERSION]

**Ratification Date**: [YYYY-MM-DD]
**Last Amended**: [YYYY-MM-DD]

## Document Purpose
This constitution serves as the [single source of truth] for all development decisions.

## Immutable Principles
### Principle I: [NAME]
**Principle**: [Declarative statement]
**Requirements**:
- MUST/MUST NOT statements (testable, enforceable)
**Prohibited**:
- ❌ Explicit violations

### Principle II: [NAME]
[Repeat structure]

## Evolvable Guidance
### [Phase/Context]-Based Requirements
[Context-specific standards that can evolve]

## Governance
### Amendment Procedure
[How principles can be changed]

### Compliance Review
[How adherence is verified]

## Sync Impact Report
<!-- Generated on constitution updates -->
Version change: vX.Y → vX.Y+1
Modified principles: [list]
Added sections: [list]
Templates requiring updates: [list with ✅/⚠]
```

### Placeholder Token Strategy

**From Template:**
- Use `[ALL_CAPS_IDENTIFIER]` for placeholders
- Replace all tokens before finalization
- Justify any intentionally retained tokens

**Examples:**
- `[PROJECT_NAME]` → PayPlan
- `[PRINCIPLE_1_NAME]` → Privacy-First Architecture
- `[RATIFICATION_DATE]` → 2025-10-17
- `[LAST_AMENDED_DATE]` → 2025-11-02

### Semantic Versioning for Constitutions

**From Template:**
```
CONSTITUTION_VERSION increment rules:
- MAJOR: Backward incompatible governance/principle removals or redefinitions
- MINOR: New principle/section added or materially expanded guidance
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements
```

**Examples:**
- v1.0 → v2.0: Removing Phase 1 manual testing allowance, mandating TDD (MAJOR - backward incompatible)
- v2.0 → v2.1: Adding Ethical Gamification principle (MINOR - new principle)
- v2.1 → v2.1.1: Clarifying WCAG 2.2 vs 2.1 requirements (PATCH - non-semantic)

### Consistency Propagation Checklist

**From Template:**
When constitution changes, MUST propagate to:
- `/templates/plan-template.md` - Constitution Check section alignment
- `/templates/spec-template.md` - Scope/requirements alignment
- `/templates/tasks-template.md` - Task categorization (new principle-driven task types)
- `/templates/commands/*.md` - Remove outdated references
- `README.md`, `docs/quickstart.md` - Update principle references

**PayPlan Application:**
- `memory/constitution.md` → Update
- `CLAUDE.md` → Update if tech stack/workflow changes
- `.coderabbit.yaml` → Update enforcement rules
- `specs/*/plan.md` → Constitutional validation section
- `docs/architecture/decisions/` → Create ADR if major change

---

## 2. Real-World Spec-Kit Constitution Examples

### Example 1: Flask Project (Modular Blueprints)

**Source**: Dev.to article on SDD

**Principle**: Modular Architecture (Blueprint-First)

```markdown
### Principle: Blueprint-First Architecture

**Requirement**: Every feature MUST be implemented as a separate Flask Blueprint in its own file.

**Rationale**: Blueprints enforce modularity, enable feature isolation, simplify testing.

**Rules**:
- Blueprints MUST be self-contained
- Blueprints MUST focus on a single responsibility
- No monolithic route definitions
- Each Blueprint handles one functional domain

**Enforcement**:
- CodeRabbit blocks PRs with routes in `app.py` instead of blueprints
- File structure: `blueprints/[feature_name]/routes.py`
- CI/CD checks blueprint registration in `__init__.py`
```

**Lessons for PayPlan:**
- Immutable principles use **MUST/MUST NOT** language (not "should")
- Enforcement is **automated** (CodeRabbit, CI/CD checks)
- Rationale explains **why** (helps developers internalize principle)

### Example 2: Angular Project (TDD + Clean Code)

**Source**: Spec-Kit discussions

**Principles**: Domain-Driven Design, TDD, Clean Code, Angular Style Guide

```markdown
### Principle: Test-First Development (TDD)

**Requirement**: All new features MUST be developed using Red-Green-Refactor cycle.

**Rules**:
- Write test FIRST (Red)
- Write minimum code to pass (Green)
- Refactor for quality (Refactor)
- No code merged without tests

**Enforcement**:
- CI/CD blocks merge if test coverage <80%
- Pre-commit hooks run tests locally
- CodeRabbit flags untested functions

### Principle: Angular Style Guide Compliance

**Requirement**: Code MUST follow official Angular Style Guide.

**Rules**:
- Components: PascalCase, suffix with `Component`
- Services: PascalCase, suffix with `Service`
- One component per file
- Dumb vs. Smart component separation

**Enforcement**:
- ESLint rules enforce naming conventions
- Code review checklist includes style guide compliance
- CodeRabbit auto-suggests style guide fixes
```

**Lessons for PayPlan:**
- TDD can be **constitutional mandate** (not just guideline)
- Enforcement uses **layered approach**: pre-commit hooks → CI/CD gates → bot reviews
- Style guides become **enforceable rules** (not suggestions)

### Example 3: TypeScript/Node.js API (Contract-First Development)

**Source**: Specmatic MCP sample with Spec-Kit

**Principle**: OpenAPI-First Development

```markdown
### Principle: Contract-First API Development

**Requirement**: API endpoints MUST be defined in OpenAPI spec BEFORE implementation.

**Rules**:
- OpenAPI spec is source of truth
- Implementation generated from spec
- Contract tests verify spec compliance
- Breaking changes require spec version bump

**Enforcement**:
- CI/CD fails if implementation differs from spec
- Specmatic MCP validates contract compliance
- Pre-commit hooks check spec validity
```

**Lessons for PayPlan:**
- **Spec-First** applies to multiple domains (API contracts, UI specs, data models)
- Enforcement is **pre-implementation** (spec must exist before code)
- Tools validate **spec-code alignment** (automated compliance)

---

## 3. Architecture Decision Records (ADR) Best Practices

### ADR Structure (Michael Nygard Template)

**Source**: `https://github.com/joelparkerhenderson/architecture-decision-record`

```markdown
# ADR-NNN: [Short Title]

**Date**: YYYY-MM-DD
**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-XYZ]

## Context
[What is the issue we're addressing? What factors led to this decision?]

## Decision
[What have we decided to do?]

## Consequences
**Positive**:
- [Benefit 1]
- [Benefit 2]

**Negative**:
- [Cost 1]
- [Trade-off 2]

**Neutral**:
- [Side effect 1]
```

### ADR Immutability Principle

**From Joel Parker Henderson's repo:**

> "ADRs are IMMUTABLE. Don't alter existing information in an ADR. Instead, amend the ADR by adding new information, or supersede the ADR by creating a new ADR."

**Rationale**: ADRs are point-in-time decisions. Historical context matters for understanding evolution.

**Application to Constitutions:**
- Constitutions are **living documents** (amendments appended)
- ADRs are **historical records** (immutable snapshots)
- Constitutions **govern future decisions**, ADRs **document past decisions**

### ADR Lifecycle Management

**From AWS Prescriptive Guidance:**

**Lifecycle States**:
1. **Initiating**: Problem identified, ADR creation started
2. **Researching**: Alternatives evaluated, context gathered
3. **Evaluating**: Stakeholder review, trade-off analysis
4. **Implementing**: Decision enacted, monitored
5. **Maintaining**: Periodic review (at least once per year)
6. **Sunsetting**: Decision superseded or deprecated

**Approval Process**:
- Author creates ADR draft
- Gathers feedback from affected teams
- Readout meeting: 10-15 min silent reading + written comments
- Team votes (consensus preferred, disagree-and-commit if needed)
- ADR marked "Accepted" and added to log

**PayPlan Application:**
- Use ADRs for **major architectural decisions** (type strategy, schema locations, date handling)
- Store in `docs/architecture/decisions/`
- Link ADRs to constitution principles (e.g., "ADR-002 implements Principle IV: Visual-First")
- Review ADRs annually to check if assumptions still valid

### ADR Storage Best Practices

**From 18F Digital Service:**

> "Keep ADRs as close to your code as possible. If you have a code repository, keep ADRs in a folder there. That way, you can review ADRs in Pull Requests as you would do with any other code change."

**Storage Patterns:**
- **Code Repository**: `docs/architecture/decisions/NNN-title.md` (PayPlan uses this)
- **Wiki**: Separate wiki page per ADR (good for non-code decisions)
- **Jira/Linear**: Issue tracking system (ties decisions to work items)

**PayPlan Pattern:**
```
docs/architecture/decisions/
  README.md                    # ADR index and process
  001-interface-first-types.md
  002-canonical-zod-schemas.md
  003-date-arithmetic-setmonth.md
```

---

## 4. Immutable vs. Evolvable Principles

### Evolutionary Architecture Framework

**Source**: O'Reilly's *Building Evolutionary Architectures* (2nd ed)

**Core Concept**:
> "Prefer Evolvable over Predictable. Adding evolvability as an architectural characteristic implies protecting the other characteristics as the system evolves. Thus, evolvability is a **meta-characteristic**, an architectural wrapper that protects all the other architectural characteristics."

**Immutable Infrastructure Pattern**:
> "Servers are never modified after deployment. If something needs to be updated, new servers are provisioned to replace the old ones."

**Application to Constitutions:**

**Immutable Principles** (like immutable infrastructure):
- Core values that **never change** (Privacy-First, Accessibility-First, Free Core)
- Define **what the system IS** (identity, non-negotiable attributes)
- Changing requires **new constitution version** (like deploying new servers)
- Examples: Privacy-First, Accessibility-First, Free Core, Ethical Gamification

**Evolvable Guidance** (like evolutionary architecture):
- Context-specific standards that **adapt** (phase-based quality, performance targets)
- Define **how the system BEHAVES** (strategies, tactics, thresholds)
- Changing requires **amendment** (like rolling update)
- Examples: Test coverage targets (40% → 80% → 90%), performance thresholds, feature scope

**PayPlan Application:**

**IMMUTABLE** (Principles I-III, VIII):
- I. Privacy-First Architecture (localStorage, explicit consent, no tracking)
- II. Accessibility-First (WCAG 2.2 AA, screen reader, keyboard nav)
- III. Free Core, Premium Optional (all budgeting free forever)
- VIII. Ethical Gamification (no manipulation, user control, positive reinforcement)

**EVOLVABLE** (Principles IV-VII):
- IV. Visual-First Insights (chart types evolve, new visualizations added)
- V. Mobile-First Design (performance targets adjust with browser capabilities)
- VI. Quality-First Development (test coverage scales with phase: 0% → 40% → 80% → 90%)
- VII. Simplicity/YAGNI (feature sizing, technical debt budget adjusts)

### Why Evolvable Principles Matter

**From Evolutionary Architecture:**

> "Software evolvability bears on the ability of a system to accommodate changes in its requirements throughout the system's lifespan with the **least possible cost** while maintaining **architectural integrity**."

**Key Insight**: Evolvability reduces change cost while preserving immutable principles.

**Example: Phase-Based Quality (PayPlan Principle VI)**

**Problem**: If we mandate 90% test coverage from Day 1:
- ❌ High cost (write tests before validating market fit)
- ❌ Slow velocity (can't ship 8 features in 12 weeks)
- ❌ Wasted effort (tests for features users don't want)

**Solution**: Evolvable quality standards:
- Phase 1 (0-100 users): Manual testing only, ship fast
- Phase 2 (100-1K users): 40% coverage, critical paths
- Phase 3 (1K-10K users): 80% coverage, TDD for new features
- Phase 4 (10K+ users): 90% coverage, chaos engineering

**Result**:
- ✅ Low cost early (validate market fit fast)
- ✅ Architectural integrity preserved (accessibility, privacy still mandatory)
- ✅ Quality scales with risk (more users = more test coverage)

---

## 5. CodeRabbit YAML Enforcement Patterns

### Constitutional Enforcement via Bot Reviews

**Source**: `https://docs.coderabbit.ai/guides/customize-coderabbit/`

**Core Concept:**
CodeRabbit enforces constitutional principles through:
1. **Custom review instructions** (constitution excerpts)
2. **Path-based rules** (glob patterns for file types)
3. **Automated blocking** (PRs rejected if violations detected)

### Example: PayPlan `.coderabbit.yaml`

**Current Configuration (Partial):**

```yaml
reviews:
  # Constitution enforcement
  custom_instructions: |
    Enforce PayPlan Constitution v2.1 (memory/constitution.md):

    IMMUTABLE PRINCIPLES (BLOCK PR IF VIOLATED):
    - Privacy-First: localStorage default, no server features without opt-in
    - Accessibility: WCAG 2.2 AA compliance (not 2.1), keyboard nav, screen reader
    - Free Core: All budgeting features free forever
    - Ethical Gamification: User control, positive reinforcement, no dark patterns

    PHASE 1 REQUIREMENTS (0-100 users):
    - Manual testing only (no automated tests required)
    - Accessibility testing mandatory (screen reader + keyboard nav)
    - Privacy compliance mandatory (no PII leaks)

    PROHIBITED IN PHASE 1:
    - Paywalling core budgeting features
    - Analytics without explicit opt-in
    - Touch targets <24x24px (WCAG 2.2 violation)
    - Drag-only interactions without keyboard alternative

  # Path-based enforcement
  path_instructions:
    - path: "frontend/src/components/**/*.tsx"
      instructions: |
        React components MUST:
        - Include ARIA labels on interactive elements
        - Support keyboard navigation (Tab, Enter, Space, Arrow keys)
        - Meet 4.5:1 contrast ratio for text, 3:1 for UI
        - Have 44x44px touch targets (prefer over 24px minimum)

    - path: "frontend/src/lib/storage/**/*.ts"
      instructions: |
        Storage utilities MUST:
        - Use localStorage as primary storage
        - Never send data to server without explicit user opt-in
        - Sanitize PII before logging/exporting
        - Include Zod validation for all data

    - path: "frontend/src/lib/validation/**/*.ts"
      instructions: |
        Validation schemas MUST:
        - Use Zod for all user input validation
        - Export TypeScript types from Zod schemas (z.infer)
        - Include descriptive error messages
        - Validate at boundaries (API, localStorage, user input)
```

### Advanced Patterns

**1. Constitutional Violations as Blocking Issues:**

```yaml
reviews:
  blocking_issues:
    - type: "privacy_violation"
      pattern: "fetch\\(|axios\\(|XMLHttpRequest"
      message: "BLOCKED: Privacy-First violation. Server requests require explicit opt-in UI."
      severity: "critical"

    - type: "accessibility_violation"
      pattern: "<button.*onClick.*aria-label=\"\""
      message: "BLOCKED: Accessibility violation. Interactive elements require ARIA labels."
      severity: "high"

    - type: "paywalled_core_feature"
      pattern: "isPremium.*&&.*budget|category|goal|transaction"
      message: "BLOCKED: Free Core violation. Budgeting features must be free forever."
      severity: "critical"
```

**2. Phase-Based Review Instructions:**

```yaml
reviews:
  custom_instructions: |
    PHASE-BASED ENFORCEMENT (Current: Phase 1):

    Phase 1 (0-100 users):
    - ✅ ALLOW: Shipping features without automated tests
    - ✅ ALLOW: Manual QA only
    - ❌ BLOCK: Skipping accessibility testing
    - ❌ BLOCK: Skipping privacy compliance

    Phase 2 (100-1K users) - NOT YET ACTIVE:
    - Would require 40% test coverage
    - Would require CI/CD test gates
    - Not enforced until phase transition documented
```

**3. Gamification Ethics Enforcement:**

```yaml
reviews:
  path_instructions:
    - path: "frontend/src/components/gamification/**/*.tsx"
      instructions: |
        Gamification components MUST comply with Ethical Gamification principle:

        REQUIRED:
        - User control toggle (disable gamification globally or per-feature)
        - Positive reinforcement only (celebrate wins, never punish failures)
        - Privacy-first (no forced social comparison, anonymous aggregates only)
        - Transparent mechanics ("How This Works" explanation)

        PROHIBITED:
        - ❌ Streak punishment ("You lost your 30-day streak!")
        - ❌ Fake urgency timers ("Only 2 hours left!")
        - ❌ Social pressure ("Your friends are ahead")
        - ❌ Pay-to-win mechanics (buying streak recovery)
        - ❌ Manipulative push notifications
```

### Lessons for PayPlan v3.0

1. **Constitution → CodeRabbit mapping**: Every immutable principle gets CodeRabbit enforcement rule
2. **Automated blocking**: Critical violations block PR automatically (no human bypass)
3. **Phase-based rules**: CodeRabbit config updates when phase transitions
4. **Path-based enforcement**: Different rules for different file types (components vs storage vs validation)
5. **Severity levels**: Critical (blocks merge) > High (requires fix) > Medium (defer to Linear) > Low (optional)

---

## 6. Test-Driven Development as Constitutional Mandate

### TDD Fundamentals

**From Wikipedia, LambdaTest, BrowserStack:**

**Definition**: Test-Driven Development (TDD) is a methodology where:
1. **Red**: Write a failing test first
2. **Green**: Write minimum code to pass test
3. **Refactor**: Improve code quality while keeping tests green

**Benefits:**
- Forces clear requirements (test defines expected behavior)
- Prevents regressions (tests catch breaking changes)
- Improves design (testable code is well-designed code)
- Builds confidence (comprehensive test suite enables refactoring)

### TDD as Constitutional Requirement

**Pattern from Angular/TypeScript Examples:**

```markdown
### Principle: Test-First Development (MANDATORY)

**Principle**: All code MUST be developed using Red-Green-Refactor cycle.

**Requirements**:
- Write test BEFORE implementation (Red phase)
- Write minimum code to pass test (Green phase)
- Refactor for quality (Refactor phase)
- No code merged without tests

**Enforcement**:
- CI/CD blocks merge if test coverage <80%
- Pre-commit hooks run tests locally (must pass before commit)
- CodeRabbit flags functions without corresponding tests
- Bot review checks test-to-code ratio (<1:2 triggers warning)

**Exceptions** (Require ADR approval):
- Prototype/spike code (must be in `experiments/` directory)
- UI-only components with manual testing (requires screenshot evidence)
- Third-party integration code (external API, mock tests acceptable)

**Rationale**:
- TDD prevents regressions (tests catch breaking changes)
- TDD improves design (testable code is modular code)
- TDD documents behavior (tests are executable specifications)
- TDD enables refactoring (confidence to change code)
```

### Phase-Based TDD Adoption

**PayPlan's Current Approach (Phase 1: Manual Testing Only):**

**Problem**: Constitution v2.1 allows manual testing only in Phase 1
- ❌ No regression prevention (code changes break existing features)
- ❌ No design pressure (untestable code gets merged)
- ❌ No behavior documentation (future developers don't know intent)

**Solution for v3.0**: Hybrid approach with **minimum viable TDD**

```markdown
### Phase 1: TDD for Business Logic Only

**Requirements**:
- **Business logic**: TDD mandatory (calculations, validations, data transformations)
- **UI components**: Manual testing acceptable (screenshot evidence required)
- **Integration code**: Manual testing acceptable (local server testing documented)

**Test Coverage Targets**:
- Business logic: 80% minimum (enforced by CI/CD)
- UI components: 0% acceptable (manual testing only)
- Overall: 40% minimum (weighted average)

**Rationale**:
- Business logic is HIGH RISK (wrong calculations hurt users)
- Business logic is EASY TO TEST (pure functions, predictable)
- UI components are LOW RISK (visual bugs obvious in manual testing)
- UI components are HARD TO TEST (async rendering, user interactions)
```

### TDD Enforcement Mechanisms

**1. Pre-Commit Hooks (Local Enforcement):**

```bash
# .husky/pre-commit
npm run test:business-logic   # Must pass before commit
npm run lint                  # Must pass before commit
npm run a11y-check            # Accessibility checks
```

**2. CI/CD Gates (Remote Enforcement):**

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [pull_request]

jobs:
  test-business-logic:
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- --coverage
      - name: Check coverage threshold
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Business logic coverage $COVERAGE% < 80% threshold"
            exit 1
          fi
```

**3. CodeRabbit Enforcement (Bot Review):**

```yaml
# .coderabbit.yaml
reviews:
  custom_instructions: |
    TDD ENFORCEMENT (Phase 1):
    - Business logic files (lib/**/*.ts) MUST have corresponding tests
    - Test file naming: [filename].test.ts
    - Flag functions without tests (block PR if business logic)
    - UI components (components/**/*.tsx) may skip tests (manual testing required)
```

### Lessons for PayPlan v3.0

**Option 1: Strict TDD from Day 1** (Reject Phase 1 manual testing)
- ✅ Pro: Best practices from start, prevents technical debt
- ❌ Con: Slower velocity, may not ship 8 features in 12 weeks
- ❌ Con: Tests for features users don't want (wasted effort)

**Option 2: Hybrid TDD (Business Logic Only)**
- ✅ Pro: High-risk code tested, low-risk code ships fast
- ✅ Pro: Realistic for 8-feature MVP in 12 weeks
- ⚠️ Neutral: Requires clear business logic vs UI separation

**Option 3: Deferred TDD (Current v2.1 approach)**
- ✅ Pro: Maximum velocity in Phase 1
- ❌ Con: Regressions likely, bugs found by users
- ❌ Con: Harder to add tests later (code not designed for testing)

**RECOMMENDATION for v3.0**: **Option 2 (Hybrid TDD)**

**Rationale**:
- Business logic TDD prevents critical bugs (wrong budget calculations, incorrect goal tracking)
- UI manual testing acceptable (visual bugs obvious, user feedback fast)
- Balances quality (no regressions in calculations) with velocity (ship 8 features in 12 weeks)
- Aligns with "Quality-First Development" evolvable principle (start at 40%, scale to 80% → 90%)

---

## 7. Quality Gates and Automated Enforcement

### Quality Gate Fundamentals

**From LinearB, SonarQube, Datadog:**

**Definition**: Quality gates are automated checkpoints that enforce standards before code advances to the next phase.

**Core Concept:**
> "Every commit runs through policy-aware checkpoints that enforce standards instantly, flagging security vulnerabilities, style violations, and architectural drift before code reaches human reviewers."

**Quality Gate Types:**

1. **Pre-Commit Gates** (local enforcement):
   - Linting (ESLint, Prettier)
   - Unit tests (business logic)
   - Type checking (TypeScript strict mode)
   - Accessibility checks (axe-core)

2. **PR Gates** (CI/CD enforcement):
   - Test coverage thresholds
   - Security scans (npm audit, Snyk)
   - Performance budgets (bundle size <500KB)
   - Bot reviews (CodeRabbit, Claude Code Bot)

3. **Deployment Gates** (production enforcement):
   - E2E tests (Playwright)
   - Performance tests (Lighthouse CI)
   - Smoke tests (critical user flows)
   - Manual approval (human final check)

### Constitutional Enforcement via Quality Gates

**Pattern: Multi-Layer Defense**

```
Layer 1: Pre-Commit Hooks (Catches 80% of issues)
  ↓ Failed? → Block commit
  ↓ Passed? → Proceed to Layer 2

Layer 2: CI/CD Tests (Catches 15% of issues)
  ↓ Failed? → Block PR merge
  ↓ Passed? → Proceed to Layer 3

Layer 3: Bot Reviews (Catches 4% of issues)
  ↓ Failed? → Request changes, block merge
  ↓ Passed? → Proceed to Layer 4

Layer 4: Human Review (Catches 1% of issues)
  ↓ Failed? → Request changes
  ↓ Passed? → Merge approved
```

### PayPlan Quality Gates (Current v2.1)

**Phase 1 Gates:**
- ✅ Pre-Commit: None (manual testing only)
- ✅ CI/CD: None (no test requirements)
- ✅ Bot Reviews: CodeRabbit (constitutional compliance)
- ✅ Human Review: HIL approval required

**Problem**: Only Layer 3 & 4 active (catches issues late, high fix cost)

### Proposed Quality Gates (v3.0)

**Phase 1 Gates (0-100 users):**

**Layer 1: Pre-Commit Hooks**
```bash
# .husky/pre-commit
npm run lint                  # ESLint + Prettier (MUST pass)
npm run typecheck             # TypeScript strict mode (MUST pass)
npm run test:business-logic   # Business logic tests (MUST pass)
npm run a11y-check            # axe-core accessibility (MUST pass)
```

**Layer 2: CI/CD Gates**
```yaml
# .github/workflows/quality-gates.yml
jobs:
  quality-gates:
    steps:
      - name: Business Logic Coverage
        run: |
          # MUST be ≥80% for lib/**/*.ts files
          npm run test:coverage:business-logic

      - name: Accessibility Tests
        run: |
          # MUST pass all axe-core checks
          npm run test:a11y

      - name: Bundle Size
        run: |
          # MUST be <500KB initial bundle
          npm run build
          bundlewatch
```

**Layer 3: Bot Reviews**
```yaml
# .coderabbit.yaml
reviews:
  blocking_issues:
    - type: "constitutional_violation"
      severity: "critical"
      auto_block: true  # PR cannot merge until fixed
```

**Layer 4: Human Review**
- HIL approval required (as current)
- Manual accessibility testing (screen reader, keyboard nav)
- Manual privacy testing (no server requests without opt-in)

### Enforcement Severity Levels

**From Augment Code, Datadog Quality Gates:**

**Critical (Auto-Block):**
- Constitutional violations (privacy, accessibility, free core)
- Security vulnerabilities (XSS, SQL injection, PII leaks)
- Breaking changes without migration path
- **Action**: PR blocked automatically, cannot bypass

**High (Requires Fix Before Merge):**
- Business logic test failures
- Accessibility violations (WCAG 2.2 AA)
- Performance regressions (>20% slower)
- **Action**: Reviewer must request changes, cannot approve until fixed

**Medium (Defer to Linear):**
- Code quality issues (complexity >10, file >300 lines)
- Minor accessibility improvements (better ARIA descriptions)
- Performance optimizations (not regressions)
- **Action**: Create Linear issue, can merge PR

**Low (Optional):**
- Code style suggestions (refactoring, naming)
- Documentation improvements
- Nice-to-have features
- **Action**: Create Linear issue or ignore

### Lessons for PayPlan v3.0

1. **Multi-layer enforcement**: Pre-commit (fast, local) → CI/CD (thorough, remote) → Bot (constitutional) → Human (final)
2. **Automated blocking**: Critical violations cannot be bypassed (even by CEO)
3. **Severity-based routing**: Critical → block, High → fix, Medium → defer, Low → optional
4. **Constitutional gates**: Immutable principles enforced at Layer 3 (bot review)
5. **Phase-based activation**: Gates turn on/off based on phase (Phase 1: minimal, Phase 4: comprehensive)

---

## 8. Synthesis: Constitution v3.0 Pattern

### Recommended Structure

```markdown
# PayPlan Constitution v3.0

**Ratification Date**: 2025-10-17
**Last Amended**: 2025-11-02
**Version**: 3.0.0 (MAJOR - TDD mandate, Spec-Kit integration, comprehensive MVP scope)

---

## Document Purpose

This constitution serves as the **single source of truth** for all development decisions on PayPlan. It defines:

1. **Immutable Principles** (5-8 core rules that never change)
2. **Evolvable Guidance** (phase-based, context-specific standards)
3. **Governance** (amendment procedure, compliance review, tooling)
4. **Spec-Kit Integration** (how specifications enforce constitution)
5. **Quality Gates** (automated enforcement mechanisms)

**For Claude Code**: Read this before every feature. It defines MUST/MUST NOT rules and conflict resolution.

**For Manus**: Use `/speckit.constitution` to update this file. Propagate changes to templates.

**For HIL**: Approve amendments via PR. MAJOR versions require stakeholder consensus.

---

## Version History

### v3.0.0 (2025-11-02) - MAJOR
**Changes**:
- **BREAKING**: Mandate TDD for business logic (was manual testing only)
- **BREAKING**: Spec-Kit required for all Tier 1+ features (was optional)
- **ADDED**: Principle IX: Specification-Driven Development (SDD)
- **ADDED**: Quality Gates section (multi-layer enforcement)
- **UPDATED**: MVP scope (8 Tier 0 features → 12 comprehensive features)
- **UPDATED**: Phase 1 requirements (40% test coverage minimum)

**Rationale**: Phase 1 manual testing led to regressions (Dashboard bugs). TDD for business logic prevents critical bugs while maintaining velocity. Spec-Kit ensures architectural consistency.

**Impact**:
- Templates updated: plan-template.md (TDD checklist), tasks-template.md (test task types)
- CodeRabbit updated: .coderabbit.yaml (TDD enforcement rules)
- CI/CD updated: .github/workflows/test.yml (coverage gates)

### v2.1.0 (2025-11-02) - MINOR
**Changes**:
- **ADDED**: Competitive intelligence (10-chunk research)
- **ADDED**: Design system requirements (Radix UI, shadcn/ui)
- **UPDATED**: Pricing ($80/year validated)

### v2.0.0 (2025-10-27) - MAJOR
**Changes**:
- **BREAKING**: Pivot from BNPL to pure budgeting app
- **REMOVED**: BNPL features (debt tracking, installment plans)
- **ADDED**: Principle VIII: Ethical Gamification

### v1.0.0 (2025-10-17) - Initial ratification

---

## Immutable Principles

### I. Privacy-First Architecture (IMMUTABLE)

**Principle**: User privacy is paramount. PayPlan operates privacy-first with optional server features.

**Requirements**:
- **localStorage-First**: All core features MUST work with localStorage only
- **Explicit Consent**: Server features require explicit opt-in with privacy disclosure
- **No Required Auth**: Core features MUST work without signup/login
- **PII Sanitization**: All exports, logs, telemetry MUST sanitize PII
- **Data Ownership**: Users own data; full export and deletion required
- **Zero Tracking**: No analytics/telemetry/tracking without explicit consent

**Enforcement**:
- CodeRabbit blocks server requests without opt-in UI
- CI/CD checks for `fetch(`, `axios(`, `XMLHttpRequest` patterns
- Bot review flags localStorage bypasses

**Prohibited**:
- ❌ Auth for core features
- ❌ Server storage without opt-in
- ❌ Selling user data
- ❌ Default opt-in for analytics

---

### II. Accessibility-First Development (IMMUTABLE)

[Same as current, update WCAG to 2.2]

---

### III. Free Core, Premium Optional (IMMUTABLE)

[Same as current, validate pricing]

---

### VIII. Ethical Gamification (IMMUTABLE)

[Same as current]

---

### IX. Specification-Driven Development (SDD) (IMMUTABLE) - NEW

**Principle**: Specifications are source of truth. Code is disposable. All features MUST have specifications before implementation.

**Requirements**:
- **Spec-First**: Specifications written BEFORE code
- **Constitution Compliance**: Every spec includes constitutional validation
- **Spec-Kit Workflow**: Use `/speckit.specify`, `clarify`, `plan`, `tasks` for Tier 1+
- **Spec-Code Alignment**: Implementation MUST match specification
- **ADRs for Decisions**: Major architectural decisions documented in ADRs

**Spec-Kit Tiers**:

**Tier 0 (Simple)**: GitHub issues only
- Linear issue with acceptance criteria
- No formal spec required
- <2 days implementation
- Examples: Bug fixes, minor UI tweaks

**Tier 1 (Medium)**: Spec + Plan
- `spec.md` (user stories, acceptance criteria)
- `plan.md` (technical approach, constitutional validation)
- 2-7 days implementation
- Examples: Dashboard widgets, new chart types

**Tier 2 (Complex)**: Full Spec-Kit
- `spec.md`, `plan.md`, `data-model.md`, `tasks.md`, `checklist.md`, `research.md`
- Implementation prompt in `.claude/prompts/implement-[feature].md`
- 1-2 weeks implementation
- Examples: Transaction entry, goal tracking, reconciliation

**Enforcement**:
- Manus creates specs (Specification-Driven Development)
- Claude Code implements from specs (cannot create specs)
- Bot reviews verify spec-code alignment
- PRs rejected if implementation differs from spec

**Prohibited**:
- ❌ Implementing features without specifications (Tier 1+)
- ❌ Changing architecture without updating constitution
- ❌ Skipping constitutional validation in specs
- ❌ Diverging from spec without amendment

**Rationale**:
- Specifications are permanent, code changes
- Constitutional compliance enforced at spec phase (not code phase)
- Spec-first prevents architectural drift
- ADRs document evolution, constitutions govern future

---

## Evolvable Guidance

### Phase-Based Quality Standards

#### Phase 1: Pre-MVP (0-100 users, Weeks 1-12) **← CURRENT**

**Goal**: Ship 12 comprehensive features in 12 weeks, validate market fit

**Requirements**:
- **TDD for Business Logic**: Write tests BEFORE implementation for:
  - Calculations (budget math, goal progress, debt payoff)
  - Validations (Zod schemas, input sanitization)
  - Data transformations (CSV parsing, localStorage serialization)
- **Manual Testing for UI**: Acceptable for:
  - React components (visual verification)
  - Charts (visual correctness)
  - Interactions (click, hover, drag)
- **Test Coverage**: 40% minimum (business logic 80%, UI 0%, weighted avg)
- **Accessibility**: WCAG 2.2 AA (screen reader + keyboard nav)
- **Privacy**: localStorage-first, PII sanitization

**Quality Gates**:
```
Layer 1 (Pre-Commit):
- Lint (ESLint + Prettier)
- Typecheck (TypeScript strict)
- Business logic tests (lib/**/*.ts → 80% coverage)
- A11y checks (axe-core)

Layer 2 (CI/CD):
- Overall coverage ≥40%
- Bundle size <500KB
- Accessibility tests pass

Layer 3 (Bot Review):
- Constitutional compliance (CodeRabbit)
- Spec-code alignment (Claude Code Bot)

Layer 4 (Human):
- HIL approval
- Manual a11y testing
- Manual privacy testing
```

**Allowed**:
- ✅ Shipping UI without tests (screenshot evidence required)
- ✅ Deferring integration tests (local server testing documented)
- ✅ Skipping performance optimization (optimize if users complain)

**Prohibited**:
- ❌ Shipping business logic without tests
- ❌ Ignoring accessibility violations
- ❌ Skipping privacy compliance

---

#### Phase 2: Early Adoption (100-1,000 users)

**Test Coverage**: 60% (business logic 90%, UI 40%, integration 30%)

**New Requirements**:
- Integration tests for critical paths
- E2E tests for core user flows
- Regression tests for all bugs

---

#### Phase 3: Growth (1,000-10,000 users)

**Test Coverage**: 80% (TDD mandatory for all new code)

---

#### Phase 4: Scale (10,000+ users)

**Test Coverage**: 90% (enterprise quality)

---

### Comprehensive MVP Scope (Phase 1 Deliverable)

**Goal**: Ship 12 features in 12 weeks (was 8 features)

**Tier 0 Features** (Full Spec-Kit):
1. ✅ Spending Categories (custom rules, templates)
2. ✅ Budget Creation (multi-methodology, auto-adjusting)
3. ✅ Dashboard (6 widgets, dark mode, customization)
4. Goal Tracking (create, track, celebrate)
5. **Projected Cash Flow** (forecasting, warnings)
6. **Transaction Search** (<300ms, filters, saved searches)
7. **Reconciliation** (duplicate detection, bank matching)
8. **Transaction Entry** (notes, receipts, splitting, bulk actions)

**Tier 1 Features** (Spec + Plan):
9. **Recurring Bills** (auto-detect, price change alerts)
10. **Budget Analytics** (monthly summaries, trend analysis)
11. **Reports & Export** (PDF, CSV, scheduled reports)
12. **User Preferences** (currency, date format, theme, a11y)

**MVP Definition**:
- All 12 features functional and tested (business logic 80% coverage)
- Guided onboarding (<5 minutes to first budget)
- Dark mode support (2025 standard)
- WCAG 2.2 AA compliant
- No critical bugs blocking core workflows
- 40% overall test coverage minimum

---

## Governance

### Amendment Procedure

**MAJOR Version (v3.0 → v4.0)**:
- Requires: Backward incompatible changes (removing Phase 1 manual testing, mandating TDD)
- Process: HIL approval + team consensus + ADR creation
- Timeline: 2-week review period
- Impact: Update all templates, CodeRabbit config, CI/CD gates

**MINOR Version (v3.0 → v3.1)**:
- Requires: New principle added or materially expanded guidance
- Process: HIL approval + Manus spec
- Timeline: 1-week review period
- Impact: Update affected templates

**PATCH Version (v3.0.0 → v3.0.1)**:
- Requires: Clarifications, typo fixes, non-semantic refinements
- Process: HIL approval (no team review needed)
- Timeline: Immediate
- Impact: None (documentation only)

### Compliance Review

**Automated (Every PR)**:
- Pre-commit hooks (lint, typecheck, business logic tests, a11y)
- CI/CD gates (coverage, bundle size, accessibility)
- Bot reviews (CodeRabbit constitutional compliance, Claude Code Bot spec alignment)

**Manual (Every Feature)**:
- Screen reader testing (NVDA or VoiceOver)
- Keyboard navigation testing
- Privacy testing (no server requests without opt-in)

**Periodic (Quarterly)**:
- Constitution review (are principles still valid?)
- ADR review (are decisions still correct?)
- Spec-template alignment (do templates enforce constitution?)

### Tooling Integration

**CodeRabbit** (`.coderabbit.yaml`):
- Enforces immutable principles (auto-blocks violations)
- Flags evolvable guidance violations (requests changes)
- Path-based rules (components, storage, validation)

**CI/CD** (`.github/workflows/`):
- Test coverage gates (business logic 80%, overall 40%)
- Bundle size limits (<500KB initial)
- Accessibility tests (axe-core)

**Linear MCP**:
- Deferred bot suggestions (MEDIUM/LOW severity)
- Link issues to parent features
- Track phase transitions

---

## Sync Impact Report

<!-- Auto-generated on 2025-11-02 constitution update -->

**Version Change**: v2.1.0 → v3.0.0 (MAJOR)

**Modified Principles**:
- Principle VI: Quality-First Development (Phase 1: manual → TDD for business logic)

**Added Principles**:
- Principle IX: Specification-Driven Development (SDD)

**Added Sections**:
- Quality Gates (multi-layer enforcement)
- Comprehensive MVP Scope (12 features)
- Version History (semantic versioning log)

**Templates Requiring Updates**:
- ✅ UPDATED: `templates/plan-template.md` (TDD checklist, constitutional validation)
- ✅ UPDATED: `templates/tasks-template.md` (test task types, business logic separation)
- ✅ UPDATED: `templates/spec-template.md` (SDD workflow, Spec-Kit tiers)
- ✅ UPDATED: `.coderabbit.yaml` (TDD enforcement, business logic coverage)
- ✅ UPDATED: `.github/workflows/test.yml` (coverage gates, business logic threshold)
- ⚠ PENDING: `CLAUDE.md` (update Phase 1 DoD, TDD requirements)

**Follow-Up TODOs**:
- [ ] Create ADR-004: Phase 1 TDD Adoption (business logic only)
- [ ] Update Linear templates (add TDD task types)
- [ ] Document business logic vs UI separation (what counts as "business logic"?)
- [ ] Train Manus on Spec-Kit tier classification (when to use Tier 1 vs Tier 2)
```

---

## 9. Key Recommendations for PayPlan v3.0

### 1. Adopt Hybrid TDD (Business Logic Only)

**Change**: Phase 1 manual testing → TDD for business logic, manual for UI

**Rationale**:
- Business logic is HIGH RISK (wrong calculations hurt users)
- Business logic is EASY TO TEST (pure functions, deterministic)
- UI is LOW RISK (visual bugs obvious)
- UI is HARD TO TEST (async rendering, interactions)

**Implementation**:
- `lib/**/*.ts` → 80% coverage minimum (enforced by CI/CD)
- `components/**/*.tsx` → 0% coverage acceptable (manual testing)
- Overall → 40% coverage minimum (weighted average)

### 2. Mandate Spec-Kit for Tier 1+ Features

**Change**: Spec-Kit optional → Spec-Kit required for medium+ complexity

**Rationale**:
- Specifications are source of truth, code is disposable
- Constitutional compliance enforced at spec phase (prevents rework)
- Spec-first prevents architectural drift
- Manus → Claude Code handoff clarity

**Implementation**:
- Tier 0 (simple): GitHub issues only
- Tier 1 (medium): `spec.md` + `plan.md` required
- Tier 2 (complex): Full Spec-Kit (6 files)

### 3. Multi-Layer Quality Gates

**Change**: Bot reviews only → Pre-commit + CI/CD + Bot + Human

**Rationale**:
- Catch issues early (pre-commit catches 80%, lowest fix cost)
- Automate enforcement (no human bypass for critical violations)
- Phase-based activation (gates turn on/off based on maturity)

**Implementation**:
- Layer 1: Pre-commit hooks (lint, typecheck, tests, a11y)
- Layer 2: CI/CD gates (coverage, bundle size, accessibility)
- Layer 3: Bot reviews (constitutional compliance)
- Layer 4: Human review (manual a11y, privacy)

### 4. Expand MVP Scope (8 → 12 Features)

**Change**: 8 Tier 0 features → 12 features (8 Tier 0 + 4 Tier 1)

**Rationale**:
- 8 features insufficient for market competitiveness (missing analytics, reports, preferences)
- 12 features = table-stakes parity (matches YNAB, Monarch, Simplifi, PocketGuard)
- Tier 1 features ship fast (spec + plan only, no full Spec-Kit overhead)

**Implementation**:
- Tier 0 (Weeks 1-8): Categories, Budgets, Dashboard, Goals, Cash Flow, Search, Reconciliation, Transactions
- Tier 1 (Weeks 9-12): Recurring Bills, Analytics, Reports, Preferences

### 5. Semantic Versioning for Constitution

**Change**: Ad-hoc versioning → Semantic versioning (MAJOR.MINOR.PATCH)

**Rationale**:
- MAJOR communicates backward incompatibility (stakeholder consensus required)
- MINOR tracks principle additions (team awareness)
- PATCH clarifies without ceremony (immediate updates)

**Implementation**:
- MAJOR: TDD mandate, removing principles, breaking changes
- MINOR: New principles, expanded guidance
- PATCH: Typo fixes, clarifications, non-semantic updates

### 6. Immutable vs. Evolvable Separation

**Change**: All principles treated equally → Immutable (5-8) + Evolvable (context-based)

**Rationale**:
- Immutable principles define identity (Privacy, Accessibility, Free Core, Ethical Gamification, SDD)
- Evolvable guidance adapts to context (quality standards scale with phase)
- Separation enables evolution without compromising core values

**Implementation**:
- **IMMUTABLE**: Principles I, II, III, VIII, IX (never change without MAJOR version)
- **EVOLVABLE**: Principles IV, V, VI, VII (adjust based on phase, user count, context)

---

## 10. Constitution Writing Best Practices

### Language Patterns

**Immutable Principles:**
- Use **MUST/MUST NOT** (not "should", "prefer", "recommend")
- Use **declarative statements** (clear, testable, enforceable)
- Use **explicit prohibitions** (❌ bullet lists of violations)

**Evolvable Guidance:**
- Use **phase-based context** (Phase 1: X, Phase 2: Y)
- Use **measurable targets** (80% coverage, <500ms render)
- Use **clear transition criteria** (when user count reaches X AND bug rate <Y)

### Structure Patterns

**Each Principle Section Includes:**
1. **Name** (concise, memorable)
2. **Principle** (1-sentence declarative statement)
3. **Market Context** (why this matters, competitive rationale)
4. **Requirements** (MUST/MUST NOT bullets)
5. **Enforcement** (how it's checked, tools used)
6. **Prohibited** (explicit violations)
7. **Rationale** (why over alternatives)

**Each Governance Section Includes:**
1. **Amendment Procedure** (how to change, approval process)
2. **Compliance Review** (how often, who checks, what triggers)
3. **Tooling Integration** (CodeRabbit, CI/CD, Linear)
4. **Sync Impact Report** (template updates, dependencies)

### Formatting Patterns

**Use Markdown Effectively:**
- `**MUST**` for emphasis (bold)
- `- ✅ ALLOWED:` for permitted actions
- `- ❌ PROHIBITED:` for violations
- `**Phase 1 (0-100 users)**:` for context
- `> Quote` for external sources/rationale

**Use Visual Hierarchy:**
- `#` for top-level sections (Principles, Governance)
- `##` for individual principles (I, II, III)
- `###` for subsections (Requirements, Enforcement)
- `####` for phase breakdowns (Phase 1, Phase 2)

**Use Examples Liberally:**
- Code blocks for configurations
- File tree diagrams for structure
- Decision matrices for trade-offs

---

## 11. Anti-Patterns to Avoid

### ❌ Vague Language

**BAD**: "Code should be tested"
**GOOD**: "Business logic MUST have 80% test coverage (enforced by CI/CD)"

**BAD**: "Prefer accessibility"
**GOOD**: "All features MUST meet WCAG 2.2 Level AA (screen reader + keyboard nav required)"

### ❌ Unenforceable Principles

**BAD**: "Write clean code"
**GOOD**: "Functions should be <50 lines (aim for this, but readability > metrics)"

**BAD**: "Be security-conscious"
**GOOD**: "PII MUST be sanitized before export (regex patterns + word boundaries)"

### ❌ Principle Overload

**BAD**: 20 principles (too many to remember/enforce)
**GOOD**: 5-8 immutable principles + phase-based evolvable guidance

### ❌ No Versioning

**BAD**: Updating constitution without version tracking
**GOOD**: Semantic versioning (MAJOR.MINOR.PATCH) + amendment log

### ❌ No Tooling Integration

**BAD**: Constitution as documentation only (no enforcement)
**GOOD**: CodeRabbit blocks violations, CI/CD gates enforce coverage, pre-commit hooks catch early

### ❌ Treating All Principles Equally

**BAD**: Privacy = Code Style (same enforcement severity)
**GOOD**: Immutable (auto-block) vs Evolvable (phase-based) vs Guidelines (optional)

---

## 12. Implementation Checklist for v3.0

### Constitution File Updates

- [ ] Add Principle IX: Specification-Driven Development (SDD)
- [ ] Update Principle VI: Phase 1 → TDD for business logic (40% coverage)
- [ ] Add Version History section (track MAJOR/MINOR/PATCH changes)
- [ ] Add Sync Impact Report (template updates, dependencies)
- [ ] Separate Immutable (I, II, III, VIII, IX) vs Evolvable (IV, V, VI, VII)
- [ ] Add Quality Gates section (multi-layer enforcement)
- [ ] Expand MVP scope (8 → 12 features)
- [ ] Add Governance section (amendment procedure, compliance review)

### Template Updates

- [ ] Update `templates/plan-template.md` (TDD checklist, business logic section)
- [ ] Update `templates/tasks-template.md` (test task types, coverage targets)
- [ ] Update `templates/spec-template.md` (SDD workflow, Spec-Kit tiers)
- [ ] Update `templates/checklist-template.md` (TDD validation, coverage gates)

### Tooling Updates

- [ ] Update `.coderabbit.yaml` (TDD enforcement, business logic coverage rules)
- [ ] Update `.github/workflows/test.yml` (coverage gates, business logic threshold)
- [ ] Create `.husky/pre-commit` (lint, typecheck, business logic tests, a11y)
- [ ] Update `package.json` scripts (`test:business-logic`, `test:coverage:business-logic`)

### Documentation Updates

- [ ] Update `CLAUDE.md` (Phase 1 DoD, TDD requirements, Spec-Kit tiers)
- [ ] Create `docs/architecture/decisions/004-phase1-tdd-adoption.md` (ADR for TDD mandate)
- [ ] Update `README.md` (new MVP scope, 12 features)

### Process Updates

- [ ] Train Manus on Spec-Kit tier classification (Tier 0 vs 1 vs 2)
- [ ] Define business logic vs UI separation (what counts as "business logic"?)
- [ ] Update Linear templates (add TDD task types)
- [ ] Create constitution amendment PR template (MAJOR/MINOR/PATCH guidelines)

---

## Conclusion

This research provides comprehensive patterns for PayPlan Constitution v3.0:

**Core Findings:**
1. **Constitutions ARE architecture** (immutable infrastructure pattern)
2. **Spec-Kit official template** provides proven structure (versioning, governance, sync)
3. **TDD can be constitutional mandate** (not just guideline)
4. **Multi-layer quality gates** (pre-commit → CI/CD → bot → human)
5. **Phase-based evolution** (immutable principles + evolvable guidance)
6. **Automated enforcement** (CodeRabbit blocks violations, CI/CD gates)

**Recommended Pattern:**
- **5-8 Immutable Principles** (Privacy, Accessibility, Free Core, Ethical Gamification, SDD)
- **Phase-Based Evolvable Guidance** (quality scales with maturity)
- **Semantic Versioning** (MAJOR/MINOR/PATCH with amendment log)
- **Multi-Layer Enforcement** (pre-commit, CI/CD, bot, human)
- **Spec-Kit Integration** (specifications enforce constitution)

**Next Steps:**
1. Draft Constitution v3.0 using this research
2. Create ADR-004 for Phase 1 TDD adoption
3. Update templates and tooling (CodeRabbit, CI/CD, pre-commit)
4. Get HIL approval for MAJOR version bump
5. Propagate changes to all dependent artifacts

---

**Research Completed**: 2025-11-02
**Research Duration**: ~2 hours (web search, content extraction, synthesis)
**Sources**: 20+ articles, official Spec-Kit template, ADR repos, evolutionary architecture patterns
**Confidence**: HIGH (patterns validated across multiple expert sources)
