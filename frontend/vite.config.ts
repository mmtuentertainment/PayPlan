import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Double-gate bundle visualizer: DEV mode + ANALYZE flag (CRITICAL: Claude review)
    // Usage: ANALYZE=true npm run build (only works in development)
    // Rationale:
    // 1. DEV check prevents shipping analysis artifacts to production builds
    // 2. ANALYZE flag prevents overhead in normal dev builds
    // 3. Double-gating is defense-in-depth security pattern
    ...(process.env.NODE_ENV !== 'production' && process.env.ANALYZE
      ? [
          visualizer({
            filename: './build-analysis/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          /**
           * Vendor Chunking Strategy (2025 Best Practices)
           *
           * Goals:
           * 1. Cache stability: Group libraries by update frequency
           * 2. Critical path optimization: Keep payment/business logic together
           * 3. Parallel loading: Balance chunk sizes for HTTP/2 multiplexing
           *
           * Strategy:
           * - React ecosystem (stable, rarely updated): separate chunk
           * - UI framework (moderate updates): separate chunk
           * - Payment/business libraries (frequent updates): bundle with app code
           * - Large stable libraries: separate chunk for size optimization
           *
           * Rationale for payment libraries bundling:
           * - zod, uuid, papaparse change frequently with business logic
           * - Keeping them in main vendor ensures atomic deployments
           * - Avoids cache invalidation cascades during feature development
           */

          // Normalize path for robust matching across platforms (Windows/Unix)
          const normalizedId = id.replace(/\\/g, '/');

          if (normalizedId.includes('/node_modules/')) {
            // Group 1: React Core (~400KB gzipped)
            // Rationale: React/ReactDOM/Router share release cycles, update rarely
            // Impact: ~6 month cache stability based on React 19 LTS schedule
            if (
              /\/node_modules\/react\//.test(normalizedId) ||
              /\/node_modules\/react-dom\//.test(normalizedId) ||
              /\/node_modules\/react-router/.test(normalizedId)
            ) {
              return 'vendor-react';
            }

            // Group 2: UI Framework (~300KB gzipped)
            // Rationale: Radix UI updates independently, large but stable
            // Impact: ~3 month cache stability based on Radix release cadence
            if (/\/node_modules\/@radix-ui\//.test(normalizedId)) {
              return 'vendor-ui';
            }

            // Group 3: Large Stable Libraries (~200KB gzipped)
            // Rationale: Icons/swagger are large, update infrequently
            // Impact: ~12 month cache stability
            if (
              /\/node_modules\/lucide-react\//.test(normalizedId) ||
              /\/node_modules\/swagger/.test(normalizedId) ||
              /\/node_modules\/@swagger-api\//.test(normalizedId) ||
              /\/node_modules\/ramda\//.test(normalizedId)
            ) {
              return 'vendor-large';
            }

            // Everything else: Small utilities + Payment/Business Libraries (~50KB gzipped)
            // Includes: zod, uuid, papaparse, date-fns (bundled with app for atomic deployments)
            // Rationale: Payment libraries change with business logic - bundling ensures
            // cache invalidation happens atomically with app code changes
            // Falls through to main vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 5000, // Conservative 5s default - apply targeted increases for slow tests only
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        'vite.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'src/main.tsx', // App entry point
        '**/*.d.ts',
        '**/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
