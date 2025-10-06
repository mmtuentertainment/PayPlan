import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocaleToggle } from '../../src/components/LocaleToggle';

describe('LocaleToggle state and modal behavior', () => {
  test('isExtracting=true disables re-extract button', () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={true}
        isExtracting={true}
      />
    );

    const reExtractButton = screen.getByText('Re-extract with new format');
    expect(reExtractButton).toBeDisabled();
  });

  test('isExtracting=false enables re-extract button', () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={true}
        isExtracting={false}
      />
    );

    const reExtractButton = screen.getByText('Re-extract with new format');
    expect(reExtractButton).not.toBeDisabled();
  });

  test('modal opens when re-extract button clicked', async () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={true}
        isExtracting={false}
      />
    );

    fireEvent.click(screen.getByText('Re-extract with new format'));

    await waitFor(() => {
      expect(screen.getByText('Change date format?')).toBeInTheDocument();
    });
  });

  test('modal shows correct description for US->EU switch', async () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={true}
        isExtracting={false}
      />
    );

    fireEvent.click(screen.getByText('Re-extract with new format'));

    await waitFor(() => {
      expect(screen.getByText(/Switching to EU \(DD\/MM\/YYYY\)/)).toBeInTheDocument();
      expect(screen.getByText(/February 1, 2026/)).toBeInTheDocument();
    });
  });

  test('modal shows correct description for EU->US switch', async () => {
    render(
      <LocaleToggle
        locale="EU"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={true}
        isExtracting={false}
      />
    );

    fireEvent.click(screen.getByText('Re-extract with new format'));

    await waitFor(() => {
      expect(screen.getByText(/Switching to US \(MM\/DD\/YYYY\)/)).toBeInTheDocument();
      expect(screen.getByText(/January 2, 2026/)).toBeInTheDocument();
    });
  });

  test('clicking cancel closes modal without calling onReExtract', async () => {
    const onReExtract = vi.fn();

    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={onReExtract}
        hasExtractedData={true}
        isExtracting={false}
      />
    );

    fireEvent.click(screen.getByText('Re-extract with new format'));

    await waitFor(() => {
      expect(screen.getByText('Change date format?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Keep current format'));

    await waitFor(() => {
      expect(screen.queryByText('Change date format?')).not.toBeInTheDocument();
    });

    expect(onReExtract).not.toHaveBeenCalled();
  });

  test('clicking confirm calls onReExtract and closes modal', async () => {
    const onReExtract = vi.fn();

    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={onReExtract}
        hasExtractedData={true}
        isExtracting={false}
      />
    );

    fireEvent.click(screen.getByText('Re-extract with new format'));

    await waitFor(() => {
      expect(screen.getByText('Change date format?')).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByText('Re-extract with new format');
    const modalConfirmButton = confirmButtons[1]; // Second one is in the modal
    fireEvent.click(modalConfirmButton);

    await waitFor(() => {
      expect(screen.queryByText('Change date format?')).not.toBeInTheDocument();
    });

    expect(onReExtract).toHaveBeenCalledTimes(1);
  });

  test('RadioGroup has aria-label', () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={false}
        isExtracting={false}
      />
    );

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-label', 'Date format locale');
  });

  test('RadioGroup has aria-describedby pointing to warning', () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={false}
        isExtracting={false}
      />
    );

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-describedby', 'locale-impact-warning');

    // Verify the warning element exists
    const warning = document.getElementById('locale-impact-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent('Changing date format may alter payment due dates and ordering');
  });

  test('isExtracting=true disables radio buttons', () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={false}
        isExtracting={true}
      />
    );

    const usRadio = screen.getByLabelText('US (MM/DD/YYYY)');
    const euRadio = screen.getByLabelText('EU (DD/MM/YYYY)');

    expect(usRadio).toBeDisabled();
    expect(euRadio).toBeDisabled();
  });
});
