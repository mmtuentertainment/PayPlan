# Feature Specification: Payment History Archive System

**Feature Branch**: `016-build-a-payment-archive`
**Created**: 2025-10-17
**Status**: Draft
**Input**: User description: "Build a payment history archive system that allows users to snapshot their current payment statuses (from Feature 015) when starting a new billing cycle. Users can mark payments as paid/pending throughout the month, then create a named archive (e.g., 'October 2025') that preserves that historical tracking data before resetting all payments to pending for the next cycle. Archives are immutable snapshots stored separately in localStorage with their own keys, support viewing past payment history, exporting archived data to CSV with archive metadata, and deleting old archives to manage storage space. The system must handle up to 50 archives (~500KB total), support Unicode names including emoji, auto-handle duplicate archive names, enforce a 5MB total storage limit, gracefully handle corrupted archives, provide cross-tab synchronization, and maintain <100ms performance for archive list views."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Payment Archive (Priority: P1)

A user has been tracking payments throughout October and has marked 8 out of 15 payments as paid. As November begins, they want to start fresh tracking for the new billing cycle. They click "Create Archive" button, enter the name "October 2025" in a dialog, and confirm. The system creates a snapshot of all current payment statuses (including which were marked as paid and when), saves it with a unique archive ID, then resets all current payments back to pending status. When the user views their payment list, all payments now show as pending, ready for November tracking.

**Why this priority**: This is the MVP - the core value of preserving payment history before starting a new cycle. Without this, users lose their tracking data when they want to start fresh. It's the minimum functionality needed to deliver value.

**Independent Test**: Can be fully tested by marking some payments as paid, clicking "Create Archive", entering a name, and verifying: (1) archive is saved with current statuses, (2) current payments reset to pending, (3) archive persists after page refresh. Delivers immediate value as a "monthly snapshot" feature even without viewing or exporting archives.

**Acceptance Scenarios**:

1. **Given** a user has 15 payments with 8 marked as paid and 7 pending, **When** they create an archive named "October 2025", **Then** the system creates an immutable snapshot containing all 15 payments with their current statuses and timestamps, assigns a unique archive ID, stores it in localStorage under a separate key from current status data, and resets all 15 current payments to pending status
2. **Given** a user creates an archive, **When** they refresh the page or return tomorrow, **Then** the archive is still available in the archives list and current payments remain at pending status (persistence across sessions)
3. **Given** a user has no payments in their schedule, **When** they attempt to create an archive, **Then** the system displays a message "No payments to archive" and does not create an empty archive
4. **Given** a user enters an empty or whitespace-only archive name, **When** they attempt to create the archive, **Then** the system displays validation error "Archive name cannot be empty" and does not create the archive
5. **Given** an archive named "October 2025" already exists, **When** the user creates another archive with the same name, **Then** the system automatically appends " (2)" to create "October 2025 (2)", preserving both archives without conflict

---

### User Story 2 - View Archived Payment History (Priority: P2)

A user has created 3 archives over the past 3 months: "August 2025", "September 2025", and "October 2025". They want to review how many payments they made in September. They navigate to the "Archive History" page (accessed via navigation menu or button), see a list of all archives showing name, creation date, and payment count. They click on "September 2025" to view the details page, which displays all payments from that archive in read-only format with their paid/pending statuses, timestamps when marked as paid, and the original payment details (provider, amount, date). They cannot edit or modify archived payments - the view is purely for reference.

**Why this priority**: This allows users to review past payment history, which is essential for the archive feature to provide value beyond just clearing data. Users need to access their historical records for budgeting, tax preparation, or dispute resolution.

**Independent Test**: Can be tested by creating multiple archives with different payment data, navigating to the archive list, clicking an archive, and verifying: (1) list shows all archives with metadata, (2) detail view shows correct payments and statuses, (3) no edit controls are present (read-only). Delivers value for historical reference even without statistics or export features.

**Acceptance Scenarios**:

