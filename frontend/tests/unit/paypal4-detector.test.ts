import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { detectProvider, PROVIDER_PATTERNS } from '../../src/lib/extraction/providers';
import { extractAmount, extractDueDate, extractInstallmentNumber, detectAutopay, extractLateFee } from '../../src/lib/extraction/extractors';

describe('PayPal Pay in 4 Provider Detection', () => {
  const paypal1 = readFileSync(join(__dirname, '../fixtures/emails/paypal4-payment1.txt'), 'utf-8');
  const paypalFinal = readFileSync(join(__dirname, '../fixtures/emails/paypal4-final.txt'), 'utf-8');

  test('detects PayPal from @paypal.com domain', () => {
    const email = 'From: service@paypal.com\nPay in 4 installment due';
    expect(detectProvider(email)).toBe('PayPalPayIn4');
  });

  test('detects PayPal from "Pay in 4" keyword', () => {
    const email = 'Your Pay in 4 payment is ready\ninstallment 1 of 4';
    expect(detectProvider(email)).toBe('PayPalPayIn4');
  });

  test('extracts amount from PayPal payment email', () => {
    const amount = extractAmount(paypal1, PROVIDER_PATTERNS.paypalpayin4.amountPatterns);
    expect(amount).toBe(37.50);
  });

  test('extracts amount from final payment email', () => {
    const amount = extractAmount(paypalFinal, PROVIDER_PATTERNS.paypalpayin4.amountPatterns);
    expect(amount).toBe(37.50);
  });

  test('extracts due date in MM/DD/YYYY format', () => {
    const date = extractDueDate(paypal1, PROVIDER_PATTERNS.paypalpayin4.datePatterns, 'America/New_York');
    expect(date.isoDate).toBe('2025-10-15');
  });

  test('extracts due date with "by" keyword', () => {
    const date = extractDueDate(paypalFinal, PROVIDER_PATTERNS.paypalpayin4.datePatterns, 'America/New_York');
    expect(date.isoDate).toBe('2025-11-30');
  });

  test('extracts installment number "1 of 4"', () => {
    const installment = extractInstallmentNumber(paypal1, PROVIDER_PATTERNS.paypalpayin4.installmentPatterns);
    expect(installment).toBe(1);
  });

  test('detects final payment', () => {
    // Final payment should be detected as last installment (4)
    const installment = extractInstallmentNumber(paypalFinal, PROVIDER_PATTERNS.paypalpayin4.installmentPatterns);
    expect(installment).toBe(4);
  });

  test('detects autopay ON', () => {
    expect(detectAutopay(paypal1)).toBe(true);
  });

  test('detects autopay OFF', () => {
    expect(detectAutopay(paypalFinal)).toBe(false);
  });

  test('extracts late fee when present', () => {
    expect(extractLateFee(paypal1)).toBe(10.00);
  });

  test('returns 0 late fee when not present', () => {
    expect(extractLateFee(paypalFinal)).toBe(0);
  });

  test('does not detect PayPal from other providers', () => {
    const klarnaEmail = 'From: noreply@klarna.com\nPayment due';
    expect(detectProvider(klarnaEmail)).toBe('Klarna');
  });

  // Timezone handling tests
  test('extracts date correctly across different timezones (PST)', () => {
    const email = 'Your Pay in 4 payment is due on 12/15/2025\nFrom: service@paypal.com';
    const date = extractDueDate(email, PROVIDER_PATTERNS.paypalpayin4.datePatterns, 'America/Los_Angeles');
    expect(date.isoDate).toBe('2025-12-15');
  });

  test('extracts date correctly across different timezones (EST)', () => {
    const email = 'Your Pay in 4 payment is due on 12/15/2025\nFrom: service@paypal.com';
    const date = extractDueDate(email, PROVIDER_PATTERNS.paypalpayin4.datePatterns, 'America/New_York');
    expect(date.isoDate).toBe('2025-12-15');
  });

  test('extracts date correctly across different timezones (UTC)', () => {
    const email = 'Your Pay in 4 payment is due on 12/15/2025\nFrom: service@paypal.com';
    const date = extractDueDate(email, PROVIDER_PATTERNS.paypalpayin4.datePatterns, 'UTC');
    expect(date.isoDate).toBe('2025-12-15');
  });

  // Middle installment tests
  test('extracts middle installment (2 of 4)', () => {
    const email = 'Your Pay in 4 payment 2 of 4 is due\nAmount: $37.50';
    const installment = extractInstallmentNumber(email, PROVIDER_PATTERNS.paypalpayin4.installmentPatterns);
    expect(installment).toBe(2);
  });

  test('extracts middle installment (3 of 4)', () => {
    const email = 'Your Pay in 4 payment 3 of 4 is due\nAmount: $37.50';
    const installment = extractInstallmentNumber(email, PROVIDER_PATTERNS.paypalpayin4.installmentPatterns);
    expect(installment).toBe(3);
  });

  // Error cases
  test('throws error when due date not found', () => {
    const email = 'From: service@paypal.com\nPay in 4 payment\nNo date here';
    expect(() => extractDueDate(email, PROVIDER_PATTERNS.paypalpayin4.datePatterns, 'America/New_York'))
      .toThrow('Due date not found');
  });

  test('throws error when amount not found', () => {
    const email = 'From: service@paypal.com\nPay in 4 payment\nNo amount here';
    expect(() => extractAmount(email, PROVIDER_PATTERNS.paypalpayin4.amountPatterns))
      .toThrow('Amount not found');
  });

  // Late fee edge cases
  test('extracts large late fee correctly', () => {
    const email = 'Pay in 4 reminder\nLate fee: $25.00';
    expect(extractLateFee(email)).toBe(25.00);
  });

  test('extracts late fee with "late charge" wording', () => {
    const email = 'Pay in 4 reminder\nLate charge: $15.50';
    expect(extractLateFee(email)).toBe(15.50);
  });

  // Autopay edge cases
  test('detects autopay with "automatic payment" wording', () => {
    const email = 'Pay in 4 payment\nAutomatic payment is enabled';
    expect(detectAutopay(email)).toBe(true);
  });

  test('detects disabled autopay with "not enabled" wording', () => {
    const email = 'Pay in 4 payment\nAutopay not enabled';
    expect(detectAutopay(email)).toBe(false);
  });

  test('handles missing autopay signal', () => {
    const email = 'Pay in 4 payment\nNo autopay information';
    expect(detectAutopay(email)).toBe(false);
  });

  // Financial accuracy tests
  test('extracts large amount with commas correctly', () => {
    const email = 'Payment 1 of 4: $1,234.56';
    const amount = extractAmount(email, PROVIDER_PATTERNS.paypalpayin4.amountPatterns);
    expect(amount).toBe(1234.56);
  });

  test('extracts amount from "amount due" pattern', () => {
    const email = 'Amount due: $99.99\nPay in 4';
    const amount = extractAmount(email, PROVIDER_PATTERNS.paypalpayin4.amountPatterns);
    expect(amount).toBe(99.99);
  });

  test('extracts amount with "installment" keyword', () => {
    const email = 'Installment 2 of 4: $50.00';
    const amount = extractAmount(email, PROVIDER_PATTERNS.paypalpayin4.amountPatterns);
    expect(amount).toBe(50.00);
  });
});
