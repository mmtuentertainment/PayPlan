/**
 * Helper for safe field extraction with error collection.
 *
 * Attempts to extract a field using the provided extractor function.
 * If extraction fails, adds error to the errors array instead of throwing.
 *
 * @param extractor - Function that performs the extraction
 * @param errorMessage - Message to add to errors array if extraction fails
 * @param errors - Array to collect errors
 * @param optional - If true, returns undefined on error instead of adding to errors
 * @returns Extracted value or undefined if extraction failed
 *
 * @example
 * ```typescript
 * const errors: string[] = [];
 * const amount = safeExtract(
 *   () => extractAmount(emailText, patterns),
 *   'Amount',
 *   errors
 * );
 * ```
 */
export function safeExtract<T>(
  extractor: () => T,
  errorMessage: string,
  errors: string[],
  optional: boolean = false
): T | undefined {
  try {
    return extractor();
  } catch (e) {
    if (!optional) {
      errors.push(`${errorMessage}: ${e instanceof Error ? e.message : 'not found'}`);
    }
    return undefined;
  }
}
