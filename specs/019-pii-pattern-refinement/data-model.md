# Data Model: PII Sanitization Pattern Refinement

**Feature**: 019-pii-pattern-refinement
**Date**: 2025-10-24
**Status**: Phase 1 - Design & Contracts

## Purpose

This document defines the core entities and their relationships for the PII Pattern Refinement feature. These entities represent the domain model for precise word boundary-based PII detection that eliminates false positives and false negatives.

## Core Entities

### 1. PII Pattern

Represents a field name pattern that indicates the presence of PII or authentication secrets.

**Fields**:
- `pattern` (string, required): The pattern text to match (e.g., 'name', 'token', 'password')
  - Validation: Non-empty string, lowercase normalized
  - Examples: 'email', 'password', 'token', 'apiKey', 'name', 'phone'

- `category` (enum, required): Classification of the PII type
  - Values: `contact | identity | financial | authentication_secret | network | government_id | tax_id`
  - Validation: Must be one of the defined categories
  - Examples:
    - `contact`: email, phone, address
    - `identity`: name, ssn, dob
    - `financial`: card, account, bankaccount
    - `authentication_secret`: password, token, apiKey, secret, auth, credential
    - `network`: ip, ipaddress
    - `government_id`: passport, license, nationalid
    - `tax_id`: tin, taxid, vat

- `matchingRule` (FieldMatchRule, required): The rule used to match this pattern against field names
  - Reference: See FieldMatchRule entity below
  - Determines how the pattern is matched (word boundary vs exact vs compound)

- `evaluationPriority` (number, required): Order in which patterns are evaluated
  - Validation: Integer >= 0, lower numbers = higher priority
  - FR-013: Authentication secrets must have priority 0 (evaluated first)
  - Other PII patterns: priority 1 (evaluated after auth secrets)
  - Rationale: Defense-in-depth security - ensure critical secrets are never missed

**Relationships**:
- Has one FieldMatchRule (composition - cannot exist without matching rule)
- Produces zero or more SanitizationResults when applied to objects

**State Transitions**:
- N/A (immutable configuration data)

**Validation Rules** (from requirements):
- FR-001: All patterns must implement word boundary matching
- FR-010: Authentication secret patterns (password, token, apiKey, secret, auth, credential, authorization, passwd) must exist
- FR-013: Authentication patterns must have `evaluationPriority = 0`
- FR-012: When compound fields match multiple patterns, authentication secrets take precedence

**Examples**:
```javascript
// Authentication secret pattern (highest priority)
{
  pattern: 'password',
  category: 'authentication_secret',
  matchingRule: { matchType: 'word_boundary', caseSensitive: false },
  evaluationPriority: 0
}

// Contact PII pattern (normal priority)
{
  pattern: 'email',
  category: 'contact',
  matchingRule: { matchType: 'word_boundary', caseSensitive: false },
  evaluationPriority: 1
}

// Scoped network pattern (specific compound matching)
{
  pattern: 'ip',
  category: 'network',
  matchingRule: { matchType: 'specific_compound', allowedCompounds: ['ipAddress', 'remote_ip', 'client_ip'] },
  evaluationPriority: 1
}
```

---

### 2. Field Match Rule

Defines the criteria and algorithm for matching a PII pattern against a field name. This entity encapsulates the word boundary detection logic that eliminates false positives.

**Fields**:
- `matchType` (enum, required): The type of matching algorithm to use
  - Values: `word_boundary | exact | specific_compound`
  - Validation: Must be one of the defined types
  - `word_boundary`: Pattern must appear at word boundaries (camelCase or snake_case)
  - `exact`: Field name must exactly match the pattern
  - `specific_compound`: Field name must match one of the allowed compound patterns

- `caseSensitive` (boolean, required): Whether matching is case-sensitive
  - Validation: Boolean value
  - Default: `false` (case-insensitive matching)
  - FR-001: Case-insensitive matching required for all patterns

- `boundaryDetectionLogic` (enum, required for `word_boundary` matchType): How to detect word boundaries
  - Values: `combined | camelCase | snake_case`
  - Validation: Required when `matchType = 'word_boundary'`
  - `combined`: Detect both camelCase and snake_case boundaries (default, recommended)
  - `camelCase`: Only detect boundaries at capital letters (e.g., 'userName')
  - `snake_case`: Only detect boundaries at underscores (e.g., 'user_name')

