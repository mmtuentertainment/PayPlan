# CodeRabbit Setup & Usage Guide for PayPlan

**AI-Powered Code Reviews for Financial Applications**

## Table of Contents
1. [What is CodeRabbit?](#what-is-coderabbit)
2. [Why CodeRabbit for PayPlan?](#why-coderabbit-for-payplan)
3. [Setup Instructions](#setup-instructions)
4. [Configuration Overview](#configuration-overview)
5. [Using CodeRabbit](#using-coderabbit)
6. [Commands Reference](#commands-reference)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## What is CodeRabbit?

CodeRabbit is an AI-powered code review platform that provides:
- **Instant PR Reviews**: Automated analysis within seconds of PR creation
- **Context-Aware Feedback**: Understands your entire codebase, not just the diff
- **Security Scanning**: Integrated Gitleaks, Semgrep, and 40+ linters
- **Test Generation**: Automatic docstring and test suggestions
- **Interactive Chat**: Ask questions about code changes via `@coderabbitai`

**Key Stats:**
- Reduces review time by up to 90%
- Catches bugs before production
- Maintains consistent code quality
- SOC 2 & GDPR compliant (never stores code permanently)

---

## Why CodeRabbit for PayPlan?

PayPlan is a **financial application** handling BNPL payment schedules, which requires:

### 1. **Timezone Safety** 🌍
- CodeRabbit configured to flag timezone bugs in Luxon DateTime operations
- Detects hardcoded timezone assumptions
- Validates DST transition handling

### 2. **Financial Accuracy** 💰
- Enforces exact decimal arithmetic (no floating point for money)
- Validates currency specifications
- Checks for proper rounding (2 decimals)

### 3. **Privacy & Security** 🔒
- Scans for PII/financial data leaks
- Validates rate limiting implementation
- Checks RFC 9457 Problem Details compliance
- Detects exposed secrets/API keys (Gitleaks)

### 4. **API Contract Compliance** 📋
- Validates OpenAPI spec consistency
- Ensures backward compatibility
- Checks proper HTTP status codes

### 5. **Test Coverage** ✅
- Flags missing edge case tests (weekends, holidays, DST, leap years)
- Validates timezone-aware test fixtures
- Checks performance test thresholds

---

## Setup Instructions

### Step 1: Install CodeRabbit GitHub App

1. **Login to CodeRabbit**
   - Visit: https://coderabbit.ai/
   - Click **"Login with GitHub"**
   - Authorize `coderabbitai` with your GitHub account

2. **Configure Repository Access**
   - Go to: https://coderabbit.ai/dashboard
   - Click **"Add Repositories"**
   - Select: **"Only select repositories"**
   - Choose: `matthew-utt/PayPlan`
   - Click **"Install & Authorize"**

3. **Grant Permissions**
   CodeRabbit requires:
   - ✅ Read: Organizations, teams, email addresses
   - ✅ Read/Write: Code, commit statuses, issues, pull requests
   - ❌ **Does NOT**: Store code permanently, access secrets, or use for training

### Step 2: Verify Configuration File

The `.coderabbit.yaml` configuration is already in the repository root. Verify it's present:

```bash
cat /home/matt/PROJECTS/PayPlan/.coderabbit.yaml
```

**Configuration Highlights:**
- **Review Profile**: `assertive` (thorough for financial app)
- **Enabled Tools**: ESLint, Gitleaks, Semgrep, YAMLlint, Markdownlint, Actionlint, Shellcheck
- **Path-Specific Rules**: Custom instructions for `src/lib/`, `src/routes/`, `tests/`, `frontend/`
- **Timezone Safety**: Enforces Luxon DateTime best practices
- **Privacy**: Flags potential PII leaks

### Step 3: Test the Integration

1. **Create a Test PR**
   ```bash
   git checkout -b test/coderabbit-integration
   echo "// Test change" >> src/lib/payday-calculator.js
   git add src/lib/payday-calculator.js
   git commit -m "test: Verify CodeRabbit integration"
   git push origin test/coderabbit-integration
   ```

2. **Open PR on GitHub**
   - Visit: https://github.com/matthew-utt/PayPlan/pulls
   - Create new PR from `test/coderabbit-integration` → `main`

3. **Verify CodeRabbit Response**
   Within 10-30 seconds, CodeRabbit should:
   - ✅ Add a PR summary comment
   - ✅ Post code review comments (if issues found)
   - ✅ Show status check: `coderabbitai`

4. **Clean Up**
   ```bash
   git checkout main
   git branch -D test/coderabbit-integration
   git push origin --delete test/coderabbit-integration
   ```

---

## Configuration Overview

### File Location
`.coderabbit.yaml` in repository root (must be in feature branch for reviews)

### Key Sections

#### 1. **Language & Tone**
```yaml
language: en-US
tone_instructions: |
  - Focus on security, data privacy, financial accuracy
  - Prioritize timezone-aware date handling
  - Flag potential PII/financial data leaks
```

#### 2. **Review Settings**
```yaml
reviews:
  profile: assertive  # More thorough reviews
  auto_review:
    enabled: true
    drafts: false     # Skip draft PRs
```

#### 3. **Path Filters** (Excluded from Review)
- `node_modules/`, `dist/`, `*.min.js`, lock files
- `assets/`, `public/`, `CHANGELOG.md`

#### 4. **Path-Specific Instructions**

| Path | Focus Areas |
|------|-------------|
| `src/lib/**/*.js` | Timezone handling, edge cases, performance |
| `src/routes/**/*.js` | Input validation, RFC 9457 compliance, rate limiting |
| `src/middleware/**/*.js` | Security checks, error handling, performance |
| `tests/**/*.js` | Edge case coverage, timezone-aware fixtures |
| `frontend/src/**/*.{ts,tsx}` | TypeScript types, Zod validation, accessibility |

#### 5. **Tool Integrations**
- ✅ **ESLint**: JavaScript linting (frontend)
- ✅ **Gitleaks**: Secret scanning (API keys, tokens)
- ✅ **Semgrep**: Security vulnerability detection
- ✅ **YAMLlint**: Validate GitHub Actions, OpenAPI specs
- ✅ **Markdownlint**: Documentation style
- ✅ **Actionlint**: GitHub Actions validation
- ✅ **Shellcheck**: Shell script validation

#### 6. **Finishing Touches**
```yaml
finishing_touches:
  docstrings:
    enabled: true
    style: "JSDoc"
  unit_tests:
    enabled: false  # Manual for financial logic
```

---

## Using CodeRabbit

### Automatic Reviews

CodeRabbit automatically reviews every PR:
1. **PR Summary**: High-level overview of changes
2. **Walkthrough**: File-by-file summary
3. **Code Comments**: Inline suggestions and issues
4. **Status Check**: Pass/fail based on severity

### Interactive Chat

Talk to CodeRabbit using `@coderabbitai` in PR comments:

```markdown
@coderabbitai Can you explain the timezone handling in this function?
```

```markdown
@coderabbitai Generate JSDoc for the shiftToBusinessDays function
```

```markdown
@coderabbitai Are there any edge cases I missed in this date calculation?
```

### Review Customization

Ask CodeRabbit to focus on specific aspects:

```markdown
@coderabbitai Focus on security and privacy in this endpoint
```

```markdown
@coderabbitai Check for timezone bugs in this PR
```

```markdown
@coderabbitai Review API backward compatibility
```

---

## Commands Reference

### PR Commands (Comment `@coderabbitai <command>`)

| Command | Description |
|---------|-------------|
| `@coderabbitai help` | Show available commands |
| `@coderabbitai review` | Re-run full code review |
| `@coderabbitai summary` | Regenerate PR summary |
| `@coderabbitai configuration` | Show current config |
| `@coderabbitai generate docstrings` | Add JSDoc comments |
| `@coderabbitai generate unit tests` | Suggest test cases (if enabled) |
| `@coderabbitai resolve` | Mark conversation as resolved |
| `@coderabbitai pause` | Pause reviews on this PR |
| `@coderabbitai resume` | Resume reviews on this PR |

### Inline Commands (Reply to CodeRabbit comment)

| Command | Description |
|---------|-------------|
| `@coderabbitai Can you explain this?` | Ask clarification questions |
| `@coderabbitai Show me an example` | Request code examples |
| `@coderabbitai Is this safe?` | Security validation |
| `@coderabbitai What are the edge cases?` | Identify missing scenarios |

### Configuration Commands

```bash
# View current config
@coderabbitai configuration

# Ignore specific files temporarily
@coderabbitai ignore src/lib/test-helper.js

# Focus review on specific files
@coderabbitai review src/lib/business-day-shifter.js
```

---

## Best Practices

### 1. **Respond to CodeRabbit Comments**

**Good Response:**
```markdown
@coderabbitai Good catch! I'll add timezone validation here.
```

**Good Response:**
```markdown
@coderabbitai This is intentional because [explain reason]. The edge case is handled in line 45.
```

**Avoid:**
```markdown
Ignored. (No explanation)
```

### 2. **Use CodeRabbit for Learning**

Ask questions to understand code better:
```markdown
@coderabbitai Why is Luxon better than Date here?
```

```markdown
@coderabbitai What timezone edge cases should I consider?
```

### 3. **Leverage Path-Specific Instructions**

CodeRabbit knows PayPlan's critical areas:
- **`src/lib/`**: Expects timezone safety checks
- **`src/routes/`**: Expects RFC 9457 compliance
- **`tests/`**: Expects edge case coverage

### 4. **Review Before Requesting Human Review**

1. Create PR
2. Wait for CodeRabbit review (30 seconds)
3. Address CodeRabbit comments
4. Push fixes
5. **Then** request human review

This reduces human reviewer burden by 80%.

### 5. **Tag Team Members**

Combine AI and human reviews:
```markdown
@coderabbitai Review timezone handling
@matthew-utt Can you verify the business logic?
```

### 6. **Use for Documentation**

```markdown
@coderabbitai Generate JSDoc for all functions in this file
```

```markdown
@coderabbitai Write a summary of this PR for the CHANGELOG
```

---

## Best Practices for PayPlan Specifics

### Timezone Safety
```javascript
// ❌ CodeRabbit will flag this
const date = new Date('2025-10-02');

// ✅ CodeRabbit approves this
const date = DateTime.fromISO('2025-10-02', { zone: 'America/New_York' });
```

### Financial Accuracy
```javascript
// ❌ CodeRabbit will flag this
const total = 45.10 + 32.20;  // Floating point issues

// ✅ CodeRabbit approves this
const total = (4510 + 3220) / 100;  // Cent-based arithmetic
```

### API Errors
```javascript
// ❌ CodeRabbit will flag this
res.status(400).json({ error: "Bad request" });

// ✅ CodeRabbit approves this (RFC 9457)
res.status(400).json({
  type: "https://payplan.com/problems/validation-error",
  title: "Validation Error",
  status: 400,
  detail: "items array is required",
  instance: "/api/plan"
});
```

---

## Troubleshooting

### CodeRabbit Didn't Review My PR

**Possible Causes:**
1. **Draft PR**: CodeRabbit skips drafts (set `ignore_draft_pr: false` to change)
2. **Ignored Branch**: Check `.coderabbit.yaml` for branch filters
3. **Ignored Title**: PRs with "WIP" or "[skip ci]" may be ignored
4. **Configuration Error**: Syntax error in `.coderabbit.yaml`

**Fix:**
```bash
# Validate YAML syntax
yamllint .coderabbit.yaml

# Trigger manual review
# Comment on PR: @coderabbitai review
```

### CodeRabbit is Too Strict

**Option 1: Adjust Profile**
```yaml
reviews:
  profile: chill  # Less nitpicky (was: assertive)
```

**Option 2: Ignore Specific Paths**
```yaml
reviews:
  path_filters:
    - "!src/experimental/**"  # Exclude experimental code
```

**Option 3: Pause Temporarily**
```markdown
@coderabbitai pause
```

### CodeRabbit Missed an Issue

**Report to CodeRabbit:**
```markdown
@coderabbitai This timezone bug should have been caught. Can you review line 42 again?
```

**Update Configuration:**
Add specific check to `.coderabbit.yaml`:
```yaml
reviews:
  path_instructions:
    - path: "src/lib/**/*.js"
      instructions: |
        Always check for DateTime operations without explicit timezone
```

### Tool Integration Not Working

**Check Tool Config:**
```yaml
reviews:
  tools:
    eslint:
      enabled: true
      config_file: "frontend/.eslintrc.cjs"  # Verify path
```

**Verify Tool Files Exist:**
```bash
ls frontend/.eslintrc.cjs
ls .markdownlint.json
```

---

## Advanced Usage

### AST-Grep Rules (Pro Plan)

When upgraded to Pro, enable advanced pattern matching:

```yaml
reviews:
  tools:
    ast-grep:
      enabled: true
      rule_dirs:
        - ".ast-grep/rules"
```

Create `.ast-grep/rules/no-console-production.yaml`:
```yaml
id: no-console-production
language: javascript
message: "console.log not allowed in production code"
rule:
  pattern: console.log($$$)
  not:
    inside:
      any:
        - pattern: if (process.env.NODE_ENV === 'development')
        - pattern: // DEV_ONLY
```

### Issue Creation (Pro Plan)

Create issues directly from PR comments:
```markdown
@coderabbitai Create a GitHub issue to refactor timezone handling in payday-calculator.js. Assign to @matthew-utt. Priority: High.
```

### Knowledge Base Learning

CodeRabbit learns from your codebase over time:
- Coding patterns you prefer
- Security practices you enforce
- Edge cases you typically handle

**View Learnings:**
```markdown
@coderabbitai What have you learned about our timezone handling?
```

---

## Pricing & Plans

**Current Plan: Free**
- ✅ Public repositories: Unlimited
- ✅ Private repositories: Limited reviews
- ✅ Basic tools: ESLint, Gitleaks, Semgrep
- ❌ AST-Grep advanced rules
- ❌ Issue creation (GitHub/Jira/Linear)
- ❌ Unlimited context-aware reviews

**Upgrade to Pro:**
- Contact: sales@coderabbit.ai
- Features: Unlimited reviews, AST-Grep, issue creation, priority support

---

## Additional Resources

### Official Documentation
- **Main Docs**: https://docs.coderabbit.ai/
- **Configuration Reference**: https://docs.coderabbit.ai/reference/configuration
- **YAML Template**: https://docs.coderabbit.ai/reference/yaml-template
- **Tools Reference**: https://docs.coderabbit.ai/reference/tools-reference

### PayPlan-Specific
- **Configuration File**: `.coderabbit.yaml`
- **Feature Specs**: `specs/*/feature-spec.md`
- **OpenAPI Contract**: `specs/bnpl-manager/contracts/post-plan.yaml`
- **Test Fixtures**: `tests/fixtures/*.json`

### Support
- **CodeRabbit Support**: support@coderabbit.ai
- **PayPlan Issues**: https://github.com/matthew-utt/PayPlan/issues

---

## Quick Reference Card

```markdown
# CODERABBIT CHEAT SHEET

# Trigger Review
@coderabbitai review

# Ask Question
@coderabbitai Explain this timezone logic

# Generate Docs
@coderabbitai generate docstrings

# Focus Review
@coderabbitai Review security in this endpoint

# Show Config
@coderabbitai configuration

# Pause/Resume
@coderabbitai pause
@coderabbitai resume

# Mark Resolved
@coderabbitai resolve
```

---

**Last Updated**: 2025-10-02
**PayPlan Version**: v0.1.2
**CodeRabbit Config Version**: 1.0.0

For questions or issues, contact the PayPlan team or CodeRabbit support.
