# Data Model: Demo Mode End-to-End

**Feature**: 006-0019-demo-mode | **Date**: 2025-10-07

## Overview

This document defines the data structures used in the Demo Mode feature. The feature primarily **reuses** existing types from `email-extractor.ts` and adds minimal demo-specific types.

## Existing Types (Reused)

### Item

**Source**: `frontend/src/lib/email-extractor.ts`

Represents a single extracted BNPL payment installment.

```typescript
interface Item {
  id: string;                    // UUID for React keys
  provider: string;              // e.g., "Klarna", "Affirm", "Afterpay"
  installment_no: number;        // e.g., 1, 2, 3, 4
  due_date: string;              // ISO 8601 date (e.g., "2025-10-15")
  raw_due_date?: string;         // Original text found in email
  amount: number;                // Payment amount (e.g., 25.00)
  currency: string;              // ISO 4217 code (e.g., "USD")
  autopay: boolean;              // True if autopay is enabled
  late_fee: number;              // Late fee amount (0 if none)
  confidence: number;            // Extraction confidence (0.35-1.0)
}
```

**Validation Rules**:
- `id`: Must be non-empty UUID
- `provider`: Must match known BNPL providers (Klarna, Affirm, etc.)
- `installment_no`: Must be positive integer
- `due_date`: Must be valid ISO 8601 date string
- `amount`: Must be positive number
- `currency`: Must be valid ISO 4217 code
- `autopay`: Boolean
- `late_fee`: Must be non-negative number
- `confidence`: Must be between 0.35 and 1.0

---

### ExtractionResult

**Source**: `frontend/src/lib/email-extractor.ts`

Container for extraction output from `extractItemsFromEmails()`.

```typescript
interface ExtractionResult {
  items: Item[];                 // Successfully extracted items
  issues: Issue[];               // Extraction failures
  duplicatesRemoved: number;     // Count of duplicates filtered
  dateLocale: 'US' | 'EU';       // Date parsing locale used
}
```

**Validation Rules**:
- `items`: Array of valid Item objects
- `issues`: Array of valid Issue objects
- `duplicatesRemoved`: Non-negative integer
- `dateLocale`: Must be 'US' or 'EU'

---

### Issue

**Source**: `frontend/src/lib/email-extractor.ts`

Represents an extraction failure with debugging info.

```typescript
interface Issue {
  id: string;                    // Unique identifier
  snippet: string;               // Redacted email snippet (≤100 chars)
  reason: string;                // User-friendly error message
}
```

**Validation Rules**:
- `id`: Must be non-empty string
- `snippet`: Must be ≤100 characters, PII-free
- `reason`: Must be non-empty, user-friendly string

---

## New Types (Demo-Specific)

### DemoFixture

Represents a single synthetic email fixture for demo purposes.

```typescript
interface DemoFixture {
  id: string;                    // Unique ID (e.g., "klarna-1")
  provider: string;              // Provider name (e.g., "Klarna")
  emailText: string;             // Full email content (plain text)
}
```

**Validation Rules**:
- `id`: Must match filename pattern (e.g., "klarna-1" from "klarna-1.txt")
- `provider`: Must be one of: Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle
- `emailText`: Must be non-empty, contain recognizable BNPL patterns, PII-free

**Example**:
```typescript
{
  id: "klarna-1",
  provider: "Klarna",
  emailText: "From: noreply@klarna.com\nSubject: Payment Reminder\n\nYour payment of $25.00 USD is due on October 15, 2025.\n\nThis is installment 2 of 4.\n\nAutopay is enabled."
}
```

---

### ConfidenceLevel

UI-friendly confidence level for pill display.

```typescript
type ConfidenceLevel = 'High' | 'Medium' | 'Low';
```

**Mapping from Item.confidence**:
- `High`: confidence ≥ 0.80
- `Medium`: 0.50 ≤ confidence < 0.80
- `Low`: 0.35 ≤ confidence < 0.50

**Usage**: Determines pill color in UI (Green/Yellow/Orange)

---

### RiskType

Types of financial risks detected in payment schedules.

```typescript
type RiskType =
  | 'COLLISION'        // Multiple payments on same date
  | 'CASH_CRUNCH'      // Payment too close to payday (not used in demo)
  | 'WEEKEND_AUTOPAY'; // Autopay scheduled for Sat/Sun
```

**Demo Implementation**:
- `COLLISION`: Detect if any two items have identical `due_date`
- `WEEKEND_AUTOPAY`: Detect if `autopay: true` and `due_date` is Saturday/Sunday
- `CASH_CRUNCH`: **Not implemented** in demo (requires payday data)

---

### Risk

Represents a detected risk condition.

