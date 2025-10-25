import { useState, useEffect } from 'react';
import { type Item } from '@/lib/email-extractor';
import { DateTime } from 'luxon';
import { createEvents, type EventAttributes } from 'ics';
import { TelemetryConsentBanner } from '@/components/TelemetryConsentBanner';
import * as telemetry from '@/lib/telemetry';
import { usePreferences } from '@/hooks/usePreferences';
import { PreferenceCategory } from '@/lib/preferences/types';
import { timezoneValueSchema } from '@/lib/preferences/schemas';
import {
  CsvSizeError,
  CsvRowCountError,
  CsvDelimiterError,
  CsvParseError,
  CsvDateFormatError,
  CsvDateRealError,
  CsvCurrencyError,
  isCsvError,
} from '@/lib/csv-errors';

interface Risk { type: 'COLLISION'|'WEEKEND_AUTOPAY'; severity: 'high'|'medium'|'low'; message: string; affectedItems?: string[]; }
interface CSVRow { provider: string; amount: string; currency: string; dueISO: string; autopay: string; }

export default function Import() {
  const [file, setFile] = useState<File|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [results, setResults] = useState<{items: Item[]; risks: Risk[]}|null>(null);
  const [processing, setProcessing] = useState(false);

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

  const parseCSV = (text: string): { rows: CSVRow[]; delimiter: telemetry.DelimiterType } => {
    // Strip UTF-8 BOM and check for empty file
    const normalized = text.replace(/^\uFEFF/, '').trim();
    if (!normalized) throw new CsvParseError('CSV file is empty');

    const lines = normalized.split(/\r?\n/);
    if (lines.length === 1) throw new CsvParseError('No data rows found');

    // T010: Delimiter detection - normalize header (BOM already stripped at line 17)
    const header = lines[0].trim();
    let delimiter: telemetry.DelimiterType = 'comma';

    if (header !== 'provider,amount,currency,dueISO,autopay') {
      // Check for semicolon delimiter or wrong field count
      if (header.includes(';')) {
        delimiter = 'semicolon';
        throw new CsvDelimiterError('Parse failure: expected comma-delimited CSV', delimiter);
      }
      if (header.split(',').length !== 5) {
        throw new CsvParseError('Parse failure: expected comma-delimited CSV');
      }
      throw new CsvParseError('Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay');
    }

    const rows = lines
      .slice(1)
      .filter(line => line.trim().length > 0)
      .map(line => {
        const v = line.split(',').map(s => s.trim());
        if (v.length !== 5) throw new CsvParseError('Parse failure: expected comma-delimited CSV');
        return { provider: v[0], amount: v[1], currency: v[2], dueISO: v[3], autopay: v[4] };
      });

    return { rows, delimiter };
  };

  const csvRowToItem = (row: CSVRow, rowNum: number, tz: string): Item => {
    const provider = row.provider.trim();
    if (!provider) throw new CsvParseError(`Missing provider in row ${rowNum}`, rowNum);
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) throw new CsvParseError(`Invalid amount in row ${rowNum}`, rowNum);
    const currency = row.currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new CsvCurrencyError(rowNum, row.currency.trim());
    }
    const dueISO = row.dueISO.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueISO)) throw new CsvDateFormatError(rowNum, dueISO);

    // T011: Real calendar date validation
    const dt = DateTime.fromISO(dueISO, { zone: tz });
    if (!dt.isValid) {
      throw new CsvDateRealError(rowNum, dueISO);
    }

    const autopayStr = row.autopay.trim().toLowerCase();
    if (autopayStr !== 'true' && autopayStr !== 'false') throw new CsvParseError(`Invalid autopay value in row ${rowNum}`, rowNum);
    return { id: `csv-${rowNum}`, provider, amount, currency, due_date: dueISO, autopay: autopayStr === 'true', installment_no: 1, late_fee: 0, confidence: 1.0 };
  };

  const handleProcessCSV = async () => {
    if (!file) return;
    setError(null);
    setProcessing(true);

    const sizeBucket = telemetry.bucketSize(file.size);
    let text = '';

    try {
      // T009: Pre-parse guards - file size
      if (file.size > 1_048_576) {
        const error = new CsvSizeError(file.size, 1_048_576);
        setResults(null);
        setError(error.message);
        telemetry.error({ phase: error.phase, size_bucket: sizeBucket });
        setProcessing(false);
        return;
      }

      // T009: Pre-parse guards - row count (non-empty rows)
      text = await file.text();
      const lines = text.trim().split(/\r?\n/);
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      const dataRowCount = nonEmptyLines.length - 1; // Exclude header
      const rowBucket = telemetry.bucketRows(dataRowCount);

      if (nonEmptyLines.length > 1001) { // 1 header + 1000 data rows
        const error = new CsvRowCountError(dataRowCount, 1000);
        setResults(null);
        setError(error.message);
        telemetry.error({ phase: error.phase, row_bucket: rowBucket, size_bucket: sizeBucket });
        setProcessing(false);
        return;
      }

      const { rows, delimiter } = parseCSV(text);
      const items: Item[] = rows.map((row, idx) => csvRowToItem(row, idx + 1, timezone));
      const risks: Risk[] = [];
      const dateGroups = new Map<string, Item[]>();
      items.forEach(i => { const g = dateGroups.get(i.due_date) || []; g.push(i); dateGroups.set(i.due_date, g); });
      dateGroups.forEach((g, d) => { if (g.length > 1) risks.push({ type: 'COLLISION', severity: 'high', message: `Multiple payments due on ${d}`, affectedItems: g.map(i => i.id) }); });
      items.forEach(i => {
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
      setResults({ items, risks });

      // Track successful usage (sampled at ≤10%)
      telemetry.maybeUsage({
        row_bucket: rowBucket,
        size_bucket: sizeBucket,
        delimiter,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process CSV';
      setError(errorMsg);

      // Track error with appropriate phase using instanceof checks (Issue #27)
      const lines = text.trim().split(/\r?\n/);
      const dataRowCount = Math.max(0, lines.filter(l => l.trim()).length - 1);
      const rowBucket = telemetry.bucketRows(dataRowCount);

      // Type-safe phase detection using instanceof checks
      let phase: telemetry.CsvErrorInput['phase'] = 'parse';
      let delimiter: telemetry.DelimiterType | undefined = 'comma';

      if (err instanceof CsvDelimiterError) {
        phase = err.phase;
        delimiter = err.detectedDelimiter;
      } else if (err instanceof CsvDateFormatError) {
        phase = err.phase;
      } else if (err instanceof CsvDateRealError) {
        phase = err.phase;
      } else if (err instanceof CsvCurrencyError) {
        phase = err.phase;
      } else if (isCsvError(err)) {
        // Catch-all for other CSV errors (CsvParseError, etc.)
        phase = err.phase as telemetry.CsvErrorInput['phase'];
      }

      telemetry.error({
        phase,
        row_bucket: rowBucket,
        size_bucket: sizeBucket,
        delimiter,
      });
    }
    finally { setProcessing(false); }
  };

  const handleDownloadIcs = () => {
    if (!results) return;
    try {
      const now = DateTime.now().setZone(timezone);
      const mon = now.minus({ days: now.weekday - 1 }).startOf('day');
      const sun = mon.plus({ days: 6 }).endOf('day');
      const thisWeek = results.items.filter(i => {
        const dt = DateTime.fromISO(i.due_date, { zone: timezone });
        return dt.isValid && dt >= mon && dt <= sun;
      });
      const events: EventAttributes[] = thisWeek.map(i => {
        const dt = DateTime.fromISO(i.due_date, { zone: timezone });
        if (!dt.isValid) {
          console.warn('Invalid date for ICS event:', i.due_date);
          throw new Error(`Invalid date for ICS event: ${i.due_date}`);
        }
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

  const handleClear = () => {
    setFile(null);
    setError(null);
    setResults(null);
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const s = { box: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' }, helper: { marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }, drop: { border: '2px dashed #ccc', borderRadius: '4px', padding: '2rem', textAlign: 'center' as const, marginBottom: '1rem', background: '#fafafa' }, error: { padding: '1rem', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', marginBottom: '1rem' }, table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '1rem' }, td: { padding: '0.5rem', border: '1px solid #ddd' }, pill: { padding: '0.25rem 0.5rem', background: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '0.85rem' }, risk: (sev: 'high' | 'medium' | 'low') => ({ padding: '0.25rem 0.5rem', background: sev === 'high' ? '#f8d7da' : '#fff3cd', color: sev === 'high' ? '#721c24' : '#856404', borderRadius: '4px', fontSize: '0.85rem', marginRight: '0.25rem' }) };

  return (
    <>
      <TelemetryConsentBanner />
      <div style={s.box}>
        <h1>Import CSV</h1>
      <div style={s.helper}>
        <p style={{ margin: 0 }}><b>CSV Format:</b> <code>provider,amount,currency,dueISO,autopay</code></p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#666' }}>Simple comma-delimited. No quotes or commas in values.</p>
      </div>
      <div style={s.drop}>
        <label htmlFor="csv-file-input" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Drag CSV file here or choose file
        </label>
        <input id="csv-file-input" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
      </div>
      {file && (
        <div style={{ marginBottom: '1rem' }}>
          <p>Selected: {file.name}</p>
          <button type="button" onClick={handleProcessCSV} disabled={processing}>
            {processing ? 'Processing...' : 'Process CSV'}
          </button>
          {' '}
          <button type="button" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}
      {error && <div style={s.error} role="alert" aria-live="polite">{error}</div>}
      {results && (
        <div>
          <h2>Schedule ({results.items.length} payments)</h2>
          <table style={s.table}>
            <caption style={{ captionSide: 'top', textAlign: 'left', fontWeight: 'bold', padding: '0.5rem 0' }}>
              Payment schedule with {results.items.length} installments
            </caption>
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
                    <td style={s.td}><span style={s.pill}>{item.confidence >= 0.8 ? 'High' : item.confidence >= 0.6 ? 'Medium' : 'Low'} ({Math.round(item.confidence * 100)}%)</span></td>
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
    </>
  );
}
