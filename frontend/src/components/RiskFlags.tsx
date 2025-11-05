import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { flags: string[] };

export default function RiskFlags({ flags }: Props) {
  if (!flags?.length) return null;

  const explain = (f: string) =>
    f.includes("COLLISION")
      ? "Two or more payments on the same date—reschedule one."
      : f.includes("CASH_CRUNCH")
      ? "Sum due near payday may exceed buffer—pay highest fee first or defer."
      : f.includes("WEEKEND_AUTOPAY")
      ? "Autopay on Sat/Sun—watch for bank delays."
      : "";

  return (
    <Card role="region" aria-labelledby="risk-flags-title">
      <CardHeader>
        <CardTitle id="risk-flags-title">Risk Flags</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {flags.map((f, i) => {
          const explanation = explain(f);

          return (
            <div
              key={i}
              className="flex items-start gap-2"
              role="alert"
              aria-labelledby={`risk-${i}-type`}
              aria-describedby={`risk-${i}-desc`}
            >
              <Badge variant="destructive" id={`risk-${i}-type`}>
                {f.split(":")[0]}
              </Badge>
              <div className="text-sm">
                <span className="font-medium" id={`risk-${i}-desc`}>
                  {explanation}
                </span>
                <span className="text-muted-foreground block">{f}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}