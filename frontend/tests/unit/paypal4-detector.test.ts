import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { detectProvider, extractAmount, extractDueDate, extractInstallmentNumber, detectAutopay, extractLateFee, PROVIDER_PATTERNS } from '../../src/lib/provider-detectors';

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
    const amount = extractAmount(paypal1, PROVIDER_PATTERNS.paypal4.amountPatterns);
    expect(amount).toBe(37.50);
  });

  test('extracts amount from final payment email', () => {
    const amount = extractAmount(paypalFinal, PROVIDER_PATTERNS.paypal4.amountPatterns);
    expect(amount).toBe(37.50);
  });

  test('extracts due date in MM/DD/YYYY format', () => {
    const date = extractDueDate(paypal1, PROVIDER_PATTERNS.paypal4.datePatterns, 'America/New_York');
    expect(date).toBe('2025-10-15');
  });

  test('extracts due date with "by" keyword', () => {
    const date = extractDueDate(paypalFinal, PROVIDER_PATTERNS.paypal4.datePatterns, 'America/New_York');
    expect(date).toBe('2025-11-30');
  });

  test('extracts installment number "1 of 4"', () => {
    const installment = extractInstallmentNumber(paypal1, PROVIDER_PATTERNS.paypal4.installmentPatterns);
    expect(installment).toBe(1);
  });

  test('detects final payment', () => {
    // Final payment should be detected as last installment (4)
    const installment = extractInstallmentNumber(paypalFinal, PROVIDER_PATTERNS.paypal4.installmentPatterns);
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
});
