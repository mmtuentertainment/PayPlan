# Linear SDK Scripts (Optional)

This directory contains documentation and optional scripts for interacting with Linear's GraphQL API using the `@linear/sdk` TypeScript SDK. These scripts are **dev-only** and are **not used in CI/CD**.

## When to Use

Use Linear SDK scripts for:
- **Debugging**: Test GraphQL queries locally before using MCP prompts
- **Bulk Operations**: Migrate or update many issues at once
- **Custom Automation**: Build local workflows not covered by MCP tools
- **API Exploration**: Learn Linear's data model and capabilities

**Do NOT use for**:
- Production automation (keep CI free of Linear secrets)
- Single issue operations (use Linear MCP in Claude instead)
- Tasks covered by MCP tools (create/update/search issues)

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev @linear/sdk dotenv
```

Or with pnpm:
```bash
pnpm add -D @linear/sdk dotenv
```

### 2. Configure Environment

Create a `.env.local` file in the repo root (git-ignored):

```bash
# .env.local
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_KEY=PAY
```

**Important**: Never commit `.env.local` or hardcode API keys. Ensure `.gitignore` includes:
```
.env.local
.env.*.local
```

### 3. Example Script

Save as `scripts/linear/get-issue.js`:

```javascript
#!/usr/bin/env node
import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
});

async function getIssue(issueKey) {
  try {
    const issue = await client.issue(issueKey);

    console.log(`Issue: ${issue.identifier}`);
    console.log(`Title: ${issue.title}`);
    console.log(`Status: ${issue.state?.name}`);
    console.log(`Priority: ${issue.priority}`);
    console.log(`URL: ${issue.url}`);
    console.log(`\nDescription:\n${issue.description}`);
  } catch (error) {
    console.error('Error fetching issue:', error.message);
  }
}

const issueKey = process.argv[2];
if (!issueKey) {
  console.error('Usage: node get-issue.js KEY-123');
  process.exit(1);
}

getIssue(issueKey);
```

Run:
```bash
node scripts/linear/get-issue.js PAY-123
```

## Common SDK Operations

### Create an Issue

```javascript
const teamKey = 'PAY';
const team = await client.team(teamKey);

const issue = await client.createIssue({
  teamId: team.id,
  title: '0021: Linear MCP Integration',
  description: 'Integrate Linear MCP with Claude Code workflow',
  priority: 2, // 1=Urgent, 2=High, 3=Medium, 4=Low
  labelIds: ['label-id-1', 'label-id-2'], // Get from listLabels query
});

console.log(`Created: ${issue.issue.identifier}`);
```

### Update Issue Status

```javascript
const issue = await client.issue('PAY-123');
const states = await issue.team.states();
const inReviewState = states.nodes.find(s => s.name === 'In Review');

await issue.update({
  stateId: inReviewState.id,
});

console.log('Status updated to In Review');
```

### Search Issues by Label

```javascript
const teamKey = 'PAY';
const team = await client.team(teamKey);

const issues = await client.issues({
  filter: {
    team: { key: { eq: teamKey } },
    labels: { name: { contains: 'delta-0021' } },
  },
});

issues.nodes.forEach(issue => {
  console.log(`${issue.identifier}: ${issue.title}`);
});
```

### Add Comment

```javascript
const issue = await client.issue('PAY-123');

await client.createComment({
  issueId: issue.id,
  body: 'PR opened: https://github.com/org/repo/pull/456\nLOC: +250/-30',
});