```typescript
interface Risk {
  type: RiskType;                // Risk category
  severity: 'high' | 'medium' | 'low';  // Risk severity level
  message: string;               // User-friendly description
  affectedItems?: string[];      // Item IDs involved (optional)
}
```

**Validation Rules**:
- `type`: Must be valid RiskType
- `severity`: Must be 'high', 'medium', or 'low'
- `message`: Must be non-empty, user-friendly string
- `affectedItems`: If present, must contain valid Item UUIDs

**Example**:
```typescript
{
  type: 'COLLISION',
  severity: 'high',
  message: 'Multiple payments due on October 15, 2025',
  affectedItems: ['uuid-1', 'uuid-2']
}
```

---

### DemoResults

Aggregated results for demo page display.

```typescript
interface DemoResults {
  items: Item[];                 // All extracted items
  confidenceLevels: Map<string, ConfidenceLevel>;  // Item ID → confidence level
  risks: Risk[];                 // Detected risks
  thisWeekCount: number;         // Count of items due "This Week"
}
```

**Validation Rules**:
- `items`: Array of valid Items
- `confidenceLevels`: Map keys must match Item IDs; values must be valid ConfidenceLevels
- `risks`: Array of valid Risk objects
- `thisWeekCount`: Non-negative integer ≤ items.length

---

## Data Flow

```text
1. Fixture Loading
   loadFixtures()
   → DemoFixture[]

2. Email Extraction
   For each DemoFixture:
     extractItemsFromEmails(fixture.emailText, timezone)
     → ExtractionResult
   Aggregate all items → Item[]

3. Confidence Classification
   For each Item:
     mapConfidence(item.confidence)
     → ConfidenceLevel

4. Risk Detection
   detectRisks(items[])
   → Risk[]

5. "This Week" Filtering
   filterThisWeek(items[], timezone)
   → Item[] (subset)

6. ICS Generation
   generateIcs(thisWeekItems, risks, timezone)
   → Blob (downloadable .ics file)
```

---

## State Transitions

### Demo Page State

```text
Initial State:
  - Fixtures: loaded (10 DemoFixture objects)
  - Results: null
  - IcsBlob: null

User clicks "Run Demo":
  → Processing state (show spinner)
  → Call extractItemsFromEmails() for all fixtures
  → Detect risks
  → Calculate confidence levels
  → Update Results state

Results Displayed:
  - Show normalized schedule table
  - Show confidence pills (High/Med/Low)
  - Show risk pills (if any)
  - Enable "Download .ics" button

User clicks "Download .ics":
  - Filter items to "This Week"
  - Generate ICS blob
  - Trigger browser download
```

---

## Relationships

```text
DemoFixture (1) → (1) ExtractionResult
  - Each fixture is processed independently
  - Results aggregated into single DemoResults

Item (N) → (1) ConfidenceLevel
  - Each item maps to one confidence level
  - Derived from item.confidence score

Item (N) → (M) Risk
  - Multiple items can contribute to same risk
  - Example: 3 items on same date → 1 COLLISION risk

Item (N) → (M) CalendarEvent
  - Each "This Week" item → 1 ICS event
  - Events include risk annotations if applicable
```

---

## Constraints

1. **PII Prohibition**: All `DemoFixture.emailText` must be synthetic and PII-free
2. **LOC Budget**: Keep type definitions minimal (reuse existing types)
3. **Offline Operation**: No external data sources; all data bundled with app
4. **Timezone Awareness**: All date operations must use IANA timezone
5. **No Persistence**: No storage; all state is ephemeral (page refresh resets)

---

## Example Complete Flow

**Input**: User loads `/demo` page

**Fixture Data**:
```typescript
[
  { id: "klarna-1", provider: "Klarna", emailText: "...due Oct 15..." },
  { id: "affirm-1", provider: "Affirm", emailText: "...due Oct 15..." },
  // ... 8 more
]
```

**After "Run Demo"**:
```typescript
{
  items: [
    { id: "uuid-1", provider: "Klarna", due_date: "2025-10-15", confidence: 0.95, ... },
    { id: "uuid-2", provider: "Affirm", due_date: "2025-10-15", confidence: 0.85, ... },
    // ... 8 more
  ],
  confidenceLevels: Map {
    "uuid-1" => "High",
    "uuid-2" => "High",
    // ...
  },
  risks: [
    { type: "COLLISION", severity: "high", message: "Multiple payments due on Oct 15" }
  ],
  thisWeekCount: 3
}
```

**After "Download .ics"**:
- Blob containing ICS data for 3 "This Week" items
- Events include risk annotation: "⚠️ Multiple payments due on this date"

---

**Status**: ✅ Complete | **Next**: quickstart.md
