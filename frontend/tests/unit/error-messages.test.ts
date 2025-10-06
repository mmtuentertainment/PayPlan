import { describe, test, expect } from 'vitest';
import {
  getUserFriendlyError,
  getErrorMessage,
  getErrorMessageWithContext,
} from '../../src/lib/extraction/helpers/error-messages';

describe('getUserFriendlyError', () => {
  describe('amount errors', () => {
    test('maps "amount not found" error', () => {
      const error = new Error('Amount not found. Ensure email contains text like "Payment: $25.00"');
      const result = getUserFriendlyError(error);
      expect(result).toBe('No payment amount found. Please paste the full email including the payment amount (e.g., "$25.00").');
    });

    test('maps "cannot extract amount" error', () => {
      const error = new Error('Cannot extract amount from email');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Unable to find payment amount in the email. Make sure the email includes text like "$25.00" or "Amount: $25.00".');
    });

    test('maps "invalid dollar amount" error', () => {
      const error = new Error('Invalid dollar amount: -5.00');
      const result = getUserFriendlyError(error);
      expect(result).toBe('The payment amount appears to be invalid. Please check the amount in the email and try again.');
    });

    test('maps "invalid currency" error', () => {
      const error = new Error('Invalid currency symbol');
      const result = getUserFriendlyError(error);
      expect(result).toBe('The payment amount appears to be invalid. Please check the amount in the email and try again.');
    });
  });

  describe('date errors', () => {
    test('maps "due date not found" error', () => {
      const error = new Error('Due date not found in email');
      const result = getUserFriendlyError(error);
      expect(result).toBe('No payment due date found. Please ensure the email includes text like "Due: 10/6/2025" or "Due date: October 6, 2025".');
    });

    test('maps "invalid date" error', () => {
      const error = new Error('Invalid date format detected');
      const result = getUserFriendlyError(error);
      expect(result).toBe('The due date appears to be invalid. Please check the date format in the email (e.g., "10/6/2025" or "October 6, 2025").');
    });

    test('maps "unsupported date format" error', () => {
      const error = new Error('Unsupported date format: 2025/10/06');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Date format not recognized. Supported formats: "10/06/2025", "October 6, 2025", or "2025-10-06".');
    });
  });

  describe('provider errors', () => {
    test('maps "provider not found" error', () => {
      const error = new Error('Provider not found in email');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Could not identify payment provider (Klarna, Affirm, etc.). Make sure you pasted a payment reminder email from a supported provider.');
    });
  });

  describe('installment errors', () => {
    test('maps installment error', () => {
      const error = new Error('Installment number not found');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Could not find installment information. Look for text like "Payment 1 of 4" or "Installment 2/4" in the email.');
    });
  });

  describe('timezone errors', () => {
    test('maps invalid timezone error', () => {
      const error = new Error('Invalid timezone: America/Invalid');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Invalid timezone setting. Please use a valid timezone like "America/New_York" or "Europe/London".');
    });
  });

  describe('currency errors', () => {
    test('maps currency error', () => {
      const error = new Error('Currency symbol not found');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Unable to determine payment currency. Make sure the amount includes a currency symbol (e.g., "$25.00").');
    });
  });

  describe('input errors', () => {
    test('maps null/undefined/empty error', () => {
      const error = new Error('Email text is null');
      const result = getUserFriendlyError(error);
      expect(result).toBe('No email text provided. Please paste the full payment reminder email into the text box.');
    });

    test('maps "too large" error', () => {
      const error = new Error('Input too large');
      const result = getUserFriendlyError(error);
      expect(result).toBe('The email text is too long. Please paste only the relevant payment reminder portion.');
    });

    test('maps "exceeds" error', () => {
      const error = new Error('Text exceeds maximum length');
      const result = getUserFriendlyError(error);
      expect(result).toBe('The email text is too long. Please paste only the relevant payment reminder portion.');
    });
  });

  describe('generic extraction errors', () => {
    test('maps extraction error', () => {
      const error = new Error('Extraction failed for unknown reason');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Unable to extract payment information from this email. Please make sure it\'s a payment reminder from a supported provider (Klarna, Affirm, Afterpay, PayPal, Zip, or Sezzle).');
    });

    test('maps parse error', () => {
      const error = new Error('Failed to parse email structure');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Unable to extract payment information from this email. Please make sure it\'s a payment reminder from a supported provider (Klarna, Affirm, Afterpay, PayPal, Zip, or Sezzle).');
    });
  });

  describe('unknown errors', () => {
    test('provides helpful fallback for unrecognized errors', () => {
      const error = new Error('Some completely unexpected error');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Unable to process this email. Please ensure you\'ve pasted a complete payment reminder email from Klarna, Affirm, Afterpay, PayPal, Zip, or Sezzle.');
    });
  });

  describe('case insensitivity', () => {
    test('handles uppercase error messages', () => {
      const error = new Error('AMOUNT NOT FOUND');
      const result = getUserFriendlyError(error);
      expect(result).toBe('No payment amount found. Please paste the full email including the payment amount (e.g., "$25.00").');
    });

    test('handles mixed case error messages', () => {
      const error = new Error('Provider NOT Found in Email');
      const result = getUserFriendlyError(error);
      expect(result).toBe('Could not identify payment provider (Klarna, Affirm, etc.). Make sure you pasted a payment reminder email from a supported provider.');
    });
  });
});

describe('getErrorMessage', () => {
  test('handles Error objects', () => {
    const error = new Error('Amount not found');
    const result = getErrorMessage(error);
    expect(result).toBe('No payment amount found. Please paste the full email including the payment amount (e.g., "$25.00").');
  });

  test('handles string errors', () => {
    const result = getErrorMessage('Due date not found');
    expect(result).toBe('No payment due date found. Please ensure the email includes text like "Due: 10/6/2025" or "Due date: October 6, 2025".');
  });

  test('handles unknown error types', () => {
    const result = getErrorMessage({ weird: 'object' });
    expect(result).toBe('An unexpected error occurred. Please try again or contact support if the problem persists.');
  });

  test('handles null', () => {
    const result = getErrorMessage(null);
    expect(result).toBe('An unexpected error occurred. Please try again or contact support if the problem persists.');
  });

  test('handles undefined', () => {
    const result = getErrorMessage(undefined);
    expect(result).toBe('An unexpected error occurred. Please try again or contact support if the problem persists.');
  });
});

describe('getErrorMessageWithContext', () => {
  test('adds context to error message', () => {
    const error = new Error('Amount not found');
    const result = getErrorMessageWithContext(error, 'extracting payment details');
    expect(result).toBe('Error extracting payment details: No payment amount found. Please paste the full email including the payment amount (e.g., "$25.00").');
  });

  test('works with string errors', () => {
    const result = getErrorMessageWithContext('Provider not found', 'detecting provider');
    expect(result).toBe('Error detecting provider: Could not identify payment provider (Klarna, Affirm, etc.). Make sure you pasted a payment reminder email from a supported provider.');
  });

  test('works with unknown errors', () => {
    const result = getErrorMessageWithContext(42, 'processing');
    expect(result).toBe('Error processing: An unexpected error occurred. Please try again or contact support if the problem persists.');
  });
});
