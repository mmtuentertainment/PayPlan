// ✅ These imports follow modular architecture
import { detectProvider } from '@/lib/extraction/providers/detector';
import { parseDate } from '@/lib/extraction/extractors/date';
import { redactPII } from '@/lib/extraction/helpers/redaction';

// Suppress unused variable warnings - these are test fixtures
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _detectProvider = detectProvider;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _parseDate = parseDate;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _redactPII = redactPII;
