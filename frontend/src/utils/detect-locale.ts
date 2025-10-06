import type { DateLocale } from '../lib/date-parser';

/**
 * Auto-detects the user's preferred date locale based on browser language and timezone.
 *
 * Detection priority:
 * 1. Browser language (navigator.language)
 * 2. Timezone heuristic (Europe/*, Africa/*)
 * 3. Fallback to 'US'
 *
 * **User Override:**
 * This is a default preference. Users can override via the LocaleToggle component.
 *
 * **Financial Impact:**
 * Auto-detection aims to prevent ambiguous date misinterpretation for international users.
 * For example, a UK user seeing "01/02/2026" expects Feb 1, not Jan 2.
 *
 * @returns 'US' or 'EU' locale based on user context
 * @example
 * // UK user (en-GB)
 * detectUserLocale() // Returns: 'EU'
 *
 * @example
 * // US user (en-US)
 * detectUserLocale() // Returns: 'US'
 */
export function detectUserLocale(): DateLocale {
  // Server-side rendering fallback
  if (typeof navigator === 'undefined' || typeof Intl === 'undefined') {
    return 'US';
  }

  try {
    // Priority 1: Browser language (navigator.language)
    const lang = navigator.language.toLowerCase();

    // EU locales: British English, German, French, Spanish, Italian, Dutch, Portuguese, Polish, Swedish, Norwegian, Danish, Finnish
    const euLocales = [
      'en-gb', 'en-ie', 'en-au', 'en-nz', // English (non-US)
      'de', 'fr', 'es', 'it', 'nl', 'pt', 'pl', 'sv', 'no', 'da', 'fi',
      'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'lt', 'lv', 'et',
      'el', 'tr', 'is', 'mt'
    ];

    if (euLocales.some(locale => lang.startsWith(locale))) {
      return 'EU';
    }

    // Priority 2: Timezone heuristic
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Europe/') || tz.startsWith('Africa/')) {
      return 'EU';
    }

    // Default: US (Americas, Asia, Oceania default to MM/DD/YYYY)
    return 'US';
  } catch (err) {
    // Fallback on any error
    console.warn('Failed to detect user locale, defaulting to US:', err);
    return 'US';
  }
}
