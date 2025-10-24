/**
 * PII Sanitizer TypeScript Definitions
 */

export class PiiSanitizer {
  constructor();

  /**
   * PII field patterns to detect and remove (readonly)
   */
  readonly piiPatterns: readonly string[];

  /**
   * Sanitizes an object by removing all PII fields recursively
   *
   * Generic type parameter preserves the input type structure while
   * removing PII fields. Note: PII fields will be omitted from return type.
   *
   * @param data - Data to sanitize (object, array, or primitive)
   * @param visited - Internal circular reference tracking (do not provide)
   * @returns Sanitized copy of data with PII fields removed
   * @throws Error if circular reference detected
   *
   * @example
   * const input = { id: '123', email: 'user@example.com', amount: 100 };
   * const output = sanitizer.sanitize(input);
   * // output: { id: '123', amount: 100 } (email removed)
   */
  sanitize<T>(data: T, visited?: WeakSet<object>): T;

  // Private helper methods (not part of public API):
  // - sanitizeArray(arr, visited): Internal array sanitization
  // - sanitizeObject(obj, visited): Internal object sanitization
  // - isPiiField(fieldName): Internal PII pattern matching
}

/**
 * Configuration options for PiiSanitizer
 */
export interface PiiSanitizerConfig {
  /**
   * Custom PII patterns to add (in addition to defaults)
   */
  customPatterns?: string[];

  /**
   * Whether to include default patterns (default: true)
   */
  includeDefaults?: boolean;
}

/**
 * Factory function to create a configured PiiSanitizer instance
 *
 * Use this for custom configurations (e.g., region-specific PII rules).
 * For standard usage, use the exported singleton `piiSanitizer`.
 *
 * @param config - Optional configuration
 * @returns New PiiSanitizer instance
 *
 * @example
 * // Create sanitizer with custom patterns
 * const customSanitizer = createPiiSanitizer({
 *   customPatterns: ['customField', 'internalId'],
 *   includeDefaults: true
 * });
 */
export function createPiiSanitizer(config?: PiiSanitizerConfig): PiiSanitizer;

/**
 * Default PiiSanitizer singleton instance
 *
 * Uses standard PII patterns for BNPL context.
 * For custom configurations, use `createPiiSanitizer()`.
 */
export const piiSanitizer: PiiSanitizer;
