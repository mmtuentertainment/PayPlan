import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleToggle } from '../../src/components/LocaleToggle';

describe('LocaleToggle', () => {
  test('renders with US selected by default', () => {
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={false}
        isExtracting={false}
      />
    );

    const usRadio = screen.getByLabelText('US (MM/DD/YYYY)');
    expect(usRadio).toBeChecked();
  });

  test('calls onLocaleChange when EU selected', () => {
    const onChange = vi.fn();
    render(
      <LocaleToggle
        locale="US"
        onLocaleChange={onChange}
        onReExtract={vi.fn()}
        hasExtractedData={false}
        isExtracting={false}
      />
    );

    const euRadio = screen.getByLabelText('EU (DD/MM/YYYY)');
    fireEvent.click(euRadio);

    expect(onChange).toHaveBeenCalledWith('EU');
  });

  test('shows re-extract button only if hasExtractedData', () => {
    const { rerender } = render(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={false}
        isExtracting={false}
      />
    );

    expect(screen.queryByText('Re-extract with new format')).not.toBeInTheDocument();

    rerender(
      <LocaleToggle
        locale="US"
        onLocaleChange={vi.fn()}
        onReExtract={vi.fn()}
        hasExtractedData={true}
        isExtracting={false}
      />
    );

    expect(screen.getByText('Re-extract with new format')).toBeInTheDocument();
  });

  test('shows confirmation dialog before re-extract', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
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

    expect(confirmSpy).toHaveBeenCalledWith('Re-extracting will discard all Quick Fixes. Continue?');
    expect(onReExtract).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test('calls onReExtract when confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
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

    expect(confirmSpy).toHaveBeenCalled();
    expect(onReExtract).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
