# Archived: BNPL Code

## Status
**Maintained-but-not-actively-developed**

## Purpose
This directory contains BNPL payment parsing features (Feature 020) archived during the product pivot from BNPL-focused to budget-first app (Phase 2, October 2025).

## Functionality
- **Route**: `/bnpl`
- **Providers**: 6 BNPL providers (Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit)
- **Features**: Email parser, payment schedule extraction, risk detection

## Directory Structure
- `pages/` - BNPLParser.tsx (main route component)
- `components/bnpl/` - BNPL-specific React components
- `lib/` - Core parsing logic, provider-specific parsers, storage utilities
- `types/` - TypeScript type definitions

## Last Active Development
2025-10-28 (Feature 020 completed)

## Migration Documentation
See [docs/migrations/archive-bnpl-code.md](../../../../docs/migrations/archive-bnpl-code.md) for archival details and rollback procedure.

## Accessing BNPL Features
BNPL features remain fully functional at `/bnpl` route. This code is archived (not deleted) to reflect product direction while preserving functionality.
