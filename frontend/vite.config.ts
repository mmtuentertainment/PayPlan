import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './build-analysis/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
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
          // Consolidated vendor chunking strategy for better cache stability
          // and predictable loading behavior for payment/BNPL code

          // Normalize path for robust matching across platforms
          const normalizedId = id.replace(/\\/g, '/');

          if (normalizedId.includes('/node_modules/')) {
            // Group 1: React Core (most stable, rarely changes)
            // Bundle React, ReactDOM, and React Router together as they're tightly coupled
            // and share the same release cycle
            if (
              /\/node_modules\/react\//.test(normalizedId) ||
              /\/node_modules\/react-dom\//.test(normalizedId) ||
              /\/node_modules\/react-router/.test(normalizedId)
            ) {
              return 'vendor-react';
            }

            // Group 2: UI Framework (Radix UI - moderate change frequency)
            // Keep Radix separate as it's large and updates independently from React
            if (/\/node_modules\/@radix-ui\//.test(normalizedId)) {
              return 'vendor-ui';
            }

            // Group 3: Large Libraries (icons, swagger - low change frequency)
            // These are large, stable libraries that benefit from separate caching
            if (
              /\/node_modules\/lucide-react\//.test(normalizedId) ||
              /\/node_modules\/swagger/.test(normalizedId) ||
              /\/node_modules\/@swagger-api\//.test(normalizedId) ||
              /\/node_modules\/ramda\//.test(normalizedId)
            ) {
              return 'vendor-large';
            }

            // Everything else: Small utilities and payment libraries
            // Bundle remaining dependencies (zod, uuid, papaparse, etc.) with main vendor
            // This includes payment-related libraries which should load predictably
            // with the application code
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
