// MockStorage implementation for testing localStorage
// Feature #063: Business Logic Test Coverage
// Research Decision 2: Use vi.spyOn(Storage.prototype) pattern

import { vi } from 'vitest';

export interface MockStorageConfig {
  /**
   * Maximum storage quota in bytes
   * @default 5242880 (5MB)
   */
  quota?: number;

  /**
   * Initial data to populate storage
   * @default {}
   */
  initialData?: Record<string, string>;
}

export interface MockStorage {
  store: Record<string, string>;
  quota: number;
  usedBytes: number;

  // localStorage API
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  readonly length: number;
  key(index: number): string | null;
}

/**
 * Create a mock storage instance
 * Simulates localStorage with quota tracking and QuotaExceededError
 */
export function createMockStorage(config?: MockStorageConfig): MockStorage {
  const quota = config?.quota ?? 5 * 1024 * 1024; // 5MB default
  let store: Record<string, string> = { ...(config?.initialData ?? {}) };
  // Include both key and value length for accurate quota tracking
  let usedBytes = Object.entries(store).reduce((sum, [key, val]) => sum + key.length + val.length, 0);

  return {
    store,
    quota,
    usedBytes,

    getItem: vi.fn((key: string) => store[key] ?? null),

    setItem: vi.fn((key: string, value: string) => {
      // Calculate current size including key length
      const currentSize = store[key] ? (key.length + store[key].length) : 0;
      const newSize = usedBytes - currentSize + key.length + value.length;

      if (newSize > quota) {
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
      }

      store[key] = value;
      usedBytes = newSize;
    }),

    removeItem: vi.fn((key: string) => {
      if (store[key]) {
        usedBytes -= key.length + store[key].length;
        delete store[key];
      }
    }),

    clear: vi.fn(() => {
      store = {};
      usedBytes = 0;
    }),

    get length() {
      return Object.keys(store).length;
    },

    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),
  };
}
