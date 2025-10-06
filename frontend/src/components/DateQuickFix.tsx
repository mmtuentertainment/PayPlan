import { useState, useRef, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { DateLocale } from '../lib/date-parser';
import { reparseDate } from '../lib/extraction/helpers';

/**
 * DateQuickFix component - inline date correction UI for low-confidence rows
 *
 * Allows users to:
 * - Re-parse date with US locale (MM/DD/YYYY)
 * - Re-parse date with EU locale (DD/MM/YYYY)
 * - Manually enter date in ISO format (yyyy-MM-dd)
 * - Undo last fix (one-level)
 *
 * @param props.rowId - Unique identifier for the row
 * @param props.isoDate - Current date in ISO format (YYYY-MM-DD)
 * @param props.rawDueDate - Original date text from email (e.g., "01/02/2026")
 * @param props.timezone - IANA timezone for date parsing
 * @param props.onFix - Callback when date is fixed, receives new ISO date
 * @param props.onUndo - Callback when undo is triggered
 * @param props.locale - Current date locale preference
 */
export interface DateQuickFixProps {
  rowId: string;
  isoDate?: string;
  rawDueDate?: string;
  timezone: string;
  onFix: (dateISO: string) => void;
  onUndo: () => void;
  locale: DateLocale;
}

export function DateQuickFix({ rowId, rawDueDate, timezone, onFix, onUndo }: DateQuickFixProps) {
  const [manualDate, setManualDate] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showUndo, setShowUndo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const validateDate = (dateStr: string): string | null => {
    const dt = DateTime.fromISO(dateStr);
    if (!dt.isValid) return 'Invalid date format';

    const minDate = DateTime.fromISO('2020-01-01');
    const maxDate = DateTime.fromISO('2032-12-31');

    if (dt < minDate || dt > maxDate) {
      return 'Date must be between 2020-01-01 and 2032-12-31';
    }

    return null;
  };

  const handleManualFix = () => {
    const error = validateDate(manualDate);
    if (error) {
      setStatusMessage(error);
      inputRef.current?.focus();
      return;
    }

    onFix(manualDate);
    setManualDate('');
    setStatusMessage('Date updated');
    setShowUndo(true);
  };

  const handleReparse = (targetLocale: DateLocale) => {
    if (!rawDueDate) {
      setStatusMessage('No raw date text available for re-parsing');
      return;
    }

    try {
      const newIsoDate = reparseDate(rawDueDate, timezone, targetLocale);
      onFix(newIsoDate);
      setStatusMessage(`Re-parsed as ${targetLocale} locale`);
      setShowUndo(true);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Re-parse failed');
    }
  };

  const handleUndo = () => {
    onUndo();
    setStatusMessage('Undo applied');
    setShowUndo(false);
  };

  return (
    <div
      role="group"
      aria-labelledby={`date-fix-label-${rowId}`}
      className="flex flex-wrap items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded"
    >
      <span id={`date-fix-label-${rowId}`} className="text-sm font-medium text-yellow-800">
        Quick Fix:
      </span>

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleReparse('US')}
        aria-label="Re-parse as US date format"
      >
        Re-parse US
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleReparse('EU')}
        aria-label="Re-parse as EU date format"
      >
        Re-parse EU
      </Button>

      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="date"
          value={manualDate}
          onChange={(e) => setManualDate(e.target.value)}
          min="2020-01-01"
          max="2032-12-31"
          className="w-40 h-8 text-sm"
          aria-label="Manual date entry"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualFix}
          disabled={!manualDate}
          aria-label="Apply manual date"
        >
          Apply
        </Button>
      </div>

      {showUndo && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          aria-label="Undo last fix"
          className="text-blue-600 hover:text-blue-800"
        >
          Undo
        </Button>
      )}

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="text-sm text-gray-600 ml-2"
      >
        {statusMessage}
      </div>
    </div>
  );
}
