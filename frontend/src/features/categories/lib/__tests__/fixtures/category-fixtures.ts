// Category test fixtures
// Feature #063: Business Logic Test Coverage - US2
// Research Decision 4: Factory functions for simple entities
//
// Fixture Naming Convention:
// - Base factory: createCategory() - Minimal valid entity with sensible defaults
// - Trait variations: createCustomCategory(), createDefaultCategory() - Specific use cases
// - Modifier functions: createCategoryWithColor(), createCategoryWithIcon() - Single property variations
// - Edge cases: createCategoryWithInvalidColor(), createCategoryWithEmptyName() - Validation testing
// - Bulk helpers: createCategories() - Generate multiple entities for performance/stress testing

import { v4 as uuid } from 'uuid';
import type { Category } from '../../types/category';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';
import type { FixtureFactory } from '../../../../../../tests/fixtures/types';

/**
 * Create category fixture with defaults
 * @param overrides - Fields to override
 * @returns Category object
 */
export const createCategory: FixtureFactory<Category> = (overrides) => ({
  id: `cat_${uuid().replace(/-/g, '')}`,
  name: 'Groceries',
  iconName: 'shopping-cart',
  color: sharedFixtures.colors.green,
  isDefault: false,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});

// Trait variations for common scenarios

/**
 * Create custom (non-default) category
 */
export const createCustomCategory: FixtureFactory<Category> = (overrides) =>
  createCategory({
    name: 'Custom Category',
    iconName: 'star',
    color: sharedFixtures.colors.purple,
    isDefault: false,
    ...overrides,
  });

/**
 * Create default category (pre-defined)
 */
export const createDefaultCategory: FixtureFactory<Category> = (overrides) =>
  createCategory({
    name: 'Groceries',
    iconName: 'shopping-cart',
    color: sharedFixtures.colors.green,
    isDefault: true,
    ...overrides,
  });

/**
 * Create category with specific color
 */
export const createCategoryWithColor = (color: string): Category =>
  createCategory({ color });

/**
 * Create category with specific icon
 */
export const createCategoryWithIcon = (iconName: string): Category =>
  createCategory({ iconName });

// Edge case fixtures

/**
 * Category with invalid color format (for error testing)
 */
export const createCategoryWithInvalidColor = (): Partial<Category> => ({
  id: `cat_${uuid().replace(/-/g, '')}`,
  name: 'Invalid Color Category',
  iconName: 'alert',
  color: 'not-a-hex-color', // Invalid format
  isDefault: false,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
});

/**
 * Category with empty name (for validation testing)
 */
export const createCategoryWithEmptyName = (): Partial<Category> => ({
  id: `cat_${uuid().replace(/-/g, '')}`,
  name: '', // Invalid: empty name
  iconName: 'alert',
  color: sharedFixtures.colors.red,
  isDefault: false,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
});

/**
 * Category with name exceeding max length (for validation testing)
 */
export const createCategoryWithLongName = (): Partial<Category> => ({
  id: `cat_${uuid().replace(/-/g, '')}`,
  name: 'A'.repeat(51), // Exceeds 50 char limit
  iconName: 'alert',
  color: sharedFixtures.colors.red,
  isDefault: false,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
});

/**
 * Create multiple categories for bulk testing
 */
export const createCategories = (count: number): Category[] =>
  Array.from({ length: count }, (_, i) =>
    createCategory({
      name: `Category ${i + 1}`,
      color: sharedFixtures.colors.blue,
    })
  );
