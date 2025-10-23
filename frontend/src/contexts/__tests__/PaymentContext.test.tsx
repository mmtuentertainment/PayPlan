/**
 * PaymentContext Validation Tests
 *
 * Feature: 016-build-a-payment-archive
 * Purpose: Test Zod validation in PaymentContextProvider
 *
 * Tests PaymentContext.validatedSetPayments() catches invalid financial data
 * before it enters the system (security + data integrity).
 *
 * Mock data based on research:
 * - Faker.js finance API patterns
 * - Existing project tests (edge-cases-amounts, security-injection)
 * - Real BNPL providers (Klarna, Affirm, Afterpay)
 * - PaymentRecord type definition
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PaymentContextProvider, usePaymentContext } from '../PaymentContext';
import type { PaymentRecord } from '@/types/csvExport';

describe('PaymentContext Validation', () => {
  // Valid baseline payment (from existing test patterns)
  const validPayment: PaymentRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',  // Valid UUID v4
    provider: 'Klarna',                           // Real BNPL provider
    amount: 45.00,                                // Positive, 2 decimals
    currency: 'USD',                              // Valid ISO 4217
    dueISO: '2025-10-15',                        // Valid YYYY-MM-DD
    autopay: false,                               // Boolean
  };

  describe('Amount Validation', () => {
    it('should accept negative amounts (refunds)', () => {
      // The schema intentionally allows negative amounts for refund scenarios
      // See csvExportService.test.ts: "should handle negative amounts for refunds"
      const validPayments: PaymentRecord[] = [{
        ...validPayment,
        amount: -100.00,  // Negative for refund - VALID
      }];

      // Should NOT throw - refunds are allowed
      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(validPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).not.toThrow();
    });

    it('should accept zero amounts', () => {
      // Zero is a valid amount (edge case: $0 payment or fully refunded)
      const validPayments: PaymentRecord[] = [{
        ...validPayment,
        amount: 0.00,  // Zero - VALID
      }];

      // Should NOT throw
      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(validPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).not.toThrow();
    });

    it('should accept small amounts (0.01)', () => {
      // Based on edge-cases-amounts.test.ts:8-22 pattern
      const validPayments: PaymentRecord[] = [{
        ...validPayment,
        amount: 0.01,  // Very small but valid
      }];

      // Should NOT throw
      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(validPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).not.toThrow();
    });

    it('should accept large amounts (999999.99)', () => {
      // Based on edge-cases-amounts.test.ts:24-38 pattern
      const validPayments: PaymentRecord[] = [{
        ...validPayment,
        amount: 999999.99,  // Very large but valid
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(validPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).not.toThrow();
    });

    it('should reject amounts with more than 2 decimal places', () => {
      // CodeRabbit Phase C Fix: Decimal precision validation
      const invalidPayments: PaymentRecord[] = [{
        ...validPayment,
        amount: 45.001,  // 3 decimals - invalid
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(invalidPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).toThrow(/decimal|precision|2 decimal/i);
    });

    it('should accept amounts with exactly 2 decimal places', () => {
      // CodeRabbit Phase C Fix: Decimal precision validation
      const validPayments: PaymentRecord[] = [{
        ...validPayment,
        amount: 45.99,  // Exactly 2 decimals - valid
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(validPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Currency Validation', () => {
    it('should reject currency with 2 letters', () => {
      const invalidPayments: PaymentRecord[] = [{
        ...validPayment,
        currency: 'US',  // Only 2 chars (should be 3)
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(invalidPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).toThrow(/3.*letter|iso.*4217|currency/i);
    });

    it('should reject lowercase currency codes', () => {
      const invalidPayments: PaymentRecord[] = [{
        ...validPayment,
        currency: 'usd',  // Lowercase (should be uppercase per regex /^[A-Z]{3}$/)
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(invalidPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).toThrow(/[A-Z]|uppercase|currency/i);
    });

    it('should accept valid ISO 4217 currency codes', () => {
      // Common currency codes (Faker.js provides these via faker.finance.currencyCode())
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

      currencies.forEach(currency => {
        const validPayments: PaymentRecord[] = [{
          ...validPayment,
          currency,
        }];

        expect(() => {
          const TestComponent = () => {
            const { setPayments } = usePaymentContext();
            setPayments(validPayments);
            return null;
          };

          const mockSetPayments = vi.fn();
          render(
            <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
              <TestComponent />
            </PaymentContextProvider>
          );
        }).not.toThrow();
      });
    });
  });

  describe('Date Validation', () => {
    it('should reject invalid date format (missing day)', () => {
      const invalidPayments: PaymentRecord[] = [{
        ...validPayment,
        dueISO: '2025-10',  // Incomplete (YYYY-MM only)
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(invalidPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).toThrow(/YYYY-MM-DD|date.*format/i);
    });

    it('should reject non-date strings', () => {
      const invalidPayments: PaymentRecord[] = [{
        ...validPayment,
        dueISO: 'not-a-date',
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(invalidPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).toThrow(/YYYY-MM-DD|date/i);
    });

    it('should accept valid date formats', () => {
      const validDates = [
        '2025-01-01',  // Start of year
        '2025-12-31',  // End of year
        '2025-02-28',  // Non-leap year Feb
        '2024-02-29',  // Leap year Feb
      ];

      validDates.forEach(dueISO => {
        const validPayments: PaymentRecord[] = [{
          ...validPayment,
          dueISO,
        }];

        expect(() => {
          const TestComponent = () => {
            const { setPayments } = usePaymentContext();
            setPayments(validPayments);
            return null;
          };

          const mockSetPayments = vi.fn();
          render(
            <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
              <TestComponent />
            </PaymentContextProvider>
          );
        }).not.toThrow();
      });
    });
  });

  describe('UUID Validation', () => {
    it('should reject invalid UUID format', () => {
      const invalidPayments: PaymentRecord[] = [{
        ...validPayment,
        id: 'not-a-valid-uuid',  // Invalid format
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(invalidPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).toThrow(/uuid/i);
    });

    it('should accept valid UUID v4', () => {
      const validPayments: PaymentRecord[] = [{
        ...validPayment,
        id: '550e8400-e29b-41d4-a716-446655440000',  // Valid v4
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(validPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).not.toThrow();
    });

    it('should accept undefined ID (optional field)', () => {
      const validPayments: PaymentRecord[] = [{
        ...validPayment,
        id: undefined,  // ID is optional
      }];

      expect(() => {
        const TestComponent = () => {
          const { setPayments } = usePaymentContext();
          setPayments(validPayments);
          return null;
        };

        const mockSetPayments = vi.fn();
        render(
          <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
            <TestComponent />
          </PaymentContextProvider>
        );
      }).not.toThrow();
    });
  });

  describe('Provider Validation', () => {
    it('should accept real BNPL provider names', () => {
      // Based on project's existing provider patterns
      const providers = ['Klarna', 'Affirm', 'Afterpay', 'Sezzle', 'PayPal', 'Zip'];

      providers.forEach(provider => {
        const validPayments: PaymentRecord[] = [{
          ...validPayment,
          provider,
        }];

        expect(() => {
          const TestComponent = () => {
            const { setPayments } = usePaymentContext();
            setPayments(validPayments);
            return null;
          };

          const mockSetPayments = vi.fn();
          render(
            <PaymentContextProvider value={{ payments: [], setPayments: mockSetPayments }}>
              <TestComponent />
            </PaymentContextProvider>
          );
        }).not.toThrow();
      });
    });
  });
});
