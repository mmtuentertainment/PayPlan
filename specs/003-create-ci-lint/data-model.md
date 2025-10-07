# Data Model: CI & Lint Guards

**Feature**: 003-create-ci-lint
**Date**: 2025-10-07
**Purpose**: Define guard entities, validation rules, and relationships

---

## Overview

The CI & Lint Guards feature introduces automated validation entities that enforce the modular extraction architecture. These entities are **configuration** and **validation** focused - they do not represent runtime application data.

---

## Entity: Legacy Path Pattern

**Purpose**: Represents a file path that should no longer be imported (replaced by modular architecture)

### Attributes

| Attribute | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `pattern` | String (regex) | Yes | Regex pattern matching legacy path | Must be valid regex |
| `message` | String | Yes | Error message shown to developer | Must reference Delta 0013 |
| `correctPath` | String | Yes | Recommended replacement path | Must exist in extraction/* |
| `severity` | Enum | Yes | Error severity level | One of: 'error', 'warning' |

### Example

```json
{
  "pattern": "frontend/src/lib/provider-detectors",
  "message": "❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (see Delta 0013)",
  "correctPath": "frontend/src/lib/extraction/providers/detector",
  "severity": "error"
}
```

### Validation Rules

- **VR-001**: Pattern MUST match actual legacy file path from Delta 0013
- **VR-002**: Message MUST include correct path and Delta 0013 reference
- **VR-003**: CorrectPath MUST point to existing file in extraction/* structure
- **VR-004**: Severity MUST be 'error' (blocking) for legacy paths

### State Transitions

N/A (configuration entity, no state changes)

---

## Entity: Allowed Path Pattern

**Purpose**: Represents file path patterns that are valid under modular architecture

### Attributes

| Attribute | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `pattern` | String (regex) | Yes | Regex matching valid paths | Must be valid regex |
| `description` | String | Yes | Human-readable description | - |
| `category` | Enum | Yes | Path category | One of: 'extraction', 'tests', 'config' |

### Example

```json
{
  "pattern": "frontend/src/lib/extraction/(providers|extractors|helpers)/",
  "description": "Modular extraction architecture paths",
  "category": "extraction"
}
```

### Validation Rules

- **VR-005**: Pattern MUST match modular structure from Delta 0013
- **VR-006**: Category MUST align with directory structure
- **VR-007**: Pattern MUST NOT overlap with legacy patterns (mutual exclusion)

---

## Entity: Performance Metric

**Purpose**: Represents extraction performance measurements for budget enforcement

### Attributes

| Attribute | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `extractionTimeMs` | Number | Yes | Median time for 50 emails (ms) | Must be > 0 |
| `threshold` | Number | Yes | Maximum allowed time (ms) | Fixed at 250ms |
| `baseline` | Number | Yes | Historical median (ms) | Used for delta calculation |
| `runs` | Array<Number> | Yes | Individual run times | Length = 3 (median sampling) |
| `timestamp` | ISO Date | Yes | Measurement timestamp | ISO 8601 format |
| `environment` | String | Yes | CI environment identifier | e.g., "ubuntu-latest" |

### Example

```json
{
  "extractionTimeMs": 145,
  "threshold": 250,
  "baseline": 150,
  "runs": [150, 145, 142],
  "timestamp": "2025-10-07T15:30:00Z",
  "environment": "ubuntu-latest"
}
```

### Validation Rules

- **VR-008**: Runs array MUST contain exactly 3 measurements
- **VR-009**: ExtractionTimeMs MUST be median of runs array
- **VR-010**: ExtractionTimeMs MUST be < threshold for pass
- **VR-011**: Baseline MUST be updated periodically (weekly recommended)

### Derived Attributes

| Attribute | Type | Formula | Description |
|-----------|------|---------|-------------|
| `deltaMs` | Number | `extractionTimeMs - baseline` | Absolute change from baseline |
| `deltaPercent` | Number | `(deltaMs / baseline) * 100` | Relative change percentage |
| `status` | Enum | `deltaMs > 0 ? 'regression' : 'improvement'` | Performance status |
| `passed` | Boolean | `extractionTimeMs < threshold` | Budget gate passed |

### State Transitions

1. **Measurement** → Captured (3 runs executed, median calculated)
2. **Captured** → Evaluated (compared to threshold and baseline)
3. **Evaluated** → Reported (displayed in CI summary)

---

## Entity: Spec Path Reference

**Purpose**: Represents a file path mentioned in specification markdown

### Attributes

| Attribute | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `filePath` | String | Yes | Spec file containing reference | Must exist |
| `lineNumber` | Number | Yes | Line number of reference | Must be > 0 |
| `referencedPath` | String | Yes | Extracted file path | Must match path regex |
| `validity` | Enum | Yes | Validation status | One of: 'valid', 'legacy', 'invalid' |
| `errorMessage` | String | Conditional | Error if invalid | Required if validity != 'valid' |

### Example

```json
{
  "filePath": "specs/inbox-paste/tasks.md",
  "lineNumber": 42,
  "referencedPath": "frontend/src/lib/provider-detectors.ts",
  "validity": "legacy",
  "errorMessage": "Use: extraction/providers/detector.ts (Delta 0013)"
}
```

### Validation Rules

- **VR-012**: ReferencedPath MUST be extracted via regex (matches file extension pattern)
- **VR-013**: Validity MUST be 'legacy' if matches LEGACY_PATTERNS
- **VR-014**: Validity MUST be 'invalid' if frontend/* path not in ALLOWED_PATTERNS
- **VR-015**: ErrorMessage MUST provide correct path reference for legacy/invalid

### State Transitions

1. **Extracted** → Parsed from markdown line
2. **Parsed** → Validated (checked against legacy/allowed patterns)
3. **Validated** → Reported (included in audit output if invalid)

---

## Entity: Guard Report

**Purpose**: Aggregates validation results across all guards for CI reporting

### Attributes

| Attribute | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `guardType` | Enum | Yes | Guard category | One of: 'eslint', 'performance', 'audit' |
| `status` | Enum | Yes | Overall status | One of: 'pass', 'fail' |
| `errorCount` | Number | Yes | Number of errors found | Must be >= 0 |
| `errors` | Array<String> | Yes | List of error messages | Empty if status = 'pass' |
| `timestamp` | ISO Date | Yes | Report generation time | ISO 8601 format |

### Example

```json
{
  "guardType": "eslint",
  "status": "fail",
  "errorCount": 2,
  "errors": [
    "frontend/src/components/Foo.tsx:5: ❌ frontend/src/lib/provider-detectors — Use: extraction/providers/detector (Delta 0013)",
    "frontend/src/hooks/Bar.ts:12: ❌ frontend/src/lib/date-parser — Use: extraction/extractors/date (Delta 0013)"
  ],
  "timestamp": "2025-10-07T15:35:00Z"
}
```

### Validation Rules

- **VR-016**: Status MUST be 'fail' if errorCount > 0
- **VR-017**: Status MUST be 'pass' if errorCount = 0
- **VR-018**: Errors array length MUST equal errorCount
- **VR-019**: Each error MUST include file:line format for navigation

### Aggregation Logic

```typescript
function aggregateGuardReports(reports: GuardReport[]): CIBuildStatus {
  const allPassed = reports.every(r => r.status === 'pass');
  const totalErrors = reports.reduce((sum, r) => sum + r.errorCount, 0);

  return {
    overallStatus: allPassed ? 'pass' : 'fail',
    totalErrors,
    guardReports: reports,
    exitCode: allPassed ? 0 : 1
  };
}
```

---

## Relationships

### Legacy Path Pattern → Allowed Path Pattern

- **Type**: Mutual Exclusion
- **Constraint**: A path CANNOT match both legacy and allowed patterns
- **Enforcement**: Legacy patterns checked first in validation logic

### Performance Metric → Guard Report

- **Type**: Composition (1:1)
- **Constraint**: Each performance test generates one metric, which contributes to one guard report
- **Cascade**: If metric.passed = false, report.status = 'fail'

### Spec Path Reference → Guard Report

- **Type**: Composition (Many:1)
- **Constraint**: Multiple spec path references aggregate into one audit guard report
- **Cascade**: If any reference.validity != 'valid', report.status = 'fail'

### Guard Report → CI Build Status

- **Type**: Aggregation (Many:1)
- **Constraint**: All guard reports must have status = 'pass' for build to succeed
- **Cascade**: Single failed guard fails entire CI build

---

## Validation Summary

### Critical Validations (Build-Blocking)

- **CV-001**: ESLint detects any legacy path import → Build fails
- **CV-002**: Performance metric exceeds 250ms threshold → Build fails
- **CV-003**: Spec path audit finds any legacy/invalid reference → Build fails

### Informational Validations (Non-Blocking)

- **IV-001**: Performance improvement detected → Display positive delta
- **IV-002**: All validations pass → Display success summary

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ CI Build Trigger                                        │
└────┬─────────────────────────────────────────┬──────────┘
     │                                         │
     ▼                                         ▼
┌─────────────────┐                  ┌──────────────────┐
│ ESLint Guard    │                  │ Performance Gate │
│                 │                  │                  │
│ 1. Parse imports│                  │ 1. Run 3 tests   │
│ 2. Check legacy │                  │ 2. Calculate     │
│    patterns     │                  │    median        │
│ 3. Generate     │                  │ 3. Compare vs    │
│    report       │                  │    threshold     │
└────┬────────────┘                  └────┬─────────────┘
     │                                    │
     ▼                                    ▼
┌──────────────────────────────────────────────────────┐
│ Spec Audit Guard                                     │
│                                                      │
│ 1. Scan specs/**/*.md                               │
│ 2. Extract file paths via regex                     │
│ 3. Validate against legacy/allowed patterns         │
│ 4. Generate report with file:line errors            │
└────┬─────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────┐
│ Aggregate Reports                                    │
│                                                      │
│ - Collect all guard reports                          │
│ - Calculate overall status (pass if all pass)        │
│ - Surface errors in CI summary                       │
│ - Exit with code 0 (pass) or 1 (fail)              │
└──────────────────────────────────────────────────────┘
```

---

## Configuration Schema

### ESLint Rule Configuration

**Location**: `frontend/.eslintrc.cjs`

```typescript
interface ESLintRestrictedImport {
  paths: Array<{
    name: string;           // Exact module name
    message: string;        // Error message with guidance
  }>;
  patterns: Array<{
    group: string[];        // Glob patterns
    message: string;        // Error message with guidance
  }>;
}
```

### Performance Budget Configuration

**Location**: `.github/workflows/ci.yml` + test file

```typescript
interface PerformanceBudget {
  testFile: string;         // Path to performance test
  threshold: number;        // Max allowed time (ms)
  baseline: number;         // Historical median (ms)
  runs: number;             // Number of samples (3)
}
```

### Audit Script Configuration

**Location**: `scripts/audit-spec-paths.mjs`

```typescript
interface AuditConfig {
  specGlob: string;         // "specs/**/*.md"
  allowedPatterns: RegExp[];
  legacyPatterns: Array<{
    pattern: RegExp;
    message: string;
  }>;
  ignorePatterns: string[]; // e.g., node_modules
}
```

---

**Data Model Status**: ✅ Complete - Ready for contract generation
