import { describe, test, expect } from 'vitest';
import { calculateConfidence } from '../../src/lib/email-extractor';

describe('calculateConfidence', () => {
  test('all signals matched → 1.0 (High)', () => {
    const confidence = calculateConfidence({
      provider: true,
      date: true,
      amount: true,
      installment: true,
      autopay: true
    });
    expect(confidence).toBe(1.0);
  });

  test('autopay missing → 0.95 (High)', () => {
    const confidence = calculateConfidence({
      provider: true,
      date: true,
      amount: true,
      installment: true,
      autopay: false
    });
    expect(confidence).toBeCloseTo(0.95, 2);
  });

  test('installment + autopay missing → 0.8 (High boundary)', () => {
    const confidence = calculateConfidence({
      provider: true,
      date: true,
      amount: true,
      installment: false,
      autopay: false
    });
    expect(confidence).toBe(0.8);
  });

  test('amount missing → 0.8 (High boundary)', () => {
    const confidence = calculateConfidence({
      provider: true,
      date: true,
      amount: false,
      installment: true,
      autopay: true
    });
    expect(confidence).toBe(0.8);
  });

  test('only provider + date → 0.6 (Med boundary)', () => {
    const confidence = calculateConfidence({
      provider: true,
      date: true,
      amount: false,
      installment: false,
      autopay: false
    });
    expect(confidence).toBe(0.6);
  });

  test('only provider → 0.35 (Low)', () => {
    const confidence = calculateConfidence({
      provider: true,
      date: false,
      amount: false,
      installment: false,
      autopay: false
    });
    expect(confidence).toBe(0.35);
  });

  test('no signals → 0.0 (Low)', () => {
    const confidence = calculateConfidence({
      provider: false,
      date: false,
      amount: false,
      installment: false,
      autopay: false
    });
    expect(confidence).toBe(0.0);
  });
});
