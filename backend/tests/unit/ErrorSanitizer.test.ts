/**
 * ErrorSanitizer Tests
 * Feature 018: Technical Debt Cleanup - User Story 1 (P0)
 *
 * Tests generic error message sanitization to prevent implementation
 * details from leaking to clients (FR-002).
 */

const { describe, it, expect } = require('@jest/globals');
const { errorSanitizer } = require('../../src/lib/security/ErrorSanitizer');

describe('ErrorSanitizer', () => {
  describe('T013: Generic client message', () => {
    it('should return generic message for all error types', () => {
      const errors = [
        new Error('Database connection failed'),
        new Error('SELECT * FROM users WHERE id = 123'),
        new Error('Validation failed: amount is required'),
        new TypeError('Cannot read property of undefined'),
        new RangeError('Maximum call stack size exceeded'),
      ];

      const context = {
        requestId: 'req-test-001',
        endpoint: '/api/payment',
        method: 'POST',
      };

      errors.forEach((error) => {
        const sanitized = errorSanitizer.sanitize(error, context);

        // FR-002: All errors must have identical generic message
        expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
      });
    });

    it('should return generic message even for errors with sensitive data', () => {
      const error = new Error('User email user@example.com not found in database users table');

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-002',
        endpoint: '/api/user',
        method: 'GET',
      });

      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
      expect(sanitized.clientMessage).not.toContain('email');
      expect(sanitized.clientMessage).not.toContain('database');
      expect(sanitized.clientMessage).not.toContain('users');
    });

    it('should handle errors without context', () => {
      const error = new Error('Some error');
      const sanitized = errorSanitizer.sanitize(error);

      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
      expect(sanitized.serverLog).toBeDefined();
    });
  });

  describe('T014: Preserve full error in server log', () => {
    it('should preserve original error message in server log', () => {
      const error = new Error('Database connection failed on host db.internal:5432');
      error.stack = 'Error: Database connection failed\n  at Function.connect';

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-003',
        endpoint: '/api/payment',
        method: 'POST',
      });

      expect(sanitized.serverLog.error.message).toBe('Database connection failed on host db.internal:5432');
      expect(sanitized.serverLog.error.stack).toContain('Error: Database connection failed');
      expect(sanitized.serverLog.error.name).toBe('Error');
    });

    it('should preserve error context in server log', () => {
      const error = new Error('Validation failed');

      const context = {
        requestId: 'req-test-004',
        userId: 'user_789',
        endpoint: '/api/plan',
        method: 'POST',
        additionalData: {
          paymentId: 'pay_123',
          amount: 100,
        },
      };

      const sanitized = errorSanitizer.sanitize(error, context);

      expect(sanitized.serverLog.context.requestId).toBe('req-test-004');
      expect(sanitized.serverLog.context.userId).toBe('user_789');
      expect(sanitized.serverLog.context.endpoint).toBe('/api/plan');
      expect(sanitized.serverLog.context.method).toBe('POST');
      expect(sanitized.serverLog.context.additionalData).toEqual({
        paymentId: 'pay_123',
        amount: 100,
      });
    });

    it('should keep financial fields in server log but not leak to client (CodeRabbit)', () => {
      const error = new Error('Payment processing failed');

      const context = {
        requestId: 'req-test-financial',
        endpoint: '/api/payment',
        method: 'POST',
        additionalData: {
          paymentId: 'pay_abc123',
          amount: 99.99,
          currency: 'USD',
          cardNumber: '4532-1234-5678-9010', // Sensitive
          cvv: '123', // Sensitive
          // BNPL-sensitive fields (CodeRabbit)
          bankAccountNumber: '123456789', // Sensitive
          routingNumber: '987654321', // Sensitive
          ssn: '123-45-6789', // Sensitive
          dateOfBirth: '1990-01-01', // Sensitive
        },
      };

      const sanitized = errorSanitizer.sanitize(error, context);

      // Server log should contain safe financial fields
      expect(sanitized.serverLog.context.additionalData.paymentId).toBe('pay_abc123');
      expect(sanitized.serverLog.context.additionalData.amount).toBe(99.99);
      expect(sanitized.serverLog.context.additionalData.currency).toBe('USD');

      // Server log should redact sensitive payment fields
      expect(sanitized.serverLog.context.additionalData.cardNumber).toBe('[REDACTED]');
      expect(sanitized.serverLog.context.additionalData.cvv).toBe('[REDACTED]');
      expect(sanitized.serverLog.context.additionalData.bankAccountNumber).toBe('[REDACTED]');
      expect(sanitized.serverLog.context.additionalData.routingNumber).toBe('[REDACTED]');
      expect(sanitized.serverLog.context.additionalData.ssn).toBe('[REDACTED]');
      expect(sanitized.serverLog.context.additionalData.dateOfBirth).toBe('[REDACTED]');

      // Client message should NEVER contain any financial details
      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
      expect(sanitized.clientMessage).not.toContain('paymentId');
      expect(sanitized.clientMessage).not.toContain('pay_abc123');
      expect(sanitized.clientMessage).not.toContain('99.99');
      expect(sanitized.clientMessage).not.toContain('amount');
      expect(sanitized.clientMessage).not.toContain('cardNumber');
      expect(sanitized.clientMessage).not.toContain('cvv');
      expect(sanitized.clientMessage).not.toContain('ssn');
      expect(sanitized.clientMessage).not.toContain('bankAccountNumber');
    });

    it('should include timestamp in server log', () => {
      const error = new Error('Test error');
      const beforeTime = new Date();

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-005',
        endpoint: '/api/test',
        method: 'GET',
      });

      const afterTime = new Date();

      // Timestamp should be ISO 8601 string in UTC (CodeRabbit)
      expect(sanitized.serverLog.timestamp).toBeDefined();
      expect(typeof sanitized.serverLog.timestamp).toBe('string');
      expect(sanitized.serverLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Verify timestamp is within reasonable range
      const timestampDate = new Date(sanitized.serverLog.timestamp);
      expect(timestampDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestampDate.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should preserve stack trace when available', () => {
      const error = new Error('Stack trace test');
      // Stack will be auto-generated by Error constructor

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-006',
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(sanitized.serverLog.error.stack).toBeDefined();
      expect(sanitized.serverLog.error.stack).toContain('Error');
    });
  });

  describe('T015: No implementation details leak to client', () => {
    it('should not leak database information', () => {
      const error = new Error('SELECT failed on table payments column amount');

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-007',
        endpoint: '/api/payment',
        method: 'POST',
      });

      expect(sanitized.clientMessage).not.toContain('SELECT');
      expect(sanitized.clientMessage).not.toContain('table');
      expect(sanitized.clientMessage).not.toContain('payments');
      expect(sanitized.clientMessage).not.toContain('column');
      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
    });

    it('should not leak file paths', () => {
      const error = new Error('File not found: /var/lib/payment/data.json');

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-008',
        endpoint: '/api/data',
        method: 'GET',
      });

      expect(sanitized.clientMessage).not.toContain('/var');
      expect(sanitized.clientMessage).not.toContain('data.json');
      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
    });

    it('should not leak version numbers or dependencies', () => {
      const error = new Error('payment-service-v2.1.3 timeout after 30s');

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-009',
        endpoint: '/api/payment',
        method: 'POST',
      });

      expect(sanitized.clientMessage).not.toContain('v2.1.3');
      expect(sanitized.clientMessage).not.toContain('payment-service');
      expect(sanitized.clientMessage).not.toContain('timeout');
      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
    });

    it('should not leak user IDs or session tokens', () => {
      const error = new Error('Invalid session token abc123xyz for user user_456');

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-010',
        endpoint: '/api/auth',
        method: 'POST',
      });

      expect(sanitized.clientMessage).not.toContain('abc123xyz');
      expect(sanitized.clientMessage).not.toContain('user_456');
      expect(sanitized.clientMessage).not.toContain('session token');
      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
    });

    it('should not leak validation field names', () => {
      const error = new Error('Validation error: field "userEmail" is required');

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-011',
        endpoint: '/api/user',
        method: 'PUT',
      });

      expect(sanitized.clientMessage).not.toContain('userEmail');
      expect(sanitized.clientMessage).not.toContain('field');
      expect(sanitized.clientMessage).not.toContain('required');
      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
    });
  });

  describe('Edge cases', () => {
    it('should handle Error without stack trace', () => {
      const error = new Error('No stack');
      error.stack = undefined;

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-test-012',
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
      expect(sanitized.serverLog.error.stack).toBeUndefined();
    });

    it('should handle non-Error objects (CodeRabbit fix)', () => {
      // Test with actual non-Error inputs
      const nonErrorInputs = [
        'String error',
        { message: 'Object error', code: 500 },
        null,
        undefined,
      ];

      nonErrorInputs.forEach((input) => {
        const sanitized = errorSanitizer.sanitize(input, {
          requestId: 'req-test-013',
          endpoint: '/api/test',
          method: 'GET',
        });

        expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
        expect(sanitized.serverLog.error.message).toBeDefined();
      });
    });

    it('should handle minimal context', () => {
      const error = new Error('Test');

      const sanitized = errorSanitizer.sanitize(error, {
        requestId: 'req-min-context',
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
      expect(sanitized.serverLog.context.requestId).toBe('req-min-context');
      expect(sanitized.serverLog.context.userId).toBeUndefined();
      expect(sanitized.serverLog.context.additionalData).toBeUndefined();
    });
  });
});
