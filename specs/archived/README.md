# Archived Specifications

## Purpose
This directory contains archived feature specifications for features that have been deprioritized or archived during product pivots.

## Status
**Maintained-but-not-actively-developed**

Archived specs represent completed features that remain functional but are no longer actively developed. Code for these features has been relocated to `frontend/src/archive/`.

## Archival Date
2025-10-30 (Phase 2 of product pivot)

## Archived Features

### 020-short-name-bnpl (BNPL Email Parser)
- **Status**: Archived
- **Reason**: Product pivot from BNPL-focused to budget-first app
- **Code Location**: `frontend/src/archive/bnpl/`
- **Route**: `/bnpl` (still accessible)
- **Last Active Development**: 2025-10-28

## Migration Documentation
See [docs/migrations/archive-bnpl-code.md](../../docs/migrations/archive-bnpl-code.md) for complete archival details and rollback procedures.

## Discovery
Use `ls specs/archived/` or glob patterns to discover archived specs. Each spec directory contains complete specification, plan, and task documentation.
