const { DateTime } = require('luxon');

/**
 * Prioritize and format weekly actions
 * @param {Array} installments - All installments
 * @param {string} timezone - IANA timezone
 * @returns {Array} Prioritized action strings for the next 7 days
 */
function generateWeeklyActions(installments, timezone) {
  const now = DateTime.now().setZone(timezone).startOf('day');
  const weekEnd = now.plus({ days: 7 }).endOf('day');

  // Filter installments due in next 7 days (inclusive of today)
  const upcomingInstallments = installments.filter(installment => {
    const dueDate = DateTime.fromISO(installment.due_date, { zone: timezone }).startOf('day');
    return dueDate >= now && dueDate <= weekEnd;
  });

  // Sort by priority: late_fee DESC (highest first), then amount ASC (smallest first)
  const prioritized = upcomingInstallments.sort((a, b) => {
    if (a.late_fee !== b.late_fee) {
      return b.late_fee - a.late_fee; // Higher late fee first
    }
    return a.amount - b.amount; // Smaller amount first
  });

  // Format as action strings
  return prioritized.map(installment => {
    const dueDate = DateTime.fromISO(installment.due_date, { zone: timezone });
    const dayOfWeek = dueDate.toFormat('EEEE');
    const monthDay = dueDate.toFormat('MMM d');

    let action = `${dayOfWeek} ${monthDay}: Pay ${installment.provider} $${installment.amount.toFixed(2)}`;

    if (installment.late_fee > 0) {
      if (installment.late_fee === Math.max(...prioritized.map(i => i.late_fee))) {
        action += ` (highest late fee $${installment.late_fee.toFixed(0)})`;
      } else {
        action += ` (late fee $${installment.late_fee.toFixed(0)})`;
      }
    }

    // Add weekend warning for autopay
    if (installment.autopay && (dueDate.weekday === 6 || dueDate.weekday === 7)) {
      action += ' - verify autopay processes on weekends';
    }

    return action;
  });
}

/**
 * Generate plain-English summary of the week
 * @param {Array} installments - All installments
 * @param {Array} weeklyInstallments - Installments due this week
 * @param {Array} riskFlags - Detected risks
 * @param {string} timezone - IANA timezone
 * @returns {string} Multi-line summary (6-8 bullet points)
 */
function generateSummary(installments, weeklyInstallments, riskFlags, timezone) {
  const bulletPoints = [];

  // 1. Opening line with total and count
  const totalDue = weeklyInstallments.reduce((sum, i) => sum + i.amount, 0);
  const count = weeklyInstallments.length;

  if (count === 0) {
    return "✅ Great news! No BNPL payments due in the next 7 days. Take this opportunity to review your upcoming obligations and plan ahead for next week.";
  }

  bulletPoints.push(
    `You have ${count} BNPL payment${count > 1 ? 's' : ''} totaling $${totalDue.toFixed(2)} due this week.`
  );

  // 2. Highlight highest risk
  const highRisks = riskFlags.filter(r => r.severity === 'high');
  if (highRisks.length > 0) {
    const risk = highRisks[0];
    if (risk.type === 'COLLISION') {
      bulletPoints.push(`⚠️ High Risk: ${risk.message.split(' ').slice(0, 7).join(' ')}`);
    } else if (risk.type === 'CASH_CRUNCH') {
      bulletPoints.push(`⚠️ High Risk: Cash crunch detected - ${risk.message.split(' ').slice(0, 8).join(' ')}`);
    }
  }

  // 3. Note any collisions
  const collisions = riskFlags.filter(r => r.type === 'COLLISION');
  if (collisions.length > 0 && highRisks.length === 0) {
    bulletPoints.push(`⚠️ ${collisions[0].message}`);
  }

  // 4. Mention cash crunch if present
  const cashCrunch = riskFlags.filter(r => r.type === 'CASH_CRUNCH');
  if (cashCrunch.length > 0 && !highRisks.some(r => r.type === 'CASH_CRUNCH')) {
    bulletPoints.push(`💰 ${cashCrunch[0].message}`);
  }

  // 5-7. Priority payment guidance (top 3)
  const sortedByPriority = [...weeklyInstallments].sort((a, b) => {
    if (a.late_fee !== b.late_fee) return b.late_fee - a.late_fee;
    return a.amount - b.amount;
  });

  const top3 = sortedByPriority.slice(0, 3);
  top3.forEach((installment, index) => {
    const emoji = index === 0 ? '🔴' : index === 1 ? '🟡' : '🟢';
    const priority = index === 0 ? 'Priority' : index === 1 ? 'Then' : 'Finally';
    const reason = index === 0 && installment.late_fee === Math.max(...sortedByPriority.map(i => i.late_fee))
      ? ` ($${installment.amount.toFixed(0)}, $${installment.late_fee.toFixed(0)} late fee)`
      : ` ($${installment.amount.toFixed(0)})`;

    bulletPoints.push(`${emoji} ${priority}: Pay ${installment.provider}${reason}`);
  });

  // 8. Recommendation or encouragement
  if (riskFlags.some(r => r.severity === 'high')) {
    const lowestLateFee = sortedByPriority[sortedByPriority.length - 1];
    if (lowestLateFee) {
      bulletPoints.push(`Consider contacting ${lowestLateFee.provider} to defer if cash is tight.`);
    }
  } else {
    bulletPoints.push("You've got this! Stay on top of these payments this week.");
  }

  return bulletPoints.join('\n');
}

/**
 * Format risk flags as user-friendly strings
 * @param {Array} riskFlags - Risk flag objects
 * @returns {Array} Human-readable risk strings
 */
function formatRiskFlags(riskFlags) {
  return riskFlags.map(risk => {
    switch (risk.type) {
      case 'COLLISION':
        return `⚠️ COLLISION: ${risk.message}`;
      case 'CASH_CRUNCH':
        return `💰 CASH_CRUNCH: ${risk.message}`;
      case 'WEEKEND_AUTOPAY':
        return `🔔 WEEKEND_AUTOPAY: ${risk.message}`;
      default:
        return risk.message;
    }
  });
}

/**
 * Generate normalized installment output
 * @param {Array} installments - All installments
 * @returns {Array} Simplified normalized format
 */
function normalizeOutput(installments) {
  return installments.map(i => {
    const normalized = {
      provider: i.provider,
      dueDate: i.due_date,
      amount: i.amount
    };

    // v0.1.2: Include business-day shift fields if present
    if (i.wasShifted !== undefined) {
      normalized.wasShifted = i.wasShifted;
    }
    if (i.originalDueDate) {
      normalized.originalDueDate = i.originalDueDate;
    }
    if (i.shiftedDueDate) {
      normalized.shiftedDueDate = i.shiftedDueDate;
    }
    if (i.shiftReason) {
      normalized.shiftReason = i.shiftReason;
    }

    return normalized;
  });
}

module.exports = {
  generateWeeklyActions,
  generateSummary,
  formatRiskFlags,
  normalizeOutput
};