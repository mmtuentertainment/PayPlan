/**
 * Integration tests for privacy-safe telemetry
 *
 * Covers:
 * 1. DNT respected
 * 2. Consent flow (banner interaction)
 * 3. csv_error emission
 * 4. csv_usage sampling (≤10%)
 * 5. No content leakage
 * 6. Banner accessibility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TelemetryConsentBanner } from '@/components/TelemetryConsentBanner';
import * as telemetry from '@/lib/telemetry';

// ============================================================================
// SETUP & HELPERS
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock screen for sampling
Object.defineProperty(global, 'screen', {
  value: { width: 1920, height: 1080 },
  writable: true,
  configurable: true,
});

// Transport spy to capture telemetry events
let capturedEvents: unknown[] = [];

function setupTransportSpy() {
  capturedEvents = [];
  telemetry.__setTransport((payload) => {
    capturedEvents.push(payload);
  });
}

function resetTransportSpy() {
  capturedEvents = [];
  telemetry.__setTransport(() => {}); // Reset to NO-OP
}

// ============================================================================
// TEST SUITE 1: DNT RESPECTED
// ============================================================================

describe('Telemetry - DNT Respected', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setupTransportSpy();
  });

  afterEach(() => {
    resetTransportSpy();
    // Reset DNT
    Object.defineProperty(navigator, 'doNotTrack', { value: undefined, configurable: true });
  });

  it('should hide banner when DNT=1', () => {
    // Set DNT
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });

    render(<TelemetryConsentBanner />);

    // Banner should not be visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not emit events when DNT=1 even with consent', () => {
    // Set DNT
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });

    // Try to set consent
    telemetry.setConsent('opt_in');

    // Try to emit error event
    telemetry.error({ phase: 'size', size_bucket: '≤100KB' });

    // No events should be captured
    expect(capturedEvents).toHaveLength(0);
  });

  it('should detect DNT from multiple sources', () => {
    // Test navigator.doNotTrack
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    expect(telemetry.isDNT()).toBe(true);

    // Reset
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true });

    // Test navigator.msDoNotTrack
    Object.defineProperty(navigator, 'msDoNotTrack', { value: '1', configurable: true });
    expect(telemetry.isDNT()).toBe(true);

    // Reset
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true });

    // Test window.doNotTrack
    Object.defineProperty(window, 'doNotTrack', { value: '1', configurable: true });
    expect(telemetry.isDNT()).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 2: CONSENT FLOW
// ============================================================================

describe('Telemetry - Consent Flow', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setupTransportSpy();
    // Ensure DNT is not active
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true, writable: true });
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'doNotTrack', { value: undefined, configurable: true, writable: true });
  });

  afterEach(() => {
    resetTransportSpy();
  });

  it('should show banner when consent is unset and DNT=0', () => {
    render(<TelemetryConsentBanner />);

    // Banner should be visible with proper role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'telemetry-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'telemetry-desc');
  });

  it('should set consent to opt_in when Allow button clicked', async () => {
    render(<TelemetryConsentBanner />);

    const allowButton = screen.getByText('Allow analytics');
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(telemetry.getConsent()).toBe('opt_in');
    });

    // Banner should disappear (after 1500ms announcement delay)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should set consent to opt_out when Decline button clicked', async () => {
    render(<TelemetryConsentBanner />);

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    await waitFor(() => {
      expect(telemetry.getConsent()).toBe('opt_out');
    });

    // Banner should disappear (after 1500ms announcement delay)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should emit consent_change event exactly once when opting in', async () => {
    render(<TelemetryConsentBanner />);

    const allowButton = screen.getByText('Allow analytics');
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(capturedEvents).toHaveLength(1);
    });

    const event = capturedEvents[0];
    expect(event.event).toBe('consent_change');
    expect(event.from).toBe('unset');
    expect(event.to).toBe('opt_in');
    expect(event.consent).toBe('opt_in');
    expect(event.dnt).toBe(0);
  });

  it('should support keyboard navigation (Tab/Shift+Tab)', () => {
    render(<TelemetryConsentBanner />);

    screen.getByRole('dialog');
    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute('aria-label', 'Allow anonymous analytics');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Decline analytics');

    // Simulate Tab key (focus should stay within dialog)
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('should close banner with Escape key as opt_out', async () => {
    render(<TelemetryConsentBanner />);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() => {
      expect(telemetry.getConsent()).toBe('opt_out');
    });

    // Banner should disappear (after 1500ms announcement delay)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});

// ============================================================================
// TEST SUITE 3: CSV_ERROR EMISSION
// ============================================================================

describe('Telemetry - csv_error Emission', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setupTransportSpy();
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true, writable: true });
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'doNotTrack', { value: undefined, configurable: true, writable: true });
    // Set consent to opt_in
    localStorageMock.setItem('pp.telemetryConsent', 'opt_in');
    // Clear any captured events
    capturedEvents = [];
  });

  afterEach(() => {
    resetTransportSpy();
  });

  it('should emit csv_error event with correct structure', () => {
    telemetry.error({
      phase: 'delimiter',
      row_bucket: '11-100',
      size_bucket: '≤100KB',
      delimiter: 'semicolon',
    });

    expect(capturedEvents).toHaveLength(1);
    const event = capturedEvents[0];

    expect(event.event).toBe('csv_error');
    expect(event.phase).toBe('delimiter');
    expect(event.row_bucket).toBe('11-100');
    expect(event.size_bucket).toBe('≤100KB');
    expect(event.delimiter).toBe('semicolon');
    expect(event.dnt).toBe(0);
    expect(event.consent).toBe('opt_in');
    expect(event.ts).toBeDefined();
    expect(typeof event.ts).toBe('string');
  });

  it('should NOT emit csv_error when consent is opt_out', () => {
    telemetry.setConsent('opt_out');
    capturedEvents = [];

    telemetry.error({ phase: 'size', size_bucket: '≤100KB' });

    expect(capturedEvents).toHaveLength(0);
  });

  it('should NOT emit csv_error when consent is unset', () => {
    localStorageMock.clear();
    capturedEvents = [];

    telemetry.error({ phase: 'rows', row_bucket: '>1000' });

    expect(capturedEvents).toHaveLength(0);
  });

  it('should emit csv_error for all error phases', () => {
    const phases: telemetry.CsvErrorInput['phase'][] = [
      'size', 'rows', 'delimiter', 'parse', 'date_format', 'date_real', 'currency',
    ];

    phases.forEach((phase) => {
      capturedEvents = [];
      telemetry.error({ phase, size_bucket: '≤100KB' });

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].phase).toBe(phase);
    });
  });

  it('should NOT include PII in csv_error payload', () => {
    telemetry.error({
      phase: 'parse',
      row_bucket: '1-10',
      size_bucket: '≤100KB',
      delimiter: 'comma',
    });

    const event = capturedEvents[0];
    const eventKeys = Object.keys(event);

    // Ensure no forbidden fields
    expect(eventKeys).not.toContain('provider');
    expect(eventKeys).not.toContain('amount');
    expect(eventKeys).not.toContain('raw');
    expect(eventKeys).not.toContain('fileName');
    expect(eventKeys).not.toContain('csvContent');
  });
});

// ============================================================================
// TEST SUITE 4: CSV_USAGE SAMPLING
// ============================================================================

describe('Telemetry - csv_usage Sampling', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setupTransportSpy();
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true, writable: true });
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'doNotTrack', { value: undefined, configurable: true, writable: true });
    localStorageMock.setItem('pp.telemetryConsent', 'opt_in');
    capturedEvents = [];
  });

  afterEach(() => {
    resetTransportSpy();
  });

  it('should sample csv_usage events at ≤10% rate', () => {
    const iterations = 200;
    let sampledCount = 0;

    for (let i = 0; i < iterations; i++) {
      capturedEvents = [];

      // Use different row_bucket values to vary sampling key
      const rowBuckets: telemetry.RowBucket[] = ['1-10', '11-100', '101-1000', '>1000'];
      const rowBucket = rowBuckets[i % 4];

      telemetry.maybeUsage({
        row_bucket: rowBucket,
        size_bucket: '≤100KB',
        delimiter: 'comma',
      });

      if (capturedEvents.length > 0) {
        sampledCount++;
      }
    }

    // Sampling rate should be ≤10% (allow some variance)
    const samplingRate = sampledCount / iterations;
    expect(samplingRate).toBeLessThanOrEqual(0.12); // 12% tolerance
  });

  it('should emit csv_usage event with correct structure when sampled', () => {
    // Try multiple times until we get a sampled event
    let sampledEvent: Record<string, unknown> | null = null;
    for (let i = 0; i < 50; i++) {
      capturedEvents = [];
      telemetry.maybeUsage({
        row_bucket: '11-100',
        size_bucket: '≤250KB',
        delimiter: 'comma',
      });

      if (capturedEvents.length > 0) {
        sampledEvent = capturedEvents[0] as Record<string, unknown>;
        break;
      }
    }

    if (sampledEvent) {
      expect(sampledEvent.event).toBe('csv_usage');
      expect(sampledEvent.row_bucket).toBe('11-100');
      expect(sampledEvent.size_bucket).toBe('≤250KB');
      expect(sampledEvent.delimiter).toBe('comma');
      expect(sampledEvent.dnt).toBe(0);
      expect(sampledEvent.consent).toBe('opt_in');
      expect(sampledEvent.ts).toBeDefined();
    }
  });

  it('should NOT sample csv_usage when consent is not opt_in', () => {
    telemetry.setConsent('opt_out');
    capturedEvents = [];

    // Try many times to ensure no sampling occurs
    for (let i = 0; i < 100; i++) {
      telemetry.maybeUsage({
        row_bucket: '1-10',
        size_bucket: '≤100KB',
        delimiter: 'comma',
      });
    }

    expect(capturedEvents).toHaveLength(0);
  });
});

// ============================================================================
// TEST SUITE 5: NO CONTENT LEAKAGE
// ============================================================================

describe('Telemetry - No Content Leakage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setupTransportSpy();
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true, writable: true });
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'doNotTrack', { value: undefined, configurable: true, writable: true });
    localStorageMock.setItem('pp.telemetryConsent', 'opt_in');
    capturedEvents = [];
  });

  afterEach(() => {
    resetTransportSpy();
  });

  it('should NOT include forbidden fields in any event type', () => {
    const forbiddenFields = ['provider', 'amount', 'raw', 'fileName', 'csvContent', 'fileText'];

    // Test csv_error
    telemetry.error({ phase: 'parse', size_bucket: '≤100KB' });

    // Test csv_usage (try multiple times to get a sampled event)
    for (let i = 0; i < 50; i++) {
      telemetry.maybeUsage({
        row_bucket: '1-10',
        size_bucket: '≤100KB',
        delimiter: 'comma',
      });
    }

    // Check all captured events
    capturedEvents.forEach((event) => {
      const eventKeys = Object.keys(event);
      forbiddenFields.forEach((forbidden) => {
        expect(eventKeys).not.toContain(forbidden);
      });
    });
  });

  it('should only include bucketed row counts, never exact counts', () => {
    telemetry.error({ phase: 'rows', row_bucket: '101-1000', size_bucket: '≤100KB' });

    const event = capturedEvents[0];
    expect(event.row_bucket).toBe('101-1000');
    expect(typeof event.row_bucket).toBe('string');

    // Ensure it's a bucket, not a number
    const validBuckets = ['1-10', '11-100', '101-1000', '>1000'];
    expect(validBuckets).toContain(event.row_bucket);
  });

  it('should only include bucketed file sizes, never exact bytes', () => {
    telemetry.error({ phase: 'size', size_bucket: '≤500KB' });

    const event = capturedEvents[0];
    expect(event.size_bucket).toBe('≤500KB');
    expect(typeof event.size_bucket).toBe('string');

    // Ensure it's a bucket, not a number
    const validBuckets = ['≤100KB', '≤250KB', '≤500KB', '≤1MB', '>1MB'];
    expect(validBuckets).toContain(event.size_bucket);
  });

  it('should only include delimiter enums, never raw delimiter characters', () => {
    telemetry.error({ phase: 'delimiter', delimiter: 'semicolon', size_bucket: '≤100KB' });

    const event = capturedEvents[0];
    expect(event.delimiter).toBe('semicolon');

    // Ensure it's an enum, not a raw character
    // Issue #29: Simplified to match actually supported delimiters (MVP only supports comma)
    const validDelimiters = ['comma', 'semicolon', 'other'];
    expect(validDelimiters).toContain(event.delimiter);
  });
});

// ============================================================================
// TEST SUITE 6: BANNER ACCESSIBILITY
// ============================================================================

describe('Telemetry - Banner Accessibility', () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true, writable: true });
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'doNotTrack', { value: undefined, configurable: true, writable: true });
  });

  it('should have role="dialog"', () => {
    render(<TelemetryConsentBanner />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should have aria-modal="true"', () => {
    render(<TelemetryConsentBanner />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-labelledby pointing to title', () => {
    render(<TelemetryConsentBanner />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'telemetry-title');

    const title = document.getElementById('telemetry-title');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toContain('Help improve this tool');
  });

  it('should have aria-describedby pointing to description', () => {
    render(<TelemetryConsentBanner />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'telemetry-desc');

    const desc = document.getElementById('telemetry-desc');
    expect(desc).toBeInTheDocument();
  });

  it('should have buttons with type="button"', () => {
    render(<TelemetryConsentBanner />);
    const buttons = screen.getAllByRole('button');

    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('should have buttons with accessible labels', () => {
    render(<TelemetryConsentBanner />);

    const allowButton = screen.getByRole('button', { name: /allow.*analytics/i });
    const declineButton = screen.getByRole('button', { name: /decline.*analytics/i });

    expect(allowButton).toBeInTheDocument();
    expect(declineButton).toBeInTheDocument();
  });
});

// ============================================================================
// TEST SUITE 7: ARIA LIVE ANNOUNCEMENTS
// ============================================================================

describe('Telemetry - ARIA Live Announcements', () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true, writable: true });
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'doNotTrack', { value: undefined, configurable: true, writable: true });
  });

  // T001: Live region exists with role="status"
  it('should have live region with role="status"', () => {
    render(<TelemetryConsentBanner />);

    // Live region should exist when banner is visible
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();

    // Live region should announce countdown at mount (10 seconds)
    expect(liveRegion).toHaveTextContent(/10 seconds/);
  });

  // T002: ARIA attributes are correct
  it('should have correct ARIA attributes', () => {
    render(<TelemetryConsentBanner />);

    const liveRegion = screen.getByRole('status');

    // Check aria-live="polite"
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');

    // Check aria-atomic="true"
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');

    // Check sr-only class (Tailwind utility)
    expect(liveRegion).toHaveClass('sr-only');
  });

  // T003: Opt-in announcement text
  it('should announce "Anonymous analytics enabled" on opt-in', async () => {
    render(<TelemetryConsentBanner />);

    // Initially shows countdown announcement
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent(/10 seconds/);

    const allowButton = screen.getByText('Allow analytics');
    fireEvent.click(allowButton);

    // Live region text should be set immediately
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Anonymous analytics enabled');
    });
  });

  // T004: Opt-out announcement text (Decline button)
  it('should announce "Analytics disabled" on opt-out (Decline)', async () => {
    render(<TelemetryConsentBanner />);

    // Initially shows countdown announcement
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent(/10 seconds/);

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    // Live region text should be set immediately
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Analytics disabled');
    });
  });

  // T005: Opt-out announcement text (Escape key)
  it('should announce "Analytics disabled" on Escape key', async () => {
    render(<TelemetryConsentBanner />);

    // Initially shows countdown announcement
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent(/10 seconds/);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    // Live region text should be set immediately
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Analytics disabled');
    });
  });
});

// ============================================================================
// TEST SUITE 8: BUCKETING HELPERS
// ============================================================================

describe('Telemetry - Bucketing Helpers', () => {
  it('should bucket row counts correctly', () => {
    expect(telemetry.bucketRows(5)).toBe('1-10');
    expect(telemetry.bucketRows(10)).toBe('1-10');
    expect(telemetry.bucketRows(11)).toBe('11-100');
    expect(telemetry.bucketRows(50)).toBe('11-100');
    expect(telemetry.bucketRows(100)).toBe('11-100');
    expect(telemetry.bucketRows(101)).toBe('101-1000');
    expect(telemetry.bucketRows(500)).toBe('101-1000');
    expect(telemetry.bucketRows(1000)).toBe('101-1000');
    expect(telemetry.bucketRows(1001)).toBe('>1000');
    expect(telemetry.bucketRows(5000)).toBe('>1000');
  });

  it('should bucket file sizes correctly', () => {
    expect(telemetry.bucketSize(50 * 1024)).toBe('≤100KB'); // 50KB
    expect(telemetry.bucketSize(100 * 1024)).toBe('≤100KB'); // 100KB
    expect(telemetry.bucketSize(150 * 1024)).toBe('≤250KB'); // 150KB
    expect(telemetry.bucketSize(250 * 1024)).toBe('≤250KB'); // 250KB
    expect(telemetry.bucketSize(300 * 1024)).toBe('≤500KB'); // 300KB
    expect(telemetry.bucketSize(500 * 1024)).toBe('≤500KB'); // 500KB
    expect(telemetry.bucketSize(700 * 1024)).toBe('≤1MB');   // 700KB
    expect(telemetry.bucketSize(1024 * 1024)).toBe('≤1MB');  // 1MB
    expect(telemetry.bucketSize(2 * 1024 * 1024)).toBe('>1MB'); // 2MB
  });
});

// ============================================================================
// TEST SUITE 9: AUTO-DISMISS COUNTDOWN (Feature 011-009-008-0020)
// ============================================================================

describe('Telemetry - Auto-Dismiss Countdown', () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true, writable: true });
    Object.defineProperty(navigator, 'msDoNotTrack', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(window, 'doNotTrack', { value: undefined, configurable: true, writable: true });
  });

  // T002: Test countdown starts at 10 seconds
  it('countdown starts at 10 seconds on banner mount', () => {
    render(<TelemetryConsentBanner />);
    expect(screen.getByText(/Auto-dismissing in 10s/)).toBeInTheDocument();
  });

  // T003: Test countdown decrements every second
  it('countdown decrements by 1 every second', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    render(<TelemetryConsentBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/9s/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/8s/)).toBeInTheDocument();

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // T004: Test auto-dismiss at countdown=0 (uses real timers)
  it('banner dismisses and sets opt_out when countdown reaches 0', async () => {
    render(<TelemetryConsentBanner />);

    // Wait for full countdown (10s) + announcement delay (1.5s)
    await new Promise(resolve => setTimeout(resolve, 11500));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 1000 });
    expect(localStorage.getItem('pp.telemetryConsent')).toBe('opt_out');
  }, 13000); // Test timeout 13s

  // T005: Test countdown pauses on hover (uses real timers)
  it('countdown pauses when user hovers over banner', async () => {
    render(<TelemetryConsentBanner />);

    // Wait 3.1 seconds (countdown should reach 7s or 6s, accounting for timing variance)
    await new Promise(resolve => setTimeout(resolve, 3100));

    const banner = screen.getByRole('dialog');
    act(() => {
      fireEvent.mouseEnter(banner);
    });

    // Verify pause indicator shows
    await waitFor(() => {
      expect(screen.getByText(/Paused/)).toBeInTheDocument();
    }, { timeout: 500 });

    // Wait 2 seconds while paused
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Should still show "Paused" (not changing)
    expect(screen.getByText(/Paused/)).toBeInTheDocument();
  }, 7000); // Test timeout 7s

  // T006: Test countdown resumes after hover leaves
  it('countdown resumes when hover ends', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    render(<TelemetryConsentBanner />);

    act(() => {
      vi.advanceTimersByTime(5000); // 5s elapsed, shows 5s
    });
    const banner = screen.getByRole('dialog');
    fireEvent.mouseEnter(banner);
    act(() => {
      vi.advanceTimersByTime(2000); // Paused, still 5s
    });

    fireEvent.mouseLeave(banner);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/4s/)).toBeInTheDocument(); // Resumed

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // T007: Test countdown pauses on focus (uses real timers)
  it('countdown pauses when element receives focus', async () => {
    render(<TelemetryConsentBanner />);

    // Wait 4.1 seconds (countdown should reach 6s or 5s)
    await new Promise(resolve => setTimeout(resolve, 4100));

    // Simulate real user interaction - Tab key press to move focus
    // Fire keydown on document to trigger user interaction flag
    fireEvent.keyDown(document, { key: 'Tab' });

    // Wait a bit for state update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify pause indicator shows (focus is within dialog + user interacted)
    await waitFor(() => {
      expect(screen.getByText(/Paused/)).toBeInTheDocument();
    }, { timeout: 1000 });

    // Wait 2 seconds while paused
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Should still show "Paused" (not changing)
    expect(screen.getByText(/Paused/)).toBeInTheDocument();
  }, 7500); // Test timeout 7.5s

  // T008: Test pause on tab visibility change (uses real timers)
  it('countdown pauses when tab becomes hidden', async () => {
    render(<TelemetryConsentBanner />);

    // Wait 2.1 seconds (countdown should reach 8s or 7s)
    await new Promise(resolve => setTimeout(resolve, 2100));

    // Hide the tab
    act(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      fireEvent(document, new Event('visibilitychange'));
    });

    // Verify pause indicator shows
    await waitFor(() => {
      expect(screen.getByText(/Paused/)).toBeInTheDocument();
    }, { timeout: 500 });

    // Wait 3 seconds while paused
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Should still show "Paused" (not changing)
    expect(screen.getByText(/Paused/)).toBeInTheDocument();

    // Clean up
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  }, 7000); // Test timeout 7s

  // T009: Test pause indicator appears
  it('shows pause indicator when countdown is paused', () => {
    render(<TelemetryConsentBanner />);
    const banner = screen.getByRole('dialog');

    fireEvent.mouseEnter(banner);
    expect(screen.getByText(/Paused/)).toBeInTheDocument();
  });

  // T010: Test screen reader announcements at milestones
  it('announces countdown at 10s, 5s, 0s only', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    render(<TelemetryConsentBanner />);

    const liveRegion = screen.getByRole('status');

    // At 10s
    expect(liveRegion).toHaveTextContent(/10 seconds/);

    // At 9s - should NOT announce
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(liveRegion).toHaveTextContent(/10 seconds/); // Still old text

    // At 5s - SHOULD announce
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(liveRegion).toHaveTextContent(/5 seconds/);

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // T011: Test auto-dismiss announcement (uses real timers)
  it('announces auto-dismissed on timeout', async () => {
    render(<TelemetryConsentBanner />);

    const liveRegion = screen.getByRole('status');

    // Wait for countdown to complete (10s) + a bit more for auto-dismiss to trigger
    await new Promise(resolve => setTimeout(resolve, 10100));

    // The announcement should be set to "Analytics banner auto-dismissed"
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent(/auto-dismissed/i);
    }, { timeout: 500 });
  }, 12000); // Test timeout 12s

  // T012: Test focus restoration after auto-dismiss (uses real timers)
  it('restores focus to previous element after auto-dismiss', async () => {
    // First render just the input
    const { rerender } = render(
      <div>
        <input data-testid="test-input" />
      </div>
    );

    // Focus the input
    const input = screen.getByTestId('test-input');
    input.focus();
    expect(document.activeElement).toBe(input);

    // Now render with the banner (it will capture the focused input)
    rerender(
      <div>
        <input data-testid="test-input" />
        <TelemetryConsentBanner />
      </div>
    );

    // Wait for banner auto-focus to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Wait for auto-dismiss countdown + announcement delay
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 12000 });

    // Focus should be restored to input
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    }, { timeout: 500 });
  }, 14000); // Test timeout 14s

  // T013: Test user action cancels countdown
  it('clicking Decline cancels countdown and dismisses banner', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    render(<TelemetryConsentBanner />);

    act(() => {
      vi.advanceTimersByTime(3000); // At 7s
    });

    const declineButton = screen.getByRole('button', { name: /Decline/ });
    fireEvent.click(declineButton);

    act(() => {
      vi.advanceTimersByTime(1500); // Wait for announcement delay
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem('pp.telemetryConsent')).toBe('opt_out');

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // T014: Test cross-tab consent synchronization (FR-017.4)
  it('dismisses banner when consent changes in another tab', async () => {
    render(<TelemetryConsentBanner />);

    // Banner should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Simulate storage event from another tab setting consent to opt_in
    // Note: Not using storageArea since this is simulating cross-tab sync (no specific storage mock needed)
    const storageEvent = new Event('storage') as StorageEvent;
    Object.defineProperties(storageEvent, {
      key: { value: 'pp.telemetryConsent', enumerable: true },
      newValue: { value: 'opt_in', enumerable: true },
      oldValue: { value: 'unset', enumerable: true },
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    // Banner should disappear after animation delay (1500ms)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
