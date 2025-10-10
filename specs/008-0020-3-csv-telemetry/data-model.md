# Data Model: CSV Import Privacy-Safe Telemetry

**Feature ID:** 008-0020-3-csv-telemetry
**Version:** 1.0
**Updated:** 2025-10-09

---

## Overview

This document defines the **complete data structures** for the telemetry system, including consent state, event schemas, queue management, and validation rules. All schemas prioritize **privacy by design** and **data minimization**.

---

## 1. Consent State Model

### 1.1 ConsentState (LocalStorage)

**Key:** `telemetryConsentV1`

```typescript
interface ConsentState {
  /** User has explicitly granted telemetry consent */
  granted: boolean;           // Default: false

  /** Schema version for future migrations */
  version: number;            // Default: 1

  /** ISO 8601 timestamp of last consent change */
  updatedAt: string;          // Example: "2025-10-09T14:32:00.000Z"

  /** Optional: DNT detected at time of last update */
  dntActive?: boolean;        // Informational only
}
```

**Default State (First Visit):**
```json
{
  "granted": false,
  "version": 1,
  "updatedAt": "2025-10-09T14:00:00.000Z"
}
```

**After User Grants Consent:**
```json
{
  "granted": true,
  "version": 1,
  "updatedAt": "2025-10-09T14:05:23.456Z"
}
```

**Migration Strategy:**
- If `version` < 1, reset to default state
- If `version` > 1 (future), apply upgrade logic
- Invalid JSON → treat as no consent

---

## 2. Event Schemas

### 2.1 Base Event Fields

All events include these common fields:

```typescript
interface BaseEvent {
  /** Event type discriminator */
  type: EventType;

  /** ISO 8601 timestamp (client-side) */
  timestamp: string;

  /** Schema version for event structure */
  schemaVersion: number;      // Always 1 for MVP

  /** Short git hash (e.g., "a1b2c3d") */
  appVersion: string;

  /** Do Not Track status at event time */
  dnt: 0 | 1;

  /** Consent status at event time (audit trail) */
  consent: boolean;
}

type EventType = "csv_error" | "csv_usage" | "consent_change";
```

---

### 2.2 CSV Error Event

**Trigger:** CSV parsing or validation fails
**Sampling:** 100% (all errors captured)

```typescript
interface CSVErrorEvent extends BaseEvent {
  type: "csv_error";

  /** Error category (enum only) */
  code: CSVErrorCode;

  /** Bucketed row count (privacy-safe) */
  rowCountBucket: RowCountBucket;

  /** Detected delimiter type */
  delimiter: DelimiterType;
}

enum CSVErrorCode {
  CSV_TOO_LARGE = "CSV_TOO_LARGE",           // File size exceeds limit
  TOO_MANY_ROWS = "TOO_MANY_ROWS",           // >1000 rows
  WRONG_DELIMITER = "WRONG_DELIMITER",       // Semicolon vs comma
  INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT", // Date parsing failed
  INVALID_REAL_DATE = "INVALID_REAL_DATE",   // Date regex validation failed
  INVALID_CURRENCY_FORMAT = "INVALID_CURRENCY_FORMAT" // Amount regex failed
}

type RowCountBucket = "0" | "1-100" | "101-500" | "501-1000" | "1000+";
type DelimiterType = "comma" | "semicolon" | "other";
```

**Example Payload:**
```json
{
  "type": "csv_error",
  "timestamp": "2025-10-09T14:32:15.789Z",
  "schemaVersion": 1,
  "appVersion": "a1b2c3d",
  "dnt": 0,
  "consent": true,
  "code": "TOO_MANY_ROWS",
  "rowCountBucket": "1000+",
  "delimiter": "comma"
}
```

**PII Redaction Enforced:**
- ❌ No raw error messages (may contain file paths)
- ❌ No CSV cell values
- ❌ No filenames
- ✅ Only enum `code` and bucketed `rowCountBucket`

---

### 2.3 CSV Usage Event

**Trigger:** Successful CSV parse OR ICS download
**Sampling:** ≤10% (deterministic client-side)

