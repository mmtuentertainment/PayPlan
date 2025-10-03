# Delta 0008: Inbox Paste Phase B — Zip + Sezzle Detectors

**Feature**: v0.1.4-b Micro-batch T10
**Status**: Shipped (PR #6)
**Date**: 2025-10-03

## Summary
Add client-only detectors for Zip and Sezzle BNPL providers with false-positive guards.

## Files Changed (6)

### Code
1. `frontend/src/lib/provider-detectors.ts`
   - Extended `Provider` union: `'Zip' | 'Sezzle'`
   - Added `PROVIDER_PATTERNS.zip` with signatures, amount/date/installment patterns
   - Added `PROVIDER_PATTERNS.sezzle` with similar patterns
   - Updated `detectProvider()` with guard logic:
     - Zip: Require domain match OR (keyword + nearby installment phrase ≤80 chars)
     - Sezzle: Same guard to prevent false positives
   - Added JSDoc examples for Zip/Sezzle detection

2. `frontend/src/lib/email-extractor.ts`
   - Added JSDoc example for Zip/Sezzle confidence calculation

### Tests
3. `frontend/tests/unit/zip-sezzle-detector.test.ts` (NEW)
   - 25 tests total (13 Zip + 12 Sezzle)
   - Coverage: domain detection, keyword+proximity, amount/date/installment extraction
   - Guard tests: false-positive prevention ("zip this file" → Unknown)

4. `frontend/tests/fixtures/emails/zip-payment1.txt` (NEW)
   - Realistic Zip email with autopay ON, late fee $5.00

5. `frontend/tests/fixtures/emails/sezzle-payment1.txt` (NEW)
   - Realistic Sezzle email with autopay OFF, late fee $0.00

### Docs
6. `README.md`
   - Updated Multi-Provider Support list
   - Added Zip (includes Quadpay) and Sezzle to Inbox Paste section

## Rationale

### Why Guard Logic?
- "Zip" is a common file verb → high false-positive risk
- Guard: Require domain match OR (keyword + installment phrase within 80 chars)
- Sezzle: Similar guard for consistency

### Patterns Reused
- Amount/date/installment patterns reuse PayPal structure (proven stable)
- Autopay detection: same negative-first priority as other providers

## Test Results
- **Before**: 60 tests passing
- **After**: 85 tests passing (+25 Zip/Sezzle)
- TypeScript build: Clean (no errors)
- Existing providers: Unaffected

## Rollback
```bash
git revert <commit-sha>
# OR
git checkout main -- frontend/src/lib/provider-detectors.ts frontend/src/lib/email-extractor.ts
git checkout main -- frontend/tests/unit/zip-sezzle-detector.test.ts
git checkout main -- frontend/tests/fixtures/emails/zip-payment1.txt
git checkout main -- frontend/tests/fixtures/emails/sezzle-payment1.txt
git checkout main -- README.md
```

## Dependencies
- No new npm packages
- Existing: luxon (date parsing), ics (calendar generation)

## Next Steps
- Deploy to production
- Monitor for false positives/negatives
- Consider adding more provider-specific date format patterns if needed
