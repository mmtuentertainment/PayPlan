const { generateICSWithTZID } = require('../../src/lib/ics-generator');

describe('generateICSWithTZID', () => {
  it('escapes special characters, folds long lines, and sets UTC timestamps', () => {
    const installments = [{
      provider: 'ACME, Inc.; Payment Services With Very Long Descriptor That Needs Folding 1234567890',
      installment_no: 1,
      due_date: '2025-10-04',
      amount: 123.45,
      currency: 'USD',
      autopay: true,
      late_fee: 15.5,
      wasShifted: true,
      originalDueDate: '2025-10-03',
      shiftedDueDate: '2025-10-04',
      shiftReason: 'WEEKEND'
    }];

    const payload = generateICSWithTZID(installments, 'America/New_York');
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const unfolded = decoded.replace(/\r\n[\t ]/g, ''); // RFC5545 line unfolding for assertions

    expect(decoded).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    expect(unfolded).toContain('SUMMARY:BNPL Payment: ACME\\, Inc.\\; Payment Services With Very Long Descriptor That Needs Folding 1234567890 $123.45 (shifted)');
    expect(unfolded).toContain('DESCRIPTION:Payment due to ACME\\, Inc.\\; Payment Services With Very Long Descriptor That Needs Folding 1234567890\\nAmount: $123.45');
    expect(unfolded).toContain('\\nLate fee if missed: $15.50');
    expect(decoded).toMatch(/SUMMARY:.*\r\n /);
  });
});
