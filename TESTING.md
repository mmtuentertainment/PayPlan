# Testing Guide

## Running Tests

### Frontend Tests (Vitest)
```bash
# From frontend directory (RECOMMENDED)
cd frontend
npm test                    # Run all tests once
npm run test:watch         # Watch mode - reruns on file changes
npm run test:ui            # Interactive UI mode

# From project root
npm run test:frontend      # Run frontend tests
```

### Backend Tests (Jest)
```bash
# From project root
npm test                   # Run backend API tests
```

### All Tests
```bash
# From project root
npm run test:all          # Run both backend and frontend tests
```

## Test Structure

### Frontend Tests (`frontend/tests/`)
- **Unit tests**: `tests/unit/*.test.ts(x)` - Component and utility function tests
- **Integration tests**: `tests/integration/*.test.ts` - Multi-component workflows
- **Performance tests**: `tests/performance/*.test.ts` - Benchmarks and performance validation

### Backend Tests (`tests/`)
- **Unit tests**: `tests/unit/*.test.js` - Business logic and utilities
- **Integration tests**: `tests/integration/*.test.js` - API endpoint tests

## Current Test Count
- **Frontend**: 481 tests (35 test files)
- **Backend**: ~42 tests (Jest)

## Configuration
- **Frontend**: `frontend/vite.config.ts` (Vitest + jsdom)
- **Backend**: Jest (default configuration)

## Important Notes
1. **Always run frontend tests from the `frontend` directory or use `npm run test:frontend`**
2. The `@` alias in frontend tests resolves to `frontend/src/`
3. Frontend uses Vitest with React Testing Library
4. Backend uses Jest with Supertest for API testing
