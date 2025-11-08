/**
 * Tests for Export Goals to CSV/JSON with PII Sanitization (T103)
 * Feature: Goal Tracking Dashboard (064-short-name-goal)
 * Phase: 11 (Polish & Cross-Cutting)
 *
 * Required coverage: 90%+ (financial/privacy-critical code per Constitution v3.1)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Papa from 'papaparse';
import {
  sanitizePII,
  exportGoalsToCSV,
  exportGoalsToJSON,
  generateExportFilename,
  downloadFile,
} from '../export';
import type { Goal } from '../../types/goal';
import type { Contribution } from '../../types/contribution';

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

describe('export.ts - PII Sanitization and Export Functions', () => {
  // Test fixtures
  const mockContribution: Contribution = {
    id: 'contrib_001',
    goalId: 'goal_001',
    amount: 5000, // $50.00
    note: 'Bonus from John Doe at 123 Main St',
    date: '2025-11-05',
    createdAt: '2025-11-05T10:00:00Z',
  };

  const mockGoal: Goal = {
    id: 'goal_001',
    name: 'Emergency Fund for Jane Smith',
    targetAmount: 100000, // $1,000.00
    currentAmount: 50000, // $500.00
    targetDate: '2026-06-30',
    monthlyContribution: 5000, // $50.00
    status: 'active',
    contributions: [mockContribution],
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-05T10:00:00Z',
  };

  beforeEach(() => {
    // Mock DOM API
    global.URL.createObjectURL = mockCreateObjectURL.mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    global.document.createElement = mockCreateElement.mockReturnValue({
      click: vi.fn(),
      href: '',
      download: '',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizePII', () => {
    describe('Email Address Sanitization', () => {
      it('should redact email addresses', () => {
        const text = 'Contact me at john.doe@example.com for details';
        const result = sanitizePII(text);
        expect(result).toBe('Contact me at [EMAIL_REDACTED] for details');
      });

      it('should redact multiple email addresses', () => {
        const text = 'Email alice@test.com or bob@company.co.uk';
        const result = sanitizePII(text);
        expect(result).toBe('Email [EMAIL_REDACTED] or [EMAIL_REDACTED]');
      });

      it('should handle emails with special characters', () => {
        const text = 'Contact first.last+tag@sub.domain.com';
        const result = sanitizePII(text);
        expect(result).toBe('Contact [EMAIL_REDACTED]');
      });
    });

    describe('Phone Number Sanitization', () => {
      it('should redact US phone format (123) 456-7890', () => {
        const text = 'Call me at (555) 123-4567';
        const result = sanitizePII(text);
        expect(result).toBe('Call me at [PHONE_REDACTED]');
      });

      it('should redact phone format 123-456-7890', () => {
        const text = 'Phone: 555-123-4567';
        const result = sanitizePII(text);
        expect(result).toBe('Phone: [PHONE_REDACTED]');
      });

      it('should redact phone format 1234567890', () => {
        const text = 'Number is 5551234567';
        const result = sanitizePII(text);
        expect(result).toBe('Number is [PHONE_REDACTED]');
      });

      it('should redact international format +1-555-123-4567', () => {
        const text = 'International: +1-555-123-4567';
        const result = sanitizePII(text);
        expect(result).toBe('International: [PHONE_REDACTED]');
      });

      // Bot review H1: Edge case PII patterns for international phones
      it('should redact UK format +44 20 1234 5678', () => {
        const text = 'UK phone: +44 20 1234 5678';
        const result = sanitizePII(text);
        expect(result).toBe('UK phone: [PHONE_REDACTED]');
      });

      it('should redact Australia format +61 2 1234 5678', () => {
        const text = 'Australia: +61 2 1234 5678';
        const result = sanitizePII(text);
        expect(result).toBe('Australia: [PHONE_REDACTED]');
      });

      it('should redact France format +33 1 23 45 67 89', () => {
        const text = 'Contact: +33 1 23 45 67 89';
        const result = sanitizePII(text);
        expect(result).toBe('Contact: [PHONE_REDACTED]');
      });

      it('should redact Germany format +49 30 12345678', () => {
        const text = 'Berlin office: +49 30 12345678';
        const result = sanitizePII(text);
        expect(result).toBe('Berlin office: [PHONE_REDACTED]');
      });
    });

    describe('SSN Sanitization', () => {
      it('should redact SSN format 123-45-6789', () => {
        const text = 'SSN: 123-45-6789';
        const result = sanitizePII(text);
        expect(result).toBe('SSN: [SSN_REDACTED]');
      });

      it('should redact SSN format 123456789', () => {
        const text = 'Social: 123456789';
        const result = sanitizePII(text);
        expect(result).toBe('Social: [SSN_REDACTED]');
      });

      it('should redact SSN with spaces 123 45 6789', () => {
        const text = 'Number: 123 45 6789';
        const result = sanitizePII(text);
        expect(result).toBe('Number: [SSN_REDACTED]');
      });
    });

    describe('Credit Card Sanitization', () => {
      it('should redact 16-digit card 1234-5678-9012-3456', () => {
        const text = 'Card: 1234-5678-9012-3456';
        const result = sanitizePII(text);
        expect(result).toBe('Card: [CARD_REDACTED]');
      });

      it('should redact card without dashes 1234567890123456', () => {
        const text = 'Number: 1234567890123456';
        const result = sanitizePII(text);
        expect(result).toBe('Number: [CARD_REDACTED]');
      });

      it('should redact Amex format (15 digits)', () => {
        const text = 'Amex: 1234-5678-9012-345';
        const result = sanitizePII(text);
        expect(result).toBe('Amex: [CARD_REDACTED]');
      });

      it('should redact card with spaces', () => {
        const text = 'Visa: 1234 5678 9012 3456';
        const result = sanitizePII(text);
        expect(result).toBe('Visa: [CARD_REDACTED]');
      });
    });

    describe('Address Sanitization', () => {
      it('should redact street addresses', () => {
        const text = 'Located at 123 Main Street';
        const result = sanitizePII(text);
        expect(result).toBe('Located at [ADDRESS_REDACTED]');
      });

      it('should redact abbreviated street types', () => {
        const text = 'Ship to 456 Oak Ave';
        const result = sanitizePII(text);
        expect(result).toBe('Ship to [ADDRESS_REDACTED]');
      });

      it('should redact various street types', () => {
        const addresses = [
          '789 Pine Road',
          '321 Elm Dr',
          '555 Maple Lane',
          '999 Cedar Blvd',
        ];

        addresses.forEach((addr) => {
          expect(sanitizePII(addr)).toBe('[ADDRESS_REDACTED]');
        });
      });

      it('should be case-insensitive for street types', () => {
        const text = '123 main STREET';
        const result = sanitizePII(text);
        expect(result).toBe('[ADDRESS_REDACTED]');
      });
    });

    describe('Complex Text Sanitization', () => {
      it('should sanitize multiple PII types in one text', () => {
        const text = 'Contact: john@example.com, 555-123-4567, 123 Main St';
        const result = sanitizePII(text);
        expect(result).toBe('Contact: [EMAIL_REDACTED], [PHONE_REDACTED], [ADDRESS_REDACTED]');
      });

      it('should handle empty string', () => {
        expect(sanitizePII('')).toBe('');
      });

      it('should handle text with no PII', () => {
        const text = 'This is a safe text with no personal information';
        expect(sanitizePII(text)).toBe(text);
      });

      it('should preserve non-PII numbers', () => {
        const text = 'Goal amount: $1000, saved: $500, 50% complete';
        expect(sanitizePII(text)).toBe(text);
      });
    });
  });

  // Type for parsed CSV rows (per CodeRabbit feedback - avoid 'any' types)
  // UPDATED: Denormalized format (one row per contribution, goal data repeated)
  type ParsedCSVRow = {
    // Goal-level fields (repeated for each contribution)
    goalId: string;
    goalName: string;
    goalTargetAmount: string;
    goalCurrentAmount: string;
    goalMonthlyContribution: string;
    goalTargetDate: string;
    goalStatus: string;
    goalCreatedAt: string;
    goalUpdatedAt: string;
    // Contribution-level fields (unique per row)
    contributionId: string;
    contributionAmount: string;
    contributionNote: string;
    contributionDate: string;
    contributionCreatedAt: string;
  };

  describe('exportGoalsToCSV', () => {
    it('should export single goal with one contribution (denormalized format)', () => {
      const goals = [mockGoal];
      const csv = exportGoalsToCSV(goals);

      // Parse CSV to verify structure
      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];

      // One row per contribution
      expect(rows).toHaveLength(1);

      // Verify goal-level fields
      expect(rows[0].goalId).toBe('goal_001');
      expect(rows[0].goalName).toBe('Emergency Fund for Jane Smith');
      expect(rows[0].goalTargetAmount).toBe('1000.00');
      expect(rows[0].goalCurrentAmount).toBe('500.00');
      expect(rows[0].goalMonthlyContribution).toBe('50.00');
      expect(rows[0].goalTargetDate).toBe('2026-06-30');
      expect(rows[0].goalStatus).toBe('active');

      // Verify contribution-level fields
      expect(rows[0].contributionId).toBe('contrib_001');
      expect(rows[0].contributionAmount).toBe('50.00'); // $50.00
      expect(rows[0].contributionNote).toBe('Bonus from John Doe at [ADDRESS_REDACTED]'); // PII sanitized
      expect(rows[0].contributionDate).toBe('2025-11-05');
      expect(rows[0].contributionCreatedAt).toBe('2025-11-05T10:00:00Z');
    });


    it('should handle multiple goals with contributions', () => {
      const contribution2: Contribution = {
        id: 'contrib_002',
        goalId: 'goal_002',
        amount: 25000, // $250.00
        note: 'Birthday money',
        date: '2025-11-06',
        createdAt: '2025-11-06T12:00:00Z',
      };

      const goal2: Goal = {
        ...mockGoal,
        id: 'goal_002',
        name: 'Vacation Fund',
        currentAmount: 25000,
        contributions: [contribution2],
      };

      const goals = [mockGoal, goal2];
      const csv = exportGoalsToCSV(goals);

      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];

      // Two goals, each with 1 contribution = 2 rows
      expect(rows).toHaveLength(2);

      // Verify first goal's row
      expect(rows[0].goalId).toBe('goal_001');
      expect(rows[0].contributionId).toBe('contrib_001');

      // Verify second goal's row
      expect(rows[1].goalId).toBe('goal_002');
      expect(rows[1].goalName).toBe('Vacation Fund');
      expect(rows[1].goalCurrentAmount).toBe('250.00');
      expect(rows[1].contributionId).toBe('contrib_002');
      expect(rows[1].contributionAmount).toBe('250.00');
      expect(rows[1].contributionNote).toBe('Birthday money');
    });

    it('should handle empty goals array', () => {
      const csv = exportGoalsToCSV([]);
      const parsed = Papa.parse(csv, { header: true });

      expect(parsed.data).toHaveLength(0);
      expect(parsed.meta.fields).toBeDefined(); // Headers still present
    });

    it('should format null values correctly', () => {
      const goalNoDate: Goal = {
        ...mockGoal,
        targetDate: null,
        monthlyContribution: null,
      };

      const csv = exportGoalsToCSV([goalNoDate]);
      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];

      // One goal with one contribution = 1 row
      expect(rows).toHaveLength(1);

      // Verify null goal fields are formatted correctly
      expect(rows[0].goalTargetDate).toBe('');
      expect(rows[0].goalMonthlyContribution).toBe('0.00');

      // Contribution fields should still be present
      expect(rows[0].contributionId).toBe('contrib_001');
      expect(rows[0].contributionAmount).toBe('50.00');
    });

    it('should handle goals with completed status', () => {
      const completedGoal: Goal = {
        ...mockGoal,
        status: 'completed',
        currentAmount: 100000,
      };

      const csv = exportGoalsToCSV([completedGoal]);
      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];

      // One goal with one contribution = 1 row
      expect(rows).toHaveLength(1);

      // Verify goal status and amount
      expect(rows[0].goalStatus).toBe('completed');
      expect(rows[0].goalCurrentAmount).toBe('1000.00');

      // Contribution fields should be present
      expect(rows[0].contributionId).toBe('contrib_001');
    });

    it('should use RFC 4180 compliant CSV format', () => {
      const goalWithComma: Goal = {
        ...mockGoal,
        name: 'Goal, with comma',
      };

      const csv = exportGoalsToCSV([goalWithComma]);

      // Verify quotes are used for fields with commas
      expect(csv).toContain('"Goal, with comma"');
      // Verify Windows line endings
      expect(csv).toContain('\r\n');

      // Parse to verify structure integrity
      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];
      expect(rows[0].goalName).toBe('Goal, with comma');
    });

    it('should handle goal with zero contributions (edge case)', () => {
      const goalNoContributions: Goal = {
        ...mockGoal,
        contributions: [],
        currentAmount: 0,
      };

      const csv = exportGoalsToCSV([goalNoContributions]);
      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];

      // Goal with 0 contributions should export 1 row with empty contribution fields
      expect(rows).toHaveLength(1);
      expect(rows[0].goalId).toBe('goal_001');
      expect(rows[0].goalName).toBe('Emergency Fund for Jane Smith');
      expect(rows[0].contributionId).toBe('');
      expect(rows[0].contributionAmount).toBe('');
      expect(rows[0].contributionNote).toBe('');
      expect(rows[0].contributionDate).toBe('');
    });

    it('should handle goal with multiple contributions (denormalization)', () => {
      const contributions: Contribution[] = [
        {
          id: 'contrib_001',
          goalId: 'goal_001',
          amount: 10000, // $100
          note: 'First contribution',
          date: '2025-11-01',
          createdAt: '2025-11-01T10:00:00Z',
        },
        {
          id: 'contrib_002',
          goalId: 'goal_001',
          amount: 15000, // $150
          note: 'Second contribution',
          date: '2025-11-05',
          createdAt: '2025-11-05T10:00:00Z',
        },
        {
          id: 'contrib_003',
          goalId: 'goal_001',
          amount: 20000, // $200
          note: 'Third contribution',
          date: '2025-11-10',
          createdAt: '2025-11-10T10:00:00Z',
        },
      ];

      const goalMultipleContributions: Goal = {
        ...mockGoal,
        contributions,
        currentAmount: 45000, // $450 total
      };

      const csv = exportGoalsToCSV([goalMultipleContributions]);
      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];

      // 3 contributions = 3 rows
      expect(rows).toHaveLength(3);

      // Verify goal data is repeated for each row
      rows.forEach((row) => {
        expect(row.goalId).toBe('goal_001');
        expect(row.goalName).toBe('Emergency Fund for Jane Smith');
        expect(row.goalCurrentAmount).toBe('450.00');
      });

      // Verify contribution-specific data differs
      expect(rows[0].contributionId).toBe('contrib_001');
      expect(rows[0].contributionAmount).toBe('100.00');
      expect(rows[0].contributionNote).toBe('First contribution');

      expect(rows[1].contributionId).toBe('contrib_002');
      expect(rows[1].contributionAmount).toBe('150.00');
      expect(rows[1].contributionNote).toBe('Second contribution');

      expect(rows[2].contributionId).toBe('contrib_003');
      expect(rows[2].contributionAmount).toBe('200.00');
      expect(rows[2].contributionNote).toBe('Third contribution');
    });

    it('should sanitize PII in denormalized CSV rows', () => {
      const contributionWithPII: Contribution = {
        id: 'contrib_pii',
        goalId: 'goal_001',
        amount: 10000,
        note: 'Gift from john@example.com at 555-123-4567',
        date: '2025-11-01',
        createdAt: '2025-11-01T10:00:00Z',
      };

      const goalWithPII: Goal = {
        ...mockGoal,
        name: 'Save for 123 Main Street house',
        contributions: [contributionWithPII],
      };

      const csv = exportGoalsToCSV([goalWithPII]);
      const parsed = Papa.parse(csv, { header: true });
      const rows = parsed.data as ParsedCSVRow[];

      // Verify PII sanitized in goal name
      expect(rows[0].goalName).toBe('Save for [ADDRESS_REDACTED] house');

      // Verify PII sanitized in contribution note
      expect(rows[0].contributionNote).toBe('Gift from [EMAIL_REDACTED] at [PHONE_REDACTED]');
    });
  });

  describe('exportGoalsToJSON', () => {
    it('should export single goal to JSON', () => {
      const goals = [mockGoal];
      const json = exportGoalsToJSON(goals);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('goal_001');
      expect(parsed[0].targetAmount).toBe(100000);
      expect(parsed[0].currentAmount).toBe(50000);
    });


    it('should preserve full goal structure', () => {
      const goals = [mockGoal];
      const json = exportGoalsToJSON(goals);
      const parsed = JSON.parse(json);

      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('targetAmount');
      expect(parsed[0]).toHaveProperty('currentAmount');
      expect(parsed[0]).toHaveProperty('contributions');
      expect(parsed[0].contributions).toHaveLength(1);
    });

    it('should pretty-print with 2-space indent', () => {
      const goals = [mockGoal];
      const json = exportGoalsToJSON(goals);

      // Check for 2-space indentation
      expect(json).toContain('  "id":');
      expect(json).toContain('    "id":'); // Nested contribution
      expect(json.split('\n').length).toBeGreaterThan(10); // Pretty printed
    });

    it('should handle empty goals array', () => {
      const json = exportGoalsToJSON([]);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual([]);
    });

    it('should handle null contribution notes', () => {
      const goalNoNote: Goal = {
        ...mockGoal,
        contributions: [{
          ...mockContribution,
          note: null,
        }],
      };

      const json = exportGoalsToJSON([goalNoNote]);
      const parsed = JSON.parse(json);

      expect(parsed[0].contributions[0].note).toBeNull();
    });

    it('should handle multiple goals with different statuses', () => {
      const goals: Goal[] = [
        mockGoal,
        { ...mockGoal, id: 'goal_002', status: 'completed' },
        { ...mockGoal, id: 'goal_003', status: 'archived' },
      ];

      const json = exportGoalsToJSON(goals);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(3);
      expect(parsed[0].status).toBe('active');
      expect(parsed[1].status).toBe('completed');
      expect(parsed[2].status).toBe('archived');
    });
  });

  describe('generateExportFilename', () => {
    beforeEach(() => {
      // Mock date to ensure consistent tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-06T14:30:45'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate CSV filename with timestamp', () => {
      const filename = generateExportFilename('csv');
      expect(filename).toBe('payplan-goals-2025-11-06-143045Z.csv');
    });

    it('should generate JSON filename with timestamp', () => {
      const filename = generateExportFilename('json');
      expect(filename).toBe('payplan-goals-2025-11-06-143045Z.json');
    });

    it('should pad single-digit values', () => {
      vi.setSystemTime(new Date('2025-01-05T09:05:03'));
      const filename = generateExportFilename('csv');
      expect(filename).toBe('payplan-goals-2025-01-05-090503Z.csv');
    });

    it('should handle midnight correctly', () => {
      vi.setSystemTime(new Date('2025-11-06T00:00:00'));
      const filename = generateExportFilename('csv');
      expect(filename).toBe('payplan-goals-2025-11-06-000000Z.csv');
    });

    it('should handle end of year', () => {
      vi.setSystemTime(new Date('2025-12-31T23:59:59'));
      const filename = generateExportFilename('json');
      expect(filename).toBe('payplan-goals-2025-12-31-235959Z.json');
    });
  });

  describe('downloadFile', () => {
    it('should trigger download for CSV file', () => {
      const content = 'id,name\n1,Test';
      const filename = 'test.csv';
      const mimeType = 'text/csv';

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      mockCreateElement.mockReturnValueOnce(mockAnchor);

      downloadFile(content, filename, mimeType);

      // Verify Blob creation
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          size: content.length,
          type: 'text/csv;charset=utf-8;',
        })
      );

      // Verify anchor setup and click
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('test.csv');
      expect(mockAnchor.click).toHaveBeenCalled();

      // Verify cleanup
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should trigger download for JSON file', () => {
      const content = '{"test": true}';
      const filename = 'test.json';
      const mimeType = 'application/json';

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      mockCreateElement.mockReturnValueOnce(mockAnchor);

      downloadFile(content, filename, mimeType);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application/json;charset=utf-8;',
        })
      );

      expect(mockAnchor.download).toBe('test.json');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should handle empty content', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      mockCreateElement.mockReturnValueOnce(mockAnchor);

      downloadFile('', 'empty.csv', 'text/csv');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 0,
        })
      );
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should always revoke object URL to prevent memory leak', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(() => {
          throw new Error('Click failed');
        }),
      };
      mockCreateElement.mockReturnValueOnce(mockAnchor);

      expect(() => {
        downloadFile('content', 'file.csv', 'text/csv');
      }).toThrow('Click failed');

      // Should still revoke URL even if click fails
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle large content', () => {
      const largeContent = 'x'.repeat(1000000); // 1MB of data
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      mockCreateElement.mockReturnValueOnce(mockAnchor);

      downloadFile(largeContent, 'large.csv', 'text/csv');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 1000000,
        })
      );
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should export and sanitize complex goal data end-to-end', () => {
      const complexGoal: Goal = {
        id: 'goal_complex',
        name: 'House Fund',
        targetAmount: 5000000, // $50,000
        currentAmount: 1000000, // $10,000
        targetDate: '2027-12-31',
        monthlyContribution: 100000, // $1,000
        status: 'active',
        contributions: [
          {
            id: 'c1',
            goalId: 'goal_complex',
            amount: 50000,
            note: 'Bonus from employer@company.com',
            date: '2025-11-01',
            createdAt: '2025-11-01T10:00:00Z',
          },
          {
            id: 'c2',
            goalId: 'goal_complex',
            amount: 25000,
            note: 'Tax refund SSN: 123-45-6789',
            date: '2025-11-02',
            createdAt: '2025-11-02T10:00:00Z',
          },
          {
            id: 'c3',
            goalId: 'goal_complex',
            amount: 75000,
            note: null, // No note
            date: '2025-11-03',
            createdAt: '2025-11-03T10:00:00Z',
          },
        ],
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-11-03T10:00:00Z',
      };

      // Test CSV export (denormalized format - one row per contribution)
      const csv = exportGoalsToCSV([complexGoal]);
      const parsedCSV = Papa.parse(csv, { header: true }).data as ParsedCSVRow[];

      // 3 contributions = 3 rows
      expect(parsedCSV).toHaveLength(3);

      // All rows have same goal name
      expect(parsedCSV[0].goalName).toBe('House Fund');
      expect(parsedCSV[1].goalName).toBe('House Fund');
      expect(parsedCSV[2].goalName).toBe('House Fund');

      // Test JSON export - verify reliable PII patterns (email, SSN) are sanitized
      const json = exportGoalsToJSON([complexGoal]);
      const parsedJSON = JSON.parse(json);

      expect(parsedJSON[0].name).toBe('House Fund');
      expect(parsedJSON[0].contributions[0].note).toBe('Bonus from [EMAIL_REDACTED]');
      expect(parsedJSON[0].contributions[1].note).toBe('Tax refund SSN: [SSN_REDACTED]');
      expect(parsedJSON[0].contributions[2].note).toBeNull();
    });

    it('should handle edge case amounts correctly', () => {
      const edgeCaseGoal: Goal = {
        ...mockGoal,
        targetAmount: 1, // $0.01
        currentAmount: 0, // $0.00
        monthlyContribution: 999999999, // $9,999,999.99
      };

      const csv = exportGoalsToCSV([edgeCaseGoal]);
      const parsed = Papa.parse(csv, { header: true }).data as ParsedCSVRow[];

      // Denormalized format uses goalTargetAmount, goalCurrentAmount, goalMonthlyContribution
      expect(parsed[0].goalTargetAmount).toBe('0.01');
      expect(parsed[0].goalCurrentAmount).toBe('0.00');
      expect(parsed[0].goalMonthlyContribution).toBe('9999999.99');
    });
  });
});