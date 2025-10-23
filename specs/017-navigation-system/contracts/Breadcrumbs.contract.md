# Component Contract: Breadcrumbs

**Component**: `Breadcrumbs`
**Type**: Presentation Component (UI)
**Feature**: 017-navigation-system
**Date**: 2025-10-22

---

## Purpose

Displays hierarchical breadcrumb navigation showing the user's current location in the application. Appears on nested pages (archive details, settings sub-pages) to provide context and quick navigation back to parent pages.

---

## Props Interface

```typescript
interface BreadcrumbsProps {
  /** Optional className for styling customization */
  className?: string;

  /** Maximum length for breadcrumb labels before truncation */
  maxLabelLength?: number; // Default: 50
}
```

---

## Behavior Specification

### Display Logic

**GIVEN** user is on home page (`/`)
**WHEN** Breadcrumbs component renders
**THEN** it renders nothing (breadcrumbs not shown on home)

**GIVEN** user is on archives list page (`/archives`)
**WHEN** Breadcrumbs component renders
**THEN** it displays:
- Home > Archives

**GIVEN** user is on archive detail page (`/archives/:id`)
**WHEN** Breadcrumbs component renders
**THEN** it displays:
- Home > Archives > {Archive Name}

**GIVEN** user is on settings preferences page (`/settings/preferences`)
**WHEN** Breadcrumbs component renders
**THEN** it displays:
- Home > Settings > Preferences

### Navigation Behavior

**GIVEN** breadcrumbs displayed
**WHEN** user clicks "Home" breadcrumb
**THEN** user navigates to `/` route

**GIVEN** breadcrumbs displayed
**WHEN** user clicks intermediate breadcrumb (e.g., "Archives")
**THEN** user navigates to that breadcrumb's path (`/archives`)

**GIVEN** breadcrumbs displayed
**WHEN** user clicks current page breadcrumb (last item)
**THEN** nothing happens (current page not clickable)

### Label Truncation

**GIVEN** archive name is "October 2025 Payments from Afterpay and Klarna" (55 characters)
**AND** maxLabelLength is 50
**WHEN** Breadcrumbs renders
**THEN** label displays as "October 2025 Payments from Afterpay and Kla..."

**GIVEN** user hovers over truncated breadcrumb
**WHEN** hover occurs
**THEN** full label displays in tooltip (HTML title attribute)

---

## Accessibility Requirements

### Semantic HTML

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    <li><a href="/">Home</a> <span aria-hidden="true">›</span></li>
    <li><a href="/archives">Archives</a> <span aria-hidden="true">›</span></li>
    <li aria-current="page">October 2025</li>
  </ol>
