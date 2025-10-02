const request = require('supertest');
const express = require('express');
const planRouter = require('../../src/routes/plan');
const fixtures = require('../fixtures/holiday-weekend.json');

const app = express();
app.use(express.json());
app.use('/plan', planRouter);

describe('Business-Day Awareness Integration Tests (v0.1.2)', () => {
  describe('Weekend Shift', () => {
    test('shifts Saturday due date to Monday', async () => {
      const testCase = fixtures.testCases.find(tc => tc.name.includes('Weekend shift'));
      const response = await request(app)
        .post('/plan')
        .send(testCase.input)
        .expect(200);

      expect(response.body.movedDates).toHaveLength(testCase.expected.movedDatesCount);
      expect(response.body.movedDates[0].shiftedDueDate).toBe(testCase.expected.shiftedDueDate);
      expect(response.body.movedDates[0].reason).toBe(testCase.expected.shiftReason);

      // Verify normalized items include shift fields
      const shiftedItem = response.body.normalized[0];
      expect(shiftedItem.wasShifted).toBe(true);
      expect(shiftedItem.shiftedDueDate).toBe(testCase.expected.shiftedDueDate);
      expect(shiftedItem.originalDueDate).toBe(testCase.input.items[0].due_date);

      // Verify no WEEKEND_AUTOPAY flag (because shift occurred)
      const weekendAutopayFlags = response.body.riskFlags.filter(f => f.includes('WEEKEND_AUTOPAY'));
      expect(weekendAutopayFlags.length).toBe(0);

      // Verify SHIFTED_NEXT_BUSINESS_DAY info flag exists
      const shiftInfoFlags = response.body.riskFlags.filter(f => f.includes('SHIFTED') || f.includes('shifted'));
      expect(shiftInfoFlags.length).toBeGreaterThan(0);

      // Verify ICS uses shifted date
      const icsDecoded = Buffer.from(response.body.ics, 'base64').toString('utf-8');
      expect(icsDecoded).toContain('20251006T090000'); // Monday Oct 6
      expect(icsDecoded).toContain('(shifted)'); // Summary annotation
    });
  });

  describe('Holiday Shift', () => {
    test('shifts Thanksgiving to next business day', async () => {
      const testCase = fixtures.testCases.find(tc => tc.name.includes('Thanksgiving'));
      const response = await request(app)
        .post('/plan')
        .send(testCase.input)
        .expect(200);

      expect(response.body.movedDates).toHaveLength(testCase.expected.movedDatesCount);
      expect(response.body.movedDates[0].shiftedDueDate).toBe(testCase.expected.shiftedDueDate);
      expect(response.body.movedDates[0].reason).toBe(testCase.expected.shiftReason);

      // Verify shift info flag
      const shiftInfoFlags = response.body.riskFlags.filter(f => f.includes('shifted') || f.includes('SHIFTED'));
      expect(shiftInfoFlags.length).toBeGreaterThan(0);

      // Verify ICS uses shifted date (Nov 28)
      const icsDecoded = Buffer.from(response.body.ics, 'base64').toString('utf-8');
      expect(icsDecoded).toContain('20251128T090000'); // Friday Nov 28
      expect(icsDecoded).toContain('Originally due: 2025-11-27');
    });
  });

  describe('Custom Skip Dates', () => {
    test('shifts custom skip date to next business day', async () => {
      const testCase = fixtures.testCases.find(tc => tc.name.includes('Custom skip'));
      const response = await request(app)
        .post('/plan')
        .send(testCase.input)
        .expect(200);

      expect(response.body.movedDates).toHaveLength(testCase.expected.movedDatesCount);
      expect(response.body.movedDates[0].shiftedDueDate).toBe(testCase.expected.shiftedDueDate);
      expect(response.body.movedDates[0].reason).toBe(testCase.expected.shiftReason);
    });

    test('validates customSkipDates format', async () => {
      const invalidInput = {
        items: [{
          provider: 'Klarna',
          installment_no: 1,
          due_date: '2025-10-15',
          amount: 100,
          currency: 'USD',
          autopay: false,
          late_fee: 10
        }],
        paycheckDates: ['2025-10-01', '2025-10-15', '2025-11-01'],
        minBuffer: 500,
        timeZone: 'America/New_York',
        businessDayMode: true,
        country: 'US',
        customSkipDates: ['invalid-date']
      };

      const response = await request(app)
        .post('/plan')
        .send(invalidInput)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details[0]).toContain('customSkipDates[0]: invalid date format');
    });
  });

  describe('Business Day Mode OFF', () => {
    test('does not shift dates when businessDayMode is false', async () => {
      const testCase = fixtures.testCases.find(tc => tc.name.includes('mode OFF'));
      const response = await request(app)
        .post('/plan')
        .send(testCase.input)
        .expect(200);

      // No shifts should occur
      expect(response.body.movedDates).toHaveLength(0);

      // Date should remain Saturday
      const item = response.body.normalized[0];
      expect(item.dueDate).toBe(testCase.input.items[0].due_date);
      expect(item.wasShifted).toBeUndefined();

      // WEEKEND_AUTOPAY flag should be present (v0.1.1 behavior)
      const weekendAutopayFlags = response.body.riskFlags.filter(f => f.includes('WEEKEND_AUTOPAY'));
      expect(weekendAutopayFlags.length).toBeGreaterThan(0);
    });
  });

  describe('No Shift Needed', () => {
    test('does not shift Friday business day', async () => {
      const testCase = fixtures.testCases.find(tc => tc.name.includes('Friday business'));
      const response = await request(app)
        .post('/plan')
        .send(testCase.input)
        .expect(200);

      // No shifts
      expect(response.body.movedDates).toHaveLength(0);

      // Date unchanged
      const item = response.body.normalized[0];
      expect(item.dueDate).toBe(testCase.input.items[0].due_date);
      expect(item.wasShifted).toBe(false);

      // No shift info flags
      const shiftInfoFlags = response.body.riskFlags.filter(f => f.includes('SHIFTED'));
      expect(shiftInfoFlags.length).toBe(0);
    });
  });

  describe('Multiple Items with Mixed Scenarios', () => {
    test('handles multiple items with different shift needs', async () => {
      const testCase = fixtures.testCases.find(tc => tc.name.includes('Multiple items'));
      const response = await request(app)
        .post('/plan')
        .send(testCase.input)
        .expect(200);

      // Two items should be shifted
      expect(response.body.movedDates).toHaveLength(testCase.expected.movedDatesCount);

      // Verify shifts are sorted by shifted date
      expect(response.body.movedDates[0].shiftedDueDate).toBe('2025-10-06');
      expect(response.body.movedDates[1].shiftedDueDate).toBe('2025-11-28');

      // Verify normalized items
      const normalized = response.body.normalized;
      expect(normalized[0].wasShifted).toBe(false); // Friday - no shift
      expect(normalized[1].wasShifted).toBe(true);  // Saturday - shifted
      expect(normalized[2].wasShifted).toBe(true);  // Thanksgiving - shifted
    });
  });

  describe('Country None', () => {
    test('only shifts weekends when country is None', async () => {
      const input = {
        items: [
          {
            provider: 'Klarna',
            installment_no: 1,
            due_date: '2025-11-27', // Thanksgiving (US holiday)
            amount: 100,
            currency: 'USD',
            autopay: false,
            late_fee: 10
          },
          {
            provider: 'Affirm',
            installment_no: 1,
            due_date: '2025-10-04', // Saturday
            amount: 50,
            currency: 'USD',
            autopay: false,
            late_fee: 5
          }
        ],
        paycheckDates: ['2025-10-01', '2025-10-15', '2025-11-01', '2025-11-15'],
        minBuffer: 500,
        timeZone: 'America/New_York',
        businessDayMode: true,
        country: 'None'
      };

      const response = await request(app)
        .post('/plan')
        .send(input)
        .expect(200);

      // Only Saturday should shift, not Thanksgiving
      expect(response.body.movedDates).toHaveLength(1);
      expect(response.body.movedDates[0].originalDueDate).toBe('2025-10-04');
      expect(response.body.movedDates[0].shiftedDueDate).toBe('2025-10-06');
      expect(response.body.movedDates[0].reason).toBe('WEEKEND');

      // Thanksgiving should not be shifted
      const thanksgivingItem = response.body.normalized.find(i => i.provider === 'Klarna');
      expect(thanksgivingItem.wasShifted).toBe(false);
      expect(thanksgivingItem.dueDate).toBe('2025-11-27');
    });
  });

  describe('Backward Compatibility', () => {
    test('applies defaults when business day fields not provided', async () => {
      const input = {
        items: [{
          provider: 'Klarna',
          installment_no: 1,
          due_date: '2025-10-04', // Saturday
          amount: 100,
          currency: 'USD',
          autopay: false,
          late_fee: 10
        }],
        paycheckDates: ['2025-10-01', '2025-10-15', '2025-11-01'],
        minBuffer: 500,
        timeZone: 'America/New_York'
        // No businessDayMode, country, or customSkipDates
      };

      const response = await request(app)
        .post('/plan')
        .send(input)
        .expect(200);

      // Defaults: businessDayMode=true, country='US'
      // Saturday should be shifted
      expect(response.body.movedDates).toHaveLength(1);
      expect(response.body.movedDates[0].shiftedDueDate).toBe('2025-10-06');
    });
  });

  describe('Validation', () => {
    test('rejects invalid businessDayMode type', async () => {
      const invalidInput = {
        items: [{
          provider: 'Klarna',
          installment_no: 1,
          due_date: '2025-10-15',
          amount: 100,
          currency: 'USD',
          autopay: false,
          late_fee: 10
        }],
        paycheckDates: ['2025-10-01', '2025-10-15', '2025-11-01'],
        minBuffer: 500,
        timeZone: 'America/New_York',
        businessDayMode: 'yes' // Should be boolean
      };

      const response = await request(app)
        .post('/plan')
        .send(invalidInput)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('businessDayMode must be a boolean');
    });

    test('rejects invalid country value', async () => {
      const invalidInput = {
        items: [{
          provider: 'Klarna',
          installment_no: 1,
          due_date: '2025-10-15',
          amount: 100,
          currency: 'USD',
          autopay: false,
          late_fee: 10
        }],
        paycheckDates: ['2025-10-01', '2025-10-15', '2025-11-01'],
        minBuffer: 500,
        timeZone: 'America/New_York',
        businessDayMode: true,
        country: 'UK' // Only US and None supported
      };

      const response = await request(app)
        .post('/plan')
        .send(invalidInput)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('country must be either "US" or "None"');
    });
  });
});
