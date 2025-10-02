/**
 * Vercel Serverless Function: POST /api/plan
 *
 * Generates BNPL payment plan with business-day awareness (v0.1.2)
 *
 * This serverless function wraps the core Express route logic from /src/routes/plan.js
 * and makes it compatible with Vercel's serverless architecture.
 */

const validatePlanRequest = require('../src/middleware/validate-plan-request');
const { calculatePaydays } = require('../src/lib/payday-calculator');
const { shiftToBusinessDays } = require('../src/lib/business-day-shifter');
const { detectRisks } = require('../src/lib/risk-detector');
const {
  generateWeeklyActions,
  generateSummary,
  formatRiskFlags,
  normalizeOutput
} = require('../src/lib/action-prioritizer');
const { generateICSWithTZID } = require('../src/lib/ics-generator');

/**
 * Serverless function handler
 *
 * @param {Request} req - Vercel request object
 * @param {Response} res - Vercel response object
 */
module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      type: `${req.headers.host}/problems/method-not-allowed`,
      title: 'Method Not Allowed',
      status: 405,
      detail: 'Only POST requests are supported',
      instance: req.url
    });
  }

  // CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Run validation middleware
    // Create middleware-compatible req/res wrapper
    await new Promise((resolve, reject) => {
      validatePlanRequest(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

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
      .sort((a, b) => a.due_date.localeCompare(b.due_date));

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
    return res.status(200).json({
      summary,
      actionsThisWeek,
      riskFlags: formattedRiskFlags,
      ics: icsBase64,
      normalized,
      movedDates
    });

  } catch (error) {
    console.error('Plan generation error:', error);

    // RFC 9457 Problem Details format
    const problemDetail = {
      type: `${req.headers.host}/problems/internal-error`,
      title: 'Internal Server Error',
      status: 500,
      detail: error.message || 'Failed to generate payment plan',
      instance: req.url
    };

    // Check if it's a known validation error
    if (error.message?.includes('Invalid timezone') ||
        error.message?.includes('Invalid date format') ||
        error.message?.includes('Must provide either') ||
        error.message?.includes('paycheckDates must contain at least')) {
      problemDetail.type = `${req.headers.host}/problems/validation-error`;
      problemDetail.title = 'Validation Error';
      problemDetail.status = 400;
    }

    return res.status(problemDetail.status).json(problemDetail);
  }
};
