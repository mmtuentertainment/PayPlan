/**
 * Contract tests for locale validation
 *
 * Feature: 012-user-preference-management
 * Task: T013
 * Contract: specs/012-user-preference-management/contracts/PreferenceValidationService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect } from 'vitest';
import {
  localeSchema,
  validatePreferenceValue,
} from '../../../src/lib/preferences/validation';
import { PreferenceCategory } from '../../../src/lib/preferences/types';

describe('Locale Validation', () => {
  // ============================================================================
  // Contract 1: Valid BCP 47 Language Tags
  // ============================================================================

  describe('Valid BCP 47 Language Tags', () => {
    it('should accept valid US English locale (en-US)', () => {
      const result = localeSchema.safeParse('en-US');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('en-US');
      }
    });

    it('should accept valid British English locale (en-GB)', () => {
      const result = localeSchema.safeParse('en-GB');
      expect(result.success).toBe(true);
    });

    it('should accept valid Spanish (Mexico) locale (es-MX)', () => {
      const result = localeSchema.safeParse('es-MX');
      expect(result.success).toBe(true);
    });

    it('should accept valid French (France) locale (fr-FR)', () => {
      const result = localeSchema.safeParse('fr-FR');
      expect(result.success).toBe(true);
    });

    it('should accept valid German (Germany) locale (de-DE)', () => {
      const result = localeSchema.safeParse('de-DE');
      expect(result.success).toBe(true);
    });

    it('should accept valid Chinese (China) locale (zh-CN)', () => {
      const result = localeSchema.safeParse('zh-CN');
      expect(result.success).toBe(true);
    });

    it('should accept valid Japanese locale (ja-JP)', () => {
      const result = localeSchema.safeParse('ja-JP');
      expect(result.success).toBe(true);
    });

    it('should accept language-only tag without region (en)', () => {
      const result = localeSchema.safeParse('en');
      expect(result.success).toBe(true);
    });

    it('should accept language-only tag without region (es)', () => {
      const result = localeSchema.safeParse('es');
      expect(result.success).toBe(true);
    });

    it('should accept language-only tag without region (fr)', () => {
      const result = localeSchema.safeParse('fr');
      expect(result.success).toBe(true);
    });

    it('should accept three-letter language code (fil-PH)', () => {
      const result = localeSchema.safeParse('fil'); // Filipino
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 2: Invalid BCP 47 Language Tags
  // ============================================================================

  describe('Invalid BCP 47 Language Tags', () => {
    it('should reject locale with only one character', () => {
      const result = localeSchema.safeParse('e');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject empty locale string', () => {
      const result = localeSchema.safeParse('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject locale with uppercase language code', () => {
      const result = localeSchema.safeParse('EN-US');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/BCP 47/i);
      }
    });

    it('should reject locale with lowercase region code', () => {
      const result = localeSchema.safeParse('en-us');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/BCP 47/i);
      }
    });

    it('should reject locale with underscore instead of hyphen', () => {
      const result = localeSchema.safeParse('en_US');

      expect(result.success).toBe(false);
    });

    it('should reject locale with numbers in language code', () => {
      const result = localeSchema.safeParse('e1-US');

      expect(result.success).toBe(false);
    });

    it('should reject locale with numbers in region code', () => {
      const result = localeSchema.safeParse('en-U5');

      expect(result.success).toBe(false);
    });

    it('should reject locale with special characters', () => {
      const result = localeSchema.safeParse('en-$%');

      expect(result.success).toBe(false);
    });

    it('should reject locale with too long language code (>3 chars)', () => {
      const result = localeSchema.safeParse('engl-US');

      expect(result.success).toBe(false);
    });

    it('should reject locale with too short region code (1 char)', () => {
      const result = localeSchema.safeParse('en-U');

      expect(result.success).toBe(false);
    });

    it('should reject locale with too long region code (>2 chars)', () => {
      const result = localeSchema.safeParse('en-USA');

      expect(result.success).toBe(false);
    });

    it('should reject locale with space', () => {
      const result = localeSchema.safeParse('en US');

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 3: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should reject null as locale', () => {
      const result = localeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined as locale', () => {
      const result = localeSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject number as locale', () => {
      const result = localeSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should reject object as locale', () => {
      const result = localeSchema.safeParse({ locale: 'en-US' });
      expect(result.success).toBe(false);
    });

    it('should reject array as locale', () => {
      const result = localeSchema.safeParse(['en-US']);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 4: validatePreferenceValue Helper
  // ============================================================================

  describe('validatePreferenceValue Helper', () => {
    it('should validate locale using helper', () => {
      const result = validatePreferenceValue(
        PreferenceCategory.Locale,
        'es-MX'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('es-MX');
      }
    });

    it('should reject invalid locale using helper', () => {
      const result = validatePreferenceValue(
        PreferenceCategory.Locale,
        'EN-US' // Uppercase language code
      );

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 5: Common World Locales
  // ============================================================================

  describe('Common World Locales', () => {
    it('should accept common English variants', () => {
      const englishVariants = [
        'en-US', // United States
        'en-GB', // United Kingdom
        'en-CA', // Canada
        'en-AU', // Australia
        'en-NZ', // New Zealand
        'en-IE', // Ireland
        'en-ZA', // South Africa
        'en-IN', // India
      ];

      englishVariants.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common Spanish variants', () => {
      const spanishVariants = [
        'es-ES', // Spain
        'es-MX', // Mexico
        'es-AR', // Argentina
        'es-CL', // Chile
        'es-CO', // Colombia
        'es-PE', // Peru
        'es-VE', // Venezuela
      ];

      spanishVariants.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common French variants', () => {
      const frenchVariants = [
        'fr-FR', // France
        'fr-CA', // Canada
        'fr-BE', // Belgium
        'fr-CH', // Switzerland
      ];

      frenchVariants.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common German variants', () => {
      const germanVariants = [
        'de-DE', // Germany
        'de-AT', // Austria
        'de-CH', // Switzerland
      ];

      germanVariants.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common Chinese variants', () => {
      const chineseVariants = [
        'zh-CN', // China (Simplified)
        'zh-TW', // Taiwan (Traditional)
        'zh-HK', // Hong Kong (Traditional)
      ];

      chineseVariants.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common Asian locales', () => {
      const asianLocales = [
        'ja-JP', // Japanese (Japan)
        'ko-KR', // Korean (South Korea)
        'th-TH', // Thai (Thailand)
        'vi-VN', // Vietnamese (Vietnam)
        'id-ID', // Indonesian (Indonesia)
        'ms-MY', // Malay (Malaysia)
      ];

      asianLocales.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common European locales', () => {
      const europeanLocales = [
        'it-IT', // Italian (Italy)
        'pt-PT', // Portuguese (Portugal)
        'pt-BR', // Portuguese (Brazil)
        'ru-RU', // Russian (Russia)
        'pl-PL', // Polish (Poland)
        'nl-NL', // Dutch (Netherlands)
        'sv-SE', // Swedish (Sweden)
        'no-NO', // Norwegian (Norway)
        'da-DK', // Danish (Denmark)
        'fi-FI', // Finnish (Finland)
      ];

      europeanLocales.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common Middle Eastern and African locales', () => {
      const middleEasternAfricanLocales = [
        'ar-SA', // Arabic (Saudi Arabia)
        'ar-EG', // Arabic (Egypt)
        'he-IL', // Hebrew (Israel)
        'tr-TR', // Turkish (Turkey)
        'fa-IR', // Persian (Iran)
        'sw-KE', // Swahili (Kenya)
      ];

      middleEasternAfricanLocales.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // Contract 6: Language-Only Tags (No Region)
  // ============================================================================

  describe('Language-Only Tags', () => {
    it('should accept two-letter language codes', () => {
      const languageCodes = [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko',
        'ar', 'hi', 'bn', 'pa', 'te', 'mr', 'ta', 'ur', 'gu', 'kn',
      ];

      languageCodes.forEach((lang) => {
        const result = localeSchema.safeParse(lang);
        expect(result.success).toBe(true);
      });
    });

    it('should accept three-letter language codes', () => {
      const threeletterCodes = [
        'fil', // Filipino
        'haw', // Hawaiian
        'nso', // Northern Sotho
      ];

      threeletterCodes.forEach((lang) => {
        const result = localeSchema.safeParse(lang);
        expect(result.success).toBe(true);
      });
    });

    it('should reject single-letter language code', () => {
      const result = localeSchema.safeParse('e');
      expect(result.success).toBe(false);
    });

    it('should reject four-letter language code', () => {
      const result = localeSchema.safeParse('engl');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 7: Performance Requirement (<1ms validation)
  // ============================================================================

  describe('Performance', () => {
    it('should validate locale in <1ms', () => {
      const startTime = performance.now();
      localeSchema.safeParse('en-US');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1);
    });

    it('should validate language-only tag in <1ms', () => {
      const startTime = performance.now();
      localeSchema.safeParse('en');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1);
    });
  });

  // ============================================================================
  // Contract 8: Error Message Clarity
  // ============================================================================

  describe('Error Messages', () => {
    it('should provide clear error for too short locale', () => {
      const result = localeSchema.safeParse('e');

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toContain('at least 2 characters');
      }
    });

    it('should provide clear error for invalid format', () => {
      const result = localeSchema.safeParse('EN-US');

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/BCP 47/i);
        expect(errorMessage).toContain('en-US');
        expect(errorMessage).toContain('es-MX');
      }
    });

    it('should provide clear error for underscore format', () => {
      const result = localeSchema.safeParse('en_US');

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/BCP 47/i);
      }
    });

    it('should provide clear error for invalid characters', () => {
      const result = localeSchema.safeParse('en-U$');

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/BCP 47/i);
      }
    });
  });

  // ============================================================================
  // Contract 9: BCP 47 Compliance
  // ============================================================================

  describe('BCP 47 Compliance', () => {
    it('should enforce lowercase language code', () => {
      const invalidCases = ['EN-US', 'En-US', 'eN-US'];

      invalidCases.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(false);
      });
    });

    it('should enforce uppercase region code', () => {
      const invalidCases = ['en-us', 'en-Us', 'en-uS'];

      invalidCases.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(false);
      });
    });

    it('should enforce hyphen separator (not underscore)', () => {
      const result = localeSchema.safeParse('en_US');
      expect(result.success).toBe(false);
    });

    it('should enforce 2-letter language code (primary)', () => {
      const validTwoLetter = ['en', 'es', 'fr', 'de'];

      validTwoLetter.forEach((lang) => {
        const result = localeSchema.safeParse(lang);
        expect(result.success).toBe(true);
      });
    });

    it('should accept 3-letter language code (extended)', () => {
      const validThreeLetter = ['fil', 'haw'];

      validThreeLetter.forEach((lang) => {
        const result = localeSchema.safeParse(lang);
        expect(result.success).toBe(true);
      });
    });

    it('should enforce 2-letter region code', () => {
      const validRegions = ['en-US', 'en-GB', 'es-MX', 'fr-CA'];

      validRegions.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // Contract 10: Integration with Browser Locale APIs
  // ============================================================================

  describe('Browser Locale API Compatibility', () => {
    it('should accept navigator.language format', () => {
      // navigator.language returns BCP 47 tags like 'en-US'
      const browserLocales = ['en-US', 'en-GB', 'es-MX', 'fr-FR'];

      browserLocales.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should accept Intl.Locale compatible strings', () => {
      // Intl.Locale accepts BCP 47 language tags
      const intlLocales = ['en-US', 'zh-CN', 'ar-SA'];

      intlLocales.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(true);
      });
    });

    it('should reject Java/Android locale format (underscore)', () => {
      // Java/Android uses underscores: en_US
      const javaLocales = ['en_US', 'es_MX', 'fr_FR'];

      javaLocales.forEach((locale) => {
        const result = localeSchema.safeParse(locale);
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // Contract 11: Special Cases
  // ============================================================================

  describe('Special Cases', () => {
    it('should accept neutral language tags', () => {
      const neutralTags = ['en', 'es', 'fr', 'de', 'zh', 'ja'];

      neutralTags.forEach((tag) => {
        const result = localeSchema.safeParse(tag);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty string', () => {
      const result = localeSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only string', () => {
      const result = localeSchema.safeParse('   ');
      expect(result.success).toBe(false);
    });

    it('should reject locale with trailing whitespace', () => {
      const result = localeSchema.safeParse('en-US ');
      expect(result.success).toBe(false);
    });

    it('should reject locale with leading whitespace', () => {
      const result = localeSchema.safeParse(' en-US');
      expect(result.success).toBe(false);
    });
  });
});