1. **Given** a user has 3 archives stored, **When** they navigate to the "Archive History" page, **Then** they see a list displaying all 3 archives with metadata: archive name, creation date, total payment count, and a "View" button for each
2. **Given** a user clicks the "View" button on "September 2025" archive, **When** the archive detail page loads, **Then** they see all payments from that archive with their status (paid/pending), timestamps for paid payments, and original payment details (provider, amount, due date), and all fields are read-only (no edit controls)
3. **Given** a user is viewing an archive detail page, **When** they navigate back to the archive list, **Then** they see the updated list without needing to refresh the page (React state management)
4. **Given** localStorage contains a corrupted archive (invalid JSON or missing required fields), **When** the user loads the archive list, **Then** the system displays the corrupted archive with an error badge, shows a warning message "This archive is corrupted and cannot be viewed", and allows the user to delete it without crashing the app
5. **Given** a user has 20 archives totaling 200KB, **When** they load the archive list page, **Then** the page loads within 100ms showing all archive metadata without performance degradation

---

### User Story 3 - View Archive Statistics (Priority: P3)

A user opens the "October 2025" archive detail page and wants to see summary statistics about their payment activity that month. At the top of the archive detail view, they see a statistics panel displaying: "Total Payments: 20", "Paid: 15 (75%)", "Pending: 5 (25%)", "Date Range: Oct 1-31, 2025", "Average Payment: $127.50". These statistics help them quickly understand their payment patterns without manually counting through the payment list.

**Why this priority**: This adds analytical value to archived data, but users can still view individual payments and manually assess their history without calculated statistics. It's a nice-to-have enhancement that improves UX but isn't essential for basic archive viewing.

**Independent Test**: Can be tested by creating an archive with known payment data (e.g., 10 total, 7 paid, 3 pending), viewing the archive, and verifying statistics are accurately calculated and displayed in the statistics panel. Delivers value for quick insights even without export or delete features.

**Acceptance Scenarios**:

1. **Given** a user views an archive containing 20 payments with 15 paid and 5 pending, **When** the archive detail page loads, **Then** they see a statistics panel showing "Total: 20", "Paid: 15 (75%)", "Pending: 5 (25%)"
2. **Given** an archive contains payments ranging from Oct 1 to Oct 31, 2025, **When** the user views the statistics panel, **Then** they see "Date Range: Oct 1-31, 2025" calculated from the earliest and latest payment due dates
3. **Given** an archive contains payments with various amounts in the same currency, **When** the user views the statistics panel, **Then** they see "Average Payment: $127.50" calculated from all payment amounts
4. **Given** an archive contains payments in multiple currencies (USD, EUR), **When** the user views the statistics panel, **Then** average payment calculation is skipped and shows "Multiple currencies" or only calculates for the dominant currency with a note
5. **Given** an archive has all payments marked as pending (0 paid), **When** the user views the statistics, **Then** the panel shows "Paid: 0 (0%)" without calculation errors

---

### User Story 4 - Export Archived Data to CSV (Priority: P4)

A user wants to share their October payment history with their accountant for tax preparation. They open the "October 2025" archive detail page and click the "Export CSV" button. The system generates a CSV file containing all payments from that archive with standard columns (provider, amount, currency, dueISO, autopay, paid_status, paid_timestamp) plus additional archive metadata columns (archive_name: "October 2025", archive_date: "2025-10-31T14:30:00Z"). The file is downloaded as "payplan-archive-october-2025-2025-11-05-143022.csv". The user opens it in Excel and sees all payments with clear indication of which archive they came from.

**Why this priority**: This integrates archive functionality with existing CSV export capabilities (Feature 014), but users can still view and review archives within PayPlan without exporting. It's useful for external sharing and integration with other tools, but not essential for basic archive management.

**Independent Test**: Can be tested by creating an archive, opening it, clicking "Export CSV", and verifying: (1) CSV contains all archived payments with correct statuses, (2) archive metadata columns are present, (3) file naming includes archive name and timestamp, (4) file opens correctly in spreadsheet software. Delivers value for external sharing even without archive deletion features.

**Acceptance Scenarios**:

