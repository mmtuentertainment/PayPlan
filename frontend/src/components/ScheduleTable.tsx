import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Row = {
  provider: string;
  dueDate: string;
  amount: number;
  autopay?: boolean;
  lateFee?: number;
};

type Props = { rows: Row[] };

export default function ScheduleTable({ rows }: Props) {
  if (!rows?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Normalized Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Provider</th>
                <th className="text-left py-2">Due Date</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-center py-2">Autopay</th>
                <th className="text-right py-2">Late Fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{r.provider}</td>
                  <td className="py-2">{r.dueDate}</td>
                  <td className="text-right py-2">${r.amount.toFixed(2)}</td>
                  <td className="text-center py-2">{r.autopay ? "Yes" : "No"}</td>
                  <td className="text-right py-2">
                    {typeof r.lateFee === "number" ? `$${r.lateFee.toFixed(0)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}