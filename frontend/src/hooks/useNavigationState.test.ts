/**
 * Navigation State Hook Tests
 * Feature: 017-navigation-system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigationState } from './useNavigationState';

describe('useNavigationState', () => {
  let originalBodyOverflow: string;

  beforeEach(() => {
    // Store original body overflow style
    originalBodyOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    // Restore original body overflow
    document.body.style.overflow = originalBodyOverflow;
  });

  it('initializes with menu closed', () => {
    const { result } = renderHook(() => useNavigationState());

    expect(result.current.mobileMenuOpen).toBe(false);
    expect(result.current.triggerElement).toBeNull();
  });

  it('opens mobile menu and locks body scroll', () => {
    const { result } = renderHook(() => useNavigationState());
    const mockTrigger = document.createElement('button');

    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });

    expect(result.current.mobileMenuOpen).toBe(true);
    expect(result.current.triggerElement).toBe(mockTrigger);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes mobile menu and unlocks body scroll', () => {
    const { result } = renderHook(() => useNavigationState());
    const mockTrigger = document.createElement('button');

    // Open menu first
    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });

    expect(document.body.style.overflow).toBe('hidden');

    // Close menu
    act(() => {
      result.current.closeMobileMenu();
    });

    expect(result.current.mobileMenuOpen).toBe(false);
    expect(result.current.triggerElement).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('returns focus to trigger element when closing menu', () => {
    const { result } = renderHook(() => useNavigationState());
    const mockTrigger = document.createElement('button');
    document.body.appendChild(mockTrigger);

    const focusSpy = vi.spyOn(mockTrigger, 'focus');

    // Open menu
    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });

    // Close menu
    act(() => {
      result.current.closeMobileMenu();
    });

    expect(focusSpy).toHaveBeenCalledTimes(1);

    // Cleanup
    document.body.removeChild(mockTrigger);
  });

  it('handles closing menu when trigger element is null', () => {
    const { result } = renderHook(() => useNavigationState());

    // Close menu without ever opening it (no trigger element)
    act(() => {
      result.current.closeMobileMenu();
    });

    expect(result.current.mobileMenuOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores body scroll on unmount', () => {
    const { result, unmount } = renderHook(() => useNavigationState());
    const mockTrigger = document.createElement('button');

    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });

    expect(document.body.style.overflow).toBe('hidden');

    // Unmount hook
    unmount();

    // Body scroll should be restored
    expect(document.body.style.overflow).toBe('');
  });

  it('can open and close menu multiple times', () => {
    const { result } = renderHook(() => useNavigationState());
    const mockTrigger = document.createElement('button');

    // Open/close cycle 1
    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });
    expect(result.current.mobileMenuOpen).toBe(true);

    act(() => {
      result.current.closeMobileMenu();
    });
    expect(result.current.mobileMenuOpen).toBe(false);

    // Open/close cycle 2
    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });
    expect(result.current.mobileMenuOpen).toBe(true);

    act(() => {
      result.current.closeMobileMenu();
    });
    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('updates trigger element when opening menu multiple times', () => {
    const { result } = renderHook(() => useNavigationState());
    const trigger1 = document.createElement('button');
    const trigger2 = document.createElement('button');

    act(() => {
      result.current.openMobileMenu(trigger1);
    });
    expect(result.current.triggerElement).toBe(trigger1);

    act(() => {
      result.current.closeMobileMenu();
    });

    act(() => {
      result.current.openMobileMenu(trigger2);
    });
    expect(result.current.triggerElement).toBe(trigger2);
  });

  it('handles calling openMobileMenu when menu is already open', () => {
    const { result } = renderHook(() => useNavigationState());
    const trigger1 = document.createElement('button');
    const trigger2 = document.createElement('button');
    document.body.appendChild(trigger1);
    document.body.appendChild(trigger2);

    // Open with first trigger
    act(() => {
      result.current.openMobileMenu(trigger1);
    });
    expect(result.current.mobileMenuOpen).toBe(true);
    expect(result.current.triggerElement).toBe(trigger1);

    // Open again with second trigger (while still open)
    act(() => {
      result.current.openMobileMenu(trigger2);
    });
    expect(result.current.mobileMenuOpen).toBe(true);
    expect(result.current.triggerElement).toBe(trigger2);

    // Cleanup
    document.body.removeChild(trigger1);
    document.body.removeChild(trigger2);
  });

  it('handles ESC key to close menu', () => {
    const { result } = renderHook(() => useNavigationState());
    const mockTrigger = document.createElement('button');
    document.body.appendChild(mockTrigger);

    // Open menu
    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });
    expect(result.current.mobileMenuOpen).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    // Simulate ESC key - the actual ESC handler is in MobileMenu component
    // This test verifies closeMobileMenu works correctly
    act(() => {
      result.current.closeMobileMenu();
    });

    expect(result.current.mobileMenuOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');

    // Cleanup
    document.body.removeChild(mockTrigger);
  });

  it('verifies focus returns to focusable trigger element', () => {
    const { result } = renderHook(() => useNavigationState());
    const mockTrigger = document.createElement('button');
    mockTrigger.tabIndex = 0; // Make focusable
    document.body.appendChild(mockTrigger);

    // Open menu
    act(() => {
      result.current.openMobileMenu(mockTrigger);
    });

    // Close menu
    act(() => {
      result.current.closeMobileMenu();
    });

    // Verify the trigger is focusable and received focus
    expect(mockTrigger.tabIndex).toBe(0);
    expect(document.activeElement).toBe(mockTrigger);

    // Cleanup
    document.body.removeChild(mockTrigger);
  });
});
