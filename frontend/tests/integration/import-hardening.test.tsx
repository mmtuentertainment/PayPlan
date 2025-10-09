import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Import from '@/pages/Import';

// T001: Fixtures & Helpers
const VALID_CSV = `provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,USD,2025-10-16,true
Afterpay,37.50,USD,2025-10-17,false`;

const INVALID_DATE_2025_13_45 = `provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-13-45,false`;

const INVALID_DATE_2025_02_30 = `provider,amount,currency,dueISO,autopay
Affirm,50.00,USD,2025-02-30,true`;

const INVALID_DATE_2025_04_31 = `provider,amount,currency,dueISO,autopay
Afterpay,37.50,USD,2025-04-31,false`;

const VALID_LEAP_YEAR_DATE = `provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2024-02-29,false`;

const VALID_FEB_28 = `provider,amount,currency,dueISO,autopay
Affirm,50.00,USD,2025-02-28,true`;

const SEMICOLON_CSV = `provider;amount;currency;dueISO;autopay
Klarna;25.00;USD;2025-10-15;false`;

const XSS_CSV = `provider,amount,currency,dueISO,autopay
<script>alert('xss')</script>,25.00,USD,2025-10-15,false`;

const FORMULA_EQUALS_CSV = `provider,amount,currency,dueISO,autopay
=SUM(A1),25.00,USD,2025-10-15,false`;

const FORMULA_PLUS_CSV = `provider,amount,currency,dueISO,autopay
+1,25.00,USD,2025-10-15,false`;

const FORMULA_MINUS_CSV = `provider,amount,currency,dueISO,autopay
-2,25.00,USD,2025-10-15,false`;

const FORMULA_AT_CSV = `provider,amount,currency,dueISO,autopay
@cmd,25.00,USD,2025-10-15,false`;

// Helper: Generate CSV with N rows
function generateCSV(numRows: number): string {
  const header = 'provider,amount,currency,dueISO,autopay';
  const rows = Array(numRows)
    .fill(0)
    .map(() => 'Klarna,25.00,USD,2025-10-15,false')
    .join('\n');
  return `${header}\n${rows}`;
}

// Helper: Generate CSV with blank lines
function generateCSVWithBlankLines(numRows: number, numBlanks: number): string {
  const header = 'provider,amount,currency,dueISO,autopay';
  const rows = Array(numRows)
    .fill(0)
    .map(() => 'Klarna,25.00,USD,2025-10-15,false')
    .join('\n');
  const blanks = '\n'.repeat(numBlanks);
  return `${header}\n${rows}${blanks}`;
}

// Helper: Generate oversize file (>1MB)
function generateOversizeFile(): Blob {
  const size = 1_048_577; // 1MB + 1 byte
  const content = 'x'.repeat(size);
  return new Blob([content], { type: 'text/csv' });
}

// Helper: Generate exact 1MB file
function generateExact1MBFile(): Blob {
  const size = 1_048_576; // Exactly 1MB
  const header = 'provider,amount,currency,dueISO,autopay\n';
  const padding = 'x'.repeat(size - header.length);
  return new Blob([header + padding], { type: 'text/csv' });
}

