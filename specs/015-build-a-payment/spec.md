# Feature Specification: Payment Status Tracking System

**Feature Branch**: `015-build-a-payment`
**Created**: 2025-10-15
**Status**: Draft
**Input**: User description: "Build a payment status tracking system for PayPlan that allows users to mark individual payments as "paid" or "pending" and persist this status across sessions. When a user processes their payment schedule and identifies upcoming payments in the "This Week" view, they should be able to click a checkbox or button next to each payment to mark it as paid once they've completed the transaction. The system should visually distinguish paid payments from pending ones (strikethrough text, different badge color, or opacity change) and update the risk analysis to exclude paid payments from collision warnings. When users export to CSV or calendar, paid payments should either be excluded or clearly marked with a "paid_status" column. The tracking data must be stored locally in browser storage (privacy-first, no server uploads), persist across browser sessions, and include the timestamp when each payment was marked as paid. Users should be able to bulk-mark multiple payments as paid, undo accidental status changes, and clear all payment statuses with a single reset action. This feature enables users to track their payment progress over time without leaving PayPlan or switching to external tools."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mark Individual Payment as Paid (Priority: P1)

A user reviews their "This Week" payment schedule and sees three upcoming payments. After paying their electricity bill, they click the checkbox next to that payment to mark it as paid. The payment's visual appearance changes (strikethrough text and reduced opacity) to indicate it's been handled. When they refresh the page or return tomorrow, the paid status is still visible.

**Why this priority**: This is the core value proposition - tracking which payments have been made. Without this, the feature provides no value. It's the minimum viable functionality that users need.

**Independent Test**: Can be fully tested by loading a payment schedule, clicking a checkbox next to a single payment, verifying the visual change, and confirming persistence after browser refresh. Delivers immediate value as a "payment checklist" even without bulk operations or exports.

**Acceptance Scenarios**:

1. **Given** a user has a payment schedule loaded with multiple payments, **When** they click the checkbox/button next to a specific payment, **Then** that payment is visually marked as paid (strikethrough, badge change, or opacity reduction) and the status persists after page reload
2. **Given** a payment is marked as paid, **When** the user clicks the checkbox/button again, **Then** the payment returns to pending status (undo functionality)
3. **Given** a payment is marked as paid with a timestamp, **When** the user views the payment details, **Then** they can see when it was marked as paid
4. **Given** multiple payments in the schedule, **When** the user marks one as paid, **Then** only that specific payment's status changes, not others

---

### User Story 2 - Risk Analysis Excludes Paid Payments (Priority: P2)

A user has marked several payments as paid but still has three pending payments scheduled for Friday. The risk detection system analyzes only the pending payments and warns about a potential collision. Previously paid payments on the same day do not trigger warnings.

**Why this priority**: This prevents false positives in risk warnings, which improves the accuracy of PayPlan's core risk detection feature. Users gain confidence that warnings are actionable and relevant.

**Independent Test**: Can be tested by creating a schedule with multiple payments on the same day, marking some as paid, and verifying that risk warnings only consider pending payments. Delivers value by reducing alert fatigue even if export features aren't implemented yet.

**Acceptance Scenarios**:

1. **Given** a user has two payments scheduled on the same day, **When** they mark one as paid, **Then** the risk analysis only considers the remaining pending payment for collision detection
2. **Given** all payments on a high-risk day are marked as paid, **When** the risk analysis runs, **Then** no collision warning is shown for that day
3. **Given** a payment is marked as paid then unmarked (undo), **When** the risk analysis runs, **Then** the payment is included in collision detection again

---

### User Story 3 - Bulk Mark Multiple Payments (Priority: P3)

A user has just completed five payments from their weekly schedule. Instead of clicking each checkbox individually, they select all five payments using checkboxes, then click a "Mark as Paid" button to update them all at once. All five payments are marked simultaneously with the same timestamp.

**Why this priority**: This improves efficiency for users who process multiple payments at once, but isn't essential for basic functionality. Users can still track payments one-by-one with P1.

**Independent Test**: Can be tested by loading multiple payments, selecting several with checkboxes, clicking a bulk action button, and verifying all selected payments are marked together. Delivers convenience value even without export or risk integration.

**Acceptance Scenarios**:

