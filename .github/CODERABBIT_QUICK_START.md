# CodeRabbit Quick Start for PayPlan Contributors

⚡ **5-Minute Setup Guide**

## What You Need to Know

CodeRabbit is our AI code reviewer. It will:
- ✅ Review every PR automatically
- ✅ Catch timezone bugs, security issues, and edge cases
- ✅ Enforce PayPlan coding standards
- ✅ Answer questions about code changes

**You don't need to install anything.** Just open a PR and CodeRabbit will comment.

---

## First-Time Setup (Maintainers Only)

**Already done for PayPlan!** ✅

If you're forking:
1. Visit: https://coderabbit.ai/
2. Login with GitHub
3. Add your fork repository
4. Copy `.coderabbit.yaml` from PayPlan

---

## Using CodeRabbit in PRs

### Step 1: Open a PR

```bash
git checkout -b feature/my-feature
# Make your changes
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-feature
# Open PR on GitHub
```

### Step 2: Wait 30 Seconds

CodeRabbit will automatically:
1. Add a **PR Summary** comment
2. Post **inline code review** comments
3. Show a **status check** (pass/fail)

### Step 3: Address Comments

**Example CodeRabbit Comment:**
> ⚠️ **Timezone Safety**: This DateTime operation doesn't specify a timezone. Use `{ zone: 'America/New_York' }` explicitly.

**Your Response:**
```markdown
@coderabbitai Good catch! Fixed in the next commit.
```

### Step 4: Ask Questions (Optional)

```markdown
@coderabbitai Can you explain why this is a timezone bug?
```

```markdown
@coderabbitai What edge cases should I test for this date calculation?
```

### Step 5: Push Fixes

```bash
git add .
git commit -m "fix: Add explicit timezone to DateTime"
git push
```

CodeRabbit will automatically re-review the changes.

---

## Common CodeRabbit Commands

| Command | What It Does |
|---------|--------------|
| `@coderabbitai help` | Show available commands |
| `@coderabbitai review` | Re-run the full review |
| `@coderabbitai explain this` | Get explanation for code |
| `@coderabbitai generate docstrings` | Add JSDoc comments |
| `@coderabbitai resolve` | Mark conversation as resolved |

---

## What CodeRabbit Checks for PayPlan

### 1. **Timezone Safety** 🌍
- ❌ `new Date('2025-10-02')` (no timezone)
- ✅ `DateTime.fromISO('2025-10-02', { zone: 'America/New_York' })`

### 2. **Financial Accuracy** 💰
- ❌ `const total = 45.10 + 32.20;` (floating point)
- ✅ `const total = (4510 + 3220) / 100;` (cent-based)

### 3. **API Errors** 📋
- ❌ `res.status(400).json({ error: "Bad request" })`
- ✅ RFC 9457 Problem Details format

### 4. **Security** 🔒
- Scans for exposed API keys (Gitleaks)
- Detects security vulnerabilities (Semgrep)
- Flags potential PII leaks

### 5. **Test Coverage** ✅
- Checks for edge cases (weekends, holidays, DST, leap years)
- Validates timezone-aware test fixtures

---

## Tips for Working with CodeRabbit

### ✅ Do This
- Respond to comments (even if you disagree)
- Ask questions when you don't understand
- Use `@coderabbitai resolve` when issue is fixed
- Let CodeRabbit review before requesting human review

### ❌ Don't Do This
- Ignore CodeRabbit comments without explanation
- Mark as resolved without fixing
- Skip CodeRabbit review (it's fast!)

---

## Example PR Workflow

```markdown
# 1. CodeRabbit posts review
🤖 CodeRabbit: This function doesn't handle leap years.

# 2. You respond
@matthew-utt: Good point! Adding test case for Feb 29, 2024.

# 3. You fix and push
git commit -m "test: Add leap year test case"
git push

# 4. CodeRabbit re-reviews
🤖 CodeRabbit: ✅ Looks good! The leap year case is now covered.

# 5. You mark resolved
@matthew-utt: @coderabbitai resolve
```

---

## Troubleshooting

### "CodeRabbit didn't review my PR"

**Check:**
1. Is it a draft PR? (CodeRabbit skips drafts)
2. Wait 1-2 minutes (sometimes takes longer)
3. Manually trigger: `@coderabbitai review`

### "CodeRabbit is too strict"

**That's intentional!** PayPlan handles financial data, so we use `assertive` mode.

If you think a comment is wrong:
```markdown
@coderabbitai This is intentional because [explain reason].
```

### "I don't understand CodeRabbit's comment"

**Just ask!**
```markdown
@coderabbitai Can you explain this in more detail?
```

```markdown
@coderabbitai Show me an example of the correct way to do this.
```

---

## Need Help?

- **CodeRabbit Docs**: https://docs.coderabbit.ai/
- **PayPlan Setup Guide**: `docs/CODERABBIT_SETUP.md`
- **Questions**: Ask in PR comments or PayPlan issues

---

**Last Updated**: 2025-10-02

Happy coding! 🚀
