/**
 * Jest configuration for PayPlan backend tests
 *
 * Excludes frontend/ directory since it uses vitest as its test runner.
 * Frontend tests are executed separately via: npm run test:frontend
 */
module.exports = {
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

  // Coverage paths should also exclude frontend
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/.vercel/'
  ],

  // Exclude build artifacts from module map
  modulePathIgnorePatterns: [
    '/.vercel/',
    '/frontend/dist/',
    '/frontend/.vercel/'
  ]
};
