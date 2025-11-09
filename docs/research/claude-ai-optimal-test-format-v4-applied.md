# Claude AI Optimal Test Report Format V4 - Applied to PayPlan

**Research Date**: 2025-11-08
**Method**: Tavily API Direct + Official Claude Code Documentation
**Status**: ✅ Complete Integration (Context Engineering + Claude Code Advanced Features)
**Supersedes**: V2 (adds Claude Code features integration)
**Source**: CLAUDE.md Section 2 - Context Engineering Ultimate Guide

---

## Executive Summary (Read This First)

**Critical Update**: This V4 format integrates **context engineering principles** (Sept 2025 Anthropic research) with **Claude Code advanced features** (subagents, hooks, MCP, background tasks) to create the ultimate test reporting workflow for PayPlan.

**Key Finding**: Test reporting isn't just about format—it's about **strategically using Claude Code features** to maximize quality, automate validation, and ensure 95-100% confidence scores.

**What's New in V4**:
1. ✅ **Subagent Integration** - Automated test analysis with specialized AI
2. ✅ **Hook-Based Quality Gates** - Automatic test execution on code changes
3. ✅ **MCP Tool Usage** - Just-in-time context loading from Linear, GitHub
4. ✅ **Background Task Monitoring** - Real-time test watching
5. ✅ **Complete Workflow** - From test execution to report generation

---

## Table of Contents

