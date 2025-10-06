import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectUserLocale } from '../../src/utils/detect-locale';

describe('detectUserLocale', () => {
  let originalNavigator: Navigator;
  let originalIntl: typeof Intl;

  beforeEach(() => {
    originalNavigator = global.navigator;
    originalIntl = global.Intl;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.Intl = originalIntl;
  });

  describe('Browser language detection', () => {
    test('en-US → US locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-US' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('US');
    });

    test('en-GB → EU locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-GB' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/London' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });

    test('fr-FR → EU locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'fr-FR' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Paris' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });

    test('es-ES → EU locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'es-ES' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Madrid' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });
  });

  describe('Timezone heuristic fallback', () => {
    test('Europe/London timezone → EU locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-US' }, // US language but EU timezone
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/London' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });

    test('Europe/Berlin timezone → EU locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-US' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });

    test('Africa/Cairo with ar-EG → EU locale (Egyptian Arabic in ddmmFormatLocales)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'ar-EG' }, // Arabic Egypt - uses DD/MM/YYYY
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Africa/Cairo' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU'); // ar-eg is in ddmmFormatLocales (Priority 1)
    });

    test('Africa/Johannesburg → US locale (Africa/* removed, not in locale list)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'af-ZA' }, // Afrikaans - not in ddmmFormatLocales
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Africa/Johannesburg' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('US'); // af-ZA not in list, Africa/* heuristic removed
    });

    test('America/New_York timezone → US locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-CA' }, // Canadian English but US timezone
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('US');
    });

    test('Asia/Tokyo timezone → US locale (default for non-EU)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'ja-JP' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('US');
    });
  });

  describe('Fallback behavior', () => {
    test('SSR (no navigator) → US locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('US');
    });

    test('No Intl API → US locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-GB' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('US');
    });

    test('Error during detection → US locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-US' }, // US language to trigger timezone check
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => {
            throw new Error('Intl error');
          }
        },
        writable: true,
        configurable: true
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(detectUserLocale()).toBe('US');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to detect user locale'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Non-English EU locales', () => {
    test('pl-PL (Polish) → EU locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'pl-PL' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Warsaw' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });

    test('sv-SE (Swedish) → EU locale', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'sv-SE' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Stockholm' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });
  });

  describe('German locale variants (region-specific)', () => {
    test('de-DE (Germany) → EU locale (DD/MM/YYYY)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'de-DE' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });

    test('de-AT (Austria) → EU locale (DD/MM/YYYY)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'de-AT' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Vienna' }) })
        },
        writable: true,
        configurable: true
      });

      expect(detectUserLocale()).toBe('EU');
    });

    test('de-CH (Switzerland) → EU locale (Europe/Zurich timezone overrides language)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'de-CH' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Zurich' }) })
        },
        writable: true,
        configurable: true
      });

      // Swiss German uses DD.MM.YYYY (dots not slashes) so we don't match it as EU via language
      // However, Europe/Zurich timezone will trigger EU via Priority 2
      expect(detectUserLocale()).toBe('EU');
    });

    test('de-LI (Liechtenstein) → EU locale (Europe/Vaduz timezone overrides language)', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'de-LI' },
        writable: true,
        configurable: true
      });
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Vaduz' }) })
        },
        writable: true,
        configurable: true
      });

      // de-LI not in ddmmFormatLocales, but Europe/Vaduz triggers EU via Priority 2
      expect(detectUserLocale()).toBe('EU');
    });
  });
});
