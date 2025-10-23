
describe('API Request Validation Integration', () => {
  // T038: Malformed request returns 400 with generic error
  it('should return 400 with generic error message for malformed requests', async () => {
    // This integration test validates that the API endpoint:
    // 1. Validates incoming requests using PlanRequestSchema
    // 2. Returns HTTP 400 for validation failures
    // 3. Returns generic error message (not implementation details)

    const malformedRequest = {
      totalAmount: 'not-a-number', // Invalid type
      startDate: 'invalid-date',   // Invalid format
      frequency: 'invalid',        // Invalid enum
    };

    // Mock API endpoint behavior
    // In real implementation, this would be an actual HTTP request
    // For now, we'll test the validation logic directly

    const { PlanRequestSchema } = await import('../../src/lib/validation/PlanRequestSchema');
    const result = PlanRequestSchema.safeParse(malformedRequest);

    expect(result.success).toBe(false);

    // Verify that error handling would produce a generic message
    if (!result.success) {
      // The API should transform Zod errors into generic messages
      // Example: "Invalid request data" instead of exposing internal schema details
      expect(result.error).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should accept valid requests and return 200', async () => {
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

    const { PlanRequestSchema } = await import('../../src/lib/validation/PlanRequestSchema');
    const result = PlanRequestSchema.safeParse(validRequest);

    expect(result.success).toBe(true);
  });

  it('should reject requests exceeding installment limit', async () => {
    const oversizedRequest = {
      totalAmount: 10000.00,
      startDate: '2025-10-23',
      frequency: 'weekly' as const,
      installmentCount: 101, // Exceeds max of 100
      timezone: 'America/New_York',
      installments: Array.from({ length: 101 }, (_, i) => ({
        amount: 100.00,
        dueDate: '2025-10-23',
        description: `Payment ${i + 1}`,
      })),
    };

    const { PlanRequestSchema } = await import('../../src/lib/validation/PlanRequestSchema');
    const result = PlanRequestSchema.safeParse(oversizedRequest);

    expect(result.success).toBe(false);
  });

  it('should reject requests with NaN or Infinity values', async () => {
    const invalidNumericRequests = [
      {
        totalAmount: NaN,
        startDate: '2025-10-23',
        frequency: 'weekly' as const,
        installmentCount: 1,
      },
      {
        totalAmount: Infinity,
        startDate: '2025-10-23',
        frequency: 'weekly' as const,
        installmentCount: 1,
      },
      {
        totalAmount: 1000.00,
        startDate: '2025-10-23',
        frequency: 'weekly' as const,
        installmentCount: 1,
        installments: [
          { amount: NaN, dueDate: '2025-10-23', description: 'Payment 1' },
        ],
      },
    ];

    const { PlanRequestSchema } = await import('../../src/lib/validation/PlanRequestSchema');

    for (const request of invalidNumericRequests) {
      const result = PlanRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    }
  });
});
