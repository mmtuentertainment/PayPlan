/**
 * ConsoleGuard - Environment-Aware Logging
 * Feature 018: Technical Debt Cleanup - User Story 1 (P0)
 *
 * Prevents payment details from leaking to production console.
 * Implements FR-001: System MUST NOT log payment validation details in production builds.
 *
 * Usage:
 *   import { consoleGuard } from '@/lib/security/ConsoleGuard';
 *
 *   // Development: logs with [DEV] prefix
 *   // Production: complete silence
 *   consoleGuard.error('Payment validation failed:', details);
 */

/**
 * ConsoleGuard Implementation
 *
 * Per FR-001 and Clarification Answer 1:
 * - Production (import.meta.env.PROD === true): Complete silence (zero output)
 * - Development (import.meta.env.DEV === true): Logs with [DEV] prefix for debugging
 *
 * Singleton pattern ensures consistent usage across the application.
 */
class ConsoleGuardImpl {
  private isDevelopment: boolean;

  constructor() {
    // Vite environment detection
    this.isDevelopment = import.meta.env.DEV === true;
  }

  /**
   * Log error message (silent in production)
   * @param message - Error message
   * @param optionalParams - Additional context
   */
  error(message?: unknown, ...optionalParams: unknown[]): void {
    if (this.isDevelopment) {
      console.error('[DEV]', message, ...optionalParams);
    }
    // Production: complete silence
  }

  /**
   * Log warning message (silent in production)
   * @param message - Warning message
   * @param optionalParams - Additional context
   */
  warn(message?: unknown, ...optionalParams: unknown[]): void {
    if (this.isDevelopment) {
      console.warn('[DEV]', message, ...optionalParams);
    }
    // Production: complete silence
  }

  /**
   * Log info message (silent in production)
   * @param message - Info message
   * @param optionalParams - Additional context
   */
  log(message?: unknown, ...optionalParams: unknown[]): void {
    if (this.isDevelopment) {
      console.log('[DEV]', message, ...optionalParams);
    }
    // Production: complete silence
  }
}

/**
 * Singleton instance
 *
 * Use this throughout the application for environment-aware logging:
 *
 * Before (FR-001 violation):
 *   console.error('Payment validation failed:', details);
 *
 * After (FR-001 compliant):
 *   consoleGuard.error('Payment validation failed:', details);
 */
export const consoleGuard = new ConsoleGuardImpl();

// Export class for testing
export { ConsoleGuardImpl };
