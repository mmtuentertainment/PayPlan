# Contract: PR Template

**Feature**: 004-pr-hygiene-openapi-lint
**File**: `.github/PULL_REQUEST_TEMPLATE.md`
**Purpose**: Standardize PR descriptions for improved review quality

---

## Template Structure

### Required Sections (8 total)

1. **Title**
   - Format: `# Title` heading followed by `<PR Title>` placeholder
   - Purpose: Clear, concise description of change

2. **Summary**
   - Format: `## Summary` heading followed by 2-4 line description placeholder
   - Must include: Link to relevant specs/deltas
   - Example: `See: [ops/deltas/0015_pr_hygiene_openapi.md](../ops/deltas/0015_pr_hygiene_openapi.md)`

3. **Risk**
   - Format: `## Risk` heading with 4 checkbox options
   - Options: None (docs/tooling only), Low, Medium, High
   - Mutually exclusive checkboxes

4. **Rollback**
   - Format: `## Rollback` heading with revert instructions
   - Default text: "Single revert of this commit. No data migrations."
   - Placeholder for complex rollback scenarios

5. **Verification**
   - Format: `## Verification` heading with bash code block
   - Must include: `npm run spec:path` command
   - Must include: Comment about CI lint execution
   - Purpose: Enable reviewer self-service testing

6. **LOC Budget**
   - Format: `## LOC Budget` heading with markdown table
   - Columns: Component, + (additions), - (deletions)
   - Row for "Files changed" and "Total LOC"

7. **Security** (conditional - if endpoints changed)
   - Format: `## Security (if endpoints changed)` heading with 6 checkboxes
   - Items:
     1. Idempotency-Key on writes
     2. RFC9457 Problem Details
     3. RBAC + audit on denials
     4. 429 with Retry-After
     5. Tenant RLS via BFF
     6. OpenAPI is source of truth (updated)

8. **Notes**
   - Format: `## Notes` heading with placeholder
   - Purpose: Additional context for reviewers

---

## Template Content

```markdown
# Title
<PR Title>

## Summary
<What & why in 2–4 lines. Link relevant specs/deltas.>

## Risk
- [ ] None (docs/tooling only)
- [ ] Low
- [ ] Medium
- [ ] High

## Rollback
Single revert of this commit. No data migrations.

## Verification
```bash
npm run spec:path   # prints OpenAPI spec path or "No OpenAPI spec found; skipping"
# CI will lint OpenAPI if present and post results to the Summary (non-blocking).
```

## LOC Budget

| Component     |  + |  - |
| ------------- | -: | -: |
| Files changed |    |    |
| Total LOC     |    |    |

## Security (if endpoints changed)

* [ ] Idempotency-Key on writes
* [ ] RFC9457 Problem Details
* [ ] RBAC + audit on denials
* [ ] 429 with Retry-After
* [ ] Tenant RLS via BFF
* [ ] OpenAPI is source of truth (updated)

## Notes

<Anything reviewers should watch for.>
```

---

## Validation Rules

1. **File Location**: Must be at `.github/PULL_REQUEST_TEMPLATE.md` (exact path)
2. **Heading Levels**: All main sections use `##` (level 2 headings), Title uses `#` (level 1)
3. **Checkbox Format**: Use `- [ ]` for unchecked, `- [x]` for checked (GitHub markdown)
4. **Code Blocks**: Use triple backticks with `bash` language hint
5. **Table Format**: Use pipe-delimited markdown tables with right-aligned numeric columns
6. **Placeholders**: Use `<angle brackets>` for user-fillable content
7. **Security Section**: Conditional header "(if endpoints changed)" - authors skip if not applicable

---

## Usage

1. **Automatic Loading**: GitHub automatically loads this template when user clicks "New Pull Request"
2. **User Edits**: PR author replaces placeholders with actual content
3. **Reviewer Checks**: Reviewers verify sections are completed (manual process)
4. **No Enforcement**: Template is guidance only; GitHub doesn't enforce completion

---

## LOC Budget

**File**: `.github/PULL_REQUEST_TEMPLATE.md`
**Estimated LOC**: ~35 lines

---

## Acceptance Criteria

- [ ] File exists at `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] All 8 sections present
- [ ] Security checklist has 6 items
- [ ] Verification section includes `npm run spec:path`
- [ ] LOC budget table has correct column alignment
- [ ] No typos or formatting errors
- [ ] Template renders correctly on PR creation

---

**Status**: ✅ Contract defined | **Next**: ci-workflow.md
