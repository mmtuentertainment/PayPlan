import { DateTime } from 'luxon';

/**
 * Calculate next 3-4 payday dates based on user-provided information
 * @param {Object} options
 * @param {string[]} [options.paycheckDates] - Explicit array of payday dates (ISO format)
 * @param {string} [options.payCadence] - Payday frequency: 'weekly'|'biweekly'|'semimonthly'|'monthly'
 * @param {string} [options.nextPayday] - Next payday date (ISO format), required with payCadence
 * @param {string} options.timezone - IANA timezone identifier
 * @returns {string[]} Array of 3-4 payday dates in ISO format (yyyy-mm-dd)
 */
function calculatePaydays({ paycheckDates, payCadence, nextPayday, timezone }) {
  // Validate timezone
  if (!timezone || !DateTime.local().setZone(timezone).isValid) {
    throw new Error('Invalid timezone');
  }

  // Option A: Explicit payday dates provided
  if (paycheckDates) {
    if (!Array.isArray(paycheckDates) || paycheckDates.length < 3) {
      throw new Error('paycheckDates must contain at least 3 dates');
    }

    // Validate each date
    paycheckDates.forEach(date => {
      if (!isValidISODate(date)) {
        throw new Error('Invalid date format. Use yyyy-mm-dd');
      }
    });

    return paycheckDates;
  }

  // Option B: Calculate from cadence + next payday
  if (!nextPayday) {
    throw new Error('Must provide either paycheckDates or nextPayday');
  }

  if (!isValidISODate(nextPayday)) {
    throw new Error('Invalid date format. Use yyyy-mm-dd');
  }

  // Default to biweekly if cadence not specified
  const cadence = payCadence || 'biweekly';

  return calculateCadencePaydays(nextPayday, cadence, timezone);
}

/**
 * Calculate paydays based on cadence pattern
 */
function calculateCadencePaydays(startDate, cadence, timezone) {
  const paydays = [];
  let currentDate = DateTime.fromISO(startDate, { zone: timezone });

  if (!currentDate.isValid) {
    throw new Error('Invalid date format. Use yyyy-mm-dd');
  }

  switch (cadence) {
    case 'weekly':
      // Add 4 weekly paydays (every 7 days)
      for (let i = 0; i < 4; i++) {
        paydays.push(currentDate.toISODate());
        currentDate = currentDate.plus({ weeks: 1 });
      }
      break;

    case 'biweekly':
      // Add 4 biweekly paydays (every 14 days)
      for (let i = 0; i < 4; i++) {
        paydays.push(currentDate.toISODate());
        currentDate = currentDate.plus({ weeks: 2 });
      }
      break;

    case 'semimonthly':
      // Add 4 semimonthly paydays (1st and 15th of each month)
      for (let i = 0; i < 4; i++) {
        paydays.push(currentDate.toISODate());

        // Determine next payday
        if (currentDate.day === 1) {
          // If on 1st, next is 15th of same month
          currentDate = currentDate.set({ day: 15 });
        } else {
          // If on 15th, next is 1st of next month
          currentDate = currentDate.plus({ months: 1 }).set({ day: 1 });
        }
      }
      break;

    case 'monthly':
      // Add 4 monthly paydays (same day of each month)
      const dayOfMonth = currentDate.day;
      for (let i = 0; i < 4; i++) {
        // Handle month-end dates (e.g., Jan 31 -> Feb 28)
        const targetDate = currentDate.set({ day: Math.min(dayOfMonth, currentDate.daysInMonth) });
        paydays.push(targetDate.toISODate());
        currentDate = currentDate.plus({ months: 1 });
      }
      break;

    default:
      throw new Error(`Invalid payCadence: ${cadence}. Must be 'weekly', 'biweekly', 'semimonthly', or 'monthly'`);
  }

  return paydays;
}

/**
 * Validate ISO 8601 date format (yyyy-mm-dd)
 */
function isValidISODate(dateString) {
  if (typeof dateString !== 'string') return false;

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) return false;

  const date = DateTime.fromISO(dateString);
  return date.isValid;
}

export { calculatePaydays };