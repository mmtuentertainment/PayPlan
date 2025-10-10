import { useState, useCallback, useRef } from 'react';
import { extractItemsFromEmails } from '../lib/email-extractor';
import type { ExtractionResult, Item, ExtractOptions } from '../lib/email-extractor';
import type { DateLocale } from '../lib/extraction/extractors/date';
import { sanitizeError } from '../lib/extraction/helpers/error-sanitizer';
import { calculateItemConfidence } from '../lib/extraction/helpers/confidence-calculator';

/**
 * React hook for extracting payment items from BNPL reminder emails.
 *
 * Provides stateful email extraction with CRUD operations on extracted items,
 * success messaging, and one-level undo for quick fixes.
 *
 * @param timezone - IANA timezone string for date parsing (e.g., "America/New_York")
 * @returns Hook interface with extraction state and operations
 *
 * @example
 * ```tsx
 * function EmailInputForm() {
 *   const { extract, editableItems, isExtracting, applyRowFix, undoRowFix } = useEmailExtractor('America/New_York');
 *
 *   const handlePaste = (emailText: string) => {
 *     extract(emailText, 'US'); // Extract with US date locale
 *   };
 *
 *   const handleQuickFix = (rowId: string, newDate: string) => {
 *     applyRowFix(rowId, { due_date: newDate });
 *   };
 *
 *   return <EmailInput onPaste={handlePaste} items={editableItems} />;
 * }
 * ```
 */
export function useEmailExtractor(timezone: string) {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [editableItems, setEditableItems] = useState<Item[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

        // Set success message with count
        const itemCount = extracted.items.length;
        if (itemCount > 0) {
          setSuccessMessage(`Found ${itemCount} payment${itemCount === 1 ? '' : 's'}`);
        }
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
   * @param rowId - Unique UUID identifier for the row (stable across updates)
   * @param patch - Partial item updates, typically { due_date: 'YYYY-MM-DD' }
   */
  const applyRowFix = useCallback((rowId: string, patch: { due_date: string }) => {
    setEditableItems(prev => {
      // Find item by UUID (stable identifier)
      const index = prev.findIndex((item) => item.id === rowId);

      if (index === -1) return prev;

      // Save snapshot for undo (one-level)
      undoSnapshotsRef.current.set(rowId, prev[index]);

      // Apply patch
      const updated = { ...prev[index], ...patch };

      // Recompute confidence after applying fix
      updated.confidence = calculateItemConfidence(updated);

      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []);

  /**
   * Undo the last fix applied to a specific row.
   * Restores the original item from the snapshot if available.
   *
   * @param rowId - Unique UUID identifier for the row (stable across updates)
   */
  const undoRowFix = useCallback((rowId: string) => {
    const snapshot = undoSnapshotsRef.current.get(rowId);
    if (!snapshot) return;

    setEditableItems(prev => {
      // Find item by UUID (stable identifier)
      const index = prev.findIndex((item) => item.id === rowId);

      if (index === -1) return prev;

      const next = [...prev];
      next[index] = snapshot;
      return next;
    });

    // Clear snapshot after undo
    undoSnapshotsRef.current.delete(rowId);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    result,
    editableItems,
    isExtracting,
    successMessage,
    extract,
    updateItem,
    deleteItem,
    clear,
    applyRowFix,
    undoRowFix,
    clearSuccessMessage,
    setEditableItems // Exposed for testing purposes
  };
}
