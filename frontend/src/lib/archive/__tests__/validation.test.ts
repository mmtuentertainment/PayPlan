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
  });
});