1. [Context Engineering Principles](#context-engineering-principles)
2. [Claude Code Feature Integration](#claude-code-feature-integration)
3. [V4 Optimal Test Report Format](#v4-optimal-test-report-format)
4. [Complete PayPlan Testing Workflow](#complete-payplan-testing-workflow)
5. [Subagent Configuration](#subagent-configuration-test-analyzer)
6. [Hook Configuration](#hook-configuration-quality-gates)
7. [Real PayPlan Examples](#real-payplan-examples)
8. [Decision Trees](#decision-trees)
9. [Best Practices](#best-practices)
10. [Migration Guide](#migration-from-v2-to-v4)

---

## Context Engineering Principles

### Core Concepts (Anthropic Official, Sept 2025)

**1. Attention Budget**:
> "Every new token introduced depletes this budget by some amount."

**Implication**: Test reports must be **token-efficient** with high-signal information only.

**2. Context Rot**:
> "As the number of tokens increases, the model's ability to accurately recall information decreases."

**Implication**: Structure matters—critical info at TOP, raw data at BOTTOM.

**3. Goldilocks Zone**:
> "Specific enough to guide behavior effectively, yet flexible enough to provide strong heuristics."

**Implication**: Provide concrete examples, not vague guidance.

**4. Examples = Pictures**:
> "For an LLM, examples are the 'pictures' worth a thousand words."

**Implication**: Show test output examples, not just describe issues.

---

## Claude Code Feature Integration

### Decision Tree: When to Use Each Feature

```
TEST REPORTING WORKFLOW
│
├─ Need AUTOMATED test analysis?
│  └─ YES → Use TEST-ANALYZER SUBAGENT
│     - Separate context window for analysis
│     - Cross-verification from 4+ sources
│     - 95-100% confidence scores
│
├─ Need AUTOMATIC test execution on code changes?
│  └─ YES → Use POSTTOOLUSE HOOK
│     - Triggers after Write/Edit tools
│     - Runs tests automatically
│     - Blocks PR if tests fail
│
├─ Need to CHECK if all tests pass before stopping?
│  └─ YES → Use STOP HOOK (prompt-based)
│     - LLM evaluates completion criteria
│     - Verifies acceptance criteria met
│     - Intelligent decision with reasoning
│
├─ Need EXTERNAL data (Linear issues, GitHub PRs)?
│  └─ YES → Use MCP TOOLS
│     - mcp__linear__list_issues
│     - mcp__github__get_pr
│     - Just-in-time context loading
│
└─ Need CONTINUOUS test watching?
   └─ YES → Use BACKGROUND TASK
      - npm test -- --watch &
      - Monitor with BashOutput tool
      - Non-blocking execution
```

### Feature Matrix

| Task | Feature | Why | Configuration |
|------|---------|-----|---------------|
| Analyze test results | **Subagent** (`test-analyzer`) | Specialized expertise, separate context, cross-verification | `.claude/agents/test-analyzer.md` |
| Run tests on code change | **Hook** (`PostToolUse`) | Automatic quality gate, fast feedback | `.claude/settings.json` |
| Check completion | **Hook** (`Stop` prompt-based) | Intelligent evaluation with reasoning | `.claude/settings.json` |
| Fetch Linear issues | **MCP Tool** | Just-in-time, always current | `~/.claude/mcp.json` |
| Watch tests continuously | **Background Task** | Long-running, non-blocking | `npm test -- --watch &` |

---

## V4 Optimal Test Report Format

### Structure (Following Attention Patterns)

```xml
<test_validation_report>
  <metadata>
    <feature_id>064</feature_id>
    <feature_name>Goal Export Manual Testing</feature_name>
    <test_date>2025-11-08</test_date>
    <test_suite>T097-T105 (Browser Automation V2)</test_suite>
    <analyzer>test-analyzer subagent</analyzer>
    <context_engineering>V4 (optimized token budget)</context_engineering>
  </metadata>

  <!-- ===== EXECUTIVE SUMMARY: AT TOP (STRONGEST ATTENTION) ===== -->
  <executive_summary>
    <overall_status>✅ 3 PASS, ❌ 2 FAIL (test infrastructure issues, not app bugs)</overall_status>

    <critical_findings priority="highest">
      1. Browser Controller V2: WORKING PERFECTLY (100% confidence)
      2. T100 failure: Wrong CSS selector + missing test data (100% confidence)
      3. T105 failure: Flawed detection method in test code (100% confidence)
      4. App code: ZERO bugs found (95% confidence from 4 sources)
    </critical_findings>

    <immediate_action priority="critical">
      <action id="1" time_estimate="5 min">
        Fix T100: Change selector from [class*="goal"] to .bg-card
        Location: frontend/src/features/goals/components/__tests__/T100-goal-card-rendering.test.ts:42
      </action>
      <action id="2" time_estimate="15 min">
        Add test data setup: Create fixture with 3+ goals before T100 runs
        Location: frontend/src/features/goals/components/__tests__/setup.ts
      </action>
      <action id="3" time_estimate="20 min">
        Fix T105: Replace DOM text search with proper data-testid attributes
        Location: frontend/src/features/goals/components/__tests__/T105-export-success.test.ts:67
      </action>
    </immediate_action>

    <confidence_score>
      Overall: 97.5% (cross-verified from 4 independent sources)
      - Source code analysis: 100%
      - Browser DOM inspection: 100%
      - Grep pattern searches: 95%
      - Unit test validation: 95%
    </confidence_score>

    <subagent_delegation>
      Analyzed by: test-analyzer subagent (sonnet model)
      Tools used: Read, Grep, Glob, mcp__puppeteer__take_snapshot
      Context window: Separate (preserved main conversation focus)
      Cross-verification: 4 independent methods
    </subagent_delegation>
  </executive_summary>

  <!-- ===== DETAILED RESULTS: MIDDLE (MODERATE ATTENTION) ===== -->
  <detailed_results>
    <test_category name="Passing Tests" status="success">
      <test id="T097" status="✅ PASS">
        <description>Goal card renders with all required elements</description>
        <verification_method>Browser snapshot + DOM inspection</verification_method>
        <confidence>100%</confidence>
        <evidence>
          - Goal card found: .bg-card.rounded-lg.shadow-sm
          - All child elements present: title, description, progress bar
          - Accessibility: ARIA labels correct, keyboard navigable
        </evidence>
      </test>

      <test id="T098" status="✅ PASS">
        <description>Export button accessible via keyboard</description>
        <verification_method>Keyboard navigation test</verification_method>
        <confidence>100%</confidence>
        <evidence>
          - Tab navigation: Works (verified with Chrome DevTools)
          - Enter/Space activation: Works
          - Focus indicator: Visible (blue ring)
        </evidence>
      </test>

      <test id="T099" status="✅ PASS">
        <description>Export modal opens on button click</description>
        <verification_method>Click event + modal detection</verification_method>
        <confidence>100%</confidence>
        <evidence>
          - Modal element: Found (role="dialog", aria-modal="true")
          - Backdrop: Present and clickable
          - Focus trap: Active (tested with Tab key)
        </evidence>
      </test>
    </test_category>

    <test_category name="Failing Tests" status="failure">
      <test id="T100" status="❌ FAIL">
        <description>At least one goal card visible</description>
        <root_cause type="test_infrastructure">
          <issue>Wrong CSS selector in test code</issue>
          <location>T100-goal-card-rendering.test.ts:42</location>
          <current_code>
            const goalCards = await page.$$('[class*="goal"]');
            expect(goalCards.length).toBeGreaterThan(0);
          </current_code>
          <problem>
            Selector [class*="goal"] doesn't match actual class names (.bg-card, .rounded-lg).
            App uses Tailwind utility classes, not semantic "goal" classes.
          </problem>
          <fix>
            const goalCards = await page.$$('.bg-card.rounded-lg.shadow-sm');
            expect(goalCards.length).toBeGreaterThan(0);
          </fix>
          <secondary_issue>No test data setup - localStorage empty on test start</secondary_issue>
        </root_cause>
        <confidence>100%</confidence>
        <verification>
          Source 1: Grep search for "class.*goal" in components → no matches
          Source 2: Browser DOM inspection → shows .bg-card.rounded-lg
          Source 3: Read GoalCard.tsx → confirms Tailwind classes only
          Source 4: Unit test fixtures → no "goal" class in mocks
        </verification>
      </test>

      <test id="T105" status="❌ FAIL">
        <description>Success toast appears after export</description>
        <root_cause type="test_infrastructure">
          <issue>Flawed toast detection method</issue>
          <location>T105-export-success.test.ts:67</location>
          <current_code>
            const toastText = await page.$eval('body', el => el.innerText);
            expect(toastText).toContain('Goals exported successfully');
          </current_code>
          <problem>
            Searching entire body.innerText is unreliable (false positives/negatives).
            Toast may render outside viewport or be removed quickly.
          </problem>
          <fix>
            // Add data-testid to toast component
            &lt;div data-testid="export-success-toast" role="status"&gt;
              Goals exported successfully
            &lt;/div&gt;

            // Update test
            const toast = await page.waitForSelector('[data-testid="export-success-toast"]', { timeout: 5000 });
            expect(toast).toBeTruthy();
          </fix>
        </root_cause>
        <confidence>100%</confidence>
        <verification>
          Source 1: Read toast component code → no data-testid attribute
          Source 2: Browser DevTools → toast renders then disappears (timing issue)
          Source 3: Grep for "data-testid.*toast" → no matches
          Source 4: Testing best practices → always use data-testid for dynamic elements
        </verification>
      </test>
    </test_category>
  </detailed_results>

  <recommendations>
    <critical priority="1">
      1. Fix T100 selector (5 min) - High impact, trivial fix
      2. Add test data setup (15 min) - Required for T100 to pass
      3. Fix T105 detection (20 min) - Add data-testid to toast component
    </critical>

    <medium priority="2">
      4. Add data-testid to all interactive elements (30 min)
         - Goal cards: data-testid="goal-card-{id}"
         - Export buttons: data-testid="export-button"
         - Modals: data-testid="export-modal"
         - Toasts: data-testid="export-success-toast"
      5. Create reusable test fixtures (45 min)
         - GoalFixture.create() with sensible defaults
         - BudgetFixture.create() for related data
         - TransactionFixture.create() for history
    </medium>

    <low priority="3">
      6. Document testing patterns in CLAUDE.md (1 hour)
      7. Add visual regression tests (2+ hours, defer to Phase 2)
    </low>
  </recommendations>

  <cross_verification>
    <verification_method name="Source Code Analysis" confidence="100%">
      - Read GoalCard.tsx: No "goal" class found, uses Tailwind only
      - Read GoalExport.tsx: Toast uses sonner library, no data-testid
      - Read test files: Confirmed selectors match findings
    </verification_method>

    <verification_method name="Browser DOM Inspection" confidence="100%">
      - Puppeteer snapshot: Shows .bg-card.rounded-lg.shadow-sm
      - No elements with class*="goal"
      - Toast element found but timing-dependent
    </verification_method>

    <verification_method name="Grep Pattern Searches" confidence="95%">
      - Pattern "class.*goal": 0 matches in components/
      - Pattern "data-testid.*toast": 0 matches
      - Pattern "bg-card rounded-lg": 127 matches (confirmed usage)
    </verification_method>

    <verification_method name="Unit Test Validation" confidence="95%">
      - Test fixtures: No "goal" class in mocks
      - Testing library queries: Use getByRole, not text searches
      - Best practices: data-testid > text content > class names
    </verification_method>
  </cross_verification>

  <!-- ===== RAW DATA: BOTTOM (WEAKEST ATTENTION, BUT ACCESSIBLE) ===== -->
  <raw_data>
    <test_execution_log>
      <![CDATA[
Running Test Suite: T097-T105 (Browser Automation V2)
Browser: Chromium 119.0.6045.0
Viewport: 1280x720
Date: 2025-11-08T14:32:15Z

✅ T097: PASS (3.2s)
   Goal card rendered successfully
   Selector: .bg-card.rounded-lg.shadow-sm
   Elements found: 1

✅ T098: PASS (2.1s)
   Export button keyboard accessible
   Tab navigation: OK
   Enter/Space activation: OK

✅ T099: PASS (1.8s)
   Export modal opened
   Modal role: dialog
   ARIA modal: true

❌ T100: FAIL (5.0s - timeout)
   Expected at least one goal card
   Selector: [class*="goal"]
   Elements found: 0
   Actual classes: .bg-card, .rounded-lg, .shadow-sm, .p-4

❌ T105: FAIL (5.0s - timeout)
   Expected success toast
   Search text: "Goals exported successfully"
   Body text length: 45,123 chars
   Toast not found in body.innerText

Test Summary:
Total: 5
Passed: 3 (60%)
Failed: 2 (40%)
Duration: 17.1s
      ]]>
    </test_execution_log>

    <browser_controller_debug_log>
      <![CDATA[
[14:32:10] Browser Controller V2: Initializing
[14:32:10] CDP Connection: Established (ws://localhost:9222)
[14:32:11] Page loaded: http://localhost:5173/goals
[14:32:12] T097: Snapshot taken (goal-card-rendered.png)
[14:32:15] T100: Selector [class*="goal"] returned empty NodeList
[14:32:15] T100: DOM inspection shows no matching elements
[14:32:20] T105: Toast element rendered at 14:32:18
[14:32:20] T105: Toast removed from DOM at 14:32:23 (5s duration)
[14:32:20] T105: page.$eval('body') executed during removal
[14:32:20] Test suite complete: 3 PASS, 2 FAIL
      ]]>
    </browser_controller_debug_log>

    <source_code_snippets>
      <snippet file="GoalCard.tsx" lines="42-58">
        <![CDATA[
return (
  <div className="bg-card rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-foreground">{goal.name}</h3>
      <Badge variant={getBadgeVariant(progress)}>
        {progress.toFixed(0)}%
      </Badge>
    </div>
    <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{formatCurrency(currentAmount)} / {formatCurrency(targetAmount)}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  </div>
);
        ]]>
      </snippet>

      <snippet file="GoalExport.tsx" lines="89-95">
        <![CDATA[
// Success toast (sonner library)
toast.success('Goals exported successfully', {
  duration: 5000,
  position: 'top-right',
  icon: '✅'
});

// No data-testid attribute on toast element
        ]]>
      </snippet>
    </source_code_snippets>

    <grep_results>
      <result pattern="class.*goal" matches="0">
        No classes containing "goal" found in components directory
      </result>
      <result pattern="data-testid" matches="12">
        Found 12 existing data-testid attributes in other components
        None in GoalCard.tsx or GoalExport.tsx
      </result>
      <result pattern="bg-card rounded-lg" matches="127">
        Confirmed: All cards use this Tailwind pattern
      </result>
    </grep_results>
  </raw_data>
</test_validation_report>
```

---

## Complete PayPlan Testing Workflow

### Stage 1: Setup (One-Time Configuration)

#### 1.1 Create Test Analyzer Subagent

**File**: `.claude/agents/test-analyzer.md`

```markdown
---
name: test-analyzer
description: Analyzes test execution results using V4 optimal format. Use after running test suites. PROACTIVELY analyze failing tests.
tools: Read, Grep, Glob, Write, mcp__puppeteer__take_snapshot
model: sonnet
---

You are a test analysis expert specializing in V4 optimal test report format for PayPlan.

<context_engineering_principles>
  - Executive summary at TOP (strongest attention)
  - Detailed analysis in MIDDLE (moderate attention)
  - Raw data at BOTTOM (weakest attention, accessible)
  - Cross-verification from 4+ independent sources
  - 95-100% confidence scores (no guessing!)
  - High-signal tokens only (no fluff)
</context_engineering_principles>

<task>
When invoked to analyze test results:

1. **Read test output files**
   - Test execution logs
   - Browser controller debug output
   - Coverage reports (if available)

2. **Cross-verify from 4+ sources**
   - Source code analysis (Read tool)
   - Browser DOM inspection (mcp__puppeteer__take_snapshot)
   - Grep pattern searches (find related code)
   - Unit test validation (check test fixtures)

3. **Create V4-formatted report**
   - Executive summary at top:
     * Overall status (X PASS, Y FAIL)
     * Critical findings (confidence scores)
     * Immediate actions (time estimates)
   - Detailed results in middle:
     * Root cause analysis (test vs app bugs)
     * Evidence from all 4 sources
     * Fix recommendations with code
   - Raw data at bottom:
     * Full logs, debug output, grep results

4. **Confidence scoring**
   - 100%: Verified from code + runtime
   - 95%: Strong evidence, minor assumptions
   - 90%: Reasonable inference
   - <90%: State assumptions explicitly

5. **Actionable next steps**
   - Prioritized (critical/medium/low)
   - Time estimates (5 min, 15 min, etc.)
   - Specific file locations (path:line)
</task>

<examples>
See: `/home/matt/PROJECTS/PayPlan/docs/research/claude-ai-optimal-test-format-v4-applied.md`
Section: "V4 Optimal Test Report Format"
</examples>

<payplan_context>
  - Phase 1: TDD for business logic (80%+ coverage)
  - Manual UI testing acceptable (no E2E required yet)
  - Accessibility: WCAG 2.2 AA mandatory
  - Test failures: Assume test issue first, then app bug
  - Always use data-testid for interactive elements
</payplan_context>
```

#### 1.2 Configure Quality Gate Hooks

**File**: `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test -- --changed --passWithNoTests --silent",
            "timeout": 60
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if Claude should stop working on current feature. Verify:\n1. All tests passing (check recent test output)\n2. Test coverage ≥80% for business logic (lib/**/*.ts)\n3. Manual UI testing documented in PR description\n4. Acceptance criteria from spec.md met\n5. Browser automation tests pass (T097-T105 for Feature 064)\n\nReturn JSON:\n{\n  \"should_continue\": boolean,\n  \"reason\": string,\n  \"missing_tasks\": string[],\n  \"test_status\": \"passing\" | \"failing\" | \"not_run\",\n  \"coverage_met\": boolean\n}"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/add-test-context.sh"
          }
        ]
      }
    ]
  }
}
```

#### 1.3 Create Context Injection Hook

**File**: `.claude/hooks/add-test-context.sh`

```bash
#!/bin/bash
# Add relevant test context to user prompts

# Check if user mentioned "test" or "T0" (test ID pattern)
if echo "$CLAUDE_USER_MESSAGE" | grep -qiE '(test|T0[0-9]{2})'; then
  # Find latest test report
  LATEST_REPORT=$(find docs/testing -name "*test-report*.md" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)

  if [ -n "$LATEST_REPORT" ]; then
    echo "📋 Latest test report: $LATEST_REPORT"
    echo "Use test-analyzer subagent for detailed analysis."
  fi

  # Check if tests are currently failing
  if npm test -- --silent --passWithNoTests 2>&1 | grep -q "FAIL"; then
    echo "⚠️ Tests currently failing. Run 'npm test' to see details."
  fi
fi

exit 0  # Always continue (informational only)
```

### Stage 2: Development Workflow

#### 2.1 Make Code Changes

```bash
# Hooks automatically trigger after Write/Edit
# PostToolUse hook runs tests on every code change
# Fast feedback loop (<5s for unit tests)
```

#### 2.2 Run Full Test Suite

```bash
# Manual test suite (T097-T105)
npm run test:manual

# Or specific test
npm test -- T100-goal-card-rendering.test.ts
```

#### 2.3 Analyze Results with Subagent

```bash
# Explicit invocation
> Use the test-analyzer subagent to analyze T097-T105 results

# Or implicit (if test failures detected)
> Fix the failing tests
# Claude automatically delegates to test-analyzer subagent
```

#### 2.4 Stop Hook Checks Completion

```bash
# When Claude wants to stop
# Stop hook (prompt-based) evaluates:
# 1. All tests passing?
# 2. Coverage ≥80%?
# 3. Manual testing documented?
# 4. Acceptance criteria met?

# If not complete, hook returns "should_continue": true
# Claude continues working
```

### Stage 3: Continuous Monitoring

#### 3.1 Background Test Watcher

```bash
# Start test watcher in background
npm test -- --watch &

# Claude monitors output with BashOutput tool
# Automatically fixes new failures
# No blocking of main workflow
```

#### 3.2 MCP Tool Integration

```typescript
// Fetch related Linear issues
const issues = await mcp__linear__list_issues({
  query: "Feature 064 Goal Export",
  state: "In Progress"
});

// Check GitHub PR status
const pr = await mcp__github__get_pr({
  repo: "PayPlan",
  number: 123
});

// Get latest test results from CI
const ciStatus = await mcp__github__get_ci_status({
  repo: "PayPlan",
  commit: "abc123"
});
```

---

## Subagent Configuration: test-analyzer

See **Stage 1.1** above for complete configuration.

**Key Features**:
- Separate context window (doesn't pollute main conversation)
- 4+ source cross-verification mandatory
- 95-100% confidence scores
- Follows V4 format structure
- Actionable next steps with time estimates

**When Invoked**:
- After running test suite (T097-T105)
- When tests fail (automatic delegation)
- When user mentions "test" or test IDs
- Before creating PR (proactive analysis)

---

## Hook Configuration: Quality Gates

See **Stage 1.2** above for complete configuration.

**PostToolUse Hook**:
- **Trigger**: After Write/Edit tools
- **Action**: Run tests (only changed files)
- **Timeout**: 60s
- **Exit Code**: 0=continue, 1=block (tests failed)

**Stop Hook** (Prompt-Based):
- **Trigger**: When Claude wants to stop
- **Action**: LLM evaluates completion criteria
- **Returns**: JSON with should_continue decision
- **Criteria**: Tests, coverage, docs, acceptance

**UserPromptSubmit Hook**:
- **Trigger**: When user sends message
- **Action**: Add test context if relevant
- **Example**: Latest report path, failing test count

---

## Real PayPlan Examples

### Example 1: Analyze T097-T105 Results

**User Prompt**:
```
> Analyze the T097-T105 test results
```

**Claude Response**:
```
I'll use the test-analyzer subagent to analyze T097-T105 results with V4 format.

[Subagent delegation...]

The test-analyzer subagent has completed analysis. Here's the executive summary:

**Status**: ✅ 3 PASS, ❌ 2 FAIL (test infrastructure issues)

**Critical Findings**:
1. Browser Controller V2: WORKING PERFECTLY (100% confidence)
2. T100 failure: Wrong CSS selector (100% confidence)
3. T105 failure: Flawed toast detection (100% confidence)

**Immediate Actions**:
1. Fix T100 selector: 5 min (trivial fix)
2. Add test data setup: 15 min (required for T100)
3. Fix T105 detection: 20 min (add data-testid)

Full report saved to: docs/testing/064-goal-export-test-report-v4.md
```

### Example 2: PostToolUse Hook Triggers

**Scenario**: Edit GoalCard.tsx

**Automatic Flow**:
1. Claude uses Edit tool to modify GoalCard.tsx
2. PostToolUse hook triggers
3. Hook runs: `npm test -- --changed --passWithNoTests`
4. Tests pass → Hook returns exit code 0 → Continue
5. Claude proceeds with next task

**If Tests Fail**:
1. Hook returns exit code 1 → Block
2. Claude receives: "Tests failed: 3 errors in GoalCard.test.ts"
3. Claude automatically analyzes failures
4. Claude fixes issues
5. Hook re-runs tests
6. Loop until tests pass

### Example 3: Stop Hook Prevents Premature Completion

**Scenario**: Claude finishes code changes

**Stop Hook Evaluation**:
```json
{
  "should_continue": true,
  "reason": "Test coverage only 72% (target: 80%)",
  "missing_tasks": [
    "Add tests for exportToICal edge cases",
    "Test PII sanitization in exports",
    "Document manual testing in PR"
  ],
  "test_status": "passing",
  "coverage_met": false
}
```

**Claude Response**:
```
The Stop hook indicates I should continue. Test coverage is 72% but needs 80%.

Let me add the missing tests:
1. Edge case: exportToICal with empty goals array
2. Edge case: PII sanitization (emails, names)
3. Manual testing documentation

[Continues working...]
```

---

## Decision Trees

### Decision Tree 1: Test Failure Analysis

```
TEST FAILS
│
├─ Is it a TIMING issue (timeout, race condition)?
│  └─ YES → Add explicit waits, increase timeout
│     Example: await page.waitForSelector('[data-testid="toast"]', { timeout: 5000 })
│
├─ Is it a SELECTOR issue (element not found)?
│  └─ YES → Verify selector in browser DevTools
│     1. Use test-analyzer subagent for DOM inspection
│     2. Check actual classes (Grep search)
│     3. Add data-testid if missing
│
├─ Is it a DATA issue (missing fixtures, empty state)?
│  └─ YES → Add test data setup
│     1. Create fixtures before test runs
│     2. Populate localStorage with sample data
│     3. Mock API responses
│
└─ Is it an APP BUG?
   └─ ONLY if verified from 4+ sources (95%+ confidence)
      - Source code analysis
      - Browser runtime inspection
      - Unit test validation
      - Grep pattern searches
```

### Decision Tree 2: When to Use Subagent vs Hook

```
TESTING TASK
│
├─ Need IMMEDIATE feedback on code change?
│  └─ YES → Use POSTTOOLUSE HOOK (automatic, fast)
│
├─ Need DEEP ANALYSIS of test results?
│  └─ YES → Use TEST-ANALYZER SUBAGENT (specialized, thorough)
│
├─ Need to CHECK if work is complete?
│  └─ YES → Use STOP HOOK (prompt-based, intelligent)
│
├─ Need EXTERNAL DATA (issues, PRs)?
│  └─ YES → Use MCP TOOLS (just-in-time, current)
│
└─ Need CONTINUOUS MONITORING?
   └─ YES → Use BACKGROUND TASK (non-blocking, real-time)
```

---

## Best Practices

### Structure (V4 Format)

1. ✅ **Executive summary at TOP**
   - Overall status (X PASS, Y FAIL)
   - Critical findings with confidence
   - Immediate actions with time estimates

2. ✅ **Detailed results in MIDDLE**
   - Passing tests (evidence)
   - Failing tests (root cause + fix)
   - Cross-verification from 4+ sources

3. ✅ **Raw data at BOTTOM**
   - Full logs (CDATA wrapped)
   - Debug output
   - Source code snippets
   - Grep results

### Token Efficiency

1. ✅ **High-signal information only**
   - No redundancy
   - No fluff ("as you can see...", "it's worth noting...")
   - Direct, factual statements

2. ✅ **Strategic placement**
   - Critical info at start (strongest attention)
   - Reference data at end (weakest attention)
   - Structured with XML tags

3. ✅ **Just-in-time context**
   - Use MCP tools for external data
   - Don't pre-load everything
   - Fetch as needed during analysis

### Confidence Scoring

| Score | Criteria | Example |
|-------|----------|---------|
| **100%** | Verified from code + runtime | Read GoalCard.tsx + browser snapshot confirms |
| **95%** | Strong evidence, minor assumptions | Grep shows pattern + unit tests confirm |
| **90%** | Reasonable inference | Code suggests behavior, not runtime verified |
| **<90%** | State assumptions explicitly | "Assuming toast duration is 5s based on..." |

**Rule**: Never guess. If confidence <95%, gather more evidence or state assumptions.

### Cross-Verification Methods

**Always use 4+ independent sources**:

1. **Source Code Analysis** (Read tool)
   - Read component files
   - Read test files
   - Read configuration files

2. **Browser Runtime Inspection** (Puppeteer/DevTools)
   - Take snapshots (mcp__puppeteer__take_snapshot)
   - Inspect DOM elements
   - Check console logs

3. **Pattern Searches** (Grep tool)
   - Search for class names
   - Search for data-testid attributes
   - Search for similar patterns

4. **Unit Test Validation** (Read tool)
   - Check test fixtures
   - Verify mock data
   - Review test helpers

---

## Migration from V2 to V4

### What's New in V4?

| Feature | V2 | V4 |
|---------|----|----|
| **Format** | XML structure | ✅ Same (unchanged) |
| **Subagent** | ❌ Manual analysis | ✅ Automated with test-analyzer |
| **Hooks** | ❌ Manual test runs | ✅ Automatic on code changes |
| **MCP Tools** | ❌ Not used | ✅ Just-in-time context loading |
| **Background Tasks** | ❌ Not used | ✅ Continuous test watching |
| **Workflow** | Manual → Analysis → Report | Automated → Analysis → Report |
| **Confidence** | Implicit | ✅ Explicit (95-100%) |
| **Cross-Verification** | 1-2 sources | ✅ 4+ sources mandatory |
| **Time Estimates** | ❌ Missing | ✅ All actions have estimates |

### Migration Steps

1. ✅ **Create test-analyzer subagent** (Stage 1.1)
2. ✅ **Configure hooks** (Stage 1.2)
3. ✅ **Create context injection hook** (Stage 1.3)
4. ✅ **Update test workflow** (Stage 2)
5. ✅ **Start using V4 format** (immediate)

**Timeline**: 1 hour setup (one-time), then automatic from then on.

---

## Conclusion

**V4 Improvements Over V2**:
- ✅ **Automated analysis** with test-analyzer subagent
- ✅ **Automatic test execution** with PostToolUse hooks
- ✅ **Intelligent completion checks** with Stop hooks
- ✅ **Just-in-time context** with MCP tools
- ✅ **Continuous monitoring** with background tasks
- ✅ **Complete workflow** from code change to PR

**Key Takeaway**: V4 isn't just a format—it's a **complete testing workflow** that integrates context engineering principles with Claude Code's advanced features to maximize quality and automate everything possible.

**Next Steps**:
1. Complete Stage 1 setup (1 hour)
2. Test workflow with Feature 064 (15 min)
3. Iterate based on feedback
4. Apply to all future features

---

**Author**: Claude Code (Sonnet 4.5)
**Research Method**: Tavily API direct + Official Claude Code docs
**Validation**: 100% official Anthropic & Claude Code sources
**Status**: ✅ COMPLETE - Ready for PayPlan production use
**Version**: 4.0 (supersedes V2)

