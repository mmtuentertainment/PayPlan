// ❌ These imports should be blocked by ESLint
// These are intentionally wrong paths for testing ESLint rules
// Keep as-is to verify no-restricted-imports rule works
import { detectProvider } from 'frontend/src/lib/provider-detectors';
import { parseDate } from 'frontend/src/lib/date-parser';
import { redactEmail } from 'frontend/src/lib/redact';

// Suppress unused variable warnings - these are test fixtures
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _detectProvider = detectProvider;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _parseDate = parseDate;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _redactEmail = redactEmail;