1. **Given** a user is viewing an archive detail page, **When** they click the "Export CSV" button, **Then** a CSV file is downloaded containing all payments from that archive with columns: provider, amount, currency, dueISO, autopay, paid_status, paid_timestamp, archive_name, archive_date
2. **Given** a user exports an archive named "October 2025" created on 2025-10-31 at 14:30:00, **When** the CSV is generated, **Then** every row includes metadata columns: archive_name="October 2025", archive_date="2025-10-31T14:30:00Z"
3. **Given** a user exports an archive on November 5, 2025 at 14:30:22, **When** the file is downloaded, **Then** the filename format is "payplan-archive-october-2025-2025-11-05-143022.csv" (slugified archive name + ISO timestamp)
4. **Given** an archive contains 50 payments, **When** the user exports to CSV, **Then** the export completes within 3 seconds without browser freezing or performance degradation
5. **Given** an archive contains Unicode characters in the archive name (e.g., "October 2025 💰"), **When** the CSV is exported, **Then** Unicode characters are preserved correctly in the archive_name column and filename is safely slugified (e.g., "payplan-archive-october-2025-emoji-removed.csv")

---

### User Story 5 - Delete Old Archives (Priority: P5)

A user has been using PayPlan for 8 months and has created 8 archives (one per month). They notice their browser storage is getting full and want to delete old archives they no longer need. They navigate to the "Archive History" page, see the list of 8 archives, and click the "Delete" button next to "March 2025". A confirmation dialog appears: "Delete archive 'March 2025'? This cannot be undone." They confirm, and the archive is permanently removed from localStorage. The archive list updates to show 7 remaining archives. They repeat this for "April 2025" and "May 2025", freeing up storage space.

**Why this priority**: This is a maintenance/cleanup feature that's useful for long-term users managing storage limits, but isn't essential for basic archive creation and viewing. Users can live with accumulated archives until they hit storage limits, at which point they'd need this feature or browser cache clearing.

**Independent Test**: Can be tested by creating multiple archives, clicking "Delete" on one, confirming the dialog, and verifying: (1) archive is removed from storage, (2) archive list updates immediately, (3) deletion persists after page refresh, (4) confirmation prevents accidental deletion. Delivers value for storage management but isn't required for day-to-day archiving workflows.

**Acceptance Scenarios**:

1. **Given** a user has 8 archives stored, **When** they click the "Delete" button next to "March 2025", **Then** a confirmation dialog appears with the message "Delete archive 'March 2025'? This cannot be undone." with "Cancel" and "Delete" buttons
2. **Given** the user confirms deletion in the dialog, **When** they click "Delete", **Then** the archive is permanently removed from localStorage, the archive list updates immediately to show 7 remaining archives, and the deletion persists after page refresh
3. **Given** the user clicks "Cancel" in the confirmation dialog, **When** the dialog closes, **Then** the archive is not deleted and remains in the archive list unchanged
4. **Given** a user deletes an archive, **When** the deletion completes, **Then** the operation finishes within 3 seconds including confirmation dialog interaction and storage update
5. **Given** a user is viewing an archive detail page for "March 2025", **When** they delete that archive from another browser tab (cross-tab deletion), **Then** the detail page detects the deletion via storage event, displays a message "This archive has been deleted", and provides a link to return to the archive list

---

### Edge Cases

