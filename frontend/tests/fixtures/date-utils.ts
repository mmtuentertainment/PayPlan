// Date test utilities
// Feature #063: Business Logic Test Coverage
// ADR-003 compliant: Handles Date.setMonth() boundary conditions

/**
 * Create deterministic date in UTC (no timezone issues)
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12, NOT 0-11 like JavaScript Date)
 * @param day - Day of month (1-31)
 * @returns Date object in UTC
 */
export function createDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Get last day of month (handles variable month lengths)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Last day of month (28-31)
 */
export function getLastDayOfMonth(year: number, month: number): number {
  // Day 0 of next month = last day of current month
  const lastDay = new Date(Date.UTC(year, month, 0));
  return lastDay.getUTCDate();
}

/**
 * Get month boundary date (last day of month)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date object set to last day of month
 */
export function getMonthBoundary(year: number, month: number): Date {
  const lastDay = getLastDayOfMonth(year, month);
  return createDate(year, month, lastDay);
}

/**
 * Add months to date (ADR-003 compliant)
 * Handles boundary cases like Jan 31 → Feb 28/29
 * @param date - Starting date
 * @param months - Months to add (can be negative)
 * @returns New date with months added, clamped to valid days
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const startDay = result.getUTCDate();
  const startMonth = result.getUTCMonth();
  const startYear = result.getUTCFullYear();

  // Calculate target month/year
  const targetMonth = startMonth + months;
  const targetYear = startYear + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  // Get last day of target month
  const lastDayOfTargetMonth = getLastDayOfMonth(targetYear, normalizedMonth + 1);

  // Clamp day to valid range (handles Jan 31 → Feb 28)
  const targetDay = Math.min(startDay, lastDayOfTargetMonth);

  return new Date(Date.UTC(targetYear, normalizedMonth, targetDay));
}

/**
 * Check if year is leap year
 * @param year - Year to check
 * @returns True if leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get fiscal year start date (July 1)
 * @param date - Any date in fiscal year
 * @returns July 1 of fiscal year
 */
export function getFiscalYearStart(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // If before July, fiscal year started previous year
  const fiscalYear = month < 6 ? year - 1 : year;

  return createDate(fiscalYear, 7, 1);
}

/**
 * Get fiscal year end date (June 30)
 * @param date - Any date in fiscal year
 * @returns June 30 of fiscal year
 */
export function getFiscalYearEnd(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // If before July, fiscal year ends this year; otherwise next year
  const fiscalYear = month < 6 ? year : year + 1;

  return createDate(fiscalYear, 6, 30);
}