</nav>
```

### ARIA Attributes

- `aria-label="Breadcrumb"` on nav element
- `aria-current="page"` on last breadcrumb item
- `aria-hidden="true"` on separator characters (›, /, >)
- Optional `aria-label` on links if truncated

### Keyboard Navigation

- **Tab**: Navigate through breadcrumb links
- **Enter/Space**: Activate focused link
- Current page (last item) is not focusable (not a link)

---

## Visual Requirements

### Layout

- Horizontal layout with separators between items
- Separator character: `›` (or `/` or `>`)
- Last item (current page) styled differently (non-interactive)

### Styling

- Non-link breadcrumbs (current page): normal font weight or different color
- Link breadcrumbs: underline on hover, 4.5:1 contrast ratio
- Separator: muted color (aria-hidden, purely decorative)

### Responsive

- On mobile (<768px), consider:
  - Option A: Wrap breadcrumbs to multiple lines if needed
  - Option B: Show only last 2 breadcrumbs (Home ... > Parent > Current)
  - Option C: Horizontal scroll with ellipsis

**Decision**: Option A (wrap) for simplicity

---

## Performance Requirements

- Component wrapped with `React.memo()` to prevent unnecessary re-renders
- Re-renders only on route changes (when location changes)
- Breadcrumb generation: <10ms

---

## Test Assertions

### Unit Tests (Vitest)

```typescript
describe('Breadcrumbs', () => {
  it('renders nothing on home page', () => {
    const { container } = render(<Breadcrumbs />, {
      wrapper: RouterWrapper('/'),
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders Home > Archives on archives list page', () => {
    render(<Breadcrumbs />, { wrapper: RouterWrapper('/archives') });

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Archives')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Archives' })).not.toBeInTheDocument();
  });

  it('renders Home > Archives > Archive Name on detail page', () => {
    const archiveId = 'abc-123';
    render(<Breadcrumbs />, {
      wrapper: RouterWrapper(`/archives/${archiveId}`),
    });

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();
    expect(screen.getByText(/archive name/i)).toBeInTheDocument(); // Current page
  });

  it('marks last breadcrumb with aria-current="page"', () => {
    render(<Breadcrumbs />, { wrapper: RouterWrapper('/archives') });

    const currentItem = screen.getByText('Archives').closest('li');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('truncates long labels with ellipsis', () => {
    const longName = 'A'.repeat(60); // 60 characters
    render(<Breadcrumbs maxLabelLength={50} />, {
      wrapper: RouterWrapperWithArchive(`/archives/abc`, longName),
    });

    const truncatedText = screen.getByText(/A{47}\.\.\./, { exact: false });
    expect(truncatedText).toBeInTheDocument();
  });

  it('shows full label in title attribute when truncated', () => {
    const longName = 'October 2025 Payments from Afterpay and Klarna';
    render(<Breadcrumbs maxLabelLength={20} />, {
      wrapper: RouterWrapperWithArchive(`/archives/abc`, longName),
    });

    const breadcrumb = screen.getByText(/\.\.\.$/);
    expect(breadcrumb).toHaveAttribute('title', longName);
  });

  it('hides separator from screen readers', () => {
    render(<Breadcrumbs />, { wrapper: RouterWrapper('/archives') });

    const separators = screen.getAllByText('›');
    separators.forEach(separator => {
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('navigates when breadcrumb clicked', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      ...vi.importActual('react-router-dom'),
      useNavigate: () => navigate,
    }));

    render(<Breadcrumbs />, { wrapper: RouterWrapper('/archives/abc-123') });

    await user.click(screen.getByRole('link', { name: 'Archives' }));
    expect(navigate).toHaveBeenCalledWith('/archives');
  });
});
```

### Accessibility Tests (vitest-axe)

```typescript
import { axe } from 'vitest-axe';

describe('Breadcrumbs Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Breadcrumbs />, {
      wrapper: RouterWrapper('/archives/abc-123'),
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('provides breadcrumb landmark', () => {
    render(<Breadcrumbs />, { wrapper: RouterWrapper('/archives') });

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toBeInTheDocument();
  });

  it('uses ordered list for breadcrumbs', () => {
    render(<Breadcrumbs />, { wrapper: RouterWrapper('/archives') });

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
  });
});
```

### Integration Tests

```typescript
describe('Breadcrumbs Integration', () => {
  it('updates when route changes', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: BrowserRouter });

    // Navigate to archives
    await user.click(screen.getByRole('link', { name: 'Archives' }));
    expect(screen.getByText('Archives')).toHaveAttribute('aria-current', 'page');

    // Click breadcrumb to go home
    await user.click(screen.getByRole('link', { name: 'Home' }));
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('displays dynamic archive name from context', async () => {
    const archiveName = 'October 2025 Payments';
    const archiveId = 'abc-123';

    render(<App />, {
      wrapper: RouterWrapperWithArchiveContext(archiveId, archiveName),
    });

    // Navigate to archive detail
    await navigateTo(`/archives/${archiveId}`);

    expect(screen.getByText(archiveName)).toBeInTheDocument();
  });
});
```

### Performance Tests

```typescript
describe('Breadcrumbs Performance', () => {
  it('renders in <10ms', () => {
    const start = performance.now();
    render(<Breadcrumbs />, { wrapper: RouterWrapper('/archives/abc-123') });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10);
  });

  it('does not re-render when parent state changes', () => {
    let renderCount = 0;
    const BreadcrumbsWithCount = memo(() => {
      renderCount++;
      return <Breadcrumbs />;
    });

    const { rerender } = render(
      <ParentWithState>
        <BreadcrumbsWithCount />
      </ParentWithState>
    );

    expect(renderCount).toBe(1);

    // Parent state change
    rerender(
      <ParentWithState unrelatedProp="changed">
        <BreadcrumbsWithCount />
      </ParentWithState>
    );

    expect(renderCount).toBe(1); // Should NOT re-render
  });
});
```

---

## Error Handling

### Unknown Routes

**GIVEN** user is on unknown route `/unknown-page`
**WHEN** Breadcrumbs component renders
**THEN** it displays only "Home" breadcrumb (safe fallback)

### Missing Archive Data

**GIVEN** user is on `/archives/:id` but archive not found
**WHEN** Breadcrumbs component renders
**THEN** it displays "Home > Archives > Archive" (fallback label)

---

## Dependencies

- `react` (19.1.1)
- `react-router-dom` (7.9.3) - useLocation, useParams, Link
- Tailwind CSS (4.1.13) - Styling

---

## Files

**Component**: `frontend/src/components/navigation/Breadcrumbs.tsx`
**Tests**: `frontend/src/components/navigation/Breadcrumbs.test.tsx`
**Styles**: Inline Tailwind classes

---

## Success Criteria

- ✅ FR-006 met: Breadcrumbs shown on nested pages
- ✅ WCAG 2.1 AA compliant (semantic HTML, aria-current, aria-label)
- ✅ Handles long archive names with truncation + tooltip
- ✅ All test assertions pass (unit, accessibility, integration, performance)

---

**Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-22