- What happens when a user reaches the 50-archive limit? System displays error message "Archive limit reached (50/50). Delete old archives to create new ones." and prevents archive creation until space is freed.
- What happens when a user tries to create an archive with no payments in their schedule? System displays message "No payments to archive. Import or process payments first." and does not create an empty archive.
- What happens when an archive name is empty or whitespace-only? System displays validation error "Archive name cannot be empty" and does not create the archive.
- What happens when two archives have identical names? System automatically appends " (2)", " (3)", etc. to the new archive name to ensure uniqueness (e.g., "October 2025" → "October 2025 (2)").
- What happens when localStorage is corrupted for one specific archive but others are valid? System displays the corrupted archive in the list with an error badge and "View" button disabled, shows warning "This archive is corrupted", allows user to delete it, and loads all other valid archives normally without crashing.
- What happens when a user deletes an archive that's currently being viewed in another browser tab? The detail page detects deletion via storage event listener, displays "This archive has been deleted" message, and provides a "Back to Archives" button to return to the list.
- What happens when total storage (all archives + current status data) exceeds 5MB? System calculates total size before creating new archive, displays error "Storage limit exceeded (5MB). Delete old archives to free space.", and prevents archive creation until storage is freed.
- What happens when an archive contains emoji or Unicode characters in the name (e.g., "October 2025 💰")? System preserves Unicode characters in stored archive name and displays them correctly in UI, but safely slugifies the name for CSV filenames (removes/replaces special characters).
- What happens when a user creates an archive with the same name as a deleted archive? System treats it as a new archive with a fresh ID - there's no "undelete" or restoration of the old deleted archive data.
- What happens when viewing an archive with 200 payments (unusually large)? System loads archive detail page with loading indicator, renders payments in virtualized list to maintain <500ms initial render performance, and provides pagination or "Load More" if needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create an archive by providing a user-defined name via a dialog or form input
- **FR-002**: System MUST create a snapshot of all current payment status records (from Feature 015 PaymentStatusCollection) when user creates an archive, capturing: payment IDs, statuses (paid/pending), timestamps, and archive metadata (name, creation date)
- **FR-003**: System MUST reset all current payment statuses to "pending" immediately after creating an archive, clearing the active PaymentStatusCollection while preserving the archived snapshot
- **FR-004**: System MUST store each archive separately in localStorage using a unique storage key pattern (e.g., "payplan:archive:{archiveId}") to isolate archives from current status data
- **FR-005**: System MUST maintain a two-tier storage structure: (1) archive index stored at "payplan:archive:index" containing metadata for all archives (names, dates, counts), (2) individual archive data stored at unique per-archive keys for efficient listing without loading full archive data
- **FR-006**: System MUST enforce a hard limit of 50 archives maximum, displaying an error message "Archive limit reached (50/50). Delete old archives to create new ones." and preventing creation when limit is reached
- **FR-007**: System MUST treat archived payment data as immutable - once created, archives cannot be edited, modified, or have their payment statuses changed (read-only after creation)
- **FR-008**: System MUST display a list of all archives showing metadata: archive name, creation date (ISO format displayed as human-readable), total payment count, and actions (View, Export, Delete)
- **FR-009**: System MUST provide an archive detail view that displays all payments from the selected archive with their statuses (paid/pending), timestamps for paid payments, and original payment details (provider, amount, due date, autopay), rendered as read-only data with no edit controls
- **FR-010**: System MUST calculate and display statistics for each archive: total payment count, paid count with percentage, pending count with percentage, date range from earliest to latest payment due date
- **FR-011**: System MUST support CSV export for archived data including standard payment columns (provider, amount, currency, dueISO, autopay, paid_status, paid_timestamp) plus archive metadata columns (archive_name, archive_date)
- **FR-012**: System MUST allow users to delete archives with a confirmation dialog displaying the message "Delete archive '{name}'? This cannot be undone." with Cancel and Delete buttons
- **FR-013**: System MUST support Unicode characters including emoji in archive names for international users and modern naming conventions (e.g., "October 2025 💰", "Paiements Octobre", "十月 2025")
- **FR-014**: System MUST automatically handle duplicate archive names by appending " (2)", " (3)", etc. when a new archive has the same name as an existing one (e.g., "October 2025" → "October 2025 (2)")
- **FR-015**: System MUST validate total storage size before creating new archives, calculating combined size of all archives plus current status data, and rejecting archive creation with error "Storage limit exceeded (5MB). Delete old archives to free space." if total would exceed 5MB
- **FR-016**: System MUST gracefully handle corrupted archives by displaying them in the archive list with an error badge, disabling the "View" button, showing warning "This archive is corrupted and cannot be viewed", allowing deletion, and loading all other valid archives normally without crashing the application
- **FR-017**: System MUST support cross-tab synchronization using localStorage storage events to detect when archives are created, deleted, or modified in other browser tabs, automatically updating the UI to reflect changes without requiring page refresh
- **FR-018**: System MUST load the archive list page (with metadata for all archives) in under 100ms even with 20 archives totaling 200KB, using the two-tier index structure to avoid loading full archive data during list view
- **FR-019**: System MUST persist all archive data across browser sessions, surviving page refreshes, tab closes/reopens, and browser restarts, using the same localStorage reliability as Feature 015 payment status tracking
- **FR-020**: System MUST maintain privacy-first approach with all archive data stored locally in browser localStorage, no server uploads, no cloud synchronization, and no external API calls for archive management

