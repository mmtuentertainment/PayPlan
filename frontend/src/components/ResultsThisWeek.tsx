// Minimal results card to satisfy MVP view + Copy + ICS download (T011 hook).
// T038-T040: Integrated payment status tracking (Feature 015)

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportPaymentsToCSV, downloadCSV } from "@/services/csvExportService";
import type { PaymentRecord } from "@/types/csvExport";
import { ToastNotification } from "@/components/preferences/ToastNotification";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { PaymentCheckbox } from "@/components/payment-status/PaymentCheckbox";
import { StatusIndicator } from "@/components/payment-status/StatusIndicator";

type Props = {
  actions: string[];
  icsBase64: string | null;
  onCopy: () => void;
  normalizedPayments?: PaymentRecord[]; // NEW: Payment data for CSV export
};

export default function ResultsThisWeek({ actions, icsBase64, onCopy, normalizedPayments = [] }: Props) {
  const [warningToast, setWarningToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // T038: Payment status tracking hook (Feature 015)
  const { toggleStatus, getStatus } = usePaymentStatus();

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

      // Dismiss warning after download starts
      if (metadata.shouldWarn) {
        setTimeout(() => setWarningToast(null), 2000);
      }
    } catch (error) {
      console.error('CSV export failed:', error);
      setWarningToast({
        message: 'CSV export failed. Please try again.',
        type: 'error'
      });
    }
  }

  const hasPayments = normalizedPayments.length > 0;

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
            {normalizedPayments.map((payment) => {
              const statusResult = getStatus(payment.id!);
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
                    paymentId={payment.id!}
                    status={status}
                    onToggle={() => toggleStatus(payment.id!)}
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

        <div className="flex gap-2">
          <Button onClick={onCopy}>Copy Plan</Button>
          <Button variant="secondary" onClick={downloadIcs} disabled={!icsBase64}>
            Download .ics
          </Button>
          <Button variant="secondary" onClick={handleDownloadCSV} disabled={!hasPayments}>
            Download CSV
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
    </Card>
  );
}