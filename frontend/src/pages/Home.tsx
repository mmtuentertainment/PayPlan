// Wire InputCard -> Full Results display
import { useState, useMemo } from "react";
import InputCard from "@/components/InputCard";
import ResultsThisWeek from "@/components/ResultsThisWeek";
import RiskFlags from "@/components/RiskFlags";
import SummaryCard from "@/components/SummaryCard";
import ScheduleTable from "@/components/ScheduleTable";
import type { PlanResponse } from "@/lib/api";
import type { PaymentRecord } from "@/types/csvExport";
import { generatePaymentId } from "@/lib/payment-status/utils";

export default function Home() {
  const [res, setRes] = useState<PlanResponse | null>(null);
  const [ics, setIcs] = useState<string | null>(null);

  function handleCopy() {
    if (!res) return;
    const text = res.actionsThisWeek.join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  // Transform PlanResponse.normalized to PaymentRecord format with stable IDs
  // T038: Assign unique IDs to each payment for status tracking (Feature 015)
  // Memoized to ensure stable IDs across renders
  const normalizedPayments = useMemo<PaymentRecord[]>(() => {
    if (!res) return [];

    return res.normalized.map(item => ({
      id: generatePaymentId(), // Feature 015: UUID v4 for payment status tracking
      provider: item.provider,
      amount: item.amount,
      currency: 'USD', // Default currency (not included in API response)
      dueISO: item.dueDate,
      autopay: item.autopay || false,
      // Risk data not available in API response - will be empty strings
      risk_type: undefined,
      risk_severity: undefined,
      risk_message: undefined
    }));
  }, [res]); // Re-generate IDs only when res changes (new plan loaded)

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-4xl">
      <h1 className="text-3xl font-bold">PayPlan</h1>
      <p className="text-muted-foreground">All your BNPL due dates, one plan.</p>
      <InputCard onResult={setRes} onIcsReady={setIcs} />
      {res && (
        <>
          <ResultsThisWeek
            actions={res.actionsThisWeek}
            icsBase64={ics}
            onCopy={handleCopy}
            normalizedPayments={normalizedPayments}
          />
          <RiskFlags flags={res.riskFlags} />
          <SummaryCard summary={res.summary} />
          <ScheduleTable rows={res.normalized} />
        </>
      )}
    </div>
  );
}