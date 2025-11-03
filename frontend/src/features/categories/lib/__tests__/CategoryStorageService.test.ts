// CategoryStorageService Tests
// Feature #063: Business Logic Test Coverage - US2
// Target: 80%+ coverage for CategoryStorageService.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryStorageService } from '../CategoryStorageService';
import {
  createCategory,
  createCustomCategory,
  createDefaultCategory,
  createCategories,
} from './fixtures';
import type { Category, CreateCategoryInput } from '../../types/category';
import { ERROR_MESSAGES, MAX_CUSTOM_CATEGORIES, STORAGE_KEY } from '../constants';

describe('CategoryStorageService', () => {
  let service: CategoryStorageService;

  beforeEach(() => {
    service = new CategoryStorageService();
    localStorage.clear();
  });

  describe('loadCategories', () => {
    it('should initialize with pre-defined categories on first load', () => {
      const result = service.loadCategories();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data.every((cat) => cat.isDefault)).toBe(true);
        expect(result.data.every((cat) => cat.id.startsWith('cat_'))).toBe(true);
      }
    });

    it('should return categories from localStorage if they exist', () => {
      // First load initializes with defaults
      service.loadCategories();

      // Create category with unique name
      const createResult = service.createCategory({
        name: 'Unique Test Category',
        iconName: 'star',
        color: '#22c55e',
      });
      expect(createResult.success).toBe(true);

      // Second load should return all categories including new one
      const loadResult = service.loadCategories();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((cat) => cat.name === 'Unique Test Category');
        expect(found).toBeDefined();
      }
    });

    it('should return error for corrupted localStorage data', () => {
      // Manually corrupt localStorage
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const result = service.loadCategories();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(ERROR_MESSAGES.DESERIALIZATION_FAILED);
      }
    });

    it('should handle SecurityError when localStorage is denied', () => {
      // Mock localStorage.getItem to throw SecurityError
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function () {
        const error = new Error('localStorage access denied');
        error.name = 'SecurityError';
        throw error;
      };

      const result = service.loadCategories();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.STORAGE_ACCESS_DENIED);
      }

      // Restore
      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('createCategory', () => {
    beforeEach(() => {
      // Initialize with defaults
      service.loadCategories();
    });

    it('should create a new custom category', () => {
      const input: CreateCategoryInput = {
        name: 'Coffee Shops',
        iconName: 'coffee',
        color: '#8b5cf6',
      };

      const result = service.createCategory(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toMatch(/^cat_/);
        expect(result.data.name).toBe(input.name);
        expect(result.data.iconName).toBe(input.iconName);
        expect(result.data.color).toBe(input.color);
        expect(result.data.isDefault).toBe(false);
        expect(result.data.createdAt).toBeDefined();
        expect(result.data.updatedAt).toBeDefined();
      }
    });

    it('should persist category to localStorage', () => {
      const input: CreateCategoryInput = {
        name: 'Test Persistence',
        iconName: 'star',
        color: '#22c55e',
      };

      service.createCategory(input);

      // Reload from localStorage
      const loadResult = service.loadCategories();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((cat) => cat.name === input.name);
        expect(found).toBeDefined();
      }
    });

    it('should return error for duplicate category name (case-insensitive)', () => {
      const input: CreateCategoryInput = {
        name: 'Coffee',
        iconName: 'coffee',
        color: '#8b5cf6',
      };

      // First creation succeeds
      const firstResult = service.createCategory(input);
      expect(firstResult.success).toBe(true);

      // Second creation with same name (different case) fails
      const duplicateInput: CreateCategoryInput = {
        name: 'COFFEE', // Different case
        iconName: 'coffee',
        color: '#10b981',
      };

      const result = service.createCategory(duplicateInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME);
      }
    });

    it('should return error when max custom categories limit is reached', () => {
      // Create MAX_CUSTOM_CATEGORIES categories
      for (let i = 0; i < MAX_CUSTOM_CATEGORIES; i++) {
        const result = service.createCategory({
          name: `Category ${i}`,
          iconName: 'star',
          color: '#22c55e',
        });
        expect(result.success).toBe(true);
      }

      // Next creation should fail
      const result = service.createCategory({
        name: 'Over Limit',
        iconName: 'alert',
        color: '#ef4444',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.MAX_CATEGORIES_REACHED);
      }
    });

    it('should return error for invalid input (empty name)', () => {
      const input = {
        name: '', // Invalid: empty name
        iconName: 'star',
        color: '#22c55e',
      };

      const result = service.createCategory(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(ERROR_MESSAGES.INVALID_CATEGORY_DATA);
      }
    });

    it('should return error for invalid input (invalid color format)', () => {
      const input = {
        name: 'Test',
        iconName: 'star',
        color: 'not-a-hex-color', // Invalid format
      };

      const result = service.createCategory(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(ERROR_MESSAGES.INVALID_CATEGORY_DATA);
      }
    });

  });

  describe('updateCategory', () => {
    let existingCategory: Category;

    beforeEach(() => {
      // Initialize and create a category
      service.loadCategories();
      const createResult = service.createCategory({
        name: 'Original Name',
        iconName: 'star',
        color: '#22c55e',
      });
      if (createResult.success) {
        existingCategory = createResult.data;
      }
    });

    it('should update category name', () => {
      const result = service.updateCategory(existingCategory.id, {
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.id).toBe(existingCategory.id);
        // updatedAt should be >= createdAt (may be same if update is instant)
        expect(new Date(result.data.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(existingCategory.createdAt).getTime()
        );
      }
    });

    it('should update category icon and color', () => {
      const result = service.updateCategory(existingCategory.id, {
        iconName: 'coffee',
        color: '#8b5cf6',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.iconName).toBe('coffee');
        expect(result.data.color).toBe('#8b5cf6');
        expect(result.data.name).toBe(existingCategory.name); // Unchanged
      }
    });

    it('should persist updates to localStorage', () => {
      service.updateCategory(existingCategory.id, {
        name: 'Persisted Update',
      });

      // Reload from localStorage
      const loadResult = service.loadCategories();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((cat) => cat.id === existingCategory.id);
        expect(found?.name).toBe('Persisted Update');
      }
    });

    it('should return error for non-existent category', () => {
      const result = service.updateCategory('cat_nonexistent', {
        name: 'Updated',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }
    });

    it('should return error for duplicate name (case-insensitive)', () => {
      // Create another category
      service.createCategory({
        name: 'Existing Name',
        iconName: 'alert',
        color: '#ef4444',
      });

      // Try to update to existing name
      const result = service.updateCategory(existingCategory.id, {
        name: 'EXISTING NAME', // Different case
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME);
      }
    });

    it('should allow updating to same name (same category)', () => {
      const result = service.updateCategory(existingCategory.id, {
        name: existingCategory.name, // Same name
      });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteCategory', () => {
    let customCategory: Category;

    beforeEach(() => {
      // Initialize and create a custom category
      service.loadCategories();
      const createResult = service.createCategory({
        name: 'Deletable',
        iconName: 'trash',
        color: '#ef4444',
      });
      if (createResult.success) {
        customCategory = createResult.data;
      }
    });

    it('should delete custom category', () => {
      const result = service.deleteCategory(customCategory.id);

      expect(result.success).toBe(true);

      // Verify category is removed
      const loadResult = service.loadCategories();
      if (loadResult.success) {
        const found = loadResult.data.find((cat) => cat.id === customCategory.id);
        expect(found).toBeUndefined();
      }
    });

    it('should persist deletion to localStorage', () => {
      service.deleteCategory(customCategory.id);

      // Reload from localStorage
      const loadResult = service.loadCategories();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((cat) => cat.id === customCategory.id);
        expect(found).toBeUndefined();
      }
    });

    it('should return error when deleting non-existent category', () => {
      const result = service.deleteCategory('cat_nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }
    });

    it('should prevent deletion of default categories', () => {
      // Load defaults
      const loadResult = service.loadCategories();
      expect(loadResult.success).toBe(true);

      if (loadResult.success) {
        const defaultCategory = loadResult.data.find((cat) => cat.isDefault);
        expect(defaultCategory).toBeDefined();

        if (defaultCategory) {
          const result = service.deleteCategory(defaultCategory.id);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error).toBe(ERROR_MESSAGES.CANNOT_DELETE_DEFAULT);
          }
        }
      }
    });

    it('should allow force deletion with force option', () => {
      const result = service.deleteCategory(customCategory.id, { force: true });

      expect(result.success).toBe(true);

      // Verify category is removed
      const loadResult = service.loadCategories();
      if (loadResult.success) {
        const found = loadResult.data.find((cat) => cat.id === customCategory.id);
        expect(found).toBeUndefined();
      }
    });
  });

  describe('getCategory', () => {
    let category: Category;

    beforeEach(() => {
      service.loadCategories();
      const createResult = service.createCategory({
        name: 'Findable',
        iconName: 'search',
        color: '#3b82f6',
      });
      if (createResult.success) {
        category = createResult.data;
      }
    });

    it('should retrieve category by ID', () => {
      const result = service.getCategory(category.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(category.id);
        expect(result.data.name).toBe(category.name);
      }
    });

    it('should return error for non-existent category', () => {
      const result = service.getCategory('cat_nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }
    });
  });

  describe('clearAll', () => {
    it('should remove all categories from localStorage', () => {
      // Initialize with defaults
      service.loadCategories();

      // Clear all
      const clearResult = service.clearAll();
      expect(clearResult.success).toBe(true);

      // Verify localStorage is empty
      const data = localStorage.getItem(STORAGE_KEY);
      expect(data).toBeNull();
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', () => {
      // Initialize with defaults
      service.loadCategories();

      const result = service.getStorageStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalCategories).toBeGreaterThan(0);
        expect(result.data.defaultCategories).toBeGreaterThan(0);
        expect(result.data.customCategories).toBe(0); // No custom yet
        expect(result.data.storageSize).toBeGreaterThan(0);
        expect(result.data.storageSizePercentage).toBeGreaterThanOrEqual(0);
        expect(result.data.storageSizePercentage).toBeLessThanOrEqual(100);
      }
    });

    it('should reflect custom categories in stats', () => {
      service.loadCategories();

      // Create custom category
      service.createCategory({
        name: 'Custom',
        iconName: 'star',
        color: '#22c55e',
      });

      const result = service.getStorageStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customCategories).toBe(1);
        expect(result.data.totalCategories).toBe(result.data.defaultCategories + 1);
      }
    });
  });
});
