# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for PayPlan. ADRs document significant architectural decisions made during development, including context, rationale, and consequences.

## What is an ADR?

An Architecture Decision Record captures:
- **Context**: What situation led to the decision?
- **Decision**: What did we decide to do?
- **Rationale**: Why did we make this decision?
- **Consequences**: What are the positive, negative, and neutral outcomes?

ADRs are **immutable** - once accepted, they document historical decisions. If a decision changes, create a new ADR that supersedes the old one.

## When to Create an ADR

Create an ADR for:
- ✅ **Major refactors** (e.g., type system changes, validation strategy changes)
- ✅ **Architectural patterns** (e.g., interface-first vs schema-first)
- ✅ **Technology choices** (e.g., library selection, framework decisions)
- ✅ **Cross-cutting concerns** (e.g., error handling, date arithmetic)
- ✅ **Breaking changes** (e.g., API changes, storage format changes)

Do NOT create ADRs for:
- ❌ **Minor bug fixes** (use commit messages)
- ❌ **Feature implementations** (use specs/ directory)
- ❌ **Code style** (use linter rules)
- ❌ **Trivial changes** (use code comments)

## ADR Numbering

ADRs are numbered sequentially:
- `001-interface-first-type-strategy.md`
- `002-canonical-zod-schema-locations.md`
- `003-date-arithmetic-setmonth-boundary-handling.md`

## ADR Status

Each ADR has a status:
- **Proposed**: Under discussion, not yet decided
- **Accepted**: Decision made and implemented
- **Deprecated**: No longer recommended (superseded by newer ADR)
- **Rejected**: Proposal rejected (document why for future reference)

## ADR Template

```markdown
# ADR XXX: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: [Proposed | Accepted | Deprecated | Rejected]
**Context**: [Related features/issues]
**Severity**: [CRITICAL | MAJOR | HIGH | MEDIUM | LOW]
**Related PR**: #XXX
**Related Commits**: [commit hashes]

---

## Context

[Describe the situation that led to this decision]

---

## Decision

[State the decision clearly and concisely]

---

## Rationale

[Explain why this decision was made, including alternatives considered]

---

## Implementation

[Describe how the decision was implemented]

---

## Consequences

### Positive
- ✅ [Good outcomes]

### Negative
- ⚠️ [Trade-offs or downsides]

### Neutral
- 🔄 [Neither good nor bad, just different]

---

## Future Considerations

[What might change in the future?]

---

## References

[Links to relevant documentation, discussions, or resources]

---

## Approval

**Decided by**: [Who made the decision]
**Reviewed by**: [Who reviewed it]
**Pending approval**: [Who needs to approve]

---

## Changelog

- YYYY-MM-DD: Initial ADR created
```

## Current ADRs

| # | Title | Status | Date | Severity |
|---|-------|--------|------|----------|
| [001](./001-interface-first-type-strategy.md) | Interface-First Type Strategy | Accepted | 2025-10-30 | MAJOR |
| [002](./002-canonical-zod-schema-locations.md) | Canonical Zod Schema Locations | Accepted | 2025-10-30 | MAJOR |
| [003](./003-date-arithmetic-setmonth-boundary-handling.md) | Date Arithmetic - setMonth() Boundary Handling | Accepted | 2025-10-30 | HIGH |

## How to Use ADRs

### For Developers

**Before making a major architectural change:**
1. Check if an ADR already exists for this topic
2. If yes, follow the existing decision (or create new ADR to supersede)
3. If no, create a new ADR proposing the change
4. Get review from team (CodeRabbit, HIL)
5. Update status to "Accepted" once implemented

**When reading ADRs:**
- ADRs explain **why** we made decisions (code shows **what**)
- ADRs prevent re-litigating old decisions
- ADRs help onboard new team members

### For Code Reviewers (Bots + HIL)

**Check for ADR compliance:**
- Does the PR follow architectural decisions in ADRs?
- If PR changes architecture, is there a corresponding ADR?
- If ADR exists but PR violates it, request changes OR new ADR to supersede

### For Project Managers (Manus)

**Use ADRs to:**
- Understand technical constraints when planning features
- Document rationale for future reference
- Ensure architectural consistency across features

## Related Documentation

- **Specs** (`specs/`): Feature specifications (what to build)
- **ADRs** (`docs/architecture/decisions/`): Architectural decisions (how to build)
- **Constitution** (`memory/constitution.md`): Project principles (why we build this way)
- **CLAUDE.md**: Development workflow and standards

## References

- [ADR GitHub org](https://adr.github.io/) - Community standards for ADRs
- [Michael Nygard's ADR post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR concept
- [ADR Tools](https://github.com/npryce/adr-tools) - Command-line tools for managing ADRs

---

**Last Updated**: 2025-10-30
**Next ADR Number**: 004
