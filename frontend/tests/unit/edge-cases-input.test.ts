import { describe, test, expect } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import { DEFAULT_TIMEZONE } from '../fixtures/mock-items';

describe('Edge Cases: Input Validation', () => {
  const timezone = DEFAULT_TIMEZONE;

  test('handles empty string input', () => {
    const result = extractItemsFromEmails('', timezone);

    expect(result.items).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.duplicatesRemoved).toBe(0);
  });

  test('handles whitespace-only input', () => {
    const result = extractItemsFromEmails('   \n\n\t\t   \r\n   ', timezone);

    expect(result.items).toEqual([]);
    // Whitespace input creates an issue (unable to process)
    expect(result.issues.length).toBe(1);
    expect(result.issues[0].reason).toContain('Unable to process');
  });

  test('handles special characters only', () => {
    const result = extractItemsFromEmails('!@#$%^&*()_+-=[]{}|;:,.<>?/~`', timezone);

    expect(result.items).toEqual([]);
    // Special chars input creates an issue (unable to process)
    expect(result.issues.length).toBe(1);
    expect(result.issues[0].reason).toContain('Unable to process');
  });

  test('handles maximum valid input size (16,000 characters)', () => {
    // Create valid email at exactly 16,000 characters
    const baseEmail = 'Klarna payment 1/4: $25.00 due 10/15/2025\n';
    const padding = 'A'.repeat(16000 - baseEmail.length);
    const maxEmail = baseEmail + padding;

    expect(maxEmail.length).toBe(16000);

    const result = extractItemsFromEmails(maxEmail, timezone);

    // Should extract successfully
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].provider).toBe('Klarna');
  });

  test('rejects input exceeding maximum size (16,001 characters)', () => {
    const oversizedEmail = 'A'.repeat(16001);

    expect(() => {
      extractItemsFromEmails(oversizedEmail, timezone);
    }).toThrow(/Input too large/);
  });

  test('handles null input gracefully', () => {
    // @ts-expect-error Testing runtime null handling
    const result = extractItemsFromEmails(null, timezone);

    expect(result.items).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  test('handles undefined input gracefully', () => {
    // @ts-expect-error Testing runtime undefined handling
    const result = extractItemsFromEmails(undefined, timezone);

    expect(result.items).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  test('handles non-string input (number) gracefully', () => {
    // @ts-expect-error Testing runtime type mismatch
    const result = extractItemsFromEmails(12345, timezone);

    expect(result.items).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  test('handles non-string input (object) gracefully', () => {
    // @ts-expect-error Testing runtime type mismatch
    const result = extractItemsFromEmails({ foo: 'bar' }, timezone);

    expect(result.items).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  test('handles non-string input (array) gracefully', () => {
    // @ts-expect-error Testing runtime type mismatch
    const result = extractItemsFromEmails(['email', 'text'], timezone);

    expect(result.items).toEqual([]);
    expect(result.issues).toEqual([]);
  });
});
