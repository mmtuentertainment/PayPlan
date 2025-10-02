const { DateTime } = require('luxon');

/**
 * Validate POST /plan request body
 */
function validatePlanRequest(req, res, next) {
  const {
    items,
    paycheckDates,
    payCadence,
    nextPayday,
    minBuffer,
    timeZone,
    businessDayMode,
    country,
    customSkipDates
  } = req.body;

  const errors = [];

  // Validate items array
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'items array is required and must be an array'
    });
  }

  if (items.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'items array must contain at least 1 installment'
    });
  }

  if (items.length > 100) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'items array cannot exceed 100 installments'
    });
  }

  // Validate each installment
  items.forEach((item, index) => {
    if (!item.provider) {
      errors.push(`Item ${index}: provider is required`);
    }

    if (!item.installment_no || item.installment_no < 1) {
      errors.push(`Item ${index}: installment_no must be >= 1`);
    }

    if (!item.due_date || !isValidISODate(item.due_date)) {
      errors.push(`Item ${index}: due_date must be in ISO format (yyyy-mm-dd)`);
    }

    if (item.amount === undefined || item.amount <= 0) {
      errors.push(`Item ${index}: amount must be > 0`);
    }

    if (!item.currency) {
      errors.push(`Item ${index}: currency is required`);
    }

    if (item.autopay === undefined) {
      errors.push(`Item ${index}: autopay is required (boolean)`);
    }

    if (item.late_fee === undefined || item.late_fee < 0) {
      errors.push(`Item ${index}: late_fee must be >= 0`);
    }
  });

  // Validate payday information
  if (!paycheckDates && !nextPayday) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Must provide either paycheckDates OR (payCadence + nextPayday)'
    });
  }

  if (paycheckDates) {
    if (!Array.isArray(paycheckDates) || paycheckDates.length < 3) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'paycheckDates must be an array with at least 3 dates'
      });
    }

    paycheckDates.forEach((date, index) => {
      if (!isValidISODate(date)) {
        errors.push(`paycheckDates[${index}]: invalid date format, use yyyy-mm-dd`);
      }
    });
  }

  if (nextPayday && !isValidISODate(nextPayday)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'nextPayday must be in ISO format (yyyy-mm-dd)'
    });
  }

  if (payCadence && !['weekly', 'biweekly', 'semimonthly', 'monthly'].includes(payCadence)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: "payCadence must be one of: 'weekly', 'biweekly', 'semimonthly', 'monthly'"
    });
  }

  // Validate minBuffer
  if (minBuffer === undefined || minBuffer < 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'minBuffer is required and must be >= 0'
    });
  }

  // Validate timezone
  if (!timeZone) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'timeZone is required (IANA timezone identifier)'
    });
  }

  const testDate = DateTime.now().setZone(timeZone);
  if (!testDate.isValid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid IANA timezone: '${timeZone}'. Examples: 'America/New_York', 'America/Los_Angeles'`
    });
  }

  // Validate business day mode fields (v0.1.2)
  if (businessDayMode !== undefined && typeof businessDayMode !== 'boolean') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'businessDayMode must be a boolean'
    });
  }

  if (country !== undefined) {
    if (typeof country !== 'string' || country.length > 10) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'country must be a string'
      });
    }
    const normalizedCountry = country.trim().toUpperCase();
    if (!['US', 'NONE'].includes(normalizedCountry)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'country must be either "US" or "None" (case-insensitive)'
      });
    }
    // Replace with normalized value for downstream handlers
    req.body.country = normalizedCountry === 'NONE' ? 'None' : normalizedCountry;
  }

  if (customSkipDates !== undefined) {
    if (!Array.isArray(customSkipDates)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'customSkipDates must be an array'
      });
    }

    if (customSkipDates.length > 100) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'customSkipDates cannot exceed 100 dates'
      });
    }

    customSkipDates.forEach((date, index) => {
      if (!isValidISODate(date)) {
        errors.push(`customSkipDates[${index}]: invalid date format, use yyyy-mm-dd`);
      }
    });
  }

  // If there are any validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: errors
    });
  }

  next();
}

/**
 * Validate ISO 8601 date format
 */
function isValidISODate(dateString) {
  if (typeof dateString !== 'string') return false;

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) return false;

  const date = DateTime.fromISO(dateString);
  return date.isValid;
}

module.exports = validatePlanRequest;