console.log('Comment added');
```

## GraphQL Query Examples

Linear's SDK is built on GraphQL. You can also use raw GraphQL queries:

### Get Issue Details

```graphql
query GetIssue($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    description
    priority
    state {
      name
      type
    }
    team {
      key
      name
    }
    labels {
      nodes {
        name
      }
    }
    createdAt
    updatedAt
  }
}
```

Variables:
```json
{
  "id": "PAY-123"
}
```

### List Teams

```graphql
query ListTeams {
  teams {
    nodes {
      id
      key
      name
    }
  }
}
```

### Create Issue (Mutation)

```graphql
mutation CreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id
      identifier
      title
      url
    }
  }
}
```

Variables:
```json
{
  "input": {
    "teamId": "team-uuid-here",
    "title": "0021: Linear MCP Integration",
    "description": "Integrate Linear MCP with Claude Code",
    "priority": 2,
    "labelIds": ["label-uuid-1"]
  }
}
```

## GraphQL Playground

Linear provides an interactive GraphQL explorer:

**URL**: https://studio.apollographql.com/public/Linear-API/variant/current/explorer

**Authentication**:
1. Click "Headers" tab
2. Add header:
   ```
   Authorization: Bearer lin_api_your_key_here
   ```

**Features**:
- Auto-complete schema
- Query history
- Variable editor
- Documentation explorer

## SDK Reference

- **Documentation**: https://developers.linear.app/docs/sdk/getting-started
- **API Reference**: https://developers.linear.app/docs/graphql/working-with-the-graphql-api
- **SDK Source**: https://github.com/linear/linear/tree/master/packages/sdk
- **Examples**: https://github.com/linear/linear/tree/master/packages/sdk/examples

## Security Reminders

- **Never commit API keys**: Use `.env.local` (git-ignored)
- **CI does not use Linear SDK**: Scripts are dev-only; CI workflows rely on MCP (no secrets)
- **Rotate keys regularly**: Via [Linear Settings → API](https://linear.app/settings/api)
- **Use Personal API Keys**: Not OAuth tokens (for local dev)
- **Team keys**: Each developer should use their own API key

## CI/CD Constraints

**Why we don't use Linear SDK in CI**:

1. **No secrets in GitHub Actions**: Violates our constitution's security principles
2. **MCP is sufficient**: Claude can perform issue operations during development
3. **Non-blocking philosophy**: CI guards warn but don't fail on missing Linear issues
4. **Reversibility**: Avoiding Linear dependencies in CI keeps rollback simple

**If you later add CI automation**:
- Use GitHub secrets for `LINEAR_API_KEY`
- Implement error handling for Linear API failures
- Make all Linear operations optional (continue-on-error: true)
- Update delta doc and constitution to reflect new risk profile

## Example Use Cases

### Bulk Label Migration

```javascript
// Rename label "old-name" to "new-name" across all issues
const issues = await client.issues({
  filter: {
    labels: { name: { eq: 'old-name' } },
  },
});

const newLabel = await client.issueLabel('new-label-uuid');

for (const issue of issues.nodes) {
  await issue.update({
    labelIds: [newLabel.id, ...issue.labels.nodes.map(l => l.id)],
  });
}
```

### Export Issues to CSV

```javascript
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

const issues = await client.issues({ filter: { team: { key: { eq: 'PAY' } } } });

const csv = stringify(
  issues.nodes.map(i => ({
    key: i.identifier,
    title: i.title,
    status: i.state?.name,
    priority: i.priority,
    created: i.createdAt,
  })),
  { header: true }
);

fs.writeFileSync('linear-export.csv', csv);
```

### Sync Issues to Local Database

```javascript
// Fetch all issues and store in local JSON for offline analysis
const allIssues = [];
let hasMore = true;
let cursor;

while (hasMore) {
  const result = await client.issues({
    first: 100,
    after: cursor,
    filter: { team: { key: { eq: 'PAY' } } },
  });

  allIssues.push(...result.nodes);
  hasMore = result.pageInfo.hasNextPage;
  cursor = result.pageInfo.endCursor;
}

fs.writeFileSync('issues-snapshot.json', JSON.stringify(allIssues, null, 2));
console.log(`Exported ${allIssues.length} issues`);
```

---

**Questions?** See [docs/integrations/linear-mcp.md](../../docs/integrations/linear-mcp.md) or consult the [Linear SDK docs](https://developers.linear.app/docs/sdk/getting-started).
