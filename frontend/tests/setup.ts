// Global test setup
// Feature #063: Business Logic Test Coverage
// Configures localStorage mocking and test environment

import { beforeEach, afterEach, vi } from 'vitest';
import { createMockStorage } from './fixtures/mock-storage';

// Create and apply localStorage mock before each test
beforeEach(() => {
  const mockStorage = createMockStorage();

  // Spy on Storage.prototype (works with jsdom)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(mockStorage.getItem);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(mockStorage.setItem);
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(mockStorage.removeItem);
  vi.spyOn(Storage.prototype, 'clear').mockImplementation(mockStorage.clear);
  vi.spyOn(Storage.prototype, 'key').mockImplementation(mockStorage.key);

  // Mock length property
  Object.defineProperty(Storage.prototype, 'length', {
    get: () => mockStorage.length,
    configurable: true,
  });

  // Clear storage before each test for isolation
  localStorage.clear();
});

// Restore all mocks after each test for complete isolation
afterEach(() => {
  vi.restoreAllMocks();
});
