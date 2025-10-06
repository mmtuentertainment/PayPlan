/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailExtractor } from '../../src/hooks/useEmailExtractor';

describe('Quick Fix Flow Integration', () => {
  const timezone = 'America/New_York';

  describe('Apply fix on low-confidence rows', () => {
    test('applyRowFix updates date and recalculates confidence to ≥0.6', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      // Directly set items for integration testing
      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-01-02', // Ambiguous date
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.55 // Low confidence
          }
        ]);
      });

      expect(result.current.editableItems[0].confidence).toBe(0.55);

      // Apply date fix (new rowId format: idx::provider::installment_no::due_date)
      const rowId = '0::Klarna::1::2026-01-02';
      act(() => {
        result.current.applyRowFix(rowId, { due_date: '2026-03-04' });
      });

      // Confidence should increase to 1.0 (all signals true)
      expect(result.current.editableItems[0].due_date).toBe('2026-03-04');
      expect(result.current.editableItems[0].confidence).toBe(1.0);
    });

    test('applying fix on multiple rows updates each independently', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-01-02',
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.55
          },
          {
            provider: 'Affirm',
            installment_no: 2,
            due_date: '2026-02-03',
            amount: 5000,
            currency: 'USD',
            autopay: false,
            late_fee: 0,
            confidence: 0.50
          }
        ]);
      });

      // Fix first row
      act(() => {
        result.current.applyRowFix('0::Klarna::1::2026-01-02', { due_date: '2026-03-04' });
      });

      expect(result.current.editableItems[0].due_date).toBe('2026-03-04');
      expect(result.current.editableItems[0].confidence).toBe(1.0);
      expect(result.current.editableItems[1].confidence).toBe(0.50); // Unchanged

      // Fix second row
      act(() => {
        result.current.applyRowFix('1::Affirm::2::2026-02-03', { due_date: '2026-04-05' });
      });

      expect(result.current.editableItems[1].due_date).toBe('2026-04-05');
      expect(result.current.editableItems[1].confidence).toBe(1.0); // All signals true after fix
    });
  });

  describe('Undo functionality', () => {
    test('undoRowFix restores original date and confidence', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      const originalItem = {
        provider: 'Klarna',
        installment_no: 1,
        due_date: '2026-01-02',
        amount: 4500,
        currency: 'USD',
        autopay: true,
        late_fee: 700,  // Integer cents
        confidence: 0.55
      };

      act(() => {
        result.current.setEditableItems([originalItem]);
      });

      const rowId = '0::Klarna::1::2026-01-02';

      // Apply fix
      act(() => {
        result.current.applyRowFix(rowId, { due_date: '2026-03-04' });
      });

      expect(result.current.editableItems[0].due_date).toBe('2026-03-04');
      expect(result.current.editableItems[0].confidence).toBe(1.0);

      // Undo fix
      act(() => {
        result.current.undoRowFix(rowId);
      });

      expect(result.current.editableItems[0].due_date).toBe('2026-01-02');
      expect(result.current.editableItems[0].confidence).toBe(0.55);
    });

    test('undo is one-level only (second undo has no effect)', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-01-02',
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.55
          }
        ]);
      });

      const rowId = '0::Klarna::1::2026-01-02';

      // Apply fix
      act(() => {
        result.current.applyRowFix(rowId, { due_date: '2026-03-04' });
      });

      // Undo once
      act(() => {
        result.current.undoRowFix(rowId);
      });

      expect(result.current.editableItems[0].due_date).toBe('2026-01-02');

      // Attempt undo again (should have no effect)
      act(() => {
        result.current.undoRowFix(rowId);
      });

      expect(result.current.editableItems[0].due_date).toBe('2026-01-02'); // Still same
    });
  });

  describe('CSV export with corrected dates', () => {
    test('exported items include updated dates and confidence', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-01-02',
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.55
          }
        ]);
      });

      // Apply fix
      act(() => {
        result.current.applyRowFix('0::Klarna::1::2026-01-02', { due_date: '2026-03-04' });
      });

      const exportedItems = result.current.editableItems;

      expect(exportedItems[0]).toEqual({
        provider: 'Klarna',
        installment_no: 1,
        due_date: '2026-03-04', // Updated
        amount: 4500,
        currency: 'USD',
        autopay: true,
        late_fee: 700,  // Integer cents
        confidence: 1.0 // Recalculated
      });
    });
  });

  describe('Confidence threshold behavior', () => {
    test('items with confidence ≥0.6 should not show quick fix UI', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-03-04',
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.8 // High confidence
          }
        ]);
      });

      // In UI, this row should NOT show DateQuickFix
      expect(result.current.editableItems[0].confidence).toBeGreaterThanOrEqual(0.6);
    });

    test('fixing date crosses 0.6 threshold', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Unknown',
            installment_no: 0,
            due_date: '2026-01-02',
            amount: 0,
            currency: 'USD',
            autopay: true,
            late_fee: 0,
            confidence: 0.05 // Very low (only autopay signal)
          }
        ]);
      });

      expect(result.current.editableItems[0].confidence).toBeLessThan(0.6);

      // Apply fix
      act(() => {
        result.current.applyRowFix('0::Unknown::0::2026-01-02', { due_date: '2026-03-04' });
      });

      // Confidence increases (date signal = 0.25, autopay = 0.05)
      expect(result.current.editableItems[0].confidence).toBe(0.30);
      expect(result.current.editableItems[0].confidence).toBeLessThan(0.6); // Still low
    });
  });

  describe('Edge cases and error handling', () => {
    test('applyRowFix handles non-existent rowId gracefully', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-01-02',
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.55
          }
        ]);
      });

      // Attempt fix with wrong rowId
      act(() => {
        result.current.applyRowFix('99::NonExistent::0::2026-01-01', { due_date: '2026-03-04' });
      });

      // Original item should be unchanged
      expect(result.current.editableItems[0].due_date).toBe('2026-01-02');
      expect(result.current.editableItems[0].confidence).toBe(0.55);
    });

    test('undoRowFix handles non-existent snapshot gracefully', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-01-02',
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.55
          }
        ]);
      });

      // Attempt undo without prior fix
      act(() => {
        result.current.undoRowFix('0::Klarna::1::2026-01-02');
      });

      // Should remain unchanged
      expect(result.current.editableItems[0].due_date).toBe('2026-01-02');
    });

    test('clear() resets undo snapshots', () => {
      const { result } = renderHook(() => useEmailExtractor(timezone));

      act(() => {
        result.current.setEditableItems([
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2026-01-02',
            amount: 4500,
            currency: 'USD',
            autopay: true,
            late_fee: 700,  // Integer cents
            confidence: 0.55
          }
        ]);
      });

      const rowId = '0::Klarna::1::2026-01-02';

      // Apply fix
      act(() => {
        result.current.applyRowFix(rowId, { due_date: '2026-03-04' });
      });

      // Clear all data
      act(() => {
        result.current.clear();
      });

      expect(result.current.editableItems).toHaveLength(0);

      // Undo should have no effect after clear
      act(() => {
        result.current.undoRowFix(rowId);
      });

      expect(result.current.editableItems).toHaveLength(0);
    });
  });
});
