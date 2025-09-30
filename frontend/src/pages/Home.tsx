// Wire InputCard -> ResultsThisWeek for MVP circuit.
import { useState } from "react";
import InputCard from "@/components/InputCard";
import ResultsThisWeek from "@/components/ResultsThisWeek";
import type { PlanResponse } from "@/lib/api";

export default function Home() {
  const [res, setRes] = useState<PlanResponse | null>(null);
  const [ics, setIcs] = useState<string | null>(null);

  function handleCopy() {
    if (!res) return;
    const text = res.actionsThisWeek.join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-4xl">
      <h1 className="text-3xl font-bold">PayPlan</h1>
      <p className="text-muted-foreground">All your BNPL due dates, one plan.</p>
      <InputCard onResult={setRes} onIcsReady={setIcs} />
      {res && <ResultsThisWeek actions={res.actionsThisWeek} icsBase64={ics} onCopy={handleCopy} />}
    </div>
  );
}