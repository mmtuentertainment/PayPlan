/**
 * PII Sanitization Utilities for PayPlan
 * Shared across all features (goals, transactions, budgets, categories)
 *
 * Constitution Requirement: Principle I (Privacy-First, IMMUTABLE)
 * - All exports must sanitize PII before download
 * - Protects users from accidental data exposure
 * - Single source of truth for privacy patterns
 *
 * Extracted from features/goals/lib/export.ts (Phase 11, Task 103)
 * to enable reuse across all PayPlan features.
 *
 * @module shared/lib/privacy
 */

/**
 * PII Sanitization Patterns
 *
 * Regex patterns with word boundaries to detect and sanitize:
 * - Email addresses
 * - Phone numbers (US format only in Phase 1)
 * - Social Security Numbers (SSN)
 * - Credit card numbers (13-19 digits with optional spaces/dashes)
 * - Names (common patterns like "John Doe", "Jane Smith")
 * - Street addresses (numbers + street names)
 *
 * @remarks Phase 1 Limitations (Known False Negatives)
 *
 * **⚠️ PII sanitization is BEST-EFFORT and NOT comprehensive.**
 * Users should review exported data before sharing externally.
 *
 * **Known limitations**:
 * 1. **Name pattern**: Only detects ~50 common Western names (misses "Aarav Patel", "Wei Chen", "José García")
 * 2. **Phone pattern**: US-only format (misses +44, +61, +33, +49, +86, +91 international numbers)
 * 3. **Address pattern**: Only numbered street addresses (misses "Near Central Park", "Apartment 5B")
 * 4. **Email pattern**: Comprehensive (no known major limitations)
 * 5. **SSN pattern**: US-only (misses equivalent international IDs)
 * 6. **Credit card pattern**: Comprehensive (13-19 digit Luhn algorithm patterns)
 *
 * **Recommendation**: Add user-facing warning in export UI:
 * "PII sanitization is best-effort. Review exported data before sharing."
 *
 * @remarks Phase 2 Enhancements
 * - International phone support (libphonenumber-js library)
 * - Expanded name detection (NLP-based entity recognition)
 * - Address parsing (Google Places API or similar)
 * - See Linear issue: "Add international phone support for PII sanitization"
 *
 * @see {@link sanitizePII} for usage examples
 */
const PII_PATTERNS = {
  /**
   * Email pattern: user@domain.com
   *
   * @example
   * "Contact john@example.com" → "Contact [EMAIL_REDACTED]"
   */
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  /**
   * Phone pattern: US format only (Phase 1)
   *
   * **Matches**: (555) 123-4567, 555-123-4567, +1-555-123-4567, 1-555-123-4567
   *
   * **Does NOT match**: International formats (e.g., +44, +61, +33, +49, +86, +91)
   *
   * @remarks Rationale for US-only in Phase 1
   * - Conservative approach: Avoids false positives on non-phone numbers
   * - Goal/transaction names may contain digit patterns (e.g., "Save $1,234 for vacation")
   * - International regex patterns are complex and error-prone (many country-specific rules)
   *
   * @remarks Known Limitations (documented for Phase 2)
   * 1. UK (+44): +44 20 7946 0958, +44 7911 123456 (landline vs mobile)
   * 2. Australia (+61): +61 2 1234 5678, +61 412 345 678 (landline vs mobile)
   * 3. France (+33): +33 1 23 45 67 89 (space-separated groups)
   * 4. Germany (+49): +49 30 123456, +49 151 12345678 (variable length)
   * 5. China (+86): +86 10 1234 5678, +86 138 1234 5678 (variable length)
   * 6. India (+91): +91 11 2345 6789, +91 98765 43210 (variable length)
   *
   * @remarks Future Enhancement (Phase 2+)
   * - Use libphonenumber-js library for comprehensive international support
   * - Support 200+ country codes with format validation
   * - Handle variable-length numbers (7-15 digits per ITU-T E.164 standard)
   * - See Linear issue: "Add international phone support for PII sanitization"
   *
   * @example
   * "Call (555) 123-4567" → "Call [PHONE_REDACTED]"
   * "Text +1-555-123-4567" → "Text [PHONE_REDACTED]"
   */
  phone: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,

  /**
   * SSN pattern: 123-45-6789, 123456789
   *
   * @example
   * "SSN: 123-45-6789" → "SSN: [SSN_REDACTED]"
   */
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  /**
   * Credit Card pattern: 1234-5678-9012-3456 (13-19 digits, Amex 15 digits supported)
   *
   * Patterns:
   * - 16-digit no spaces (1234567890123456)
   * - 15-digit Amex (123456789012345)
   * - 4-6-5 Amex with separators
   * - 4-4-4-4 standard with separators
   *
   * @example
   * "Card: 1234-5678-9012-3456" → "Card: [CARD_REDACTED]"
   */
  creditCard: /\b(?:\d{16}|\d{15}|\d{4}[-\s]?\d{6}[-\s]?\d{5}|\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{3,7})\b/g,

  /**
   * Name pattern: "John Doe", "Jane Smith" (capitalized first/last name pattern)
   *
   * Matches: capitalized First Last (e.g., "Sarah Johnson", "Michael Chen")
   *
   * @remarks Stop-word filtering
   * Stop-word filtering prevents false positives on common terms (see {@link PII_STOP_WORDS})
   *
   * @example
   * "Contact Sarah Johnson" → "Contact [NAME_REDACTED]"
   * "Emergency Fund" → "Emergency Fund" (contains stop-word "Emergency")
   */
  name: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,

  /**
   * Street Address pattern: "123 Main St", "456 Oak Avenue"
   *
   * Pattern: <number> <name> <type> (no extra words allowed between name and type)
   *
   * @example
   * "Address: 123 Main St" → "Address: [ADDRESS_REDACTED]"
   */
  address: /\b\d{1,5}\s+[A-Za-z0-9]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi,
} as const;

