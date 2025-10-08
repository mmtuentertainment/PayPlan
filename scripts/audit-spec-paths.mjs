#!/usr/bin/env node
/**
 * Spec Path Audit Script
 * Scans specs/ for .md files and validates path references against modular architecture
 */
import fs from 'fs';
import path from 'path';

// Allowed path patterns (from Delta 0013)
const ALLOWED_PATTERNS = [
  /frontend\/src\/lib\/extraction\/(providers|extractors|helpers)\//,
  /frontend\/tests\/(unit|integration|performance|fixtures)\//,
  /\.github\/workflows\//,
  /package\.json$/,
  /ops\/deltas\//,
];

// Legacy patterns to reject
const LEGACY_PATTERNS = [
  { pattern: /frontend\/src\/lib\/provider-detectors\.ts/, message: 'Use: extraction/providers/detector.ts (Delta 0013)' },
  { pattern: /frontend\/src\/lib\/date-parser\.ts/, message: 'Use: extraction/extractors/date.ts (Delta 0013)' },
  { pattern: /frontend\/src\/lib\/redact\.ts/, message: 'Use: extraction/helpers/redaction.ts (Delta 0013)' },
  { pattern: /^tests\//, message: 'Missing frontend/ prefix. Use: frontend/tests/ (Delta 0013)' },
];

// Extract file paths from markdown
function extractPaths(content) {
  // Delta 0017: Use dual regex patterns for better coverage
  const codeSpanRegex = /`([^`]+\.(ts|tsx|js|jsx|mjs|md|json|yml|yaml))`/g;
  const linkRegex = /\[.*?\]\(([^)]+\.(ts|tsx|js|jsx|mjs|md|json|yml|yaml))\)/g;

  const paths = [
    ...Array.from(content.matchAll(codeSpanRegex), m => m[1]),
    ...Array.from(content.matchAll(linkRegex), m => m[1])
  ];

  return [...new Set(paths)];
}

// Main audit
const specFiles = fs.globSync('specs/**/*.md', { exclude: ['**/node_modules/**'] });
const errors = [];

for (const file of specFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const paths = extractPaths(line);

    paths.forEach(p => {
      // Check legacy patterns first
      for (const legacy of LEGACY_PATTERNS) {
        if (legacy.pattern.test(p)) {
          errors.push(`${file}:${idx + 1}: ❌ ${p} — ${legacy.message}`);
          return;
        }
      }

      // Check if matches allowed patterns
      const allowed = ALLOWED_PATTERNS.some(pattern => pattern.test(p));
      if (!allowed && (p.startsWith('frontend/') || p.startsWith('tests/'))) {
        errors.push(`${file}:${idx + 1}: ⚠️  ${p} — Not in extraction/* or frontend/tests/* (Delta 0013)`);
      }
    });
  });
}

// Report
if (errors.length > 0) {
  console.error('❌ Spec Path Audit Failed\n');
  errors.forEach(err => console.error(err));
  console.error(`\nFound ${errors.length} invalid path references.`);
  console.error('See ops/deltas/0013_realignment.md for correct paths.\n');
  process.exit(1);
} else {
  console.log('✅ Spec Path Audit Passed — All references valid');
}
