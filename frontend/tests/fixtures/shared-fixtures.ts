// Shared test fixtures used across all features
// Feature #063: Business Logic Test Coverage

import { createDate } from './date-utils';

export interface SharedFixtures {
  dates: {
    jan1: Date;
    jan31: Date;
    feb28: Date;
    feb29LeapYear: Date;
    mar1: Date;
    dec31: Date;
    monthBoundaries: Date[];
    fiscalYearStarts: Date[];
  };

  ids: {
    categoryId1: string;
    categoryId2: string;
    categoryId3: string;
    budgetId1: string;
    budgetId2: string;
    budgetId3: string;
    transactionId1: string;
    transactionId2: string;
    transactionId3: string;
    userId: string;
  };

  amounts: {
    zero: number;
    oneCent: number;
    tenCents: number;
    oneDollar: number;
    tenDollars: number;
    fiftyDollars: number;
    hundredDollars: number;
    fiveHundredDollars: number;
    thousandDollars: number;
    maxSafeInteger: number;
  };

  colors: {
    green: string;
    blue: string;
    red: string;
    yellow: string;
    purple: string;
    orange: string;
    valid: string[];
    invalid: string[];
  };
}

/**
 * Shared fixtures singleton
 * Deterministic test data used across all features
 */
export const sharedFixtures: SharedFixtures = {
  // Deterministic dates (2025 non-leap year, 2024 leap year)
  dates: {
    jan1: createDate(2025, 1, 1),
    jan31: createDate(2025, 1, 31),
    feb28: createDate(2025, 2, 28),
    feb29LeapYear: createDate(2024, 2, 29), // 2024 is leap year
    mar1: createDate(2025, 3, 1),
    dec31: createDate(2025, 12, 31),

    // Last day of each month (12 dates)
    monthBoundaries: [
      createDate(2025, 1, 31), // January
      createDate(2025, 2, 28), // February (non-leap)
      createDate(2025, 3, 31), // March
      createDate(2025, 4, 30), // April
      createDate(2025, 5, 31), // May
      createDate(2025, 6, 30), // June
      createDate(2025, 7, 31), // July
      createDate(2025, 8, 31), // August
      createDate(2025, 9, 30), // September
      createDate(2025, 10, 31), // October
      createDate(2025, 11, 30), // November
      createDate(2025, 12, 31), // December
    ],

    // Fiscal year starts (July 1 for years 2023-2027)
    fiscalYearStarts: [
      createDate(2023, 7, 1),
      createDate(2024, 7, 1),
      createDate(2025, 7, 1),
      createDate(2026, 7, 1),
      createDate(2027, 7, 1),
    ],
  },

  // Deterministic UUIDs (no collisions in tests)
  ids: {
    categoryId1: '11111111-1111-1111-1111-111111111111',
    categoryId2: '22222222-2222-2222-2222-222222222222',
    categoryId3: '33333333-3333-3333-3333-333333333333',
    budgetId1: '44444444-4444-4444-4444-444444444444',
    budgetId2: '55555555-5555-5555-5555-555555555555',
    budgetId3: '66666666-6666-6666-6666-666666666666',
    transactionId1: '77777777-7777-7777-7777-777777777777',
    transactionId2: '88888888-8888-8888-8888-888888888888',
    transactionId3: '99999999-9999-9999-9999-999999999999',
    userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  },

  // Common amounts in cents
  amounts: {
    zero: 0,
    oneCent: 1,
    tenCents: 10,
    oneDollar: 100,
    tenDollars: 1000,
    fiftyDollars: 5000,
    hundredDollars: 10000,
    fiveHundredDollars: 50000,
    thousandDollars: 100000,
    maxSafeInteger: Number.MAX_SAFE_INTEGER,
  },

  // Valid and invalid color codes for category testing
  colors: {
    green: '#22c55e',
    blue: '#3b82f6',
    red: '#ef4444',
    yellow: '#eab308',
    purple: '#a855f7',
    orange: '#f97316',
    valid: [
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      '#FFFF00', // Yellow
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
      '#000000', // Black
      '#FFFFFF', // White
      '#808080', // Gray
      '#FFA500', // Orange
    ],
    invalid: [
      'red', // Missing #
      'FF0000', // Missing #
      '#GGG', // Invalid hex
      '#12345', // Too short
      '#1234567', // Too long
      'rgb(255,0,0)', // Not hex format
      '', // Empty string
      '#ff00ff00', // Too many digits (RGBA not supported)
    ],
  },
};
