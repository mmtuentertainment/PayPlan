/**
 * GoalStorageService tests for Goal Tracking Dashboard (Feature 064)
 * Target: 80%+ coverage (storage/CRUD operations)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  archiveGoal,
  clearGoals,
} from '../GoalStorageService';
import { createGoal as createGoalFixture, createContribution } from './fixtures';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';
import { STORAGE_KEY, MAX_CONTRIBUTIONS } from '../constants';

describe('GoalStorageService', () => {
  beforeEach(() => {
    localStorage.clear(); // Isolate tests
    vi.clearAllMocks();
  });

  describe('loadGoals', () => {
    it('should return empty array when localStorage is empty', () => {
      const result = loadGoals();
      expect(result).toEqual([]);
    });

    it('should return empty array when data is corrupted', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json{{{');
      const result = loadGoals();
      expect(result).toEqual([]);
    });

    it('should return empty array when storage format is invalid', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: 'format' }));
      const result = loadGoals();
      expect(result).toEqual([]);
    });

    it('should load valid goals from localStorage', () => {
      const goal = createGoalFixture();
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = loadGoals();
      expect(result).toEqual([goal]);
    });

    it('should load multiple goals', () => {
      const goal1 = createGoalFixture({ id: sharedFixtures.ids.goalId1 });
      const goal2 = createGoalFixture({ id: sharedFixtures.ids.goalId2 });
      const storage = {
        version: '1.0.0',
        goals: [goal1, goal2],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = loadGoals();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(sharedFixtures.ids.goalId1);
      expect(result[1].id).toBe(sharedFixtures.ids.goalId2);
    });
  });

  describe('getGoal', () => {
    it('should return null when goal not found', () => {
      const result = getGoal('goal_nonexistent');
      expect(result).toBeNull();
    });

    it('should return goal by ID', () => {
      const goal = createGoalFixture({ id: sharedFixtures.ids.goalId1 });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = getGoal(sharedFixtures.ids.goalId1);
      expect(result).toEqual(goal);
    });

    it('should find goal among multiple', () => {
      const goal1 = createGoalFixture({ id: sharedFixtures.ids.goalId1, name: 'Goal 1' });
      const goal2 = createGoalFixture({ id: sharedFixtures.ids.goalId2, name: 'Goal 2' });
      const storage = {
        version: '1.0.0',
        goals: [goal1, goal2],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = getGoal(sharedFixtures.ids.goalId2);
      expect(result).toEqual(goal2);
      expect(result?.name).toBe('Goal 2');
    });
  });

  describe('createGoal', () => {
    it('should create valid goal', () => {
      const input = {
        name: 'Emergency Fund',
        targetAmount: sharedFixtures.amounts.thousandDollars,
        targetDate: '2026-06-30',
        monthlyContribution: sharedFixtures.amounts.fiftyDollars,
      };

      const result = createGoal(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Emergency Fund');
        expect(result.data.targetAmount).toBe(sharedFixtures.amounts.thousandDollars);
        expect(result.data.currentAmount).toBe(0); // New goals start at $0
        expect(result.data.status).toBe('active');
        expect(result.data.contributions).toEqual([]);
        expect(result.data.id).toMatch(/^goal_[a-z0-9]+$/);
      }
    });

    it('should persist goal to localStorage', () => {
      const input = {
        name: 'Vacation Fund',
        targetAmount: sharedFixtures.amounts.fiveHundredDollars,
        targetDate: null,
        monthlyContribution: null,
      };

      createGoal(input);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.goals).toHaveLength(1);
      expect(parsed.goals[0].name).toBe('Vacation Fund');
    });

    it('should reject invalid input (missing name)', () => {
      const input = {
        targetAmount: sharedFixtures.amounts.thousandDollars,
        targetDate: null,
        monthlyContribution: null,
      };

      const result = createGoal(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid');
      }
    });

    it('should reject invalid input (negative targetAmount)', () => {
      const input = {
        name: 'Invalid Goal',
        targetAmount: -100,
        targetDate: null,
        monthlyContribution: null,
      };

      const result = createGoal(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid');
      }
    });

    it('should trim whitespace from name', () => {
      const input = {
        name: '  Emergency Fund  ',
        targetAmount: sharedFixtures.amounts.thousandDollars,
        targetDate: null,
        monthlyContribution: null,
      };

      const result = createGoal(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Emergency Fund');
      }
    });
  });

  describe('updateGoal', () => {
    it('should update goal name', () => {
      const goal = createGoalFixture({ id: sharedFixtures.ids.goalId1, name: 'Old Name' });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = updateGoal(sharedFixtures.ids.goalId1, { name: 'New Name' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('New Name');
        expect(result.data.targetAmount).toBe(goal.targetAmount); // Unchanged
      }
    });

    it('should update target amount', () => {
      const goal = createGoalFixture({ id: sharedFixtures.ids.goalId1 });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = updateGoal(sharedFixtures.ids.goalId1, {
        targetAmount: sharedFixtures.amounts.fiveHundredDollars,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetAmount).toBe(sharedFixtures.amounts.fiveHundredDollars);
      }
    });

    it('should update multiple fields', () => {
      const goal = createGoalFixture({ id: sharedFixtures.ids.goalId1 });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = updateGoal(sharedFixtures.ids.goalId1, {
        name: 'Updated Goal',
        targetAmount: sharedFixtures.amounts.fiveHundredDollars,
        targetDate: '2026-12-31',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Goal');
        expect(result.data.targetAmount).toBe(sharedFixtures.amounts.fiveHundredDollars);
        expect(result.data.targetDate).toBe('2026-12-31');
      }
    });

    it('should return error when goal not found', () => {
      const result = updateGoal('goal_nonexistent', { name: 'New Name' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Goal not found');
      }
    });

    it('should reject invalid updates', () => {
      const goal = createGoalFixture({ id: sharedFixtures.ids.goalId1 });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = updateGoal(sharedFixtures.ids.goalId1, { targetAmount: -100 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid');
      }
    });

  });

  describe('deleteGoal', () => {
    it('should delete goal by ID', () => {
      const goal = createGoalFixture({ id: sharedFixtures.ids.goalId1 });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = deleteGoal(sharedFixtures.ids.goalId1);

      expect(result.success).toBe(true);

      // Verify goal is gone
      const goals = loadGoals();
      expect(goals).toHaveLength(0);
    });

    it('should delete correct goal among multiple', () => {
      const goal1 = createGoalFixture({ id: sharedFixtures.ids.goalId1, name: 'Goal 1' });
      const goal2 = createGoalFixture({ id: sharedFixtures.ids.goalId2, name: 'Goal 2' });
      const storage = {
        version: '1.0.0',
        goals: [goal1, goal2],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = deleteGoal(sharedFixtures.ids.goalId1);

      expect(result.success).toBe(true);

      // Verify only goal2 remains
      const goals = loadGoals();
      expect(goals).toHaveLength(1);
      expect(goals[0].name).toBe('Goal 2');
    });

    it('should return error when goal not found', () => {
      const result = deleteGoal('goal_nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Goal not found');
      }
    });
  });

  describe('addContribution', () => {
    it('should add contribution to goal', () => {
      const goal = createGoalFixture({
        id: sharedFixtures.ids.goalId1,
        currentAmount: 50000, // $500
      });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const contribution = createContribution({
        goalId: sharedFixtures.ids.goalId1,
        amount: sharedFixtures.amounts.hundredDollars,
      });

      const result = addContribution(sharedFixtures.ids.goalId1, contribution);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAmount).toBe(60000); // $500 + $100
        expect(result.data.contributions).toHaveLength(1);
        expect(result.data.contributions[0]).toEqual(contribution);
      }
    });

    it('should auto-complete goal when target reached', () => {
      const goal = createGoalFixture({
        id: sharedFixtures.ids.goalId1,
        currentAmount: 90000, // $900
        targetAmount: sharedFixtures.amounts.thousandDollars, // $1000
      });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const contribution = createContribution({
        goalId: sharedFixtures.ids.goalId1,
        amount: sharedFixtures.amounts.hundredDollars, // $100 → reaches target
      });

      const result = addContribution(sharedFixtures.ids.goalId1, contribution);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAmount).toBe(100000); // $1000
        expect(result.data.status).toBe('completed'); // Auto-completed!
      }
    });

    it('should reject when goal not found', () => {
      const contribution = createContribution({ goalId: 'goal_nonexistent' });
      const result = addContribution('goal_nonexistent', contribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Goal not found');
      }
    });

    it('should reject when MAX_CONTRIBUTIONS reached', () => {
      const contributions = Array.from({ length: MAX_CONTRIBUTIONS }, (_, i) =>
        createContribution({ id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}` })
      );
      const goal = createGoalFixture({
        id: sharedFixtures.ids.goalId1,
        contributions,
      });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const newContribution = createContribution({ goalId: sharedFixtures.ids.goalId1 });
      const result = addContribution(sharedFixtures.ids.goalId1, newContribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Maximum 100 contributions');
      }
    });
  });

  describe('archiveGoal', () => {
    it('should archive completed goal', () => {
      const goal = createGoalFixture({
        id: sharedFixtures.ids.goalId1,
        status: 'completed',
      });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = archiveGoal(sharedFixtures.ids.goalId1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('archived');
      }
    });

    it('should reject archiving non-completed goal', () => {
      const goal = createGoalFixture({
        id: sharedFixtures.ids.goalId1,
        status: 'active', // NOT completed
      });
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      const result = archiveGoal(sharedFixtures.ids.goalId1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('completed goals');
      }
    });

    it('should return error when goal not found', () => {
      const result = archiveGoal('goal_nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Goal not found');
      }
    });
  });

  describe('clearGoals', () => {
    it('should clear all goals from localStorage', () => {
      const goal = createGoalFixture();
      const storage = {
        version: '1.0.0',
        goals: [goal],
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      clearGoals();

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();

      // Verify loadGoals returns empty
      const goals = loadGoals();
      expect(goals).toEqual([]);
    });
  });
});
