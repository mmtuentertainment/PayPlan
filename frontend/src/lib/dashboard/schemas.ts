/**
 * Zod Validation Schemas for Dashboard
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

import { z } from 'zod';

/**
 * Spending chart data schema
 */
export const SpendingChartDataSchema = z.object({
  categoryId: z.string().uuid().or(z.literal('uncategorized')),
  categoryName: z.string().min(1).max(50),
  categoryIcon: z.string().min(1),
  categoryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  amount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export type SpendingChartData = z.infer<typeof SpendingChartDataSchema>;

/**
 * Month data schema (for income vs. expenses chart)
 */
export const MonthDataSchema = z.object({
  month: z.enum(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']),
  income: z.number().nonnegative(),
  expenses: z.number().nonnegative(),
  net: z.number(),
});

/**
 * Income vs. expenses chart data schema
 */
export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().positive(),
});

export type IncomeExpensesChartData = z.infer<typeof IncomeExpensesChartDataSchema>;

/**
 * Upcoming bill schema
 */
export const UpcomingBillSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  categoryId: z.string().uuid().nullable(),
  categoryName: z.string().min(1).max(50),
  categoryIcon: z.string().min(1),
  isPaid: z.boolean(),
  isOverdue: z.boolean(),
  daysUntilDue: z.number(),
});

export type UpcomingBill = z.infer<typeof UpcomingBillSchema>;

/**
 * Goal progress schema
 */
export const GoalProgressSchema = z.object({
  goalId: z.string().uuid(),
  goalName: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  targetDate: z.string().datetime().nullable(),
  daysRemaining: z.number().nullable(),
  status: z.enum(['on-track', 'at-risk', 'completed']),
});

export type GoalProgress = z.infer<typeof GoalProgressSchema>;

/**
 * Streak data schema
 */
export const StreakDataSchema = z.object({
  currentStreak: z.number().nonnegative(),
  longestStreak: z.number().nonnegative(),
  lastActivityDate: z.string().datetime(),
});

export type StreakData = z.infer<typeof StreakDataSchema>;

/**
 * Recent win schema
 */
export const RecentWinSchema = z.object({
  id: z.string().uuid(),
  message: z.string().min(1).max(200),
  timestamp: z.string().datetime(),
  icon: z.string().min(1).max(2), // Single emoji
});

export type RecentWin = z.infer<typeof RecentWinSchema>;

/**
 * Personalized insight schema
 */
export const PersonalizedInsightSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['positive', 'negative', 'neutral']),
  category: z.string().min(1).max(50),
  percentageChange: z.number(),
  message: z.string().min(1).max(200),
});

export type PersonalizedInsight = z.infer<typeof PersonalizedInsightSchema>;

/**
 * Gamification data schema
 */
export const GamificationDataSchema = z.object({
  streak: StreakDataSchema,
  recentWins: z.array(RecentWinSchema).max(3),
  insights: z.array(PersonalizedInsightSchema).max(3),
});

export type GamificationData = z.infer<typeof GamificationDataSchema>;
