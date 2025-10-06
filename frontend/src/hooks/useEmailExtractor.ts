import { useState, useCallback, useRef } from 'react';
import { extractItemsFromEmails } from '../lib/email-extractor';
import type { ExtractionResult, Item, ExtractOptions } from '../lib/email-extractor';
import type { DateLocale } from '../lib/date-parser';

/**
 * Sanitizes error messages to prevent information disclosure while preserving debugging context.
 * Removes absolute file paths and stack traces, but keeps error type and safe details.
 */
function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // Keep error message but remove absolute file paths
    const message = err.message.split('\n')[0]; // Take only first line
    // Remove absolute paths but keep relative context like "Invalid date: ..."
    const sanitized = message
      .replace(/\/[^\s]+\.(ts|js|tsx|jsx)/g, '') // Remove absolute file paths
      .replace(/\bat\b.*$/g, '') // Remove "at <location>" suffixes
      .trim();
    return sanitized || 'An error occurred during extraction';
  }
  return 'An unexpected error occurred';
}

export function useEmailExtractor(timezone: string) {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [editableItems, setEditableItems] = useState<Item[]>([]);
  const extractionIdRef = useRef(0);

  const extract = useCallback((emailText: string, dateLocale?: DateLocale) => {
    if (!emailText.trim()) {
      setResult(null);
      setEditableItems([]);
      return;
    }

    // Generate unique extraction ID to prevent race conditions
    const currentExtractionId = ++extractionIdRef.current;
    setIsExtracting(true);

    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      // Only update state if this is still the latest extraction
      if (currentExtractionId !== extractionIdRef.current) {
        return; // Stale extraction, ignore
      }

      try {
        const options: ExtractOptions = dateLocale ? { dateLocale } : {};
        const extracted = extractItemsFromEmails(emailText, timezone, options);
        setResult(extracted);
        setEditableItems(extracted.items);
      } catch (err: unknown) {
        setResult({
          items: [],
          issues: [{
            id: `error-${Date.now()}`,
            snippet: '',
            reason: `Extraction failed: ${sanitizeError(err)}`
          }],
          duplicatesRemoved: 0,
          dateLocale: dateLocale || 'US'
        });
        setEditableItems([]);
      } finally {
        setIsExtracting(false);
      }
    }, 0);
  }, [timezone]);

  const updateItem = useCallback((index: number, updates: Partial<Item>) => {
    setEditableItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const deleteItem = useCallback((index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setEditableItems([]);
  }, []);

  return {
    result,
    editableItems,
    isExtracting,
    extract,
    updateItem,
    deleteItem,
    clear
  };
}
