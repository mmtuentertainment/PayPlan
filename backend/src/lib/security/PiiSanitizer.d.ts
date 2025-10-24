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
   */
  sanitize(data: any, visited?: WeakSet<object>): any;

  /**
   * Sanitizes an array
   */
  sanitizeArray(arr: any[], visited?: WeakSet<object>): any[];

  /**
   * Sanitizes an object
   */
  sanitizeObject(obj: Record<string, any>, visited?: WeakSet<object>): Record<string, any>;

  /**
   * Checks if a field name matches any PII pattern
   */
  isPiiField(fieldName: string): boolean;
}

export const piiSanitizer: PiiSanitizer;
