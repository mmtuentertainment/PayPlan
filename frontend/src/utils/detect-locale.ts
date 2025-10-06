import type { DateLocale } from '../lib/date-parser';

/**
 * Auto-detects the user's preferred date locale based on browser language and timezone.
 *
 * Detection priority:
 * 1. Browser language (navigator.language)
 * 2. Timezone heuristic (Europe/* only)
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

    // DD/MM/YYYY format locales (includes EU + Commonwealth + select African countries)
    // Note: Excludes Swiss German (de-ch) and Liechtenstein (de-li) which use DD.MM.YYYY with dots
    const ddmmFormatLocales = [
      'en-gb', 'en-ie', 'en-au', 'en-nz', 'en-za', 'en-in', 'en-my', 'en-sg', // English (Commonwealth)
      'de-de', 'de-at', // German (Germany, Austria) - excludes de-ch
      'fr', 'es', 'it', 'nl', 'pt', 'pl', 'sv', 'nb', 'nn', 'da', 'fi', // nb/nn = Norwegian Bokmål/Nynorsk (modern codes)
      'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'lt', 'lv', 'et',
      'el', 'tr', 'is', 'mt',
      'ar-eg', 'ar-ma', 'ar-tn', 'ar-dz' // Arabic (Egypt, Morocco, Tunisia, Algeria - DD/MM/YYYY)
    ];

    if (ddmmFormatLocales.some(locale => lang.startsWith(locale))) {
      return 'EU';
    }

    // Priority 2: Timezone heuristic (Europe only - conservative approach)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Europe/')) {
      return 'EU';
    }

    // Default: US (Americas, Asia, Africa, Oceania default to MM/DD/YYYY)
    return 'US';
  } catch (err: unknown) {
    // Fallback on any error
    console.warn('Failed to detect user locale, defaulting to US:', err);
    return 'US';
  }
}
