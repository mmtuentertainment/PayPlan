# Web Modernization Workflow

A systematic, step-by-step process for transforming legacy web code into modern, maintainable applications.

---

## Phase 1: Assessment (30-60 minutes)

### 1.1 Run the Audit

```bash
python scripts/audit_code.py /path/to/project --output audit-report.json
```

**What to look for:**
- Critical accessibility issues (missing alt text, poor semantic HTML)
- High-priority UX problems (no viewport, table layouts)
- Performance bottlenecks (large inline styles, unoptimized assets)
- Code maintainability issues (div soup, deprecated tags)

### 1.2 Prioritize Issues

**Fix in this order:**
1. **Critical** - Breaks accessibility, legal compliance issues
2. **High** - Severely impacts UX or performance
3. **Medium** - Technical debt, maintainability
4. **Low** - Nice-to-haves, optimizations

### 1.3 Set Success Criteria

Define what "modernized" means for your project:
- [ ] All critical accessibility issues resolved
- [ ] Mobile-responsive design
- [ ] Lighthouse score > 90
- [ ] No inline styles
- [ ] Semantic HTML throughout
- [ ] Modern CSS (Grid/Flexbox)
- [ ] ES6+ JavaScript

---

## Phase 2: Quick Wins (1-2 hours)

Apply automated fixes that are safe and have high impact:

```bash
python scripts/modernize.py /path/to/project --auto-fix --backup
```

**What gets fixed automatically:**
- ✅ Inline styles extracted to classes
- ✅ Missing alt attributes added
- ✅ Viewport meta tag added
- ✅ Deprecated tags replaced
- ✅ var → let/const conversion
- ✅ CSS variables template added

**Manual review needed:**
- Review extracted CSS classes
- Customize CSS variables
- Test functionality after changes

---

## Phase 3: Structural Improvements (2-4 hours)

### 3.1 Semantic HTML Refactoring

**Before (div soup):**
```html
<div class="header">
  <div class="logo">Logo</div>
  <div class="nav">
    <div class="nav-item">Home</div>
    <div class="nav-item">About</div>
  </div>
</div>
<div class="content">
  <div class="article">...</div>
</div>
<div class="footer">...</div>
```

**After (semantic HTML5):**
```html
<header>
  <div class="logo">Logo</div>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>
<main>
  <article>...</article>
</main>
<footer>...</footer>
```

**Mapping guide:**
- `<div class="header">` → `<header>`
- `<div class="nav">` → `<nav>`
- `<div class="content">` → `<main>`
- `<div class="article">` → `<article>`
- `<div class="section">` → `<section>`
- `<div class="sidebar">` → `<aside>`
- `<div class="footer">` → `<footer>`

### 3.2 Layout Modernization

**Table layout → CSS Grid:**

Before:
```html
<table>
  <tr>
    <td class="sidebar">Sidebar</td>
    <td class="main">Main content</td>
  </tr>
</table>
```

After:
```html
<div class="layout">
  <aside>Sidebar</aside>
  <main>Main content</main>
</div>

<style>
.layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
```

### 3.3 Responsive Design

**Add mobile-first breakpoints:**

```css
/* Mobile first (default) */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 720px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}

/* Large desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

---

## Phase 4: Design System Implementation (3-5 hours)

### 4.1 CSS Variables (Design Tokens)

```css
:root {
  /* Colors */
  --color-primary: #007bff;
  --color-primary-dark: #0056b3;
  --color-primary-light: #e7f1ff;
  
  --color-gray-100: #f8f9fa;
  --color-gray-200: #e9ecef;
  --color-gray-300: #dee2e6;
  --color-gray-400: #ced4da;
  --color-gray-500: #adb5bd;
  --color-gray-600: #6c757d;
  --color-gray-700: #495057;
  --color-gray-800: #343a40;
  --color-gray-900: #212529;
  
  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-heading: var(--font-family-base);
  --font-family-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  
  --line-height-tight: 1.25;
  --line-height-base: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Spacing */
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  
  /* Borders */
  --border-radius-sm: 0.125rem;  /* 2px */
  --border-radius: 0.25rem;      /* 4px */
  --border-radius-md: 0.375rem;  /* 6px */
  --border-radius-lg: 0.5rem;    /* 8px */
  --border-radius-xl: 0.75rem;   /* 12px */
  --border-radius-2xl: 1rem;     /* 16px */
  --border-radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-base: 300ms;
  --transition-slow: 500ms;
}
```

### 4.2 Utility Classes

```css
/* Spacing utilities */
.p-1 { padding: var(--spacing-1); }
.p-2 { padding: var(--spacing-2); }
.p-4 { padding: var(--spacing-4); }
.p-8 { padding: var(--spacing-8); }

