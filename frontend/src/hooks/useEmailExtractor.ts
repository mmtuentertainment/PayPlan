import { useState, useCallback } from 'react';
import { extractItemsFromEmails } from '../lib/email-extractor';
import type { ExtractionResult, Item } from '../lib/email-extractor';

export function useEmailExtractor(timezone: string) {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [editableItems, setEditableItems] = useState<Item[]>([]);

  const extract = useCallback((emailText: string) => {
    if (!emailText.trim()) {
      setResult(null);
      setEditableItems([]);
      return;
    }

    setIsExtracting(true);

    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      try {
        const extracted = extractItemsFromEmails(emailText, timezone);
        setResult(extracted);
        setEditableItems(extracted.items);
      } catch (err) {
        setResult({
          items: [],
          issues: [{ snippet: '', reason: `Extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          duplicatesRemoved: 0
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
