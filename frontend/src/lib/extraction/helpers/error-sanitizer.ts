/**
 * Sanitizes error messages to prevent information disclosure while preserving debugging context.
 *
 * Removes absolute file paths and stack traces from error messages, but keeps error type
 * and safe details for debugging. Handles cross-platform paths (Unix, Windows, UNC).
 *
 * @param err - Error object or unknown error value
 * @returns Sanitized error message safe for display to users
 *
 * @example
 * ```typescript
 * try {
 *   throw new Error('Invalid date at /home/user/app/src/parser.ts:42');
 * } catch (err) {
 *   const safe = sanitizeError(err);
 *   console.log(safe); // "Invalid date"
 * }
 * ```
 */
export function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // Keep error message but remove absolute file paths
    const message = err.message.split('\n')[0]; // Take only first line
    // Remove absolute paths but keep relative context like "Invalid date: ..."
    const sanitized = message
      // Match Windows absolute paths with spaces: C:\Program Files\app.ts or C:\path\file.ts
      .replace(/[A-Z]:\\(?:[^\\:*?"<>|\r\n]+\\)*[^\\:*?"<>|\r\n]+\.(ts|js|tsx|jsx|mjs|cjs|mts|cts)/gi, '')
      // Match Windows UNC paths with spaces: \\server\share\path\file.ts
      .replace(/\\\\(?:[^\\:*?"<>|\r\n]+\\)+[^\\:*?"<>|\r\n]+\.(ts|js|tsx|jsx|mjs|cjs|mts|cts)/gi, '')
      // Match Unix absolute paths: /home/user/path/file.ts (requires multiple path segments)
      .replace(/\/(?:[^/\r\n]+\/)+[^/\r\n]+\.(ts|js|tsx|jsx|mjs|cjs|mts|cts)/g, '')
      // Remove "at <location>" suffixes
      .replace(/\bat\b.*$/, '')
      .trim();
    return sanitized || 'An error occurred during extraction';
  }
  return 'An unexpected error occurred';
}
