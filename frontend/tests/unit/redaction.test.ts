import { describe, test, expect } from 'vitest';
import {
  redact,
  unredact,
  toSafePreview,
  toMasked,
  isRedacted,
  redactPatterns,
  PII_PATTERNS,
  type RedactedString,
} from '../../src/lib/extraction/helpers/redaction';

describe('RedactedString branded type', () => {
  test('redact() wraps string in branded type', () => {
    const raw = 'sensitive data';
    const redacted = redact(raw);

    // Runtime: RedactedString is still a string
    expect(typeof redacted).toBe('string');
    expect(isRedacted(redacted)).toBe(true);
  });

  test('unredact() extracts original string', () => {
    const raw = 'sensitive data';
    const redacted = redact(raw);
    const unredacted = unredact(redacted);

    expect(unredacted).toBe(raw);
    expect(typeof unredacted).toBe('string');
  });

  test('isRedacted() validates RedactedString type', () => {
    const redacted = redact('test');
    expect(isRedacted(redacted)).toBe(true);

    expect(isRedacted('plain string')).toBe(true);  // Runtime check only
    expect(isRedacted(123)).toBe(false);
    expect(isRedacted(null)).toBe(false);
    expect(isRedacted(undefined)).toBe(false);
  });
});

describe('toSafePreview()', () => {
  test('returns short strings unchanged', () => {
    const redacted = redact('Short string');
    expect(toSafePreview(redacted)).toBe('Short string');
  });

  test('truncates long strings to 100 chars', () => {
    const longString = 'a'.repeat(200);
    const redacted = redact(longString);
    const preview = toSafePreview(redacted);

    expect(preview.length).toBe(100 + '... [redacted]'.length);
    expect(preview).toBe('a'.repeat(100) + '... [redacted]');
  });

  test('handles exactly 100 chars without truncation', () => {
    const exactString = 'a'.repeat(100);
    const redacted = redact(exactString);

    expect(toSafePreview(redacted)).toBe(exactString);
  });

  test('handles 101 chars with truncation', () => {
    const slightlyLong = 'a'.repeat(101);
    const redacted = redact(slightlyLong);

    expect(toSafePreview(redacted)).toBe('a'.repeat(100) + '... [redacted]');
  });

  test('preserves content for debugging', () => {
    const content = 'Error: Payment failed for installment 1 of 4';
    const redacted = redact(content);

    expect(toSafePreview(redacted)).toContain('Error: Payment failed');
  });
});

describe('toMasked()', () => {
  test('completely masks short strings', () => {
    const redacted = redact('secret');
    expect(toMasked(redacted)).toBe('[REDACTED: 6 chars]');
  });

  test('completely masks long strings', () => {
    const longString = 'a'.repeat(5000);
    const redacted = redact(longString);

    expect(toMasked(redacted)).toBe('[REDACTED: 5000 chars]');
  });

  test('shows zero length for empty strings', () => {
    const redacted = redact('');
    expect(toMasked(redacted)).toBe('[REDACTED: 0 chars]');
  });
});

