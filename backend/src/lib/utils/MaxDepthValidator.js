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
   * @throws {TypeError} If maxDepth is not a number
   * @throws {RangeError} If maxDepth is not finite, not an integer, or < 1
   */
  constructor(maxDepth = 10) {
    // Validate maxDepth parameter
    if (typeof maxDepth !== 'number') {
      throw new TypeError('maxDepth must be a number');
    }

    if (!Number.isFinite(maxDepth)) {
      throw new RangeError('maxDepth must be finite');
    }

    if (!Number.isInteger(maxDepth)) {
      throw new RangeError('maxDepth must be an integer');
    }

    if (maxDepth < 1) {
      throw new RangeError('maxDepth must be >= 1');
    }

    this.maxDepth = maxDepth;
  }

  /**
   * Validates that data does not exceed maximum depth
   *
   * @param {*} data - Data to validate
   * @throws {Error} If depth exceeds maximum
   * @throws {Error} If circular reference detected
   *
   * @example
   * validator.validate({ a: { b: { c: 'deep' } } }); // OK if depth ≤ 10
   * validator.validate(veryDeepObject); // Throws if depth > 10
   */
  validate(data) {
    const visited = new WeakSet();
    const actualDepth = this.getDepthWithCircularCheck(data, visited);

    if (actualDepth > this.maxDepth) {
      // Generic error message - don't expose actual depth (info leak)
      throw new Error('JSON depth exceeds maximum allowed');
    }
  }

  /**
   * Calculates the maximum depth of a nested structure with circular reference detection
   *
   * Depth counting rules:
   * - Primitives (string, number, boolean, null, undefined): depth 0
   * - Empty object/array: depth 1
   * - Object/array with nested values: 1 + max(child depths)
   *
   * Implementation uses Reflect.ownKeys() to inspect ALL own properties including:
   * - String-keyed properties (enumerable and non-enumerable)
   * - Symbol-keyed properties
   * - Custom array properties (beyond indexed elements)
   *
   * Circular reference detection uses WeakSet to track visited objects.
   *
   * @param {*} data - Data to measure
   * @param {WeakSet} visited - Set of visited objects for circular detection (internal)
   * @returns {number} Maximum depth of the structure
   * @throws {Error} If circular reference detected
   *
   * @example
   * getDepthWithCircularCheck('string', new WeakSet()) // 0
   * getDepthWithCircularCheck({}, new WeakSet()) // 1
   * getDepthWithCircularCheck({ a: { b: 'c' } }, new WeakSet()) // 3
   */
  getDepthWithCircularCheck(data, visited = new WeakSet()) {
    // Primitives have depth 0
    if (data === null || data === undefined) {
      return 0;
    }

    if (typeof data !== 'object') {
      return 0;
    }

    // Check for circular references
    if (visited.has(data)) {
      throw new Error('Circular reference detected in data structure');
    }

    // Add to visited set
    visited.add(data);

    try {
      // Empty objects/arrays have depth 1
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return 1;
        }

        // Find maximum depth among array elements
        let maxChildDepth = 0;

        // Check indexed elements
        for (const item of data) {
          const childDepth = this.getDepthWithCircularCheck(item, visited);
          maxChildDepth = Math.max(maxChildDepth, childDepth);

          // Early exit optimization: stop if we already exceed limit
          if (1 + maxChildDepth > this.maxDepth) {
            return 1 + maxChildDepth;
          }
        }

        // Also check non-numeric properties (arrays can have custom properties)
        const keys = Reflect.ownKeys(data);
        for (const key of keys) {
          // Skip numeric indices and 'length' (already checked above)
          if (typeof key === 'number' || key === 'length' ||
              (typeof key === 'string' && /^\d+$/.test(key))) {
            continue;
          }

          const childDepth = this.getDepthWithCircularCheck(data[key], visited);
          maxChildDepth = Math.max(maxChildDepth, childDepth);

          // Early exit optimization
          if (1 + maxChildDepth > this.maxDepth) {
            return 1 + maxChildDepth;
          }
        }

        return 1 + maxChildDepth;
      }

      // Handle objects (use Reflect.ownKeys to include Symbol properties)
      const keys = Reflect.ownKeys(data);
      if (keys.length === 0) {
        return 1;
      }

      // Find maximum depth among object properties
      let maxChildDepth = 0;
      for (const key of keys) {
        const childDepth = this.getDepthWithCircularCheck(data[key], visited);
        maxChildDepth = Math.max(maxChildDepth, childDepth);

        // Early exit optimization: stop if we already exceed limit
        if (1 + maxChildDepth > this.maxDepth) {
          return 1 + maxChildDepth;
        }
      }

      return 1 + maxChildDepth;
    } finally {
      // Remove from visited set after processing (allow same object in different branches)
      visited.delete(data);
    }
  }

  /**
   * Calculates the maximum depth of a nested structure (legacy method for backward compatibility)
   *
   * @deprecated Use validate() instead which includes circular reference detection
   * @param {*} data - Data to measure
   * @returns {number} Maximum depth of the structure
   */
  getDepth(data) {
    return this.getDepthWithCircularCheck(data, new WeakSet());
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
