// Dashboard test fixtures
// Feature #063: Business Logic Test Coverage - US4
// Fixture Naming Convention:
// - Scenario factories: createEmptyDashboard(), createActiveDashboard(), createOverspentDashboard()
// - Composite fixtures combining transactions, categories, budgets, and goals

import type { Transaction } from '@/features/transactions/types/transaction';
import type { Category } from '@/features/categories/types/category';
import { createTransaction, createExpense, createIncome } from '@/features/transactions/lib/__tests__/fixtures/transaction-fixtures';
import { createCategory } from '@/features/categories/lib/__tests__/fixtures/category-fixtures';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';

/**
 * Goal interface for dashboard fixtures
 */
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  createdAt: string;
}

/**
 * Dashboard scenario data containing all related entities
 */
export interface DashboardScenario {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
}

/**
 * Create empty dashboard (no data)
 * Use case: New user, no transactions yet
 */
export function createEmptyDashboard(): DashboardScenario {
  return {
    transactions: [],
    categories: [],
    goals: [],
  };
}

/**
 * Create active dashboard with typical user data
 * Use case: Active user with recent transactions across multiple categories
 */
export function createActiveDashboard(): DashboardScenario {
  // Create categories
  const groceriesCategory = createCategory({
    id: 'cat_groceries',
    name: 'Groceries',
    iconName: 'shopping-cart',
    color: sharedFixtures.colors.green,
  });

  const transportCategory = createCategory({
    id: 'cat_transport',
    name: 'Transport',
    iconName: 'car',
    color: sharedFixtures.colors.blue,
  });

  const entertainmentCategory = createCategory({
    id: 'cat_entertainment',
    name: 'Entertainment',
    iconName: 'tv',
    color: sharedFixtures.colors.purple,
  });

  const categories = [groceriesCategory, transportCategory, entertainmentCategory];

  // Current month transactions (November 2025)
  const currentMonth = '2025-11';

  const transactions: Transaction[] = [
    // Groceries expenses ($300 total)
    createExpense({
      id: 'txn_grocery_1',
      amount: 10000, // $100
      description: 'Walmart',
      date: `${currentMonth}-05`,
      categoryId: groceriesCategory.id,
    }),
    createExpense({
      id: 'txn_grocery_2',
      amount: 15000, // $150
      description: 'Whole Foods',
      date: `${currentMonth}-12`,
      categoryId: groceriesCategory.id,
    }),
    createExpense({
      id: 'txn_grocery_3',
      amount: 5000, // $50
      description: 'Trader Joes',
      date: `${currentMonth}-20`,
      categoryId: groceriesCategory.id,
    }),

    // Transport expenses ($200 total)
    createExpense({
      id: 'txn_transport_1',
      amount: 8000, // $80
      description: 'Gas Station',
      date: `${currentMonth}-08`,
      categoryId: transportCategory.id,
    }),
    createExpense({
      id: 'txn_transport_2',
      amount: 12000, // $120
      description: 'Uber',
      date: `${currentMonth}-15`,
      categoryId: transportCategory.id,
    }),

    // Entertainment expenses ($100 total)
    createExpense({
      id: 'txn_entertainment_1',
      amount: 6000, // $60
      description: 'Netflix',
      date: `${currentMonth}-10`,
      categoryId: entertainmentCategory.id,
    }),
    createExpense({
      id: 'txn_entertainment_2',
      amount: 4000, // $40
      description: 'Movie Theater',
      date: `${currentMonth}-18`,
      categoryId: entertainmentCategory.id,
    }),

    // Income transactions
    createIncome({
      id: 'txn_income_1',
      amount: -300000, // -$3000 (negative = income)
      description: 'Paycheck',
      date: `${currentMonth}-01`,
    }),
    createIncome({
      id: 'txn_income_2',
      amount: -150000, // -$1500
      description: 'Freelance',
      date: `${currentMonth}-15`,
    }),
  ];

  // Goals
  const goals: Goal[] = [
    {
      id: 'goal_emergency',
      name: 'Emergency Fund',
      targetAmount: 500000, // $5000 target
      currentAmount: 250000, // $2500 saved (50%)
      targetDate: '2025-12-31',
      createdAt: sharedFixtures.dates.jan1.toISOString(),
    },
    {
      id: 'goal_vacation',
      name: 'Vacation',
      targetAmount: 200000, // $2000 target
      currentAmount: 50000, // $500 saved (25%)
      targetDate: '2026-06-01',
      createdAt: sharedFixtures.dates.jan1.toISOString(),
    },
  ];

  return {
    transactions,
    categories,
    goals,
  };
}

/**
 * Create overspent dashboard (user exceeded budgets)
 * Use case: User who overspent in multiple categories
 */
