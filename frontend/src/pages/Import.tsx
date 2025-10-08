import { useState } from 'react';
import { type Item } from '@/lib/email-extractor';
import { DateTime } from 'luxon';
import { createEvents, type EventAttributes } from 'ics';

interface Risk { type: 'COLLISION'|'WEEKEND_AUTOPAY'; severity: 'high'|'medium'|'low'; message: string; affectedItems?: string[]; }
interface CSVRow { provider: string; amount: string; currency: string; dueISO: string; autopay: string; }

export default function Import() {
  const [file, setFile] = useState<File|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [results, setResults] = useState<{items: Item[]; risks: Risk[]}|null>(null);
  const [processing, setProcessing] = useState(false);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) throw new Error('CSV file is empty');
    if (lines[0].trim() !== 'provider,amount,currency,dueISO,autopay') {
      throw new Error('Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay');
    }
    if (lines.length === 1) throw new Error('No data rows found');
    return lines.slice(1).map((line, idx) => {
      const v = line.split(',');
      if (v.length !== 5) throw new Error(`Invalid row ${idx + 1}: expected 5 fields`);
      return { provider: v[0], amount: v[1], currency: v[2], dueISO: v[3], autopay: v[4] };
    });
  };

  const csvRowToItem = (row: CSVRow, rowNum: number): Item => {
    const provider = row.provider.trim();
    if (!provider) throw new Error(`Missing provider in row ${rowNum}`);
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) throw new Error(`Invalid amount in row ${rowNum}`);
    const currency = row.currency.trim().toUpperCase();
    if (currency.length !== 3) throw new Error(`Invalid currency in row ${rowNum}`);
    const dueISO = row.dueISO.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueISO)) throw new Error(`Invalid date format in row ${rowNum}. Expected YYYY-MM-DD`);
    const autopayStr = row.autopay.trim().toLowerCase();
    if (autopayStr !== 'true' && autopayStr !== 'false') throw new Error(`Invalid autopay value in row ${rowNum}`);
    return { id: `csv-${rowNum}`, provider, amount, currency, due_date: dueISO, autopay: autopayStr === 'true', installment_no: 1, late_fee: 0, confidence: 'High' as const };
  };

  const handleProcessCSV = async () => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const rows = parseCSV(await file.text());
      const items: Item[] = rows.map((row, idx) => csvRowToItem(row, idx + 1));
      const risks: Risk[] = [];
      const dateGroups = new Map<string, Item[]>();
      items.forEach(i => { const g = dateGroups.get(i.due_date) || []; g.push(i); dateGroups.set(i.due_date, g); });
      dateGroups.forEach((g, d) => { if (g.length > 1) risks.push({ type: 'COLLISION', severity: 'high', message: `Multiple payments due on ${d}`, affectedItems: g.map(i => i.id) }); });
      items.forEach(i => { if (i.autopay) { const dt = DateTime.fromISO(i.due_date, { zone: 'America/New_York' }); if (dt.weekday === 6 || dt.weekday === 7) risks.push({ type: 'WEEKEND_AUTOPAY', severity: 'medium', message: `Autopay on weekend: ${i.provider} on ${i.due_date}`, affectedItems: [i.id] }); } });
      setResults({ items, risks });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to process CSV'); }
    finally { setProcessing(false); }
  };

  const handleDownloadIcs = () => {
    if (!results) return;
    try {
      const now = DateTime.now().setZone('America/New_York');
      const mon = now.minus({ days: now.weekday - 1 }).startOf('day');
      const sun = mon.plus({ days: 6 }).endOf('day');
      const thisWeek = results.items.filter(i => { const dt = DateTime.fromISO(i.due_date, { zone: 'America/New_York' }); return dt >= mon && dt <= sun; });
      const events: EventAttributes[] = thisWeek.map(i => {
        const dt = DateTime.fromISO(i.due_date, { zone: 'America/New_York' });
        const rA = results.risks.filter(r => r.affectedItems?.includes(i.id)).map(r => `⚠️ ${r.message}`).join('\n');
        let desc = `Payment: ${i.provider} ${i.amount} ${i.currency}\nDue: ${i.due_date}\nAutopay: ${i.autopay}`;
        if (rA) desc += `\n\nRisks:\n${rA}`;
        return { title: `${i.provider} $${i.amount} ${i.currency}`, start: [dt.year, dt.month, dt.day], duration: { hours: 1 }, description: desc };
      });
      const { value, error: icsError } = createEvents(events);
      if (icsError) {
        console.error('ICS generation failed:', icsError);
        setError('Failed to generate calendar file. Please try again.');
        return;
      }
      const blob = new Blob([value || ''], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'payment-schedule.ics'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Download failed:', err); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(null); setResults(null); }
  };

  const s = { box: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' }, helper: { marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }, drop: { border: '2px dashed #ccc', borderRadius: '4px', padding: '2rem', textAlign: 'center' as const, marginBottom: '1rem', background: '#fafafa' }, error: { padding: '1rem', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', marginBottom: '1rem' }, table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '1rem' }, td: { padding: '0.5rem', border: '1px solid #ddd' }, pill: { padding: '0.25rem 0.5rem', background: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '0.85rem' }, risk: (sev: string) => ({ padding: '0.25rem 0.5rem', background: sev === 'high' ? '#f8d7da' : '#fff3cd', color: sev === 'high' ? '#721c24' : '#856404', borderRadius: '4px', fontSize: '0.85rem', marginRight: '0.25rem' }) };

  return (
    <div style={s.box}>
      <h1>Import CSV</h1>
      <div style={s.helper}>
        <p style={{ margin: 0 }}><b>CSV Format:</b> <code>provider,amount,currency,dueISO,autopay</code></p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#666' }}>Simple comma-delimited. No quotes or commas in values.</p>
      </div>
      <div style={s.drop}>
        <p>Drag CSV file here or choose file</p>
        <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
      </div>
      {file && (
        <div style={{ marginBottom: '1rem' }}>
          <p>Selected: {file.name}</p>
          <button type="button" onClick={handleProcessCSV} disabled={processing}>
            {processing ? 'Processing...' : 'Process CSV'}
          </button>
        </div>
      )}
      {error && <div style={s.error}>{error}</div>}
      {results && (
        <div>
          <h2>Schedule ({results.items.length} payments)</h2>
          <table style={s.table}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={s.td}>Provider</th><th style={s.td}>Amount</th><th style={s.td}>Currency</th>
                <th style={s.td}>Due</th><th style={s.td}>Autopay</th><th style={s.td}>Confidence</th><th style={s.td}>Risks</th>
              </tr>
            </thead>
            <tbody>
              {results.items.map((item, idx) => {
                const itemRisks = results.risks.filter(r => r.affectedItems?.includes(item.id));
                return (
                  <tr key={idx}>
                    <td style={s.td}>{item.provider}</td>
                    <td style={s.td}>${item.amount}</td>
                    <td style={s.td}>{item.currency}</td>
                    <td style={s.td}>{item.due_date}</td>
                    <td style={s.td}>{item.autopay ? 'Yes' : 'No'}</td>
                    <td style={s.td}><span style={s.pill}>High</span></td>
                    <td style={s.td}>{itemRisks.map((r, ridx) => <span key={ridx} style={s.risk(r.severity)}>{r.message}</span>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" onClick={handleDownloadIcs}>Download .ics</button>
        </div>
      )}
    </div>
  );
}
