import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import type { DateLocale } from '../lib/extraction/extractors/date';

interface LocaleToggleProps {
  locale: DateLocale;
  onLocaleChange: (locale: DateLocale) => void;
  onReExtract: () => void;
  hasExtractedData: boolean;
  isExtracting: boolean;
  extractionError?: string; // Error message from last re-extraction attempt
}

/**
 * Date locale toggle component for US/EU format selection.
 * Allows users to switch between MM/DD/YYYY (US) and DD/MM/YYYY (EU) date formats.
 *
 * **Financial Impact Warning:**
 * Changing locale can alter date interpretation (e.g., "01/02/2026" changes from Jan 2 to Feb 1),
 * which may resequence payment due dates and affect payment ordering.
 *
 * @component
 * @example
 * <LocaleToggle
 *   locale="US"
 *   onLocaleChange={setLocale}
 *   onReExtract={handleReExtract}
 *   hasExtractedData={true}
 *   isExtracting={false}
 * />
 */
export function LocaleToggle({
  locale,
  onLocaleChange,
  onReExtract,
  hasExtractedData,
  isExtracting,
  extractionError
}: LocaleToggleProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirmReExtract = () => {
    setDialogOpen(false);
    onReExtract();
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border">
      <Label className="text-sm font-medium">Date Format:</Label>
      <RadioGroup
        value={locale}
        onValueChange={(value) => {
          // Type-safe validation before casting
          if (value === 'US' || value === 'EU') {
            onLocaleChange(value);
          } else {
            console.error(`Invalid locale value: ${value}`);
          }
        }}
        className="flex gap-4"
        disabled={isExtracting}
        aria-label="Date format locale"
        aria-describedby="locale-impact-warning"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="US" id="locale-us" />
          <Label htmlFor="locale-us" className="text-sm font-normal cursor-pointer">
            US (MM/DD/YYYY)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="EU" id="locale-eu" />
          <Label htmlFor="locale-eu" className="text-sm font-normal cursor-pointer">
            EU (DD/MM/YYYY)
          </Label>
        </div>
      </RadioGroup>

      {/* Visually hidden financial impact warning for screen readers */}
      <span id="locale-impact-warning" className="sr-only">
        Changing date format may alter payment due dates and ordering
      </span>

      {hasExtractedData && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExtracting}
            >
              Re-extract with new format
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change date format?</AlertDialogTitle>
              <AlertDialogDescription>
                Switching to {locale === 'US' ? 'EU (DD/MM/YYYY)' : 'US (MM/DD/YYYY)'} may change due dates and payment ordering.
                For example, "01/02/2026" will be interpreted as {locale === 'US' ? 'February 1, 2026' : 'January 2, 2026'} instead of {locale === 'US' ? 'January 2, 2026' : 'February 1, 2026'}.
                This action will discard any Quick Fixes you've applied.

                {extractionError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ Previous re-extraction failed: {extractionError}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep current format</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReExtract}>
                Re-extract with new format
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
