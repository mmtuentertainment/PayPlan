/**
 * ErrorSanitizer - Generic Error Response Handler
 * Feature 018: Technical Debt Cleanup - User Story 1 (P0)
 *
 * Prevents implementation details from leaking to clients through error messages.
 * Implements FR-002: API MUST return generic error messages to clients.
 *
 * Usage:
 *   const { errorSanitizer } = require('@/lib/security/ErrorSanitizer');
 *
 *   try {
 *     await processPayment(data);
 *   } catch (error) {
 *     const sanitized = errorSanitizer.sanitize(error, {
 *       requestId: req.id,
 *       endpoint: '/api/payment',
 *       method: 'POST',
 *     });
 *
 *     logger.error(sanitized.serverLog); // Log full details server-side
 *     return res.status(500).json({ error: sanitized.clientMessage }); // Generic to client
 *   }
 */

/**
 * ErrorSanitizer Implementation
 *
 * Per FR-002 and Clarification Answer 4:
 * - Client always receives: "An error occurred. Please try again."
 * - Server log contains full error details for debugging
 *
 * IMPORTANT: Do not include raw payment or PII in additionalData.
 * Prohibited fields: cardNumber, cardCVV, cvv, ssn, socialSecurityNumber,
 * bankAccount, routingNumber, accountNumber, paymentToken, fullName,
 * dob, address, email, phone, password, apiKey.
 */
class ErrorSanitizerImpl {
  constructor() {
    this.GENERIC_CLIENT_MESSAGE = 'An error occurred. Please try again.';

    // Sensitive keys to redact from additionalData (CodeRabbit)
    // Includes BNPL-specific fields: bankAccountNumber, routingNumber, ssn, dateOfBirth
    this.SENSITIVE_KEYS = new Set([
      'cardnumber', 'cardcvv', 'cvv', 'cvc', 'card',
      'ssn', 'socialsecuritynumber', 'social',
      'bankaccount', 'bankaccountnumber', 'routingnumber', 'accountnumber', 'account',
      'paymenttoken', 'token', 'apikey', 'secret', 'password',
      'fullname', 'firstname', 'lastname', 'name',
      'dob', 'dateofbirth', 'birthdate',
      'address', 'street', 'city', 'zip', 'zipcode', 'postalcode',
      'email', 'phone', 'phonenumber', 'mobile',
      'ip', 'ipaddress',
    ]);

    // Safe keys allowed in additionalData
    this.SAFE_KEYS = new Set([
      'requestId', 'transactionId', 'correlationId',
      'paymentId', 'orderId', 'userId',
      'amount', 'currency',
      'status', 'statusCode',
      'operation', 'action',
      'timestamp', 'duration',
    ]);
  }

  /**
   * Sanitizes additionalData to prevent PII/payment data leakage.
   * Applies allowlist and redacts sensitive keys.
   *
   * @param {Object|undefined} additionalData - Additional data to sanitize
   * @returns {Object|undefined} Sanitized data (CodeRabbit)
   * @private
   */
  sanitizeAdditionalData(additionalData) {
    if (!additionalData || typeof additionalData !== 'object') {
      return additionalData;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(additionalData)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive keys
      if (this.SENSITIVE_KEYS.has(lowerKey) || this.SENSITIVE_KEYS.has(key)) {
        sanitized[key] = '[REDACTED]';
      }
      // Keep safe keys
      else if (this.SAFE_KEYS.has(key)) {
        // Recursively sanitize nested objects (CodeRabbit: handle arrays)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          sanitized[key] = this.sanitizeAdditionalData(value);
        } else if (Array.isArray(value)) {
          // Recursively sanitize array elements
          sanitized[key] = value.map((item) =>
            (item && typeof item === 'object' && !Array.isArray(item))
              ? this.sanitizeAdditionalData(item)
              : item
          );
        } else {
          sanitized[key] = value;
        }
      }
      // Drop unknown keys (not on allowlist)
      // They are omitted from the output for security
    }

    return sanitized;
  }

  /**
   * Sanitizes an error for client response while preserving server logging.
   *
   * @param {Error} error - The original error object
   * @param {Object} context - Additional context for server logging
   * @param {string} context.requestId - Unique request identifier
   * @param {string} [context.userId] - User ID (optional for privacy)
   * @param {string} context.endpoint - API endpoint or route
   * @param {string} context.method - HTTP method
   * @param {Object} [context.additionalData] - Error-specific context
   * @returns {Object} Sanitized error with generic client message and detailed server log
   */
  sanitize(error, context) {
    // Validate error input: ensure it's an Error object (CodeRabbit)
    let validatedError = error;
    if (error == null) {
      validatedError = new Error('Null or undefined error');
    } else if (!(error instanceof Error)) {
      // Coerce non-Error inputs to Error objects
      validatedError = new Error(String(error));
      if (typeof error === 'object' && error.message) {
        validatedError.message = String(error.message);
      }
      if (typeof error === 'object' && error.stack) {
        validatedError.stack = String(error.stack);
      }
    }

    // Use ISO 8601 for human-readable, timezone-aware timestamps (CodeRabbit)
    const timestamp = new Date().toISOString();

    // Build server log with full details
    const serverLog = {
      timestamp,
      level: 'error',
      message: this.buildServerMessage(validatedError, context),
      error: {
        name: validatedError.name || 'Error',
        message: validatedError.message || 'Unknown error',
        stack: validatedError.stack,
        code: validatedError.code, // Preserve error code if present
      },
      context: {
        requestId: context?.requestId || 'unknown',
        userId: context?.userId,
        endpoint: context?.endpoint || 'unknown',
        method: context?.method || 'unknown',
        additionalData: this.sanitizeAdditionalData(context?.additionalData),
      },
    };

    return {
      clientMessage: this.GENERIC_CLIENT_MESSAGE,
      serverLog,
    };
  }

  buildServerMessage(error, context) {
    const endpoint = context?.endpoint || 'unknown endpoint';
    const method = context?.method || 'unknown method';
    const errorType = error.name || 'Error';

    return `${errorType} on ${method} ${endpoint}: ${error.message}`;
  }
}

/**
 * Singleton instance
 *
 * Use this throughout the application for consistent error handling:
 *
 * Before (FR-002 violation):
 *   return res.status(500).json({ error: error.message });
 *
 * After (FR-002 compliant):
 *   const sanitized = errorSanitizer.sanitize(error, context);
 *   logger.error(sanitized.serverLog);
 *   return res.status(500).json({ error: sanitized.clientMessage });
 */
const errorSanitizer = new ErrorSanitizerImpl();

module.exports = { errorSanitizer, ErrorSanitizerImpl };