.m-1 { margin: var(--spacing-1); }
.m-2 { margin: var(--spacing-2); }
.m-4 { margin: var(--spacing-4); }
.m-8 { margin: var(--spacing-8); }

/* Text utilities */
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }

/* Layout utilities */
.flex { display: flex; }
.grid { display: grid; }
.block { display: block; }
.inline-block { display: inline-block; }
.hidden { display: none; }

/* Flexbox utilities */
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.flex-col { flex-direction: column; }
.gap-4 { gap: var(--spacing-4); }
```

---

## Phase 5: Component Extraction (2-3 hours)

### 5.1 Identify Reusable Patterns

Look for repeated HTML patterns:
- Buttons
- Cards
- Form inputs
- Navigation
- Modals
- Alerts

### 5.2 Extract Components

**Button component example:**

```html
<!-- Before: Repeated everywhere -->
<button style="background: blue; color: white; padding: 10px 20px;">
  Click me
</button>

<!-- After: Reusable component -->
<button class="btn btn-primary">
  Click me
</button>

<style>
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
```

---

## Phase 6: Testing & Validation (1-2 hours)

### 6.1 Accessibility Testing

**Tools:**
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- Lighthouse (Chrome DevTools)

**Checklist:**
- [ ] All images have alt text
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Form labels associated with inputs
- [ ] ARIA attributes where needed

### 6.2 Responsive Testing

**Test on:**
- Mobile (375px width)
- Tablet (768px width)
- Desktop (1024px+ width)

**Check:**
- [ ] No horizontal scrolling
- [ ] Text is readable (16px minimum)
- [ ] Touch targets are 44x44px minimum
- [ ] Content reflows properly
- [ ] Images scale appropriately

### 6.3 Performance Testing

**Lighthouse metrics:**
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Time to Interactive < 3.5s

**Optimizations:**
- Minify CSS/JS
- Optimize images (WebP format)
- Lazy load images
- Remove unused CSS
- Use CDN for assets

---

## Phase 7: Documentation (30 minutes)

### 7.1 Component Documentation

Document each reusable component:
- Purpose
- Usage example
- Props/options
- Accessibility notes

### 7.2 Design System Documentation

- Color palette
- Typography scale
- Spacing system
- Component library
- Code style guide

### 7.3 Migration Notes

Document what changed:
- Breaking changes
- New patterns introduced
- Deprecated patterns
- Testing notes

---

## Success Checklist

Before considering the modernization complete:

- [ ] All critical issues resolved
- [ ] Lighthouse score > 90
- [ ] WCAG 2.1 AA compliant
- [ ] Mobile responsive
- [ ] No inline styles
- [ ] Semantic HTML throughout
- [ ] CSS variables implemented
- [ ] Components documented
- [ ] Cross-browser tested
- [ ] Performance optimized

---

## Maintenance

After modernization:

1. **Code reviews** - Enforce modern patterns
2. **Linting** - Use ESLint, Stylelint, HTMLHint
3. **Regular audits** - Run quarterly audits
4. **Update dependencies** - Keep frameworks current
5. **Monitor metrics** - Track Lighthouse scores

---

## Next Steps

1. Run the audit: `python scripts/audit_code.py /your/project`
2. Review the report and prioritize issues
3. Apply automated fixes: `python scripts/modernize.py /your/project --auto-fix`
4. Follow this workflow phase by phase
5. Test thoroughly at each phase
6. Document everything

**Remember:** Modernization is iterative. Don't try to do everything at once. Focus on high-impact changes first, then gradually improve.
