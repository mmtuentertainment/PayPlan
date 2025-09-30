// api/plan.ts — PayPlan v0.1.1 API Hardening integration
// Pipeline: RateLimit → Idempotency → Validate → Process → Cache → Headers → Response

import type { IncomingMessage, ServerResponse } from "http";
import { DateTime } from "luxon";
import { buildProblem, sendProblem } from "./_utils/problem.js";
import { getClientIp } from "./_utils/ip.js";
import { checkLimit, setRateHeaders } from "./_utils/ratelimit.js";
import {
  hasCachedSuccess,
  cacheSuccess,
  computeBodyHash,
  getIdempotencyKey,
} from "./_utils/idempotency.js";

// v0.1 core libs (ESM)
let calculatePaydays: any;
let detectRisks: any;
let generateWeeklyActions: any;
let generateSummary: any;
let formatRiskFlags: any;
let normalizeOutput: any;
let generateICSWithTZID: any;

async function loadModules() {
  const payday = await import('../src/lib/payday-calculator.js');
  const risks = await import('../src/lib/risk-detector.js');
  const actions = await import('../src/lib/action-prioritizer.js');
  const icsGen = await import('../src/lib/ics-generator.js');

  calculatePaydays = payday.calculatePaydays;
  detectRisks = risks.detectRisks;
  generateWeeklyActions = actions.generateWeeklyActions;
  generateSummary = actions.generateSummary;
  formatRiskFlags = actions.formatRiskFlags;
  normalizeOutput = actions.normalizeOutput;
  generateICSWithTZID = icsGen.generateICSWithTZID;
}

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";
const ALLOWED_HEADERS = "Content-Type, Authorization, Idempotency-Key";
const ALLOWED_METHODS = "POST, OPTIONS";

function setCors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  res.setHeader("Access-Control-Max-Age", "86400"); // 24h
}

function json(res: ServerResponse, status: number, body: any) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function getPath(req: IncomingMessage) {
  // instance should reflect request path (RFC 9457); strip query if present
  const url = (req as any).url || "/api/plan";
  return String(url).split("?")[0] || "/api/plan";
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCors(res);

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const instance = getPath(req);
  const clientIp = getClientIp(req);

  try {
    // Load modules on first request
    if (!calculatePaydays) {
      await loadModules();
    }

    // ---- 1. Rate Limit Check (sliding window 60/h) ----
    const rl = await checkLimit(clientIp);
    setRateHeaders(res, rl.headers);

    if (!rl.allowed) {
      // 429 with Retry-After (delta-seconds) per RFC 9110
      res.setHeader("Retry-After", String(rl.retryAfterSeconds || 3600));
      const p = buildProblem({
        type: "/problems/rate-limit-exceeded",
        title: "Rate Limit Exceeded",
        status: 429,
        detail: `Too many requests from this IP. Retry after ${rl.retryAfterSeconds || 3600} seconds.`,
        instance,
      });
      return sendProblem(res, p);
    }

    // ---- 2. Method Check ----
    if (req.method !== "POST") {
      const p = buildProblem({
        type: "/problems/method-not-allowed",
        title: "Method Not Allowed",
        status: 405,
        detail: `Method ${req.method} not allowed. Use POST.`,
        instance,
      });
      return sendProblem(res, p);
    }

    // ---- 3. Read Body ----
    const body = await readJson(req);

    // ---- 4. Idempotency Precheck ----
    const idemKey = getIdempotencyKey(req);
    let bodyHash: string | undefined;

    if (idemKey) {
      const canonical = JSON.stringify(body, Object.keys(body || {}).sort());
      bodyHash = await computeBodyHash(canonical);

      const cached = await hasCachedSuccess("POST", instance, idemKey, bodyHash);

      if (cached.hit === "replay") {
        res.setHeader("X-Idempotent-Replayed", "true");
        return json(res, 200, cached.response);
      }

      if (cached.hit === "conflict") {
        const p = buildProblem({
          type: "/problems/idempotency-key-conflict",
          title: "Idempotency Key Conflict",
          status: 409,
          detail: "This Idempotency-Key was used with a different request body. Use a new key or wait 60 seconds.",
          instance,
        });
        return sendProblem(res, p);
      }
    }

    // ---- 5. Validate Body ----
    const items = Array.isArray(body?.items) ? body.items : null;

    if (!items || items.length === 0) {
      const p = buildProblem({
        type: "/problems/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "items array is required and must contain at least 1 installment",
        instance,
      });
      return sendProblem(res, p);
    }

    const { paycheckDates, payCadence, nextPayday, minBuffer, timeZone } = body;

    if (!timeZone) {
      const p = buildProblem({
        type: "/problems/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "timeZone is required",
        instance,
      });
      return sendProblem(res, p);
    }

    if (typeof minBuffer !== 'number' || minBuffer < 0) {
      const p = buildProblem({
        type: "/problems/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "minBuffer is required and must be >= 0",
        instance,
      });
      return sendProblem(res, p);
    }

    if (!paycheckDates && !nextPayday) {
      const p = buildProblem({
        type: "/problems/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "Must provide either paycheckDates OR (payCadence + nextPayday)",
        instance,
      });
      return sendProblem(res, p);
    }

    // ---- 6. Process (v0.1 deterministic algorithm) ----
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

    const paydays = calculatePaydays({
      paycheckDates,
      payCadence,
      nextPayday,
      timezone: timeZone
    });

    const riskFlags = detectRisks(normalizedInstallments, paydays, minBuffer, timeZone);
    const actionsThisWeek = generateWeeklyActions(normalizedInstallments, timeZone);

    const now = DateTime.now().setZone(timeZone);
    const weekEnd = now.plus({ days: 7 });
    const weeklyInstallments = normalizedInstallments.filter((installment: any) => {
      const dueDate = DateTime.fromISO(installment.due_date, { zone: timeZone });
      return dueDate >= now && dueDate <= weekEnd;
    });

    const summary = generateSummary(
      normalizedInstallments,
      weeklyInstallments,
      riskFlags,
      timeZone
    );

    const formattedRiskFlags = formatRiskFlags(riskFlags);
    const icsBase64 = generateICSWithTZID(normalizedInstallments, timeZone);
    const normalized = normalizeOutput(normalizedInstallments);

    const responseData = {
      summary,
      actionsThisWeek,
      riskFlags: formattedRiskFlags,
      ics: icsBase64,
      normalized
    };

    // ---- 7. Cache Success (if Idempotency-Key provided) ----
    if (idemKey && bodyHash) {
      await cacheSuccess("POST", instance, idemKey, bodyHash, responseData);
    }

    // ---- 8. Return Success (200 OK, existing format) ----
    return json(res, 200, responseData);

  } catch (err: any) {
    console.error('[API] Internal error:', err);

    // Ensure rate limit headers are set even on error
    try {
      const rl = await checkLimit(clientIp);
      setRateHeaders(res, rl.headers);
    } catch (e) {
      // Ignore rate limit header errors in error path
    }

    const p = buildProblem({
      type: "/problems/internal-error",
      title: "Internal Server Error",
      status: 500,
      detail: err?.message || "Unexpected error occurred",
      instance,
    });
    return sendProblem(res, p);
  }
}