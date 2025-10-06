/**
 * Maps technical extraction errors to user-friendly messages
 *
 * Purpose: Provide helpful, actionable guidance when extraction fails
 * instead of showing technical error messages to users.
 */

/**
 * Convert a technical error to a user-friendly message
 *
 * @param error - The error thrown during extraction
 * @returns User-friendly error message with guidance
 */
export function getUserFriendlyError(error: Error): string {
  const message = error.message.toLowerCase();

  // Amount errors
  if (message.includes('amount not found')) {
    return 'No payment amount found. Please paste the full email including the payment amount (e.g., "$25.00").';
  }

  if (message.includes('cannot extract amount')) {
    return 'Unable to find payment amount in the email. Make sure the email includes text like "$25.00" or "Amount: $25.00".';
  }

  if (message.includes('invalid dollar amount') || message.includes('invalid currency')) {
    return 'The payment amount appears to be invalid. Please check the amount in the email and try again.';
  }

  // Date errors
  if (message.includes('due date not found')) {
    return 'No payment due date found. Please ensure the email includes text like "Due: 10/6/2025" or "Due date: October 6, 2025".';
  }

  if (message.includes('invalid date')) {
    return 'The due date appears to be invalid. Please check the date format in the email (e.g., "10/6/2025" or "October 6, 2025").';
  }

  if (message.includes('unsupported date format')) {
    return 'Date format not recognized. Supported formats: "10/06/2025", "October 6, 2025", or "2025-10-06".';
  }

  // Provider errors
  if (message.includes('provider') && message.includes('not found')) {
    return 'Could not identify payment provider (Klarna, Affirm, etc.). Make sure you pasted a payment reminder email from a supported provider.';
  }

  // Installment errors
  if (message.includes('installment')) {
    return 'Could not find installment information. Look for text like "Payment 1 of 4" or "Installment 2/4" in the email.';
  }

  // Timezone errors
  if (message.includes('timezone') && message.includes('invalid')) {
    return 'Invalid timezone setting. Please use a valid timezone like "America/New_York" or "Europe/London".';
  }

  // Currency errors
  if (message.includes('currency')) {
    return 'Unable to determine payment currency. Make sure the amount includes a currency symbol (e.g., "$25.00").';
  }

  // Input errors
  if (message.includes('null') || message.includes('undefined') || message.includes('empty')) {
    return 'No email text provided. Please paste the full payment reminder email into the text box.';
  }

  // Input too large
  if (message.includes('too large') || message.includes('exceeds')) {
    return 'The email text is too long. Please paste only the relevant payment reminder portion.';
  }

  // Generic extraction failure
  if (message.includes('extraction') || message.includes('parse')) {
    return 'Unable to extract payment information from this email. Please make sure it\'s a payment reminder from a supported provider (Klarna, Affirm, Afterpay, PayPal, Zip, or Sezzle).';
  }

  // Default: provide generic but helpful message
  return 'Unable to process this email. Please ensure you\'ve pasted a complete payment reminder email from Klarna, Affirm, Afterpay, PayPal, Zip, or Sezzle.';
}

/**
 * Get a user-friendly error message from any error type
 *
 * @param error - Any error (Error object, string, or unknown)
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return getUserFriendlyError(error);
  }

  if (typeof error === 'string') {
    return getUserFriendlyError(new Error(error));
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Create a helpful error message with context about what went wrong
 *
 * @param error - The error that occurred
 * @param context - Additional context (e.g., "extracting amounts")
 * @returns Formatted error message with context
 */
export function getErrorMessageWithContext(error: unknown, context: string): string {
  const friendlyMessage = getErrorMessage(error);
  return `Error ${context}: ${friendlyMessage}`;
}
