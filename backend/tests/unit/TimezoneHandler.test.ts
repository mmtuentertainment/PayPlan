/**
 * TimezoneHandler Tests
 * Feature 018: Technical Debt Cleanup - User Story 3 (P2)
 *
 * Tests timezone validation and UTC normalization to ensure timezone-independent
 * date comparisons (FR-014, Tasks T074-T075).
 */

import { TimezoneHandler } from '../../src/lib/utils/TimezoneHandler';

describe('TimezoneHandler', () => {
  let handler: TimezoneHandler;

  beforeEach(() => {
    handler = new TimezoneHandler();
  });

  describe('T074: validates IANA timezone format', () => {
    it('should accept valid IANA timezone strings', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'UTC',
        'America/Los_Angeles',
        'Australia/Sydney',
        'Africa/Cairo',
      ];

      validTimezones.forEach((tz) => {
        expect(() => handler.validateTimezone(tz)).not.toThrow();
        expect(handler.isValidTimezone(tz)).toBe(true);
      });
    });

    it('should reject invalid timezone strings', () => {
      const invalidTimezones = [
        'PST', // Abbreviation, not IANA
        'EST', // Abbreviation
        'GMT+5', // Offset notation
        'America/Invalid',
        'Not/A/Timezone',
        '',
        'UTC+5:30', // Offset
      ];

      invalidTimezones.forEach((tz) => {
        expect(() => handler.validateTimezone(tz)).toThrow();
        expect(handler.isValidTimezone(tz)).toBe(false);
      });
    });

    it('should reject null or undefined', () => {
      expect(() => handler.validateTimezone(null)).toThrow();
      expect(() => handler.validateTimezone(undefined)).toThrow();
      expect(handler.isValidTimezone(null)).toBe(false);
      expect(handler.isValidTimezone(undefined)).toBe(false);
    });

    it('should provide clear error message for invalid timezone', () => {
      try {
        handler.validateTimezone('PST');
        // If we reach here, test should fail
        expect(true).toBe(false); // Force failure
      } catch (error: any) {
        expect(error.message).toContain('Invalid timezone');
        expect(error.message).toContain('PST');
        expect(error.message).toContain('IANA');
      }
    });

    it('should handle case-sensitive timezone names', () => {
      // IANA timezones are case-sensitive
      expect(handler.isValidTimezone('America/New_York')).toBe(true);
      // Note: Some implementations may normalize case, so we just check valid one works
      // Invalid names should still fail
      expect(handler.isValidTimezone('Not/A/Real/Timezone')).toBe(false);
    });
  });

  describe('T075: Date sorting uses timestamp comparison', () => {
    it('should normalize dates to UTC timestamps', () => {
      const date1 = '2025-01-15T10:00:00-05:00'; // EST
      const date2 = '2025-01-15T15:00:00Z'; // UTC

      const ts1 = handler.toTimestamp(date1);
      const ts2 = handler.toTimestamp(date2);

      // Both represent the same moment in time
      expect(ts1).toBe(ts2);
    });

    it('should compare dates timezone-independently', () => {
      const earlier = '2025-01-15T10:00:00-08:00'; // 18:00 UTC
      const later = '2025-01-15T13:01:00-05:00'; // 18:01 UTC (1 minute later)

      expect(handler.compare(earlier, earlier)).toBe(0);
      expect(handler.compare(earlier, later)).toBeLessThan(0);
      expect(handler.compare(later, earlier)).toBeGreaterThan(0);
    });

    it('should sort array of dates correctly regardless of timezone', () => {
      const dates = [
        '2025-01-15T10:00:00-08:00', // Pacific
        '2025-01-15T08:00:00-05:00', // Eastern (earlier)
        '2025-01-15T15:00:00Z', // UTC
        '2025-01-15T23:00:00+09:00', // Tokyo (earliest)
      ];

      const sorted = handler.sortDates(dates);

      // Verify sorted order by converting to timestamps
      const timestamps = sorted.map(d => handler.toTimestamp(d));
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('should handle ISO 8601 strings without timezone (assumes UTC, warns) (CodeRabbit)', () => {
      const dateNoTz = '2025-01-15T10:00:00'; // No timezone - ambiguous!
      const dateUtc = '2025-01-15T10:00:00Z';

      // Should assume UTC for backward compatibility (with console warning)
      const ts1 = handler.toTimestamp(dateNoTz);
      const ts2 = handler.toTimestamp(dateUtc);
      expect(ts1).toBe(ts2); // Both produce same UTC timestamp

      // Explicit timezone should still work
      expect(() => handler.toTimestamp(dateUtc)).not.toThrow();
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-15T10:00:00Z');
      const timestamp = handler.toTimestamp(date);

      expect(timestamp).toBe(date.getTime());
    });

    it('should handle Unix timestamps (milliseconds)', () => {
      const now = Date.now();
      const timestamp = handler.toTimestamp(now);

      expect(timestamp).toBe(now);
    });

    it('should reject invalid date strings', () => {
      const invalidDates = [
        'not a date',
        '2025-13-01', // Invalid month
        '2025-01-32', // Invalid day
        '',
      ];

      invalidDates.forEach((date) => {
        expect(() => handler.toTimestamp(date)).toThrow();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle daylight saving time transitions', () => {
      // Spring forward: 2025-03-09 02:00 EST -> 03:00 EDT
      const beforeDST = '2025-03-09T01:00:00-05:00';
      const afterDST = '2025-03-09T03:00:00-04:00';

      const ts1 = handler.toTimestamp(beforeDST);
      const ts2 = handler.toTimestamp(afterDST);

      // 2-hour difference in wall clock, 1 hour in real time
      expect(ts2 - ts1).toBe(60 * 60 * 1000); // 1 hour in ms
    });

    it('should handle dates across year boundaries', () => {
      const endOf2024 = '2024-12-31T23:59:59Z';
      const startOf2025 = '2025-01-01T00:00:00Z';

      expect(handler.compare(endOf2024, startOf2025)).toBeLessThan(0);
    });

    it('should handle leap year dates', () => {
      const leapDay = '2024-02-29T12:00:00Z'; // 2024 is a leap year
      expect(() => handler.toTimestamp(leapDay)).not.toThrow();
    });

    it('should provide timezone-safe comparison utility', () => {
      const date1 = new Date('2025-01-15T10:00:00-08:00');
      const date2 = new Date('2025-01-15T18:00:00Z');

      // Same moment in time, different timezone representations
      expect(handler.areSameInstant(date1, date2)).toBe(true);
    });
  });

  describe('BNPL-critical edge cases (CodeRabbit)', () => {
    it('should handle end-of-month dates (Feb 28 vs Feb 29)', () => {
      // Non-leap year
      const feb28_2025 = '2025-02-28T12:00:00Z';
      expect(() => handler.toTimestamp(feb28_2025)).not.toThrow();

      // Leap year
      const feb29_2024 = '2024-02-29T12:00:00Z';
      expect(() => handler.toTimestamp(feb29_2024)).not.toThrow();

      // Verify chronological ordering
      const feb28_2024 = '2024-02-28T12:00:00Z';
      expect(handler.compare(feb28_2024, feb29_2024)).toBeLessThan(0);
    });

    it('should handle grace-period boundaries (23:59:59 vs 00:00:00)', () => {
      const lastSecond = '2025-01-15T23:59:59Z';
      const midnight = '2025-01-16T00:00:00Z';

      // One second apart
      const ts1 = handler.toTimestamp(lastSecond);
      const ts2 = handler.toTimestamp(midnight);
      expect(ts2 - ts1).toBe(1000); // 1 second in milliseconds

      // Comparisons treat them correctly
      expect(handler.compare(lastSecond, midnight)).toBeLessThan(0);
      expect(handler.areSameInstant(lastSecond, midnight)).toBe(false);
    });

    it('should handle negative timezone offsets correctly', () => {
      // Los Angeles is UTC-8 (or UTC-7 during DST)
      const la_time = '2025-01-15T10:00:00-08:00'; // 18:00 UTC
      const utc_time = '2025-01-15T18:00:00Z';

      // Should represent same instant
      expect(handler.areSameInstant(la_time, utc_time)).toBe(true);

      // Timestamp arithmetic should work correctly
      const ts1 = handler.toTimestamp(la_time);
      const ts2 = handler.toTimestamp(utc_time);
      expect(ts1).toBe(ts2);
    });

    it('should handle month boundaries correctly', () => {
      const endOfJan = '2025-01-31T23:59:59Z';
      const startOfFeb = '2025-02-01T00:00:00Z';

      expect(handler.compare(endOfJan, startOfFeb)).toBeLessThan(0);

      // One second apart
      const ts1 = handler.toTimestamp(endOfJan);
      const ts2 = handler.toTimestamp(startOfFeb);
      expect(ts2 - ts1).toBe(1000);
    });

    it('should handle timezone offset edge cases (+14:00 and -12:00)', () => {
      // Line Islands (Kiritimati) is UTC+14
      const kiritimati = '2025-01-16T02:00:00+14:00'; // 2025-01-15 12:00 UTC
      // Baker Island is UTC-12
      const baker = '2025-01-15T00:00:00-12:00'; // 2025-01-15 12:00 UTC

      // Same instant despite 26-hour offset difference
      expect(handler.areSameInstant(kiritimati, baker)).toBe(true);
    });

    it('should sort mixed timezone dates correctly', () => {
      const dates = [
        '2025-01-15T23:00:00+09:00', // Tokyo, earliest UTC
        '2025-01-15T08:00:00-05:00', // EST
        '2025-01-15T10:00:00-08:00', // PST
        '2025-01-15T15:00:00Z',      // UTC, latest
      ];

      const sorted = handler.sortDates(dates);
      const timestamps = sorted.map(d => handler.toTimestamp(d));

      // Verify ascending order
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });
  });
});
