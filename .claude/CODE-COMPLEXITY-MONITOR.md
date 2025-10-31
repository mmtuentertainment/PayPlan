# Code Complexity Monitor - Installed

## ✅ Installation Complete

The **Code Complexity Monitor skill** has been installed and configured for this project.

---

## 📍 Installation Location

**Skill Directory**: `/home/matt/.claude/skills/code-complexity-monitor/`

**MCP Config**: `/home/matt/.config/Code/User/mcp.json`

---

## 🎯 What's Available

### MCP Server (Native Integration)

4 MCP tools are now available:

1. **analyze_complexity** - AST-based analysis
   - Cyclomatic Complexity (McCabe)
   - Cognitive Complexity (SonarSource)
   - Halstead Metrics
   - Maintainability Index
   - Per-function detailed metrics

2. **detect_code_smells** - Code smell detection
   - 20+ smells from Martin Fowler's catalog
   - Severity/confidence scoring
   - Combination detection

3. **suggest_refactoring** - Expert recommendations
   - Decision tree pattern selection
   - ROI scoring
   - Multi-pass strategies

4. **calculate_roi** - ROI analysis
   - Impact/effort breakdown
   - Time estimates
   - Defect reduction projections

### Python Analyzer (Fallback)

- **Command**: `python3 /home/matt/.claude/skills/code-complexity-monitor/scripts/analyze_complexity.py <file>`
- **Use when**: MCP unavailable or quick checks

---

## 🚀 How It Works

### Automatic Triggers

The skill activates automatically after:
- ✅ Edit operations on code files
- ✅ Write operations creating new files
- ✅ Manual requests: "check complexity", "analyze this"

### Example Usage

**Automatic (after editing code)**:
```
[You edit a file in frontend/src/]

Claude: I've analyzed the changes you made. The processPayment function has:
- Complexity: 16 (threshold: 10) ⚠️
- Nesting: 5 (threshold: 4) ⚠️
- Detected smell: "Deep Nesting + Complex Conditionals" (Critical)

Recommendation: Two-pass refactoring...
```

**Manual Request**:
```
You: Check complexity of frontend/src/lib/budgets/calculations.ts

Claude: [Analyzes using MCP tools]
Analysis results: ...
```

---

## 📊 Supported Languages

JavaScript, TypeScript, TSX, Python, Java, Go, Rust, C, C++, C#, Kotlin, Swift, Ruby, PHP

---

## ⚙️ Configuration

### Project-Specific Thresholds

To customize thresholds for this project, create:

**File**: `/home/matt/PROJECTS/PayPlan/.code-complexity.json`

**Template**:
```json
{
  "preset": "web-application",
  "thresholds": {
    "cyclomaticComplexity": 10,
    "functionLength": 50,
    "fileLength": 500,
    "nestingDepth": 4
  }
}
```

**Available Presets**:
- `web-application` (default): 10/50/500/4
- `critical-system` (strict): 7/30/300/3
- `legacy-codebase` (gradual): 20/100/1000/5
- `library-framework` (balanced): 15/75/750/4

---

## 🔧 Technical Details

### MCP Server Status
- ✅ Installed: `/home/matt/.claude/skills/code-complexity-monitor/mcp-server/`
- ✅ Built: `dist/` folder with compiled JavaScript
- ✅ Dependencies: Installed (109 packages, 0 vulnerabilities)
- ✅ Config: Added to `/home/matt/.config/Code/User/mcp.json`

### Testing

**Test MCP Server**:
```bash
cd /home/matt/.claude/skills/code-complexity-monitor/mcp-server
node dist/index.js
# Should output: "Code Complexity Monitor MCP Server running on stdio"
```

**Test Python Analyzer**:
```bash
cd /home/matt/.claude/skills/code-complexity-monitor
python3 scripts/analyze_complexity.py assets/examples/high-complexity.js
# Should output JSON with complexity metrics
```

---

## 📚 Documentation

**Main Documentation**: `/home/matt/.claude/skills/code-complexity-monitor/SKILL.md`

**MCP Server Docs**: `/home/matt/.claude/skills/code-complexity-monitor/mcp-server/README.md`

