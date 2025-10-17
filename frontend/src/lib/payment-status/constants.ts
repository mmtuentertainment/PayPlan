/**
 * Payment Status Constants
 *
 * Feature: 015-build-a-payment
 * Phase: 1 (Setup)
 * Task: T006
 *
 * Centralized constants for payment status tracking.
 * All values are based on research and specifications.
 *
 * @see research.md Section 2: LocalStorage Best Practices
 * @see data-model.md Section: Constants
 */

import type { PaymentStatus } from './types';

/**
 * LocalStorage key for payment status collection
 * Namespaced to avoid conflicts with other features
 */
export const STORAGE_KEY = 'payplan_payment_status';

/**
 * Current schema version (semantic versioning)
 * Increment on breaking changes to trigger migrations
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Default payment status for new payments
 */
export const DEFAULT_STATUS: PaymentStatus = 'pending';

/**
 * Storage size limits and thresholds
 */

/**
 * Estimated size per payment status record (bytes)
 * Based on research.md calculations:
 * - UUID: 36 bytes
 * - Status: 4-7 bytes
 * - Timestamp: 24 bytes
 * - JSON overhead: ~20 bytes
 * Total: ~90-110 bytes (avg: 100 bytes)
 */
export const ESTIMATED_RECORD_SIZE = 140; // Conservative estimate with overhead

/**
 * Maximum number of records to safely store
 * Target from SC-008: Support 500+ payments
 */
export const MAX_SAFE_RECORDS = 500;

/**
 * Estimated safe storage size for 500 records
 * 500 records × 140 bytes = 70KB (well under 5MB browser limit)
 */
export const ESTIMATED_MAX_SIZE = MAX_SAFE_RECORDS * ESTIMATED_RECORD_SIZE;

/**
 * Browser localStorage limit (conservative estimate)
 * Actual limits:
 * - Chrome/Firefox: 5-10MB
 * - Safari: 5MB
 * Using 5MB as safe minimum
 */
export const BROWSER_STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Warning threshold (80% of browser limit)
 * Show warning when approaching storage limit
 */
export const WARNING_THRESHOLD = 0.8 * BROWSER_STORAGE_LIMIT; // 4MB

/**
 * Error messages for storage operations
 * User-friendly messages for different error scenarios
 */
export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED:
    'Storage limit exceeded. Please clear old payment statuses.',
  SECURITY_ERROR:
    'Browser storage is disabled or blocked. Please enable localStorage in your browser settings.',
  VALIDATION_ERROR: 'Invalid payment status data format.',
  SERIALIZATION_ERROR: 'Failed to save payment status. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred while saving payment status.',
  INVALID_PAYMENT_ID: 'Invalid payment ID format. Must be a valid UUID.',
  CORRUPTED_DATA:
    'Payment status data is corrupted. Resetting to default state.',
} as const;

/**
 * Default preferences for payment status collection
 * Used when creating new collections
 */
export const DEFAULT_COLLECTION_METADATA = {
  version: SCHEMA_VERSION,
  totalSize: 0,
  lastModified: '', // Set to current timestamp when creating
} as const;

/**
 * Performance targets (from Success Criteria)
 * Used for monitoring and optimization
 */
export const PERFORMANCE_TARGETS = {
  /**
   * SC-001: Mark payment as paid in under 2 seconds
   */
  MARK_PAYMENT_MAX_MS: 2000,

  /**
   * SC-003: Visual feedback within 200ms
   */
  VISUAL_FEEDBACK_MAX_MS: 200,

  /**
   * SC-004: Bulk mark 10 payments in under 5 seconds
   */
  BULK_OPERATION_MAX_MS: 5000,

  /**
   * NFR-001 from Feature 012: Load preferences in <100ms
   * Applied to payment status as well
   */
  LOAD_STATUSES_MAX_MS: 100,

  /**
   * SC-007: Clear all statuses in under 3 seconds
   */
  CLEAR_ALL_MAX_MS: 3000,
} as const;

/**
 * Feature flags and toggles
 * For gradual rollout or A/B testing
 */
export const FEATURE_FLAGS = {
  /**
   * Enable cross-tab synchronization via storage events
   */
  ENABLE_CROSS_TAB_SYNC: true,

  /**
   * Enable performance monitoring (mark/measure API)
   */
  ENABLE_PERFORMANCE_MONITORING: true,

  /**
   * Enable size warnings when approaching storage limit
   */
  ENABLE_STORAGE_WARNINGS: true,
} as const;

/**
 * Development and debugging constants
 */
export const DEBUG = {
  /**
   * Log storage operations to console (dev mode only)
   */
  LOG_STORAGE_OPS: process.env.NODE_ENV === 'development',

  /**
   * Log performance metrics (dev mode only)
   */
  LOG_PERFORMANCE: process.env.NODE_ENV === 'development',

  /**
   * Enable verbose validation errors
   */
  VERBOSE_VALIDATION: process.env.NODE_ENV === 'development',
} as const;
