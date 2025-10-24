/**
 * Jest configuration for PayPlan backend tests
 *
 * Excludes frontend/ directory since it uses vitest as its test runner.
 * Frontend tests are executed separately via: npm run test:frontend
 */
module.exports = {
  // TypeScript support via ts-jest
  preset: 'ts-jest',

  // Exclude frontend directory from Jest test discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/.vercel/'
  ],

  // Only look for test files in root and explicit backend directories
  testMatch: [
    '**/tests/**/*.test.[jt]s',
    '**/*.test.[jt]s',
    '**/__tests__/**/*.[jt]s'
  ],

  // Test environment for backend (Node.js)
  testEnvironment: 'node',

  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Coverage paths should also exclude frontend
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/.vercel/'
  ],

  // Coverage thresholds to ensure minimum test coverage for critical financial logic
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Exclude build artifacts from module map
  modulePathIgnorePatterns: [
    '/.vercel/',
    '/frontend/dist/',
    '/frontend/.vercel/'
  ]
};
