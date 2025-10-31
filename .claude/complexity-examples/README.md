# Code Complexity Examples

This directory contains example files demonstrating common complexity issues and how to fix them.

---

## 📁 Example Files

### 1. high-complexity.js
**Issue**: Cyclomatic Complexity 16 (threshold: 10)

**Problem**:
- 13 decision points create 2^13 = 8,192 possible execution paths
- Research: Complexity >10 correlates with 50% more defects
- Hard to test (need 8,192 test cases for full coverage)

**Smell Detected**: Complex Conditionals

**Recommended Fix**: Extract Method (Pattern 1)
- Break discount calculation into separate functions
- Extract user tier logic
- Estimated complexity reduction: 16 → 6-8

**Try it**:
```bash
python3 ~/.claude/skills/code-complexity-monitor/scripts/analyze_complexity.py .claude/complexity-examples/high-complexity.js
```

---

### 2. deep-nesting.js
**Issue**: Nesting Depth 6 (threshold: 4)

**Problem**:
- Deeply nested code is exponentially harder to understand
- Each nesting level adds cognitive load
- "Arrow code" shape is a code smell

**Smell Detected**: Deep Nesting

**Recommended Fix**: Guard Clauses / Early Return (Pattern 4)
- Flatten nested validation by returning early
- Invert conditions
- Estimated nesting reduction: 6 → 1-2

**Try it**:
```bash
python3 ~/.claude/skills/code-complexity-monitor/scripts/analyze_complexity.py .claude/complexity-examples/deep-nesting.js
```

---

### 3. long-function.js
**Issue**: Function Length 85 lines (threshold: 50)

**Problem**:
- Multiple responsibilities in one function
- Comment blocks indicate separate concerns
- Hard to understand and modify

**Smell Detected**: Long Method

**Recommended Fix**: Replace Comments with Named Functions (Pattern 8)
- Turn comment-separated sections into functions
- Extract helpers for each responsibility
- Estimated length reduction: 85 → 6 lines (main) + 7 helpers

**Try it**:
```bash
python3 ~/.claude/skills/code-complexity-monitor/scripts/analyze_complexity.py .claude/complexity-examples/long-function.js
```

---

## 🔬 How to Use These Examples

### 1. Analyze with Python (Quick)
```bash
cd /home/matt/PROJECTS/PayPlan
python3 ~/.claude/skills/code-complexity-monitor/scripts/analyze_complexity.py .claude/complexity-examples/high-complexity.js
```

### 2. Analyze with MCP (Detailed)
Ask Claude Code:
```
Analyze .claude/complexity-examples/high-complexity.js using MCP tools
```

Claude will:
1. Call `analyze_complexity` MCP tool
2. Call `detect_code_smells`
3. Call `suggest_refactoring`
4. Present detailed recommendations

### 3. Compare Before/After
Each example file contains:
- The problematic code (top)
- Refactored version (commented at bottom)
- Metrics showing improvement

---

## 📊 Metrics Summary

| File | Complexity | Nesting | Length | Main Issue |
|------|-----------|---------|--------|-----------|
| high-complexity.js | 16 ⚠️ | 3 ✅ | 45 ✅ | Complex Conditionals |
| deep-nesting.js | 8 ✅ | 6 ⚠️ | 55 ⚠️ | Deep Nesting |
| long-function.js | 5 ✅ | 2 ✅ | 85 ⚠️ | Long Method |

---

## 🎓 What You'll Learn

### From high-complexity.js
- How cyclomatic complexity exponentially increases test burden
- Extract Method pattern (ROI: 4.0)
- Breaking down conditional logic

### From deep-nesting.js
- How nesting depth impacts readability
- Guard Clauses pattern (ROI: 7.0)
- Inverting conditions to flatten code

### From long-function.js
- How comment blocks indicate multiple responsibilities
- Replace Comments with Functions pattern (ROI: 3.0)
- Extracting cohesive units

---

## 🚀 Apply to PayPlan Code

Once you understand these patterns, you can apply them to real PayPlan code:

**Common candidates**:
- `frontend/src/lib/budgets/calculations.ts` - Budget calculation logic
- `frontend/src/lib/categories/CategoryStorageService.ts` - Storage operations
- `frontend/src/hooks/useBudgetProgress.ts` - Progress calculations
- `frontend/src/lib/budgets/BudgetStorageService.ts` - Budget CRUD operations

**Workflow**:
1. Edit a file in PayPlan
2. Claude automatically analyzes complexity
3. Reviews recommendations
4. Implements refactoring if beneficial
5. Re-analyzes to verify improvement

---

## 📚 Reference Materials

**Decision Tree**: `/home/matt/.claude/skills/code-complexity-monitor/references/refactoring-decision-tree.md`

**10 Patterns**: `/home/matt/.claude/skills/code-complexity-monitor/references/refactoring-patterns.md`

**Code Smells**: `/home/matt/.claude/skills/code-complexity-monitor/references/code-smells.md`

**Industry Standards**: `/home/matt/.claude/skills/code-complexity-monitor/references/complexity-metrics.md`

---

## 💡 Pro Tips

1. **Start small**: Refactor one function at a time
2. **Measure twice**: Analyze before and after to verify improvement
3. **ROI focus**: Prioritize high-impact, low-effort patterns
4. **Test immediately**: Manual test after each refactoring (Phase 1)
5. **Don't over-optimize**: Some complexity is legitimate (parsers, state machines)

---

**These examples demonstrate real-world complexity issues you'll encounter in PayPlan.** 🎯
