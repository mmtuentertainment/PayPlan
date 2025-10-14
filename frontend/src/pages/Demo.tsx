import { useState, useEffect } from 'react';
import { FIXTURES } from './demo/fixtures';
import { extractItemsFromEmails, type Item } from '@/lib/email-extractor';
import { DateTime } from 'luxon';
import { createEvents, type EventAttributes } from 'ics';
import { usePreferences } from '@/hooks/usePreferences';
import { PreferenceCategory } from '@/lib/preferences/types';
import { timezoneValueSchema } from '@/lib/preferences/schemas';

interface Risk { type: 'COLLISION'|'WEEKEND_AUTOPAY'; severity: 'high'|'medium'|'low'; message: string; affectedItems?: string[]; }

export default function Demo() {
  const [results, setResults] = useState<{ items: Item[]; risks: Risk[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Get timezone from preferences (defaults to 'America/New_York')
  const { preferences } = usePreferences();
  const [timezone, setTimezone] = useState<string>('America/New_York');

  useEffect(() => {
    const tzPreference = preferences.get(PreferenceCategory.Timezone);
    if (tzPreference && tzPreference.optInStatus && tzPreference.value) {
      // Validate timezone value with Zod
      const validation = timezoneValueSchema.safeParse(tzPreference.value);
      if (validation.success) {
        // Additional runtime check: verify timezone is valid for Luxon
        const testDt = DateTime.now().setZone(validation.data);
        if (testDt.isValid) {
          setTimezone(validation.data);
        } else {
          console.warn('Invalid IANA timezone in preference:', validation.data);
          // Keep default timezone
        }
      } else {
        console.warn('Timezone preference validation failed:', validation.error);
      }
    }
  }, [preferences]);

  const handleRunDemo = () => {
    setLoading(true);
    try {
      const allItems: Item[] = [];
      FIXTURES.forEach(f => {
        try { allItems.push(...extractItemsFromEmails(f.emailText, timezone).items); }
        catch { console.warn(`Failed extraction: ${f.id}`); }
      });
      const risks: Risk[] = [];
      const dateGroups = new Map<string, Item[]>();
      allItems.forEach(i => { const g = dateGroups.get(i.due_date) || []; g.push(i); dateGroups.set(i.due_date, g); });
      dateGroups.forEach((g, d) => { if (g.length > 1) risks.push({ type: 'COLLISION', severity: 'high', message: `Multiple payments due on ${d}`, affectedItems: g.map(i => i.id) }); });
      allItems.forEach(i => {
        if (i.autopay) {
          const dt = DateTime.fromISO(i.due_date, { zone: timezone });
          if (!dt.isValid) {
            console.warn('Invalid date/timezone for autopay check:', i.due_date, timezone);
            return;
          }
          if (dt.weekday === 6 || dt.weekday === 7) {
            risks.push({ type: 'WEEKEND_AUTOPAY', severity: 'medium', message: `Autopay on weekend: ${i.provider} on ${i.due_date}`, affectedItems: [i.id] });
          }
        }
      });
      setResults({ items: allItems, risks });
    } finally { setLoading(false); }
  };

  const handleDownloadIcs = () => {
    if (!results) return;
    try {
      const now = DateTime.now().setZone(timezone);
      const mon = now.minus({ days: now.weekday - 1 }).startOf('day');
      const sun = mon.plus({ days: 6 }).endOf('day');
      const inWeek = (d: string) => {
        const dt = DateTime.fromISO(d, { zone: timezone });
        return dt.isValid && dt >= mon && dt <= sun;
      };
      const thisWeek = results.items.filter(i => inWeek(i.due_date));
      const events: EventAttributes[] = thisWeek.map(i => {
        const dt = DateTime.fromISO(i.due_date, { zone: timezone });
        if (!dt.isValid) {
          console.warn('Invalid date for ICS event:', i.due_date);
          throw new Error(`Invalid date for ICS event: ${i.due_date}`);
        }
        const rA = results.risks.filter(r => r.affectedItems?.includes(i.id)).map(r => `⚠️ ${r.message}`).join('\n');
        return { title: `${i.provider} Payment - ${i.amount} ${i.currency ?? ''}`, start: [dt.year, dt.month, dt.day], duration: { hours: 1 }, description: `Installment ${i.installment_no}${rA ? '\n' + rA : ''}` };
      });
      const { value, error } = createEvents(events);
      if (error) { console.error('ICS generation failed:', error); return; }
      const blob = new Blob([value || ''], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'payplan-demo.ics'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Download failed:', err); }
  };

  const confLabel = (c: number) => c >= 0.80 ? 'High' : c >= 0.60 ? 'Medium' : 'Low';
  const confClass = (c: number) => c >= 0.80 ? 'bg-green-500 text-white px-2 py-1 rounded text-sm' : c >= 0.60 ? 'bg-yellow-500 text-black px-2 py-1 rounded text-sm' : 'bg-orange-500 text-white px-2 py-1 rounded text-sm';
  const riskClass = (t: string) => t === 'COLLISION' ? 'bg-red-500 text-white px-3 py-1 rounded' : 'bg-yellow-600 text-white px-3 py-1 rounded';

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-4xl">
      <h1 className="text-3xl font-bold">PayPlan Demo</h1>
      <p className="text-muted-foreground">Try our BNPL email extraction with 10 synthetic samples</p>
      <div className="grid gap-2">
        {FIXTURES.map(f => (
          <details key={f.id} className="border rounded p-2">
            <summary className="cursor-pointer font-medium">{f.provider} - {f.id}</summary>
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">{f.emailText.slice(0, 200)}...</pre>
          </details>
        ))}
      </div>
      <button type="button" onClick={handleRunDemo} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400">
        {loading ? 'Processing...' : 'Run Demo'}
      </button>
      {results && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Provider</th>
                  <th className="border p-2">Due Date</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Installment</th>
                  <th className="border p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.items.map(i => (
                  <tr key={i.id}>
                    <td className="border p-2">{i.provider}</td>
                    <td className="border p-2">{i.due_date}</td>
                    <td className="border p-2">{i.amount} {i.currency ?? ''}</td>
                    <td className="border p-2">{i.installment_no}</td>
                    <td className="border p-2"><span className={confClass(i.confidence)}>{confLabel(i.confidence)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.risks.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {results.risks.map((r, i) => <span key={i} className={riskClass(r.type)}>{r.message}</span>)}
            </div>
          )}
          <button type="button" onClick={handleDownloadIcs} className="bg-green-600 text-white px-4 py-2 rounded">Download .ics Calendar</button>
        </>
      )}
    </div>
  );
}
