/**
 * PII Sanitizer - Removes Personally Identifiable Information from objects
 *
 * Feature: 018-technical-debt-cleanup (Phase 4, User Story 3, P2)
 * Tasks: T053-T061
 *
 * This class provides deep sanitization of PII fields from arbitrary objects,
 * using structural sharing to avoid unnecessary cloning when no PII is present.
 *
 * Supported PII field patterns (case-insensitive):
 * - email, *email* (e.g., userEmail, billingEmail)
 * - name, *name* (e.g., firstName, lastName, userName)
 * - phone, *phone* (e.g., phoneNumber, mobilePhone)
 * - address, *address* (e.g., billingAddress, shippingAddress)
 * - ssn, *ssn* (e.g., socialSecurityNumber)
 *
 * @example
 * const sanitizer = new PiiSanitizer();
 * const clean = sanitizer.sanitize({
 *   id: '123',
 *   email: 'user@example.com', // Removed
 *   amount: 100, // Preserved
 * });
 * // Result: { id: '123', amount: 100 }
 */

class PiiSanitizer {
  constructor() {
    /**
     * PII field patterns to detect and remove (case-insensitive).
     * Uses substring matching to catch variants like userEmail, billingAddress, etc.
     */
    this.piiPatterns = [
      'email',
      'name',
      'phone',
      'address',
      'ssn',
    ];
  }

  /**
   * Sanitizes an object by removing all PII fields recursively.
   *
   * Uses structural sharing: returns the same reference if no PII is found,
   * or a new object with PII fields removed if found.
   *
   * @param {*} data - The data to sanitize (object, array, or primitive)
   * @returns {*} Sanitized data with PII removed
   *
   * @example
   * sanitize({ email: 'user@example.com', amount: 100 })
   * // Returns: { amount: 100 }
   *
   * @example
   * const clean = { id: '123', amount: 100 };
   * sanitize(clean) === clean // true (same reference, no PII found)
   */
  sanitize(data) {
    // Handle primitives and null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return this.sanitizeArray(data);
    }

    // Handle objects
    return this.sanitizeObject(data);
  }

  /**
   * Sanitizes an array, preserving reference if no PII found in any element.
   *
   * @param {Array} arr - Array to sanitize
   * @returns {Array} Sanitized array (same reference if no changes, new array if changed)
   */
  sanitizeArray(arr) {
    let hasChanges = false;
    const sanitized = arr.map((item) => {
      const cleaned = this.sanitize(item);
      if (cleaned !== item) {
        hasChanges = true;
      }
      return cleaned;
    });

    // Structural sharing: return original if no changes
    return hasChanges ? sanitized : arr;
  }

  /**
   * Sanitizes an object, removing PII fields recursively.
   *
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object (same reference if no PII, new object if PII removed)
   */
  sanitizeObject(obj) {
    let hasChanges = false;
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if key matches any PII pattern (case-insensitive)
      if (this.isPiiField(key)) {
        hasChanges = true;
        // Skip this field (remove it)
        continue;
      }

      // Recursively sanitize nested values
      const sanitizedValue = this.sanitize(value);

      // Track if nested value changed
      if (sanitizedValue !== value) {
        hasChanges = true;
      }

      result[key] = sanitizedValue;
    }

    // Structural sharing: return original if no changes
    return hasChanges ? result : obj;
  }

  /**
   * Checks if a field name matches any PII pattern (case-insensitive substring match).
   *
   * @param {string} fieldName - The field name to check
   * @returns {boolean} True if field contains PII pattern
   *
   * @example
   * isPiiField('email') // true
   * isPiiField('userEmail') // true
   * isPiiField('billingAddress') // true
   * isPiiField('amount') // false
   */
  isPiiField(fieldName) {
    const lowerFieldName = fieldName.toLowerCase();
    return this.piiPatterns.some((pattern) =>
      lowerFieldName.includes(pattern.toLowerCase())
    );
  }
}

/**
 * Default singleton instance for convenient use.
 *
 * @example
 * const { piiSanitizer } = require('./PiiSanitizer');
 * const clean = piiSanitizer.sanitize(data);
 */
const piiSanitizer = new PiiSanitizer();

// CommonJS exports for Node.js backend
module.exports = {
  PiiSanitizer,
  piiSanitizer,
};
