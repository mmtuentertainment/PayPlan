import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Import from '@/pages/Import';

// T001: Currency validation test fixtures
const VALID_CURRENCY_CSV = `provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,EUR,2025-10-16,true
Afterpay,37.50,GBP,2025-10-17,false`;

const LOWERCASE_CURRENCY_CSV = `provider,amount,currency,dueISO,autopay
Klarna,25.00,usd,2025-10-15,false`;

const WHITESPACE_CURRENCY_CSV = `provider,amount,currency,dueISO,autopay
Klarna,25.00, USD ,2025-10-15,false`;

const TWO_LETTER_CURRENCY_CSV = `provider,amount,currency,dueISO,autopay
Klarna,25.00,US,2025-10-15,false`;

const FOUR_LETTER_CURRENCY_CSV = `provider,amount,currency,dueISO,autopay
Affirm,50.00,USDX,2025-10-16,true`;

const CRLF_VALID_CURRENCY_CSV = `provider,amount,currency,dueISO,autopay\r
Klarna,25.00,USD,2025-10-15,false\r
Affirm,50.00,EUR,2025-10-16,true`;

beforeEach(() => {
  // Mock fetch to ensure zero network calls
  global.fetch = vi.fn(() => Promise.reject(new Error('No network allowed')));

  // Mock URL methods for ICS download
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock File.prototype.text()
  File.prototype.text = vi.fn(async function(this: File) {
    if (this.name === 'valid-currency.csv') return VALID_CURRENCY_CSV;
    if (this.name === 'lowercase-currency.csv') return LOWERCASE_CURRENCY_CSV;
    if (this.name === 'whitespace-currency.csv') return WHITESPACE_CURRENCY_CSV;
    if (this.name === 'two-letter-currency.csv') return TWO_LETTER_CURRENCY_CSV;
    if (this.name === 'four-letter-currency.csv') return FOUR_LETTER_CURRENCY_CSV;
    if (this.name === 'crlf-currency.csv') return CRLF_VALID_CURRENCY_CSV;
    return '';
  });
});

afterEach(() => {
  vi.restoreAllMocks(); // Prevent spy leakage
});

// T001: Currency validation tests
describe('CSV Import v1.1 - Currency Validation', () => {
  it('accepts valid uppercase currency codes (USD/EUR/GBP)', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // No error alert should be present
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts lowercase currency codes after normalization (usd → USD)', async () => {
    render(<Import />);

    const file = new File([LOWERCASE_CURRENCY_CSV], 'lowercase-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // No error - lowercase should be normalized to uppercase
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts currency codes with whitespace after trim ( USD )', async () => {
    render(<Import />);

    const file = new File([WHITESPACE_CURRENCY_CSV], 'whitespace-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects two-letter currency code (US) with exact error message', async () => {
    render(<Import />);

    const file = new File([TWO_LETTER_CURRENCY_CSV], 'two-letter-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toBe('Invalid currency code in row 1: US (expected 3-letter ISO 4217 code)');
    });

    // No partial results
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('rejects four-letter currency code (USDX) with exact error message', async () => {
    render(<Import />);

    const file = new File([FOUR_LETTER_CURRENCY_CSV], 'four-letter-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toBe('Invalid currency code in row 1: USDX (expected 3-letter ISO 4217 code)');
    });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('handles CRLF line endings with currency validation', async () => {
    render(<Import />);

    const file = new File([CRLF_VALID_CURRENCY_CSV], 'crlf-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('verifies no network calls during currency validation', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// T002: Clear button tests
describe('CSV Import v1.1 - Clear Button', () => {
  it('renders Clear button with accessible name', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);

    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn).toHaveAttribute('type', 'button');
  });

  it('Clear button appears after Process CSV and before Download ICS', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const processBtn = screen.getByRole('button', { name: /process csv/i });
    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    const downloadBtn = screen.getByRole('button', { name: /download.*ics/i });

    const buttons = screen.getAllByRole('button');
    const idx = (el: HTMLElement) => buttons.findIndex(b => b === el);

    expect(idx(clearBtn)).toBeGreaterThan(idx(processBtn));
    expect(idx(downloadBtn)).toBeGreaterThan(idx(clearBtn));
  });

  it('Clear button resets file selection', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);

    expect(screen.getByText(/selected.*valid-currency\.csv/i)).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
    });

    expect(input.value).toBe('');
  });

  it('Clear button removes error message', async () => {
    render(<Import />);

    const file = new File([TWO_LETTER_CURRENCY_CSV], 'two-letter-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('Clear button removes results table', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  it('Clear button is keyboard accessible (Enter)', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);

    const clearBtn = screen.getByRole('button', { name: /^clear$/i });

    // Verify button is focusable and has proper type
    expect(clearBtn).toHaveAttribute('type', 'button');
    clearBtn.focus();
    expect(document.activeElement).toBe(clearBtn);

    // Simulate Enter key activation (keyDown triggers click, then keyUp)
    fireEvent.keyDown(clearBtn, { key: 'Enter', code: 'Enter' });
    fireEvent.click(clearBtn); // Native button behavior
    fireEvent.keyUp(clearBtn, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
    });
  });

  it('Clear button is keyboard accessible (Space)', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);

    const clearBtn = screen.getByRole('button', { name: /^clear$/i });

    clearBtn.focus();
    expect(document.activeElement).toBe(clearBtn);

    // Simulate Space key activation (keyDown triggers click, then keyUp)
    fireEvent.keyDown(clearBtn, { key: ' ', code: 'Space' });
    fireEvent.click(clearBtn); // Native button behavior
    fireEvent.keyUp(clearBtn, { key: ' ', code: 'Space' });

    await waitFor(() => {
      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
    });
  });

  it('verifies no network calls when clicking Clear', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);

    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    fireEvent.click(clearBtn);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// T003: A11y assertions
describe('CSV Import v1.1 - Accessibility', () => {
  it('file input has associated label', () => {
    render(<Import />);

    const label = screen.getByText(/drag csv file here or choose file/i);
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('id', 'csv-file-input');
    expect(label).toHaveAttribute('for', 'csv-file-input');
  });

  it('error region uses role="alert" aria-live="polite"', async () => {
    render(<Import />);

    const file = new File([TWO_LETTER_CURRENCY_CSV], 'two-letter-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('results table has caption for screen readers', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      const table = screen.getByRole('table');
      const caption = table.querySelector('caption');
      expect(caption).toBeInTheDocument();
      expect(caption?.textContent).toMatch(/payment schedule/i);
    });
  });

  it('all action buttons have type="button"', async () => {
    render(<Import />);

    const file = new File([VALID_CURRENCY_CSV], 'valid-currency.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], writable: false });

    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /process csv/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
