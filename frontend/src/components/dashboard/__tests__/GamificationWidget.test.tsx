/**
 * GamificationWidget Unit Tests
 *
 * Feature: 062-dashboard-chunk5-gamification
 * Tests: Empty state, populated state with fixtures
 *
 * These tests verify the gamification widget renders correctly with
 * both empty and populated data using the test fixtures.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GamificationWidget } from '../GamificationWidget';
import {
  mockGamificationData,
  mockEmptyGamificationData,
  mockLongStreakData,
} from '../../../../tests/fixtures/gamification.fixtures';

// Wrapper component for React Router
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('GamificationWidget', () => {
  describe('Empty State', () => {
    it('should display "Start Your Journey" heading for empty data', () => {
      renderWithRouter(<GamificationWidget data={mockEmptyGamificationData} />);
      expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
    });

    it('should display welcome message', () => {
      renderWithRouter(<GamificationWidget data={mockEmptyGamificationData} />);
      expect(screen.getByText('Welcome to PayPlan!')).toBeInTheDocument();
    });

    it('should display call-to-action button', () => {
      renderWithRouter(<GamificationWidget data={mockEmptyGamificationData} />);
      expect(
        screen.getByRole('button', { name: /navigate to transactions page/i })
      ).toBeInTheDocument();
    });

    it('should not display streak, insights, or wins sections', () => {
      renderWithRouter(<GamificationWidget data={mockEmptyGamificationData} />);
      expect(screen.queryByText(/\d+-day streak/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/💡 Personalized Insights/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/🎉 Recent Wins/i)).not.toBeInTheDocument();
    });
  });

  describe('Populated State - Standard Streak', () => {
    it('should display "Your Progress" heading for populated data', () => {
      renderWithRouter(<GamificationWidget data={mockGamificationData} />);
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    it('should display current streak correctly', () => {
      renderWithRouter(<GamificationWidget data={mockGamificationData} />);
      // mockGamificationData has 3-day streak
      expect(screen.getByText(/3-day streak/i)).toBeInTheDocument();
    });

    it('should display longest streak', () => {
      renderWithRouter(<GamificationWidget data={mockGamificationData} />);
      // mockGamificationData has longest streak of 5 days
      expect(screen.getByText(/Longest streak: 5 days/i)).toBeInTheDocument();
    });

    it('should display insights section with 2 insights', () => {
      renderWithRouter(<GamificationWidget data={mockGamificationData} />);
      // mockGamificationData has 2 insights (positive + neutral)
      expect(screen.getByText('Insights')).toBeInTheDocument();

      // Check insight messages
      expect(
        screen.getByText(/You spent 15% less this month compared to last month/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You spend 25% more on weekends/i)
      ).toBeInTheDocument();
    });

    it('should display recent wins section with 2 wins', () => {
      renderWithRouter(<GamificationWidget data={mockGamificationData} />);
      // mockGamificationData has 2 wins
      expect(screen.getByText('Recent Wins')).toBeInTheDocument();

      // Check win messages
      expect(
        screen.getByText(/You received a large income of \$1,500!/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You stayed under budget in Groceries/i)
      ).toBeInTheDocument();
    });
  });

  describe('Populated State - Long Streak', () => {
    it('should display long streak correctly', () => {
      renderWithRouter(<GamificationWidget data={mockLongStreakData} />);
      // mockLongStreakData has 30-day streak
      expect(screen.getByText(/30-day streak/i)).toBeInTheDocument();
      expect(screen.getByText(/Longest streak: 45 days/i)).toBeInTheDocument();
    });

    it('should display all 3 insight types', () => {
      renderWithRouter(<GamificationWidget data={mockLongStreakData} />);
      // mockLongStreakData has positive, neutral, and negative insights
      expect(
        screen.getByText(/You spent 15% less this month/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You spend 25% more on weekends/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your dining expenses increased by 20%/i)
      ).toBeInTheDocument();
    });

    it('should display all 3 win types', () => {
      renderWithRouter(<GamificationWidget data={mockLongStreakData} />);
      // mockLongStreakData has income, budget, and savings wins
      expect(
        screen.getByText(/You received a large income/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You stayed under budget/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You reached 50% of your Emergency Fund goal/i)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for empty state', () => {
      renderWithRouter(<GamificationWidget data={mockEmptyGamificationData} />);

      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'gamification-heading');
    });

    it('should have ARIA live regions for populated state', () => {
      const { container } = renderWithRouter(
        <GamificationWidget data={mockGamificationData} />
      );

      // Check for aria-live="polite" on streak, insights, and wins sections
      const liveRegions = container.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions.length).toBeGreaterThanOrEqual(1); // At least streak section
    });

    it('should have proper heading hierarchy', () => {
      renderWithRouter(<GamificationWidget data={mockGamificationData} />);

      // Main heading should be h2
      const mainHeading = screen.getByRole('heading', { level: 2, name: 'Your Progress' });
      expect(mainHeading).toBeInTheDocument();

      // Subsections should be h3
      const subsections = screen.getAllByRole('heading', { level: 3 });
      expect(subsections.length).toBeGreaterThanOrEqual(2); // Insights + Recent Wins
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data gracefully', () => {
      renderWithRouter(<GamificationWidget data={null as any} />);
      expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
    });

    it('should display empty state when streak is 0', () => {
      const dataWithZeroStreak = {
        ...mockGamificationData,
        streak: { currentStreak: 0, longestStreak: 5, lastActivityDate: new Date().toISOString() },
      };
      renderWithRouter(<GamificationWidget data={dataWithZeroStreak} />);
      expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
    });

    it('should handle single-day streak correctly', () => {
      const dataWithSingleStreak = {
        ...mockGamificationData,
        streak: { currentStreak: 1, longestStreak: 1, lastActivityDate: new Date().toISOString() },
      };
      renderWithRouter(<GamificationWidget data={dataWithSingleStreak} />);
      expect(screen.getByText(/1-day streak/i)).toBeInTheDocument();
    });

    it('should handle empty insights array', () => {
      const dataWithNoInsights = {
        ...mockGamificationData,
        insights: [],
      };
      renderWithRouter(<GamificationWidget data={dataWithNoInsights} />);
      // Should still show populated state (has streak)
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
      // But insights section should not appear
      expect(screen.queryByText('Insights')).not.toBeInTheDocument();
    });

    it('should handle empty wins array', () => {
      const dataWithNoWins = {
        ...mockGamificationData,
        recentWins: [],
      };
      renderWithRouter(<GamificationWidget data={dataWithNoWins} />);
      // Should still show populated state (has streak)
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
      // But wins section should not appear
      expect(screen.queryByText('Recent Wins')).not.toBeInTheDocument();
    });
  });
});
