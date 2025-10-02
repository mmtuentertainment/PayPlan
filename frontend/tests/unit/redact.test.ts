import { describe, test, expect } from 'vitest';
import { redactPII } from '../../src/lib/redact';

describe('redactPII', () => {
  test('redacts email addresses', () => {
    expect(redactPII('user@example.com')).toBe('[EMAIL]');
    expect(redactPII('Contact: john.doe@company.org')).toBe('Contact: [EMAIL]');
  });

  test('redacts dollar amounts', () => {
    expect(redactPII('Payment: $25.00')).toBe('Payment: [AMOUNT]');
    expect(redactPII('$1,234.56 due')).toBe('[AMOUNT] due');
    expect(redactPII('$999')).toBe('[AMOUNT]');
  });

  test('redacts account numbers', () => {
    expect(redactPII('Account: 1234567890')).toBe('Account: [ACCOUNT]');
    expect(redactPII('Card ending in 4567')).toBe('Card ending in [ACCOUNT]');
  });

  test('redacts names', () => {
    expect(redactPII('John Doe is here')).toBe('[NAME] is here');
    expect(redactPII('From: Jane Smith')).toBe('From: [NAME]');
  });

  test('redacts combined PII', () => {
    const input = 'From: john.doe@example.com, Payment: $25.00, Account: 123456';
    const expected = 'From: [EMAIL], Payment: [AMOUNT], Account: [ACCOUNT]';
    expect(redactPII(input)).toBe(expected);
  });
});