**Reference Materials** (in `/references/`):
- `complexity-metrics.md` - Industry standards (McCabe, SonarQube, ESLint)
- `code-smells.md` - Martin Fowler's catalog (20+ smells)
- `refactoring-patterns.md` - 10 proven patterns
- `refactoring-decision-tree.md` - Pattern selection algorithm

**Examples** (in `/assets/examples/`):
- `high-complexity.js` - Complexity 16 example
- `deep-nesting.js` - Nesting depth 6 example
- `long-function.js` - 85-line function example

---

## 🎓 How Claude Uses This

When you edit code in this project, Claude will:

1. **Detect** the code change
2. **Analyze** using MCP `analyze_complexity` tool
3. **Detect smells** using `detect_code_smells` tool
4. **Recommend** patterns using `suggest_refactoring` tool
5. **Calculate ROI** for recommended patterns
6. **Present** findings with actionable advice
7. **Help implement** if you accept recommendations
8. **Verify** with re-analysis after refactoring

---

## 💡 Example Workflow

```
You: [Edit frontend/src/hooks/useBudgetProgress.ts]

Claude: I've analyzed useBudgetProgress.ts. The calculateProgress function shows:

**Metrics**:
- Cyclomatic Complexity: 12 (threshold: 10) ⚠️
- Cognitive Complexity: 18 (threshold: 15) ⚠️
- Nesting Depth: 4 (threshold: 4) ✅
- Function Length: 35 lines (threshold: 50) ✅

**Code Smell**: Complex Conditionals (High confidence)
- 11 decision points create 2,048 possible paths
- Research: 50% more defects in functions with complexity >10

**Recommendation**: Extract Method (Pattern 1)
- ROI: 4.0 (Impact: 8/10, Effort: 2/5)
- Estimated time: 2-3 hours
- Defect reduction: 30-50%
- Break budget calculation logic into smaller helpers

**Specific Suggestions**:
1. Extract `calculateSpentAmount()` helper
2. Extract `determineProgressStatus()` helper
3. Extract `formatProgressData()` helper

Would you like me to implement this refactoring?
```

---

## 🔄 Updates

To update the skill in the future:

```bash
cd /home/matt/.claude/skills/code-complexity-monitor/mcp-server
git pull  # If using version control
npm install
npm run build
```

---

## 🆘 Troubleshooting

### MCP Tools Not Appearing

1. Check config: `cat /home/matt/.config/Code/User/mcp.json`
2. Verify path: `/home/matt/.claude/skills/code-complexity-monitor/mcp-server/dist/index.js`
3. Restart Claude Code
4. Check logs (if available)

### "Module not found" Error

```bash
cd /home/matt/.claude/skills/code-complexity-monitor/mcp-server
npm install
```

### Python Analyzer Issues

Verify Python 3.7+:
```bash
python3 --version
```

---

## 📊 Metrics Reference

### Thresholds (Web Application Preset)

| Metric | Threshold | Industry Standard |
|--------|-----------|-------------------|
| Cyclomatic Complexity | 10 | ESLint: 20, SonarQube: 15, Clean Code: 10 |
| Cognitive Complexity | 15 | SonarSource recommendation |
| Function Length | 50 lines | Robert Martin: 20, Pragmatic: 50 |
| File Length | 500 lines | Industry standard |
| Nesting Depth | 4 | Maintainability limit |

### Code Smells Detected

**Bloaters**: Long Method, Complex Conditionals, Large Class, Long Parameter List

**High Severity**: Low Maintainability, High Cognitive Load, Deep Nesting

**Combinations**: Deep Nesting + Complex Conditionals, Long Method + Divergent Change

---

## ✅ Installation Verified

- ✅ Skill extracted to `~/.claude/skills/code-complexity-monitor/`
- ✅ MCP server dependencies installed (109 packages)
- ✅ MCP server built successfully (dist/ folder)
- ✅ MCP config created/updated
- ✅ Python analyzer tested (working)
- ✅ MCP server tested (working)

**Status**: Ready to use! The skill will activate automatically when you edit code.

---

**Last Updated**: 2025-10-31
