#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

// Parse CLI args
const args = process.argv.slice(2);
const maxLoc = parseInt(args.find(a => a.startsWith('--max'))?.split('=')[1] || args[args.indexOf('--max') + 1] || '180', 10);
const targetLoc = parseInt(args.find(a => a.startsWith('--target'))?.split('=')[1] || args[args.indexOf('--target') + 1] || '120', 10);

// Read OpenAPI spec
const specPath = join(process.cwd(), 'api', 'openapi.yaml');
const content = readFileSync(specPath, 'utf-8');
// Match wc -l behavior: count newlines, not split length
const lineCount = content.trim() ? content.trim().split('\n').length : 0;

// Print exact output format
console.log(`OPENAPI_LOC=${lineCount}`);
console.log(`OPENAPI_BUDGET_MAX=${maxLoc}, TARGET=${targetLoc}`);

// Print markdown summary
const status = lineCount <= maxLoc ? 'PASS' : 'FAIL';
console.log('## OpenAPI LOC Guard');
console.log(`- Current: ${lineCount}`);
console.log(`- Max: ${maxLoc}`);
console.log(`- Target: ${targetLoc}`);
console.log(`- Status: ${status}`);

// Exit code
process.exit(lineCount <= maxLoc ? 0 : 1);
