/**
 * MaxDepthValidator - Validates JSON depth to prevent DoS attacks
 *
 * Feature: 018-technical-debt-cleanup (Phase 4, User Story 3, P2)
 * Tasks: T062-T067
 *
 * Protects against deeply nested JSON structures that could cause:
 * - Stack overflow errors
 * - Excessive memory consumption
 * - Parser performance degradation
 * - Denial of Service (DoS) attacks
 *
 * Default maximum depth: 10 levels (per FR-012)
 *
 * @example
 * const validator = new MaxDepthValidator(10);
 * validator.validate(data); // Throws if depth > 10
 * const depth = validator.getDepth(data); // Returns depth count
 */

class MaxDepthValidator {
  /**
   * Creates a new MaxDepthValidator
   *
   * @param {number} maxDepth - Maximum allowed depth (default: 10)
   */
  constructor(maxDepth = 10) {
    this.maxDepth = maxDepth;
  }

  /**
   * Validates that data does not exceed maximum depth
   *
   * @param {*} data - Data to validate
   * @throws {Error} If depth exceeds maximum
   *
   * @example
   * validator.validate({ a: { b: { c: 'deep' } } }); // OK if depth ≤ 10
   * validator.validate(veryDeepObject); // Throws if depth > 10
   */
  validate(data) {
    const actualDepth = this.getDepth(data);

    if (actualDepth > this.maxDepth) {
      throw new Error(
        `JSON depth exceeds maximum allowed depth of ${this.maxDepth} (actual: ${actualDepth})`
      );
    }
  }

  /**
   * Calculates the maximum depth of a nested structure
   *
   * Depth counting rules:
   * - Primitives (string, number, boolean, null, undefined): depth 0
   * - Empty object/array: depth 1
   * - Object/array with nested values: 1 + max(child depths)
   *
   * @param {*} data - Data to measure
   * @param {number} currentDepth - Current recursion depth (internal)
   * @returns {number} Maximum depth of the structure
   *
   * @example
   * getDepth('string') // 0
   * getDepth({}) // 1
   * getDepth({ a: { b: 'c' } }) // 3
   * getDepth([1, [2, [3]]]) // 3
   */
  getDepth(data, currentDepth = 0) {
    // Primitives have depth 0
    if (data === null || data === undefined) {
      return 0;
    }

    if (typeof data !== 'object') {
      return 0;
    }

    // Empty objects/arrays have depth 1
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return 1;
      }

      // Find maximum depth among array elements
      let maxChildDepth = 0;
      for (const item of data) {
        const childDepth = this.getDepth(item, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }

      return 1 + maxChildDepth;
    }

    // Handle objects
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return 1;
    }

    // Find maximum depth among object properties
    let maxChildDepth = 0;
    for (const key of keys) {
      const childDepth = this.getDepth(data[key], currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return 1 + maxChildDepth;
  }
}

/**
 * Default validator instance with 10-level maximum (FR-012)
 *
 * @example
 * const { maxDepthValidator } = require('./MaxDepthValidator');
 * maxDepthValidator.validate(data);
 */
const maxDepthValidator = new MaxDepthValidator(10);

// CommonJS exports for Node.js backend
module.exports = {
  MaxDepthValidator,
  maxDepthValidator,
};
