// Minimal results card to satisfy MVP view + Copy + ICS download (T011 hook).
// T038-T040: Integrated payment status tracking (Feature 015)
// T027-T032: User Story 2 - Create Archive from Results (Feature 017)

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportPaymentsToCSV, downloadCSV } from "@/services/csvExportService";
import type { PaymentRecord } from "@/types/csvExport";
import { paymentRecordsArraySchema } from "@/types/csvExport";
import { ToastNotification } from "@/components/preferences/ToastNotification";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { PaymentCheckbox } from "@/components/payment-status/PaymentCheckbox";
import { StatusIndicator } from "@/components/payment-status/StatusIndicator";
import { CreateArchiveDialog } from "@/components/archive/CreateArchiveDialog";
import { ZodError } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { consoleGuard } from "@/lib/security/ConsoleGuard";

type Props = {
  actions: string[];
  icsBase64: string | null;
  onCopy: () => void;
  normalizedPayments?: PaymentRecord[]; // NEW: Payment data for CSV export
};

export default function ResultsThisWeek({ actions, icsBase64, onCopy, normalizedPayments = [] }: Props) {
  const [warningToast, setWarningToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // T028-T029: Dialog state management for Create Archive (Feature 017)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [validatedPayments, setValidatedPayments] = useState<PaymentRecord[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // T038: Payment status tracking hook (Feature 015)
  const { toggleStatus, getStatus } = usePaymentStatus();

  // Refs for timeout cleanup
  const successToastTimeoutRef = useRef<number | null>(null);
  const warningToastTimeoutRef = useRef<number | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (successToastTimeoutRef.current !== null) {
        window.clearTimeout(successToastTimeoutRef.current);
      }
      if (warningToastTimeoutRef.current !== null) {
        window.clearTimeout(warningToastTimeoutRef.current);
      }
    };
  }, []);

  // T029: Dialog open/close handlers with validation
  // Note: Radix UI Dialog handles escape key and backdrop clicks automatically
  const handleOpenArchiveDialog = () => {
    // Clear previous validation error
    setValidationError(null);

    try {
      // Validate payment data before opening dialog
      const validated = paymentRecordsArraySchema.parse(normalizedPayments);
      setValidatedPayments(validated);
      setIsArchiveDialogOpen(true);
    } catch (error) {
      if (error instanceof ZodError) {
        // Log detailed validation errors for debugging (dev-only)
        consoleGuard.error('Payment validation failed:', {
          issues: error.issues,
          paymentCount: normalizedPayments.length
        });

        // Surface user-safe summary of first issue without exposing PII
        const firstIssue = error.issues[0];
        const fieldName = firstIssue?.path[firstIssue.path.length - 1];
        const fieldStr = typeof fieldName === 'string' ? fieldName : 'field';
        const userMessage = `Unable to create archive. Invalid ${fieldStr} in payment data.`;

        setValidationError('Invalid payment data');
        setWarningToast({
          message: userMessage,
          type: 'error'
        });
      } else {
        // Log unexpected errors for debugging (dev-only)
        consoleGuard.error('Unexpected validation error:', error);

        setValidationError('Unknown validation error');
        setWarningToast({
          message: 'Unable to create archive. Please try again.',
          type: 'error'
        });
      }
    }
  };

  const handleCloseArchiveDialog = () => {
    setIsArchiveDialogOpen(false);
    setValidationError(null);
    setValidatedPayments([]); // Clear to avoid stale state
  };

  // T031: Handle successful archive creation
  const handleArchiveSuccess = (archiveName: string) => {
    handleCloseArchiveDialog();

    // React automatically escapes JSX content, so no manual sanitization needed
    setWarningToast({
      message: `Archive "${archiveName}" created successfully!`,
      type: 'success'
    });
    // Auto-dismiss success message after 3 seconds (cleanup on unmount)
    successToastTimeoutRef.current = window.setTimeout(() => {
      setWarningToast(null);
      successToastTimeoutRef.current = null;
    }, 3000);
  };

  function downloadIcs() {
    if (!icsBase64) return;
    const blob = b64ToBlob(icsBase64, "text/calendar");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payplan.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  function b64ToBlob(b64: string, type: string) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  }

  function handleDownloadCSV() {
    try {
      const { csvContent, metadata } = exportPaymentsToCSV(normalizedPayments);

      // T016-T017: Show warning for large datasets
      if (metadata.shouldWarn) {
        setWarningToast({
          message: `Generating large export (${metadata.recordCount} records). This may take a moment...`,
          type: 'success'
        });
      }

      downloadCSV(csvContent, metadata.filename);

      // Dismiss warning after download starts (cleanup on unmount)
      if (metadata.shouldWarn) {
        warningToastTimeoutRef.current = window.setTimeout(() => {
          setWarningToast(null);
          warningToastTimeoutRef.current = null;
        }, 2000);
      }
    } catch (error) {
      // Log error details in development only
      consoleGuard.error('CSV export failed:', error);
      setWarningToast({
        message: 'CSV export failed. Please try again.',
        type: 'error'
      });
    }
  }

  const hasPayments = normalizedPayments.length > 0;

  // Type guard for payments with IDs
  const hasPaymentId = (payment: PaymentRecord): payment is PaymentRecord & { id: string } => {
    return payment.id !== undefined && payment.id !== null && payment.id !== '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          This Week <span className="text-muted-foreground text-sm font-normal">(next 7 days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* T038-T040: Payment status tracking UI (Feature 015) */}
        {normalizedPayments.length > 0 ? (
          <div className="space-y-2">
            {normalizedPayments
              .filter(hasPaymentId) // Type guard ensures payment.id is string
              .map((payment) => {
                // TypeScript knows payment.id is string after type guard
                const statusResult = getStatus(payment.id);
                const status = statusResult.ok ? statusResult.value : 'pending';
                const isPaid = status === 'paid';

                return (
                  <div
                    key={payment.id}
                    className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors ${
                      isPaid ? 'opacity-60' : ''
                    }`}
                  >
                    {/* T038: PaymentCheckbox integration */}
                    <PaymentCheckbox
                      paymentId={payment.id}
                      status={status}
                      onToggle={() => toggleStatus(payment.id)}
                    />

                  {/* T039: StatusIndicator integration */}
                  <StatusIndicator status={status} />

                  {/* T040: Visual styles for paid payments */}
                  <div className={`flex-1 ${isPaid ? 'line-through' : ''}`}>
                    <span className="text-sm font-medium">
                      {payment.provider}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ${payment.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      due {payment.dueISO}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ol className="list-decimal pl-6 space-y-1">
            {actions.map((a, i) => <li key={i} className="text-sm">{a}</li>)}
          </ol>
        )}

        {/* T030-T032: Create Archive button with proper styling */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onCopy}>Copy Plan</Button>
          <Button variant="secondary" onClick={downloadIcs} disabled={!icsBase64}>
            Download .ics
          </Button>
          <Button variant="secondary" onClick={handleDownloadCSV} disabled={!hasPayments}>
            Download CSV
          </Button>
          <Button
            variant="default"
            onClick={handleOpenArchiveDialog}
            disabled={!hasPayments}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Create archive from current payment results"
          >
            Create Archive
          </Button>
        </div>
        {icsBase64 && (
          <p className="text-xs text-muted-foreground">
            ✓ Calendar includes 24h prior reminders at 9:00 AM
          </p>
        )}
      </CardContent>
      {warningToast && (
        <ToastNotification
          message={warningToast.message}
          type={warningToast.type}
          onDismiss={() => setWarningToast(null)}
        />
      )}

      {/* T030: Render CreateArchiveDialog with Radix UI Dialog for proper accessibility */}
      <Dialog.Root open={isArchiveDialogOpen && !validationError} onOpenChange={setIsArchiveDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-[1100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed left-[50%] top-[50%] z-[1150] translate-x-[-50%] translate-y-[-50%] p-4 max-w-lg w-full"
            aria-describedby="archive-dialog-description"
          >
            {/* Hidden title and description for screen reader accessibility (Radix requirement) */}
            <Dialog.Title className="sr-only">Archive Creation Dialog</Dialog.Title>
            <Dialog.Description id="archive-dialog-description" className="sr-only">
              Create an archive of your current payment data to save your progress
            </Dialog.Description>
            <CreateArchiveDialog
              payments={validatedPayments}
              onSuccess={handleArchiveSuccess}
              onCancel={handleCloseArchiveDialog}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}