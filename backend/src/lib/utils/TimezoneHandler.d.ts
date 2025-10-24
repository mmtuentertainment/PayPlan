/**
 * TimezoneHandler TypeScript Definitions
 */

export class TimezoneHandler {
  constructor();

  /**
   * Set of valid IANA timezone identifiers (readonly)
   */
  readonly validTimezones: ReadonlySet<string>;

  /**
   * Gets the list of valid IANA timezone identifiers (returns immutable view)
   */
  getValidTimezones(): ReadonlySet<string>;

  /**
   * Validates that a timezone string is in valid IANA format
   * @throws {Error} If timezone is invalid
   */
  validateTimezone(timezone: string | null | undefined): void;

  /**
   * Checks if a timezone string is valid IANA format
   */
  isValidTimezone(timezone: string | null | undefined): boolean;

  /**
   * Converts a date (string, Date, or timestamp) to UTC timestamp (milliseconds)
   * @throws {Error} If date is invalid
   */
  toTimestamp(date: string | Date | number): number;

  /**
   * Compares two dates timezone-independently
   * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
   */
  compare(date1: string | Date | number, date2: string | Date | number): number;

  /**
   * Sorts an array of dates in ascending order
   * @returns Sorted array (new array, original not modified)
   */
  sortDates(dates: Array<string | Date | number>): Array<string | Date | number>;

  /**
   * Checks if two dates represent the same instant in time
   */
  areSameInstant(date1: string | Date | number, date2: string | Date | number): boolean;
}

export const timezoneHandler: TimezoneHandler;
