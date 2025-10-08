# Linear MCP Integration

## Overview

This document describes how to integrate Linear's hosted MCP (Model Context Protocol) server with Claude Code to manage issues, track development work, and sync status across our workflow.

**Why MCP (hosted)?**
- Native integration with Claude—no local server to run
- Direct access to Linear tools: create/update/search issues, add comments, list teams/projects/cycles
- Seamless workflow: use Linear during `/spec → /plan → /tasks → /implement` cycles
- No infrastructure overhead: Linear hosts the MCP server centrally

## Setup

### 1. Get Your Linear API Key

1. Go to [Linear Settings → API](https://linear.app/settings/api)
2. Create a new **Personal API Key** (not OAuth token)
3. Copy the key (starts with `lin_api_...`)
4. **Important**: Treat this as a secret—never commit it to the repository

### 2. Configure Environment Variable

Add your API key to your shell environment:

```bash
# Add to ~/.bashrc, ~/.zshrc, or equivalent
export LINEAR_API_KEY="lin_api_..."
```

Or use your OS keychain/secrets manager.

### 3. Add MCP Server to Claude Desktop

Open your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the Linear MCP server:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@linear/mcp-server"],
      "env": {
        "LINEAR_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative**: If you've exported `LINEAR_API_KEY` in your environment, you can reference it:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@linear/mcp-server"],
      "env": {
        "LINEAR_API_KEY": "${LINEAR_API_KEY}"
      }
    }
  }
}
```

Restart Claude Desktop for changes to take effect.

## MCP Capabilities

Once configured, Claude Code can invoke these Linear operations:

### Core Operations
- **create_issue**: Create new issues with title, description, team, labels, priority
- **update_issue**: Modify issue status, assignee, priority, labels
- **search_issues**: Find issues by team, status, assignee, labels, text
- **add_comment**: Post comments with updates, links, or context
- **get_issue**: Fetch full details for a specific issue

### Discovery Operations
- **list_teams**: Show available teams and their identifiers
- **list_projects**: View active projects
- **list_cycles**: See current and upcoming cycles

### Example Tool Invocations

```
# Create an issue
create_issue(
  teamId: "PAY",
  title: "0021: Implement Linear MCP Integration",
  description: "Add MCP docs, PR template section, and CI guard",
  labels: ["slice", "delta-0021"],
  priority: 2
)

# Search for issues
search_issues(
  teamId: "PAY",
  status: "In Progress",
  labels: ["slice"]
)

# Update issue status
update_issue(
  issueId: "PAY-123",
  status: "In Review"
)

# Add a comment
add_comment(
  issueId: "PAY-123",
  body: "PR opened: https://github.com/org/repo/pull/456\nLOC: +250/-30\nTests: 12 passing"
)
```

## Usage Pattern

During each development slice:

1. **Start of work** (on feature branch):
   - Use Linear MCP to create an issue for the current delta/feature
   - Include spec summary and acceptance criteria
   - Apply labels: `slice`, `delta-{id}`

2. **Open PR**:
   - Search for the issue by key (e.g., `PAY-123`)
   - Update status to "In Review"
   - Add comment with PR link, LOC stats, test results

3. **After merge**:
   - Update status to "Done"
   - Add comment linking to delta doc
   - Assign to current cycle if applicable

See [prompts/linear-mcp-actions.md](../../prompts/linear-mcp-actions.md) for copy-paste prompt snippets.

## Security Notes

- **Never commit** `LINEAR_API_KEY` to the repository
- Store keys in environment variables or OS keychain only
- Rotate keys regularly via [Linear Settings → API](https://linear.app/settings/api)
- Revoke compromised keys immediately
- Use **Personal API Keys** (not OAuth) for MCP integration
- Each team member should use their own API key

## Constitution Alignment

This integration follows our repository constitution:

- ✅ **No secrets in repo/CI**: API keys live only in Claude client environment
- ✅ **Non-blocking guardrails**: PR guard warns but doesn't fail builds
- ✅ **Reversible changes**: All changes are documentation/process—no runtime dependencies
- ✅ **Minimal file changes**: ≤6 files modified (docs, templates, CI, prompts)
- ✅ **OpenAPI is SoT**: No API changes; process-only integration

## References

- [Linear MCP Server](https://github.com/linear/linear/tree/master/packages/mcp-server) - Official MCP implementation
- [Linear API Documentation](https://developers.linear.app/docs/graphql/working-with-the-graphql-api) - GraphQL API reference
- [Linear Authentication](https://developers.linear.app/docs/graphql/working-with-the-graphql-api#authentication) - API key setup
- [Linear SDK](https://github.com/linear/linear/tree/master/packages/sdk) - Optional TypeScript SDK
- [Linear Webhooks](https://developers.linear.app/docs/graphql/webhooks) - Event subscriptions (future)

## How to Use Right Now

1. **Set LINEAR_API_KEY** in your OS environment:
   ```bash
   export LINEAR_API_KEY="lin_api_your_key_here"
   ```

2. **Add "linear" MCP server** in Claude Desktop settings:
   - Edit `claude_desktop_config.json`
   - Add Linear MCP server entry (see Setup section above)
   - Restart Claude Desktop

3. **In a feature branch**, run the "Create Linear issue for this delta" prompt:
   - Open [prompts/linear-mcp-actions.md](../../prompts/linear-mcp-actions.md)
   - Copy the "Create issue" prompt
   - Fill in team key, delta ID, and title
   - Claude will create the issue and return the key (e.g., `PAY-123`)

4. **On PR open**, run the "Update Linear issue on PR open" prompt:
   - Claude will search for the issue by key
   - Updates status to "In Review"
   - Adds comment with PR link and stats

5. **On merge**, run the "Close Linear issue on merge" prompt:
   - Moves issue to "Done"
   - Adds comment with delta doc link
   - Assigns to current cycle

---

**Questions?** Check Linear's [MCP documentation](https://github.com/linear/linear/tree/master/packages/mcp-server) or open an issue in this repository.
