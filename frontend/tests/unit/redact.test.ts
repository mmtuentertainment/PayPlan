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

  test('redacts account numbers (context-aware)', () => {
    expect(redactPII('Account: 1234567890')).toBe('account: [ACCOUNT]');
    expect(redactPII('Card 4567')).toBe('card: [ACCOUNT]');
    expect(redactPII('Acct #9876')).toBe('acct: [ACCOUNT]');
    // Should NOT redact years or ZIP codes without context
    expect(redactPII('Due in 2025')).toBe('Due in 2025');
    expect(redactPII('ZIP: 10001')).toBe('ZIP: 10001');
  });

  test('redacts names (3+ chars, with false positive protection)', () => {
    expect(redactPII('John Doe is here')).toBe('[NAME] is here');
    expect(redactPII('From: Jane Smith')).toBe('From: [NAME]');
    // Should NOT redact common BNPL phrases
    expect(redactPII('Pay Later available')).toBe('Pay Later available');
    expect(redactPII('Auto Pay is enabled')).toBe('Auto Pay is enabled');
    expect(redactPII('Buy Now Pay In 4')).toBe('Buy Now Pay In 4');
  });

  test('redacts combined PII', () => {
    const input = 'From: john.doe@example.com, Payment: $25.00, Account: 123456';
    const expected = 'From: [EMAIL], Payment: [AMOUNT], account: [ACCOUNT]';
    expect(redactPII(input)).toBe(expected);
  });
});