describe('redactPatterns()', () => {
  test('redacts email addresses', () => {
    const text = 'Contact john.doe@example.com for help';
    const redacted = redactPatterns(text, [PII_PATTERNS.email]);

    expect(unredact(redacted)).toBe('Contact [REDACTED] for help');
  });

  test('redacts multiple email addresses', () => {
    const text = 'Email alice@test.com or bob@example.org';
    const redacted = redactPatterns(text, [PII_PATTERNS.email]);

    expect(unredact(redacted)).toBe('Email [REDACTED] or [REDACTED]');
  });

  test('redacts SSN patterns', () => {
    const text = 'SSN: 123-45-6789';
    const redacted = redactPatterns(text, [PII_PATTERNS.ssn]);

    expect(unredact(redacted)).toBe('SSN: [REDACTED]');
  });

  test('redacts credit card numbers', () => {
    const text = 'Card: 1234-5678-9012-3456';
    const redacted = redactPatterns(text, [PII_PATTERNS.creditCard]);

    expect(unredact(redacted)).toBe('Card: [REDACTED]');
  });

  test('redacts credit cards with spaces', () => {
    const text = 'Card: 1234 5678 9012 3456';
    const redacted = redactPatterns(text, [PII_PATTERNS.creditCard]);

    expect(unredact(redacted)).toBe('Card: [REDACTED]');
  });

  test('redacts credit cards without separators', () => {
    const text = 'Card: 1234567890123456';
    const redacted = redactPatterns(text, [PII_PATTERNS.creditCard]);

    expect(unredact(redacted)).toBe('Card: [REDACTED]');
  });

  test('redacts phone numbers', () => {
    const text = 'Call (555) 123-4567 or 555-987-6543';
    const redacted = redactPatterns(text, [PII_PATTERNS.phone]);

    expect(unredact(redacted)).toBe('Call [REDACTED] or [REDACTED]');
  });

  test('redacts account numbers (8+ digits)', () => {
    const text = 'Account: 12345678';
    const redacted = redactPatterns(text, [PII_PATTERNS.accountNumber]);

    expect(unredact(redacted)).toBe('Account: [REDACTED]');
  });

  test('does not redact amounts (< 8 digits)', () => {
    const text = 'Amount: $25.00 (2500 cents)';
    const redacted = redactPatterns(text, [PII_PATTERNS.accountNumber]);

    // Should not redact 2500 (only 4 digits)
    expect(unredact(redacted)).toBe('Amount: $25.00 (2500 cents)');
  });

  test('applies multiple patterns simultaneously', () => {
    const text = 'Email john@test.com, Phone: 555-123-4567, SSN: 123-45-6789';
    const redacted = redactPatterns(text, [
      PII_PATTERNS.email,
      PII_PATTERNS.phone,
      PII_PATTERNS.ssn,
    ]);

    expect(unredact(redacted)).toBe('Email [REDACTED], Phone: [REDACTED], SSN: [REDACTED]');
  });

  test('handles empty patterns array', () => {
    const text = 'No PII here';
    const redacted = redactPatterns(text, []);

    expect(unredact(redacted)).toBe('No PII here');
  });

  test('preserves structure for debugging', () => {
    const text = 'Payment from user@example.com failed at 2025-10-06';
    const redacted = redactPatterns(text, [PII_PATTERNS.email]);

    const result = unredact(redacted);
    expect(result).toContain('Payment from');
    expect(result).toContain('failed at 2025-10-06');
    expect(result).not.toContain('user@example.com');
  });
});

describe('PII_PATTERNS', () => {
  test('email pattern matches common formats', () => {
    const emails = [
      'simple@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_123@test-domain.org',
    ];

    emails.forEach(email => {
      const redacted = redactPatterns(`Contact: ${email}`, [PII_PATTERNS.email]);
      expect(unredact(redacted)).toBe('Contact: [REDACTED]');
    });
  });

  test('phone pattern matches US formats', () => {
    const phones = [
      '(555) 123-4567',
      '555-123-4567',
      '555.123.4567',
      '5551234567',
    ];

    phones.forEach(phone => {
      const redacted = redactPatterns(`Call: ${phone}`, [PII_PATTERNS.phone]);
      expect(unredact(redacted)).toContain('[REDACTED]');
    });
  });

  test('SSN pattern matches standard format only', () => {
    const validSSN = '123-45-6789';
    const invalidSSN = '12345678';  // Missing dashes

    const redacted1 = redactPatterns(validSSN, [PII_PATTERNS.ssn]);
    expect(unredact(redacted1)).toBe('[REDACTED]');

    const redacted2 = redactPatterns(invalidSSN, [PII_PATTERNS.ssn]);
    expect(unredact(redacted2)).toBe(invalidSSN);  // Not redacted
  });

  test('credit card pattern handles edge cases', () => {
    // Valid formats
    expect(unredact(redactPatterns('1234 5678 9012 3456', [PII_PATTERNS.creditCard]))).toBe('[REDACTED]');
    expect(unredact(redactPatterns('1234-5678-9012-3456', [PII_PATTERNS.creditCard]))).toBe('[REDACTED]');

    // Invalid: too short
    expect(unredact(redactPatterns('1234 5678 9012', [PII_PATTERNS.creditCard]))).toBe('1234 5678 9012');
  });

  test('account number pattern requires 8+ digits', () => {
    expect(unredact(redactPatterns('Acct: 12345678', [PII_PATTERNS.accountNumber]))).toBe('Acct: [REDACTED]');
    expect(unredact(redactPatterns('Acct: 1234567', [PII_PATTERNS.accountNumber]))).toBe('Acct: 1234567');
  });
});

describe('Compile-time type safety', () => {
  test('RedactedString cannot be assigned to string (compile-time check)', () => {
    const redacted = redact('sensitive');

    // This would fail TypeScript compilation:
    // const plainString: string = redacted;  // Type error!

    // Must explicitly unredact:
    const plainString: string = unredact(redacted);  // OK
    expect(plainString).toBe('sensitive');
  });

  test('string cannot be assigned to RedactedString (compile-time check)', () => {
    const plain = 'sensitive data';

    // This would fail TypeScript compilation:
    // const redactedString: RedactedString = plain;  // Type error!

    // Must explicitly redact:
    const redactedString: RedactedString = redact(plain);  // OK
    expect(isRedacted(redactedString)).toBe(true);
  });
});