- `allowedCompounds` (string[], optional): List of allowed compound field names
  - Validation: Non-empty array of strings when `matchType = 'specific_compound'`
  - FR-011: Required for 'ip' pattern to scope to ['ipAddress', 'remote_ip', 'client_ip', etc.]
  - Example: ['ipAddress', 'remoteIp', 'clientIp', 'remote_ip', 'client_ip']

**Relationships**:
- Belongs to exactly one PII Pattern (composition)
- Applied to field names during sanitization to produce boolean match results

**State Transitions**:
- N/A (immutable configuration data)

**Validation Rules** (from requirements):
- FR-001: Word boundary matching must support both camelCase and snake_case
- FR-002: Must detect camelCase boundaries (e.g., 'userName', 'firstName')
- FR-003: Must detect snake_case boundaries (e.g., 'user_name', 'first_name')
- FR-004: Case-insensitive matching required ('Name', 'name', 'NAME' all match)
- FR-009: Must NOT match when pattern is part of a larger word (e.g., 'name' must not match 'filename')
- FR-011: 'ip' pattern requires specific compound matching (not generic word boundary)

**Examples**:
```javascript
// Standard word boundary matching (most PII patterns)
{
  matchType: 'word_boundary',
  caseSensitive: false,
  boundaryDetectionLogic: 'combined'
}
// Matches: 'email', 'userEmail', 'user_email'
// Does NOT match: 'female', 'emails'

// Scoped compound matching (ip pattern only)
{
  matchType: 'specific_compound',
  caseSensitive: false,
  allowedCompounds: ['ipAddress', 'remoteIp', 'clientIp', 'remote_ip', 'client_ip']
}
// Matches: 'ipAddress', 'remote_ip'
// Does NOT match: 'zip', 'ship', 'ip' (standalone)

// Exact matching (if needed for future patterns)
{
  matchType: 'exact',
  caseSensitive: false
}
// Matches: 'password' only
// Does NOT match: 'userPassword', 'passwordHash'
```

---

### 3. Sanitization Result

Represents the outcome of applying PII pattern matching and sanitization to a field or object. This entity tracks whether sanitization occurred and preserves structural sharing optimization.

**Fields**:
- `sanitizationOccurred` (boolean, required): Whether any PII fields were removed
  - Validation: Boolean value
  - `true`: At least one field was sanitized (new object returned)
  - `false`: No PII detected (original reference returned)

- `originalDataReference` (any, conditional): Reference to the original data
  - Validation: Present when `sanitizationOccurred = false`
  - FR-008: Structural sharing optimization - return same reference when no PII found
  - Performance benefit: Avoids unnecessary object cloning

- `sanitizedData` (any, conditional): The new sanitized data with PII removed
  - Validation: Present when `sanitizationOccurred = true`
  - Type matches original data type (object, array, primitive)
  - FR-005: Nested objects/arrays must be recursively sanitized

- `performanceMetrics` (object, required): Timing and performance data
  - Fields:
    - `executionTimeMs` (number): Time taken to sanitize in milliseconds
    - `fieldsScanned` (number): Total number of fields checked
    - `fieldsRemoved` (number): Number of PII fields removed
    - `nestingDepth` (number): Maximum nesting depth processed
  - Validation: All fields >= 0
  - FR-008: Must complete in <50ms for typical objects (10-50 fields, 2-3 nesting levels)

- `matchedPatterns` (string[], optional): List of pattern names that matched
  - Validation: Array of pattern strings (e.g., ['email', 'password'])
  - Useful for debugging and audit logging
  - FR-010: Should include authentication secret patterns when matched

**Relationships**:
- Produced by applying PII Patterns to data structures
- Contains either `originalDataReference` OR `sanitizedData` (mutually exclusive based on `sanitizationOccurred`)

**State Transitions**:
- N/A (immutable result object - created once, never modified)

**Validation Rules** (from requirements):
- FR-007: Backward compatibility - existing valid sanitization behavior must not change
- FR-008: Performance must remain under 50ms for typical objects
- FR-005: Circular references must be detected and handled (replaced with '[Circular]')
- FR-006: Special object types (Date, RegExp, Map, Set) must be preserved with correct handling

