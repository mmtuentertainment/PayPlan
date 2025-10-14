// Minimal results card to satisfy MVP view + Copy + ICS download (T011 hook).

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportPaymentsToCSV, downloadCSV } from "@/services/csvExportService";
import type { PaymentRecord } from "@/types/csvExport";

type Props = {
  actions: string[];
  icsBase64: string | null;
  onCopy: () => void;
  normalizedPayments?: PaymentRecord[]; // NEW: Payment data for CSV export
};

export default function ResultsThisWeek({ actions, icsBase64, onCopy, normalizedPayments = [] }: Props) {
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
      downloadCSV(csvContent, metadata.filename);
    } catch (error) {
      console.error('CSV export failed:', error);
      // TODO: T020 - Add user-facing error message
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
        <ol className="list-decimal pl-6 space-y-1">
          {actions.map((a, i) => <li key={i} className="text-sm">{a}</li>)}
        </ol>
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
    </Card>
  );
}