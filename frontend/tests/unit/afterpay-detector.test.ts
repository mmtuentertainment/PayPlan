import { describe, test, expect } from 'vitest';
import { detectProvider, PROVIDER_PATTERNS } from '../../src/lib/extraction/providers';
import {
  extractAmount,
  extractDueDate,
  extractInstallmentNumber,
  detectAutopay,
  extractLateFee
} from '../../src/lib/extraction/extractors';

describe('Afterpay detector', () => {
  test('detects Afterpay from email domain', () => {
    expect(detectProvider('From: payments@afterpay.com')).toBe('Afterpay');
  });

  test('detects Afterpay from keyword', () => {
    expect(detectProvider('Your Afterpay payment is due')).toBe('Afterpay');
  });

  test('extracts amount from Afterpay email', () => {
    const text = 'Installment: $25.00 due';
    const amount = extractAmount(text, PROVIDER_PATTERNS.afterpay.amountPatterns);
    expect(amount).toBe(2500);  // Integer cents
  });

  test('extracts due date from Afterpay email', () => {
    const text = 'Due: October 6, 2025';
    const date = extractDueDate(text, PROVIDER_PATTERNS.afterpay.datePatterns, 'America/New_York');
    expect(date.isoDate).toBe('2025-10-06');
  });

  test('extracts installment number', () => {
    const text = 'Payment 1 of 4';
    const num = extractInstallmentNumber(text, PROVIDER_PATTERNS.afterpay.installmentPatterns);
    expect(num).toBe(1);
  });

  test('detects autopay OFF', () => {
    const text = 'AutoPay is OFF';
    expect(detectAutopay(text)).toBe(false);
  });

  test('detects autopay ON', () => {
    const text = 'AutoPay is ON';
    expect(detectAutopay(text)).toBe(true);
  });

  test('extracts late fee', () => {
    const text = 'Late fee: $7.00';
    expect(extractLateFee(text)).toBe(700);  // Integer cents
  });
});
