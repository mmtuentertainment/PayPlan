import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { DateLocale } from '../lib/date-parser';

interface LocaleToggleProps {
  locale: DateLocale;
  onLocaleChange: (locale: DateLocale) => void;
  onReExtract: () => void;
  hasExtractedData: boolean;
  isExtracting: boolean;
}

/**
 * Date locale toggle component for US/EU format selection.
 * Allows users to switch between MM/DD/YYYY (US) and DD/MM/YYYY (EU) date formats.
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
  isExtracting
}: LocaleToggleProps) {
  const handleReExtract = () => {
    if (hasExtractedData) {
      const confirmed = window.confirm(
        'Re-extracting will discard all Quick Fixes. Continue?'
      );
      if (!confirmed) return;
    }
    onReExtract();
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border">
      <Label className="text-sm font-medium">Date Format:</Label>
      <RadioGroup
        value={locale}
        onValueChange={(value) => onLocaleChange(value as DateLocale)}
        className="flex gap-4"
        disabled={isExtracting}
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
      {hasExtractedData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReExtract}
          disabled={isExtracting}
        >
          Re-extract with new format
        </Button>
      )}
    </div>
  );
}
