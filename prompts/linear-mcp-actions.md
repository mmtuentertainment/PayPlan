# Linear MCP Action Prompts

Copy-paste prompts for common Linear workflow actions during development. These assume you have Linear MCP configured in Claude Desktop (see [docs/integrations/linear-mcp.md](../docs/integrations/linear-mcp.md)).

---

## 1. Create Linear Issue for Current Delta/Slice

**When to use**: At the start of a new feature branch or delta implementation.

**Prompt**:

```
Use Linear MCP to create a new issue with these details:

Team Key: PAY
Title: 0021: Linear MCP Integration
Description:
  Summary:
  - Integrate Linear's hosted MCP server with Claude Code workflow
  - Enable issue creation/updates during spec → plan → tasks → implement cycles
  - Add PR template section, CI guard, and prompt library

  Acceptance Criteria:
  - [ ] Linear MCP documented in docs/integrations/linear-mcp.md
  - [ ] PR template includes Linear section with issue key field
  - [ ] CI workflow parses PR for Linear keys (non-blocking)
  - [ ] Prompt library created with create/update/close actions
  - [ ] No secrets committed to repo; API keys in client only

  Delta: ops/deltas/0021_linear_mcp_integration.md

Labels: slice, delta-0021
Priority: 2 (Medium)
Status: In Progress

After creating the issue, return the issue key (e.g., PAY-123).
```

**Variables to customize**:
- `Team Key`: Your Linear team identifier (e.g., `PAY`, `ENG`, `FEAT`)
- `Title`: Delta ID + short description
- `Description`: Paste from spec.md Summary + Acceptance Criteria
- `Labels`: Use `slice`, `delta-{id}`, or custom labels
- `Priority`: 1 (Urgent), 2 (High), 3 (Medium), 4 (Low)

**Expected output**: Claude creates the issue and returns: `Created issue PAY-456: 0021: Linear MCP Integration`

---

## 2. Update Linear Issue on PR Open

**When to use**: After opening a pull request for review.

**Prompt**:

```
Use Linear MCP to update the issue linked to this PR:

Issue Key: PAY-456  (from PR title)
Actions:
1. Update status to "In Review"
2. Add a comment with:
   - PR link: https://github.com/yourorg/PayPlan/pull/789
   - LOC changes: +250 / -30
   - Test results: 12 passing, 0 failing
   - Files changed: 5 (docs, template, workflow, prompts, delta)
3. If not already set, assign to current user
4. Add label "pr-open" if it exists in your Linear workspace

Comment template:
---
**PR Opened**: https://github.com/yourorg/PayPlan/pull/789

**Changes**:
- **LOC**: +250 / -30
- **Files**: 5 changed (docs/integrations/linear-mcp.md, .github/PULL_REQUEST_TEMPLATE.md, .github/workflows/pr-linear-guard.yml, ops/deltas/0021_linear_mcp_integration.md, prompts/linear-mcp-actions.md)
- **Tests**: 12 passing, 0 failing

**Status**: Ready for review
---
```

**Variables to customize**:
- `Issue Key`: Replace with actual key from PR title
- `PR link`: Replace with your GitHub PR URL
- `LOC changes`: Run `git diff --shortstat main...HEAD` to get stats
- `Test results`: From `npm test` or CI output
- `Files changed`: From `git diff --name-only main...HEAD | wc -l`

**Expected output**: Claude updates the issue and confirms: `Updated PAY-456: Status set to 'In Review', added PR comment`

---

## 3. Close Linear Issue on Merge

**When to use**: After PR is merged to main.

**Prompt**:

```
Use Linear MCP to close the issue for this merged PR:

Issue Key: PAY-456
Actions:
1. Update status to "Done"
2. Add a comment with:
   - Merge commit: abc123def
   - Delta doc: ops/deltas/0021_linear_mcp_integration.md
   - Deployed: Yes (if applicable)
3. If current cycle exists, assign to it
4. Add label "merged" if it exists in your Linear workspace

Comment template:
---
**Merged**: Commit abc123def

**Documentation**:
- Delta: ops/deltas/0021_linear_mcp_integration.md
- Feature docs: docs/integrations/linear-mcp.md

**Verification**: All acceptance criteria met ✅
---
```

**Variables to customize**:
- `Issue Key`: From PR title or Linear search
- `Merge commit`: SHA of merge commit (from `git log`)
- `Delta doc`: Path to delta documentation
- `Deployed`: Yes/No/Staging depending on deployment status

**Expected output**: Claude updates the issue and confirms: `Closed PAY-456: Status set to 'Done', added merge comment`

---

## 4. Search for Issues by Delta/Label

**When to use**: Find issues for a specific delta or work stream.

**Prompt**:

```
Use Linear MCP to search for issues:

Team: PAY
Filters:
- Labels: delta-0021
- Status: any (to see full history)

Show me:
- Issue key
- Title
- Status
- Created date
- Last updated date
```

**Expected output**: Claude returns a list of matching issues with details.

---

## 5. Add Comment to Existing Issue

**When to use**: Post updates during development (blocker found, scope change, etc.).

**Prompt**:

```
Use Linear MCP to add a comment to issue PAY-456:

Comment:
---
**Update**: Discovered edge case during implementation

**Issue**: PR guard regex doesn't match issue keys with 4-letter team codes (e.g., FEAT-123)

**Resolution**: Updated regex pattern in pr-linear-guard.yml to support 2-5 letter team keys

**Impact**: No change to acceptance criteria; minor refinement
---
```

**Variables to customize**:
- `Issue key`: Target issue
- `Comment`: Markdown-formatted update

**Expected output**: Claude adds the comment and confirms: `Added comment to PAY-456`

---

## 6. List Teams and Projects (Discovery)

**When to use**: First-time setup or finding the correct team key.

**Prompt**:

```
Use Linear MCP to list all teams and projects in this workspace.

Show me:
- Team keys (e.g., PAY, ENG, DESIGN)
- Team names
- Active projects in each team
```

**Expected output**: Claude returns a table of teams and projects.

---

## Tips

- **Issue Keys in PR Titles**: Use format `KEY-123: Description` for automatic detection by PR guard
- **Batch Updates**: You can combine actions (e.g., update status + add comment) in a single prompt
- **Error Handling**: If Linear MCP returns an error, check:
  - Is `LINEAR_API_KEY` set correctly?
  - Is Claude Desktop restarted after config changes?
  - Does your API key have the required scopes?
- **Bookmark These Prompts**: Save this file for quick access during each slice

---

## Quick Reference: Linear MCP Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `create_issue` | Create new issue | Team, title, description, labels |
| `update_issue` | Modify existing issue | Status, assignee, priority |
| `search_issues` | Find issues by filters | Team, labels, status, text |
| `add_comment` | Post update to issue | Issue key, markdown body |
| `get_issue` | Fetch full issue details | Issue key |
| `list_teams` | Show available teams | Workspace teams |
| `list_projects` | Show active projects | Team projects |
| `list_cycles` | Show current cycles | Team sprints |

---

**Questions?** See [docs/integrations/linear-mcp.md](../docs/integrations/linear-mcp.md) for setup and troubleshooting.