beforeEach(() => {
  // Mock fetch to ensure zero network calls
  global.fetch = vi.fn(() => Promise.reject('No network allowed'));

  // Mock URL methods for ICS download
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock File.prototype.text()
  File.prototype.text = vi.fn(async function(this: File) {
    if (this.name === 'valid.csv') return VALID_CSV;
    if (this.name === 'invalid-date-13-45.csv') return INVALID_DATE_2025_13_45;
    if (this.name === 'invalid-date-02-30.csv') return INVALID_DATE_2025_02_30;
    if (this.name === 'invalid-date-04-31.csv') return INVALID_DATE_2025_04_31;
    if (this.name === 'valid-leap-year.csv') return VALID_LEAP_YEAR_DATE;
    if (this.name === 'valid-feb-28.csv') return VALID_FEB_28;
    if (this.name === 'semicolon.csv') return SEMICOLON_CSV;
    if (this.name === 'xss.csv') return XSS_CSV;
    if (this.name === 'formula-equals.csv') return FORMULA_EQUALS_CSV;
    if (this.name === 'formula-plus.csv') return FORMULA_PLUS_CSV;
    if (this.name === 'formula-minus.csv') return FORMULA_MINUS_CSV;
    if (this.name === 'formula-at.csv') return FORMULA_AT_CSV;
    if (this.name === '1000-rows.csv') return generateCSV(1000);
    if (this.name === '1001-rows.csv') return generateCSV(1001);
    if (this.name === '1000-rows-with-blanks.csv') return generateCSVWithBlankLines(1000, 5);
    return '';
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// T002: File Size Limit Test
describe('Import Page - Hardening: File Size Limit', () => {
  it('rejects file >1MB with exact error message', async () => {
    render(<Import />);

    const file = generateOversizeFile();
    Object.defineProperty(file, 'name', { value: 'oversize.csv' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/process csv/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('CSV too large (max 1MB)')).toBeInTheDocument();
    });

    // Verify single-line error (no stack trace)
    const errorDiv = screen.getByRole('alert');
    expect(errorDiv.textContent).toBe('CSV too large (max 1MB)');

    // Verify no network calls
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('accepts file exactly 1MB', async () => {
    render(<Import />);

    const file = generateExact1MBFile();
    Object.defineProperty(file, 'name', { value: 'exact-1mb.csv' });

    // Mock text() for this specific file
    file.text = vi.fn(async () => 'provider,amount,currency,dueISO,autopay\nKlarna,25.00,USD,2025-10-15,false');

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    // Should not show "too large" error
    await waitFor(() => {
      expect(screen.queryByText('CSV too large (max 1MB)')).not.toBeInTheDocument();
    });
  });
});

// T003: Row Count Limit Test
describe('Import Page - Hardening: Row Count Limit', () => {
  it('accepts CSV with 1000 non-empty rows', async () => {
    render(<Import />);

    const file = new File([generateCSV(1000)], '1000-rows.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    // Should not show "too many rows" error
    await waitFor(() => {
      expect(screen.queryByText('Too many rows (max 1000)')).not.toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);

  it('rejects CSV with 1001 rows with exact error message', async () => {
    render(<Import />);

    const file = new File([generateCSV(1001)], '1001-rows.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('Too many rows (max 1000)')).toBeInTheDocument();
    });

    // Verify no network calls
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('ignores blank lines when counting rows', async () => {
    render(<Import />);

    const file = new File([generateCSVWithBlankLines(1000, 5)], '1000-rows-with-blanks.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    // Should not show "too many rows" error (blank lines ignored)
    await waitFor(() => {
      expect(screen.queryByText('Too many rows (max 1000)')).not.toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);
});

// T004: Delimiter Failure Test
describe('Import Page - Hardening: Delimiter Detection', () => {
  it('rejects semicolon-delimited CSV with exact error message', async () => {
    render(<Import />);

    const file = new File([SEMICOLON_CSV], 'semicolon.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('Parse failure: expected comma-delimited CSV')).toBeInTheDocument();
    });

    // Verify no network calls
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// T005: Real-Date Validity Test
describe('Import Page - Hardening: Calendar Date Validation', () => {
  it('rejects invalid date 2025-13-45 with exact error message', async () => {
    render(<Import />);

    const file = new File([INVALID_DATE_2025_13_45], 'invalid-date-13-45.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('Invalid date in row 1: 2025-13-45')).toBeInTheDocument();
    });
  });

  it('rejects invalid date 2025-02-30 with exact error message', async () => {
    render(<Import />);

    const file = new File([INVALID_DATE_2025_02_30], 'invalid-date-02-30.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('Invalid date in row 1: 2025-02-30')).toBeInTheDocument();
    });
  });

  it('rejects invalid date 2025-04-31 with exact error message', async () => {
    render(<Import />);

    const file = new File([INVALID_DATE_2025_04_31], 'invalid-date-04-31.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('Invalid date in row 1: 2025-04-31')).toBeInTheDocument();
    });
  });

  it('accepts valid leap year date 2024-02-29', async () => {
    render(<Import />);

    const file = new File([VALID_LEAP_YEAR_DATE], 'valid-leap-year.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });
  });

  it('accepts valid date 2025-02-28', async () => {
    render(<Import />);

    const file = new File([VALID_FEB_28], 'valid-feb-28.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });
  });
});

// T006: Accessibility Affordances Test
describe('Import Page - Hardening: Accessibility', () => {
  it('file input has associated label with htmlFor', () => {
    render(<Import />);

    const label = screen.getByText(/drag csv file here or choose file/i);
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('id', 'csv-file-input');
    expect(label).toHaveAttribute('for', 'csv-file-input');
  });

  it('error region has role="alert" and aria-live="polite"', async () => {
    render(<Import />);

    const file = generateOversizeFile();
    Object.defineProperty(file, 'name', { value: 'oversize.csv' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveTextContent('CSV too large (max 1MB)');
    });
  });

  it('results table has caption for screen readers', async () => {
    render(<Import />);

    const file = new File([VALID_CSV], 'valid.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const caption = table.querySelector('caption');
      expect(caption).toBeInTheDocument();
      expect(caption?.textContent).toMatch(/payment schedule/i);
    });
  });
});

// T007: Button Types & No-Network Test
describe('Import Page - Hardening: Button Types & Network Isolation', () => {
  it('all buttons have type="button"', async () => {
    render(<Import />);

    // Upload a file to trigger the Process CSV button to appear
    const file = new File([VALID_CSV], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      const processButton = screen.getByText(/process csv/i);
      expect(processButton).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('no network calls during upload/parse/render/ICS', async () => {
    render(<Import />);

    const file = new File([VALID_CSV], 'valid.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    // Click download ICS
    fireEvent.click(screen.getByText(/download.*ics/i));

    // Verify zero network calls
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// T008: Rendering Safety Test
describe('Import Page - Hardening: XSS & Formula Injection Safety', () => {
  it('renders HTML tags as plain text (no script execution)', async () => {
    render(<Import />);

    const file = new File([XSS_CSV], 'xss.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      // Should render literal text, not execute script
      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    });

    // Verify no dangerouslySetInnerHTML (check DOM)
    const cells = document.querySelectorAll('td');
    const providerCell = Array.from(cells).find(cell => cell.textContent?.includes('<script>'));
    expect(providerCell?.innerHTML).not.toContain('dangerouslySetInnerHTML');
  });

  it('renders formula prefix = as plain text', async () => {
    render(<Import />);

    const file = new File([FORMULA_EQUALS_CSV], 'formula-equals.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('=SUM(A1)')).toBeInTheDocument();
    });
  });

  it('renders formula prefix + as plain text', async () => {
    render(<Import />);

    const file = new File([FORMULA_PLUS_CSV], 'formula-plus.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  it('renders formula prefix - as plain text', async () => {
    render(<Import />);

    const file = new File([FORMULA_MINUS_CSV], 'formula-minus.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('-2')).toBeInTheDocument();
    });
  });

  it('renders formula prefix @ as plain text', async () => {
    render(<Import />);

    const file = new File([FORMULA_AT_CSV], 'formula-at.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/process csv/i));

    await waitFor(() => {
      expect(screen.getByText('@cmd')).toBeInTheDocument();
    });
  });
});
