---
name: web-modernization-architect
description: Transform legacy, messy, or poorly-structured web code into modern, performant, accessible, and maintainable applications. Use when modernizing legacy web apps, refactoring spaghetti code, improving accessibility/performance, extracting reusable components, implementing design systems, or migrating from table layouts to CSS Grid/Flexbox. Triggers on mentions of "legacy code," "refactoring," "accessibility issues," "inline styles," "table layouts," or "modernize web app."
---

# Web Modernization Architect

Transform legacy web code into modern, performant, accessible, and maintainable applications using systematic analysis, proven refactoring patterns, and contemporary web standards.

---

## Quick Start

### 1. Analyze Your Code

```bash
python scripts/audit_code.py /path/to/your/project
```

This generates a comprehensive audit report identifying:
- Inline styles and outdated CSS
- Non-semantic HTML
- Accessibility issues
- Performance bottlenecks
- Security vulnerabilities
- Code smells and anti-patterns

### 2. Review the Audit Report

The audit creates `audit-report.json` with severity-ranked issues:
- **Critical** - Security vulnerabilities, major accessibility violations
- **High** - Performance issues, non-semantic HTML
- **Medium** - Code organization, maintainability
- **Low** - Style improvements, optimization opportunities

### 3. Apply Automated Fixes

```bash
python scripts/modernize.py /path/to/your/project --auto-fix
```

This automatically fixes:
- ✅ Inline styles → External CSS classes
- ✅ Non-semantic tags → Semantic HTML5
- ✅ Missing alt attributes
- ✅ Outdated JavaScript patterns
- ✅ CSS vendor prefixes

### 4. Manual Refactoring (Complex Issues)

For architecture changes, use the reference guides:
- `references/modernization-workflow.md` - Step-by-step process
- `references/refactoring-patterns.md` - Common transformation patterns
- `references/component-architecture.md` - Building reusable components

---

## What This Skill Does

### Transforms Real Problems
- ✅ **Spaghetti code** → Clean, modular architecture  
- ✅ **Inline styles** → Modern CSS with variables
- ✅ **Table layouts** → Flexbox/Grid responsive design
- ✅ **Poor accessibility** → WCAG AA/AAA compliance
- ✅ **No mobile support** → Mobile-first responsive
- ✅ **Vanilla spaghetti** → Clean components
- ✅ **Performance issues** → Optimized loading

### Core Capabilities
1. **Code Audit** - Systematic analysis of problems
2. **Architecture Refactoring** - Clean structure patterns
3. **Design Modernization** - Contemporary UI/UX  
4. **Component Extraction** - Reusable building blocks
5. **Accessibility Fixes** - Screen reader, keyboard nav
6. **Performance Optimization** - Fast load times

---

## Usage Workflows

### Workflow 1: Quick Audit
```bash
python scripts/audit_code.py /path/to/project
```
**Output:** Identifies accessibility violations, performance issues, code smells

### Workflow 2: Full Modernization
1. **Audit:** `python scripts/audit_code.py /path/to/project --output audit.json`
2. **Plan:** `python scripts/generate_plan.py audit.json --output plan.md`
3. **Transform:** Follow step-by-step plan in plan.md
4. **Validate:** Re-run audit to verify improvements

### Workflow 3: Component Extraction
```bash
python scripts/extract_components.py /path/to/file.html --output components/
```
**Output:** Extracts cards, buttons, forms, navigation as modern components

---

## For Claude Code Users

### When to Use This Skill
- Modernizing legacy web applications
- Refactoring messy codebases
- Improving accessibility/performance
- Extracting reusable components
- Implementing design systems

### How Claude Code Uses This
1. Uses `scripts/audit_code.py` to detect problems
2. Uses `scripts/generate_plan.py` for transformation roadmap
3. Reads `references/` for detailed guidance
4. Uses `examples/` for before/after patterns

---

## Example Transformation

**Before (Table Layout):**
```html
<table width="100%">
  <tr>
    <td width="33%">Feature 1</td>
    <td width="33%">Feature 2</td>
    <td width="33%">Feature 3</td>
  </tr>
</table>
```

**After (CSS Grid):**
```html
<div class="feature-grid">
  <div class="feature-card">Feature 1</div>
  <div class="feature-card">Feature 2</div>
  <div class="feature-card">Feature 3</div>
</div>

<style>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}
</style>
```

See `examples/` for complete transformations!

---

## Philosophy

### 1. **Real Problems First**
Focus on actual issues in real code, not theoretical patterns.

### 2. **Accessibility = Requirement**  
Not optional. Every transformation must improve or maintain accessibility.

### 3. **Progressive Enhancement**
Start with basics (HTML), layer on improvements (CSS, JS).

### 4. **Performance Matters**
Fast > Pretty. Optimize for user experience.

---

Built for developers who inherit messy code and need to make it beautiful.
