/**
 * Unit Test: usePaymentStatus Hook
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T033
 *
 * Tests the React hook for payment status management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaymentStatus } from '../../../src/hooks/usePaymentStatus';

describe('usePaymentStatus', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const validPaymentId = '550e8400-e29b-41d4-a716-446655440000';

  it('should provide markAsPaid function', () => {
    const { result } = renderHook(() => usePaymentStatus());

    expect(result.current.markAsPaid).toBeTypeOf('function');
  });

  it('should mark payment as paid', () => {
    const { result } = renderHook(() => usePaymentStatus());

    act(() => {
      result.current.markAsPaid(validPaymentId);
    });

    const status = result.current.getStatus(validPaymentId);
    expect(status.ok && status.value).toBe('paid');
  });

  it('should mark payment as pending', () => {
    const { result } = renderHook(() => usePaymentStatus());

    act(() => {
      result.current.markAsPaid(validPaymentId);
    });

    act(() => {
      result.current.markAsPending(validPaymentId);
    });

    const status = result.current.getStatus(validPaymentId);
    expect(status.ok && status.value).toBe('pending');
  });

  it('should toggle payment status', () => {
    const { result } = renderHook(() => usePaymentStatus());

    let toggleResult;
    act(() => {
      toggleResult = result.current.toggleStatus(validPaymentId);
    });

    expect(toggleResult.ok && toggleResult.value).toBe('paid');

    act(() => {
      toggleResult = result.current.toggleStatus(validPaymentId);
    });

    expect(toggleResult.ok && toggleResult.value).toBe('pending');
  });

  it('should get status with default pending', () => {
    const { result } = renderHook(() => usePaymentStatus());

    const status = result.current.getStatus(validPaymentId);
    expect(status.ok && status.value).toBe('pending');
  });

  it('should get status with timestamp', () => {
    const { result } = renderHook(() => usePaymentStatus());

    act(() => {
      result.current.markAsPaid(validPaymentId);
    });

    const record = result.current.getStatusWithTimestamp(validPaymentId);
    expect(record.ok).toBe(true);
    if (record.ok && record.value) {
      expect(record.value.status).toBe('paid');
      expect(record.value.timestamp).toBeTruthy();
    }
  });

  it('should return all statuses', () => {
    const { result } = renderHook(() => usePaymentStatus());

    act(() => {
      result.current.markAsPaid(validPaymentId);
    });

    const allStatuses = result.current.getAllStatuses();
    expect(allStatuses).toBeInstanceOf(Map);
    expect(allStatuses.size).toBeGreaterThan(0);
  });

  it('should have isLoading and error properties', () => {
    const { result } = renderHook(() => usePaymentStatus());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should sync across hook instances (simulating components)', () => {
    const { result: hook1 } = renderHook(() => usePaymentStatus());
    const { result: hook2 } = renderHook(() => usePaymentStatus());

    act(() => {
      hook1.current.markAsPaid(validPaymentId);
    });

    const status1 = hook1.current.getStatus(validPaymentId);
    const status2 = hook2.current.getStatus(validPaymentId);

    expect(status1.ok && status1.value).toBe('paid');
    expect(status2.ok && status2.value).toBe('paid');
  });
});
