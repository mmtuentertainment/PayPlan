/**
 * Goals Page
 * Feature: Goal Tracking Dashboard (064-short-name-goal)
 * Created: 2025-11-05
 *
 * Main page for goal tracking with dashboard metrics and goal list.
 *
 * User Stories:
 * - US1: View Dashboard (metrics + goal list)
 * - US2: Create Goal (via dialog)
 * - US3: Edit Goal (via dialog)
 * - US4: Quick-Add Contributions (preset buttons with undo)
 * - US5: Delete Goal (with confirmation)
 */

import React, { useState } from 'react';
import { GoalMetrics } from '@/features/goals/components/GoalMetrics';
import { GoalSkeleton } from '@/features/goals/components/GoalSkeleton';
import { GoalEmptyState } from '@/features/goals/components/GoalEmptyState';
import { GoalForm } from '@/features/goals/components/GoalForm';
import { GoalList } from '@/features/goals/components/GoalList';
import { QuickAddSection } from '@/features/goals/components/QuickAddSection';
import { useGoalMetrics } from '@/features/goals/hooks/useGoalMetrics';
import { useGoals } from '@/features/goals/hooks/useGoals';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '@/features/goals/types/goal';

/**
 * Goals Page Component
 *
 * @component
 * @returns Goals dashboard page
 *
 * @accessibility
 * - Semantic HTML structure (header, main, sections)
 * - Proper heading hierarchy (h1, h2)
 * - Loading skeletons announced to screen readers
 * - WCAG 2.2 AA compliant
 *
 * @responsive
 * - Mobile (375px): 1 column cards
 * - Tablet (768px): 2 column metrics, 2 column goals
 * - Desktop (1920px): 4 column metrics, 3 column goals
 */
export const Goals: React.FC = () => {
  const { goals, loading: isLoading, createGoal, updateGoal, deleteGoal, refreshGoals } = useGoals();
  const metrics = useGoalMetrics(goals);

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | undefined>(undefined);

  /**
   * Open create goal dialog
   */
  const handleCreateGoal = () => {
    setFormMode('create');
    setSelectedGoal(undefined);
    setIsFormOpen(true);
  };

  /**
   * Open edit goal dialog
   */
  const handleEditGoal = (goal: Goal) => {
    setFormMode('edit');
    setSelectedGoal(goal);
    setIsFormOpen(true);
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Confirm delete
   */
  const handleConfirmDelete = () => {
    if (goalToDelete) {
      const result = deleteGoal(goalToDelete.id);
      if (result.success) {
        setIsDeleteDialogOpen(false);
        setGoalToDelete(undefined);
      } else {
        // TODO: Show error toast (Group 6 or later)
        alert(`Failed to delete goal: ${result.error}`);
      }
    }
  };

  /**
   * Handle form submission (create or edit)
   */
  const handleFormSubmit = (data: CreateGoalInput | UpdateGoalInput) => {
    if (formMode === 'create') {
      const result = createGoal(data as CreateGoalInput);
      if (result.success) {
        setIsFormOpen(false);
      } else {
        // TODO: Show error toast (Group 6 or later)
        alert(`Failed to create goal: ${result.error}`);
      }
    } else if (selectedGoal) {
      const result = updateGoal(selectedGoal.id, data as UpdateGoalInput);
      if (result.success) {
        setIsFormOpen(false);
        setSelectedGoal(undefined);
      } else {
        // TODO: Show error toast (Group 6 or later)
        alert(`Failed to update goal: ${result.error}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
        <p className="text-gray-600 mt-2">
          Track your savings goals and celebrate your wins
        </p>
      </header>

      <main>
        {/* Dashboard Metrics (US1) */}
        {isLoading ? (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-lg shadow-sm animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <GoalMetrics metrics={metrics} />
          </div>
        )}

        {/* Quick Add Section (US4) */}
        {!isLoading && goals.length > 0 && (
          <div className="mb-8">
            <QuickAddSection
              goals={goals}
              onContributionAdded={refreshGoals}
            />
          </div>
        )}

        {/* Goal List Section */}
        <section aria-labelledby="goals-list-heading">
          <div className="flex items-center justify-between mb-6">
            <h2
              id="goals-list-heading"
              className="text-2xl font-semibold text-gray-900"
            >
              Your Goals
            </h2>
            {!isLoading && goals.length > 0 && (
              <button
                onClick={handleCreateGoal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Goal
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && <GoalSkeleton count={3} />}

          {/* Empty State */}
          {!isLoading && goals.length === 0 && (
            <GoalEmptyState onCreateGoal={handleCreateGoal} />
          )}

          {/* Goal List */}
          {!isLoading && goals.length > 0 && (
            <GoalList
              goals={goals}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          )}
        </section>
      </main>

      {/* Goal Form Dialog (US2: Create, US3: Edit) */}
      <GoalForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedGoal(undefined);
        }}
        onSubmit={handleFormSubmit}
        goal={selectedGoal}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog (US4: Delete) */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{goalToDelete?.name}"? This action cannot be
              undone. All contribution history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
