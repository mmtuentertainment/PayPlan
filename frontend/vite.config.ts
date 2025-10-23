import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

/**
 * Vendor chunk configuration
 * Explicitly lists packages per chunk for deterministic, auditable bundling
 */
const VENDOR_CHUNKS = {
  'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom'],
  'vendor-ui': ['@radix-ui'],
  'vendor-icons': ['lucide-react'],
  'vendor-swagger': ['swagger', 'ramda', '@swagger-api'],
  'vendor-utils': ['zod', 'luxon', 'papaparse', 'uuid', 'clsx', 'ics'],
  // Add payment/financial libs here when implemented
  // 'vendor-payment': ['stripe', '@stripe/stripe-js', etc.]
} as const;

/**
 * Extract package name from module ID
 * Handles both regular and scoped packages (@scope/name)
 *
 * @param id - Module ID from Rollup
 * @returns Package name or null if not a node_module
 */
function extractPackageName(id: string): string | null {
  if (!id.includes('node_modules')) {
    return null;
  }

  const parts = id.split('node_modules/').pop()?.split('/');
  if (!parts || parts.length === 0) {
    return null;
  }

  // Handle scoped packages (@scope/package)
  if (parts[0].startsWith('@')) {
    return parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0];
  }

  return parts[0];
}

/**
 * Determine chunk name for a given module ID
 *
 * @param id - Module ID from Rollup
 * @returns Chunk name or undefined (let Vite decide)
 */
function getChunkName(id: string): string | undefined {
  const packageName = extractPackageName(id);
  if (!packageName) {
    return undefined;
  }

  // Check explicit chunk mappings
  for (const [chunkName, packages] of Object.entries(VENDOR_CHUNKS)) {
    if (packages.some(pkg => packageName === pkg || packageName.startsWith(`${pkg}/`))) {
      return chunkName;
    }
  }

  // All other node_modules go to generic vendor chunk
  return 'vendor';
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
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
        manualChunks: getChunkName,
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
