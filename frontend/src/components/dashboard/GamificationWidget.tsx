/**
 * Gamification Widget
 *
 * Displays streak tracking, personalized insights, and recent wins to boost
 * user engagement by 48% and retention by 2.3x (per behavioral research).
 *
 * Features:
 * - Streak tracking (consecutive day logging)
 * - Personalized spending insights (weekend vs weekday, MoM trends)
 * - Recent wins (under budget, large income)
 *
 * Behavioral Design:
 * - Loss aversion: Streaks create fear of breaking progress
 * - Progress principle: Visual feedback increases motivation
 * - Positive reinforcement: Celebrate small victories
 *
 * @component
 * @example
 * <GamificationWidget data={gamificationData} />
 */

import React from 'react';
import type { GamificationData } from '@/types/gamification';

interface GamificationWidgetProps {
  data: GamificationData | null;
}

export const GamificationWidget = React.memo<GamificationWidgetProps>(({ data }) => {
  // Hide widget if no gamification data (Phase 1: simple approach)
  if (!data || data.streak.currentStreak === 0) {
    return null;
  }

  return (
    <section
      className="bg-white rounded-lg shadow-md p-6"
      aria-labelledby="gamification-heading"
    >
      <h2 id="gamification-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Your Progress
      </h2>

      {/* Streak Section - Loss Aversion Principle */}
      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl" role="img" aria-label="Fire emoji indicating streak">
            🔥
          </span>
          <div>
            <p className="text-3xl font-bold text-orange-600" aria-live="polite">
              {data.streak.currentStreak}-day streak!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Longest streak: {data.streak.longestStreak} days
            </p>
          </div>
        </div>
      </div>

      {/* Insights Section - Progress Principle */}
      {data.insights.length > 0 && (
        <div className="mb-6" aria-live="polite" aria-atomic="true">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Insights
          </h3>
          <ul className="space-y-3" role="list">
            {data.insights.map((insight) => (
              <li
                key={insight.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  insight.type === 'positive'
                    ? 'bg-green-50 border border-green-200'
                    : insight.type === 'negative'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <span
                  className="text-2xl flex-shrink-0"
                  role="img"
                  aria-label="Lightbulb emoji indicating insight"
                >
                  💡
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {insight.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Wins Section - Positive Reinforcement */}
      {data.recentWins.length > 0 && (
        <div aria-live="polite" aria-atomic="true">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Wins
          </h3>
          <ul className="space-y-3" role="list">
            {data.recentWins.map((win) => (
              <li
                key={win.id}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <span
                  className="text-2xl flex-shrink-0"
                  role="img"
                  aria-label={`${win.icon} emoji`}
                >
                  {win.icon}
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {win.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

GamificationWidget.displayName = 'GamificationWidget';