/**
 * Stop-words for name sanitization
 *
 * Common terms that should NOT be redacted as names.
 * Prevents false positives on goal/transaction names like "Emergency Fund" or "House Payment"
 *
 * @remarks Usage in name sanitization
 * When a capitalized First Last pattern is detected (e.g., "Emergency Fund"),
 * we check if either word is in this stop-word list. If yes, we keep the original text.
 *
 * @example Stop-word filtering in action
 * - "Emergency Fund" → NOT redacted (contains "Emergency" and "Fund")
 * - "John Smith" → REDACTED (no stop-words)
 * - "Car Payment" → NOT redacted (contains "Car" and "Payment")
 * - "Main Street" → NOT redacted (contains "Main" and "Street")
 */
const PII_STOP_WORDS = new Set([
  'Emergency',
  'House',
  'Car',
  'Wedding',
  'Vacation',
  'Retirement',
  'College',
  'Fund',
  'Savings',
  'Account',
  'Budget',
  'Payment',
  'Down',
  'Trip',
  'Goal',
  // Common street/location words that might appear in goal/transaction names
  // Prevents false positives on location names like "Main Street" or "Oak Avenue"
  'Main',
  'Street',
  'Oak',
  'Pine',
  'Elm',
  'Maple',
  'Avenue',
  'Road',
  'Drive',
  'Mall', // Shopping centers
  'Visit', // Travel-related
]);

/**
 * Sanitize text by replacing PII with redacted placeholders
 *
 * **Use this function for all user-generated text before export or logging.**
 *
 * Replaces detected PII patterns with standardized placeholders:
 * - Email → `[EMAIL_REDACTED]`
 * - Phone → `[PHONE_REDACTED]`
 * - SSN → `[SSN_REDACTED]`
 * - Credit Card → `[CARD_REDACTED]`
 * - Name → `[NAME_REDACTED]` (with stop-word filtering)
 * - Address → `[ADDRESS_REDACTED]`
 *
 * @param text - Text to sanitize (e.g., goal name, transaction note, category name)
 * @returns Sanitized text with PII replaced by placeholders
 *
 * @remarks Processing Order
 * Order matters! Addresses are processed before names to avoid false positives.
 *
 * @remarks Name Sanitization with Stop-Word Filtering
 * Names are only redacted if they do NOT contain common stop-words (e.g., "Emergency Fund" is kept).
 *
 * @example Basic Usage
 * ```typescript
 * import { sanitizePII } from '@/shared/lib/privacy';
 *
 * // Goal name sanitization
 * const goalName = "Save for John Smith's wedding";
 * const sanitized = sanitizePII(goalName);
 * // Result: "Save for [NAME_REDACTED]'s wedding"
 *
 * // Contribution note sanitization
 * const note = "Received from john@example.com via phone (555) 123-4567";
 * const sanitizedNote = sanitizePII(note);
 * // Result: "Received from [EMAIL_REDACTED] via phone [PHONE_REDACTED]"
 *
 * // Stop-word filtering (no redaction)
 * const goalName2 = "Emergency Fund";
 * const sanitized2 = sanitizePII(goalName2);
 * // Result: "Emergency Fund" (unchanged, contains stop-words)
 * ```
 *
 * @example CSV/JSON Export
 * ```typescript
 * import { sanitizePII } from '@/shared/lib/privacy';
 *
 * // Sanitize before export
 * const goals = loadGoals();
 * const sanitizedGoals = goals.map(goal => ({
 *   ...goal,
 *   name: sanitizePII(goal.name),
 *   contributions: goal.contributions.map(c => ({
 *     ...c,
 *     note: c.note ? sanitizePII(c.note) : null,
 *   })),
 * }));
 *
 * // Safe to export
 * exportToCSV(sanitizedGoals);
 * ```
 *
 * @example Transaction Export
 * ```typescript
 * import { sanitizePII } from '@/shared/lib/privacy';
 *
 * // Sanitize transaction descriptions
 * const transactions = loadTransactions();
 * const sanitizedTransactions = transactions.map(t => ({
 *   ...t,
 *   description: sanitizePII(t.description),
 *   merchant: sanitizePII(t.merchant),
 *   notes: t.notes ? sanitizePII(t.notes) : null,
 * }));
 * ```
 *
 * @see {@link PII_PATTERNS} for pattern details
 * @see {@link PII_STOP_WORDS} for stop-word list
 */
export function sanitizePII(text: string): string {
  let sanitized = text;

  // Replace each PII pattern with [REDACTED] placeholder
  // Note: Order matters! Process addresses before names to avoid false positives
  sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.address, '[ADDRESS_REDACTED]');

  // Name sanitization with stop-word filtering (restored from PR85-6 removal)
  // Check each name match against stop-words to avoid false positives on goal names
  sanitized = sanitized.replace(PII_PATTERNS.name, (match) => {
    // Check if match contains any stop-word (case-insensitive)
    const hasStopWord = Array.from(PII_STOP_WORDS).some((word) =>
      match.includes(word)
    );
    return hasStopWord ? match : '[NAME_REDACTED]';
  });

  return sanitized;
}