### Key Entities

- **Archive**: Represents a complete immutable snapshot of payment status history. Attributes: unique archive ID (UUID v4), user-defined archive name (string, supports Unicode), creation timestamp (ISO 8601), array of archived payment records, metadata (payment counts, date range). Relationships: Contains multiple PaymentArchiveRecords, referenced by ArchiveIndex, stored separately in localStorage with unique key.

- **ArchiveMetadata**: Lightweight summary data for an archive used in list views. Attributes: archive ID, archive name, creation timestamp, total payment count, paid payment count, pending payment count. Relationships: Stored in ArchiveIndex for efficient listing, derived from full Archive data during creation.

- **ArchiveIndex**: Central registry of all archives for the user. Attributes: array of ArchiveMetadata objects, last modified timestamp (ISO 8601), schema version (semantic versioning). Relationships: References all Archives by ID, stored at single localStorage key "payplan:archive:index", updated whenever archives are created/deleted.

- **PaymentArchiveRecord**: Represents a single payment's status at the time of archiving. Extends PaymentStatusRecord from Feature 015 with additional context. Attributes: payment ID (UUID v4), status (paid/pending), timestamp when marked as paid (ISO 8601 or null for pending), original payment details (provider name, amount, currency, due date, autopay status). Relationships: Belongs to one Archive, immutable after archive creation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create an archive including name input and confirmation in under 5 seconds from clicking "Create Archive" button to seeing updated archive list
- **SC-002**: Archive data persists correctly across 100% of browser sessions (page refresh, tab close/reopen, browser restart) with no data loss or corruption
- **SC-003**: Users can view an archive detail page containing 50 payments in under 100ms from clicking "View" to seeing payment list rendered
- **SC-004**: System loads the archive list page with metadata for 20 archives in under 100ms without needing to load full archive data (validates two-tier index performance)
- **SC-005**: Users can toggle payment status (paid/pending) in current schedule, create archive, and verify current payments reset to pending with visual feedback appearing within 200ms of archive creation completion
- **SC-006**: CSV export for an archived schedule with 50 payments completes in under 3 seconds from clicking "Export CSV" to file download starting
- **SC-007**: Users can delete an archive including confirmation dialog interaction in under 3 seconds from clicking "Delete" to seeing updated archive list
- **SC-008**: System supports 50 archives with average of 10 payments each (~500KB total) without browser storage errors, maintaining <100ms list load performance
- **SC-009**: Unicode archive names including emoji and international characters render correctly in UI and CSV exports for 100% of characters without encoding errors or visual glitches
- **SC-010**: Users successfully complete the full archive workflow (mark payments → create archive → view archive list → view archive detail → verify current payments reset) on first attempt 90% of the time without errors or confusion

## Assumptions

- Users understand that creating an archive resets current payment statuses to pending, requiring them to re-track payments for the new cycle (may need clear UI messaging/confirmation)
- Archive names are primarily for user reference and don't need to follow any specific format or convention (e.g., users can name archives "October", "Q4 2025", "Before vacation", etc.)
- Users will primarily create archives monthly or quarterly, resulting in 12-50 archives per year (aligns with 50-archive limit)
- Browser localStorage is available and enabled with at least 5MB quota, which is standard for modern browsers (Chrome: 10MB, Firefox: 10MB, Safari: 5MB)
- Users accessing archives on the same device/browser where they were created (no cross-device sync expectations)
- Archive detail views can display all payments at once (up to ~100 payments) without requiring pagination, relying on browser scrolling
- CSV export for archives uses the same format and libraries as Feature 014, only adding archive metadata columns
- The two-tier index structure (separate index + individual archives) provides sufficient performance for 50 archives without requiring pagination or lazy loading of the list
- Users understand that deleted archives are permanently gone and cannot be recovered (confirmation dialog makes this clear)
- Unicode support relies on browser/OS font rendering capabilities for displaying emoji and international characters correctly

## Dependencies

