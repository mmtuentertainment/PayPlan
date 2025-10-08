/**
 * ESLint Rule Validation Tests (Delta 0017)
 * Ensures no-restricted-imports rules block legacy modular extraction paths
 * Uses actual fixture files to test ESLint configuration
 */
import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import { resolve } from 'path';

describe('ESLint no-restricted-imports rules', () => {
  // Point ESLint to frontend directory for config resolution
  const eslint = new ESLint({
    cwd: resolve(__dirname, '../..'),
  });

  it('blocks legacy imports in invalid-imports.ts fixture', async () => {
    const filePath = resolve(__dirname, '../fixtures/eslint/invalid-imports.ts');
    const results = await eslint.lintFiles([filePath]);

    // Should have no-restricted-imports errors
    expect(results[0].errorCount).toBeGreaterThan(0);

    const restrictedImportErrors = results[0].messages.filter(
      m => m.ruleId === 'no-restricted-imports'
    );

    expect(restrictedImportErrors.length).toBeGreaterThan(0);

    // Verify specific legacy imports are caught
    const messages = restrictedImportErrors.map(m => m.message);
    expect(messages.some(m => m.includes('provider-detectors'))).toBe(true);
  });

  it('allows new modular extraction imports in valid-imports.ts fixture', async () => {
    const filePath = resolve(__dirname, '../fixtures/eslint/valid-imports.ts');
    const results = await eslint.lintFiles([filePath]);

    // Should have no no-restricted-imports errors
    const restrictedImportErrors = results[0].messages.filter(
      m => m.ruleId === 'no-restricted-imports'
    );

    expect(restrictedImportErrors.length).toBe(0);
  });

  it('validates ESLint config has no-restricted-imports rule', async () => {
    const config = await eslint.calculateConfigForFile('src/test.ts');

    expect(config.rules['no-restricted-imports']).toBeDefined();
    // ESLint uses numeric severity: 2 = 'error', 1 = 'warn', 0 = 'off'
    expect(config.rules['no-restricted-imports'][0]).toBe(2);
  });
});
