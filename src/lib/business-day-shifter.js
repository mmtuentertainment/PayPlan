const { DateTime } = require('luxon');
const holidayData = require('../data/us-federal-holidays-2025-2026.json');

/**
 * Shifts payment due dates from weekends/holidays to the next business day
 * @param {Array} items - Array of payment items with due_date fields
 * @param {string} timeZone - IANA timezone string
 * @param {Object} options - Configuration options
 * @param {boolean} options.businessDayMode - Enable business day shifting (default: true)
 * @param {string} options.country - Country for holiday calendar: "US" | "None" (default: "US")
 * @param {Array<string>} options.customSkipDates - Additional dates to skip (YYYY-MM-DD format)
 * @returns {Object} { shiftedItems, movedDates }
 */
function shiftToBusinessDays(items, timeZone, options = {}) {
  const {
    businessDayMode = true,
    country = 'US',
    customSkipDates = []
  } = options;

  // If business day mode is disabled, return items unchanged
  if (!businessDayMode) {
    return {
      shiftedItems: items,
      movedDates: []
    };
  }

  // Build skip set: weekends + holidays + custom dates
  const skipSet = buildSkipSet(country, customSkipDates);

  const shiftedItems = [];
  const movedDates = [];

  for (const item of items) {
    const shiftedItem = { ...item };
    const originalDate = item.due_date;

    // Parse date in provided timezone
    let dateTime = DateTime.fromISO(originalDate, { zone: timeZone });

    if (!dateTime.isValid) {
      // Invalid date, skip shifting
      shiftedItem.wasShifted = false;
      shiftedItems.push(shiftedItem);
      continue;
    }

    let reason = undefined;
    let shifted = false;
    let daysShifted = 0;
    const MAX_SHIFT_DAYS = 365; // Prevent infinite loops from malformed data
    const priority = { WEEKEND: 1, HOLIDAY: 2, CUSTOM: 3 };

    // Shift forward until we find a business day
    while (isNonBusinessDay(dateTime, skipSet)) {
      const dayOfWeek = dateTime.weekday; // 1=Mon, 7=Sun
      const dateKey = dateTime.toISODate();

      // Track highest-priority reason (CUSTOM > HOLIDAY > WEEKEND)
      const candidate = skipSet.customSkipDates.has(dateKey)
        ? 'CUSTOM'
        : skipSet.holidays.has(dateKey)
        ? 'HOLIDAY'
        : dayOfWeek === 6 || dayOfWeek === 7
        ? 'WEEKEND'
        : undefined;

      if (candidate) {
        if (!reason || priority[candidate] > priority[reason]) {
          reason = candidate;
        }
      }

      dateTime = dateTime.plus({ days: 1 });
      shifted = true;
      daysShifted++;

      // Safety check: prevent infinite loops from malformed holiday/skip data
      if (daysShifted >= MAX_SHIFT_DAYS) {
        throw new Error(
          `Unable to find business day after ${originalDate} within ${MAX_SHIFT_DAYS} days. ` +
          `Check holiday data and customSkipDates for errors.`
        );
      }
    }

    if (shifted) {
      const shiftedDate = dateTime.toISODate();

      shiftedItem.due_date = shiftedDate;
      shiftedItem.originalDueDate = originalDate;
      shiftedItem.shiftedDueDate = shiftedDate;
      shiftedItem.wasShifted = true;
      shiftedItem.shiftReason = reason;

      movedDates.push({
        provider: item.provider,
        installment_no: item.installment_no,
        originalDueDate: originalDate,
        shiftedDueDate: shiftedDate,
        reason
      });
    } else {
      shiftedItem.wasShifted = false;
    }

    shiftedItems.push(shiftedItem);
  }

  // Sort movedDates by shiftedDueDate
  movedDates.sort((a, b) => a.shiftedDueDate.localeCompare(b.shiftedDueDate));

  return {
    shiftedItems,
    movedDates
  };
}

/**
 * Build set of non-business days
 */
function buildSkipSet(country, customSkipDates) {
  const holidays = new Set();

  // Load holidays for the country
  if (country === 'US') {
    for (const year of Object.keys(holidayData)) {
      for (const holiday of holidayData[year]) {
        // Use observed date if available
        const dateToUse = holiday.observed || holiday.date;
        holidays.add(dateToUse);
      }
    }
  }

  return {
    holidays,
    customSkipDates: new Set(customSkipDates)
  };
}

/**
 * Check if a date is a non-business day
 */
function isNonBusinessDay(dateTime, skipSet) {
  const dayOfWeek = dateTime.weekday; // 1=Mon, 7=Sun
  const dateKey = dateTime.toISODate();

  // Check weekends (Saturday=6, Sunday=7)
  if (dayOfWeek === 6 || dayOfWeek === 7) {
    return true;
  }

  // Check holidays
  if (skipSet.holidays.has(dateKey)) {
    return true;
  }

  // Check custom skip dates
  if (skipSet.customSkipDates.has(dateKey)) {
    return true;
  }

  return false;
}

/**
 * Check if a specific date is a business day
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeZone - IANA timezone
 * @param {string} country - Country code
 * @param {Array<string>} customSkipDates - Custom skip dates
 * @returns {boolean}
 */
function isBusinessDay(dateStr, timeZone, country = 'US', customSkipDates = []) {
  const skipSet = buildSkipSet(country, customSkipDates);
  const dateTime = DateTime.fromISO(dateStr, { zone: timeZone });

  if (!dateTime.isValid) {
    return false;
  }

  return !isNonBusinessDay(dateTime, skipSet, customSkipDates);
}

/**
 * Find the next business day from a given date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeZone - IANA timezone
 * @param {string} country - Country code
 * @param {Array<string>} customSkipDates - Custom skip dates
 * @returns {string} Next business day in YYYY-MM-DD format
 */
function nextBusinessDay(dateStr, timeZone, country = 'US', customSkipDates = []) {
  const skipSet = buildSkipSet(country, customSkipDates);
  let dateTime = DateTime.fromISO(dateStr, { zone: timeZone });

  if (!dateTime.isValid) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  // Start from next day
  dateTime = dateTime.plus({ days: 1 });

  // Find next business day with infinite loop protection
  let daysShifted = 0;
  const MAX_SHIFT_DAYS = 365;

  while (isNonBusinessDay(dateTime, skipSet, customSkipDates)) {
    dateTime = dateTime.plus({ days: 1 });
    daysShifted++;

    if (daysShifted >= MAX_SHIFT_DAYS) {
      throw new Error(
        `Unable to find business day after ${dateStr} within ${MAX_SHIFT_DAYS} days. ` +
        `Check holiday data and customSkipDates for errors.`
      );
    }
  }

  return dateTime.toISODate();
}

module.exports = {
  shiftToBusinessDays,
  isBusinessDay,
  nextBusinessDay
};
