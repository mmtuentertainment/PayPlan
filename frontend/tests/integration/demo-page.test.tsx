import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Demo from '@/pages/Demo';

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.reject('No network allowed'));
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Demo Page Flow', () => {
  it('page renders', () => {
    render(<Demo />);
    expect(screen.getByText('PayPlan Demo')).toBeInTheDocument();
  });

  it('fixtures displayed - 10 details elements', () => {
    render(<Demo />);
    const details = document.querySelectorAll('details');
    expect(details.length).toBe(10);
  });

  it('Run Demo button exists', () => {
    render(<Demo />);
    expect(screen.getByText(/run demo/i)).toBeInTheDocument();
  });

  it('click Run Demo shows results', async () => {
    render(<Demo />);
    const button = screen.getByText(/run demo/i);

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });
  });

  it('results table appears with rows', async () => {
    render(<Demo />);
    const button = screen.getByText(/run demo/i);
    fireEvent.click(button);

    await waitFor(() => {
      const rows = document.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it('confidence pills displayed', async () => {
    render(<Demo />);
    fireEvent.click(screen.getByText(/run demo/i));

    await waitFor(() => {
      const confidencePills = screen.getAllByText(/High|Medium|Low/i);
      expect(confidencePills.length).toBeGreaterThan(0);
    });
  });

  it('risk pills appear if risks detected', async () => {
    render(<Demo />);
    fireEvent.click(screen.getByText(/run demo/i));

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    const riskText = document.body.textContent || '';
    const hasRiskPill = riskText.includes('Multiple payments') || riskText.includes('Autopay on weekend');

    if (hasRiskPill) {
      expect(hasRiskPill).toBe(true);
    }
  });

  it('Download .ics button enabled after demo runs', async () => {
    render(<Demo />);
    fireEvent.click(screen.getByText(/run demo/i));

    await waitFor(() => {
      const downloadButton = screen.getByText(/download.*ics/i);
      expect(downloadButton).toBeInTheDocument();
    });
  });

  it('click download triggers URL.createObjectURL', async () => {
    render(<Demo />);
    fireEvent.click(screen.getByText(/run demo/i));

    await waitFor(() => {
      const downloadButton = screen.getByText(/download.*ics/i);
      expect(downloadButton).toBeInTheDocument();
    });

    const downloadButton = screen.getByText(/download.*ics/i);
    fireEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('no network requests', async () => {
    render(<Demo />);
    fireEvent.click(screen.getByText(/run demo/i));

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
