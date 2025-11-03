// Category Schema Validation Tests
// Feature #063: Business Logic Test Coverage - US3
// Tests: T092-T101

import { describe, it, expect } from 'vitest';
import {
  categorySchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  categoryStorageSchema,
  validateCategory,
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
  validateCategoryStorage,
} from '../schemas';
import {
  createCategory,
  createCustomCategory,
  createDefaultCategory,
  createCategoryWithInvalidColor,
  createCategoryWithEmptyName,
  createCategoryWithLongName,
} from './fixtures';
import { expectZodSuccess, expectZodError } from '../../../../../tests/fixtures/assertion-utils';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

describe('Category Schemas', () => {
  describe('categorySchema', () => {
    it('should validate complete category with all fields', () => {
      const category = createCategory();
      const result = categorySchema.safeParse(category);

      if (!result.success) {
        console.log('Category:', JSON.stringify(category, null, 2));
        console.log('Errors:', JSON.stringify(result.error.errors, null, 2));
      }

      expectZodSuccess(result);
      expect(result.data).toEqual(category);
    });

    it('should validate default category', () => {
      const category = createDefaultCategory();
      const result = categorySchema.safeParse(category);

      expectZodSuccess(result);
      expect(result.data?.isDefault).toBe(true);
    });

    it('should validate custom category', () => {
      const category = createCustomCategory();
      const result = categorySchema.safeParse(category);

      expectZodSuccess(result);
      expect(result.data?.isDefault).toBe(false);
    });

    it('should reject category with missing id', () => {
      const invalid = { ...createCategory() };
      delete (invalid as Partial<typeof invalid>).id;
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject category with invalid id format', () => {
      const invalid = createCategory({ id: 'invalid_id_format' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject category with missing name', () => {
      const invalid = { ...createCategory() };
      delete (invalid as Partial<typeof invalid>).name;
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'name');
    });

    it('should reject category with empty name', () => {
      const invalid = createCategoryWithEmptyName();
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'name');
    });

    it('should reject category with name exceeding max length', () => {
      const invalid = createCategoryWithLongName();
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'name');
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50');
      }
    });

    it('should reject category with invalid color format', () => {
      const invalid = createCategoryWithInvalidColor();
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'color');
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('hex');
      }
    });

    it('should reject category with color not starting with #', () => {
      const invalid = createCategory({ color: '10b981' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'color');
    });

    it('should reject category with short color code', () => {
      const invalid = createCategory({ color: '#10b' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'color');
    });

    it('should reject category with long color code', () => {
      const invalid = createCategory({ color: '#10b9811' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'color');
    });

    it('should validate all valid colors from sharedFixtures', () => {
      const validColors = [
        sharedFixtures.colors.green,
        sharedFixtures.colors.blue,
        sharedFixtures.colors.red,
        sharedFixtures.colors.yellow,
        sharedFixtures.colors.purple,
        sharedFixtures.colors.orange,
      ];

      validColors.forEach((color) => {
        const category = createCategory({ color });
        const result = categorySchema.safeParse(category);
        expectZodSuccess(result);
      });
    });

    it('should reject all invalid colors from sharedFixtures', () => {
      const invalidColors = sharedFixtures.colors.invalid;

      invalidColors.forEach((color) => {
        const category = createCategory({ color });
        const result = categorySchema.safeParse(category);
        expectZodError(result, 'color');
      });
    });

    it('should reject category with missing iconName', () => {
      const invalid = { ...createCategory() };
      delete (invalid as Partial<typeof invalid>).iconName;
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'iconName');
    });

    it('should reject category with invalid iconName format', () => {
      const invalid = createCategory({ iconName: 'Invalid-Icon' }); // Capital letters not allowed
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'iconName');
    });

    it('should reject category with iconName starting with hyphen', () => {
      const invalid = createCategory({ iconName: '-shopping-cart' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'iconName');
    });

    it('should reject category with iconName starting with number', () => {
      const invalid = createCategory({ iconName: '1-shopping-cart' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'iconName');
    });

    it('should validate category with multi-word iconName', () => {
      const category = createCategory({ iconName: 'shopping-cart-plus' });
      const result = categorySchema.safeParse(category);

      expectZodSuccess(result);
    });

    it('should reject category with invalid timestamp format', () => {
      const invalid = createCategory({ createdAt: '2025-11-03' }); // Date only, not datetime
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'createdAt');
    });

    it('should reject category with invalid updatedAt format', () => {
      const invalid = createCategory({ updatedAt: 'not-a-date' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'updatedAt');
    });

    it('should trim whitespace from category name', () => {
      const category = createCategory({ name: '  Groceries  ' });
      const result = categorySchema.safeParse(category);

      expectZodSuccess(result);
      expect(result.data?.name).toBe('Groceries');
    });
  });

  describe('createCategoryInputSchema', () => {
    it('should validate create input with all required fields', () => {
      const input = {
        name: 'Groceries',
        iconName: 'shopping-cart',
        color: '#22c55e',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should reject create input with missing name', () => {
      const input = {
        iconName: 'shopping-cart',
        color: '#22c55e',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodError(result, 'name');
    });

    it('should reject create input with empty name', () => {
      const input = {
        name: '',
        iconName: 'shopping-cart',
        color: '#22c55e',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodError(result, 'name');
    });

    it('should reject create input with missing iconName', () => {
      const input = {
        name: 'Groceries',
        color: '#22c55e',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodError(result, 'iconName');
    });

    it('should reject create input with missing color', () => {
      const input = {
        name: 'Groceries',
        iconName: 'shopping-cart',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodError(result, 'color');
    });

    it('should reject create input with invalid color', () => {
      const input = {
        name: 'Groceries',
        iconName: 'shopping-cart',
        color: 'blue',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodError(result, 'color');
    });
  });

  describe('updateCategoryInputSchema', () => {
    it('should validate update input with no fields (all optional)', () => {
      const input = {};

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only name', () => {
      const input = {
        name: 'Updated Groceries',
      };

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only iconName', () => {
      const input = {
        iconName: 'utensils',
      };

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only color', () => {
      const input = {
        color: '#3b82f6',
      };

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with all fields', () => {
      const input = {
        name: 'Updated Groceries',
        iconName: 'utensils',
        color: '#3b82f6',
      };

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should reject update input with empty name', () => {
      const input = {
        name: '',
      };

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodError(result, 'name');
    });

    it('should reject update input with invalid color', () => {
      const input = {
        color: 'not-a-hex',
      };

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodError(result, 'color');
    });

    it('should reject update input with invalid iconName', () => {
      const input = {
        iconName: 'Invalid_Icon',
      };

      const result = updateCategoryInputSchema.safeParse(input);
      expectZodError(result, 'iconName');
    });
  });

  describe('categoryStorageSchema', () => {
    it('should validate storage with categories array', () => {
      const storage = {
        version: '1.0.0',
        categories: [createCategory(), createCategory()],
        totalSize: 2,
        lastModified: new Date().toISOString(),
      };

      const result = categoryStorageSchema.safeParse(storage);
      expectZodSuccess(result);
    });

    it('should validate storage with empty categories array', () => {
      const storage = {
        version: '1.0.0',
        categories: [],
        totalSize: 0,
        lastModified: new Date().toISOString(),
      };

      const result = categoryStorageSchema.safeParse(storage);
      expectZodSuccess(result);
    });

    it('should reject storage with invalid version format', () => {
      const storage = {
        version: '1.0', // Not semver
        categories: [],
        totalSize: 0,
        lastModified: new Date().toISOString(),
      };

      const result = categoryStorageSchema.safeParse(storage);
      expectZodError(result, 'version');
    });

    it('should reject storage with negative totalSize', () => {
      const storage = {
        version: '1.0.0',
        categories: [],
        totalSize: -1,
        lastModified: new Date().toISOString(),
      };

      const result = categoryStorageSchema.safeParse(storage);
      expectZodError(result, 'totalSize');
    });

    it('should reject storage with non-integer totalSize', () => {
      const storage = {
        version: '1.0.0',
        categories: [],
        totalSize: 1.5,
        lastModified: new Date().toISOString(),
      };

      const result = categoryStorageSchema.safeParse(storage);
      expectZodError(result, 'totalSize');
    });

    it('should reject storage with invalid lastModified', () => {
      const storage = {
        version: '1.0.0',
        categories: [],
        totalSize: 0,
        lastModified: '2025-11-03', // Date only
      };

      const result = categoryStorageSchema.safeParse(storage);
      expectZodError(result, 'lastModified');
    });
  });

  describe('validation functions', () => {
    it('validateCategory should return success for valid category', () => {
      const category = createCategory();
      const result = validateCategory(category);

      expectZodSuccess(result);
    });

    it('validateCategory should return error for invalid category', () => {
      const invalid = createCategoryWithInvalidColor();
      const result = validateCategory(invalid);

      expectZodError(result);
    });

    it('validateCreateCategoryInput should return success for valid input', () => {
      const input = {
        name: 'Groceries',
        iconName: 'shopping-cart',
        color: '#22c55e',
      };
      const result = validateCreateCategoryInput(input);

      expectZodSuccess(result);
    });

    it('validateCreateCategoryInput should return error for invalid input', () => {
      const input = {
        name: '',
        iconName: 'shopping-cart',
        color: '#22c55e',
      };
      const result = validateCreateCategoryInput(input);

      expectZodError(result);
    });

    it('validateUpdateCategoryInput should return success for valid input', () => {
      const input = {
        name: 'Updated Groceries',
      };
      const result = validateUpdateCategoryInput(input);

      expectZodSuccess(result);
    });

    it('validateUpdateCategoryInput should return error for invalid input', () => {
      const input = {
        color: 'not-hex',
      };
      const result = validateUpdateCategoryInput(input);

      expectZodError(result);
    });

    it('validateCategoryStorage should return success for valid storage', () => {
      const storage = {
        version: '1.0.0',
        categories: [createCategory()],
        totalSize: 1,
        lastModified: new Date().toISOString(),
      };
      const result = validateCategoryStorage(storage);

      expectZodSuccess(result);
    });

    it('validateCategoryStorage should return error for invalid storage', () => {
      const storage = {
        version: 'invalid',
        categories: [],
        totalSize: 0,
        lastModified: new Date().toISOString(),
      };
      const result = validateCategoryStorage(storage);

      expectZodError(result);
    });
  });
});
