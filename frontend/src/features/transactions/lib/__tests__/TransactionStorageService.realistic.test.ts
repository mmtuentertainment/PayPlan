// TransactionStorageService Realistic Data Tests
// Feature #063: Business Logic Test Coverage - Phase 1.5
// Demonstrates faker.js realistic data for UI/UX edge case testing

import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionStorageService } from '../TransactionStorageService';
import {
  seedFaker,
  createRealisticTransaction,
  createMonthOfTransactions,
  createTypicalUserProfile,
  createEdgeCaseTransactions,
  createStressTestData,
  createScenarioData,
} from '../../../../../tests/fixtures/realistic-data';

describe('TransactionStorageService - Realistic Data Scenarios', () => {
  let service: TransactionStorageService;

  beforeEach(() => {
    service = new TransactionStorageService();
    localStorage.clear();
    seedFaker(12345); // Deterministic tests
  });

  describe('Realistic Transaction Patterns', () => {
    it('should handle typical monthly transaction volume (100+ transactions)', () => {
      const transactions = createMonthOfTransactions(100);

      // Create all transactions
      transactions.forEach((txn) => {
        const result = service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
        expect(result.success).toBe(true);
      });

      // Verify all stored correctly
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(100);
      }
    });

    it('should handle typical user profile (categories + budgets + transactions)', () => {
      const profile = createTypicalUserProfile();

      // Load transactions
      profile.transactions.forEach((txn) => {
        const result = service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
        expect(result.success).toBe(true);
      });

      // Verify realistic patterns
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBeGreaterThanOrEqual(80);
        expect(loadResult.data.length).toBeLessThanOrEqual(120);

        // Verify amount distribution (most transactions are small)
        const smallTransactions = loadResult.data.filter((t) => t.amount < 5000);
        const percentage = (smallTransactions.length / loadResult.data.length) * 100;
        expect(percentage).toBeGreaterThan(50); // At least 50% are small purchases
      }
    });
  });

  describe('Edge Case Testing with Realistic Data', () => {
    it('should reject very long transaction descriptions (>200 chars)', () => {
      const edgeCases = createEdgeCaseTransactions();

      const result = service.createTransaction({
        amount: edgeCases.longDescription.amount,
        description: edgeCases.longDescription.description, // ~200+ chars
        date: edgeCases.longDescription.date,
        categoryId: edgeCases.longDescription.categoryId,
      });

      // Schema validates max 200 chars, so this should fail
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid transaction data');
      }
    });

    it('should handle very small amounts (penny transactions)', () => {
      const edgeCases = createEdgeCaseTransactions();

      const result = service.createTransaction({
        amount: edgeCases.smallAmount.amount,
        description: edgeCases.smallAmount.description,
        date: edgeCases.smallAmount.date,
        categoryId: edgeCases.smallAmount.categoryId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1); // $0.01
      }
    });

    it('should handle very large amounts (big purchases)', () => {
      const edgeCases = createEdgeCaseTransactions();

      const result = service.createTransaction({
        amount: edgeCases.largeAmount.amount,
        description: edgeCases.largeAmount.description,
        date: edgeCases.largeAmount.date,
        categoryId: edgeCases.largeAmount.categoryId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBeGreaterThanOrEqual(500000); // $5,000+
      }
    });

    it('should handle many transactions on same day', () => {
      const edgeCases = createEdgeCaseTransactions();

      edgeCases.sameDay.forEach((txn) => {
        const result = service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
        expect(result.success).toBe(true);
      });

      // Verify all same-day transactions stored
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(20);

        // All should have same date
        const uniqueDates = new Set(loadResult.data.map((t) => t.date));
        expect(uniqueDates.size).toBe(1);
      }
    });
  });

  describe('Performance Testing with Realistic Volumes', () => {
    it('should handle 200 transactions efficiently', () => {
      const stressData = createStressTestData();

      const startTime = performance.now();

      // Create 200 transactions (realistic monthly volume for heavy user)
      stressData.transactions.slice(0, 200).forEach((txn) => {
        service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 3 seconds)
      expect(duration).toBeLessThan(3000);

      // Verify all stored
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(200);
      }
    });

    it('should filter large datasets efficiently', () => {
      const stressData = createStressTestData();

      // Create 200 transactions across multiple categories
      stressData.transactions.slice(0, 200).forEach((txn) => {
        service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
      });

      const startTime = performance.now();

      // Filter by category (should be fast even with 200 transactions)
      const result = service.getTransactionsByCategory('cat_groceries');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should be <100ms
    });
  });

  describe('Realistic Spending Scenarios', () => {
    it('should handle overspending scenario', () => {
      const scenario = createScenarioData.overspending();

      // Create all transactions
      scenario.transactions.forEach((txn) => {
        const result = service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
        expect(result.success).toBe(true);
      });

      // Calculate total spent
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const totalSpent = loadResult.data.reduce((sum, t) => sum + t.amount, 0);
        expect(totalSpent).toBeGreaterThan(scenario.budget.amount);
      }
    });

    it('should handle under-budget scenario', () => {
      const scenario = createScenarioData.underBudget();

      scenario.transactions.forEach((txn) => {
        const result = service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
        expect(result.success).toBe(true);
      });

      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const totalSpent = loadResult.data.reduce((sum, t) => sum + t.amount, 0);
        expect(totalSpent).toBeLessThan(scenario.budget.amount);
      }
    });

    it('should handle warning threshold scenario (90% of budget)', () => {
      const scenario = createScenarioData.warningThreshold();

      scenario.transactions.forEach((txn) => {
        const result = service.createTransaction({
          amount: txn.amount,
          description: txn.description,
          date: txn.date,
          categoryId: txn.categoryId,
        });
        expect(result.success).toBe(true);
      });

      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const totalSpent = loadResult.data.reduce((sum, t) => sum + t.amount, 0);
        const percentage = (totalSpent / scenario.budget.amount) * 100;
        expect(percentage).toBeCloseTo(90, 1); // Within 1% of 90%
      }
    });
  });

  describe('Data Quality Validation', () => {
    it('should generate realistic amounts (mostly small purchases)', () => {
      const transactions = Array.from({ length: 100 }, () =>
        createRealisticTransaction()
      );

      // Count small ($5-$50), medium ($50-$200), large ($200+)
      const small = transactions.filter((t) => t.amount >= 500 && t.amount < 5000).length;
      const medium = transactions.filter((t) => t.amount >= 5000 && t.amount < 20000)
        .length;
      const large = transactions.filter((t) => t.amount >= 20000).length;

      // Should follow realistic distribution
      expect(small).toBeGreaterThan(50); // >50% small
      expect(medium).toBeGreaterThan(15); // >15% medium
      expect(large).toBeGreaterThan(5); // >5% large
    });

    it('should generate realistic descriptions', () => {
      const transaction = createRealisticTransaction();

      expect(transaction.description).toBeTruthy();
      expect(transaction.description.length).toBeGreaterThan(3);
      expect(transaction.description.length).toBeLessThan(200);
    });

    it('should generate recent dates (within 30 days)', () => {
      const transaction = createRealisticTransaction();

      const transactionDate = new Date(transaction.date);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      expect(transactionDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      expect(transactionDate.getTime()).toBeLessThanOrEqual(today.getTime());
    });
  });
});
