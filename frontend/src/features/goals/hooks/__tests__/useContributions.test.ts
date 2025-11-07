/**
 * useContributions Hook Tests for Goal Tracking Dashboard (Feature 064)
 * Target: 80%+ coverage for business logic (Constitution v3.1)
 * Critical financial logic: contribution addition, undo state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContributions } from '../useContributions';
import * as GoalStorageService from '../../lib/GoalStorageService';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner');
vi.mock('../../lib/GoalStorageService');

describe('useContributions', () => {
  const mockGoal = {
    id: 'goal-123',
    name: 'Emergency Fund',
    targetAmount: 100000, // $1000
    currentAmount: 50000, // $500
    contributions: [],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    status: 'active' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addContribution', () => {
    it('should add contribution and update goal amount', () => {
      // Mock loadGoals to return test goal
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      // Mock updateGoal to succeed
      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: { ...mockGoal, currentAmount: 60000 },
      });

      const { result } = renderHook(() => useContributions());

      let addResult;
      act(() => {
        addResult = result.current.addContribution('goal-123', 10000); // Add $100
      });

      // Verify updateGoal was called with correct new amount
      expect(GoalStorageService.updateGoal).toHaveBeenCalledWith(
        'goal-123',
        expect.objectContaining({
          currentAmount: 60000, // $500 + $100 = $600
          contributions: expect.arrayContaining([
            expect.objectContaining({
              goalId: 'goal-123',
              amount: 10000,
            }),
          ]),
        })
      );

      // Verify success result
      expect(addResult).toEqual({
        success: true,
        data: expect.objectContaining({ currentAmount: 60000 }),
      });

      // Verify toast was shown
      expect(toast).toHaveBeenCalledWith(
        expect.stringContaining('$100.00'),
        expect.objectContaining({
          description: expect.stringContaining('$600.00'),
        })
      );
    });

    it('should handle goal not found error', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [],
        success: true,
      });

      const { result } = renderHook(() => useContributions());

      let addResult;
      act(() => {
        addResult = result.current.addContribution('nonexistent', 10000);
      });

      expect(addResult).toEqual({
        success: false,
        error: 'Goal not found: nonexistent',
      });
    });

    it('should detect goal completion at 100%', () => {
      const goalNearComplete = {
        ...mockGoal,
        currentAmount: 95000, // $950
        targetAmount: 100000, // $1000
      };

      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [goalNearComplete],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: { ...goalNearComplete, currentAmount: 105000 }, // $1050 (over 100%)
      });

      const onGoalComplete = vi.fn();
      const { result } = renderHook(() => useContributions(onGoalComplete));

      act(() => {
        result.current.addContribution('goal-123', 10000); // Add $100, should complete
      });

      // Verify completion toast message
      expect(toast).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          description: expect.stringContaining('🎉 Goal completed!'),
        })
      );

      // Verify onGoalComplete callback was called
      expect(onGoalComplete).toHaveBeenCalledWith(
        expect.objectContaining({ currentAmount: 105000 })
      );
    });

    it('should NOT trigger completion callback at 99%', () => {
      const goalAlmostComplete = {
        ...mockGoal,
        currentAmount: 98000, // $980
        targetAmount: 100000, // $1000
      };

      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [goalAlmostComplete],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: { ...goalAlmostComplete, currentAmount: 99000 }, // $990 (99%)
      });

      const onGoalComplete = vi.fn();
      const { result } = renderHook(() => useContributions(onGoalComplete));

      act(() => {
        result.current.addContribution('goal-123', 1000); // Add $10, total 99%
      });

      // Verify completion callback NOT called
      expect(onGoalComplete).not.toHaveBeenCalled();

      // Verify toast does NOT show completion message
      expect(toast).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          description: expect.not.stringContaining('Goal completed'),
        })
      );
    });

    it('should add contribution with note', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: mockGoal,
      });

      const { result } = renderHook(() => useContributions());

      act(() => {
        result.current.addContribution('goal-123', 10000, 'Bonus payment');
      });

      expect(GoalStorageService.updateGoal).toHaveBeenCalledWith(
        'goal-123',
        expect.objectContaining({
          contributions: expect.arrayContaining([
            expect.objectContaining({
              note: 'Bonus payment',
              amount: 10000,
            }),
          ]),
        })
      );
    });

    it('should handle storage update failure', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: false,
        error: 'Storage quota exceeded',
      });

      const { result } = renderHook(() => useContributions());

      let addResult;
      act(() => {
        addResult = result.current.addContribution('goal-123', 10000);
      });

      expect(addResult).toEqual({
        success: false,
        error: 'Storage quota exceeded',
      });

      // Verify no toast was shown on failure
      expect(toast).not.toHaveBeenCalled();
    });

    it('should handle exception during add', () => {
      vi.mocked(GoalStorageService.loadGoals).mockImplementation(() => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() => useContributions());

      let addResult;
      act(() => {
        addResult = result.current.addContribution('goal-123', 10000);
      });

      expect(addResult).toEqual({
        success: false,
        error: 'Network error',
      });
    });

    it('should save previous state for undo', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: mockGoal,
      });

      const { result } = renderHook(() => useContributions());

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.addContribution('goal-123', 10000);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should create contribution with unique ID and timestamp', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: mockGoal,
      });

      const { result } = renderHook(() => useContributions());

      act(() => {
        result.current.addContribution('goal-123', 10000);
      });

      const updateCall = vi.mocked(GoalStorageService.updateGoal).mock.calls[0];
      const contributionData = updateCall[1];
      const contribution = contributionData.contributions![0];

      // Verify contribution has ID and timestamp
      expect(contribution.id).toBeDefined();
      expect(typeof contribution.id).toBe('string');
      expect(contribution.id.length).toBeGreaterThan(0);
      expect(contribution.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO date format
    });
  });

  describe('undoContribution', () => {
    it('should restore previous state and show toast', () => {
      const goalBefore = { ...mockGoal, currentAmount: 50000 }; // $500
      const goalAfter = { ...mockGoal, currentAmount: 60000 }; // $600

      // First load: before contribution
      vi.mocked(GoalStorageService.loadGoals).mockReturnValueOnce({
        goals: [goalBefore],
        success: true,
      });

      // Update after contribution
      vi.mocked(GoalStorageService.updateGoal).mockReturnValueOnce({
        success: true,
        data: goalAfter,
      });

      const { result } = renderHook(() => useContributions());

      // Add contribution
      act(() => {
        result.current.addContribution('goal-123', 10000);
      });

      // Mock undo update
      vi.mocked(GoalStorageService.updateGoal).mockReturnValueOnce({
        success: true,
        data: goalBefore,
      });

      // Undo
      act(() => {
        result.current.undoContribution();
      });

      // Verify restoration
      expect(GoalStorageService.updateGoal).toHaveBeenLastCalledWith(
        'goal-123',
        expect.objectContaining({
          currentAmount: 50000, // Restored to $500
        })
      );

      // Verify undo toast
      expect(toast).toHaveBeenCalledWith(
        'Contribution undone',
        expect.objectContaining({
          description: expect.stringContaining('$500.00'),
        })
      );

      // Verify canUndo is now false
      expect(result.current.canUndo).toBe(false);
    });

    it('should handle undo when no contribution to undo', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useContributions());

      act(() => {
        result.current.undoContribution();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('No contribution to undo');
      expect(GoalStorageService.updateGoal).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle undo storage failure', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValueOnce({
        success: true,
        data: mockGoal,
      });

      const { result } = renderHook(() => useContributions());

      // Add contribution
      act(() => {
        result.current.addContribution('goal-123', 10000);
      });

      // Mock undo failure
      vi.mocked(GoalStorageService.updateGoal).mockReturnValueOnce({
        success: false,
        error: 'Storage error',
      });

      // Undo
      act(() => {
        result.current.undoContribution();
      });

      // Verify error toast
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to undo contribution',
        expect.objectContaining({
          description: 'Storage error',
        })
      );
    });

    it('should handle undo exception', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValueOnce({
        success: true,
        data: mockGoal,
      });

      const { result } = renderHook(() => useContributions());

      // Add contribution
      act(() => {
        result.current.addContribution('goal-123', 10000);
      });

      // Mock undo exception
      vi.mocked(GoalStorageService.updateGoal).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      // Undo
      act(() => {
        result.current.undoContribution();
      });

      // Verify error toast with exception message
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to undo contribution',
        expect.objectContaining({
          description: 'Unexpected error',
        })
      );
    });
  });

  describe('canUndo state', () => {
    it('should be false initially', () => {
      const { result } = renderHook(() => useContributions());
      expect(result.current.canUndo).toBe(false);
    });

    it('should be true after adding contribution', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: mockGoal,
      });

      const { result } = renderHook(() => useContributions());

      act(() => {
        result.current.addContribution('goal-123', 10000);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should be false after successful undo', () => {
      vi.mocked(GoalStorageService.loadGoals).mockReturnValue({
        goals: [mockGoal],
        success: true,
      });

      vi.mocked(GoalStorageService.updateGoal).mockReturnValue({
        success: true,
        data: mockGoal,
      });

      const { result } = renderHook(() => useContributions());

      // Add
      act(() => {
        result.current.addContribution('goal-123', 10000);
      });

      expect(result.current.canUndo).toBe(true);

      // Undo
      act(() => {
        result.current.undoContribution();
      });

      expect(result.current.canUndo).toBe(false);
    });
  });
});
