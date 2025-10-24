import { PlanRequestSchema } from '../../src/lib/validation/PlanRequestSchema';

describe('PlanRequestSchema', () => {
  // T035: Validates valid request
  it('should validate a valid plan request', () => {
    const validRequest = {
      totalAmount: 1000.00,
      startDate: '2025-10-23',
      frequency: 'weekly' as const,
      installmentCount: 4,
      timezone: 'America/New_York',
      installments: [
        { amount: 250.00, dueDate: '2025-10-23', description: 'Payment 1' },
        { amount: 250.00, dueDate: '2025-10-30', description: 'Payment 2' },
        { amount: 250.00, dueDate: '2025-11-06', description: 'Payment 3' },
        { amount: 250.00, dueDate: '2025-11-13', description: 'Payment 4' },
      ],
    };

    const result = PlanRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  // T036: Rejects malformed request
  it('should reject malformed requests', () => {
    const malformedRequests = [
      // Missing required fields
      {
        totalAmount: 1000.00,
        // missing startDate
        frequency: 'weekly',
        installmentCount: 4,
      },
      // Invalid frequency
      {
        totalAmount: 1000.00,
        startDate: '2025-10-23',
        frequency: 'invalid_frequency',
        installmentCount: 4,
      },
      // Invalid date format
      {
        totalAmount: 1000.00,
        startDate: 'not-a-date',
        frequency: 'weekly',
        installmentCount: 4,
      },
      // Invalid timezone format (no slash)
      {
        totalAmount: 1000.00,
        startDate: '2025-10-23',
        frequency: 'weekly',
        installmentCount: 4,
        timezone: 'InvalidTimezone',
      },
      // Negative installment count
      {
        totalAmount: 1000.00,
        startDate: '2025-10-23',
        frequency: 'weekly',
        installmentCount: -1,
      },
    ];

    malformedRequests.forEach((request) => {
      const result = PlanRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  // T037: Enforces max 100 installments
  it('should enforce maximum 100 installments', () => {
    const tooManyInstallments = {
      totalAmount: 10000.00,
      startDate: '2025-10-23',
      frequency: 'weekly' as const,
      installmentCount: 101,
      timezone: 'America/New_York',
      installments: Array.from({ length: 101 }, (_, i) => ({
        amount: 100.00,
        dueDate: '2025-10-23',
        description: `Payment ${i + 1}`,
      })),
    };

    const result = PlanRequestSchema.safeParse(tooManyInstallments);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue =>
        issue.message.includes('100') || issue.path.includes('installmentCount')
      )).toBe(true);
    }
  });

  it('should accept exactly 100 installments', () => {
    const maxInstallments = {
      totalAmount: 10000.00,
      startDate: '2025-10-23',
      frequency: 'weekly' as const,
      installmentCount: 100,
      timezone: 'America/New_York',
      installments: Array.from({ length: 100 }, (_, i) => ({
        amount: 100.00,
        dueDate: '2025-10-23',
        description: `Payment ${i + 1}`,
      })),
    };

    const result = PlanRequestSchema.safeParse(maxInstallments);
    expect(result.success).toBe(true);
  });

  it('should validate installment items schema', () => {
    const invalidInstallments = {
      totalAmount: 1000.00,
      startDate: '2025-10-23',
      frequency: 'weekly' as const,
      installmentCount: 2,
      timezone: 'America/New_York',
      installments: [
        { amount: 'not-a-number', dueDate: '2025-10-23', description: 'Payment 1' },
        { amount: 500.00, dueDate: 'invalid-date', description: 'Payment 2' },
      ],
    };

    const result = PlanRequestSchema.safeParse(invalidInstallments);
    expect(result.success).toBe(false);
  });

  it('should reject NaN in payment amounts', () => {
    const nanRequest = {
      totalAmount: NaN,
      startDate: '2025-10-23',
      frequency: 'weekly' as const,
      installmentCount: 1,
      timezone: 'America/New_York',
      installments: [
        { amount: 100.00, dueDate: '2025-10-23', description: 'Payment 1' },
      ],
    };

    const result = PlanRequestSchema.safeParse(nanRequest);
    expect(result.success).toBe(false);
  });
});
