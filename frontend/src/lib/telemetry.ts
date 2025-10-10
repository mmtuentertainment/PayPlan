/**
 * Privacy-Safe Telemetry Module
 *
 * Implements opt-in, client-only telemetry with:
 * - DNT (Do Not Track) override
 * - Explicit consent management
 * - Zero PII collection
 * - Deterministic sampling (≤10% for usage events)
 * - No cookies, no external dependencies
 */

// ============================================================================
// TYPES
// ============================================================================

export type ConsentState = "opt_in" | "opt_out" | "unset";

export type RowBucket = "1-10" | "11-100" | "101-1000" | ">1000";
export type SizeBucket = "≤100KB" | "≤250KB" | "≤500KB" | "≤1MB" | ">1MB";
export type DelimiterType = "comma" | "semicolon" | "tab" | "pipe" | "other";

export interface CsvErrorInput {
  phase: "size" | "rows" | "delimiter" | "parse" | "date_format" | "date_real" | "currency";
  row_bucket?: RowBucket;
  size_bucket?: SizeBucket;
  delimiter?: DelimiterType;
}

export interface CsvUsageInput {
  row_bucket: RowBucket;
  size_bucket: SizeBucket;
  delimiter: DelimiterType;
}

interface BaseEvent {
  event: string;
  ts: string;
  dnt: 0 | 1;
  consent: ConsentState;
}

interface CsvErrorEvent extends BaseEvent {
  event: "csv_error";
  phase: CsvErrorInput["phase"];
  row_bucket?: RowBucket;
  size_bucket?: SizeBucket;
  delimiter?: DelimiterType;
}

interface CsvUsageEvent extends BaseEvent {
  event: "csv_usage";
  row_bucket: RowBucket;
  size_bucket: SizeBucket;
  delimiter: DelimiterType;
}

interface ConsentChangeEvent extends BaseEvent {
  event: "consent_change";
  from: ConsentState;
  to: ConsentState;
}

type TelemetryEvent = CsvErrorEvent | CsvUsageEvent | ConsentChangeEvent;

// ============================================================================
// STORAGE
// ============================================================================

const CONSENT_KEY = "pp.telemetryConsent";

// ============================================================================
// DNT DETECTION
// ============================================================================

export function isDNT(): boolean {
  if (typeof navigator === "undefined") return false;

  return (
    navigator.doNotTrack === "1" ||
    (navigator as any).msDoNotTrack === "1" ||
    (window as any).doNotTrack === "1"
  );
}

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

export function getConsent(): ConsentState {
  if (typeof localStorage === "undefined") return "unset";

  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "opt_in" || stored === "opt_out") {
    return stored;
  }
  return "unset";
}

export function setConsent(next: "opt_in" | "opt_out"): void {
  if (typeof localStorage === "undefined") return;

  const prev = getConsent();
  localStorage.setItem(CONSENT_KEY, next);

  // Emit consent_change event only if state actually changed and DNT is not active
  if (prev !== next && !isDNT() && next === "opt_in") {
    emitEvent({
      event: "consent_change",
      from: prev,
      to: next,
      ts: new Date().toISOString(),
      dnt: isDNT() ? 1 : 0,
      consent: next,
    });
  }
}

// ============================================================================
// BUCKETING HELPERS
// ============================================================================

export function bucketRows(n: number): RowBucket {
  if (n <= 10) return "1-10";
  if (n <= 100) return "11-100";
  if (n <= 1000) return "101-1000";
  return ">1000";
}

export function bucketSize(bytes: number): SizeBucket {
  const kb = bytes / 1024;
  if (kb <= 100) return "≤100KB";
  if (kb <= 250) return "≤250KB";
  if (kb <= 500) return "≤500KB";
  if (kb <= 1024) return "≤1MB";
  return ">1MB";
}

// ============================================================================
// DETERMINISTIC SAMPLING
// ============================================================================

/**
 * Simple djb2 hash for deterministic sampling
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Deterministic sampling key based on stable browser characteristics
 */
function getSamplingKey(event: CsvUsageInput): string {
  if (typeof navigator === "undefined" || typeof screen === "undefined") {
    return "fallback";
  }

  // Combine stable characteristics with event buckets for deterministic sampling
  return [
    navigator.userAgent.substring(0, 50), // Truncate for privacy
    screen.width,
    screen.height,
    event.row_bucket,
    event.size_bucket,
  ].join("|");
}

function shouldSample(event: CsvUsageInput): boolean {
  const key = getSamplingKey(event);
  const hash = djb2Hash(key);
  return (hash % 10) === 0; // 10% sampling rate
}

// ============================================================================
// TRANSPORT
// ============================================================================

type TransportFn = (payload: TelemetryEvent) => void;

let transport: TransportFn = () => {
  // NO-OP by default (client-only, no network)
};

export function __setTransport(fn: TransportFn): void {
  transport = fn;
}

function emitEvent(event: TelemetryEvent): void {
  // Guard: Only emit if consent is opt_in and DNT is not active
  if (getConsent() !== "opt_in" || isDNT()) {
    return;
  }

  transport(event);
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function error(input: CsvErrorInput): void {
  // Guard: Only emit if consent is opt_in and DNT is not active
  if (getConsent() !== "opt_in" || isDNT()) {
    return;
  }

  const event: CsvErrorEvent = {
    event: "csv_error",
    phase: input.phase,
    ts: new Date().toISOString(),
    dnt: isDNT() ? 1 : 0,
    consent: getConsent(),
    ...(input.row_bucket && { row_bucket: input.row_bucket }),
    ...(input.size_bucket && { size_bucket: input.size_bucket }),
    ...(input.delimiter && { delimiter: input.delimiter }),
  };

  emitEvent(event);
}

export function maybeUsage(input: CsvUsageInput): void {
  // Guard: Only emit if consent is opt_in and DNT is not active
  if (getConsent() !== "opt_in" || isDNT()) {
    return;
  }

  // Apply deterministic sampling (≤10%)
  if (!shouldSample(input)) {
    return;
  }

  const event: CsvUsageEvent = {
    event: "csv_usage",
    row_bucket: input.row_bucket,
    size_bucket: input.size_bucket,
    delimiter: input.delimiter,
    ts: new Date().toISOString(),
    dnt: isDNT() ? 1 : 0,
    consent: getConsent(),
  };

  emitEvent(event);
}