```typescript
interface CSVUsageEvent extends BaseEvent {
  type: "csv_usage";

  /** Bucketed row count of processed CSV */
  rowsBucket: RowCountBucket;

  /** Any errors occurred during session */
  hadErrors: boolean;

  /** User downloaded ICS file */
  icsDownloaded: boolean;
}
```

**Example Payload:**
```json
{
  "type": "csv_usage",
  "timestamp": "2025-10-09T14:35:00.123Z",
  "schemaVersion": 1,
  "appVersion": "a1b2c3d",
  "dnt": 0,
  "consent": true,
  "rowsBucket": "101-500",
  "hadErrors": false,
  "icsDownloaded": true
}
```

**PII Redaction Enforced:**
- ❌ No provider names (Klarna, Affirm, etc.)
- ❌ No amounts or dates
- ✅ Only aggregate boolean flags and bucketed row counts

---

### 2.4 Consent Change Event

**Trigger:** User enables/disables telemetry, or DNT forces disable
**Sampling:** 100% (all consent changes tracked)

```typescript
interface ConsentChangeEvent extends BaseEvent {
  type: "consent_change";

  /** New consent state */
  to: "enabled" | "disabled";

  /** Why the change occurred */
  reason: ConsentChangeReason;
}

enum ConsentChangeReason {
  USER_CLICK = "user_click",       // User clicked enable/disable button
  DNT_FORCED = "dnt_forced",       // DNT=1 detected, forced disable
  RESET = "reset"                  // localStorage cleared or corrupted
}
```

**Example Payload (User Opts In):**
```json
{
  "type": "consent_change",
  "timestamp": "2025-10-09T14:05:23.456Z",
  "schemaVersion": 1,
  "appVersion": "a1b2c3d",
  "dnt": 0,
  "consent": true,
  "to": "enabled",
  "reason": "user_click"
}
```

**Example Payload (DNT Forces Disable):**
```json
{
  "type": "consent_change",
  "timestamp": "2025-10-09T14:10:00.000Z",
  "schemaVersion": 1,
  "appVersion": "a1b2c3d",
  "dnt": 1,
  "consent": false,
  "to": "disabled",
  "reason": "dnt_forced"
}
```

---

## 3. Event Queue Model

### 3.1 In-Memory Queue

**Purpose:** Buffer events before network flush (future enhancement)
**Lifecycle:** Resets on page refresh (MVP)

```typescript
interface EventQueue {
  /** FIFO queue of validated events */
  events: Array<CSVErrorEvent | CSVUsageEvent | ConsentChangeEvent>;

  /** Max queue size (FIFO eviction) */
  maxSize: number;            // Default: 20

  /** Total events enqueued (lifetime counter) */
  totalEnqueued: number;

  /** Total events dropped (queue full) */
  totalDropped: number;
}
```

**Enqueue Logic:**
```typescript
function enqueue(event: TelemetryEvent): void {
  // Guard: No-op if consent not granted or DNT active
  if (!isConsentGranted() || isDNTActive()) {
    return;
  }

  // Validate event schema
  if (!validateEventSchema(event)) {
    console.error("[Telemetry] Invalid event schema, dropped:", event);
    queue.totalDropped++;
    return;
  }

  // Add to queue
  queue.events.push(event);
  queue.totalEnqueued++;

  // FIFO eviction if over limit
  if (queue.events.length > queue.maxSize) {
    queue.events.shift(); // Remove oldest
    queue.totalDropped++;
  }

  // Debug hook (if enabled)
  if (window.__telemetryDebug) {
    console.log("[Telemetry] Event queued:", event);
  }
}
```

---

### 3.2 Future Enhancement: Persistent Queue

**Out of Scope for MVP**, but planned for next PR:

```typescript
interface PersistentQueue {
  /** LocalStorage key for queue persistence */
  storageKey: "telemetryQueueV1";

  /** Flush on next page load if ≥5 events */
  flushThreshold: number;

  /** Max age of events (discard if >7 days old) */
  maxAgeMs: number;           // 7 * 24 * 60 * 60 * 1000
}
```

