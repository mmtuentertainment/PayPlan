/**
 * Tests for useGoals Hook (Feature 064)
 * PR78-1: Add comprehensive tests for business logic
 * Target: 80%+ coverage for hook business logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoals } from '../useGoals';
import * as GoalStorageService from '../../lib/GoalStorageService';
import { toast } from 'sonner';
import type { Goal } from '../../types/goal';

// Mock dependencies
vi.mock('../../lib/GoalStorageService');
vi.mock('sonner');

describe('useGoals', () => {
  // Mock goal data
  const mockGoal: Goal = {
    id: 'goal-123',
    name: 'Emergency Fund',
    targetAmount: 100000, // $1000
    currentAmount: 50000, // $500
    targetDate: '2025-12-31',
    category: 'savings',
    status: 'active',
    contributions: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  const mockGoal2: Goal = {
    id: 'goal-456',
    name: 'Vacation Fund',
    targetAmount: 200000, // $2000
    currentAmount: 100000, // $1000
    targetDate: '2025-06-30',
    category: 'savings',
    status: 'active',
    contributions: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock: loadGoals returns empty array
    vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
      goals: [],
      success: true,
      corrupted: false,
    });

    // Default mock: checkStorageQuota returns normal usage (sync function)
    vi.mocked(GoalStorageService.checkStorageQuota).mockReturnValue({
      usedBytes: 1000,
      estimatedLimitBytes: 5000000,
      usagePercent: 0.02,
      warning: false,
      critical: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Loading', () => {
    it('should load goals on mount', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal, mockGoal2],
        success: true,
        corrupted: false,
      });

      const { result } = renderHook(() => useGoals());

      expect(result.current.goals).toEqual([mockGoal, mockGoal2]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(GoalStorageService.loadGoals).toHaveBeenCalledTimes(1);
    });

    it('should set loading to false after mount', () => {
      const { result } = renderHook(() => useGoals());

      expect(result.current.loading).toBe(false);
    });

    it('should handle empty goals array', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [],
        success: true,
        corrupted: false,
      });

      const { result } = renderHook(() => useGoals());

      expect(result.current.goals).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle load error and set error state', () => {
      vi.mocked(GoalStorageService.loadGoals).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useGoals());

      expect(result.current.goals).toEqual([]);
      expect(result.current.error).toBe('Storage error');
      expect(result.current.loading).toBe(false);
    });

    it('should show toast when data is corrupted', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [],
        success: true,
        corrupted: true, // Data was corrupted and reset
      });

      renderHook(() => useGoals());

      expect(toast.error).toHaveBeenCalledWith(
        'Goal data was corrupted and has been reset',
        expect.objectContaining({
          description: expect.stringContaining('corrupted data'),
          duration: 10000, // Bot review M3: Error toasts use 10s (industry standard)
        })
      );
    });

    it('should check storage quota on mount', () => {
      renderHook(() => useGoals());

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalled();
    });

    it('should expose storage quota state', async () => {
      const mockQuota = {
        usedBytes: 2500000,
        estimatedLimitBytes: 5000000,
        usagePercent: 50,
        warning: false,
        critical: false,
      };

      vi.mocked(GoalStorageService.checkStorageQuota).mockReturnValue(mockQuota);

      const { result } = renderHook(() => useGoals());

      await waitFor(() => {
        expect(result.current.storageQuota).toEqual(mockQuota);
      });
    });

    it('should handle quota check failure gracefully', () => {
      vi.mocked(GoalStorageService.checkStorageQuota).mockImplementation(() => {
        throw new Error('Quota API unavailable');
      });

      const { result } = renderHook(() => useGoals());

      // Should still load goals even if quota check fails
      expect(result.current.goals).toBeDefined();
      expect(result.current.storageQuota).toBeNull();
    });
  });

  describe('refreshGoals', () => {
    it('should reload goals from storage', () => {
      vi.mocked(GoalStorageService.loadGoals)
        .mockReturnValueOnce({
          goals: [mockGoal],
          success: true,
          corrupted: false,
        })
        .mockReturnValueOnce({
          goals: [mockGoal, mockGoal2],
          success: true,
          corrupted: false,
        });

      const { result } = renderHook(() => useGoals());

      expect(result.current.goals).toEqual([mockGoal]);

      act(() => {
        result.current.refreshGoals();
      });

      expect(result.current.goals).toEqual([mockGoal, mockGoal2]);
      expect(GoalStorageService.loadGoals).toHaveBeenCalledTimes(2);
    });

    it('should clear error on successful refresh', () => {
      vi.mocked(GoalStorageService.loadGoals)
        .mockImplementationOnce(() => {
          throw new Error('Initial error');
        })
        .mockReturnValueOnce({
          goals: [mockGoal],
          success: true,
          corrupted: false,
        });

      const { result } = renderHook(() => useGoals());

      expect(result.current.error).toBe('Initial error');

      act(() => {
        result.current.refreshGoals();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.goals).toEqual([mockGoal]);
    });

    it('should update storage quota after refresh', () => {
      const { result } = renderHook(() => useGoals());

      const initialQuotaCalls = vi.mocked(GoalStorageService.checkStorageQuota).mock.calls.length;

      act(() => {
        result.current.refreshGoals();
      });

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalledTimes(initialQuotaCalls + 1);
    });
  });

  describe('createGoal', () => {
    it('should create goal and update state optimistically', () => {
      const newGoalInput = {
        name: 'New Car',
        targetAmount: 500000,
        targetDate: '2026-12-31',
        category: 'savings' as const,
      };

      const createdGoal: Goal = {
        id: 'goal-789',
        ...newGoalInput,
        currentAmount: 0,
        status: 'active',
        contributions: [],
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };

      vi.mocked(GoalStorageService.createGoal).mockReturnValue({
        success: true,
        data: createdGoal,
      });

      const { result } = renderHook(() => useGoals());

      let createResult;
      act(() => {
        createResult = result.current.createGoal(newGoalInput);
      });

      expect(createResult).toEqual({
        success: true,
        data: createdGoal,
      });
      expect(result.current.goals).toContainEqual(createdGoal);
      expect(result.current.error).toBeNull();
      expect(GoalStorageService.createGoal).toHaveBeenCalledWith(newGoalInput);
    });

    it('should check quota before creating goal', () => {
      const newGoalInput = {
        name: 'Test Goal',
        targetAmount: 100000,
        category: 'savings' as const,
      };

      vi.mocked(GoalStorageService.createGoal).mockReturnValue({
        success: true,
        data: { ...mockGoal, ...newGoalInput },
      });

      const { result } = renderHook(() => useGoals());

      act(() => {
        result.current.createGoal(newGoalInput);
      });

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalled();
    });

    it('should prevent creation when storage is critical (>95%)', async () => {
      vi.mocked(GoalStorageService.checkStorageQuota).mockReturnValue({
        usedBytes: 4800000,
        estimatedLimitBytes: 5000000,
        usagePercent: 96,
        warning: true,
        critical: true,
      });

      const newGoalInput = {
        name: 'Test Goal',
        targetAmount: 100000,
        category: 'savings' as const,
      };

      const { result } = renderHook(() => useGoals());

      // Wait for quota to be set (async operation on mount)
      await waitFor(() => {
        expect(result.current.storageQuota).not.toBeNull();
      });

      let createResult;
      act(() => {
        createResult = result.current.createGoal(newGoalInput);
      });

      expect(createResult).toEqual({
        success: false,
        error: expect.stringContaining('Storage limit exceeded'),
      });
      expect(result.current.error).toContain('Storage limit exceeded');
      expect(GoalStorageService.createGoal).not.toHaveBeenCalled();
    });

    it('should continue creation if quota check fails', () => {
      vi.mocked(GoalStorageService.checkStorageQuota).mockImplementation(() => {
        throw new Error('Quota API unavailable');
      });

      const newGoalInput = {
        name: 'Test Goal',
        targetAmount: 100000,
        category: 'savings' as const,
      };

      const createdGoal = { ...mockGoal, ...newGoalInput };

      vi.mocked(GoalStorageService.createGoal).mockReturnValue({
        success: true,
        data: createdGoal,
      });

      const { result } = renderHook(() => useGoals());

      let createResult;
      act(() => {
        createResult = result.current.createGoal(newGoalInput);
      });

      // Should proceed with creation even if quota check fails
      expect(createResult.success).toBe(true);
      expect(GoalStorageService.createGoal).toHaveBeenCalled();
    });

    it('should handle creation error and set error state', () => {
      const newGoalInput = {
        name: 'Test Goal',
        targetAmount: 100000,
        category: 'savings' as const,
      };

      vi.mocked(GoalStorageService.createGoal).mockReturnValue({
        success: false,
        error: 'Validation error',
      });

      const { result } = renderHook(() => useGoals());

      let createResult;
      act(() => {
        createResult = result.current.createGoal(newGoalInput);
      });

      expect(createResult).toEqual({
        success: false,
        error: 'Validation error',
      });
      expect(result.current.error).toBe('Validation error');
      expect(result.current.goals).toEqual([]); // State not updated on error
    });

    it('should update quota after successful creation', () => {
      const newGoalInput = {
        name: 'Test Goal',
        targetAmount: 100000,
        category: 'savings' as const,
      };

      vi.mocked(GoalStorageService.createGoal).mockReturnValue({
        success: true,
        data: { ...mockGoal, ...newGoalInput },
      });

      const { result } = renderHook(() => useGoals());

      const initialQuotaCalls = vi.mocked(GoalStorageService.checkStorageQuota).mock.calls.length;

      act(() => {
        result.current.createGoal(newGoalInput);
      });

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalledTimes(initialQuotaCalls + 2); // Once before, once after
    });

    it('should update quota state even when creation is blocked due to critical storage (PR85-3)', async () => {
      const newGoalInput = {
        name: 'Test Goal',
        targetAmount: 100000,
        category: 'savings' as const,
      };

      const criticalQuota = {
        usedBytes: 4800000,
        estimatedLimitBytes: 5000000,
        usagePercent: 96,
        warning: true,
        critical: true,
      };

      vi.mocked(GoalStorageService.checkStorageQuota).mockReturnValue(criticalQuota);

      const { result } = renderHook(() => useGoals());

      // Wait for quota to be set (async operation on mount)
      await waitFor(() => {
        expect(result.current.storageQuota).toEqual(criticalQuota);
      });

      let createResult;
      act(() => {
        createResult = result.current.createGoal(newGoalInput);
      });

      // Creation should fail
      expect(createResult).toEqual({
        success: false,
        error: expect.stringContaining('Storage limit exceeded'),
      });

      // But quota state should still reflect the critical state
      expect(result.current.storageQuota).toEqual(criticalQuota);

      // createGoal should NOT be called when quota is critical
      expect(GoalStorageService.createGoal).not.toHaveBeenCalled();
    });
  });

  describe('updateGoal', () => {
    it('should update goal and update state optimistically', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      const updatedGoal = {
        ...mockGoal,
        name: 'Updated Emergency Fund',
        targetAmount: 150000,
      };

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: updatedGoal,
      });

      const { result } = renderHook(() => useGoals());

      let updateResult;
      act(() => {
        updateResult = result.current.updateGoal('goal-123', {
          name: 'Updated Emergency Fund',
          targetAmount: 150000,
        });
      });

      expect(updateResult).toEqual({
        success: true,
        data: updatedGoal,
      });
      expect(result.current.goals[0]).toEqual(updatedGoal);
      expect(result.current.error).toBeNull();
    });

    it('should handle update error and set error state', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: false,
        error: 'Goal not found',
      });

      const { result } = renderHook(() => useGoals());

      let updateResult;
      act(() => {
        updateResult = result.current.updateGoal('goal-123', {
          name: 'Updated Name',
        });
      });

      expect(updateResult).toEqual({
        success: false,
        error: 'Goal not found',
      });
      expect(result.current.error).toBe('Goal not found');
      expect(result.current.goals[0]).toEqual(mockGoal); // State not updated on error
    });

    it('should update quota after successful update', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: { ...mockGoal, name: 'Updated' },
      });

      const { result } = renderHook(() => useGoals());

      const initialQuotaCalls = vi.mocked(GoalStorageService.checkStorageQuota).mock.calls.length;

      act(() => {
        result.current.updateGoal('goal-123', { name: 'Updated' });
      });

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalledTimes(initialQuotaCalls + 1);
    });
  });

  describe('deleteGoal', () => {
    it('should delete goal and remove from state optimistically', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal, mockGoal2],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.deleteGoal).mockReturnValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useGoals());

      expect(result.current.goals).toHaveLength(2);

      let deleteResult;
      act(() => {
        deleteResult = result.current.deleteGoal('goal-123');
      });

      expect(deleteResult).toEqual({
        success: true,
        data: undefined,
      });
      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].id).toBe('goal-456');
      expect(result.current.error).toBeNull();
    });

    it('should handle delete error and set error state', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.deleteGoal).mockReturnValue({
        success: false,
        error: 'Goal not found',
      });

      const { result } = renderHook(() => useGoals());

      let deleteResult;
      act(() => {
        deleteResult = result.current.deleteGoal('goal-123');
      });

      expect(deleteResult).toEqual({
        success: false,
        error: 'Goal not found',
      });
      expect(result.current.error).toBe('Goal not found');
      expect(result.current.goals).toHaveLength(1); // State not updated on error
    });

    it('should update quota after successful deletion', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.deleteGoal).mockReturnValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useGoals());

      const initialQuotaCalls = vi.mocked(GoalStorageService.checkStorageQuota).mock.calls.length;

      act(() => {
        result.current.deleteGoal('goal-123');
      });

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalledTimes(initialQuotaCalls + 1);
    });
  });

  describe('archiveGoal', () => {
    it('should archive goal and update state optimistically', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      const archivedGoal = {
        ...mockGoal,
        status: 'archived' as const,
      };

      vi.mocked(GoalStorageService.archiveGoal).mockReturnValue({
        success: true,
        data: archivedGoal,
      });

      const { result } = renderHook(() => useGoals());

      let archiveResult;
      act(() => {
        archiveResult = result.current.archiveGoal('goal-123');
      });

      expect(archiveResult).toEqual({
        success: true,
        data: archivedGoal,
      });
      expect(result.current.goals[0].status).toBe('archived');
      expect(result.current.error).toBeNull();
    });

    it('should handle archive error and set error state', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.archiveGoal).mockReturnValue({
        success: false,
        error: 'Goal not found',
      });

      const { result } = renderHook(() => useGoals());

      let archiveResult;
      act(() => {
        archiveResult = result.current.archiveGoal('goal-123');
      });

      expect(archiveResult).toEqual({
        success: false,
        error: 'Goal not found',
      });
      expect(result.current.error).toBe('Goal not found');
      expect(result.current.goals[0].status).toBe('active'); // State not updated on error
    });

    it('should update quota after successful archive', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.archiveGoal).mockReturnValue({
        success: true,
        data: { ...mockGoal, status: 'archived' },
      });

      const { result } = renderHook(() => useGoals());

      const initialQuotaCalls = vi.mocked(GoalStorageService.checkStorageQuota).mock.calls.length;

      act(() => {
        result.current.archiveGoal('goal-123');
      });

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalledTimes(initialQuotaCalls + 1);
    });
  });

  describe('unarchiveGoal', () => {
    it('should unarchive goal and update state optimistically', () => {
      const archivedGoal = {
        ...mockGoal,
        status: 'archived' as const,
      };

      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [archivedGoal],
        success: true,
        corrupted: false,
      });

      const unarchivedGoal = {
        ...archivedGoal,
        status: 'active' as const,
      };

      vi.mocked(GoalStorageService.unarchiveGoal).mockReturnValue({
        success: true,
        data: unarchivedGoal,
      });

      const { result } = renderHook(() => useGoals());

      let unarchiveResult;
      act(() => {
        unarchiveResult = result.current.unarchiveGoal('goal-123');
      });

      expect(unarchiveResult).toEqual({
        success: true,
        data: unarchivedGoal,
      });
      expect(result.current.goals[0].status).toBe('active');
      expect(result.current.error).toBeNull();
    });

    it('should handle unarchive error and set error state', () => {
      const archivedGoal = {
        ...mockGoal,
        status: 'archived' as const,
      };

      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [archivedGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.unarchiveGoal).mockReturnValue({
        success: false,
        error: 'Goal not found',
      });

      const { result } = renderHook(() => useGoals());

      let unarchiveResult;
      act(() => {
        unarchiveResult = result.current.unarchiveGoal('goal-123');
      });

      expect(unarchiveResult).toEqual({
        success: false,
        error: 'Goal not found',
      });
      expect(result.current.error).toBe('Goal not found');
      expect(result.current.goals[0].status).toBe('archived'); // State not updated on error
    });

    it('should update quota after successful unarchive', () => {
      const archivedGoal = {
        ...mockGoal,
        status: 'archived' as const,
      };

      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [archivedGoal],
        success: true,
        corrupted: false,
      });

      vi.mocked(GoalStorageService.unarchiveGoal).mockReturnValue({
        success: true,
        data: { ...archivedGoal, status: 'active' },
      });

      const { result } = renderHook(() => useGoals());

      const initialQuotaCalls = vi.mocked(GoalStorageService.checkStorageQuota).mock.calls.length;

      act(() => {
        result.current.unarchiveGoal('goal-123');
      });

      expect(GoalStorageService.checkStorageQuota).toHaveBeenCalledTimes(initialQuotaCalls + 1);
    });
  });

  describe('Cross-Tab Sync', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should listen for storage events on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useGoals());

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('should refresh goals when storage event for STORAGE_KEY occurs', () => {
      vi.mocked(GoalStorageService.loadGoals)
        .mockReturnValueOnce({
          goals: [mockGoal],
          success: true,
          corrupted: false,
        })
        .mockReturnValueOnce({
          goals: [mockGoal, mockGoal2],
          success: true,
          corrupted: false,
        });

      const { result } = renderHook(() => useGoals());

      expect(result.current.goals).toEqual([mockGoal]);

      // Simulate storage event from another tab + advance timer in single act
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'payplan_goals_v1',
          newValue: JSON.stringify([mockGoal, mockGoal2]),
        });
        window.dispatchEvent(storageEvent);

        // Fast-forward debounce timer (300ms) to trigger refresh
        vi.advanceTimersByTime(300);
      });

      // State should now be updated
      expect(result.current.goals).toEqual([mockGoal, mockGoal2]);
    });

    it('should debounce rapid storage events (300ms)', () => {
      vi.mocked(GoalStorageService.loadGoals)
        .mockReturnValue({
          goals: [mockGoal],
          success: true,
          corrupted: false,
        });

      renderHook(() => useGoals());

      const initialLoadCalls = vi.mocked(GoalStorageService.loadGoals).mock.calls.length;

      // Dispatch 5 rapid storage events
      act(() => {
        for (let i = 0; i < 5; i++) {
          const storageEvent = new StorageEvent('storage', {
            key: 'payplan_goals_v1',
            newValue: JSON.stringify([mockGoal]),
          });
          window.dispatchEvent(storageEvent);
        }
      });

      // Fast-forward 300ms (debounce time)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should only call loadGoals once despite 5 events (debounced)
      expect(GoalStorageService.loadGoals).toHaveBeenCalledTimes(initialLoadCalls + 1);
    });

    it('should ignore storage events for other keys', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      renderHook(() => useGoals());

      const initialLoadCalls = vi.mocked(GoalStorageService.loadGoals).mock.calls.length;

      // Dispatch storage event for different key
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'other_storage_key',
          newValue: 'some value',
        });
        window.dispatchEvent(storageEvent);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should NOT call loadGoals (different key)
      expect(GoalStorageService.loadGoals).toHaveBeenCalledTimes(initialLoadCalls);
    });

    it('should cleanup event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useGoals());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('should cleanup debounce timer on unmount', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
        corrupted: false,
      });

      const { unmount } = renderHook(() => useGoals());

      // Dispatch storage event
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'payplan_goals_v1',
          newValue: JSON.stringify([mockGoal]),
        });
        window.dispatchEvent(storageEvent);
      });

      const loadCallsBeforeUnmount = vi.mocked(GoalStorageService.loadGoals).mock.calls.length;

      // Unmount before debounce timer expires
      unmount();

      // Fast-forward past debounce time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should NOT call loadGoals after unmount (timer cleared)
      expect(GoalStorageService.loadGoals).toHaveBeenCalledTimes(loadCallsBeforeUnmount);
    });
  });
});
