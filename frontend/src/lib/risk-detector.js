import { DateTime } from 'luxon';

/**
 * Detect financial risks in payment schedule
 * @param {Array} installments - Array of payment installments
 * @param {Array} paydays - Array of payday dates (ISO format)
 * @param {number} minBuffer - Minimum cash buffer amount
 * @param {string} timezone - IANA timezone identifier
 * @returns {Array} Array of risk flags
 */
function detectRisks(installments, paydays, minBuffer, timezone) {
  const risks = [];

  // Group installments by due date for collision detection
  const installmentsByDate = groupByDate(installments);

  // Detect COLLISION risks
  risks.push(...detectCollisions(installmentsByDate, timezone));

  // Detect CASH_CRUNCH risks
  if (paydays && paydays.length > 0) {
    risks.push(...detectCashCrunch(installments, paydays, minBuffer, timezone));
  }

  // Detect WEEKEND_AUTOPAY risks
  risks.push(...detectWeekendAutopay(installments, timezone));

  // Sort risks by date, then severity
  return risks.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return getSeverityScore(b.severity) - getSeverityScore(a.severity);
  });
}

/**
 * Group installments by due date
 */
function groupByDate(installments) {
  return installments.reduce((acc, installment) => {
    const date = installment.due_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(installment);
    return acc;
  }, {});
}

/**
 * Detect COLLISION risks (≥2 installments on same date)
 */
function detectCollisions(installmentsByDate, timezone) {
  const risks = [];

  for (const [date, installments] of Object.entries(installmentsByDate)) {
    if (installments.length >= 2) {
      const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
      const dt = DateTime.fromISO(date, { zone: timezone });
      const dayOfWeek = dt.toFormat('EEEE'); // Full day name

      risks.push({
        type: 'COLLISION',
        severity: installments.length > 2 ? 'high' : 'medium',
        date: date,
        message: `${installments.length} payments due on ${date} (${dayOfWeek})`,
        amount: totalAmount,
        affectedInstallments: installments.map(i => ({
          provider: i.provider,
          amount: i.amount
        }))
      });
    }
  }

  return risks;
}

/**
 * Detect CASH_CRUNCH risks (payments within 3 days of payday exceed minBuffer)
 */
function detectCashCrunch(installments, paydays, minBuffer, timezone) {
  const risks = [];

  for (const payday of paydays) {
    const paydayDt = DateTime.fromISO(payday, { zone: timezone });

    // Find all installments within 3 days before or after payday
    const nearPaydayInstallments = installments.filter(installment => {
      const dueDateDt = DateTime.fromISO(installment.due_date, { zone: timezone });
      const daysDiff = Math.abs(dueDateDt.diff(paydayDt, 'days').days);
      return daysDiff <= 3;
    });

    if (nearPaydayInstallments.length > 0) {
      const totalAmount = nearPaydayInstallments.reduce((sum, i) => sum + i.amount, 0);
      const overage = totalAmount - minBuffer;

      // Only flag if total exceeds buffer
      if (overage > 0) {
        const count = nearPaydayInstallments.length;
        const severity = overage >= 250 ? 'high' : 'medium';

        risks.push({
          type: 'CASH_CRUNCH',
          severity: severity,
          date: payday,
          message: `${count} payment${count > 1 ? 's' : ''} totaling $${totalAmount.toFixed(2)} due near payday on ${payday}`,
          amount: totalAmount,
          affectedInstallments: nearPaydayInstallments.map(i => ({
            provider: i.provider,
            amount: i.amount,
            due_date: i.due_date
          }))
        });
      }
    }
  }

  return risks;
}

/**
 * Detect WEEKEND_AUTOPAY risks (autopay payments due on weekends)
 */
function detectWeekendAutopay(installments, timezone) {
  const risks = [];
  const toBool = (v) => (typeof v === 'boolean' ? v : String(v).toLowerCase() === 'true');

  for (const installment of installments) {
    // Only check autopay-enabled payments (strict boolean check)
    if (!toBool(installment.autopay)) continue;

    const dueDateDt = DateTime.fromISO(installment.due_date, { zone: timezone });
    const dayOfWeek = dueDateDt.weekday; // 1-7, where 6=Saturday, 7=Sunday

    if (dayOfWeek === 6 || dayOfWeek === 7) {
      const dayName = dueDateDt.toFormat('EEEE');

      risks.push({
        type: 'WEEKEND_AUTOPAY',
        severity: 'low',
        date: installment.due_date,
        message: `Autopay payment due on ${dayName} ${installment.due_date} - potential processing delay`,
        amount: installment.amount,
        affectedInstallments: [{
          provider: installment.provider,
          amount: installment.amount
        }]
      });
    }
  }

  return risks;
}

/**
 * Get numeric score for severity level
 */
function getSeverityScore(severity) {
  const scores = {
    high: 3,
    medium: 2,
    low: 1
  };
  return scores[severity] || 0;
}

export { detectRisks };