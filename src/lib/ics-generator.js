const { DateTime } = require('luxon');
const ics = require('ics');

/**
 * Generate ICS calendar file with payment reminders
 * @param {Array} installments - Payment installments
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} Base64-encoded ICS file content
 */
function generateICS(installments, timezone) {
  const events = installments.map(installment => {
    const dueDate = DateTime.fromISO(installment.due_date, { zone: timezone });

    // Create event at 09:00 local time on due date
    const startDateTime = dueDate.set({ hour: 9, minute: 0, second: 0 });

    const event = {
      start: [
        startDateTime.year,
        startDateTime.month,
        startDateTime.day,
        startDateTime.hour,
        startDateTime.minute
      ],
      duration: { minutes: 30 },
      title: `BNPL Payment: ${installment.provider} $${installment.amount.toFixed(2)}`,
      description: [
        `Payment due to ${installment.provider}`,
        `Amount: $${installment.amount.toFixed(2)}`,
        `Installment: ${installment.installment_no}`,
        `Late fee if missed: $${installment.late_fee.toFixed(2)}`,
        installment.autopay ? 'Autopay: Enabled' : 'Autopay: Disabled'
      ].join('\\n'),
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'PayPlan', email: 'noreply@payplan.app' },
      alarms: [
        {
          action: 'display',
          description: `Reminder: ${installment.provider} payment of $${installment.amount.toFixed(2)} due tomorrow`,
          trigger: { hours: 24, minutes: 0, before: true } // 24 hours before, at 09:00
        }
      ]
    };

    return event;
  });

  // Generate ICS content
  const { error, value } = ics.createEvents(events);

  if (error) {
    throw new Error(`Failed to generate ICS: ${error.message || error}`);
  }

  // Base64 encode the ICS content
  return Buffer.from(value).toString('base64');
}

/**
 * Generate ICS with manual TZID handling (alternative if ics library doesn't support it well)
 * @param {Array} installments - Payment installments
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} Base64-encoded ICS file content with explicit TZID
 */
function generateICSWithTZID(installments, timezone) {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PayPlan//BNPL Payment Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-TIMEZONE:${timezone}`,
    ''
  ];

  installments.forEach((installment, index) => {
    const dueDate = DateTime.fromISO(installment.due_date, { zone: timezone });
    const startDateTime = dueDate.set({ hour: 9, minute: 0, second: 0 });
    const endDateTime = startDateTime.plus({ minutes: 30 });
    const alarmDateTime = startDateTime.minus({ days: 1 });

    const uid = `payplan-${installment.provider.toLowerCase()}-${installment.installment_no}-${installment.due_date}@payplan.app`;

    // v0.1.2: Add "(shifted)" annotation if date was moved
    let summary = `BNPL Payment: ${installment.provider} $${installment.amount.toFixed(2)}`;
    if (installment.wasShifted) {
      summary += ' (shifted)';
    }

    // v0.1.2: Add original due date to description if shifted
    let description = `Payment due to ${installment.provider}\\nAmount: $${installment.amount.toFixed(2)}\\nInstallment: ${installment.installment_no}`;
    if (installment.wasShifted) {
      description += `\\nOriginally due: ${installment.originalDueDate}\\nShifted to: ${installment.shiftedDueDate}\\nReason: ${installment.shiftReason}`;
    }
    description += `\\nLate fee if missed: $${installment.late_fee.toFixed(2)}\\nAutopay: ${installment.autopay ? 'Enabled' : 'Disabled'}`;

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:${uid}`);
    icsContent.push(`DTSTART;TZID=${timezone}:${formatICSDateTime(startDateTime)}`);
    icsContent.push(`DTEND;TZID=${timezone}:${formatICSDateTime(endDateTime)}`);
    icsContent.push(`DTSTAMP:${formatICSDateTime(DateTime.now().toUTC())}`);
    icsContent.push(`SUMMARY:${summary}`);
    icsContent.push(`DESCRIPTION:${description}`);
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('BEGIN:VALARM');
    icsContent.push('TRIGGER:-P1DT0H0M0S');
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:Reminder: ${installment.provider} payment of $${installment.amount.toFixed(2)} due tomorrow`);
    icsContent.push('END:VALARM');
    icsContent.push('END:VEVENT');
    icsContent.push('');
  });

  icsContent.push('END:VCALENDAR');

  const icsString = icsContent.join('\r\n');
  return Buffer.from(icsString).toString('base64');
}

/**
 * Format DateTime for ICS format (YYYYMMDDTHHMMSS)
 */
function formatICSDateTime(dateTime) {
  return dateTime.toFormat('yyyyMMdd\'T\'HHmmss');
}

module.exports = {
  generateICS,
  generateICSWithTZID
};