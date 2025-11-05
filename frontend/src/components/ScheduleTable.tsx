import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Row = {
  provider: string;
  dueDate: string;
  amount: number;
  autopay?: boolean;
  lateFee?: number;
  wasShifted?: boolean;
  originalDueDate?: string;
  shiftReason?: string;
};

type Props = { rows: Row[] };

const getShiftReasonText = (reason?: string) => {
  if (reason === "WEEKEND") return "weekend";
  if (reason === "HOLIDAY") return "US Federal holiday";
  if (reason === "CUSTOM") return "custom skip date";
  return reason || "";
};

export default function ScheduleTable({ rows }: Props) {
  if (!rows?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle id="schedule-table-title">Normalized Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            aria-labelledby="schedule-table-title"
          >
            <caption className="sr-only">
              Payment schedule showing {rows.length} payment{rows.length !== 1 ? 's' : ''} with due dates, amounts, and autopay status
            </caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="text-left py-2">Provider</th>
                <th scope="col" className="text-left py-2">Due Date</th>
                <th scope="col" className="text-right py-2">Amount</th>
                <th scope="col" className="text-center py-2">Autopay</th>
                <th scope="col" className="text-right py-2">Late Fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const tooltipText = r.wasShifted
                  ? `Shifted from ${r.originalDueDate} due to ${getShiftReasonText(r.shiftReason)}`
                  : "";

                return (
                  <tr key={`${r.provider}-${r.dueDate}`} className="border-t">
                    <td className="py-2">{r.provider}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span>{r.dueDate}</span>
                        {r.wasShifted && (
                          <>
                            <Badge
                              variant="secondary"
                              className="cursor-help"
                              aria-describedby={`shift-reason-${i}`}
                              title={tooltipText}
                            >
                              Shifted
                            </Badge>
                            <span id={`shift-reason-${i}`} className="sr-only">
                              {tooltipText}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-2">${r.amount.toFixed(2)}</td>
                    <td className="text-center py-2">{r.autopay ? "Yes" : "No"}</td>
                    <td className="text-right py-2">
                      {typeof r.lateFee === "number" ? `$${r.lateFee.toFixed(0)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}