# Quick Reference Guide

## Common Transformations

### 1. Inline Styles → CSS Classes

**Before:**
```html
<div style="background: blue; color: white; padding: 20px;">Content</div>
```

**After:**
```html
<div class="hero">Content</div>

<style>
.hero {
  background: var(--primary-color);
  color: white;
  padding: 1.25rem;
}
</style>
```

### 2. Table Layout → CSS Grid

**Before:**
```html
<table width="100%">
  <tr>
    <td width="25%">Item 1</td>
    <td width="25%">Item 2</td>
    <td width="25%">Item 3</td>
    <td width="25%">Item 4</td>
  </tr>
</table>
```

**After:**
```html
<div class="grid">
  <div class="grid__item">Item 1</div>
  <div class="grid__item">Item 2</div>
  <div class="grid__item">Item 3</div>
  <div class="grid__item">Item 4</div>
</div>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
</style>
```

### 3. Non-Semantic HTML → Semantic HTML5

**Before:**
```html
<div id="header">
  <div id="nav">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </div>
</div>
<div id="content">
  <div class="article">Article content</div>
</div>
<div id="footer">Footer content</div>
```

**After:**
```html
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>Article content</article>
</main>
<footer>Footer content</footer>
```

### 4. jQuery → Vanilla JavaScript

**Before:**
```javascript
$(document).ready(function() {
  $('.button').click(function() {
    $(this).addClass('active');
  });
});
```

**After:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.currentTarget.classList.add('active');
    });
  });
});
```

### 5. px Units → Responsive Units

**Before:**
```css
.title {
  font-size: 24px;
  padding: 16px;
  margin-bottom: 20px;
}
```

**After:**
```css
:root {
  --spacing-unit: 1rem;
}

.title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  padding: var(--spacing-unit);
  margin-bottom: calc(var(--spacing-unit) * 1.25);
}
```

## Accessibility Checklist

- [ ] All images have alt text
- [ ] Semantic HTML5 elements used
- [ ] ARIA landmarks present
- [ ] Keyboard navigation works
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Form labels properly associated
- [ ] Viewport meta tag present

## Performance Checklist

- [ ] Images optimized and properly sized
- [ ] CSS minified in production
- [ ] JavaScript minified in production
- [ ] No inline styles
- [ ] Minimal use of !important
- [ ] Responsive images with srcset
- [ ] Lazy loading for images below fold

## Modern CSS Patterns

### CSS Custom Properties (Variables)
```css
:root {
  --primary-color: #0066cc;
  --secondary-color: #666;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
}
```

### Modern Layout
```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}
```

### Responsive Design
```css
/* Mobile first */
.element {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .element {
    padding: 2rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .element {
    padding: 3rem;
  }
}
```