---

## 4. Validation Rules

### 4.1 Event Schema Validator

**Purpose:** Prevent accidental PII leaks via strict schema enforcement

```typescript
function validateEventSchema(event: unknown): event is TelemetryEvent {
  // Type guard
  if (typeof event !== "object" || event === null) return false;

  const e = event as any;

  // Base fields
  if (!isValidEventType(e.type)) return false;
  if (typeof e.timestamp !== "string") return false;
  if (e.schemaVersion !== 1) return false;
  if (typeof e.appVersion !== "string") return false;
  if (![0, 1].includes(e.dnt)) return false;
  if (typeof e.consent !== "boolean") return false;

  // Type-specific validation
  switch (e.type) {
    case "csv_error":
      return isValidCSVErrorCode(e.code)
          && isValidRowCountBucket(e.rowCountBucket)
          && isValidDelimiterType(e.delimiter);

    case "csv_usage":
      return isValidRowCountBucket(e.rowsBucket)
          && typeof e.hadErrors === "boolean"
          && typeof e.icsDownloaded === "boolean";

    case "consent_change":
      return ["enabled", "disabled"].includes(e.to)
          && isValidConsentChangeReason(e.reason);

    default:
      return false;
  }
}
```

**Reject Criteria:**
- Any field not in schema → **reject**
- Free-text strings (non-enum) → **reject**
- Numeric row counts (non-bucketed) → **reject**
- Nested objects or arrays → **reject**

---

### 4.2 Enum Validators

```typescript
function isValidEventType(type: unknown): type is EventType {
  return ["csv_error", "csv_usage", "consent_change"].includes(type as string);
}

function isValidCSVErrorCode(code: unknown): code is CSVErrorCode {
  return Object.values(CSVErrorCode).includes(code as CSVErrorCode);
}

function isValidRowCountBucket(bucket: unknown): bucket is RowCountBucket {
  return ["0", "1-100", "101-500", "501-1000", "1000+"].includes(bucket as string);
}

function isValidDelimiterType(delimiter: unknown): delimiter is DelimiterType {
  return ["comma", "semicolon", "other"].includes(delimiter as string);
}

function isValidConsentChangeReason(reason: unknown): reason is ConsentChangeReason {
  return Object.values(ConsentChangeReason).includes(reason as ConsentChangeReason);
}
```

---

## 5. Sampling Logic

### 5.1 Deterministic Client-Side Sampling

**Goal:** Limit `csv_usage` events to ≤10% of users while maintaining randomness

```typescript
interface SamplerConfig {
  /** Sampling rate (0.0 to 1.0) */
  rate: number;               // Default: 0.1 (10%)

  /** Seed for deterministic sampling */
  seed?: string;              // Optional: localStorage ID or random
}

function shouldSampleUsageEvent(config: SamplerConfig): boolean {
  // Errors are always sampled (100%)
  // Only usage events are sampled

  // Deterministic: Hash session ID or random seed
  const seed = config.seed || getOrCreateSessionSeed();
  const hash = simpleHash(seed);
  const threshold = config.rate * 0xFFFFFFFF; // Map rate to 32-bit range

  return hash < threshold;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function getOrCreateSessionSeed(): string {
  // Ephemeral: Generate new seed per session (no persistence)
  if (!sessionStorage.telemetrySeed) {
    sessionStorage.telemetrySeed = Math.random().toString(36).substring(2, 15);
  }
  return sessionStorage.telemetrySeed;
}
```

**Testing Strategy:**
- Mock `Math.random()` with fixed seed
- Assert 100 runs → ~10 sampled events (±2% tolerance)

---

## 6. Privacy Guarantees

### 6.1 DNT Detection

```typescript
function isDNTActive(): boolean {
  return navigator.doNotTrack === "1"
      || (navigator as any).msDoNotTrack === "1"
      || (window as any).doNotTrack === "1";
}
```

**Override Hierarchy:**
1. DNT active → telemetry **always disabled**, regardless of consent
2. No DNT → respect user consent from localStorage
3. Consent not set → default to **disabled**

