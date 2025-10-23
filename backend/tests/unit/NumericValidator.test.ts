const { PaymentAmountSchema, FiniteNumberSchema } = require('../../src/lib/validation/NumericValidator');

describe('NumericValidator', () => {
  describe('PaymentAmountSchema', () => {
    // T028: Rejects NaN
    it('should reject NaN values', () => {
      const result = PaymentAmountSchema.safeParse(NaN);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('finite');
      }
    });

    // T029: Rejects Infinity
    it('should reject Infinity values', () => {
      const positiveInfinity = PaymentAmountSchema.safeParse(Infinity);
      expect(positiveInfinity.success).toBe(false);

      const negativeInfinity = PaymentAmountSchema.safeParse(-Infinity);
      expect(negativeInfinity.success).toBe(false);

      if (!positiveInfinity.success) {
        expect(positiveInfinity.error.issues[0].message).toContain('finite');
      }
    });

    // T030: Accepts negative as refund
    it('should accept negative values as refunds', () => {
      const result = PaymentAmountSchema.safeParse(-100.50);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(-100.50);
      }
    });

    // T031: Rejects zero
    it('should reject zero values', () => {
      const result = PaymentAmountSchema.safeParse(0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('zero');
      }
    });

    it('should accept valid positive payment amounts', () => {
      const result = PaymentAmountSchema.safeParse(123.45);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(123.45);
      }
    });

    it('should reject non-numeric values', () => {
      const result = PaymentAmountSchema.safeParse('not a number');
      expect(result.success).toBe(false);
    });
  });

  describe('FiniteNumberSchema', () => {
    it('should reject NaN', () => {
      const result = FiniteNumberSchema.safeParse(NaN);
      expect(result.success).toBe(false);
    });

    it('should reject Infinity', () => {
      const posInf = FiniteNumberSchema.safeParse(Infinity);
      const negInf = FiniteNumberSchema.safeParse(-Infinity);
      expect(posInf.success).toBe(false);
      expect(negInf.success).toBe(false);
    });

    it('should accept finite numbers including zero', () => {
      expect(FiniteNumberSchema.safeParse(0).success).toBe(true);
      expect(FiniteNumberSchema.safeParse(100).success).toBe(true);
      expect(FiniteNumberSchema.safeParse(-50).success).toBe(true);
      expect(FiniteNumberSchema.safeParse(0.001).success).toBe(true);
    });
  });
});
