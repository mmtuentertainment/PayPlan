const { detectRisks } = require('../../src/lib/risk-detector');

describe('RiskDetector', () => {
  const timezone = 'America/New_York';
  const minBuffer = 200.00;

  describe('COLLISION risk detection', () => {
    it('should detect when 2 payments are due on same date', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-02', amount: 45.00, currency: 'USD', autopay: true, late_fee: 7.00 },
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-02', amount: 58.00, currency: 'USD', autopay: false, late_fee: 15.00 }
      ];

      const result = detectRisks(installments, [], minBuffer, timezone);

      const collisions = result.filter(r => r.type === 'COLLISION');
      expect(collisions.length).toBe(1);
      expect(collisions[0].severity).toBe('medium');
      expect(collisions[0].date).toBe('2025-10-02');
      expect(collisions[0].message).toContain('2 payments');
    });

    it('should detect high severity when 3+ payments collide', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-15', amount: 45.00, currency: 'USD', autopay: true, late_fee: 7.00 },
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-15', amount: 58.00, currency: 'USD', autopay: false, late_fee: 15.00 },
        { provider: 'Afterpay', installment_no: 2, due_date: '2025-10-15', amount: 32.50, currency: 'USD', autopay: true, late_fee: 8.00 }
      ];

      const result = detectRisks(installments, [], minBuffer, timezone);

      const collisions = result.filter(r => r.type === 'COLLISION');
      expect(collisions.length).toBe(1);
      expect(collisions[0].severity).toBe('high');
      expect(collisions[0].message).toContain('3 payments');
    });

    it('should not flag single payment days', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-02', amount: 45.00, currency: 'USD', autopay: true, late_fee: 7.00 },
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-05', amount: 58.00, currency: 'USD', autopay: false, late_fee: 15.00 }
      ];

      const result = detectRisks(installments, [], minBuffer, timezone);

      const collisions = result.filter(r => r.type === 'COLLISION');
      expect(collisions.length).toBe(0);
    });
  });

  describe('CASH_CRUNCH risk detection', () => {
    it('should detect when payments within 3 days of payday exceed minBuffer', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-03', amount: 100.00, currency: 'USD', autopay: true, late_fee: 7.00 },
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-06', amount: 150.00, currency: 'USD', autopay: false, late_fee: 15.00 }
      ];
      const paydays = ['2025-10-05', '2025-10-19'];

      const result = detectRisks(installments, paydays, 200.00, timezone);

      const cashCrunch = result.filter(r => r.type === 'CASH_CRUNCH');
      expect(cashCrunch.length).toBe(1);
      expect(cashCrunch[0].message).toContain('$250.00');
      expect(cashCrunch[0].message).toContain('2025-10-05');
    });

    it('should calculate 3 days before and after payday', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-02', amount: 100.00, currency: 'USD', autopay: true, late_fee: 7.00 }, // 3 days before
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-05', amount: 150.00, currency: 'USD', autopay: false, late_fee: 15.00 }, // on payday
        { provider: 'Afterpay', installment_no: 2, due_date: '2025-10-08', amount: 50.00, currency: 'USD', autopay: true, late_fee: 8.00 } // 3 days after
      ];
      const paydays = ['2025-10-05'];
      const minBuffer = 250.00;

      const result = detectRisks(installments, paydays, minBuffer, timezone);

      const cashCrunch = result.filter(r => r.type === 'CASH_CRUNCH');
      expect(cashCrunch.length).toBe(1);
      expect(cashCrunch[0].amount).toBe(300.00); // All 3 payments
    });

    it('should set severity to high when overage >= $250', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-05', amount: 300.00, currency: 'USD', autopay: true, late_fee: 7.00 },
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-06', amount: 200.00, currency: 'USD', autopay: false, late_fee: 15.00 }
      ];
      const paydays = ['2025-10-05'];
      const minBuffer = 200.00;

      const result = detectRisks(installments, paydays, minBuffer, timezone);

      const cashCrunch = result.filter(r => r.type === 'CASH_CRUNCH');
      expect(cashCrunch[0].severity).toBe('high');
    });

    it('should set severity to medium when overage < $250', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-05', amount: 250.00, currency: 'USD', autopay: true, late_fee: 7.00 }
      ];
      const paydays = ['2025-10-05'];
      const minBuffer = 200.00;

      const result = detectRisks(installments, paydays, minBuffer, timezone);

      const cashCrunch = result.filter(r => r.type === 'CASH_CRUNCH');
      expect(cashCrunch[0].severity).toBe('medium');
    });

    it('should not flag if total is within buffer', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-05', amount: 100.00, currency: 'USD', autopay: true, late_fee: 7.00 }
      ];
      const paydays = ['2025-10-05'];
      const minBuffer = 200.00;

      const result = detectRisks(installments, paydays, minBuffer, timezone);

      const cashCrunch = result.filter(r => r.type === 'CASH_CRUNCH');
      expect(cashCrunch.length).toBe(0);
    });

    it('should check all paydays in the period', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-05', amount: 300.00, currency: 'USD', autopay: true, late_fee: 7.00 },
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-19', amount: 300.00, currency: 'USD', autopay: false, late_fee: 15.00 }
      ];
      const paydays = ['2025-10-05', '2025-10-19', '2025-11-02'];
      const minBuffer = 250.00;

      const result = detectRisks(installments, paydays, minBuffer, timezone);

      const cashCrunch = result.filter(r => r.type === 'CASH_CRUNCH');
      expect(cashCrunch.length).toBe(2); // One for each payday
    });
  });

  describe('WEEKEND_AUTOPAY risk detection', () => {
    it('should detect payments due on Saturday with autopay enabled', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-04', amount: 45.00, currency: 'USD', autopay: true, late_fee: 7.00 } // Saturday
      ];

      const result = detectRisks(installments, [], minBuffer, timezone);

      const weekendRisks = result.filter(r => r.type === 'WEEKEND_AUTOPAY');
      expect(weekendRisks.length).toBe(1);
      expect(weekendRisks[0].severity).toBe('low');
      expect(weekendRisks[0].message).toContain('Saturday');
    });

    it('should detect payments due on Sunday with autopay enabled', () => {
      const installments = [
        { provider: 'Afterpay', installment_no: 2, due_date: '2025-10-05', amount: 32.50, currency: 'USD', autopay: true, late_fee: 8.00 } // Sunday
      ];

      const result = detectRisks(installments, [], minBuffer, timezone);

      const weekendRisks = result.filter(r => r.type === 'WEEKEND_AUTOPAY');
      expect(weekendRisks.length).toBe(1);
      expect(weekendRisks[0].message).toContain('Sunday');
    });

    it('should not flag weekend payments without autopay', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-04', amount: 45.00, currency: 'USD', autopay: false, late_fee: 7.00 } // Saturday, no autopay
      ];

      const result = detectRisks(installments, [], minBuffer, timezone);

      const weekendRisks = result.filter(r => r.type === 'WEEKEND_AUTOPAY');
      expect(weekendRisks.length).toBe(0);
    });

    it('should not flag weekday payments with autopay', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-02', amount: 45.00, currency: 'USD', autopay: true, late_fee: 7.00 } // Wednesday
      ];

      const result = detectRisks(installments, [], minBuffer, timezone);

      const weekendRisks = result.filter(r => r.type === 'WEEKEND_AUTOPAY');
      expect(weekendRisks.length).toBe(0);
    });
  });

  describe('Multiple risk types', () => {
    it('should detect all applicable risk types', () => {
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-04', amount: 100.00, currency: 'USD', autopay: true, late_fee: 7.00 }, // Saturday (WEEKEND_AUTOPAY)
        { provider: 'Affirm', installment_no: 1, due_date: '2025-10-04', amount: 150.00, currency: 'USD', autopay: false, late_fee: 15.00 }, // Same day (COLLISION)
        { provider: 'Afterpay', installment_no: 2, due_date: '2025-10-06', amount: 200.00, currency: 'USD', autopay: true, late_fee: 8.00 } // Near payday (CASH_CRUNCH)
      ];
      const paydays = ['2025-10-05'];
      const minBuffer = 200.00;

      const result = detectRisks(installments, paydays, minBuffer, timezone);

      expect(result.find(r => r.type === 'COLLISION')).toBeDefined();
      expect(result.find(r => r.type === 'CASH_CRUNCH')).toBeDefined();
      expect(result.find(r => r.type === 'WEEKEND_AUTOPAY')).toBeDefined();
    });
  });

  describe('Timezone handling', () => {
    it('should respect timezone for weekend detection', () => {
      // 2025-10-04 is Saturday in America/New_York
      const installments = [
        { provider: 'Klarna', installment_no: 1, due_date: '2025-10-04', amount: 45.00, currency: 'USD', autopay: true, late_fee: 7.00 }
      ];

      const resultNY = detectRisks(installments, [], minBuffer, 'America/New_York');
      const resultLA = detectRisks(installments, [], minBuffer, 'America/Los_Angeles');

      // Should be weekend in both US timezones
      expect(resultNY.filter(r => r.type === 'WEEKEND_AUTOPAY').length).toBe(1);
      expect(resultLA.filter(r => r.type === 'WEEKEND_AUTOPAY').length).toBe(1);
    });
  });
});