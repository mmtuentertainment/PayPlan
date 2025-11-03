// Realistic test data generator using faker.js
// Feature #063: Business Logic Test Coverage
// Phase 1.5: Enhanced fixtures for UI/UX testing

import { faker } from '@faker-js/faker';
import type { Transaction } from '@/features/transactions/types/transaction';
import type { Category } from '@/features/categories/types/category';
import type { Budget } from '@/features/budgets/types/budget';

/**
 * Seed faker for deterministic tests
 * Call this in beforeEach for reproducible results
 */
export const seedFaker = (seed: number = 12345): void => {
  faker.seed(seed);
};

/**
 * Create a realistic transaction with natural spending patterns
 */
export const createRealisticTransaction = (overrides?: Partial<Transaction>): Transaction => {
  const categories = [
    'cat_groceries',
    'cat_dining',
    'cat_entertainment',
    'cat_transportation',
    'cat_utilities',
  ];

  // Realistic amount distribution: 70% small ($5-50), 20% medium ($50-200), 10% large ($200-1000)
  const rand = Math.random();
  let amount: number;
  if (rand < 0.7) {
    amount = faker.number.int({ min: 500, max: 5000 }); // $5-$50
  } else if (rand < 0.9) {
    amount = faker.number.int({ min: 5000, max: 20000 }); // $50-$200
  } else {
    amount = faker.number.int({ min: 20000, max: 100000 }); // $200-$1000
  }

  return {
    id: `txn_${faker.string.alphanumeric(32)}`,
    amount,
    description: faker.commerce.productName(),
    date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    categoryId: faker.helpers.arrayElement(categories),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
};

/**
 * Create realistic category with common spending types
 */
export const createRealisticCategory = (overrides?: Partial<Category>): Category => {
  const categoryNames = [
    'Groceries',
    'Dining Out',
    'Entertainment',
    'Transportation',
    'Utilities',
    'Healthcare',
    'Shopping',
    'Subscriptions',
    'Travel',
    'Savings',
  ];

  const iconNames = [
    'shopping-cart',
    'coffee',
    'film',
    'car',
    'zap',
    'heart',
    'shopping-bag',
    'repeat',
    'plane',
    'piggy-bank',
  ];

  const colors = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#a855f7', // purple
    '#eab308', // yellow
    '#ef4444', // red
    '#ec4899', // pink
    '#6366f1', // indigo
    '#f97316', // orange
    '#14b8a6', // teal
    '#06b6d4', // cyan
  ];

  const index = faker.number.int({ min: 0, max: categoryNames.length - 1 });

  return {
    id: `cat_${faker.string.alphanumeric(32)}`,
    name: categoryNames[index],
    iconName: iconNames[index],
    color: colors[index],
    isDefault: faker.datatype.boolean(0.3), // 30% default categories
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
};

/**
 * Create realistic budget with typical monthly amounts
 */
export const createRealisticBudget = (overrides?: Partial<Budget>): Budget => {
  const categories = [
    { id: 'cat_groceries', avgBudget: 50000 },      // $500
    { id: 'cat_dining', avgBudget: 30000 },         // $300
    { id: 'cat_entertainment', avgBudget: 15000 },  // $150
    { id: 'cat_transportation', avgBudget: 20000 }, // $200
    { id: 'cat_utilities', avgBudget: 15000 },      // $150
  ];

  const category = faker.helpers.arrayElement(categories);
  const variance = faker.number.float({ min: 0.8, max: 1.2 }); // ±20% variance

  return {
    id: `budget_${faker.string.alphanumeric(32)}`,
    categoryId: category.id,
    amount: Math.round(category.avgBudget * variance),
    period: faker.date.recent({ days: 90 }).toISOString().slice(0, 7), // YYYY-MM
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
};

/**
 * Generate a month of realistic transactions with spending patterns
 *
 * Patterns:
 * - More transactions on weekends (dining, entertainment)
 * - Regular fixed expenses (rent, utilities on 1st of month)
 * - Grocery shopping 2-3x per week
 * - Random purchases throughout month
 */
export const createMonthOfTransactions = (count: number = 100): Transaction[] => {
  const transactions: Transaction[] = [];
  const startDate = new Date();
  startDate.setDate(1); // Start of month

  // Fixed monthly expenses (rent, utilities)
  transactions.push(
    createRealisticTransaction({
      amount: 150000, // $1500 rent
      description: 'Monthly Rent',
      categoryId: 'cat_housing',
      date: new Date(startDate).toISOString().split('T')[0],
    }),
    createRealisticTransaction({
      amount: 15000, // $150 utilities
      description: 'Electric & Gas',
      categoryId: 'cat_utilities',
      date: new Date(startDate).toISOString().split('T')[0],
    })
  );

  // Generate remaining transactions with realistic patterns
  for (let i = 0; i < count - 2; i++) {
    const dayOfMonth = faker.number.int({ min: 1, max: 30 });
    const date = new Date(startDate);
    date.setDate(dayOfMonth);

    // Weekend transactions (dining, entertainment)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend && Math.random() < 0.7) {
      transactions.push(
        createRealisticTransaction({
          categoryId: faker.helpers.arrayElement(['cat_dining', 'cat_entertainment']),
          date: date.toISOString().split('T')[0],
        })
      );
    } else {
      // Weekday transactions (groceries, transportation, misc)
      transactions.push(
        createRealisticTransaction({
          date: date.toISOString().split('T')[0],
        })
      );
    }
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
};

/**
 * Create a realistic user profile with categories, budgets, and transactions
 *
 * Simulates typical Gen Z user (18-35) living paycheck-to-paycheck:
 * - 5-10 categories
 * - Monthly budgets for each category
 * - 80-120 transactions per month
 * - Some months over budget, some under
 */
export const createTypicalUserProfile = () => {
  // Create 5-10 categories
  const categoryCount = faker.number.int({ min: 5, max: 10 });
  const categories = Array.from({ length: categoryCount }, () =>
    createRealisticCategory()
  );

  // Create budgets for each category
  const budgets = categories.map((cat) =>
    createRealisticBudget({ categoryId: cat.id })
  );

  // Create 80-120 transactions for the current month
  const transactionCount = faker.number.int({ min: 80, max: 120 });
  const transactions = createMonthOfTransactions(transactionCount);

  return {
    categories,
    budgets,
    transactions,
    metadata: {
      totalBudget: budgets.reduce((sum, b) => sum + b.amount, 0),
      totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
      categoriesCount: categories.length,
      transactionsCount: transactions.length,
    },
  };
};

/**
 * Create edge case transactions for testing UI limits
 */
export const createEdgeCaseTransactions = () => ({
  // Very long description (UI truncation test)
  longDescription: createRealisticTransaction({
    description: faker.lorem.sentence(50), // ~200 chars
  }),

  // Very small amount (penny)
  smallAmount: createRealisticTransaction({
    amount: 1, // $0.01
    description: 'Penny transaction',
  }),

  // Very large amount (big purchase)
  largeAmount: createRealisticTransaction({
    amount: 500000, // $5,000
    description: 'Large purchase',
  }),

  // Uncategorized transaction
  uncategorized: createRealisticTransaction({
    categoryId: undefined,
    description: 'Uncategorized expense',
  }),

  // Many transactions same day (UI grouping test)
  sameDay: Array.from({ length: 20 }, () =>
    createRealisticTransaction({
      date: new Date().toISOString().split('T')[0],
    })
  ),
});

/**
 * Create stress test dataset (large volume)
 */
export const createStressTestData = () => ({
  // 1000 transactions (performance test)
  transactions: Array.from({ length: 1000 }, () => createRealisticTransaction()),

  // 50 categories (UI scrolling test)
  categories: Array.from({ length: 50 }, (_, i) =>
    createRealisticCategory({ name: `Category ${i + 1}` })
  ),

  // 100 budgets (filtering performance test)
  budgets: Array.from({ length: 100 }, () => createRealisticBudget()),
});

/**
 * Create test data for specific scenarios
 */
export const createScenarioData = {
  // User living paycheck-to-paycheck (overspending)
  overspending: () => {
    const budget = createRealisticBudget({ amount: 50000 }); // $500
    const transactions = Array.from({ length: 30 }, () =>
      createRealisticTransaction({
        categoryId: budget.categoryId,
        amount: faker.number.int({ min: 2000, max: 5000 }), // $20-$50 each
      })
    ); // Total: $600-$1500 (over budget)

    return { budget, transactions };
  },

  // User with good spending habits (under budget)
  underBudget: () => {
    const budget = createRealisticBudget({ amount: 50000 }); // $500
    const transactions = Array.from({ length: 20 }, () =>
      createRealisticTransaction({
        categoryId: budget.categoryId,
        amount: faker.number.int({ min: 500, max: 2000 }), // $5-$20 each
      })
    ); // Total: $100-$400 (under budget)

    return { budget, transactions };
  },

  // User at exactly 90% of budget (warning threshold)
  warningThreshold: () => {
    const budget = createRealisticBudget({ amount: 50000 }); // $500
    const transactions = [
      createRealisticTransaction({
        categoryId: budget.categoryId,
        amount: 45000, // Exactly $450 (90%)
      }),
    ];

    return { budget, transactions };
  },
};
