import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = { summary: string };

export default function SummaryCard({ summary }: Props) {
  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-6 space-y-1">
          {summary.split("\n").map((line, i) => (
            <li key={i} className="text-sm">{line}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}