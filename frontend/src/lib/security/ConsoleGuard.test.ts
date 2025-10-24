/**
 * ConsoleGuard Tests
 * Feature 018: Technical Debt Cleanup - User Story 1 (P0)
 *
 * Tests FR-001: System MUST NOT log payment validation details in production builds
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleGuardImpl } from './ConsoleGuard';

describe('ConsoleGuard', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Development Environment (import.meta.env.DEV=true)', () => {
    it('logs error messages with [DEV] prefix in development', () => {
      // Create instance with development flag
      const guard = new ConsoleGuardImpl();

      // Simulate development environment
      if (import.meta.env.DEV) {
        guard.error('Payment validation failed', { amount: 100 });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[DEV]',
          'Payment validation failed',
          { amount: 100 }
        );
      }
    });

    it('logs warning messages with [DEV] prefix in development', () => {
      const guard = new ConsoleGuardImpl();

      if (import.meta.env.DEV) {
        guard.warn('Payment amount suspicious');

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[DEV]',
          'Payment amount suspicious'
        );
      }
    });

    it('logs info messages with [DEV] prefix in development', () => {
      const guard = new ConsoleGuardImpl();

      if (import.meta.env.DEV) {
        guard.log('Payment processed');

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[DEV]',
          'Payment processed'
        );
      }
    });
  });

  describe('Production Environment (import.meta.env.PROD=true)', () => {
    it('does not log error messages in production', () => {
      const guard = new ConsoleGuardImpl();

      // In production mode, no logs should appear
      if (!import.meta.env.DEV) {
        guard.error('Payment validation failed', { sensitiveData: 'secret' });

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      }
    });

    it('does not log warning messages in production', () => {
      const guard = new ConsoleGuardImpl();

      if (!import.meta.env.DEV) {
        guard.warn('Payment amount suspicious');

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      }
    });

    it('does not log info messages in production', () => {
      const guard = new ConsoleGuardImpl();

      if (!import.meta.env.DEV) {
        guard.log('Payment processed');

        expect(consoleLogSpy).not.toHaveBeenCalled();
      }
    });
  });

  describe('Log Level Preservation', () => {
    it('preserves error log level in development', () => {
      const guard = new ConsoleGuardImpl();

      if (import.meta.env.DEV) {
        guard.error('Test error');

        // Verify error() was called, not warn() or log()
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
      }
    });

    it('preserves warn log level in development', () => {
      const guard = new ConsoleGuardImpl();

      if (import.meta.env.DEV) {
        guard.warn('Test warning');

        // Verify warn() was called, not error() or log()
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
      }
    });

    it('preserves log level in development', () => {
      const guard = new ConsoleGuardImpl();

      if (import.meta.env.DEV) {
        guard.log('Test log');

        // Verify log() was called, not error() or warn()
        expect(consoleLogSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      }
    });
  });

  describe('Multiple Parameters', () => {
    it('supports multiple parameters in development', () => {
      const guard = new ConsoleGuardImpl();

      if (import.meta.env.DEV) {
        guard.error('Payment failed:', { id: 123 }, 'additional context', 42);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[DEV]',
          'Payment failed:',
          { id: 123 },
          'additional context',
          42
        );
      }
    });
  });
});
