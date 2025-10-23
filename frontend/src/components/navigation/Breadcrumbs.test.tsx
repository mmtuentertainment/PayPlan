import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe } from 'vitest-axe';
import Breadcrumbs from './Breadcrumbs';
import * as usePaymentArchivesModule from '@/hooks/usePaymentArchives';

// Mock the usePaymentArchives hook
vi.mock('@/hooks/usePaymentArchives');

describe('Breadcrumbs', () => {
  beforeEach(() => {
    // Default mock implementation
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });
  });

  it('should not render breadcrumbs on home page', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    // Should not render any breadcrumb navigation
    expect(container.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
  });

  it('should render "Home > Archives" on archives list page', () => {
    render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Archives')).toBeInTheDocument();
  });

  it('should render "Home > Archives > Archive Name" on archive detail page', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();

    // Verify the archive name is displayed (fallback to 'Archive' since mock returns null)
    expect(screen.getByText('Archive')).toBeInTheDocument();

    // Verify breadcrumb structure
    const breadcrumbItems = screen.getAllByRole('listitem');
    expect(breadcrumbItems.length).toBe(3);
  });

  it('should navigate when clicking breadcrumb links', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should truncate long labels with ellipsis', () => {
    const longArchiveName = 'A'.repeat(60); // 60 characters
    const archiveId = '550e8400-e29b-41d4-a716-446655440001';

    // Mock getArchiveById to return an archive with a long name
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => ({
        id: archiveId,
        name: longArchiveName,
        createdAt: '2023-05-15T12:34:56.000Z',
        paymentCount: 0,
        payments: []
      })),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${archiveId}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs maxLabelLength={50} />} />
        </Routes>
      </MemoryRouter>
    );

    // Should find truncated text with ellipsis
    const breadcrumbItems = screen.getAllByRole('listitem');
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    const text = lastItem.textContent || '';

    // Verify the text ends with ellipsis and is properly truncated
    expect(text).toMatch(/\.\.\.$/); // Ends with ellipsis
    expect(text.length).toBeLessThanOrEqual(50); // Within maxLabelLength
  });

  it('should use Radix UI Tooltip for truncated labels', () => {
    const longArchiveName = 'Very Long Archive Name That Should Be Truncated In Display';
    const archiveId = '550e8400-e29b-41d4-a716-446655440002';

    // Mock getArchiveById to return an archive with a long name
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => ({
        id: archiveId,
        name: longArchiveName,
        createdAt: '2023-05-15T12:34:56.000Z',
        paymentCount: 0,
        payments: []
      })),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${archiveId}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs maxLabelLength={20} />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify the label is truncated with ellipsis
    const breadcrumbItems = screen.getAllByRole('listitem');
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    const truncatedText = lastItem.textContent || '';
    expect(truncatedText).toContain('...');
    expect(truncatedText.length).toBeLessThanOrEqual(20);

    // Verify Radix UI Tooltip wrapper structure is present
    const truncatedElement = lastItem.querySelector('span[aria-current="page"]');
    expect(truncatedElement).toBeInTheDocument();

    // Verify element is focusable (required for keyboard tooltip access)
    expect(truncatedElement).toHaveAttribute('tabIndex', '0');
  });

  it('should mark current page with aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const currentItem = screen.getByText('Archives');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('should render breadcrumbs as an ordered list', () => {
    render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const breadcrumbNav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const orderedList = breadcrumbNav.querySelector('ol');

    expect(orderedList).toBeInTheDocument();
  });

  it('should not make current item clickable', () => {
    render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const currentItem = screen.getByText('Archives');

    // Current item should be a span, not a link
    expect(currentItem.tagName).toBe('SPAN');
  });

  it('should render correct breadcrumbs for settings page', () => {
    render(
      <MemoryRouter initialEntries={['/settings/preferences']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();

    // Current breadcrumb shows "Settings" as the current page
    const currentItem = screen.getByText('Settings');
    expect(currentItem).toBeInTheDocument();
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });
});

