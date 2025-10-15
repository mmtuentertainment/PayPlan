# PayPlan Test Data

**Purpose**: Test data files for validating PayPlan features across different scenarios.

## Directory Structure

```
test-data/
├── csv-samples/          # CSV files for import/export testing
│   ├── 01-basic-payments.csv
│   ├── 02-empty-risk-data.csv
│   ├── 03-special-characters.csv
│   ├── 04-unicode-characters.csv
│   ├── 05-edge-cases.csv
│   ├── 06-multiple-providers.csv
│   ├── 07-collision-risk.csv
│   ├── 08-weekend-autopay.csv
│   ├── 09-large-dataset-600.csv
│   └── README.md
└── README.md             # This file
```

## Test Data Sets

### CSV Samples (Feature 014 - CSV Export)

**Location**: `test-data/csv-samples/`

**Files**: 9 CSV test files covering:
- Basic payment scenarios
- Edge cases (special characters, unicode, large amounts)
- Risk detection scenarios (COLLISION, WEEKEND_AUTOPAY)
- Performance testing (600 records)

See [csv-samples/README.md](csv-samples/README.md) for detailed documentation.

## Usage

### Quick Start
```bash
# Import a sample CSV
1. Start PayPlan: npm run dev (in frontend/)
2. Navigate to Import page
3. Upload: test-data/csv-samples/01-basic-payments.csv
4. Build Plan
5. Download CSV
6. Compare exported CSV with original
```

### Testing CSV Export Feature

Use these samples to validate the CSV export feature (014-build-a-csv):

1. **Round-trip Test**: Import → Export → Re-import
   - Use: 01-basic-payments.csv
   - Verify: No data loss

2. **Special Characters**: RFC 4180 compliance
   - Use: 03-special-characters.csv
   - Verify: Proper escaping in export

3. **Unicode**: Character preservation
   - Use: 04-unicode-characters.csv
   - Verify: €, ¥, accents preserved

4. **Performance**: Large dataset warning
   - Use: 09-large-dataset-600.csv
   - Verify: Warning toast appears (>500 records)

5. **Risk Analysis**: Risk columns populated
   - Use: 07-collision-risk.csv or 08-weekend-autopay.csv
   - Verify: risk_type, risk_severity, risk_message in export

## Adding New Test Data

When adding new test files:

1. Create file in appropriate subdirectory
2. Follow naming convention: `##-descriptive-name.csv`
3. Add documentation to subdirectory README.md
4. Include expected behavior and test scenario

## Notes

- Test data is version-controlled for reproducibility
- All CSV files use UTF-8 encoding
- Files are safe to share (no sensitive/real financial data)
- Generated: 2025-10-14 for Feature 014 (CSV Export)
