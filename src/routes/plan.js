const express = require('express');
const router = express.Router();
const validatePlanRequest = require('../middleware/validate-plan-request');
const { calculatePaydays } = require('../lib/payday-calculator');
const { shiftToBusinessDays } = require('../lib/business-day-shifter');
const { detectRisks } = require('../lib/risk-detector');
const {
  generateWeeklyActions,
  generateSummary,
  formatRiskFlags,
  normalizeOutput
} = require('../lib/action-prioritizer');
const { generateICSWithTZID } = require('../lib/ics-generator');

/**
 * POST /plan - Generate payment plan
 *
 * Deterministic algorithm (v0.1.2 - 7 steps):
 * 1. Normalize: Parse items → validate schema → sort by due_date
 * 2. Paydays: Derive 3-4 paydays from paycheckDates OR (payCadence, nextPayday)
 * 3. BusinessDayShift: Shift weekend/holiday dates to next business day (if enabled)
 * 4. Risk flags: Detect COLLISION, CASH_CRUNCH, WEEKEND_AUTOPAY (using shifted dates)
 * 5. ActionsThisWeek: Filter next 7 days, sort by late_fee DESC, amount ASC
 * 6. Summary: Generate 6-8 bullet plain-English plan
 * 7. ICS: VEVENT per installment, TZID, VALARM 24h prior at 09:00 (using shifted dates)
 */
router.post('/', validatePlanRequest, async (req, res) => {
  try {
    const {
      items,
      paycheckDates,
      payCadence,
      nextPayday,
      minBuffer,
      timeZone,
      businessDayMode = false,
      country = 'US',
      customSkipDates = []
    } = req.body;

    // Step 1: Normalize and sort installments
    let normalizedInstallments = items
      .map(item => ({
        provider: item.provider,
        installment_no: item.installment_no,
        due_date: item.due_date,
        amount: parseFloat(item.amount),
        currency: item.currency,
        autopay: item.autopay,
        late_fee: parseFloat(item.late_fee)
      }))
      .sort((a, b) => a.due_date.localeCompare(b.due_date)); // Sort by due_date ascending

    // Step 2: Calculate paydays
    const paydays = calculatePaydays({
      paycheckDates,
      payCadence,
      nextPayday,
      timezone: timeZone
    });

    // Step 3: Business-day shift (v0.1.2)
    const { shiftedItems, movedDates } = shiftToBusinessDays(
      normalizedInstallments,
      timeZone,
      { businessDayMode, country, customSkipDates }
    );
    normalizedInstallments = shiftedItems;

    // Step 4: Detect risks (using shifted dates)
    const riskFlags = detectRisks(normalizedInstallments, paydays, minBuffer, timeZone, {
      businessDayMode,
      movedDates
    });

    // Step 5: Generate weekly actions (next 7 days, prioritized)
    const actionsThisWeek = generateWeeklyActions(normalizedInstallments, timeZone);

    // Get weekly installments for summary generation
    const { DateTime } = require('luxon');
    const now = DateTime.now().setZone(timeZone).startOf('day');
    const weekEnd = now.plus({ days: 7 }).endOf('day');
    const weeklyInstallments = normalizedInstallments.filter(installment => {
      const dueDate = DateTime.fromISO(installment.due_date, { zone: timeZone }).startOf('day');
      return dueDate >= now && dueDate <= weekEnd;
    });

    // Step 6: Generate summary
    const summary = generateSummary(
      normalizedInstallments,
      weeklyInstallments,
      riskFlags,
      timeZone
    );

    // Format risk flags as user-friendly strings
    const formattedRiskFlags = formatRiskFlags(riskFlags);

    // Step 7: Generate ICS calendar (using shifted dates)
    const icsBase64 = generateICSWithTZID(normalizedInstallments, timeZone);

    // Generate normalized output
    const normalized = normalizeOutput(normalizedInstallments);

    // Return response (v0.1.2: includes movedDates)
    res.json({
      summary,
      actionsThisWeek,
      riskFlags: formattedRiskFlags,
      ics: icsBase64,
      normalized,
      movedDates
    });

  } catch (error) {
    console.error('Plan generation error:', error);

    // Check if it's a known validation error
    if (error.message.includes('Invalid timezone') ||
        error.message.includes('Invalid date format') ||
        error.message.includes('Must provide either')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Processing Error',
      message: 'Failed to generate payment plan',
      details: error.message
    });
  }
});

module.exports = router;
