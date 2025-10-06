import { useState, useCallback, useRef } from 'react';
import { extractItemsFromEmails } from '../lib/email-extractor';
import type { ExtractionResult, Item, ExtractOptions } from '../lib/email-extractor';
import type { DateLocale } from '../lib/date-parser';

/**
 * Sanitizes error messages to prevent information disclosure while preserving debugging context.
 * Removes absolute file paths and stack traces, but keeps error type and safe details.
 * Cross-platform: Handles both Unix (/) and Windows (\, C:\) path separators.
 */
function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // Keep error message but remove absolute file paths
    const message = err.message.split('\n')[0]; // Take only first line
    // Remove absolute paths but keep relative context like "Invalid date: ..."
    const sanitized = message
      // Match Windows absolute paths with spaces: C:\Program Files\app.ts or C:\path\file.ts
      .replace(/[A-Z]:\\(?:[^\\:*?"<>|\r\n]+\\)*[^\\:*?"<>|\r\n]+\.(ts|js|tsx|jsx|mjs|cjs|mts|cts)/gi, '')
      // Match Windows UNC paths with spaces: \\server\share\path\file.ts
      .replace(/\\\\(?:[^\\:*?"<>|\r\n]+\\)+[^\\:*?"<>|\r\n]+\.(ts|js|tsx|jsx|mjs|cjs|mts|cts)/gi, '')
      // Match Unix absolute paths: /home/user/path/file.ts (requires multiple path segments)
      .replace(/\/(?:[^/\r\n]+\/)+[^/\r\n]+\.(ts|js|tsx|jsx|mjs|cjs|mts|cts)/g, '')
      // Remove "at <location>" suffixes
      .replace(/\bat\b.*$/, '')
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
  const undoSnapshotsRef = useRef<Map<string, Item>>(new Map());

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
    undoSnapshotsRef.current.clear();
  }, []);

  /**
   * Apply a quick fix to a specific row (e.g., corrected due date).
   * Recomputes confidence based on the fixed data and updates Issues list.
   *
   * @param rowId - Unique identifier for the row (typically `provider-installment_no-due_date`)
   * @param patch - Partial item updates, typically { due_date: 'YYYY-MM-DD' }
   */
  const applyRowFix = useCallback((rowId: string, patch: { due_date: string }) => {
    setEditableItems(prev => {
      const index = prev.findIndex((item, idx) =>
        `${item.provider}-${item.installment_no}-${item.due_date}-${idx}` === rowId
      );

      if (index === -1) return prev;

      // Save snapshot for undo (one-level)
      undoSnapshotsRef.current.set(rowId, prev[index]);

      // Apply patch
      const updated = { ...prev[index], ...patch };

      // Recompute confidence: if due_date was fixed, assume date signal is now true
      const signals = {
        provider: updated.provider !== 'Unknown',
        date: true, // Fixed date is valid
        amount: updated.amount > 0,
        installment: updated.installment_no > 0,
        autopay: typeof updated.autopay === 'boolean'
      };

      // Import calculateConfidence function inline to avoid circular dependency
      const recalculatedConfidence = (
        (signals.provider ? 0.35 : 0) +
        (signals.date ? 0.25 : 0) +
        (signals.amount ? 0.20 : 0) +
        (signals.installment ? 0.15 : 0) +
        (signals.autopay ? 0.05 : 0)
      );

      updated.confidence = recalculatedConfidence;

      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []);

  /**
   * Undo the last fix applied to a specific row.
   * Restores the original item from the snapshot if available.
   *
   * @param rowId - Unique identifier for the row (uses original due_date before fix)
   */
  const undoRowFix = useCallback((rowId: string) => {
    const snapshot = undoSnapshotsRef.current.get(rowId);
    if (!snapshot) return;

    // Extract the index from the rowId (last part after final -)
    const parts = rowId.split('-');
    const index = parseInt(parts[parts.length - 1], 10);

    if (isNaN(index)) return;

    setEditableItems(prev => {
      if (index < 0 || index >= prev.length) return prev;

      const next = [...prev];
      next[index] = snapshot;
      return next;
    });

    // Clear snapshot after undo
    undoSnapshotsRef.current.delete(rowId);
  }, []);

  return {
    result,
    editableItems,
    isExtracting,
    extract,
    updateItem,
    deleteItem,
    clear,
    applyRowFix,
    undoRowFix,
    setEditableItems // Exposed for testing purposes
  };
}
