# Linear Issue Integration Strategy
**Created**: 2025-10-23
**Purpose**: Automate Linear issue tracking into spec-kit workflow

## Problem Statement

After code reviews (CodeRabbit, manual review), we have Linear issues (MMT-21 to MMT-32+) that need to be:
1. **Not forgotten** - Systematically tracked
2. **Contextually placed** - Added to relevant feature specs
3. **Automatically surfaced** - When planning new features
4. **Properly prioritized** - Critical issues addressed first

## Solution: Multi-Layer Automation

### Layer 1: Automated Linear Query in /speckit.specify
**When**: Every time `/speckit.specify` runs for a new feature
**What**: Query Linear for open issues related to files that feature will touch
**How**: Add to spec-template.md

```markdown
## Related Technical Debt *(auto-generated from Linear)*

<!-- AUTO-GENERATED: Do not edit manually -->
<!-- Query: Linear issues touching files in this feature's scope -->

### Critical Issues (P0-P1)
{{#each linear_critical_issues}}
- **{{identifier}}**: {{title}}
  - File: {{file}}
  - Priority: {{priority}}
  - Link: {{url}}
{{/each}}

### Improvements (P2-P3)
{{#each linear_improvement_issues}}
- **{{identifier}}**: {{title}}
{{/each}}
```

### Layer 2: Pre-Planning Hook Script
**File**: `.specify/scripts/bash/pre-planning-hook.sh`
**When**: Before running `/speckit.plan`
**What**: Fetches Linear issues and displays them

```bash
#!/bin/bash
# Pre-planning hook: Surface relevant Linear issues

FEATURE_PATH="$1"

echo "🔍 Checking Linear for related technical debt..."

# Use Linear API to find issues
# Filter by: files touched, priority, status=open
LINEAR_ISSUES=$(linear issue list \
  --filter "status:open AND priority:urgent,high" \
  --json | jq '.[] | select(.description | contains("'"$FEATURE_PATH"'"))')

if [ -n "$LINEAR_ISSUES" ]; then
  echo ""
  echo "⚠️  Found related Linear issues:"
  echo "$LINEAR_ISSUES" | jq -r '.identifier + ": " + .title'
  echo ""
  echo "💡 Consider adding these to your feature spec!"
fi
```

### Layer 3: CodeRabbit Auto-Create Linear Issues
**File**: `.github/workflows/coderabbit-to-linear.yml`
**When**: After every CodeRabbit review
**What**: Automatically creates Linear issues for findings

```yaml
name: CodeRabbit to Linear Integration

on:
  pull_request_review:
    types: [submitted]

jobs:
  create-linear-issues:
    if: github.event.review.user.login == 'coderabbitai'
    runs-on: ubuntu-latest
    steps:
      - name: Parse CodeRabbit Comments
        id: parse
        run: |
          # Extract P0-P1 findings from review
          # Format as Linear issue descriptions

      - name: Create Linear Issues
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
        run: |
          # Create issues via Linear API
          # Tag with: coderabbit, auto-generated, feature-XXX
```

### Layer 4: File-Based Issue Tracking
**File**: `.specify/issues/{feature-number}-issues.md`
**Purpose**: Track issues per feature in version control

```markdown
# Feature 017 - Outstanding Issues

## From CodeRabbit Review (2025-10-23)

### Current Feature Issues
- [ ] MobileMenu.tsx:191 - Remove redundant backgroundColor (P3)

### Related Issues from Other Features
- [ ] MMT-21: ResultsThisWeek.tsx console.error (P0) - Related to User Story 2
- [ ] MMT-22: plan.ts error messages (P0) - Blocks if we add API integration

## Integration Points
When implementing User Story 2 (Create Archive from Results):
- Must address MMT-21 (console.error in ResultsThisWeek.tsx)
- This file will be modified, perfect time to fix
```

### Layer 5: Weekly Linear Review Ritual
**File**: `.specify/workflows/weekly-linear-review.md`
**Cadence**: Every Monday morning

```markdown
# Weekly Linear Review Checklist

## 1. Query Critical Issues (5 min)
```bash
linear issue list --filter "priority:urgent AND status:open" --json
```

## 2. Map to Upcoming Features (10 min)
- Check which features are planned
- Add related Linear issues to those specs
- Update planning docs

## 3. Create Tech Debt Feature if Needed (15 min)
If >10 orphaned issues:
- Create "Feature XXX: Technical Debt Cleanup Sprint"
- Bundle related issues
- Estimate effort
- Schedule

## Total Time: 30 minutes/week
```

### Layer 6: CI Gate for Critical Issues
**File**: `.github/workflows/linear-gate.yml`
**When**: Before merging to main
**What**: Fails if touching files with open P0 Linear issues

```yaml
name: Linear Critical Issue Gate

on:
  pull_request:
    branches: [main]

jobs:
  check-critical-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Get Changed Files
        id: files
        run: |
          FILES=$(gh pr view ${{ github.event.pull_request.number }} --json files -q '.files[].path')

      - name: Check Linear for Critical Issues
        run: |
          # For each changed file
          # Query Linear: file mentions + priority urgent
          # If found: Post comment, fail check

      - name: Post Results
        run: |
          echo "⚠️ Files with open P0 issues:"
          echo "- ResultsThisWeek.tsx (MMT-21)"
          echo "Fix these issues or update Linear status to proceed"
```

---

## Recommended Implementation Plan

### Phase 1: Immediate (This Week)
1. ✅ Keep Feature 017 spec updated with its issues
2. ✅ Leave past feature specs unchanged
3. ✅ Track all issues in Linear (done - MMT-21 to MMT-32)

### Phase 2: Short Term (Next Feature)
4. Create `.specify/issues/017-navigation-system-issues.md`
5. Add pre-planning script that queries Linear
6. Test workflow with Feature 017 User Story 2

### Phase 3: Medium Term (Next Month)
7. Create "Feature 018: Technical Debt - CodeRabbit Findings"
8. Bundle all past-feature issues (MMT-21, MMT-22, etc.)
9. Run full spec-kit workflow for systematic cleanup

### Phase 4: Long Term (Q1 2026)
10. Implement GitHub Actions integration
11. Add CI gate for critical issues
12. Automate CodeRabbit → Linear creation

---

## Best Path for YOU Right Now

**Recommendation**: **Phase 2 + Phase 3 Hybrid**

1. **Create Feature 018: Technical Debt Cleanup** NOW
   - Bundle MMT-21 through MMT-32 (all past-feature issues)
   - Run `/speckit.specify` to create proper spec
   - Include P0 issues as User Story 1 (Critical Security)
   - Include P1 issues as User Story 2 (Type Safety)
   - Include P2-P3 as User Story 3+ (Enhancements)

2. **Keep Feature 017 Clean**
   - Only has 1 issue (MobileMenu backgroundColor)
   - Fix it when completing User Stories 2 & 3

3. **Linear Issues = Backlog**
   - MMT-21 to MMT-32 become Feature 018's requirements
   - Nothing gets forgotten
   - Systematic approach

**Want me to create Feature 018 spec now with `/speckit.specify` to properly organize all the CodeRabbit findings?**