- Requires Feature 015 (Payment Status Tracking) for PaymentStatusRecord, PaymentStatusCollection data structures and localStorage storage patterns
- Requires existing PaymentStatusStorage service for accessing current payment statuses and resetting them after archive creation
- Requires existing payment schedule data structures (provider, amount, currency, dueISO, autopay) to include in archived records
- Requires Feature 014 (CSV Export) patterns and PapaParse library for exporting archived data to CSV format
- Requires localStorage API support with minimum 5MB quota (standard in modern browsers)
- Requires browser storage event API for cross-tab synchronization
- Requires React 19.1.1 state management patterns for UI updates and archive list/detail views

## Out of Scope

- **Multi-device synchronization**: Archives are local-only and do not sync across devices or browsers via cloud storage or account systems
- **Archive editing or updating**: Once created, archives are immutable - users cannot modify payment statuses, add/remove payments, or edit archive names after creation
- **Partial archiving**: System archives all current payments with their statuses - users cannot selectively archive only certain payments or date ranges
- **Archive restoration**: Deleted archives are permanently removed - no "undelete", "restore from trash", or backup/recovery features
- **Archive sharing**: No ability to export entire archives in a portable format for sharing with other PayPlan users or importing into another browser
- **Archive encryption**: Archive data is stored in plain text in localStorage - no encryption, password protection, or security features beyond browser-level storage isolation
- **Archive search or filtering**: No ability to search across all archives for specific payments, providers, or date ranges - users must browse archives individually
- **Archive comparison**: No side-by-side comparison of multiple archives to see payment pattern differences or trends over time
- **Automatic archiving**: No scheduled or recurring archive creation - users must manually create archives when they want to snapshot their data
- **Archive notifications**: No reminders or alerts suggesting when to create an archive (e.g., "End of month - time to archive?")
- **Archive analytics**: No trend analysis, charts, or reporting across multiple archives over time (only per-archive statistics)
- **Archive tags or categories**: Archives can only be organized by name and date - no tagging, categorization, or custom metadata fields
- **Archive export to formats other than CSV**: No PDF, JSON, Excel, or other export formats - only CSV per Feature 014 patterns
- **Archive import from external sources**: No ability to import pre-existing payment history from other tools or formats into archives
- **Archive versioning or history**: No ability to see previous versions of an archive if it could somehow be modified (reinforces immutability)

## Notes for Planning Phase

### Resolved Clarifications

All requirements specified in user description. No clarifications needed at this stage.

### Key Design Decisions

1. **Two-tier storage structure**: Archive index stored separately from individual archives to enable fast list loading without parsing all archive data
2. **Immutable archives**: Once created, archives cannot be edited to prevent data integrity issues and simplify storage/synchronization logic
3. **50-archive hard limit**: Based on 5MB total storage constraint with average 10KB per archive = ~500KB for archives, leaving ~4.5MB for current data and safety margin
4. **Auto-duplicate naming**: Automatic " (2)" appending prevents user frustration from name collision errors while preserving intent
5. **Graceful corruption handling**: Show corrupted archives with warnings rather than failing silently or crashing, allowing users to delete bad data
6. **Unicode support**: Full UTF-8 support for international users and modern naming conventions (emoji), with safe slugification for filenames
7. **Storage event synchronization**: Real-time cross-tab updates using native localStorage events rather than polling for efficiency
8. **Statistics calculated at view time**: Stats computed when viewing archive rather than stored, reducing storage size and allowing future stat enhancements without migration

### Technical Considerations

- Archive ID generation: Use uuid v4 (same library as Feature 015) for unique, collision-resistant identifiers
- Storage key pattern: "payplan:archive:index" for index, "payplan:archive:{archiveId}" for individual archives
- Size calculation: Use Blob size calculation (same as Feature 015) to enforce 5MB limit accurately
- Schema versioning: Include version in ArchiveIndex and each Archive for future migrations (start at "1.0.0")
- CSV filename format: "payplan-archive-{slugified-name}-{ISO-timestamp}.csv" for uniqueness and sortability
- Performance optimization: Load index only (not full archives) for list view, lazy-load full archive data only when viewing detail
- Error recovery: On corrupted archive, log warning to console, mark in UI, allow deletion, continue loading other archives
- Cross-tab sync: Listen to storage events for "payplan:archive:index" key to detect creates/deletes from other tabs