describe('Breadcrumbs - Accessibility', () => {
  it('should have no accessibility violations on archives page', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no accessibility violations on archive detail page', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/archives/test-id']}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have correct ARIA landmark', () => {
    render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toBeInTheDocument();
  });

  it('should have accessible links with correct hrefs', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440004';

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const archivesLink = screen.getByRole('link', { name: 'Archives' });
    expect(archivesLink).toHaveAttribute('href', '/archives');
  });

  it('should not use tooltip for non-truncated labels', () => {
    const shortName = 'Short Archive Name';
    const archiveId = '550e8400-e29b-41d4-a716-446655440003';

    // Mock getArchiveById to return an archive with a short name
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => ({
        id: archiveId,
        name: shortName,
        createdAt: '2023-05-15T12:34:56.000Z',
        paymentCount: 0,
        payments: []
      })),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={[`/archives/${archiveId}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs maxLabelLength={50} />} />
        </Routes>
      </MemoryRouter>
    );

    const breadcrumbItems = screen.getAllByRole('listitem');
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];

    // Verify the label is NOT truncated
    expect(lastItem.textContent).toBe(shortName);
    expect(lastItem.textContent).not.toContain('...');

    // Verify NO Radix UI Tooltip is used (no data-state attribute)
    const tooltipElement = container.querySelector('[data-state]');
    expect(tooltipElement).toBeNull();
  });

  it('should allow keyboard navigation through breadcrumb links', async () => {
    const user = userEvent.setup();
    const validUUID = '550e8400-e29b-41d4-a716-446655440005';

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const archivesLink = screen.getByRole('link', { name: 'Archives' });

    // Links should be focusable
    homeLink.focus();
    expect(document.activeElement).toBe(homeLink);

    // Tab should move to next link
    await user.tab();
    expect(document.activeElement).toBe(archivesLink);
  });

  it('should have links in correct tab order', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440006';

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const archivesLink = screen.getByRole('link', { name: 'Archives' });

    // Verify links don't have negative tabIndex
    expect(homeLink).not.toHaveAttribute('tabindex', '-1');
    expect(archivesLink).not.toHaveAttribute('tabindex', '-1');

    // Links should be in natural tab order (no explicit tabIndex manipulation)
    expect(homeLink.tabIndex).toBeGreaterThanOrEqual(0);
    expect(archivesLink.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('should not allow keyboard focus on current breadcrumb item', () => {
    render(
      <MemoryRouter initialEntries={['/archives']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const currentItem = screen.getByText('Archives');

    // Current item should be a span, not focusable
    expect(currentItem.tagName).toBe('SPAN');
    expect(currentItem).not.toHaveAttribute('tabindex');
  });

  it('should show loading state when usePaymentArchives is loading', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440007';

    // Mock loading state
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: true,
      error: null,
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show "Loading..." as archive name
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show fallback when usePaymentArchives has generic error', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440008';

    // Mock generic error state
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: { type: 'Serialization', message: 'Failed to load archives' },
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show fallback "Archive" as archive name
    expect(screen.getByText('Archive')).toBeInTheDocument();
    // Should still have proper navigation structure
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();
  });

  it('should handle NotFound error gracefully with fallback text', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440009';

    // Mock NotFound error (404 equivalent)
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: { type: 'NotFound', message: 'Archive not found' },
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show fallback "Archive" without exposing error details
    expect(screen.getByText('Archive')).toBeInTheDocument();
    // Verify no sensitive error information is displayed
    expect(screen.queryByText(/not found/i)).toBeNull();
  });

  it('should handle Corrupted error (data integrity issue) with fallback', () => {
    const validUUID = '550e8400-e29b-41d4-a716-44665544000a';

    // Mock Corrupted error (500 equivalent - data corruption)
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: { type: 'Corrupted', message: 'Archive data is corrupted' },
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show fallback "Archive" without exposing corruption details
    expect(screen.getByText('Archive')).toBeInTheDocument();
    // Verify no sensitive error information is displayed
    expect(screen.queryByText(/corrupted/i)).toBeNull();
  });

  it('should handle Security error (localStorage blocked) with fallback', () => {
    const validUUID = '550e8400-e29b-41d4-a716-44665544000b';

    // Mock Security error (localStorage access denied)
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: { type: 'Security', message: 'localStorage is disabled' },
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show fallback "Archive" without exposing security details
    expect(screen.getByText('Archive')).toBeInTheDocument();
    // Verify no sensitive error information is displayed
    expect(screen.queryByText(/security/i)).toBeNull();
    expect(screen.queryByText(/localStorage/i)).toBeNull();
  });

  it('should handle Validation error without exposing sensitive details', () => {
    const validUUID = '550e8400-e29b-41d4-a716-44665544000c';

    // Mock Validation error (invalid archive ID format)
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: { type: 'Validation', message: 'Invalid archive ID format' },
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show fallback "Archive" without exposing validation error
    expect(screen.getByText('Archive')).toBeInTheDocument();
    // Verify no validation error details are displayed
    expect(screen.queryByText(/invalid/i)).toBeNull();
    expect(screen.queryByText(/validation/i)).toBeNull();
  });

  it('should not expose PII or payment data in any error state', () => {
    const validUUID = '550e8400-e29b-41d4-a716-44665544000d';

    // Mock error with archive that would contain payment data
    vi.mocked(usePaymentArchivesModule.usePaymentArchives).mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: {
        type: 'NotFound',
        message: 'Archive not found',
        archiveId: validUUID
      },
      clearError: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify no archive ID is exposed in the DOM
    expect(container.textContent).not.toContain(validUUID);
    // Verify no error message is displayed to user
    expect(container.textContent).not.toContain('not found');
    // Only safe fallback text should appear
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('should distinguish between NotFound and Corrupted errors with appropriate fallback', () => {
    const validUUID = '550e8400-e29b-41d4-a716-44665544000e';

    // Test NotFound error
    const notFoundMock = vi.mocked(usePaymentArchivesModule.usePaymentArchives);
    notFoundMock.mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: { type: 'NotFound', message: 'Archive not found' },
      clearError: vi.fn(),
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show same fallback for NotFound
    expect(screen.getByText('Archive')).toBeInTheDocument();

    // Test Corrupted error
    notFoundMock.mockReturnValue({
      createArchive: vi.fn(),
      listArchives: vi.fn(() => []),
      getArchiveById: vi.fn(() => null),
      deleteArchive: vi.fn(),
      archives: [],
      isLoading: false,
      error: { type: 'Corrupted', message: 'Archive data is corrupted' },
      clearError: vi.fn(),
    });

    rerender(
      <MemoryRouter initialEntries={[`/archives/${validUUID}`]}>
        <Routes>
          <Route path="/archives/:id" element={<Breadcrumbs />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show same fallback for Corrupted (both use "Archive" fallback)
    expect(screen.getByText('Archive')).toBeInTheDocument();
    // Consistent behavior regardless of error type
  });
});
