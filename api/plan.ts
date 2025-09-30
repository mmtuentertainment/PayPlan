// Minimal Vercel Node.js Function adapter for PayPlan
// CORS per Vercel guidance; OPTIONS preflight supported.
// Runtime: Node 20 (set in vercel.json)

import type { IncomingMessage, ServerResponse } from 'http';

// Import your deterministic libs from v0.1 (adjust names if needed)
const { calculatePaydays } = require('../src/lib/payday-calculator.js');
const { detectRisks } = require('../src/lib/risk-detector.js');
const { generateWeeklyActions, generateSummary, formatRiskFlags, normalizeOutput } = require('../src/lib/action-prioritizer.js');
const { generateICSWithTZID } = require('../src/lib/ics-generator.js');
const { DateTime } = require('luxon');

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';
const ALLOWED_HEADERS = 'Content-Type, Authorization';
const ALLOWED_METHODS = 'POST, OPTIONS';

function setCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Max-Age', '86400'); // 24h
}

function sendJson(res: ServerResponse, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = await readJson(req);

    // Basic shape check
    if (!body || !Array.isArray(body.items)) {
      return sendJson(res, 400, { error: 'Validation Error', message: 'items array is required' });
    }

    if (body.items.length === 0) {
      return sendJson(res, 400, { error: 'Validation Error', message: 'items array must contain at least 1 installment' });
    }

    const { items, paycheckDates, payCadence, nextPayday, minBuffer, timeZone } = body;

    // Validate timezone
    if (!timeZone) {
      return sendJson(res, 400, { error: 'Validation Error', message: 'timeZone is required' });
    }

    // Validate minBuffer
    if (typeof minBuffer !== 'number' || minBuffer < 0) {
      return sendJson(res, 400, { error: 'Validation Error', message: 'minBuffer is required and must be >= 0' });
    }

    // Validate payday information
    if (!paycheckDates && !nextPayday) {
      return sendJson(res, 400, { error: 'Validation Error', message: 'Must provide either paycheckDates OR (payCadence + nextPayday)' });
    }

    // Step 1: Normalize and sort installments
    const normalizedInstallments = items
      .map((item: any) => ({
        provider: item.provider,
        installment_no: item.installment_no,
        due_date: item.due_date,
        amount: parseFloat(item.amount),
        currency: item.currency,
        autopay: item.autopay,
        late_fee: parseFloat(item.late_fee)
      }))
      .sort((a: any, b: any) => a.due_date.localeCompare(b.due_date));

    // Step 2: Calculate paydays
    const paydays = calculatePaydays({
      paycheckDates,
      payCadence,
      nextPayday,
      timezone: timeZone
    });

    // Step 3: Detect risks
    const riskFlags = detectRisks(normalizedInstallments, paydays, minBuffer, timeZone);

    // Step 4: Generate weekly actions
    const actionsThisWeek = generateWeeklyActions(normalizedInstallments, timeZone);

    // Get weekly installments for summary generation
    const now = DateTime.now().setZone(timeZone);
    const weekEnd = now.plus({ days: 7 });
    const weeklyInstallments = normalizedInstallments.filter((installment: any) => {
      const dueDate = DateTime.fromISO(installment.due_date, { zone: timeZone });
      return dueDate >= now && dueDate <= weekEnd;
    });

    // Step 5: Generate summary
    const summary = generateSummary(
      normalizedInstallments,
      weeklyInstallments,
      riskFlags,
      timeZone
    );

    // Format risk flags as user-friendly strings
    const formattedRiskFlags = formatRiskFlags(riskFlags);

    // Step 6: Generate ICS calendar
    const icsBase64 = generateICSWithTZID(normalizedInstallments, timeZone);

    // Generate normalized output
    const normalized = normalizeOutput(normalizedInstallments);

    // Return response
    return sendJson(res, 200, {
      summary,
      actionsThisWeek,
      riskFlags: formattedRiskFlags,
      ics: icsBase64,
      normalized
    });

  } catch (error: any) {
    console.error('Plan generation error:', error);

    // Check if it's a known validation error
    if (error.message && (
      error.message.includes('Invalid timezone') ||
      error.message.includes('Invalid date format') ||
      error.message.includes('Must provide either')
    )) {
      return sendJson(res, 400, {
        error: 'Validation Error',
        message: error.message
      });
    }

    // Generic server error
    return sendJson(res, 500, {
      error: 'Processing Error',
      message: 'Failed to generate payment plan',
      detail: error.message
    });
  }
}