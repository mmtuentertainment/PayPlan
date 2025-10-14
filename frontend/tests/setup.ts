import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

// Extend Vitest matchers with axe accessibility matchers
expect.extend(toHaveNoViolations);