1. **Given** a user has multiple pending payments visible, **When** they select checkboxes for 3 payments and click "Mark as Paid", **Then** all 3 payments are marked as paid with the same timestamp
2. **Given** a user has selected multiple payments, **When** they click "Mark as Pending" (bulk undo), **Then** all selected payments return to pending status
3. **Given** a mix of paid and pending payments are selected, **When** the user clicks "Mark as Paid", **Then** only the pending ones change status (already-paid ones remain paid)

---

### User Story 4 - Export with Payment Status (Priority: P4)

A user wants to share their payment tracking progress with their spouse. They export their schedule to CSV and see a "paid_status" column showing "paid" or "pending" for each payment, along with "paid_timestamp" for completed payments. Alternatively, they can choose to export only pending payments to reduce clutter.

**Why this priority**: This integrates payment status into existing export workflows, but users can still track and view status within PayPlan without exporting. It's a nice-to-have enhancement of feature 014.

**Independent Test**: Can be tested by marking some payments as paid, exporting to CSV, and verifying the status columns appear correctly. Delivers value for users who share data externally, even if in-app tracking works independently.

**Acceptance Scenarios**:

1. **Given** a user has a mix of paid and pending payments, **When** they export to CSV, **Then** the export includes a "paid_status" column ("paid"/"pending") and "paid_timestamp" column (ISO date or empty)
2. **Given** a user selects "Export only pending payments" option, **When** they export to CSV, **Then** only pending payments are included in the file
3. **Given** a user exports to calendar format, **When** paid payments are included, **Then** they are marked clearly in the event title or description (e.g., "[PAID] Electricity Bill")

---

### User Story 5 - Reset All Payment Statuses (Priority: P5)

A user has been tracking payments for the past month and now wants to start fresh for a new billing cycle. They click a "Clear All Payment Statuses" button, confirm the action, and all payments return to pending status. The tracking history is cleared.

**Why this priority**: This is a maintenance/cleanup feature that's useful but not essential for day-to-day tracking. Users can manually toggle individual payments if needed.

**Independent Test**: Can be tested by marking multiple payments as paid, clicking the reset button, confirming, and verifying all statuses return to pending. Delivers convenience for periodic cleanup but isn't required for core tracking.

**Acceptance Scenarios**:

1. **Given** a user has multiple payments marked as paid, **When** they click "Clear All Payment Statuses" and confirm, **Then** all payments return to pending status and timestamps are cleared
2. **Given** a user clicks "Clear All Payment Statuses", **When** the confirmation dialog appears, **Then** they can cancel the action and statuses remain unchanged
3. **Given** the user has no paid payments, **When** they click "Clear All Payment Statuses", **Then** a message indicates there's nothing to clear

---

### Edge Cases

- What happens when a user marks a payment as paid but later realizes it was the wrong payment (addressed by FR-005: toggle functionality)?
- How does the system handle browser storage limits if a user tracks hundreds of payments over many months?
- What happens if a user exports a schedule, marks payments as paid, then imports a new schedule - should the tracking data be preserved or cleared?
- How does the UI distinguish between duplicate payments (same amount, date, description) when displaying them in a list (may need position indicators like "Payment 1 of 2")?
- What happens when a user clears browser data/cache - how do they know their tracking history will be lost (may need warning message)?
- What happens if a payment exists in the schedule but has no unique ID (legacy data) - should it be assigned one retroactively?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to mark individual payments as "paid" or "pending" via a clickable checkbox or button interface
- **FR-002**: System MUST persist payment status data locally in browser storage (no server uploads) across browser sessions
- **FR-003**: System MUST record a timestamp when each payment is marked as paid, stored in ISO 8601 format
- **FR-004**: System MUST visually distinguish paid payments from pending payments using at least one of: strikethrough text, different badge color, or opacity change
- **FR-005**: System MUST allow users to toggle payment status (paid ↔ pending) to support undo of accidental changes
- **FR-006**: System MUST exclude paid payments from risk analysis collision warnings
- **FR-007**: System MUST support bulk operations to mark multiple selected payments as paid simultaneously
- **FR-008**: System MUST support bulk operations to mark multiple selected payments as pending simultaneously (bulk undo)
- **FR-009**: System MUST include payment status in CSV exports via a "paid_status" column (values: "paid" or "pending")
- **FR-010**: System MUST include paid timestamp in CSV exports via a "paid_timestamp" column (ISO 8601 date or empty for pending)
- **FR-011**: System MUST provide an option to export only pending payments, excluding paid ones
- **FR-012**: System MUST include paid payments in calendar exports with a "[PAID]" prefix in the event title (e.g., "[PAID] Electricity Bill - $150")
- **FR-013**: System MUST provide a "Clear All Payment Statuses" action that resets all payments to pending
- **FR-014**: System MUST display a confirmation dialog before clearing all payment statuses
- **FR-015**: System MUST assign a unique identifier to each payment upon creation, treating payments with identical details (amount, date, description) as separate trackable items that can be marked independently
- **FR-016**: System MUST preserve payment status data when the user navigates between different views (This Week, risk analysis, export)
- **FR-017**: System MUST display the paid timestamp in a human-readable format when viewing payment details (e.g., "Paid on Oct 15, 2025 at 2:30 PM")

