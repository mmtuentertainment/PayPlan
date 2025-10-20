const { DateTime } = require('luxon');

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

  // Build skip context: weekends + holidays + custom dates
  const skipContext = buildSkipContext(country, customSkipDates);

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
    while (true) {
      const candidate = getNonBusinessReason(dateTime, skipContext);
      if (!candidate) {
        break;
      }

      if (!reason || priority[candidate] > priority[reason]) {
        reason = candidate;
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
function buildSkipContext(country, customSkipDates) {
  return {
    country,
    customSkipDates: new Set(customSkipDates),
    holidaysByYear: new Map()
  };
}

function isNonBusinessDay(dateTime, skipContext) {
  return Boolean(getNonBusinessReason(dateTime, skipContext));
}

function getNonBusinessReason(dateTime, skipContext) {
  const dateKey = dateTime.toISODate();

  if (skipContext.customSkipDates.has(dateKey)) {
    return 'CUSTOM';
  }

  if (skipContext.country !== 'None' && isHoliday(dateTime, skipContext)) {
    return 'HOLIDAY';
  }

  const dayOfWeek = dateTime.weekday; // 1=Mon, 7=Sun
  if (dayOfWeek === 6 || dayOfWeek === 7) {
    return 'WEEKEND';
  }

  return null;
}

function isHoliday(dateTime, skipContext) {
  if (skipContext.country !== 'US') {
    return false;
  }

  const dateKey = dateTime.toISODate();
  const currentYearHolidays = ensureHolidaySet(skipContext, dateTime.year);
  if (currentYearHolidays.has(dateKey)) {
    return true;
  }

  // Handle observed holidays that fall in adjacent years (e.g., Jan 1 on weekend)
  const nextYearHolidays = ensureHolidaySet(skipContext, dateTime.year + 1);
  return nextYearHolidays.has(dateKey);
}

function ensureHolidaySet(skipContext, year) {
  if (!skipContext.holidaysByYear.has(year)) {
    if (skipContext.country === 'US') {
      skipContext.holidaysByYear.set(year, computeUsFederalHolidays(year));
    } else {
      skipContext.holidaysByYear.set(year, new Set());
    }
  }

  return skipContext.holidaysByYear.get(year);
}

function computeUsFederalHolidays(year) {
  const holidays = new Set();

  const addHoliday = (dt) => {
    if (!dt || !dt.isValid) return;
    holidays.add(dt.toISODate());

    // Capture observed holiday adjustments for weekend occurrences
    if (dt.weekday === 6) {
      holidays.add(dt.minus({ days: 1 }).toISODate());
    } else if (dt.weekday === 7) {
      holidays.add(dt.plus({ days: 1 }).toISODate());
    }
  };

  // Fixed-date holidays with observed adjustments
  addHoliday(DateTime.fromObject({ year, month: 1, day: 1 }));   // New Year's Day
  addHoliday(DateTime.fromObject({ year, month: 6, day: 19 }));  // Juneteenth
  addHoliday(DateTime.fromObject({ year, month: 7, day: 4 }));   // Independence Day
  addHoliday(DateTime.fromObject({ year, month: 11, day: 11 })); // Veterans Day
  addHoliday(DateTime.fromObject({ year, month: 12, day: 25 })); // Christmas Day

  // Floating holidays
  addHoliday(nthWeekdayOfMonth(year, 1, 1, 3)); // Martin Luther King Jr. Day (3rd Monday in Jan)
  addHoliday(nthWeekdayOfMonth(year, 2, 1, 3)); // Presidents' Day (3rd Monday in Feb)
  addHoliday(lastWeekdayOfMonth(year, 5, 1));   // Memorial Day (last Monday in May)
  addHoliday(nthWeekdayOfMonth(year, 9, 1, 1)); // Labor Day (1st Monday in Sep)
  addHoliday(nthWeekdayOfMonth(year, 10, 1, 2)); // Columbus Day (2nd Monday in Oct)
  addHoliday(nthWeekdayOfMonth(year, 11, 4, 4)); // Thanksgiving (4th Thursday in Nov)

  return holidays;
}

function nthWeekdayOfMonth(year, month, weekday, occurrence) {
  let date = DateTime.fromObject({ year, month, day: 1 });
  let count = 0;

  while (date.month === month) {
    if (date.weekday === weekday) {
      count += 1;
      if (count === occurrence) {
        return date;
      }
    }
    date = date.plus({ days: 1 });
  }

  return DateTime.invalid('Invalid occurrence for nthWeekdayOfMonth');
}

function lastWeekdayOfMonth(year, month, weekday) {
  const daysInMonth = DateTime.fromObject({ year, month, day: 1 }).daysInMonth;
  let date = DateTime.fromObject({ year, month, day: daysInMonth });

  while (date.month === month) {
    if (date.weekday === weekday) {
      return date;
    }
    date = date.minus({ days: 1 });
  }

  return DateTime.invalid('Unable to find last weekday of month');
}

function isBusinessDay(dateStr, timeZone, country = 'US', customSkipDates = []) {
  const skipContext = buildSkipContext(country, customSkipDates);
  const dateTime = DateTime.fromISO(dateStr, { zone: timeZone });

  if (!dateTime.isValid) {
    return false;
  }

  return !isNonBusinessDay(dateTime, skipContext);
}

function nextBusinessDay(dateStr, timeZone, country = 'US', customSkipDates = []) {
  const skipContext = buildSkipContext(country, customSkipDates);
  let dateTime = DateTime.fromISO(dateStr, { zone: timeZone });

  if (!dateTime.isValid) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  dateTime = dateTime.plus({ days: 1 });

  let daysShifted = 0;
  const MAX_SHIFT_DAYS = 365;

  while (isNonBusinessDay(dateTime, skipContext)) {
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
