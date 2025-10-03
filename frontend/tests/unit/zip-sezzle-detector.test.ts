import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { detectProvider, extractAmount, extractDueDate, extractInstallmentNumber, detectAutopay, extractLateFee, PROVIDER_PATTERNS } from '../../src/lib/provider-detectors';

describe('Zip Provider Detection', () => {
  const zipFixture = readFileSync(join(__dirname, '../fixtures/emails/zip-payment1.txt'), 'utf-8');

  test('detects Zip from @zip.co domain', () => {
    const email = 'From: noreply@zip.co\nYour payment 1 of 4 is due';
    expect(detectProvider(email)).toBe('Zip');
  });

  test('detects Zip from @quadpay.com domain', () => {
    const email = 'From: support@quadpay.com\nYour Quadpay installment is due';
    expect(detectProvider(email)).toBe('Zip');
  });

  test('detects Zip from "Zip" keyword with nearby installment phrase', () => {
    const email = 'Your Zip payment 1 of 4 is ready\ninstallment due soon';
    expect(detectProvider(email)).toBe('Zip');
  });

  test('detects Zip from "Quadpay" keyword with nearby installment phrase', () => {
    const email = 'Your Quadpay payment 2 of 4 is due\ninstallment notice';
    expect(detectProvider(email)).toBe('Zip');
  });

  test('does NOT detect Zip from generic "zip" without installment context', () => {
    const email = 'Please zip this file and send it to me';
    expect(detectProvider(email)).toBe('Unknown');
  });

  test('does NOT detect Zip when keyword and installment phrase are >80 chars apart', () => {
    const email = 'Zip' + ' '.repeat(85) + 'payment 1 of 4';
    expect(detectProvider(email)).toBe('Unknown');
  });

  test('extracts amount from Zip email', () => {
    const amount = extractAmount(zipFixture, PROVIDER_PATTERNS.zip.amountPatterns);
    expect(amount).toBeCloseTo(25.00, 2);
  });

  test('extracts due date from Zip email', () => {
    const date = extractDueDate(zipFixture, PROVIDER_PATTERNS.zip.datePatterns, 'America/New_York');
    expect(date).toBe('2025-10-15');
  });

  test('extracts installment number from Zip email', () => {
    const installment = extractInstallmentNumber(zipFixture, PROVIDER_PATTERNS.zip.installmentPatterns);
    expect(installment).toBe(1);
  });

  test('detects autopay ON in Zip email', () => {
    expect(detectAutopay(zipFixture)).toBe(true);
  });

  test('extracts late fee from Zip email', () => {
    expect(extractLateFee(zipFixture)).toBeCloseTo(5.00, 2);
  });

  test('throws error when Zip due date not found', () => {
    const email = 'From: noreply@zip.co\nYour Zip payment\nNo date here';
    expect(() => extractDueDate(email, PROVIDER_PATTERNS.zip.datePatterns, 'America/New_York'))
      .toThrow('Due date not found');
  });

  test('throws error when Zip amount not found', () => {
    const email = 'From: noreply@zip.co\nYour Zip payment\nNo amount here';
    expect(() => extractAmount(email, PROVIDER_PATTERNS.zip.amountPatterns))
      .toThrow('Amount not found');
  });
});

describe('Sezzle Provider Detection', () => {
  const sezzleFixture = readFileSync(join(__dirname, '../fixtures/emails/sezzle-payment1.txt'), 'utf-8');

  test('detects Sezzle from @sezzle.com domain', () => {
    const email = 'From: hello@sezzle.com\nYour payment is due';
    expect(detectProvider(email)).toBe('Sezzle');
  });

  test('detects Sezzle from "Sezzle" keyword with nearby installment phrase', () => {
    const email = 'Your Sezzle payment 1 of 4 is ready\ninstallment due soon';
    expect(detectProvider(email)).toBe('Sezzle');
  });

  test('does NOT detect Sezzle when keyword lacks nearby installment context', () => {
    const email = 'Just mentioning Sezzle without any payment context here';
    expect(detectProvider(email)).toBe('Unknown');
  });

  test('does NOT detect Sezzle when keyword and installment phrase are >80 chars apart', () => {
    const email = 'Sezzle' + ' '.repeat(85) + 'payment 1 of 4';
    expect(detectProvider(email)).toBe('Unknown');
  });

  test('extracts amount from Sezzle email', () => {
    const amount = extractAmount(sezzleFixture, PROVIDER_PATTERNS.sezzle.amountPatterns);
    expect(amount).toBeCloseTo(30.00, 2);
  });

  test('extracts due date from Sezzle email', () => {
    const date = extractDueDate(sezzleFixture, PROVIDER_PATTERNS.sezzle.datePatterns, 'America/New_York');
    expect(date).toBe('2025-11-30');
  });

  test('extracts installment number from Sezzle email', () => {
    const installment = extractInstallmentNumber(sezzleFixture, PROVIDER_PATTERNS.sezzle.installmentPatterns);
    expect(installment).toBe(2);
  });

  test('detects autopay OFF in Sezzle email', () => {
    expect(detectAutopay(sezzleFixture)).toBe(false);
  });

  test('returns 0 late fee when not present in Sezzle email', () => {
    expect(extractLateFee(sezzleFixture)).toBeCloseTo(0, 2);
  });

  test('throws error when Sezzle due date not found', () => {
    const email = 'From: hello@sezzle.com\nYour Sezzle payment\nNo date here';
    expect(() => extractDueDate(email, PROVIDER_PATTERNS.sezzle.datePatterns, 'America/New_York'))
      .toThrow('Due date not found');
  });

  test('throws error when Sezzle amount not found', () => {
    const email = 'From: hello@sezzle.com\nYour Sezzle payment\nNo amount here';
    expect(() => extractAmount(email, PROVIDER_PATTERNS.sezzle.amountPatterns))
      .toThrow('Amount not found');
  });

  test('does not detect Sezzle from other providers', () => {
    const klarnaEmail = 'From: noreply@klarna.com\nPayment due';
    expect(detectProvider(klarnaEmail)).toBe('Klarna');
  });
});
