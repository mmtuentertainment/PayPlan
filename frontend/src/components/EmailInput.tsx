import { useState, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { SAMPLE_EMAILS } from '../lib/sample-emails';
import { LocaleToggle } from './LocaleToggle';
import type { DateLocale } from '../lib/extraction/extractors/date';
import { detectUserLocale } from '../utils/detect-locale';
import { PreferenceToggle } from './preferences/PreferenceToggle';
import { InlineStatusIndicator } from './preferences/InlineStatusIndicator';
import { PreferenceCategory } from '../lib/preferences/types';
import { usePreferences } from '../hooks/usePreferences';
import { z } from 'zod';

// Zod schema for DateLocale validation
const dateLocaleSchema = z.enum(['US', 'EU']);

interface EmailInputProps {
  onExtract: (text: string, locale: DateLocale) => void;
  isExtracting: boolean;
  hasExtractedData: boolean;
}

export function EmailInput({ onExtract, isExtracting, hasExtractedData }: EmailInputProps) {
  const [text, setText] = useState('');
  const [dateLocale, setDateLocale] = useState<DateLocale>(() => detectUserLocale());
  const maxChars = 16000;

  // Integrate preferences
  const { preferences, updatePreference } = usePreferences();
  const localePreference = preferences.get(PreferenceCategory.Locale);
  const [localeRestored, setLocaleRestored] = useState(false);

  // Restore locale preference on mount (if opted-in)
  useEffect(() => {
    if (!localeRestored && localePreference && localePreference.optInStatus && localePreference.value) {
      // Validate the saved locale value with Zod
      const validation = dateLocaleSchema.safeParse(localePreference.value);
      if (validation.success) {
        setDateLocale(validation.data);
        setLocaleRestored(true);
      } else {
        // Invalid locale value in storage - log and fall back to defaults
        console.warn('Invalid locale preference value:', localePreference.value, validation.error);
        // Optionally clear the corrupted preference
        updatePreference(PreferenceCategory.Locale, detectUserLocale(), false);
      }
    }
  }, [localePreference, localeRestored, updatePreference]);

  const handleUseSample = () => {
    setText(SAMPLE_EMAILS);
  };

  const handleExtract = () => {
    if (text.trim()) {
      onExtract(text, dateLocale);
    }
  };

  const handleReExtract = () => {
    handleExtract();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExtract();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label htmlFor="email-input" className="text-sm font-medium">
          Paste BNPL Payment Emails
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseSample}
          disabled={isExtracting}
          aria-label="Fill textarea with sample BNPL payment emails for testing"
        >
          Use Sample Emails
        </Button>
      </div>

      <div className="space-y-3">
        <LocaleToggle
          locale={dateLocale}
          onLocaleChange={(newLocale) => {
            setDateLocale(newLocale);
            setLocaleRestored(false); // Clear restored state when user manually changes
            // Update preference if opted-in
            if (localePreference?.optInStatus) {
              updatePreference(PreferenceCategory.Locale, newLocale, true);
            }
          }}
          onReExtract={handleReExtract}
          hasExtractedData={hasExtractedData}
          isExtracting={isExtracting}
        />

        <div className="flex items-center gap-3 px-3">
          <PreferenceToggle
            category={PreferenceCategory.Locale}
            optInStatus={localePreference?.optInStatus ?? false}
            onChange={(optIn) => {
              updatePreference(PreferenceCategory.Locale, dateLocale, optIn);
            }}
            disabled={isExtracting}
          />
          {localeRestored && (
            <InlineStatusIndicator
              category={PreferenceCategory.Locale}
              restored={true}
            />
          )}
        </div>
      </div>

      <Textarea
        id="email-input"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxChars))}
        onKeyDown={handleKeyDown}
        placeholder="Paste your BNPL payment reminder emails here..."
        className="min-h-[400px] font-mono text-sm"
        aria-label="Paste BNPL payment emails"
        disabled={isExtracting}
      />

      <div className="flex justify-between text-sm text-gray-500">
        <span>Tip: Press Cmd/Ctrl+Enter to extract</span>
        <span>{text.length} / {maxChars} chars</span>
      </div>

      <Button
        onClick={handleExtract}
        disabled={!text.trim() || isExtracting}
        className="w-full"
        aria-busy={isExtracting}
      >
        {isExtracting ? 'Extracting...' : 'Extract Payments'}
      </Button>
      {isExtracting && (
        <span className="sr-only" aria-live="polite">
          Extracting payment information from emails...
        </span>
      )}
    </div>
  );
}