---

### 6.2 PII Checklist (Code Review)

Before merging, verify:
- [ ] No `String` fields outside enum validators
- [ ] No CSV cell values in any event
- [ ] No filenames or file paths
- [ ] No raw error messages (only enum codes)
- [ ] No provider names (Klarna, Affirm, etc.)
- [ ] No amounts, dates, or currency values
- [ ] No IP addresses or user IDs
- [ ] Row counts are bucketed (never exact)
- [ ] All fields validated via `validateEventSchema()`

---

## 7. Debug Hooks (Development Only)

### 7.1 Console Inspector

```typescript
// Enable in browser console:
window.__telemetryDebug = true;

// Logs on every event enqueue:
// [Telemetry] Event queued: { type: "csv_error", ... }

// View current queue:
window.__telemetryQueue();
// Returns: Array<TelemetryEvent>

// View consent state:
window.__telemetryConsent();
// Returns: ConsentState
```

**Security:** Strip debug hooks in production build (Vite `import.meta.env.DEV` guard)

---

## 8. Appendix: Type Definitions (Full)

```typescript
// ============================================================================
// CONSENT STATE
// ============================================================================

interface ConsentState {
  granted: boolean;
  version: number;
  updatedAt: string;
  dntActive?: boolean;
}

// ============================================================================
// BASE EVENT
// ============================================================================

type EventType = "csv_error" | "csv_usage" | "consent_change";

interface BaseEvent {
  type: EventType;
  timestamp: string;
  schemaVersion: number;
  appVersion: string;
  dnt: 0 | 1;
  consent: boolean;
}

// ============================================================================
// CSV ERROR EVENT
// ============================================================================

enum CSVErrorCode {
  CSV_TOO_LARGE = "CSV_TOO_LARGE",
  TOO_MANY_ROWS = "TOO_MANY_ROWS",
  WRONG_DELIMITER = "WRONG_DELIMITER",
  INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT",
  INVALID_REAL_DATE = "INVALID_REAL_DATE",
  INVALID_CURRENCY_FORMAT = "INVALID_CURRENCY_FORMAT"
}

type RowCountBucket = "0" | "1-100" | "101-500" | "501-1000" | "1000+";
type DelimiterType = "comma" | "semicolon" | "other";

interface CSVErrorEvent extends BaseEvent {
  type: "csv_error";
  code: CSVErrorCode;
  rowCountBucket: RowCountBucket;
  delimiter: DelimiterType;
}

// ============================================================================
// CSV USAGE EVENT
// ============================================================================

interface CSVUsageEvent extends BaseEvent {
  type: "csv_usage";
  rowsBucket: RowCountBucket;
  hadErrors: boolean;
  icsDownloaded: boolean;
}

// ============================================================================
// CONSENT CHANGE EVENT
// ============================================================================

enum ConsentChangeReason {
  USER_CLICK = "user_click",
  DNT_FORCED = "dnt_forced",
  RESET = "reset"
}

interface ConsentChangeEvent extends BaseEvent {
  type: "consent_change";
  to: "enabled" | "disabled";
  reason: ConsentChangeReason;
}

// ============================================================================
// UNION TYPE
// ============================================================================

type TelemetryEvent = CSVErrorEvent | CSVUsageEvent | ConsentChangeEvent;

// ============================================================================
// QUEUE
// ============================================================================

interface EventQueue {
  events: TelemetryEvent[];
  maxSize: number;
  totalEnqueued: number;
  totalDropped: number;
}

// ============================================================================
// SAMPLER
// ============================================================================

interface SamplerConfig {
  rate: number;
  seed?: string;
}
```

---

## Change Log

| **Version** | **Date**       | **Changes**                          |
|-------------|----------------|--------------------------------------|
| 1.0         | 2025-10-09     | Initial data model specification     |

---

**Next Steps:**
1. Validate schemas with legal/privacy team
2. Implement TypeScript types in `frontend/src/lib/telemetry.ts`
3. Write schema validator tests (T004 in tasks.md)
