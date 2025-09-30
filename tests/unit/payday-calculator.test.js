const { calculatePaydays } = require('../../src/lib/payday-calculator');
const { DateTime } = require('luxon');

describe('PaydayCalculator', () => {
  const timezone = 'America/New_York';

  describe('Explicit payday dates', () => {
    it('should return provided paycheck dates as-is', () => {
      const paycheckDates = ['2025-10-05', '2025-10-19', '2025-11-02'];

      const result = calculatePaydays({ paycheckDates, timezone });

      expect(result).toEqual([
        '2025-10-05',
        '2025-10-19',
        '2025-11-02'
      ]);
    });

    it('should handle more than 3 dates', () => {
      const paycheckDates = ['2025-10-05', '2025-10-19', '2025-11-02', '2025-11-16'];

      const result = calculatePaydays({ paycheckDates, timezone });

      expect(result.length).toBe(4);
      expect(result).toEqual(paycheckDates);
    });
  });

  describe('Cadence-based paydays', () => {
    describe('weekly cadence', () => {
      it('should calculate next 4 weekly paydays', () => {
        const nextPayday = '2025-10-05';
        const payCadence = 'weekly';

        const result = calculatePaydays({ payCadence, nextPayday, timezone });

        expect(result).toEqual([
          '2025-10-05',  // Starting date
          '2025-10-12',  // +7 days
          '2025-10-19',  // +14 days
          '2025-10-26'   // +21 days
        ]);
      });
    });

    describe('biweekly cadence', () => {
      it('should calculate next 4 biweekly paydays', () => {
        const nextPayday = '2025-10-05';
        const payCadence = 'biweekly';

        const result = calculatePaydays({ payCadence, nextPayday, timezone });

        expect(result).toEqual([
          '2025-10-05',  // Starting date
          '2025-10-19',  // +14 days
          '2025-11-02',  // +28 days
          '2025-11-16'   // +42 days
        ]);
      });

      it('should default to biweekly when cadence not specified', () => {
        const nextPayday = '2025-10-05';

        const result = calculatePaydays({ nextPayday, timezone });

        expect(result).toEqual([
          '2025-10-05',
          '2025-10-19',
          '2025-11-02',
          '2025-11-16'
        ]);
      });
    });

    describe('semimonthly cadence', () => {
      it('should calculate next 4 semimonthly paydays (1st and 15th)', () => {
        const nextPayday = '2025-10-01';
        const payCadence = 'semimonthly';

        const result = calculatePaydays({ payCadence, nextPayday, timezone });

        expect(result).toEqual([
          '2025-10-01',  // 1st
          '2025-10-15',  // 15th
          '2025-11-01',  // Next month 1st
          '2025-11-15'   // Next month 15th
        ]);
      });

      it('should handle starting on 15th', () => {
        const nextPayday = '2025-10-15';
        const payCadence = 'semimonthly';

        const result = calculatePaydays({ payCadence, nextPayday, timezone });

        expect(result).toEqual([
          '2025-10-15',
          '2025-11-01',
          '2025-11-15',
          '2025-12-01'
        ]);
      });
    });

    describe('monthly cadence', () => {
      it('should calculate next 4 monthly paydays on same day of month', () => {
        const nextPayday = '2025-10-05';
        const payCadence = 'monthly';

        const result = calculatePaydays({ payCadence, nextPayday, timezone });

        expect(result).toEqual([
          '2025-10-05',
          '2025-11-05',
          '2025-12-05',
          '2026-01-05'
        ]);
      });

      it('should handle month-end dates', () => {
        const nextPayday = '2025-01-31';
        const payCadence = 'monthly';

        const result = calculatePaydays({ payCadence, nextPayday, timezone });

        // Feb 28, March 31, April 30, May 31
        expect(result[0]).toBe('2025-01-31');
        expect(result[1]).toBe('2025-02-28');  // Feb has 28 days in 2025
        expect(result[2]).toBe('2025-03-31');
        expect(result[3]).toBe('2025-04-30');  // April has 30 days
      });
    });
  });

  describe('Timezone handling', () => {
    it('should respect different timezones', () => {
      const nextPayday = '2025-10-05';
      const payCadence = 'weekly';

      const resultNY = calculatePaydays({
        payCadence,
        nextPayday,
        timezone: 'America/New_York'
      });

      const resultLA = calculatePaydays({
        payCadence,
        nextPayday,
        timezone: 'America/Los_Angeles'
      });

      // Dates should be the same (no timezone conversion for dates only)
      expect(resultNY).toEqual(resultLA);
    });
  });

  describe('Error handling', () => {
    it('should throw error if neither paycheckDates nor nextPayday provided', () => {
      expect(() => {
        calculatePaydays({ timezone });
      }).toThrow('Must provide either paycheckDates or nextPayday');
    });

    it('should throw error if paycheckDates has fewer than 3 dates', () => {
      expect(() => {
        calculatePaydays({
          paycheckDates: ['2025-10-05', '2025-10-19'],
          timezone
        });
      }).toThrow('paycheckDates must contain at least 3 dates');
    });

    it('should throw error if invalid timezone', () => {
      expect(() => {
        calculatePaydays({
          nextPayday: '2025-10-05',
          timezone: 'Invalid/Timezone'
        });
      }).toThrow('Invalid timezone');
    });

    it('should throw error if invalid date format', () => {
      expect(() => {
        calculatePaydays({
          nextPayday: '10/05/2025',  // Wrong format
          timezone
        });
      }).toThrow('Invalid date format');
    });
  });
});