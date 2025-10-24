/**
 * MaxDepthValidator Tests
 * Feature 018: Technical Debt Cleanup - User Story 3 (P2)
 *
 * Tests JSON depth validation to prevent DoS attacks via deeply nested
 * structures (FR-012, Tasks T062-T064).
 */

const { MaxDepthValidator } = require('../../src/lib/utils/MaxDepthValidator');

describe('MaxDepthValidator', () => {
  let validator: any;

  beforeEach(() => {
    validator = new MaxDepthValidator(10); // 10-level maximum per FR-012
  });

  describe('T062: counts depth correctly', () => {
    it('should count depth of flat object as 1', () => {
      const input = { a: 1, b: 2, c: 3 };
      expect(validator.getDepth(input)).toBe(1);
    });

    it('should count depth of nested object correctly', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      expect(validator.getDepth(input)).toBe(4);
    });

    it('should count depth of array as additional level', () => {
      const input = {
        arr: [
          {
            nested: 'value',
          },
        ],
      };
      // Object (1) -> arr (2) -> array element (3) -> nested object (4)
      expect(validator.getDepth(input)).toBe(3);
    });

    it('should handle multiple branches and return maximum depth', () => {
      const input = {
        shallow: { value: 1 }, // Depth 2
        deep: {
          // Depth 5
          level2: {
            level3: {
              level4: {
                value: 'deepest',
              },
            },
          },
        },
      };
      expect(validator.getDepth(input)).toBe(5);
    });

    it('should count depth of primitive as 0', () => {
      expect(validator.getDepth('string')).toBe(0);
      expect(validator.getDepth(123)).toBe(0);
      expect(validator.getDepth(true)).toBe(0);
      expect(validator.getDepth(null)).toBe(0);
    });

    it('should count depth of empty object as 1', () => {
      expect(validator.getDepth({})).toBe(1);
    });

    it('should count depth of empty array as 1', () => {
      expect(validator.getDepth([])).toBe(1);
    });

    it('should handle arrays of primitives', () => {
      const input = [1, 2, 3];
      expect(validator.getDepth(input)).toBe(1);
    });

    it('should handle arrays of objects', () => {
      const input = [{ a: 1 }, { b: 2 }];
      expect(validator.getDepth(input)).toBe(2); // Array (1) -> objects (2)
    });

    it('should count depth of nested arrays', () => {
      const input = [[[1]]];
      expect(validator.getDepth(input)).toBe(3);
    });
  });

  describe('T063: rejects >10 levels', () => {
    it('should reject object with depth 11', () => {
      const input = {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: {
                  l6: {
                    l7: {
                      l8: {
                        l9: {
                          l10: {
                            l11: 'too deep',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      expect(() => validator.validate(input)).toThrow('JSON depth exceeds maximum allowed depth');
      expect(() => validator.validate(input)).toThrow('11');
      expect(() => validator.validate(input)).toThrow('10');
    });

    it('should reject deeply nested array structures', () => {
      const input = [[[[[[[[[[[1]]]]]]]]]]]; // 11 levels
      expect(() => validator.validate(input)).toThrow('JSON depth exceeds maximum');
    });

    it('should reject mixed object and array nesting', () => {
      const input = {
        l1: [
          {
            l2: [
              {
                l3: [
                  {
                    l4: [
                      {
                        l5: [
                          {
                            l6: 'too deep',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(() => validator.validate(input)).toThrow('JSON depth exceeds maximum');
    });
  });

  describe('T064: accepts ≤10 levels', () => {
    it('should accept object with depth 10 (exactly at limit)', () => {
      const input = {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: {
                  l6: {
                    l7: {
                      l8: {
                        l9: {
                          l10: 'at limit',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      expect(() => validator.validate(input)).not.toThrow();
    });

    it('should accept shallow object with depth 1', () => {
      const input = { a: 1, b: 2 };
      expect(() => validator.validate(input)).not.toThrow();
    });

    it('should accept primitives', () => {
      expect(() => validator.validate('string')).not.toThrow();
      expect(() => validator.validate(123)).not.toThrow();
      expect(() => validator.validate(true)).not.toThrow();
      expect(() => validator.validate(null)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => validator.validate({})).not.toThrow();
    });

    it('should accept empty array', () => {
      expect(() => validator.validate([])).not.toThrow();
    });

    it('should accept array of depth 10', () => {
      const input = [[[[[[[[[[1]]]]]]]]]]; // 10 levels
      expect(() => validator.validate(input)).not.toThrow();
    });

    it('should accept complex structure within limit', () => {
      const input = {
        users: [
          {
            profile: {
              settings: {
                preferences: {
                  notifications: {
                    email: {
                      frequency: 'daily',
                    },
                  },
                },
              },
            },
          },
        ],
      };
      // Depth: users(1) -> array(2) -> profile(3) -> settings(4) -> preferences(5) -> notifications(6) -> email(7) -> frequency(8) = 8 levels
      expect(() => validator.validate(input)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined', () => {
      expect(() => validator.validate(undefined)).not.toThrow();
      expect(validator.getDepth(undefined)).toBe(0);
    });

    it('should detect circular references and throw controlled error (CodeRabbit)', () => {
      const input: any = { a: 1 };
      input.circular = input; // Create circular reference

      // Should throw controlled error, not stack overflow
      expect(() => validator.validate(input)).toThrow('Circular reference detected');
      expect(() => validator.validate(input)).not.toThrow(/Maximum call stack/);
    });

    it('should handle Date objects safely (CodeRabbit)', () => {
      const input = { timestamp: new Date(), value: 100 };
      expect(() => validator.validate(input)).not.toThrow();
      expect(validator.getDepth(input)).toBe(2);
    });

    it('should handle primitive Symbol values safely (CodeRabbit)', () => {
      const sym = Symbol('test');
      expect(() => validator.validate(sym)).not.toThrow();
      expect(validator.getDepth(sym)).toBe(0);
    });

    it('should handle BigInt values safely (CodeRabbit)', () => {
      const big = BigInt(999999999999);
      expect(() => validator.validate(big)).not.toThrow();
      expect(validator.getDepth(big)).toBe(0);
    });

    it('should provide clear error message with actual depth', () => {
      const input = {
        l1: { l2: { l3: { l4: { l5: { l6: { l7: { l8: { l9: { l10: { l11: 'x' } } } } } } } } } },
      };

      try {
        validator.validate(input);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('11'); // Actual depth
        expect(error.message).toContain('10'); // Max allowed
        expect(error.message).toContain('depth');
      }
    });

    it('should allow custom max depth in constructor', () => {
      const strictValidator = new MaxDepthValidator(5);
      const input = { l1: { l2: { l3: { l4: { l5: { l6: 'x' } } } } } }; // 6 levels

      expect(() => strictValidator.validate(input)).toThrow();

      const lenientInput = { l1: { l2: { l3: { l4: { l5: 'ok' } } } } }; // 5 levels
      expect(() => strictValidator.validate(lenientInput)).not.toThrow();
    });
  });
});
