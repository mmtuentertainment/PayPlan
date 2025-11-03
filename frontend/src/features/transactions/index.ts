/**
 * Transactions Feature - Public API
 *
 * Manual transaction entry with notes, receipts, splitting, and bulk actions.
 * Part of Tier 0 MVP (Constitutional requirement #8)
 */

// Re-export business logic
export { TransactionStorageService } from './lib/TransactionStorageService';
export * from './lib/schemas';

// Re-export types
export type { Transaction } from './types/transaction';

// Re-export components (named exports)
export { TransactionCard } from './components/TransactionCard';
export { TransactionForm } from './components/TransactionForm';
