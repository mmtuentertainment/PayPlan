// Minimal results card to satisfy MVP view + Copy + ICS download (T011 hook).

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  actions: string[];
  icsBase64: string | null;
  onCopy: () => void;
};

export default function ResultsThisWeek({ actions, icsBase64, onCopy }: Props) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week</CardTitle>
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