### Key Entities

- **Payment Status Record**: Represents the tracking state of a single payment, including: unique payment identifier, status (paid/pending), timestamp when marked as paid (if applicable), relationship to the original payment data (amount, date, description)
- **Payment**: The original scheduled payment data (from existing PayPlan functionality), now enhanced with status tracking capability
- **Status Collection**: The complete set of all payment status records for the current session, stored in browser local storage

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can mark a payment as paid in under 2 seconds (single click/tap interaction)
- **SC-002**: Payment status persists correctly across 100% of browser sessions (page refresh, tab close/reopen, browser restart)
- **SC-003**: Users can successfully toggle payment status (paid ↔ pending) with visual feedback appearing within 200ms
- **SC-004**: Users can bulk-mark 10 payments in under 5 seconds (versus 20+ seconds marking individually)
- **SC-005**: Risk analysis correctly excludes paid payments from collision warnings in 100% of scenarios
- **SC-006**: CSV exports include accurate payment status data for 100% of payments
- **SC-007**: Users can clear all payment statuses and receive confirmation in under 3 seconds
- **SC-008**: System maintains payment status tracking for at least 500 payments without browser storage errors
- **SC-009**: Visual distinction between paid and pending payments is clear to 95% of users without explanation (accessibility compliance)
- **SC-010**: Users successfully complete payment tracking workflow (mark → verify → refresh → confirm persistence) on first attempt 90% of the time

## Assumptions

- Each payment is assigned a unique identifier upon creation, allowing duplicate payments (same amount, date, description) to be tracked independently
- Browser storage (localStorage) is available and enabled in user's browser
- Users understand the difference between "marking as paid in PayPlan" versus actually making the payment through their bank
- The existing "This Week" view can be enhanced with status tracking UI without major structural changes
- Users will primarily track payments within a 1-3 month window (not years of historical data)
- Calendar export format supports prefix notation in event titles (industry standard: iCal/ICS format)
- The existing CSV export functionality can be extended with additional columns without breaking existing integrations

## Dependencies

- Requires existing payment schedule functionality (import from CSV/email)
- Requires existing "This Week" view for displaying payments
- Requires existing risk analysis system to integrate paid payment filtering
- Requires existing CSV export functionality (Feature 014) to add status columns
- Requires existing calendar export functionality to mark paid payments
- Requires browser local storage API support

## Out of Scope

- **Server-side storage**: Payment status is local-only, not synced to cloud or shared across devices
- **Payment verification**: System does not verify with banks whether payment was actually made
- **Payment history analytics**: No reporting, charts, or trend analysis of payment patterns over time
- **Partial payments**: Cannot mark a payment as "partially paid" (only paid or pending)
- **Payment scheduling**: Cannot reschedule or modify payment dates based on status
- **Multi-device sync**: Status tracked on one device does not sync to other devices
- **Export to other formats**: Only CSV and calendar formats supported, no PDF, Excel, or JSON exports
- **Automated status updates**: No integration with bank APIs or email parsing to auto-mark payments
- **Recurring payment templates**: No ability to create templates based on payment history
- **Notifications**: No reminders or alerts based on payment status