**Examples**:
```javascript
// No sanitization occurred (structural sharing)
{
  sanitizationOccurred: false,
  originalDataReference: { id: '123', amount: 100, filename: 'report.csv' },
  performanceMetrics: {
    executionTimeMs: 2.3,
    fieldsScanned: 3,
    fieldsRemoved: 0,
    nestingDepth: 1
  },
  matchedPatterns: []
}

// Sanitization occurred (PII removed)
{
  sanitizationOccurred: true,
  sanitizedData: { id: '123', amount: 100 },
  performanceMetrics: {
    executionTimeMs: 4.7,
    fieldsScanned: 4,
    fieldsRemoved: 1,
    nestingDepth: 1
  },
  matchedPatterns: ['email']
}

// Authentication secret sanitized (high priority)
{
  sanitizationOccurred: true,
  sanitizedData: { username: 'john.doe' },
  performanceMetrics: {
    executionTimeMs: 3.2,
    fieldsScanned: 2,
    fieldsRemoved: 1,
    nestingDepth: 1
  },
  matchedPatterns: ['password']
}
```

---

## Entity Relationships Diagram

```
┌─────────────────┐
│   PII Pattern   │
├─────────────────┤
│ - pattern       │
│ - category      │
│ - priority      │
└────────┬────────┘
         │ 1
         │ owns
         │ 1
         ▼
┌─────────────────────┐
│  Field Match Rule   │
├─────────────────────┤
│ - matchType         │
│ - caseSensitive     │
│ - boundaryLogic     │
│ - allowedCompounds  │
└─────────────────────┘

         ┌─────────────────────┐
         │   PII Pattern       │
         │   (applied to data) │
         └──────────┬──────────┘
                    │ produces
                    │ 0..*
                    ▼
         ┌─────────────────────┐
         │ Sanitization Result │
         ├─────────────────────┤
         │ - occurred          │
         │ - originalRef       │
         │ - sanitizedData     │
         │ - metrics           │
         └─────────────────────┘
```

## Data Flow

1. **Pattern Evaluation** (FR-013):
   ```
   Input Object → Check Authentication Secrets (priority 0) → Check Other PII (priority 1) → Result
   ```

2. **Field Matching** (FR-001, FR-002, FR-003):
   ```
   Field Name → Apply Match Rule → Word Boundary Detection → Boolean (match/no match)
   ```

3. **Sanitization** (FR-005, FR-008):
   ```
   Original Object → Recursive Pattern Matching → PII Removed? → Return (original ref OR new object)
   ```

## Implementation Notes

### Pattern Storage
Current implementation stores patterns as a simple string array (`this.piiPatterns`). This data model suggests organizing patterns with their matching rules and priorities:

```javascript
// Current (Feature 018)
this.piiPatterns = ['email', 'phone', 'name', 'password', ...];

// Proposed (Feature 019)
this.piiPatterns = [
  // Authentication secrets (priority 0 - evaluated first)
  { pattern: 'password', category: 'authentication_secret', matchType: 'word_boundary', priority: 0 },
  { pattern: 'token', category: 'authentication_secret', matchType: 'word_boundary', priority: 0 },
  { pattern: 'apiKey', category: 'authentication_secret', matchType: 'word_boundary', priority: 0 },

  // Other PII (priority 1 - evaluated after auth secrets)
  { pattern: 'email', category: 'contact', matchType: 'word_boundary', priority: 1 },
  { pattern: 'phone', category: 'contact', matchType: 'word_boundary', priority: 1 },
  { pattern: 'name', category: 'identity', matchType: 'word_boundary', priority: 1 },

  // Scoped patterns (specific compound matching)
  {
    pattern: 'ip',
    category: 'network',
    matchType: 'specific_compound',
    priority: 1,
    allowedCompounds: ['ipAddress', 'remoteIp', 'clientIp', 'remote_ip', 'client_ip']
  },
];
```

### Backward Compatibility (FR-007)
The expanded data model is **backward compatible** because:
- Existing `isPiiField(fieldName)` API remains unchanged
- Internal pattern matching logic is enhanced, but external behavior for valid cases is identical
- All 226+ existing tests must continue to pass

### Performance Constraints (FR-008)
- Pattern evaluation order optimization: Check auth secrets first (fewer patterns, but critical)
- Structural sharing: Return original reference when `sanitizationOccurred = false`
- Target: <50ms for typical objects (10-50 fields, 2-3 nesting levels)

## Validation Summary

| Entity | Key Validation Rules | Source Requirements |
|--------|---------------------|---------------------|
| PII Pattern | Non-empty pattern, valid category, auth secrets have priority 0 | FR-010, FR-013 |
| Field Match Rule | Valid matchType, case-insensitive, word boundary for both camelCase/snake_case | FR-001, FR-002, FR-003, FR-004 |
| Sanitization Result | Performance <50ms, structural sharing when no PII, circular handling | FR-005, FR-007, FR-008 |

---

**Status**: Phase 1 Design Complete - Ready for Contract Generation