export function createOverspentDashboard(): DashboardScenario {
  // Create categories
  const diningCategory = createCategory({
    id: 'cat_dining',
    name: 'Dining Out',
    iconName: 'utensils',
    color: sharedFixtures.colors.orange,
  });

  const shoppingCategory = createCategory({
    id: 'cat_shopping',
    name: 'Shopping',
    iconName: 'shopping-bag',
    color: sharedFixtures.colors.red,
  });

  const categories = [diningCategory, shoppingCategory];

  // Current month transactions (November 2025)
  const currentMonth = '2025-11';

  const transactions: Transaction[] = [
    // Excessive dining expenses ($800 total - way over budget!)
    createExpense({
      id: 'txn_dining_1',
      amount: 25000, // $250
      description: 'Fancy Restaurant',
      date: `${currentMonth}-05`,
      categoryId: diningCategory.id,
    }),
    createExpense({
      id: 'txn_dining_2',
      amount: 30000, // $300
      description: 'Steakhouse',
      date: `${currentMonth}-12`,
      categoryId: diningCategory.id,
    }),
    createExpense({
      id: 'txn_dining_3',
      amount: 25000, // $250
      description: 'Sushi Place',
      date: `${currentMonth}-20`,
      categoryId: diningCategory.id,
    }),

    // Excessive shopping ($600 total)
    createExpense({
      id: 'txn_shopping_1',
      amount: 35000, // $350
      description: 'Amazon',
      date: `${currentMonth}-08`,
      categoryId: shoppingCategory.id,
    }),
    createExpense({
      id: 'txn_shopping_2',
      amount: 25000, // $250
      description: 'Mall',
      date: `${currentMonth}-15`,
      categoryId: shoppingCategory.id,
    }),

    // Limited income
    createIncome({
      id: 'txn_income_1',
      amount: -200000, // -$2000 (less than expenses!)
      description: 'Paycheck',
      date: `${currentMonth}-01`,
    }),
  ];

  // Goals with low progress (at-risk)
  const goals: Goal[] = [
    {
      id: 'goal_debt',
      name: 'Pay Off Credit Card',
      targetAmount: 500000, // $5000 target
      currentAmount: 50000, // Only $500 paid (10% - at-risk)
      targetDate: '2025-12-31', // Due soon!
      createdAt: sharedFixtures.dates.jan1.toISOString(),
    },
  ];

  return {
    transactions,
    categories,
    goals,
  };
}

/**
 * Create dashboard with recurring bills (for bill detection tests)
 * Uses dynamic dates within 90-day lookback window to ensure reliable detection
 */
export function createDashboardWithRecurringBills(): DashboardScenario {
  const utilitiesCategory = createCategory({
    id: 'cat_utilities',
    name: 'Utilities',
    iconName: 'zap',
    color: sharedFixtures.colors.yellow,
  });

  const categories = [utilitiesCategory];

  // Calculate dynamic dates within 90-day window (3 monthly occurrences)
  const today = new Date();

  // Month 1: ~60 days ago
  const month1 = new Date(today);
  month1.setDate(today.getDate() - 60);

  // Month 2: ~30 days ago
  const month2 = new Date(today);
  month2.setDate(today.getDate() - 30);

  // Month 3: ~5 days ago (most recent)
  const month3 = new Date(today);
  month3.setDate(today.getDate() - 5);

  // Recurring bills: Netflix ($15), Electric ($80), Internet ($60)
  // Pattern: Same description + amount, recurring monthly (~30 days apart)
  const transactions: Transaction[] = [
    // Netflix - recurring monthly on 15th
    createExpense({
      id: 'txn_netflix_1',
      amount: 1500, // $15
      description: 'Netflix Subscription',
      date: month1.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),
    createExpense({
      id: 'txn_netflix_2',
      amount: 1500,
      description: 'Netflix Subscription',
      date: month2.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),
    createExpense({
      id: 'txn_netflix_3',
      amount: 1500,
      description: 'Netflix Subscription',
      date: month3.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),

    // Electric bill - recurring ~monthly on 1st
    createExpense({
      id: 'txn_electric_1',
      amount: 8000, // $80
      description: 'Electric Company',
      date: month1.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),
    createExpense({
      id: 'txn_electric_2',
      amount: 8000,
      description: 'Electric Company',
      date: month2.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),
    createExpense({
      id: 'txn_electric_3',
      amount: 8000,
      description: 'Electric Company',
      date: month3.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),

    // Internet - recurring monthly on 5th
    createExpense({
      id: 'txn_internet_1',
      amount: 6000, // $60
      description: 'Comcast Internet',
      date: month1.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),
    createExpense({
      id: 'txn_internet_2',
      amount: 6000,
      description: 'Comcast Internet',
      date: month2.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),
    createExpense({
      id: 'txn_internet_3',
      amount: 6000,
      description: 'Comcast Internet',
      date: month3.toISOString().split('T')[0],
      categoryId: utilitiesCategory.id,
    }),
  ];

  return {
    transactions,
    categories,
    goals: [],
  };
}

/**
 * Create goal with specific progress percentage
 */
export function createGoal(overrides?: Partial<Goal>): Goal {
  return {
    id: 'goal_test',
    name: 'Test Goal',
    targetAmount: 100000, // $1000
    currentAmount: 50000, // $500 (50%)
    targetDate: '2025-12-31',
    createdAt: sharedFixtures.dates.jan1.toISOString(),
    ...overrides,
  };
}
