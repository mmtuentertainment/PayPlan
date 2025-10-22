const request = require('supertest');
const app = require('../../index');
const { DateTime, Settings } = require('luxon');

/**
 * Generate fixture with relative dates from today
 */
function generateRelativeFixture() {
  const now = DateTime.now().setZone('America/New_York');
  const today = now.toISODate();
  const tomorrow = now.plus({ days: 1 }).toISODate();
  const threeDaysOut = now.plus({ days: 3 }).toISODate();
  const sevenDaysOut = now.plus({ days: 7 }).toISODate();
  const fifteenDaysOut = now.plus({ days: 15 }).toISODate();
  const thirtyDaysOut = now.plus({ days: 30 }).toISODate();

  return {
    today,
    tomorrow,
    threeDaysOut,
    sevenDaysOut,
    fifteenDaysOut,
    thirtyDaysOut
  };
}

describe('POST /plan integration tests', () => {
  describe('Success cases', () => {
    it('should process Klarna Pay-in-4 fixture successfully', async () => {
      const fixture = require('../fixtures/klarna-pay-in-4.json');

      const response = await request(app)
        .post('/plan')
        .send(fixture)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('actionsThisWeek');
      expect(response.body).toHaveProperty('riskFlags');
      expect(response.body).toHaveProperty('ics');
      expect(response.body).toHaveProperty('normalized');

      // Verify ICS is base64 encoded
      expect(response.body.ics).toMatch(/^[A-Za-z0-9+/]+=*$/);

      // Verify normalized output
      expect(response.body.normalized.length).toBe(4);
      expect(response.body.normalized[0]).toHaveProperty('provider');
      expect(response.body.normalized[0]).toHaveProperty('dueDate');
      expect(response.body.normalized[0]).toHaveProperty('amount');
    });

    it('includes payments due today even after midday', async () => {
      const originalNow = Settings.now;
      try {
        const fixedNow = DateTime.fromISO('2025-01-15T18:05:00', { zone: 'America/New_York' });
        Settings.now = () => fixedNow.toMillis();

        const response = await request(app)
          .post('/plan')
          .send({
            items: [{
              provider: 'Klarna',
              installment_no: 1,
              due_date: '2025-01-15',
              amount: 120.00,
              currency: 'USD',
              autopay: false,
              late_fee: 15.00
            }],
            paycheckDates: ['2025-01-10', '2025-01-24', '2025-02-07'],
            minBuffer: 200.00,
            timeZone: 'America/New_York'
          })
          .expect(200);

        expect(response.body.actionsThisWeek[0]).toContain('Klarna');
        expect(response.body.summary).toMatch(/1 BNPL payment/);
      } finally {
        Settings.now = originalNow;
      }
    });

    it('should detect risks in mixed providers fixture', async () => {
      const dates = generateRelativeFixture();
      const fixture = {
        items: [
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: dates.today,
            amount: 45.00,
            currency: 'USD',
            autopay: true,
            late_fee: 7.00
          },
          {
            provider: 'Affirm',
            installment_no: 3,
            due_date: dates.today,
            amount: 58.00,
            currency: 'USD',
            autopay: false,
            late_fee: 15.00
          },
          {
            provider: 'Afterpay',
            installment_no: 2,
            due_date: dates.threeDaysOut,
            amount: 32.50,
            currency: 'USD',
            autopay: true,
            late_fee: 8.00
          },
          {
            provider: 'PayPal',
            installment_no: 1,
            due_date: dates.sevenDaysOut,
            amount: 50.00,
            currency: 'USD',
            autopay: false,
            late_fee: 10.00
          },
          {
            provider: 'Zip',
            installment_no: 1,
            due_date: dates.fifteenDaysOut,
            amount: 40.00,
            currency: 'USD',
            autopay: true,
            late_fee: 5.00
          }
        ],
        paycheckDates: [dates.threeDaysOut, dates.fifteenDaysOut, dates.thirtyDaysOut],
        minBuffer: 200.00,
        timeZone: 'America/New_York'
      };

      const response = await request(app)
        .post('/plan')
        .send(fixture)
        .expect(200);

      // Should detect collision on today (2 payments due same day)
      const collisionRisk = response.body.riskFlags.find(r => r.includes('COLLISION'));
      expect(collisionRisk).toBeDefined();
      expect(collisionRisk).toContain('2 payments');

      // Actions should be prioritized by late_fee DESC, then amount ASC
      const actions = response.body.actionsThisWeek;
      expect(actions.length).toBeGreaterThanOrEqual(3); // Today: Klarna + Affirm, +3 days: Afterpay (all within 7 days)
      // First action should be Affirm (highest late fee: $15)
      expect(actions[0]).toContain('Affirm');
      expect(actions[0]).toContain('$58.00');
    });

    it('should generate plain-English summary', async () => {
      const dates = generateRelativeFixture();
      const fixture = {
        items: [
          { provider: 'Klarna', installment_no: 1, due_date: dates.today, amount: 45, currency: 'USD', autopay: true, late_fee: 7 },
          { provider: 'Affirm', installment_no: 3, due_date: dates.today, amount: 58, currency: 'USD', autopay: false, late_fee: 15 }
        ],
        paycheckDates: [dates.threeDaysOut, dates.fifteenDaysOut, dates.thirtyDaysOut],
        minBuffer: 200.00,
        timeZone: 'America/New_York'
      };

      const response = await request(app)
        .post('/plan')
        .send(fixture)
        .expect(200);

      expect(response.body.summary).toContain('payment');
      expect(response.body.summary).toContain('due');
      // Summary should be non-empty
      expect(response.body.summary.length).toBeGreaterThan(0);
    });

    it('should work with explicit paycheck dates', async () => {
      const dates = generateRelativeFixture();
      const request_data = {
        items: [
          {
            provider: "Affirm",
            installment_no: 1,
            due_date: dates.threeDaysOut,
            amount: 100.00,
            currency: "USD",
            autopay: false,
            late_fee: 15.00
          }
        ],
        paycheckDates: [dates.threeDaysOut, dates.fifteenDaysOut, dates.thirtyDaysOut],
        minBuffer: 50.00,
        timeZone: "America/New_York"
      };

      const response = await request(app)
        .post('/plan')
        .send(request_data)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.normalized.length).toBe(1);
    });

    it('should work with payday cadence', async () => {
      const dates = generateRelativeFixture();
      const request_data = {
        items: [
          {
            provider: "Klarna",
            installment_no: 1,
            due_date: dates.sevenDaysOut,
            amount: 50.00,
            currency: "USD",
            autopay: true,
            late_fee: 7.00
          }
        ],
        payCadence: "weekly",
        nextPayday: dates.threeDaysOut,
        minBuffer: 100.00,
        timeZone: "America/Los_Angeles"
      };

      const response = await request(app)
        .post('/plan')
        .send(request_data)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
    });
  });

  describe('Validation error cases', () => {
    it('should return 400 if items array is missing', async () => {
      const response = await request(app)
        .post('/plan')
        .send({
          minBuffer: 200,
          timeZone: "America/New_York"
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('items');
    });

    it('should return 400 if items array is empty', async () => {
      const response = await request(app)
        .post('/plan')
        .send({
          items: [],
          payCadence: "biweekly",
          nextPayday: "2025-10-05",
          minBuffer: 200,
          timeZone: "America/New_York"
        })
        .expect(400);

      expect(response.body.message).toContain('at least 1');
    });

    it('should return 400 if neither paycheckDates nor nextPayday provided', async () => {
      const response = await request(app)
        .post('/plan')
        .send({
          items: [{
            provider: "Klarna",
            installment_no: 1,
            due_date: "2025-10-05",
            amount: 50.00,
            currency: "USD",
            autopay: true,
            late_fee: 7.00
          }],
          minBuffer: 200,
          timeZone: "America/New_York"
        })
        .expect(400);

      expect(response.body.message).toContain('paycheckDates OR');
    });

    it('should return 400 if timezone is invalid', async () => {
      const response = await request(app)
        .post('/plan')
        .send({
          items: [{
            provider: "Klarna",
            installment_no: 1,
            due_date: "2025-10-05",
            amount: 50.00,
            currency: "USD",
            autopay: true,
            late_fee: 7.00
          }],
          nextPayday: "2025-10-05",
          minBuffer: 200,
          timeZone: "Invalid/Timezone"
        })
        .expect(400);

      expect(response.body.message).toContain('timezone');
    });

    it('should return 400 if minBuffer is missing', async () => {
      const response = await request(app)
        .post('/plan')
        .send({
          items: [{
            provider: "Klarna",
            installment_no: 1,
            due_date: "2025-10-05",
            amount: 50.00,
            currency: "USD",
            autopay: true,
            late_fee: 7.00
          }],
          nextPayday: "2025-10-05",
          timeZone: "America/New_York"
        })
        .expect(400);

      expect(response.body.message).toContain('minBuffer');
    });

    it('should return 400 if installment has invalid fields', async () => {
      const response = await request(app)
        .post('/plan')
        .send({
          items: [{
            provider: "Klarna",
            installment_no: -1,  // Invalid
            due_date: "invalid-date",  // Invalid
            amount: -50.00,  // Invalid
            currency: "USD",
            autopay: true,
            late_fee: 7.00
          }],
          nextPayday: "2025-10-05",
          minBuffer: 200,
          timeZone: "America/New_York"
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Edge cases', () => {
    it('should handle no payments due this week', async () => {
      const request_data = {
        items: [{
          provider: "Klarna",
          installment_no: 1,
          due_date: "2025-12-25",  // Far in future
          amount: 50.00,
          currency: "USD",
          autopay: true,
          late_fee: 7.00
        }],
        nextPayday: "2025-10-05",
        minBuffer: 200,
        timeZone: "America/New_York"
      };

      const response = await request(app)
        .post('/plan')
        .send(request_data)
        .expect(200);

      expect(response.body.actionsThisWeek.length).toBe(0);
      expect(response.body.summary).toContain('No BNPL payments due');
    });

    it('should handle large dataset (50 installments)', async () => {
      const items = [];
      for (let i = 0; i < 50; i++) {
        items.push({
          provider: "Klarna",
          installment_no: i + 1,
          due_date: `2025-${String(10 + Math.floor(i / 30)).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          amount: 50.00,
          currency: "USD",
          autopay: true,
          late_fee: 7.00
        });
      }

      const request_data = {
        items,
        nextPayday: "2025-10-05",
        minBuffer: 200,
        timeZone: "America/New_York"
      };

      const startTime = Date.now();
      const response = await request(app)
        .post('/plan')
        .send(request_data)
        .expect(200);
      const duration = Date.now() - startTime;

      // Should complete in under 5 seconds (target from spec)
      expect(duration).toBeLessThan(5000);

      expect(response.body.normalized.length).toBe(50);
    });
  });
});
