import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { summary: string };

export default function SummaryCard({ summary }: Props) {
  if (!summary) return null;

  const summaryLines = summary.split("\n").filter(Boolean);

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
          {summaryLines.map((line, i) => (
            <li key={i} className="text-sm">{line}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}