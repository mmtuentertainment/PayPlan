/**
 * Archive Validation Unit Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 3 (User Story 1 - Create Archive MVP)
 * Task: T029
 *
 * Tests for archive validation functions.
 */

import { describe, it, expect } from 'vitest';
import { validateArchiveName } from '../validation';
import { MIN_NAME_LENGTH, MAX_NAME_LENGTH } from '../constants';

describe('Archive Validation', () => {
  describe('T029: validateArchiveName()', () => {
    it('should accept valid archive name', () => {
      const result = validateArchiveName('October 2025');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('October 2025');
      }
    });

    it('should trim whitespace and return trimmed name', () => {
      const result = validateArchiveName('  October 2025  ');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('October 2025');
      }
    });

    it('should reject empty string', () => {
      const result = validateArchiveName('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('at least');
        expect(result.error.message).toContain(String(MIN_NAME_LENGTH));
      }
    });

    it('should reject whitespace-only string', () => {
      const result = validateArchiveName('   ');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('at least');
      }
    });

    it('should reject string shorter than MIN_NAME_LENGTH after trimming', () => {
      const result = validateArchiveName('ab'); // Length 2, MIN is 3

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('at least');
      }
    });

    it('should accept string at exactly MIN_NAME_LENGTH', () => {
      const result = validateArchiveName('abc'); // Length 3

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('abc');
      }
    });

    it('should reject string longer than MAX_NAME_LENGTH', () => {
      const longName = 'a'.repeat(MAX_NAME_LENGTH + 1);
      const result = validateArchiveName(longName);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('under');
        expect(result.error.message).toContain(String(MAX_NAME_LENGTH));
      }
    });

    it('should accept string at exactly MAX_NAME_LENGTH', () => {
      const longName = 'a'.repeat(MAX_NAME_LENGTH);
      const result = validateArchiveName(longName);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(longName);
      }
    });

    it('should accept Unicode characters', () => {
      const result = validateArchiveName('十月 2025');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('十月 2025');
      }
    });

    it('should accept emoji', () => {
      const result = validateArchiveName('October 2025 💰');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('October 2025 💰');
      }
    });

    // CodeRabbit: XSS/Unicode Security Tests
    describe('XSS/HTML Injection Protection', () => {
      it('should accept HTML script tags as plain text (no sanitization)', () => {
        const result = validateArchiveName('<script>alert("xss")</script>');

        // Policy: Accept as-is, sanitization happens at render time
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('<script>alert("xss")</script>');
        }
      });

      it('should accept HTML img tags as plain text', () => {
        const result = validateArchiveName('<img src=x onerror="alert(1)">');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('<img src=x onerror="alert(1)">');
        }
      });

      it('should accept HTML entities as plain text', () => {
        const result = validateArchiveName('October &lt;2025&gt;');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('October &lt;2025&gt;');
        }
      });
    });

    describe('Special Characters', () => {
      it('should accept single quotes', () => {
        const result = validateArchiveName("October's Archive");

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe("October's Archive");
        }
      });

      it('should accept double quotes', () => {
        const result = validateArchiveName('The "October" Archive');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('The "October" Archive');
        }
      });

      it('should accept backslashes', () => {
        const result = validateArchiveName('Archive\\2025');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('Archive\\2025');
        }
      });

      it('should accept SQL-like strings as plain text', () => {
        const result = validateArchiveName("October'; DROP TABLE archives; --");

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe("October'; DROP TABLE archives; --");
        }
      });
    });

    describe('Complex Unicode Edge Cases', () => {
      it('should accept family emoji with ZWJ sequences', () => {
        const result = validateArchiveName('Family Archive 👨‍👩‍👧‍👦');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('Family Archive 👨‍👩‍👧‍👦');
        }
      });

      it('should accept zero-width characters', () => {
        const zeroWidth = 'Oct\u200Bober\u200C2025\uFEFF'; // U+200B, U+200C, U+FEFF

        const result = validateArchiveName(zeroWidth);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(zeroWidth.trim());
        }
      });

      it('should accept right-to-left text (Arabic)', () => {
        const result = validateArchiveName('أكتوبر 2025');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('أكتوبر 2025');
        }
      });

      it('should accept right-to-left text (Hebrew)', () => {
        const result = validateArchiveName('אוקטובר 2025');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('אוקטובר 2025');
        }
      });

      it('should accept mixed LTR/RTL (bidirectional text)', () => {
        const result = validateArchiveName('October أكتوبر 2025');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('October أكتوبر 2025');
        }
      });

      it('should accept emoji with skin tone modifiers', () => {
        const result = validateArchiveName('Archive 👍🏽👍🏻👍🏿');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('Archive 👍🏽👍🏻👍🏿');
        }
      });

      it('should accept combining diacritical marks', () => {
        const result = validateArchiveName('Café Février 2025'); // é with combining marks

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe('Café Février 2025');
        }
      });
    });
  });
});
