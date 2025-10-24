/**
 * TimezoneHandler - Timezone-independent date validation and comparison
 *
 * Feature: 018-technical-debt-cleanup (Phase 4, User Story 3, P2)
 * Tasks: T074-T078
 *
 * Provides timezone-aware date handling to prevent bugs from timezone-dependent
 * string comparisons. All dates are normalized to UTC timestamps for comparison.
 *
 * Key Features:
 * - IANA timezone validation
 * - UTC timestamp normalization
 * - Timezone-independent date sorting
 * - DST-aware comparisons
 *
 * @example
 * const handler = new TimezoneHandler();
 * handler.validateTimezone('America/New_York'); // OK
 * handler.validateTimezone('EST'); // Throws (not IANA format)
 *
 * const ts = handler.toTimestamp('2025-01-15T10:00:00-05:00');
 * handler.compare(date1, date2); // Returns -1, 0, or 1
 */

class TimezoneHandler {
  constructor() {
    /**
     * List of valid IANA timezone identifiers
     * Generated from Intl.supportedValuesOf('timeZone') in modern browsers
     * Cached for performance
     */
    this.validTimezones = this.getValidTimezones();
  }

  /**
   * Gets the list of valid IANA timezone identifiers supported by the runtime
   *
   * @returns {Set<string>} Set of valid timezone strings
   * @private
   */
  getValidTimezones() {
    try {
      // Modern Node.js and browsers support Intl.supportedValuesOf
      if (Intl.supportedValuesOf) {
        return new Set(Intl.supportedValuesOf('timeZone'));
      }
    } catch (error) {
      // Fallback: use a static list of common IANA timezones
    }

    // Fallback list of common IANA timezones
    return new Set([
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'America/Toronto',
      'America/Vancouver',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Rome',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Hong_Kong',
      'Asia/Singapore',
      'Asia/Dubai',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Pacific/Auckland',
      'Africa/Cairo',
      'America/Sao_Paulo',
    ]);
  }

  /**
   * Validates that a timezone string is in valid IANA format
   *
   * @param {string} timezone - Timezone string to validate
   * @throws {Error} If timezone is invalid
   *
   * @example
   * handler.validateTimezone('America/New_York'); // OK
   * handler.validateTimezone('EST'); // Throws
   */
  validateTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') {
      throw new Error('Invalid timezone: must be a non-empty string');
    }

    if (!this.isValidTimezone(timezone)) {
      throw new Error(
        `Invalid timezone: "${timezone}". Must be a valid IANA timezone identifier (e.g., "America/New_York", "Europe/London", "UTC")`
      );
    }
  }

  /**
   * Checks if a timezone string is valid IANA format
   *
   * @param {string} timezone - Timezone string to check
   * @returns {boolean} True if valid
   *
   * @example
   * handler.isValidTimezone('America/New_York'); // true
   * handler.isValidTimezone('PST'); // false
   */
  isValidTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') {
      return false;
    }

    // Reject timezone abbreviations (3-4 uppercase letters), except UTC which is valid
    if (/^[A-Z]{3,4}$/.test(timezone) && timezone !== 'UTC') {
      return false;
    }

    // Reject offset notation (e.g., GMT+5, UTC+5:30)
    if (/^(GMT|UTC)[+-]\d/.test(timezone)) {
      return false;
    }

    // Check against cached valid timezones
    if (this.validTimezones.has(timezone)) {
      return true;
    }

    // Additional validation: try to use the timezone with Intl.DateTimeFormat
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      // If successful, add to cache for future use
      this.validTimezones.add(timezone);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Converts a date (string, Date, or timestamp) to UTC timestamp (milliseconds)
   *
   * @param {string|Date|number} date - Date to convert
   * @returns {number} UTC timestamp in milliseconds
   * @throws {Error} If date is invalid
   *
   * @example
   * handler.toTimestamp('2025-01-15T10:00:00-05:00'); // UTC timestamp
   * handler.toTimestamp(new Date()); // Current timestamp
   * handler.toTimestamp(1698172800000); // Returns same number
   */
  toTimestamp(date) {
    // Handle Unix timestamp (number)
    if (typeof date === 'number') {
      if (isNaN(date) || !isFinite(date)) {
        throw new Error('Invalid timestamp: must be a finite number');
      }
      return date;
    }

    // Handle Date object
    if (date instanceof Date) {
      const timestamp = date.getTime();
      if (isNaN(timestamp)) {
        throw new Error('Invalid Date object');
      }
      return timestamp;
    }

    // Handle string
    if (typeof date === 'string') {
      // ISO 8601 strings without timezone: treated as UTC (with console warning)
      // Best practice: always provide explicit timezone (Z or +/-HH:MM)
      let dateStr = date;
      if (!/Z|[+-]\d{2}:\d{2}$/.test(date)) {
        // Warn about ambiguous date but maintain backward compatibility
        // Note: Redact date string to avoid logging PII
        if (typeof console !== 'undefined' && console.warn && process.env.NODE_ENV !== 'production') {
          console.warn(
            '[TimezoneHandler] Ambiguous date string without timezone detected (value redacted for security). ' +
            'Assuming UTC. For clarity, use explicit timezone (e.g., "2025-01-15T10:00:00Z" or "2025-01-15T10:00:00-05:00")'
          );
        }
        dateStr = date + 'Z'; // Assume UTC for backward compatibility
      }

      const parsed = new Date(dateStr);
      const timestamp = parsed.getTime();

      if (isNaN(timestamp)) {
        throw new Error(`Invalid date string: "${date}"`);
      }

      return timestamp;
    }

    throw new Error(`Unsupported date type: ${typeof date}`);
  }

  /**
   * Compares two dates timezone-independently
   *
   * @param {string|Date|number} date1 - First date
   * @param {string|Date|number} date2 - Second date
   * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
   *
   * @example
   * handler.compare('2025-01-15T10:00:00-08:00', '2025-01-15T13:00:00-05:00');
   * // Returns -1 (first date is earlier)
   */
  compare(date1, date2) {
    const ts1 = this.toTimestamp(date1);
    const ts2 = this.toTimestamp(date2);

    if (ts1 < ts2) return -1;
    if (ts1 > ts2) return 1;
    return 0;
  }

  /**
   * Sorts an array of dates in ascending order (earliest first)
   *
   * @param {Array<string|Date|number>} dates - Array of dates to sort
   * @returns {Array} Sorted array (new array, original not modified)
   *
   * @example
   * const sorted = handler.sortDates([
   *   '2025-01-15T10:00:00-08:00',
   *   '2025-01-15T08:00:00-05:00',
   * ]);
   */
  sortDates(dates) {
    return [...dates].sort((a, b) => this.compare(a, b));
  }

  /**
   * Checks if two dates represent the same instant in time
   *
   * @param {string|Date|number} date1 - First date
   * @param {string|Date|number} date2 - Second date
   * @returns {boolean} True if same instant
   *
   * @example
   * handler.areSameInstant(
   *   '2025-01-15T10:00:00-08:00',
   *   '2025-01-15T18:00:00Z'
   * ); // true
   */
  areSameInstant(date1, date2) {
    return this.compare(date1, date2) === 0;
  }
}

/**
 * Default singleton instance
 *
 * @example
 * const { timezoneHandler } = require('./TimezoneHandler');
 * timezoneHandler.validateTimezone('America/New_York');
 */
const timezoneHandler = new TimezoneHandler();

// CommonJS exports for Node.js backend
module.exports = {
  TimezoneHandler,
  timezoneHandler,
};
