import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'frontend/src/lib/provider-detectors', message: '❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (see ops/deltas/0013_realignment.md)' },
          { name: 'frontend/src/lib/date-parser', message: '❌ Legacy path. Use: frontend/src/lib/extraction/extractors/date (see ops/deltas/0013_realignment.md)' },
          { name: 'frontend/src/lib/redact', message: '❌ Legacy path. Use: frontend/src/lib/extraction/helpers/redaction (see ops/deltas/0013_realignment.md)' }
        ],
        patterns: [
          { group: ['**/provider-detectors*'], message: '❌ Legacy module. Use: frontend/src/lib/extraction/providers/detector (Delta 0013)' },
          { group: ['**/date-parser*'], message: '❌ Legacy module. Use: frontend/src/lib/extraction/extractors/date (Delta 0013)' },
          { group: ['**/lib/redact*'], message: '❌ Legacy module. Use: frontend/src/lib/extraction/helpers/redaction (Delta 0013)' }
        ]
      }]
    },
  },
])
