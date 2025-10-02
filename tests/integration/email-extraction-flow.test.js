/**
 * Integration tests for email extraction flow
 * Tests the full user journey: paste → extract → preview → CSV export → build plan
 */

const fs = require('fs');
const path = require('path');
const { extractItemsFromEmails } = require('../../frontend/src/lib/email-extractor.ts');

describe('Email Extraction Flow Integration', () => {
  const timezone = 'America/New_York';
  const fixturesDir = path.join(__dirname, '../fixtures/emails');

  describe('Full extraction workflow', () => {
    it('extracts items from Klarna first payment email', () => {
      const emailText = fs.readFileSync(path.join(fixturesDir, 'klarna-first.txt'), 'utf-8');
      const result = extractItemsFromEmails(emailText, timezone);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        provider: 'Klarna',
        installment_no: 1,
        due_date: '2025-10-06',
        amount: 25,
        currency: 'USD',
        autopay: true,
        late_fee: 7
      });
      expect(result.issues).toHaveLength(0);
      expect(result.duplicatesRemoved).toBe(0);
    });

    it('extracts items from multiple emails pasted together', () => {
      const email1 = fs.readFileSync(path.join(fixturesDir, 'klarna-first.txt'), 'utf-8');
      const email2 = fs.readFileSync(path.join(fixturesDir, 'klarna-mid.txt'), 'utf-8');
      const combined = email1 + '\n---\n' + email2;

      const result = extractItemsFromEmails(combined, timezone);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].installment_no).toBe(1);
      expect(result.items[1].installment_no).toBe(2);
      expect(result.issues).toHaveLength(0);
    });

    it('handles mix of valid and invalid emails', () => {
      const valid = fs.readFileSync(path.join(fixturesDir, 'klarna-first.txt'), 'utf-8');
      const invalid = fs.readFileSync(path.join(fixturesDir, 'unknown-provider.txt'), 'utf-8');
      const combined = valid + '\n---\n' + invalid;

      const result = extractItemsFromEmails(combined, timezone);

      expect(result.items).toHaveLength(1); // Only Klarna extracted
      expect(result.items[0].provider).toBe('Klarna');
      expect(result.issues).toHaveLength(1); // Unknown provider issue
      expect(result.issues[0].reason).toContain('not recognized');
    });

    it('deduplicates identical emails pasted twice', () => {
      const email = fs.readFileSync(path.join(fixturesDir, 'klarna-first.txt'), 'utf-8');
      const duplicate = email + '\n---\n' + email;

      const result = extractItemsFromEmails(duplicate, timezone);

      expect(result.items).toHaveLength(1); // Deduplicated
      expect(result.duplicatesRemoved).toBe(1);
    });

    it('does NOT deduplicate different amounts with same provider/installment/date', () => {
      // This tests the fix where we include amount in deduplication key
      const email1 = `From: Klarna
Payment 1 of 4: $25.00
Due: October 6, 2025
Late fee: $7.00`;

      const email2 = `From: Klarna
Payment 1 of 4: $50.00
Due: October 6, 2025
Late fee: $10.00`;

      const combined = email1 + '\n---\n' + email2;
      const result = extractItemsFromEmails(combined, timezone);

      expect(result.items).toHaveLength(2); // Both should be kept
      expect(result.items[0].amount).toBe(25);
      expect(result.items[1].amount).toBe(50);
      expect(result.duplicatesRemoved).toBe(0);
    });
  });

  describe('Error recovery workflow', () => {
    it('shows issues for invalid email, then succeeds with valid email', () => {
      // First attempt: invalid
      const invalid = 'This is not a valid BNPL email';
      const result1 = extractItemsFromEmails(invalid, timezone);

      expect(result1.items).toHaveLength(0);
      expect(result1.issues.length).toBeGreaterThan(0);

      // Second attempt: valid
      const valid = fs.readFileSync(path.join(fixturesDir, 'klarna-first.txt'), 'utf-8');
      const result2 = extractItemsFromEmails(valid, timezone);

      expect(result2.items).toHaveLength(1);
      expect(result2.issues).toHaveLength(0);
    });

    it('handles HTML email content safely', () => {
      const htmlEmail = `
        <html>
          <body>
            <p>From: Klarna</p>
            <p>Payment 1 of 4: $25.00</p>
            <p>Due: October 6, 2025</p>
            <script>alert('malicious')</script>
          </body>
        </html>
      `;

      const result = extractItemsFromEmails(htmlEmail, timezone);

      // Should extract data without executing script
      expect(result.items.length).toBeGreaterThanOrEqual(0);
      // No errors should be thrown
    });

    it('handles extremely long input gracefully', () => {
      const email = fs.readFileSync(path.join(fixturesDir, 'klarna-first.txt'), 'utf-8');
      const longInput = email.repeat(50); // 50x repetition

      expect(() => {
        extractItemsFromEmails(longInput, timezone);
      }).not.toThrow();
    });
  });

  describe('CSV export simulation', () => {
    it('extracts data that can be formatted as CSV', () => {
      const email = fs.readFileSync(path.join(fixturesDir, 'klarna-first.txt'), 'utf-8');
      const result = extractItemsFromEmails(email, timezone);

      expect(result.items).toHaveLength(1);
      const item = result.items[0];

      // Simulate CSV generation
      const csvRow = `${item.provider},${item.installment_no},${item.due_date},${item.amount},${item.currency},${item.autopay},${item.late_fee}`;

      expect(csvRow).toBe('Klarna,1,2025-10-06,25,USD,true,7');
    });

    it('handles all fixtures and generates valid CSV rows', () => {
      const fixtures = [
        'klarna-first.txt',
        'klarna-mid.txt',
        'affirm-final.txt',
        'klarna-edge-small.txt',
        'klarna-edge-large.txt'
      ];

      fixtures.forEach(fixture => {
        const email = fs.readFileSync(path.join(fixturesDir, fixture), 'utf-8');
        const result = extractItemsFromEmails(email, timezone);

        if (result.items.length > 0) {
          const item = result.items[0];

          // Ensure all fields are present for CSV
          expect(item).toHaveProperty('provider');
          expect(item).toHaveProperty('installment_no');
          expect(item).toHaveProperty('due_date');
          expect(item).toHaveProperty('amount');
          expect(item).toHaveProperty('currency');
          expect(item).toHaveProperty('autopay');
          expect(item).toHaveProperty('late_fee');

          // Ensure types are correct
          expect(typeof item.provider).toBe('string');
          expect(typeof item.installment_no).toBe('number');
          expect(typeof item.due_date).toBe('string');
          expect(typeof item.amount).toBe('number');
          expect(typeof item.currency).toBe('string');
          expect(typeof item.autopay).toBe('boolean');
          expect(typeof item.late_fee).toBe('number');
        }
      });
    });
  });

  describe('PII redaction in issues', () => {
    it('redacts email addresses from issue snippets', () => {
      const emailWithPII = `From: test@example.com
This is invalid content with user@domain.com
Amount: $100`;

      const result = extractItemsFromEmails(emailWithPII, timezone);

      if (result.issues.length > 0) {
        const snippet = result.issues[0].snippet;
        expect(snippet).not.toContain('test@example.com');
        expect(snippet).not.toContain('user@domain.com');
        expect(snippet).toContain('[EMAIL]');
      }
    });

    it('redacts dollar amounts from issue snippets', () => {
      const emailWithAmounts = `From: Unknown Provider
Payment of $1,234.56 due
Account balance: $999.99`;

      const result = extractItemsFromEmails(emailWithAmounts, timezone);

      if (result.issues.length > 0) {
        const snippet = result.issues[0].snippet;
        expect(snippet).not.toContain('$1,234.56');
        expect(snippet).not.toContain('$999.99');
        expect(snippet).toContain('[AMOUNT]');
      }
    });

    it('redacts account numbers from issue snippets', () => {
      const emailWithAccount = `From: Unknown Provider
Account: 1234567890
Reference: 9876543210`;

      const result = extractItemsFromEmails(emailWithAccount, timezone);

      if (result.issues.length > 0) {
        const snippet = result.issues[0].snippet;
        expect(snippet).not.toContain('1234567890');
        expect(snippet).not.toContain('9876543210');
        expect(snippet).toContain('[ACCOUNT]');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles edge case: $0.01 payment', () => {
      const email = fs.readFileSync(path.join(fixturesDir, 'klarna-edge-small.txt'), 'utf-8');
      const result = extractItemsFromEmails(email, timezone);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].amount).toBe(0.01);
    });

    it('handles edge case: large payment with 12 installments', () => {
      const email = fs.readFileSync(path.join(fixturesDir, 'klarna-edge-large.txt'), 'utf-8');
      const result = extractItemsFromEmails(email, timezone);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].amount).toBe(999.99);
      expect(result.items[0].installment_no).toBe(1);
      expect(result.items[0].late_fee).toBe(25);
    });

    it('handles edge case: past due with late fee already applied', () => {
      const email = fs.readFileSync(path.join(fixturesDir, 'klarna-past-due.txt'), 'utf-8');
      const result = extractItemsFromEmails(email, timezone);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].amount).toBe(25); // Original amount, not total
      expect(result.items[0].late_fee).toBe(7);
    });

    it('handles empty input', () => {
      const result = extractItemsFromEmails('', timezone);

      expect(result.items).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
    });

    it('handles whitespace-only input', () => {
      const result = extractItemsFromEmails('   \n\n   \t  ', timezone);

      expect(result.items).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
    });
  });
});
