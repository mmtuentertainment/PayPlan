# Delta 0021: Linear MCP Integration

**Status**: Implemented
**Date**: 2025-10-08
**Author**: Claude Code + Team
**Branch**: `linear-mcp-integration`

## Summary

Integrate Linear's hosted MCP (Model Context Protocol) server with our Claude Code + Spec-Kit workflow. Enables developers to create, update, and track Linear issues directly during `/spec → /plan → /tasks → /implement` cycles—without CI secrets or infrastructure overhead.

## Scope

### What Changed

1. **Documentation** ([docs/integrations/linear-mcp.md](../../docs/integrations/linear-mcp.md))
   - Setup guide: how to connect Claude Desktop to Linear's remote MCP server
   - MCP capabilities reference: create/update/search issues, add comments, list teams/projects
   - Security notes: API key handling, rotation, revocation
   - Quick start: 5-step guide to use Linear MCP right now

2. **PR Template** ([.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md))
   - Added "Linear" section with:
     - Required issue key field (e.g., `PAY-123`)
     - Checklist: issue exists, status updated, acceptance criteria mirrored
     - Link to Linear MCP action prompts

3. **CI Workflow** ([.github/workflows/pr-linear-guard.yml](../../.github/workflows/pr-linear-guard.yml))
   - Non-blocking PR guard: parses title/description for Linear issue keys (`KEY-123` format)
   - Posts GitHub Actions summary:
     - ✅ If found: displays key, instructs reviewer to verify via MCP
     - ⚠️ If not found: suggests creating issue via MCP and updating PR
   - `continue-on-error: true` — never fails builds

4. **Prompt Library** ([prompts/linear-mcp-actions.md](../../prompts/linear-mcp-actions.md))
   - Three copy-paste prompts for common workflows:
     - Create issue from current delta/slice
     - Update issue on PR open (add PR link, LOC stats, test results)
     - Close issue on merge (move to Done, link delta doc)

5. **SDK Reference** ([scripts/linear/README.md](../../scripts/linear/README.md))
   - Optional guide for future automation using `@linear/sdk`
   - GraphQL query/mutation examples for debugging
   - Reminder: CI does not hold secrets; dev-only usage

### What Didn't Change

- **No runtime dependencies**: Zero impact on API, backend, or frontend code
- **No CI secrets**: API keys remain in Claude client environment only
- **No webhooks**: Deferred to future iteration (optional: sync Linear → GitHub)
- **OpenAPI SoT**: No API contract changes; process/documentation only

## Verification

### Manual Testing

1. **Set up Linear MCP**:
   ```bash
   export LINEAR_API_KEY="lin_api_..."
   # Edit Claude Desktop config: add Linear MCP server
   # Restart Claude Desktop
   ```

2. **Create a feature branch without issue key**:
   ```bash
   git checkout -b test/linear-integration
   git commit --allow-empty -m "test: Linear integration"
   gh pr create --draft --title "Test Linear Integration" --body "Testing PR guard"
   ```

3. **Verify PR guard warning**:
   - Check GitHub Actions summary for: ⚠️ No Linear issue key found
   - Confirm workflow status is green (continue-on-error: true)

4. **Create Linear issue via Claude MCP**:
   - Use "Create Linear issue for this delta" prompt from `prompts/linear-mcp-actions.md`
   - Claude creates issue and returns key (e.g., `PAY-456`)

5. **Update PR title with issue key**:
   ```bash
   gh pr edit --title "PAY-456: Test Linear Integration"
   ```

6. **Re-run PR guard**:
   - Trigger via push or manual re-run
   - Check summary for: ✅ Linear issue detected: `PAY-456`

### Expected Results

- [x] Linear MCP tools available in Claude Code after setup
- [x] PR guard detects issue keys in title/description
- [x] PR guard posts helpful summary (never blocks build)
- [x] Prompts successfully create/update/close Linear issues
- [x] No secrets committed to repository
- [x] No CI failures from missing API keys

## Rollback

**Single revert**:
```bash
git revert <commit-sha>
```

**No data migrations**: All changes are documentation/process. Reverting this commit removes:
- Linear MCP docs
- PR template section
- CI workflow
- Prompt library
- SDK reference

**No cleanup required**: API keys remain in developer environments; no server state to undo.

## Constitution Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| ≤8 files per slice | ✅ | 5 files changed (docs, template, workflow, prompts, delta) |
| Reversible changes | ✅ | Single revert; no migrations or external dependencies |
| OpenAPI is SoT | ✅ | No API changes; process/documentation only |
| No secrets in repo/CI | ✅ | API keys live in Claude client environment only |
| Non-blocking guardrails | ✅ | PR guard warns but never fails builds |
| Runtime impact | ✅ | Zero—no code execution or dependencies added |

## Security Notes

- **API Key Scope**: Use Linear **Personal API Keys** (not OAuth tokens) for MCP
- **Storage**: Keys live in:
  - Claude Desktop config (`claude_desktop_config.json`)
  - OS environment variables
  - **Never** committed to repository or GitHub secrets
- **Rotation**: Rotate keys via [Linear Settings → API](https://linear.app/settings/api)
- **Revocation**: Immediately revoke compromised keys in Linear Admin
- **Team Keys**: Each developer uses their own API key (tracks authorship in Linear)

## Future Enhancements

Deferred to later slices:

1. **Webhooks** (optional):
   - Linear → GitHub: post state transitions as PR comments
   - Requires webhook endpoint + HMAC signature verification

2. **CI Automation** (optional):
   - Auto-comment on PR with Linear issue details
   - Requires GitHub secret management + error handling

3. **Cycle Sync** (optional):
   - Auto-assign issues to current cycle on creation
   - Query Linear cycles API for active sprint

4. **Label Sync** (optional):
   - Mirror GitHub labels ↔ Linear labels
   - Bidirectional sync via webhooks

## References

- [Linear MCP Server Docs](https://github.com/linear/linear/tree/master/packages/mcp-server)
- [Linear API Documentation](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Configuration](https://docs.anthropic.com/claude/docs/model-context-protocol)

## Migration Notes

**For existing PRs**:
- No action required; Linear section is optional until enforced
- Developers can retroactively create Linear issues and update PR titles

**For new PRs**:
- Use Linear MCP prompts to create issues during initial work
- Include issue key in PR title or description (e.g., `PAY-123: Feature name`)
- PR guard will detect key and guide reviewer

**Team Adoption**:
1. Each developer sets up Linear MCP (one-time, ~5 minutes)
2. Bookmark `prompts/linear-mcp-actions.md` for quick access
3. Create issue at start of each slice (becomes routine)
4. PR guard provides gentle reminder if forgotten

---

**Questions?** See [docs/integrations/linear-mcp.md](../../docs/integrations/linear-mcp.md) or ask in team chat.
