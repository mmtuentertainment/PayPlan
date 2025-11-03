/**
 * Archive Feature - Public API
 *
 * Transaction archives with localStorage (50 item limit).
 * Part of Tier 0 free features (Constitutional mandate)
 */

// Re-export main services (consumers use these)
export { ArchiveService } from './lib/ArchiveService';
export { ArchiveStorage } from './lib/ArchiveStorage';

// Re-export components (named exports)
export { ArchiveErrorBoundary } from './components/ArchiveErrorBoundary';
export { ArchiveListItem } from './components/ArchiveListItem';
export { ArchiveStatistics } from './components/ArchiveStatistics';
export { CreateArchiveDialog } from './components/CreateArchiveDialog';
export { DeleteArchiveDialog } from './components/DeleteArchiveDialog';
export { ExportArchiveButton } from './components/ExportArchiveButton';

// Re-export hooks
export { usePaymentArchives } from './hooks/usePaymentArchives';
