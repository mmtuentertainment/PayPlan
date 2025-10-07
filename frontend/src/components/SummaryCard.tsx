import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { summary: string };

export default function SummaryCard({ summary }: Props) {
  if (!summary) return null;

  // Memoize to avoid re-computing on every render
  const summaryLines = useMemo(() => summary.split("\n").filter(Boolean), [summary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle id="summary-title">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ul
          className="list-disc pl-6 space-y-1"
          aria-labelledby="summary-title"
          role="list"
        >
          {summaryLines.map((line) => (
            <li key={line} className="text-sm">{line}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}