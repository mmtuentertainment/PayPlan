# PayPlan Development Guide for Claude Code

**Last Updated**: 2025-11-08 (Major Update - Context Engineering Guide + Advanced Features)
**Current Phase**: Phase 1 (Pre-MVP, 0-100 users)
**Constitution Version**: 3.1 (Evidence-based: Phased TDD, 8-12 features MVP, 60-80% coverage ramp)
**Codebase Status**: ✅ CLEAN (Feature-based architecture, professionally organized)
**Workflow**: HIL → Manus → Claude Code

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Context Engineering for Claude Code](#context-engineering-for-claude-code-ultimate-guide)
3. [Your Role in the Workflow](#your-role-in-the-workflow)
4. [Current Phase: Phase 1](#current-phase-phase-1-pre-mvp)
5. [Project Overview](#project-overview)
6. [Technology Stack](#technology-stack)
7. [Project Structure](#project-structure-updated-2025-11-02)
8. [Development Workflow](#development-workflow)
9. [Bot Review Loop](#bot-review-loop-critical)
10. [Phase 1 Definition of Done](#phase-1-definition-of-done-updated-v31)
11. [Constitutional Principles](#constitutional-principles-must-follow)
12. [Conflict Resolution](#conflict-resolution)
13. [Mandatory Features](#mandatory-features-post-pivot-roadmap)
14. [Code Standards](#code-standards)
15. [Accessibility Requirements](#accessibility-requirements-immutable)
16. [Privacy Requirements](#privacy-requirements-immutable)
17. [Performance Guidelines](#performance-guidelines-phase-1)
18. [Common Commands](#common-commands)
19. [Tooling Integration](#tooling-integration)
20. [Frequently Asked Questions](#frequently-asked-questions)
21. [Working with the New Folder Structure](#working-with-the-new-folder-structure-2025-11-02)
22. [Resources](#resources)

---

## Quick Start

**You are Claude Code, the AI developer implementing PayPlan features.**

**IMPORTANT**: Workflow has changed (as of 2025-11-04):
- **HIL (Human)**: Provides feature intent and makes decisions
- ~~**Manus (AI PM)**: Creates specifications~~ **TERMINATED**
- **Claude Code (YOU)**: Now responsible for BOTH specification AND implementation

Before implementing any feature:

1. **Create Specification**: Use existing specs as templates (see `specs/062-short-name-dashboard/`, `specs/063-short-name-business/`)
   - `spec.md` - User stories and acceptance criteria
   - `plan.md` - Technical approach and constitutional validation
   - `data-model.md` - TypeScript types and Zod schemas
   - `tasks.md` - Executable task breakdown (atomic, dependency-ordered)
   - `research.md` - Deep research findings (competitor analysis, behavioral psychology)
2. **Read the Constitution**: `memory/constitution.md` (source of truth)
3. **Implement**: Follow Phase 1 requirements (TDD for business logic, manual testing for UI)
4. **Create PR**: NEVER commit directly to main
5. **Bot Review Loop**: Respond to bot feedback until both bots are green
6. **HIL Approval**: Wait for HIL approval before merge

---

## Context Engineering for Claude Code: Ultimate Guide

**Research Date**: 2025-11-08
**Based on**: Anthropic Engineering (Sept 2025) + Official Claude Code Documentation
**Source**: [V3 Comprehensive Research](docs/research/claude-ai-comprehensive-research-v3.md)

---

### Executive Summary (Read This First)

**CRITICAL SHIFT**: Context engineering has replaced prompt engineering as the critical skill.

**Core Challenge**: Find the **smallest possible set of high-signal tokens** that maximize desired outcomes.

**Why This Matters**:
- Claude has a **finite attention budget** that depletes with every token
- **Context rot** occurs as token count increases (recall accuracy decreases)
- **n² pairwise relationships** mean attention gets "stretched thin" with more tokens
- **More context ≠ better performance** (can actually hurt)

**The Solution**: Structure prompts according to attention patterns + use Claude Code's advanced features strategically.

---

### Core Principles (Anthropic Official, Sept 2025)

#### 1. Context Rot & Attention Budget

**Context Rot** (Official Term):
> "LLMs, like humans, lose focus or experience confusion at a certain point... Context rot: as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases."

**Attention Budget** (Official Term):
> "LLMs have an 'attention budget' that they draw on when parsing large volumes of context. Every new token introduced depletes this budget by some amount."

**Implications**:
- Put **critical information at START** (strongest attention)
- Put **raw data at END** (weakest attention, but accessible)
- Keep **middle sections focused** (moderate attention)
- **Every token must justify its existence**

#### 2. The Goldilocks Zone (Official Guidance)

> "The right altitude is the Goldilocks zone between two common failure modes:
> 1. **Too specific**: Hardcoded complex, brittle logic
> 2. **Too vague**: High-level guidance that fails to give concrete signals
>
> **Optimal**: Specific enough to guide behavior effectively, yet flexible enough to provide strong heuristics."

**Application to CLAUDE.md**:
- ✅ Specific examples with code
- ✅ Clear rules with rationale
- ✅ Flexible patterns (not hardcoded solutions)
- ❌ Avoid over-prescriptive step-by-step procedures
- ❌ Avoid vague "do your best" guidance

#### 3. XML Tags - Official Structure

**Why XML** (from official docs):
- **Clarity**: Separate different parts of prompt
- **Accuracy**: Reduce misinterpretation errors
- **Flexibility**: Easy to modify without rewriting
- **Parseability**: Extract specific parts of response

**Structure Pattern**:
```xml
<context>
  Background information, project state, constraints
</context>

<data>
  Relevant code, specs, test results
</data>

<instructions>
  1. Specific tasks
  2. Quality gates
  3. Success criteria
</instructions>

<examples>
  Concrete code examples showing desired patterns
</examples>
```

**Best Practices**:
- Be consistent with tag names
- Nest tags hierarchically (`<outer><inner></inner></outer>`)
- Reference tags explicitly ("Using the contract in `<contract>` tags...")

#### 4. Examples = Pictures (Official Metaphor)

> "For an LLM, examples are the 'pictures' worth a thousand words."

**Implication**:
- Show code examples, don't just describe patterns
- One working example > three paragraphs of explanation
- Examples should be **complete** and **runnable**

---

### Claude Code Advanced Features (When to Use)

#### Subagents (Parallel Specialized Tasks)

**What**: Specialized AI assistants with independent context windows

**When to Use**:
- ✅ **Parallel workflows**: Frontend + backend simultaneously
- ✅ **Specialized expertise**: Code review, testing, debugging
- ✅ **Context preservation**: Keep main conversation focused on high-level goals
- ✅ **Long tasks**: Delegate time-consuming research/analysis
- ❌ **Simple tasks**: Don't spawn subagent for trivial operations

**How to Invoke**:
```bash
# Automatic (Claude decides when appropriate)
> Fix the authentication bug

# Explicit (you request specific subagent)
> Use the code-reviewer subagent to check my recent changes
> Have the test-runner subagent fix failing tests
```

**Configuration** (`.claude/agents/code-reviewer.md`):
```markdown
---
name: code-reviewer
description: Expert code reviewer. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior code reviewer focusing on code quality, security, and best practices.
When invoked, analyze recent changes for:
1. Security vulnerabilities (XSS, SQL injection, CSRF)
2. Accessibility issues (WCAG 2.2 AA compliance)
3. Performance problems (O(n²) algorithms, memory leaks)
4. Code quality (DRY, SOLID, naming conventions)

Provide specific, actionable feedback with code examples.
```

**Key Features**:
- **Separate context window**: Doesn't pollute main conversation
- **Specialized tools**: Can limit to specific tool subset
- **Reusable**: Create once, use across projects
- **Proactive use**: Include "use PROACTIVELY" in description for automatic delegation

**Best Practices** (from docs):
- Use Plan subagent for codebase exploration (built-in)
- Create task-specific subagents (not general-purpose)
- Limit tools to minimum needed (security + performance)
- Use explicit invocation when you want control

#### Hooks (Automation & Quality Gates)

**What**: Bash commands or LLM prompts that execute at specific events

**When to Use**:
- ✅ **Quality gates**: Run tests after code changes
- ✅ **Validation**: Check commit messages, PR descriptions
- ✅ **Automation**: Format code, lint files, run security checks
- ✅ **Context injection**: Add relevant info to user prompts
- ❌ **Slow operations**: Keep hooks fast (<5s) or use background tasks

**Hook Events**:
- `PreToolUse`: Before tool execution (approval, validation)
- `PostToolUse`: After tool execution (tests, linting, formatting)
- `UserPromptSubmit`: When user sends message (context injection, validation)
- `Stop`: When Claude wants to stop (task completion check)
- `SubagentStop`: When subagent wants to stop
- `SessionStart`: When session begins (setup, environment checks)
- `SessionEnd`: When session ends (cleanup, reports)

**Configuration** (`.claude/settings.json`):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint --fix",
            "timeout": 30
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/add-context.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if Claude should stop: $ARGUMENTS. Check if all acceptance criteria from spec.md are met. Return JSON with 'should_continue': true/false and 'reason'."
          }
        ]
      }
    ]
  }
}
```

**Prompt-Based Hooks** (LLM evaluation):
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all tasks are complete: $ARGUMENTS. Verify: 1) Tests passing, 2) Documentation updated, 3) PR created. Return JSON."
          }
        ]
      }
    ]
  }
}
```

**Best Practices**:
- Keep hooks **fast** (<5s execution time)
- Use `$CLAUDE_PROJECT_DIR` for project-specific scripts
- Return JSON for complex decisions
- Use exit codes for simple pass/fail (0=continue, 1=block, 2=warn)
- Hooks run in parallel (design for concurrency)

#### MCP Tools (External Integrations)

**What**: Model Context Protocol - standardized way to connect AI to external systems

**When to Use**:
- ✅ **Just-in-time data**: Fetch documentation, API schemas on demand
- ✅ **External services**: Database queries, API calls, file systems
- ✅ **Dynamic context**: Load data based on conversation flow
- ❌ **Static data**: Pre-load in CLAUDE.md instead

**Examples**:
- `mcp__linear__list_issues`: Fetch Linear issues
- `mcp__github__get_pr`: Get GitHub PR details
- `mcp__fetch__fetch`: Fetch web content with markdown conversion
- `mcp__context7__get-library-docs`: Get up-to-date library documentation

**Configuration** (`~/.claude/mcp.json`):
```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-linear"],
      "env": {
        "LINEAR_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Best Practices**:
- Use MCP for **dynamic** data (changes frequently)
- Pre-load **static** data in CLAUDE.md
- MCP tools inherit to subagents (unless restricted)
- Set reasonable timeouts (`MCP_TOOL_TIMEOUT` env var)

#### Background Tasks (Long-Running Processes)

**What**: Processes that run without blocking Claude's progress

**When to Use**:
- ✅ **Dev servers**: Keep running while coding
- ✅ **Test watchers**: Continuous test execution
- ✅ **Build processes**: Long compilation times
- ✅ **Monitoring**: Log tailing, error tracking
- ❌ **Quick commands**: Use regular Bash tool instead

**How to Use**:
```bash
# Start background task
npm run dev &

# Monitor with BashOutput tool
# Claude can check output periodically without blocking
```

**Best Practices**:
- Use for processes that need to stay alive
- Claude can monitor output and fix crashes
- Use hooks to auto-restart on failure

---

### Optimal Prompt Structure for CLAUDE.md

**Template** (following attention patterns):

```markdown
## [Feature/Section Name]

<!-- EXECUTIVE SUMMARY: At TOP (strongest attention) -->
**Critical Rules** (Read This First):
- ✅ DO THIS: [Most important rule with example]
- ❌ NEVER DO THIS: [Critical prohibition with example]
- ⚠️ ATTENTION: [Common mistake to avoid]

<!-- KEY INFORMATION: Still high attention -->
### When to Use

[Concise decision tree or checklist]

### Quick Reference

| Scenario | Action | Tool/Feature |
|----------|--------|--------------|
| [Scenario] | [Action] | [Subagent/Hook/Tool] |

<!-- DETAILED GUIDANCE: Middle (moderate attention) -->
### Implementation Guide

<context>
  Background: [Why this exists, what problem it solves]
  Constraints: [Important limitations]
</context>

<instructions>
  1. [Specific step with rationale]
  2. [Next step with rationale]
</instructions>

<examples>
```typescript
// ✅ CORRECT: [Explanation]
[Complete working code example]

// ❌ WRONG: [Explanation]
[Anti-pattern example]
```
</examples>

<!-- REFERENCE DATA: Bottom (weakest attention) -->
### Complete API Reference

[Full technical details, all options, edge cases]

### Related Documentation

- [Link to related section]
- [Link to external docs]
```

**Why This Works**:
- **Executive summary** leverages strongest attention (start)
- **Key information** gets high attention (near start)
- **Examples** act as "pictures" (official metaphor)
- **Reference data** at bottom (weak attention, but accessible when needed)
- **XML structure** provides clarity and parseability

---

### Real-World Examples from PayPlan

#### Example 1: Feature Implementation Prompt

**Bad** (violates context engineering):
```markdown
## Feature: Goal Export

Implement goal export feature. Users should be able to export goals. Support multiple formats. Make sure it works well. Follow best practices. Let me know if you have questions.
```

**Issues**:
- Too vague (violates Goldilocks zone)
- No examples (missing "pictures")
- No structure (no XML tags)
- Critical info buried (weak attention)

**Good** (follows context engineering):
```markdown
## Feature: Goal Export

<!-- EXECUTIVE SUMMARY: Critical info at TOP -->
**Critical Rules**:
- ✅ Use iCalendar format for calendar export (RFC 5545 compliant)
- ✅ PII sanitization REQUIRED (emails, names, addresses)
- ❌ NEVER export without user-initiated action
- ⚠️ 5MB localStorage limit - handle gracefully

**When to Use Subagents**:
- Use `code-reviewer` subagent AFTER implementation (proactive)
- Use `test-runner` subagent to validate exports

<!-- STRUCTURED CONTENT -->
<context>
  User Story: As a user, I want to export my goals to different formats so I can track them in external tools.

  Constraints:
  - Privacy-first: localStorage only, no server required
  - Accessibility: WCAG 2.2 AA (keyboard + screen reader)
  - Performance: Export <1s for 100 goals
</context>

<data>
  Existing Code:
  - `features/goals/lib/GoalStorageService.ts` - storage operations
  - `features/goals/types/goal.ts` - Goal interface
  - `shared/lib/privacy.ts` - PII sanitization utilities
</data>

<instructions>
  1. Create export feature in `features/goals/lib/export/`
  2. Support formats: JSON, CSV, iCalendar (RFC 5545)
  3. Write TDD tests FIRST (80%+ coverage required - Phase 1 constitution)
  4. Implement UI in `features/goals/components/GoalExport.tsx`
  5. Manual testing with screen reader (NVDA/VoiceOver)
  6. Create PR (not direct commit)
  7. Run code-reviewer subagent proactively
</instructions>

<examples>
```typescript
// ✅ CORRECT: iCalendar export with PII sanitization
import { sanitizePII } from '@/shared/lib/privacy';
import { createEvents } from 'ics';

export function exportGoalsToICal(goals: Goal[]): string {
  const events = goals.map(goal => ({
    title: sanitizePII(goal.name),
    description: sanitizePII(goal.description),
    start: parseDate(goal.targetDate),
    // ... RFC 5545 compliant fields
  }));

  const { error, value } = createEvents(events);
  if (error) throw new Error(`iCal export failed: ${error}`);
  return value;
}

// ❌ WRONG: No PII sanitization (privacy violation)
export function exportGoalsToICal(goals: Goal[]): string {
  return goals.map(g => g.name).join('\n'); // LEAKS PII!
}
```
</examples>

<!-- REFERENCE DATA at bottom -->
### Technical Specifications

- RFC 5545: https://datatracker.ietf.org/doc/html/rfc5545
- Library: ics@3.8.1 (already in package.json)
- Test Coverage: 80%+ (constitution v3.1 Phase 1)
- Acceptance Criteria: See `specs/064-goal-export/spec.md`
```

#### Example 2: Hook Configuration for Quality Gates

**Scenario**: Automatically run tests after code changes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test -- --changed --passWithNoTests",
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
            "prompt": "Check if Claude should stop working. Verify: 1) All tests passing (check recent test output), 2) Test coverage ≥80% for business logic, 3) Manual UI testing documented in PR. Return JSON: { 'should_continue': boolean, 'reason': string, 'missing_tasks': string[] }"
          }
        ]
      }
    ]
  }
}
```

**Why This Works**:
- `PostToolUse` runs tests automatically (quality gate)
- `Stop` hook uses LLM to intelligently check completion (prompt-based)
- Verifies constitution compliance (Phase 1: 80% business logic coverage)

#### Example 3: Subagent for Test Report Analysis

**Scenario**: Analyze test reports using V3 optimal format

`.claude/agents/test-analyzer.md`:
```markdown
---
name: test-analyzer
description: Analyzes test execution results and creates V3-formatted reports. Use after running test suites.
tools: Read, Grep, Glob, Write
model: sonnet
---

You are a test analysis expert specializing in V3 optimal test report format.

<context_engineering_principles>
  - Executive summary at TOP (strongest attention)
  - Detailed analysis in MIDDLE (moderate attention)
  - Raw data at BOTTOM (weakest attention)
  - Cross-verification from 4+ sources
  - 95-100% confidence scores
</context_engineering_principles>

<task>
When invoked to analyze test results:

1. Read test output files
2. Cross-verify from multiple sources:
   - Source code analysis
   - Browser DOM inspection (if UI tests)
   - Grep searches for relevant patterns
   - Unit test validation
3. Create V3-formatted report with:
   - Executive summary at top (status, key findings, immediate actions)
   - Detailed results in middle (passing/failing tests, root causes)
   - Raw data at bottom (full logs, debug output)
4. Provide confidence scores (95-100% target)
5. Include actionable next steps with time estimates
</task>

<examples>
See: `/home/matt/PROJECTS/PayPlan/docs/research/claude-ai-comprehensive-research-v3.md`
Section 9: "Optimal Test Report Format V3"
</examples>
```

**Usage**:
```bash
> Use the test-analyzer subagent to analyze the T097-T105 test results
```

---

### Decision Tree: When to Use Each Feature

```
START: Need to accomplish a task
│
├─ Is it a SPECIALIZED task (code review, testing, debugging)?
│  └─ YES → Use SUBAGENT (parallel context, specialized expertise)
│
├─ Need AUTOMATION at specific event (after code change, before commit)?
│  └─ YES → Use HOOK (PostToolUse, PreToolUse, etc.)
│
├─ Need EXTERNAL data (API, database, documentation)?
│  └─ YES → Use MCP TOOL (just-in-time context)
│
├─ Is it a LONG-RUNNING process (dev server, test watcher)?
│  └─ YES → Use BACKGROUND TASK (non-blocking execution)
│
└─ Is it a SIMPLE, QUICK task?
   └─ YES → Use REGULAR TOOLS (Bash, Read, Write, Edit)
```

**Examples by Scenario**:

| Scenario | Feature | Why |
|----------|---------|-----|
| Review code after PR creation | Subagent (`code-reviewer`) | Specialized expertise, separate context |
| Run tests after code changes | Hook (`PostToolUse`) | Automatic quality gate |
| Fetch latest React docs | MCP Tool (`context7`) | Just-in-time, always current |
| Keep dev server running | Background Task | Long-running, non-blocking |
| Read a file | Regular Tool (`Read`) | Simple, quick operation |
| Analyze complex test failure | Subagent (`test-analyzer`) | Needs deep analysis, cross-verification |
| Lint code before commit | Hook (`PreToolUse` or `PostToolUse`) | Automatic validation |
| Check task completion | Hook (`Stop` with prompt) | Intelligent decision with LLM |

---

### Best Practices Summary

**Structure** (from V3 research):
1. ✅ Executive summary at TOP (critical info first)
2. ✅ Use XML tags for clarity (`<context>`, `<instructions>`, `<examples>`)
3. ✅ Examples = Pictures (show, don't just tell)
4. ✅ Reference data at BOTTOM (accessible but not prominent)

**Token Efficiency** (from Anthropic Sept 2025):
1. ✅ Every token must justify its existence
2. ✅ High-signal information only
3. ✅ Remove redundancy aggressively
4. ✅ Use just-in-time context (MCP tools, subagents)

**Claude Code Features** (from official docs):
1. ✅ Use subagents for specialized tasks
2. ✅ Use hooks for automation & quality gates
3. ✅ Use MCP tools for external data
4. ✅ Use background tasks for long processes
5. ✅ Configure proactively (don't wait for explicit requests)

**Goldilocks Zone** (from Anthropic):
1. ✅ Specific examples with code
2. ✅ Clear rules with rationale
3. ✅ Flexible patterns (not hardcoded)
4. ❌ Avoid over-prescription
5. ❌ Avoid vague guidance

---

### Resources

**Research Documents**:
- [V3 Comprehensive Research](docs/research/claude-ai-comprehensive-research-v3.md) - Sept 2025 Anthropic findings
- [V2 Optimal Test Report Format](docs/research/claude-ai-optimal-test-format-v2.md) - Test report structure

**Official Documentation**:
- [Anthropic Engineering: Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Sept 29, 2025
- [Claude Docs: XML Tags](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)
- [Claude Code: Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Claude Code: Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code: MCP](https://docs.claude.com/en/docs/claude-code/mcp)

**PayPlan Examples**:
- `.claude/agents/` - Subagent configurations
- `.claude/settings.json` - Hook configurations
- `specs/063-short-name-business/` - Complete spec example

---

## Your Role in the Workflow

### The Updated Workflow (as of 2025-11-04)

```
HIL (Human) → Claude Code (You: Spec + Code) → Bot Reviews → HIL Approval
    ↓                      ↓                          ↓             ↓
  Intent          Specs + Implementation        Feedback        Merge
```

**Note**: Manus (AI PM) has been terminated. You now handle BOTH specification creation AND implementation.

### Your Expanded Responsibilities (Claude Code)

**YOU NOW DO:**
- ✅ **Create specifications** (use existing specs as templates)
- ✅ **Do deep research** (competitor analysis, behavioral psychology, UX patterns)
- ✅ **Validate against constitution** (before implementation)
- ✅ **Implement code** following your own specs
- ✅ **Create PR** (not direct commit to main)
- ✅ **Respond to bot review feedback**
- ✅ **Fix CRITICAL and HIGH issues immediately**
- ✅ **Fix all MEDIUM/LOW issues** (don't defer unless HIL approves)
- ✅ **Iterate until both bots approve** (Claude Code Bot + CodeRabbit AI)
- ✅ **Wait for HIL approval** before merging

**YOU STILL DO NOT:**
- ❌ Make unconstitutional decisions (Privacy, Accessibility, Free Core are IMMUTABLE)
- ❌ Choose different libraries (stack is mandated in constitution)
- ❌ Merge without bot approval
- ❌ Skip bot review loop

### How to Create Specifications

**Use existing specs as templates**:
- Best template: `specs/063-short-name-business/` (most recent, comprehensive)
- Secondary: `specs/062-short-name-dashboard/` (feature implementation example)

**Follow Spec-Kit structure**:
1. `spec.md`: User stories (INVEST format), acceptance criteria, independent tests
2. `plan.md`: Technical approach, constitutional validation, risk analysis
3. `data-model.md`: TypeScript interfaces, Zod schemas, storage keys
4. `research.md`: Competitor analysis (YNAB, Monarch, PocketGuard), behavioral research
5. `tasks.md`: Atomic tasks, dependency-ordered, parallelization opportunities
6. `quickstart.md`: Developer quick-start, code examples

**Research requirements**:
- Competitor analysis (how do YNAB/Monarch/PocketGuard solve this?)
- Behavioral psychology (what drives user behavior?)
- Accessibility patterns (WCAG 2.1 AA compliance)
- Constitutional compliance check (Privacy, Accessibility, Free Core)

---

## Current Phase: Phase 1 (Pre-MVP)

**Goal**: Ship 8 table-stakes features in 12 weeks to reach market competitiveness

**Phase 1 Priorities** (Constitution v3.1 - UPDATED):
- ✅ **TDD for Business Logic**: 80% coverage for `lib/**/*.ts` (phased ramp: 60%→70%→80%)
- ✅ **Financial Logic**: 90%+ coverage ALWAYS (money calculations are critical!)
- ✅ **Overall Coverage**: 40-60% minimum (business logic 80% + UI 0% = weighted)
- ✅ **Ship 8-12 MVP features**: Focus on core features, validate market need
- ✅ **Accessibility**: WCAG 2.2 AA compliance (updated from 2.1)
- ✅ **Privacy**: localStorage-first, no auth required
- ✅ **Simple solutions**: YAGNI principle, avoid over-engineering

**Phase 1 TDD Approach** (Phased Transition):
- **Weeks 1-2**: Test-after (write code, then tests) - learning phase
- **Weeks 3-6**: Hybrid (some TDD, some test-after) - transition
- **Week 7+**: Strict TDD (write tests first) - full adoption

**Phase 1 NOT Required**:
- ❌ TDD for UI components (manual testing acceptable)
- ❌ Integration test suite (defer to Phase 2)
- ❌ E2E tests (defer to Phase 2)
- ❌ Performance optimization (defer to Phase 4, optimize if users complain)

---

## Project Overview

**What is PayPlan?**

PayPlan is a **privacy-first budgeting app** designed to help **low-income earners** build healthy financial habits and take control of their money. We provide comprehensive budgeting tools with visual dashboards, goal tracking, and gamification.

**The Pivot** (October-November 2025):
- **Was**: BNPL-focused debt management app
- **Now**: Pure budgeting app (BNPL features removed Nov 2025)
- **Reason**: Direct BNPL API integration impossible; pivot to core budgeting value
- **Strategy**: Best-in-class budgeting features for 30M Gen Z users living paycheck-to-paycheck

**Target Users**:
- Low-income earners (18-35 year-olds) living paycheck-to-paycheck
- People who need simple, fast, visual budgeting (not YNAB power users)
- Users who want privacy-first finance tools (no bank sync required)
- 80% of Gen Z uses budgeting apps = 40 million potential users

**Unique Value Propositions**:
1. **Privacy-First**: localStorage-only, no auth required (vs. competitors requiring bank sync)
2. **Free Core**: All budgeting features free forever (vs. YNAB $109/year)
3. **Visual-First**: Charts and gamification (vs. YNAB's spreadsheet complexity)
4. **Accessibility-First**: WCAG 2.1 AA from day one
5. **Automation-First**: Smart categorization, recurring bill detection
6. **Gamification**: Streaks, insights, wins to build habits (vs. boring spreadsheets)

**Competitive Positioning**:
- **vs. YNAB**: Simpler (<5 min onboarding vs 30 min), visual-first, free core
- **vs. Monarch/PocketGuard**: Privacy-first (no bank sync required), completely free
- **vs. Mint**: Still works (Mint shut down), privacy-first, modern UX

---

## Technology Stack

### Core Technologies

**Frontend**:
- React 19.1.1 (UI framework)
- TypeScript 5.8.3 (type safety, strict mode)
- Tailwind CSS 4.1.13 (utility-first styling)
- Radix UI (accessible component primitives)
- @radix-ui/react-icons 1.3.2 (icon library for UI components)
- Recharts (data visualization - MANDATED, do not use Chart.js or alternatives)
- Vite 6.1.9 (build tool)

**Storage**:
- localStorage (primary, privacy-first)
- Supabase (optional, for premium sync/collaboration)

**Libraries**:
- Zod 4.1.11 (schema validation)
- PapaParse 5.5.3 (CSV parsing)
- uuid 13.0.0 (unique IDs)
- React Router 7.0.2 (client-side routing)
- date-fns 4.1.0 (date manipulation and formatting)
- luxon 3.7.2 (date/time manipulation alternative)
- react-aria 3.44.0 (accessible UI primitives)
- react-focus-lock 2.13.6 (focus management for modals)
- sonner 2.0.7 (toast notifications)
- ics 3.8.1 (iCalendar format generation)

**Testing** (Phase 2+):
- Vitest 3.2.4 (unit/integration tests)
- Playwright (E2E tests)
- Testing Library (React component tests)
- axe-core (accessibility tests)

**Deployment**:
- Vercel (hosting)
- GitHub Actions (CI/CD)

---

## Project Structure (UPDATED 2025-11-02)

**IMPORTANT**: PayPlan now uses **feature-based architecture** (reorganized 2025-11-02)

```
PayPlan/
├── frontend/
│   ├── src/
│   │   ├── features/              # ⭐ FEATURE-BASED ARCHITECTURE
│   │   │   ├── categories/        # Spending categories feature (Tier 0 MVP #1)
│   │   │   │   ├── components/    # CategoryCard, CategoryForm, CategoryList...
│   │   │   │   ├── hooks/         # useCategories
│   │   │   │   ├── lib/           # CategoryStorageService, schemas, constants
│   │   │   │   ├── types/         # category.ts
│   │   │   │   └── index.ts       # ✨ Barrel export (public API)
│   │   │   ├── budgets/           # Budget creation feature (Tier 0 MVP #2)
│   │   │   │   ├── components/, hooks/, lib/, types/, index.ts
│   │   │   ├── dashboard/         # Dashboard with charts (Tier 0 MVP #3)
│   │   │   │   ├── components/, hooks/, lib/, types/, index.ts
│   │   │   ├── transactions/      # Transaction entry (Tier 0 MVP #8)
│   │   │   │   ├── components/, lib/, types/, index.ts
│   │   │   └── archive/           # Transaction archives
│   │   │       ├── components/, hooks/, lib/, index.ts
│   │   ├── shared/                # Shared across features
│   │   │   ├── components/        # UI kit (Button, Alert, LoadingSpinner...)
│   │   │   ├── lib/               # Utils, CSV, API, validation, telemetry
│   │   │   ├── hooks/             # Shared custom hooks
│   │   │   └── types/             # Shared types (bill, goal)
│   │   ├── pages/                 # Route components
│   │   ├── App.tsx, main.tsx      # Entry points
│   │   └── routes.ts              # Route definitions
│   ├── public/                    # Static assets
│   └── package.json
├── docs/                          # ⭐ ALL DOCUMENTATION ORGANIZED
│   ├── research/                  # Competitor analysis (15 files)
│   ├── testing/                   # Test reports (8 files)
│   ├── architecture/              # ADRs (Architecture Decision Records)
│   ├── bugs/                      # Critical bug documentation
│   ├── constitution/              # Constitution research
│   └── archive/                   # Old files (safely archived)
├── specs/                         # Feature specifications (10 active specs)
│   ├── 061-spending-categories-budgets/
│   │   ├── spec.md, plan.md, tasks.md, data-model.md, research.md
│   ├── 062-short-name-dashboard/
│   └── ...
├── memory/
│   └── constitution.md            # ⚠️ READ THIS FIRST (v3.1)
├── tools/                         # Development tools
│   └── codebase-architect/        # Codebase analysis tool
├── .claude/
│   └── commands/                  # Spec-Kit slash commands
├── CLAUDE.md                      # This file
├── CONTRIBUTING.md                # ⭐ NEW: Structure guide for contributors
└── README.md
```

**⚠️ CRITICAL**: Use the NEW feature-based structure when looking for files!
- Old: `src/components/categories/` ❌ NO LONGER EXISTS
- New: `src/features/categories/components/` ✅ CORRECT

### Barrel Exports (Clean Imports)

**Each feature has an `index.ts` barrel export for clean imports:**

```typescript
// ✅ CORRECT: Clean imports using barrel exports
import { CategoryCard, useCategories } from '@/features/categories';
import { BudgetCard, useBudgets } from '@/features/budgets';
import { GamificationWidget, useDashboardData } from '@/features/dashboard';
import { TransactionCard } from '@/features/transactions';
import { ArchiveService } from '@/features/archive';

// ❌ AVOID: Long verbose paths (still work, but not recommended)
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import { useCategories } from '@/features/categories/hooks/useCategories';
```

**Benefits:**
- Clean, concise imports
- Single source of truth for public API
- Easy to see what each feature exports
- Better encapsulation

---

## Development Workflow

### Spec-Kit Workflow (Full SDD)

**IMPORTANT**: We use **full Spec-Kit workflow for ALL features** (no tiers, no shortcuts).

**Rationale**: Specifications are source of truth, code is disposable. Complete specs ensure:
- Constitutional compliance (privacy, accessibility, performance)
- Quality gates (bot reviews, HIL approval)
- Permanent documentation (code changes, specs don't)

**Full Workflow** (for every feature):
1. **Claude Code (you)** runs `/speckit.specify` → creates `spec.md`
2. **Claude Code (you)** runs `/speckit.clarify` → resolves ambiguities with deep research
3. **Claude Code (you)** runs `/speckit.plan` → creates `plan.md`, `data-model.md`, `research.md`
4. **Claude Code (you)** runs `/speckit.tasks` → creates `tasks.md`, `checklist.md`
5. **Claude Code (you)** runs `/speckit.implement` → generates code from specs
6. **Claude Code (you)** creates PR → bot review loop → HIL approval → merge

**You create**:
- Complete specifications in `specs/[number]-[feature-name]/`
- All implementation code
- Pull requests with bot review responses

**You do NOT**:
- Skip spec files (all are required)
- Skip constitutional validation
- Make decisions that violate IMMUTABLE principles (Privacy, Accessibility, Free Core)

---

### Thinking Modes (By Feature Complexity)

**Simple Features (Tier 0)**:
- Use default thinking mode
- Quick implementation, minimal planning

**Medium Features (Tier 1)**:
- Use `think` mode for specification
- Consider edge cases, accessibility

**Complex Features (Tier 2)**:
- Use `think hard` mode for planning
- Evaluate multiple approaches
- Consider security, performance, scalability

**Critical Features** (authentication, payments, data migration):
- Use `think harder` or `ultrathink` mode
- Exhaustive analysis of risks
- Multiple validation passes

---

### Architecture Decision Records (ADRs)

**When to Create an ADR**:

Create an Architecture Decision Record for:
- ✅ **Major refactors** (type system changes, validation strategy changes)
- ✅ **Architectural patterns** (interface-first vs schema-first)
- ✅ **Technology choices** (library selection, framework decisions)
- ✅ **Cross-cutting concerns** (error handling, date arithmetic)
- ✅ **Breaking changes** (API changes, storage format changes)

**ADR Process**:

1. **Identify the decision**: Recognize that you're making an architectural choice
2. **Document the context**: What problem led to this decision?
3. **Record the decision**: What did we decide to do?
4. **Explain the rationale**: Why this approach over alternatives?
5. **Note consequences**: What are the positive, negative, and neutral outcomes?

**ADR Location**: `docs/architecture/decisions/`

**ADR Template**: See [docs/architecture/decisions/README.md](docs/architecture/decisions/README.md)

**Examples**:
- [ADR 001: Interface-First Type Strategy](docs/architecture/decisions/001-interface-first-type-strategy.md) - TypeScript interfaces vs z.infer types
- [ADR 002: Canonical Zod Schema Locations](docs/architecture/decisions/002-canonical-zod-schema-locations.md) - Single source of truth for schemas
- [ADR 003: Date Arithmetic - setMonth() Boundary Handling](docs/architecture/decisions/003-date-arithmetic-setmonth-boundary-handling.md) - JavaScript Date.setMonth() bug handling

**Best Practices**:
- ADRs are **immutable** - once accepted, they document historical decisions
- If a decision changes, create a new ADR that supersedes the old one
- Link ADRs to related PRs, commits, and features
- Keep ADRs concise but comprehensive (context + decision + rationale + consequences)

---

### Git Workflow

**Branch Naming**:
- Feature branches: `feature/XXX-feature-name` (e.g., `feature/020-spending-categories`)
- Bugfix branches: `bugfix/issue-description`
- Hotfix branches: `hotfix/critical-issue`

**Commit Messages** (Conventional Commits):
- Format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Examples:
  - `feat(categories): Add spending category creation UI`
  - `fix(budget): Fix budget progress bar calculation`
  - `refactor(storage): Extract localStorage utilities`
  - `docs(readme): Update installation instructions`

**Pull Request Requirements**:
- Constitution compliance verified
- Manual testing completed
- Accessibility tested (screen reader + keyboard nav)
- **Bot reviews passed** (both Claude Code Bot + CodeRabbit AI green)
- **HIL approval** (human final review)
- CLAUDE.md updated (if tech stack changed)
- **ADRs created** (if major architectural decisions were made)

**IMPORTANT**: ALWAYS create PR, NEVER commit directly to main

---

## Bot Review Loop (CRITICAL)

### Overview

After you create a PR, an automated bot review loop begins. **You MUST iterate until both bots are green before HIL can review.**

### The Process

```
1. You create PR
   ↓
2. Bots review (Claude Code Bot + CodeRabbit AI)
   ↓
3. You analyze feedback → categorize (CRITICAL, HIGH, MEDIUM, LOW)
   ↓
4. You fix CRITICAL + HIGH immediately
   ↓
5. You create Linear tasks for MEDIUM + LOW (defer)
   ↓
6. You commit fixes to PR branch
   ↓
7. Bots re-review (triggered by new commit)
   ↓
8. Repeat 3-7 until BOTH bots are GREEN
   ↓
9. Notify HIL for final review
   ↓
10. HIL approves → Manus merges PR
```

### Categorizing Bot Feedback

**CRITICAL** (Fix immediately):
- Security vulnerabilities
- Privacy violations (localStorage leaks, tracking)
- Accessibility blockers (keyboard trap, no ARIA labels)
- Constitution violations (using wrong library, wrong data storage)

**HIGH** (Fix immediately):
- Performance issues (>5s load time)
- Accessibility issues (contrast ratio, missing alt text)
- Error handling gaps (unhandled exceptions)
- Data validation missing (no Zod schema)

**MEDIUM** (Defer to Linear):
- Code quality improvements (refactoring suggestions)
- Minor accessibility improvements (better ARIA descriptions)
- Performance optimizations (not blocking)
- Documentation improvements

**LOW** (Defer to Linear):
- Code style suggestions
- Minor refactoring
- Nice-to-have features
- Future optimizations

### Responding to Bot Feedback

**For CRITICAL + HIGH:**
1. Fix the issue in your code
2. Commit with descriptive message: `fix(scope): address bot feedback - [description]`
3. Push to PR branch
4. Wait for bots to re-review

**For MEDIUM + LOW:**
1. Create Linear issue with:
   - Title: `[Bot Suggestion] [description]`
   - Label: `bot-suggestion`
   - Link to parent feature issue
   - Priority: medium or low
2. Comment on PR: "Deferred to [Linear issue URL]"

### Quality Gates (All Must Pass)

**PR can only be merged when:**
- ✅ Claude Code Bot: GREEN (approved)
- ✅ CodeRabbit AI: GREEN (approved)
- ✅ All CRITICAL issues: FIXED
- ✅ All HIGH issues: FIXED
- ✅ MEDIUM/LOW issues: Fixed OR deferred to Linear
- ✅ HIL: APPROVED (final human review)

**NO SHORTCUTS**: Do not merge until all quality gates pass. No exceptions.

---

## Phase 1 Definition of Done (UPDATED v3.1)

**A feature is "done" when**:

1. ✅ **Functional**: Feature works as described in spec/issue
2. ✅ **TDD for Business Logic**: All `lib/**/*.ts` files have tests (80% coverage target)
3. ✅ **Financial Logic Tested**: Money calculations have 90%+ coverage (CRITICAL)
4. ✅ **Overall Coverage**: 40-60% minimum (phased ramp: 60%→70%→80%)
5. ✅ **Manual UI Testing**: UI tested manually, screenshots in PR, acceptance criteria met
6. ✅ **Accessibility**: Screen reader tested (NVDA/VoiceOver), keyboard navigation works, WCAG 2.2 AA
7. ✅ **Privacy**: No PII leaks, localStorage-first
8. ✅ **Error Handling**: User-friendly error messages with recovery guidance
9. ✅ **Responsive**: Works on mobile, tablet, desktop
10. ✅ **Documented**: README/docs updated (if needed)

**TDD Required (v3.1)**:
- ✅ Business logic (`features/*/lib/**/*.ts`) - Write tests BEFORE or WITH code
- ✅ Calculations (budgets, categories, etc.) - Test-first mandatory
- ✅ Storage services - Test CRUD operations
- ✅ Schemas (Zod validation) - Test edge cases

**NOT required in Phase 1**:
- ❌ TDD for UI components (manual testing acceptable)
- ❌ Integration tests (defer to Phase 2)
- ❌ E2E tests (defer to Phase 2)
- ❌ Performance benchmarks (defer to Phase 4)

---

## Constitutional Principles (MUST FOLLOW)

### Immutable Principles (Highest Priority)

1. **Privacy-First** (Principle I):
   - localStorage default, no auth required
   - Explicit consent for server features
   - PII sanitization in exports/logs
   - No tracking without opt-in

2. **Accessibility-First** (Principle II):
   - WCAG 2.1 AA compliance
   - Screen reader compatible
   - Keyboard navigation
   - Color contrast (4.5:1 text, 3:1 UI)
   - ARIA labels on interactive elements

3. **Free Core** (Principle III):
   - All budgeting features free forever
   - Premium features: bank sync, AI categorization, investments, multi-user

### Product Principles

4. **Visual-First** (Principle IV):
   - Every financial concept has a chart
   - Color-coded status (green/yellow/red)
   - Progress bars for budgets/goals/debts
   - Dashboard as primary view

5. **Mobile-First** (Principle V):
   - Design for small screens first
   - Touch-friendly UI (44x44px targets)
   - PWA support (offline, installable)

6. **Quality-First** (Principle VI, Phased - UPDATED v3.1):
   - **Phase 1**: TDD for business logic (60-80% coverage), manual UI testing, ship with quality
   - **Phase 2**: Add integration tests, 70-80% overall coverage
   - **Phase 3**: Full TDD for all code, 80-90% coverage
   - **Phase 4**: Enterprise quality, 90%+ coverage

7. **Simplicity/YAGNI** (Principle VII):
   - Small features (<2 weeks)
   - Incremental delivery
   - Clear purpose for every feature
   - Avoid over-engineering

---

## Conflict Resolution

**When principles conflict, use this hierarchy**:

1. **IMMUTABLE Principles** (Privacy, Accessibility, Free Core)
2. **Phase Requirements** (Phase 1: Ship fast, manual testing)
3. **Product Principles** (Visual-First, Mobile-First, Simplicity)
4. **Quality Principles** (Phased by user count)

**Example**:
- "Should we add analytics?" → NO (Privacy-First > Product insights)
- "Should we write tests for business logic?" → YES (Phase 1 v3.1: TDD required for lib/**/*)
- "Should we write tests for UI?" → NO (Phase 1: Manual UI testing acceptable)
- "Should we optimize this chart?" → ONLY IF users complain (Phase 1: Velocity > Performance)

---

## Mandatory Features (Post-Pivot Roadmap)

**Epic**: MMT-60 - Budgeting App MVP

**Strategy**: Build best-in-class budgeting features with visual dashboards and gamification.

---

### Phase 1: P0 Features (Weeks 1-4) - Core Budgeting

**Goal**: Achieve competitive parity with YNAB, Monarch, PocketGuard

1. **MMT-61: Spending Categories & Budget Creation** (Week 1)
   - Pre-defined + custom categories
   - Monthly budget limits per category
   - Rollover support
   - Budget alerts (approaching/exceeded)
   - Pie chart visualization
   - **Status**: Spec complete, ready for implementation

2. **MMT-62: Manual Transaction Entry & Editing** (Week 1-2)
   - Quick-add form (<15s entry time)
   - Transaction editing/deletion
   - Search and filter
   - Zod validation
   - **Status**: Next to spec

3. **MMT-62: Dashboard with Charts** (Week 2-3)
   - Spending by category (pie chart)
   - Income vs. expenses (bar chart)
   - Recent transactions widget
   - Upcoming bills widget
   - Goal progress widget
   - Gamification widget (streaks, insights, wins)
   - **Status**: COMPLETE (Chunk 6 in PR #63)

4. **MMT-64: Goal Tracking** (Week 3)
   - Create/edit savings goals
   - Progress bars with percentages
   - Target dates
   - Goal completion celebrations
   - **Status**: Pending spec

---

### Phase 2: P1 Features (Weeks 5-8) - Enhanced Functionality

**Goal**: Add analytics, automation, and smart features

5. **MMT-64: Goal Tracking** (Week 5)
   - Create/edit savings goals
   - Progress bars with percentages
   - Target dates
   - Goal completion celebrations
   - **Status**: Pending spec

6. **MMT-65: Recurring Bill Management** (Week 6)
   - Recurring transaction generator
   - Pattern detection (auto-detect subscriptions)
   - Price change alerts
   - **Status**: Pending spec

7. **MMT-66: Budget Analytics & Insights** (Week 7-8)
   - Monthly summaries
   - Overspending alerts
   - Trend analysis (3, 6, 12 months)
   - Export reports (PDF, CSV)
   - **Status**: Pending spec

---

### Phase 3: Premium Features (Weeks 9-16) - Differentiation

8. **Bank Account Sync** (Premium, Plaid integration)
9. **AI-Powered Categorization** (Premium, OpenAI API)
10. **Investment Tracking** (Premium)
11. **Multi-User Collaboration** (Premium, requires auth)

---

### Current Focus

**Active**: MMT-61 (Spending Categories & Budgets) - Spec complete, awaiting Claude Code implementation

**Next**: MMT-62 (Manual Transaction Entry) - Manus will create spec

**Timeline**: 14-21 days for P0 features (aggressive but achievable with full Spec-Kit workflow)

---

## Code Standards

### TypeScript

- **Strict mode enabled**: No `any` types (use `unknown` and narrow)
- **Explicit return types**: On all public functions
- **Interface over type**: For object shapes
- **Zod for validation**: All user inputs validated with Zod schemas

**Example**:
```typescript
// ✅ GOOD
interface SpendingCategory {
  id: string;
  name: string;
  color: string;
  budget?: number;
}

function createCategory(data: unknown): SpendingCategory {
  const schema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-F]{6}$/i),
    budget: z.number().positive().optional(),
  });
  
  const validated = schema.parse(data);
  return {
    id: uuid(),
    ...validated,
  };
}

// ❌ BAD
function createCategory(data: any) {
  return {
    id: uuid(),
    ...data,
  };
}
```

---

### React

- **Functional components only**: No class components
- **Custom hooks**: For reusable logic
- **Context for global state**: No Redux unless needed
- **Memoization**: For expensive computations (use `useMemo`, `useCallback`)

**Example**:
```typescript
// ✅ GOOD
function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const categoryTotals = useMemo(() => {
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [transactions]);

  return <PieChart data={Object.entries(categoryTotals)} />;
}

// ❌ BAD (recalculates on every render)
function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return <PieChart data={Object.entries(categoryTotals)} />;
}
```

---

### CSS (Tailwind)

- **Utility-first approach**: Use Tailwind classes
- **Custom CSS only when needed**: For complex animations, gradients
- **Mobile-first media queries**: `sm:`, `md:`, `lg:`, `xl:`
- **Accessible colors**: 4.5:1 contrast for text, 3:1 for UI

**Example**:
```tsx
// ✅ GOOD
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Create Budget
</button>

// ❌ BAD (custom CSS for simple button)
<button className="custom-button">Create Budget</button>
```

---

### Naming Conventions

- **Files**: `kebab-case.tsx` (components: `PascalCase.tsx`)
- **Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

**Examples**:
- `spending-chart.tsx` (utility)
- `SpendingChart.tsx` (component)
- `useSpendingData.ts` (custom hook)
- `MAX_BUDGET_LIMIT` (constant)
- `SpendingCategory` (interface)

---

## Accessibility Requirements (IMMUTABLE)

**Every feature MUST meet WCAG 2.1 Level AA**:

1. **Keyboard Navigation**:
   - All interactive elements accessible via Tab
   - Enter/Space to activate
   - Arrow keys for lists/menus
   - Escape to close modals

2. **Screen Reader Support**:
   - ARIA labels on all interactive elements
   - ARIA live regions for dynamic content
   - Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)

3. **Color Contrast**:
   - Text: 4.5:1 minimum
   - UI components: 3:1 minimum
   - Don't rely on color alone (use icons + text)

4. **Focus Management**:
   - Visible focus indicators
   - Logical focus order
   - Focus trapped in modals

5. **Reduced Motion**:
   - Respect `prefers-reduced-motion`
   - Disable animations for users who request it

**Testing**:
- Manual screen reader testing (NVDA on Windows, VoiceOver on Mac)
- Keyboard-only navigation testing
- Color contrast checker (WebAIM Contrast Checker)

---

## Privacy Requirements (IMMUTABLE)

1. **localStorage-First**:
   - All core features work with localStorage only
   - No server required for budgeting features
   - 5MB storage limit (browser default)

2. **PII Sanitization**:
   - Sanitize emails, names, addresses, SSNs before export
   - Use regex patterns + word boundaries
   - Sanitize logs and telemetry

3. **No Tracking by Default**:
   - No analytics without explicit opt-in
   - No third-party trackers
   - No fingerprinting

4. **Explicit Consent**:
   - Server features (sync, backup) require opt-in
   - Clear privacy disclosure
   - Granular consent (analytics, sync, telemetry separate)

5. **Data Ownership**:
   - Full export capability (JSON, CSV)
   - Full deletion capability
   - No data retention after deletion

---

## Performance Guidelines (Phase 1)

**Phase 1: No performance targets** (optimize only if users complain)

**Manual Testing**:
- Features must feel responsive during manual testing
- Page loads should not feel "obviously slow" (>5s)
- Charts should render without noticeable lag

**Allowed in Phase 1**:
- ✅ Unoptimized images (optimize later if needed)
- ✅ Blocking JavaScript (optimize later if needed)
- ✅ No lazy loading (optimize later if needed)

**Prohibited in Phase 1**:
- ❌ Features that feel obviously slow during manual testing

---

## Common Commands

### Development

```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Testing (Phase 1+ - NOW REQUIRED)

```bash
# Run all tests
npm test

# Run specific test file
npm test -- gamification.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for TDD)
npm test -- --watch

# Run tests for specific feature
npm test features/categories

# Generate HTML coverage report
npm run test:coverage
# View: frontend/coverage/index.html

# Run E2E tests (Phase 2+)
npm run test:e2e

# Run accessibility tests (Phase 2+)
npm run test:a11y
```

---

## Testing Guide (Feature #063)

### Phase 1 TDD Requirements (Constitution v3.1)

**You MUST write tests for**:
- ✅ **Business logic** (`features/*/lib/**/*.ts`) - 80% coverage target
- ✅ **Financial calculations** - 90%+ coverage required (money is critical!)
- ✅ **Storage services** - Test CRUD operations, 80%+ target
- ✅ **Schemas (Zod)** - Test validation rules, 90%+ coverage required

**You do NOT need tests for**:
- ❌ **UI components** - Manual testing acceptable (Phase 1)
- ❌ **Integration tests** - Defer to Phase 2
- ❌ **E2E tests** - Defer to Phase 2

---

### Writing Tests (TDD Pattern)

**Follow RED-GREEN-REFACTOR workflow**:

```typescript
// 1. RED: Write the test first (fails - function doesn't exist yet)
import { describe, it, expect } from 'vitest';
import { calculateBudgetProgress } from '../calculations';

describe('calculateBudgetProgress', () => {
  it('should return 50% when half of budget spent', () => {
    const result = calculateBudgetProgress(50000, 100000); // $500 spent, $1000 budget
    expect(result).toBe(50);
  });
});

// 2. Run test: npm test -- calculations.test.ts
// Expected: FAIL (function doesn't exist)

// 3. GREEN: Write minimal code to pass
export function calculateBudgetProgress(spent: number, budget: number): number {
  return (spent / budget) * 100;
}

// 4. Run test again: npm test -- calculations.test.ts
// Expected: PASS

// 5. REFACTOR: Add edge case handling
export function calculateBudgetProgress(spent: number, budget: number): number {
  if (budget === 0) throw new Error('Budget cannot be zero');
  if (budget < 0) throw new Error('Budget cannot be negative');
  return (spent / budget) * 100;
}

// 6. Add more tests for edge cases
it('should throw on zero budget', () => {
  expect(() => calculateBudgetProgress(100, 0)).toThrow('Budget cannot be zero');
});

it('should throw on negative budget', () => {
  expect(() => calculateBudgetProgress(100, -50)).toThrow('Budget cannot be negative');
});
```

---

### Using Test Fixtures

**Feature #063 provides reusable fixtures for all business logic tests**:

```typescript
// Import fixtures using @/ alias (cleaner than relative paths)
import { createCategory } from '@/features/categories/lib/__tests__/fixtures/category-fixtures';
import { createBudget } from '@/features/budgets/lib/__tests__/fixtures/budget-fixtures';
import { createExpense, createIncome } from '@/features/transactions/lib/__tests__/fixtures/transaction-fixtures';
import { sharedFixtures } from '@/tests/fixtures/shared-fixtures';

// Note: @/ alias resolves to frontend/src/ (configured in vite.config.ts)
// Prefer @/ over relative paths like ../../../../../tests/fixtures/shared-fixtures

// Create test data with defaults
const category = createCategory(); // Uses defaults (Groceries, green color, etc.)

// Override specific fields
const customCategory = createCategory({
  name: 'Transportation',
  color: sharedFixtures.colors.blue
});

// Create related entities
const budget = createBudget({
  amount: 50000, // $500.00
  categoryId: category.id
});

const expense = createExpense({
  amount: 10000, // $100.00
  categoryId: category.id,
  date: '2025-11-04'
});
```

**Fixture patterns available**:
- **Factory functions**: `createCategory()`, `createBudget()`, `createExpense()`
- **Builder pattern**: `new CategoryBuilder().withBudget(50000).build()`
- **Trait variations**: `createOverspentBudget()`, `createCustomCategory()`
- **Shared constants**: `sharedFixtures.dates`, `sharedFixtures.amounts`, `sharedFixtures.colors`

---

### Testing localStorage

```typescript
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear(); // Isolate tests - prevent data leakage
});

it('should persist data to localStorage', () => {
  const data = { id: '123', name: 'Test Category' };
  localStorage.setItem('payplan_categories_v1', JSON.stringify(data));

  const stored = localStorage.getItem('payplan_categories_v1');
  expect(stored).toBeTruthy();
  expect(JSON.parse(stored!)).toEqual(data);
});

it('should return default when localStorage is empty', () => {
  const result = readCategories(); // Your storage function
  expect(result).toEqual([]); // Default empty array
});
```

---

### Testing Date-Based Logic

**When to use fake timers**:
- ✅ Testing logic that depends on "now" (current month, streak tracking)
- ✅ Testing date comparisons (is transaction from last 30 days?)
- ✅ Testing date arithmetic (calculate prorated budget by day of month)
- ❌ Testing pure functions with static date inputs (no Date.now() calls)
- ❌ Testing date parsing/formatting (doesn't depend on current time)

**Use fake timers for deterministic dates**:

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers(); // Control "now"
  vi.setSystemTime(new Date('2025-11-04T12:00:00')); // Set fixed date
});

afterEach(() => {
  vi.useRealTimers(); // Always restore!
});

it('should calculate current month correctly', () => {
  // Test runs as if it's Nov 4, 2025 at noon (timezone-independent)
  const result = getCurrentMonth();
  expect(result).toBe('2025-11');
});
```

**Example WITHOUT fake timers** (static date input):
```typescript
// This test doesn't need fake timers (no Date.now() dependency)
it('should parse ISO date correctly', () => {
  const result = parseDate('2025-11-04');
  expect(result.year).toBe(2025);
  expect(result.month).toBe(11);
});
```

**Timezone Handling** (ECMAScript quirk):
```typescript
// ⚠️ Date-only strings are parsed as UTC (ECMAScript spec quirk!)
new Date('2025-10-27').getDay() // Returns 0 (Sunday) in UTC-5 timezone ❌
new Date('2025-10-27').getUTCDay() // Returns 1 (Monday) in UTC ✅

// Solution: Use getUTCDay() for date-only strings
const day = new Date(transaction.date).getUTCDay(); // Correct!

// OR: Append time to force local parsing
const day = new Date(transaction.date + 'T00:00:00').getDay(); // Also works
```

---

### Coverage Targets (Constitution v3.1)

| Module Type | Phase 1 Target | Actual (Feature #063) |
|-------------|----------------|----------------------|
| **Financial calculations** | 90%+ | 90%+ ✅ |
| **Business logic** | 80%+ | 85%+ ✅ |
| **Schemas (Zod)** | 90%+ | 90%+ ✅ |
| **Storage services** | 80%+ | 74-75% (limitation accepted) |
| **UI components** | 0% (manual) | 0% (as expected) |

**Why these targets?**
- **90% for calculations**: Money errors are CRITICAL (user trust, legal liability)
- **80% for business logic**: Core features must be reliable
- **0% for UI**: Manual testing sufficient in Phase 1 (screen reader + keyboard nav)

---

### Running Tests in CI

Tests automatically run on every PR via GitHub Actions:
- See: [`.github/workflows/test.yml`](.github/workflows/test.yml)
- Environment: `TZ=UTC` (eliminates timezone issues)
- Coverage report uploaded as artifact
- PR auto-commented with coverage summary

---

## Tooling Integration

### Linear (Project Management)

- Every Spec-Kit spec creates a Linear issue
- Linear tracks progress (To Do → In Progress → Done)
- Labels: `tier-0`, `tier-1`, `tier-2`, `phase-1`, `feature`, `bug`

### CodeRabbit (Code Review)

- Automated code review enforcing constitutional principles
- Rejects PRs that violate IMMUTABLE principles
- Checks accessibility (WCAG 2.2 AA)
- Verifies Phase 1 requirements (TDD for business logic, phased coverage)
- **You must respond to ALL feedback** (fix or defer to Linear)

### Claude Code Bot (GitHub Actions)

- Automated code review from AI perspective
- Checks code quality and best practices
- Validates against specifications
- **You must respond to ALL feedback** (fix or defer to Linear)

### Linear (Issue Tracking)

- Use Linear MCP to create issues for deferred bot suggestions
- Link issues to parent feature
- Add `bot-suggestion` label
- Set appropriate priority (medium/low)

---

## Frequently Asked Questions

### Q: What is the bot review loop?

**A: After creating PR, bots review your code.** You must fix CRITICAL/HIGH issues immediately and defer MEDIUM/LOW to Linear. Iterate until both bots are green, then HIL reviews.

### Q: Can I merge without bot approval?

**A: NO.** Both Claude Code Bot and CodeRabbit AI must be green before HIL can review. No shortcuts, no exceptions.

### Q: Do I create specifications?

**A: NO.** Manus creates specifications. You implement from specifications. If specs are unclear, ask HIL to clarify with Manus.

### Q: Do I need to write tests in Phase 1?

**A: YES for business logic, NO for UI.** Constitution v3.1 requires:
- ✅ **Business logic tests** (`features/*/lib/**/*.ts`) - 80% coverage target
- ✅ **Financial calculations** - 90%+ coverage (money is critical!)
- ✅ **Storage services** - Test CRUD operations
- ❌ **UI component tests** - Manual testing acceptable
- ❌ **E2E tests** - Defer to Phase 2

**Phased approach** (v3.1):
- Weeks 1-2: Test-after (code first, then tests)
- Weeks 3-6: Hybrid (mix of TDD and test-after)
- Week 7+: Strict TDD (tests first)

### Q: Should I optimize performance?

**A: ONLY IF users complain.** Phase 1 has no performance targets. Optimize only if users report "slow" or "laggy" features.

### Q: When should I use Spec-Kit workflow?

**A: For Tier 1+ features.** Constitution v3.1 requires:
- **Tier 0** (<3 days): GitHub issue only (no spec needed)
- **Tier 1** (3-7 days): spec.md + plan.md minimum
- **Tier 2** (7-14 days): Full Spec-Kit (spec, plan, tasks, research)

See constitution or ask Manus if unsure which tier.

### Q: What if Privacy conflicts with a feature request?

**A: Privacy wins.** Privacy-First is IMMUTABLE and supersedes all other principles. If a feature violates privacy, reject it or redesign it to be privacy-preserving.

### Q: Can I add a dependency?

**A: YES, but justify it.** Follow Simplicity principle (Principle VII). Only add dependencies that solve real problems. Avoid dependency bloat.

### Q: What if I find a bug in production?

**A: Fix within 48 hours.** Phase 1 allows shipping without automated tests, but user-reported bugs must be fixed quickly. Add regression test in Phase 2.

---

## Working with the New Folder Structure (2025-11-02)

**IMPORTANT**: The codebase was reorganized on 2025-11-02 into a clean feature-based architecture.

### Finding Code

**Features** (self-contained modules):
```
frontend/src/features/
├── categories/    - Spending categories (MVP #1)
├── budgets/       - Budget creation (MVP #2)
├── dashboard/     - Dashboard with charts (MVP #3)
├── transactions/  - Transaction entry (MVP #8)
└── archive/       - Transaction archives
```

**Each feature contains:**
- `components/` - React UI components
- `hooks/` - Custom React hooks
- `lib/` - Business logic, storage, schemas (⚠️ TEST THIS!)
- `types/` - TypeScript types
- `index.ts` - Barrel export (use for clean imports)

**Shared utilities:**
```
frontend/src/shared/
├── components/    - UI kit, alerts, spinners
├── lib/           - Utils, CSV, API, validation, telemetry
├── hooks/         - Shared hooks
└── types/         - Shared types (bill, goal)
```

### Adding a New Feature

```bash
# 1. Create feature directory
mkdir -p frontend/src/features/my-feature/{components,hooks,lib,types}

# 2. Add business logic to lib/ (with tests!)
# Create: features/my-feature/lib/MyFeatureService.ts
# Create: features/my-feature/lib/__tests__/MyFeatureService.test.ts

# 3. Add UI components to components/
# Create: features/my-feature/components/MyFeatureCard.tsx

# 4. Create barrel export
# Create: features/my-feature/index.ts
# Export public API: components, hooks, lib functions, types

# 5. Use clean imports
import { MyFeatureCard } from '@/features/my-feature';
```

### Import Path Patterns

```typescript
// ✅ CORRECT: Use barrel exports
import { CategoryCard, useCategories } from '@/features/categories';
import { Button } from '@/shared/components/ui/button';
import { formatCurrency } from '@/shared/lib/utils';

// ❌ WRONG: Old flat structure (doesn't exist anymore!)
import { CategoryCard } from '@/components/categories/CategoryCard';
import { useCategories } from '@/hooks/useCategories';

// ⚠️ WORKS BUT VERBOSE: Skip barrel exports
import { CategoryCard } from '@/features/categories/components/CategoryCard';
```

### Finding Documentation

**All documentation is now organized:**
```
docs/
├── research/          - Competitor analysis, market research
├── testing/           - Test reports, manual tests
├── bugs/              - Critical bug documentation
├── architecture/      - ADRs (Architecture Decision Records)
├── constitution/      - Constitution research
└── archive/           - Old files (safely kept, not deleted)
```

**See also:** `CONTRIBUTING.md` for detailed structure guide

---

## Resources

- **Constitution**: `memory/constitution.md` (READ THIS FIRST - v3.1)
- **Contributing Guide**: `CONTRIBUTING.md` (NEW - folder structure guide)
- **Implementation Prompts**: `.claude/prompts/implement-*.md` (created by Manus)
- **Spec-Kit Commands**: `.claude/commands/*.md`
- **CodeRabbit Config**: `.coderabbit.yaml`
- **Research**: `docs/research/*.md` (15 competitor analysis files)
- **Architecture**: `docs/architecture/decisions/*.md` (ADRs)

---

## Version History

- **2025-11-08**: MAJOR UPDATE - Context Engineering Ultimate Guide (based on Sept 2025 Anthropic research + official Claude Code docs)
  - Added comprehensive context engineering guide (Section 2)
  - Integrated V3 research findings (context rot, attention budget, Goldilocks zone)
  - Documented all Claude Code advanced features (subagents, hooks, MCP, background tasks)
  - Provided decision trees and real PayPlan examples
  - Included optimal prompt structure template
  - Direct Tavily API usage documented for future research
- **2025-11-02**: MAJOR UPDATE - Clean architecture, TDD requirements, v3.1 alignment, barrel exports
- **2025-10-30**: Added Architecture Decision Records (ADR) process documentation
- **2025-10-28**: Added HIL → Manus → Claude Code workflow, bot review loop process
- **2025-10-27**: Updated for Constitution v1.1 (Phase 1 focus, Spec-Kit integration, tooling integration)
- **2025-10-17**: Initial version (auto-generated from feature plans)

---

**Remember**: You are building a privacy-first budgeting app for 40 million Gen Z users living paycheck-to-paycheck. Ship features with TDD for business logic, maintain accessibility, and always prioritize user privacy. Read the constitution before every feature implementation.

**Current Goal**: Ship 8-12 MVP features in 8-12 weeks to validate market need.

**Constitution v3.1**: Phased TDD (60%→80%), evidence-based development, sustainable pace over burnout.

**Your codebase is now CLEAN and organized!** Time to build features! 🚀

