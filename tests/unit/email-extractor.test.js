const { extractItemsFromEmails } = require('../../frontend/src/lib/email-extractor.ts');
const fs = require('fs');
const path = require('path');

function readFixture(filename) {
  return fs.readFileSync(path.join(__dirname, '../fixtures/emails', filename), 'utf-8');
}

describe('email-extractor', () => {
  describe('extractItemsFromEmails', () => {
    it('extracts Klarna payment with autopay and late fee', () => {
      const email = readFixture('klarna-1.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        provider: 'Klarna',
        installment_no: 2,
        due_date: '2025-10-06',
        amount: 45,
        currency: 'USD',
        autopay: true,
        late_fee: 7
      });
    });

    it('extracts Klarna payment with slash date format', () => {
      const email = readFixture('klarna-2.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        provider: 'Klarna',
        installment_no: 4,
        due_date: '2025-10-24',
        amount: 45,
        late_fee: 7
      });
    });

    it('extracts Affirm payment without autopay', () => {
      const email = readFixture('affirm-1.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        provider: 'Affirm',
        installment_no: 1,
        due_date: '2025-10-10',
        amount: 58,
        currency: 'USD',
        autopay: false,
        late_fee: 0
      });
    });

    it('extracts Affirm payment with autopay enabled', () => {
      const email = readFixture('affirm-2.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items[0]).toMatchObject({
        provider: 'Affirm',
        installment_no: 2,
        autopay: true
      });
    });

    it('handles unknown provider gracefully', () => {
      const email = readFixture('unknown-provider.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(0);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].reason).toContain('not recognized');
    });

    it('deduplicates identical payments', () => {
      const email1 = readFixture('klarna-1.txt');
      const emails = email1 + '\n---\n' + email1;
      const result = extractItemsFromEmails(emails, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
    });
  });
});
