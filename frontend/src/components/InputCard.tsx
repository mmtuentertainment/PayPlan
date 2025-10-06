// Implements T005 + T006 + T007 trigger. Uses shadcn/ui primitives.
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { parseCsvFile, parseCsvString } from "@/lib/csv";
import { buildPlan, type PlanResponse } from "@/lib/api";
import { SAMPLE_CSV } from "@/lib/sample";
import { EmailInput } from "@/components/EmailInput";
import { EmailPreview } from "@/components/EmailPreview";
import { EmailIssues } from "@/components/EmailIssues";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SuccessToast } from "@/components/SuccessToast";
import { useEmailExtractor } from "@/hooks/useEmailExtractor";

type Props = { onResult: (r: PlanResponse) => void; onIcsReady: (b64: string) => void; };

const COMMON_TZS = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "UTC"];

export default function InputCard({ onResult, onIcsReady }: Props) {
  const [tab, setTab] = useState<"paste" | "upload" | "emails">("paste");
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tz, setTz] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [mode, setMode] = useState<"explicit" | "cadence">("explicit");
  const [paycheckDates, setPaycheckDates] = useState("2025-10-05, 2025-10-19, 2025-11-02");
  const [payCadence, setPayCadence] = useState<"weekly" | "biweekly" | "semimonthly" | "monthly">("biweekly");
  const [nextPayday, setNextPayday] = useState("");
  const [minBuffer, setMinBuffer] = useState(100);
  const [businessDayMode, setBusinessDayMode] = useState(true);
  const [country, setCountry] = useState<"US" | "None">("US");
  const [customSkipDates, setCustomSkipDates] = useState("");
  const [skipDatesError, setSkipDatesError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tzDetected = useMemo(() => tz, [tz]);

  // Email extractor hook
  const emailExtractor = useEmailExtractor(tzDetected);

  // Validate custom skip dates
  function validateSkipDates(value: string): string[] | null {
    if (!value.trim()) {
      setSkipDatesError(null); // Clear errors when input is emptied
      return [];
    }

    const dates = value.split(/[,\s]+/).map(d => d.trim()).filter(Boolean);
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const date of dates) {
      if (!isoDateRegex.test(date)) {
        setSkipDatesError(`Invalid date format: "${date}". Use YYYY-MM-DD.`);
        return null;
      }
      // Validate it's a real date
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        setSkipDatesError(`Invalid date: "${date}"`);
        return null;
      }
    }

    setSkipDatesError(null);
    return dates;
  }

  function onUseSample() {
    setCsv(SAMPLE_CSV);
    setEdited(false);
  }

  function onClear() {
    setCsv("");
    setEdited(true);
  }

  async function handleBuild() {
    setError(null);
    setLoading(true);
    try {
      // Validate custom skip dates only if Business Day Mode is enabled
      const skipDates = businessDayMode ? validateSkipDates(customSkipDates) : [];
      if (businessDayMode && skipDates === null) {
        throw new Error(skipDatesError || "Invalid custom skip dates");
      }

      let items;
      if (tab === "emails") {
        // Use extracted items from email parser
        // Convert cents to dollars for backend API
        const centsToDollars = (cents: number) => cents / 100;

        items = emailExtractor.editableItems.map(r => ({
          provider: r.provider,
          installment_no: r.installment_no,
          due_date: r.due_date,
          amount: centsToDollars(r.amount),  // Backend expects dollars
          currency: r.currency,
          autopay: r.autopay,
          late_fee: centsToDollars(r.late_fee)  // Backend expects dollars
        }));
        if (items.length === 0) {
          throw new Error("No valid payments extracted from emails.");
        }
      } else {
        // CSV parsing (existing logic)
        const rows = tab === "paste"
          ? await parseCsvString(csv)
          : await (async () => {
              const f = fileRef.current?.files?.[0];
              if (!f) throw new Error("Please choose a CSV file.");
              return parseCsvFile(f);
            })();

        items = rows.map(r => ({
          provider: r.provider,
          installment_no: r.installment_no,
          due_date: r.due_date,
          amount: r.amount,
          currency: r.currency,
          autopay: r.autopay,
          late_fee: r.late_fee
        }));
      }

      const body: any = { items, minBuffer, timeZone: tzDetected };
      if (mode === "explicit") {
        const list = paycheckDates.split(",").map(s => s.trim()).filter(Boolean);
        if (list.length > 0) body.paycheckDates = list;
      } else {
        if (!nextPayday) throw new Error("Select next payday.");
        body.payCadence = payCadence;
        body.nextPayday = nextPayday;
      }

      // Add business-day fields (v0.1.2)
      body.businessDayMode = businessDayMode;
      body.country = country;
      if (skipDates && skipDates.length > 0) {
        body.customSkipDates = skipDates;
      }

      const res = await buildPlan(body);
      onResult(res);
      onIcsReady(res.ics);
    } catch (e: any) {
      setError(e?.message || "Failed to build plan.");
    } finally {
      setLoading(false);
    }
  }

  // Email tab handlers
  function handleCopyCSV() {
    // Import centsToDollars inline (can refactor to top-level import later)
    const centsToDollars = (cents: number) => cents / 100;

    const headers = 'provider,installment_no,due_date,amount,currency,autopay,late_fee,confidence';
    const rows = emailExtractor.editableItems.map(item =>
      // Convert cents back to dollars for CSV export (backend expects dollars)
      `${item.provider},${item.installment_no},${item.due_date},${centsToDollars(item.amount).toFixed(2)},${item.currency},${item.autopay},${centsToDollars(item.late_fee).toFixed(2)},${item.confidence}`
    );
    const csv = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(csv).catch(() => {});
  }

  return (
    <Card aria-labelledby="input-card">
      <CardHeader>
        <CardTitle id="input-card" className="flex items-center gap-2">
          Paste or upload your BNPL CSV
          {edited && <Badge variant="secondary">Edited</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}</Badge>
          <div className="flex items-center gap-2">
            <Label className="sr-only" htmlFor="tz">Timezone</Label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger id="tz" className="w-[260px]"><SelectValue placeholder="Timezone" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {COMMON_TZS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
          <TabsList>
            <TabsTrigger value="paste">Paste CSV</TabsTrigger>
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-2">
            <Label htmlFor="csv">CSV (required headers)</Label>
            <Textarea
              id="csv"
              value={csv}
              onChange={(e) => { setCsv(e.target.value); setEdited(true); }}
              rows={14}
              className="font-mono"
              aria-describedby="csv-help"
            />
            <div id="csv-help" className="text-sm text-muted-foreground">
              Headers: provider, installment_no, due_date (YYYY-MM-DD), amount, currency, autopay, late_fee
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onUseSample}>Use Sample CSV</Button>
              <Button type="button" variant="ghost" onClick={onClear}>Clear</Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-2">
            <Label htmlFor="file">Upload .csv</Label>
            <input id="file" ref={fileRef} type="file" accept=".csv,text/csv" className="block w-full border rounded px-3 py-2" />
          </TabsContent>

          <TabsContent value="emails" className="space-y-4">
            <EmailInput
              onExtract={emailExtractor.extract}
              isExtracting={emailExtractor.isExtracting}
              hasExtractedData={!!emailExtractor.result}
            />
            {emailExtractor.isExtracting && (
              <LoadingSpinner text="Extracting payment information..." />
            )}
            {!emailExtractor.isExtracting && emailExtractor.result && (
              <>
                <EmailPreview
                  items={emailExtractor.editableItems}
                  onDelete={emailExtractor.deleteItem}
                  onCopyCSV={handleCopyCSV}
                  onBuildPlan={handleBuild}
                  onApplyFix={emailExtractor.applyRowFix}
                  onUndoFix={emailExtractor.undoRowFix}
                  locale={emailExtractor.result.dateLocale}
                  timezone={tzDetected}
                />
                <EmailIssues issues={emailExtractor.result.issues} items={emailExtractor.editableItems} />
              </>
            )}
          </TabsContent>
        </Tabs>

        <fieldset className="space-y-2">
          <legend className="font-medium">Paydays</legend>
          <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="explicit" value="explicit" />
              <Label htmlFor="explicit">Explicit dates</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="cadence" value="cadence" />
              <Label htmlFor="cadence">Cadence</Label>
            </div>
          </RadioGroup>
          {mode === "explicit" ? (
            <div>
              <Label htmlFor="paydates">Next 3 paydays (comma-separated)</Label>
              <input
                id="paydates"
                className="input input-bordered w-full border rounded px-3 py-2"
                placeholder="2025-10-01, 2025-10-15, 2025-10-29"
                value={paycheckDates}
                onChange={e => setPaycheckDates(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Cadence</Label>
                <Select value={payCadence} onValueChange={(v: any) => setPayCadence(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">weekly</SelectItem>
                    <SelectItem value="biweekly">biweekly</SelectItem>
                    <SelectItem value="semimonthly">semimonthly</SelectItem>
                    <SelectItem value="monthly">monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="next">Next payday</Label>
                <input
                  id="next"
                  type="date"
                  className="input input-bordered w-full border rounded px-3 py-2"
                  value={nextPayday}
                  onChange={e => setNextPayday(e.target.value)}
                />
              </div>
            </div>
          )}
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="buffer">Minimum buffer (USD)</Label>
            <input
              id="buffer"
              type="number"
              className="input input-bordered w-full border rounded px-3 py-2"
              value={minBuffer}
              onChange={e => setMinBuffer(Number(e.target.value || 0))}
            />
          </div>
        </div>

        <fieldset className="space-y-3 border rounded-lg p-4">
          <legend className="font-medium px-2">Business Day Mode (v0.1.2)</legend>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="businessDayMode"
              checked={businessDayMode}
              onChange={e => {
                setBusinessDayMode(e.target.checked);
                // Clear skip date validation error when disabling mode
                if (!e.target.checked) {
                  setSkipDatesError(null);
                }
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <Label htmlFor="businessDayMode" className="cursor-pointer">
                Shift weekend/holiday dates to next business day
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically moves payments due on weekends or holidays to the next business day
              </p>
            </div>
          </div>

          {businessDayMode && (
            <>
              <div>
                <Label htmlFor="country">Holiday Calendar</Label>
                <Select value={country} onValueChange={(v: "US" | "None") => setCountry(v)}>
                  <SelectTrigger id="country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States (US Federal Holidays)</SelectItem>
                    <SelectItem value="None">None (Weekends Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customSkipDates">Custom skip dates (optional)</Label>
                <Textarea
                  id="customSkipDates"
                  value={customSkipDates}
                  onChange={e => {
                    setCustomSkipDates(e.target.value);
                    validateSkipDates(e.target.value);
                  }}
                  placeholder="2025-12-24, 2025-12-26"
                  rows={2}
                  className="font-mono"
                  aria-describedby="skip-dates-help"
                  aria-invalid={!!skipDatesError}
                />
                <div id="skip-dates-help" className="text-sm text-muted-foreground mt-1">
                  Company closures or personal unavailable dates (YYYY-MM-DD, comma/space separated)
                </div>
                {skipDatesError && (
                  <div role="alert" aria-live="polite" className="text-sm text-destructive mt-1">
                    {skipDatesError}
                  </div>
                )}
              </div>
            </>
          )}
        </fieldset>

        <div className="flex items-end">
          <Button onClick={handleBuild} disabled={loading || (businessDayMode && !!skipDatesError)} className="w-full">
            {loading ? "Building…" : "Build Plan"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      {emailExtractor.successMessage && (
        <SuccessToast
          message={emailExtractor.successMessage}
          onDismiss={emailExtractor.clearSuccessMessage}
        />
      )}
    </Card>
  );
}