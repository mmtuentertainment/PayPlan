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
     *
     * Categories:
     * - Contact: email, phone, address
     * - Identity: name, ssn, dob, birthdate, dateofbirth
     * - Government IDs: passport, license, driverslicense, nationalid
     * - Financial: card, cardnumber, pan, cvv, cvc, expiry, account, bankaccount, routing, iban, swift
     * - Tax: tin, taxid, vat
     * - Network: ip, ipaddress
     */
    this.piiPatterns = [
      // Contact information
      'email',
      'phone',
      'address',

      // Personal identity
      'name',
      'ssn',
      'dob',
      'birthdate',
      'dateofbirth',

      // Government IDs
      'passport',
      'license',
      'driverslicense',
      'nationalid',

      // Payment card information
      'card',
      'cardnumber',
      'pan',
      'cvv',
      'cvc',
      'expiry',

      // Bank account information
      'account',
      'bankaccount',
      'routing',
      'iban',
      'swift',

      // Tax identifiers
      'tin',
      'taxid',
      'vat',

      // Network identifiers
      'ip',
      'ipaddress',
    ];
  }

  /**
   * Sanitizes an object by removing all PII fields recursively.
   *
   * Uses structural sharing: returns the same reference if no PII is found,
   * or a new object with PII fields removed if found.
   *
   * @param {*} data - The data to sanitize (object, array, or primitive)
   * @param {WeakSet} visited - Set of visited objects for circular detection (internal)
   * @returns {*} Sanitized data with PII removed
   * @throws {Error} If circular reference detected
   *
   * @example
   * sanitize({ email: 'user@example.com', amount: 100 })
   * // Returns: { amount: 100 }
   *
   * @example
   * const clean = { id: '123', amount: 100 };
   * sanitize(clean) === clean // true (same reference, no PII found)
   */
  sanitize(data, visited = new WeakSet()) {
    // Handle primitives and null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    // Check for circular references
    if (visited.has(data)) {
      return '[Circular]';
    }

    // Add to visited set
    visited.add(data);

    // Handle special object types
    if (data instanceof Date) {
      return data.toISOString();
    }

    if (data instanceof RegExp) {
      return data.toString();
    }

    if (data instanceof Map) {
      const result = {};
      for (const [key, value] of data.entries()) {
        result[key] = this.sanitize(value, visited);
      }
      return result;
    }

    if (data instanceof Set) {
      return Array.from(data).map(item => this.sanitize(item, visited));
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return this.sanitizeArray(data, visited);
    }

    // Handle plain objects
    return this.sanitizeObject(data, visited);
  }

  /**
   * Sanitizes an array, preserving reference if no PII found in any element.
   *
   * @param {Array} arr - Array to sanitize
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @returns {Array} Sanitized array (same reference if no changes, new array if changed)
   */
  sanitizeArray(arr, visited) {
    let hasChanges = false;
    const sanitized = arr.map((item) => {
      const cleaned = this.sanitize(item, visited);
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
   * Includes prototype pollution protection.
   *
   * @param {Object} obj - Object to sanitize
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @returns {Object} Sanitized object (same reference if no PII, new object if PII removed)
   */
  sanitizeObject(obj, visited) {
    let hasChanges = false;
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      // Prototype pollution protection: skip dangerous keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        hasChanges = true;
        // Skip this field (remove it)
        continue;
      }

      // Check if key matches any PII pattern (case-insensitive)
      if (this.isPiiField(key)) {
        hasChanges = true;
        // Skip this field (remove it)
        continue;
      }

      // Recursively sanitize nested values
      const sanitizedValue = this.sanitize(value, visited);

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
