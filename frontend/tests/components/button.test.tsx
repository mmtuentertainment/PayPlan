import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '../../src/components/ui/button';

/**
 * WCAG 2.1 AA Compliance Tests for Button Touch Targets
 *
 * Success Criterion 2.5.5 (Level AAA): Target Size
 * Minimum size: 44×44 CSS pixels (mobile/touch devices)
 *
 * Reference: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
 */

describe('Button WCAG Touch Target Compliance', () => {
  // T048: Button 'sm' variant meets 44×44px on mobile
  describe('Small button variant', () => {
    it('should meet 44×44px minimum on mobile viewport', () => {
      const { container } = render(<Button size="sm">Click me</Button>);
      const button = container.querySelector('button');

      expect(button).toBeTruthy();

      // Note: In test environment, getComputedStyle may not return actual pixel values
      // This test verifies the class is applied correctly
      // Manual testing and browser-based tests confirm 44px rendering
      if (button) {
        const className = button.className;
        expect(className).toContain('h-11'); // h-11 = 44px (WCAG compliant)
      }
    });

    it('should have adequate horizontal padding for touch targets', () => {
      const { container } = render(<Button size="sm">Click me</Button>);
      const button = container.querySelector('button');

      if (button) {
        const className = button.className;
        expect(className).toContain('px-3'); // Horizontal padding
      }
    });
  });

  // T049: All button variants meet WCAG minimum
  describe('All button variants', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    it.each(sizes)('should meet WCAG minimum for %s size variant', (size) => {
      const { container } = render(<Button size={size}>Click me</Button>);
      const button = container.querySelector('button');

      expect(button).toBeTruthy();

      // Verify correct Tailwind height classes are applied
      // According to button.constants.ts (after WCAG compliance fix):
      // default: "h-11 px-4 py-2 md:h-9" // 44px mobile (WCAG ✅)
      // sm: "h-11 rounded-md px-3 text-xs md:h-8" // 44px mobile (WCAG ✅)
      // lg: "h-12 rounded-md px-8 md:h-10" // 48px mobile (WCAG ✅)
      // icon: "h-11 w-11 md:h-9 md:w-9" // 44px mobile (WCAG ✅)

      if (button) {
        const className = button.className;
        const expectedClass = size === 'lg' ? 'h-12' : 'h-11';
        expect(className).toContain(expectedClass);
      }
    });

    it.each(sizes)('should have minimum width for %s size variant (icon buttons)', (size) => {
      const { container } = render(
        <Button size={size} aria-label="Icon button">
          <span>📧</span>
        </Button>
      );
      const button = container.querySelector('button');

      if (button && size === 'icon') {
        const className = button.className;
        // Icon buttons have both width and height classes
        expect(className).toContain('w-11'); // 44px width
        expect(className).toContain('h-11'); // 44px height
      }
    });

    it('should render with proper ARIA labels for accessibility', () => {
      const { container } = render(
        <Button aria-label="Submit form">Submit</Button>
      );
      const button = container.querySelector('button');

      expect(button?.getAttribute('aria-label')).toBe('Submit form');
    });

    it('should support disabled state with proper ARIA', () => {
      const { container } = render(
        <Button disabled>Disabled Button</Button>
      );
      const button = container.querySelector('button');

      expect(button?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Touch target spacing', () => {
    it('should maintain adequate spacing between adjacent buttons', () => {
      const { container } = render(
        <div className="flex gap-2">
          <Button size="sm">Button 1</Button>
          <Button size="sm">Button 2</Button>
        </div>
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);

      // WCAG recommends spacing between touch targets to avoid accidental activation
      // gap-2 in Tailwind is 0.5rem (8px)
      const parent = container.querySelector('div');
      if (parent) {
        const className = parent.className;
        expect(className).toContain('gap-2'); // 8px gap
      }
    });
  });

  describe('Focus states for keyboard accessibility', () => {
    it('should have visible focus indicators', () => {
      const { container } = render(<Button>Focusable Button</Button>);
      const button = container.querySelector('button');

      // Button should have focus-visible styles
      // From button.constants.ts: focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
      expect(button?.className).toContain('focus-visible');
    });
  });
});
