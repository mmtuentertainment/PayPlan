/**
 * StorageEvent helper for testing
 *
 * Workaround for jsdom v27.0.0 limitation: StorageEvent constructor
 * requires `storageArea` to be a proper Storage instance, but mocked
 * Storage objects fail the internal type check.
 *
 * Research sources:
 * - https://github.com/jsdom/jsdom/pull/2076
 * - https://github.com/capricorn86/happy-dom/issues/324
 * - https://github.com/testing-library/dom-testing-library/issues/438
 *
 * Solution: Manually create and dispatch storage events using Object.assign
 * to bypass the StorageEvent constructor validation.
 */

export interface StorageEventInit {
  key?: string | null;
  newValue?: string | null;
  oldValue?: string | null;
  storageArea?: Storage | null;
  url?: string;
}

/**
 * Creates and dispatches a storage event that works with mocked Storage
 *
 * @param eventInit - StorageEvent initialization options
 * @returns The dispatched event
 *
 * @example
 * ```ts
 * const mockStorage = { getItem: vi.fn(), ... };
 * dispatchStorageEvent({
 *   key: 'payplan_preferences_v1',
 *   newValue: JSON.stringify(data),
 *   storageArea: mockStorage as unknown as Storage,
 * });
 * ```
 */
export function dispatchStorageEvent(eventInit: StorageEventInit): StorageEvent {
  // Create a base Event and cast to StorageEvent
  const event = new Event('storage', {
    bubbles: true,
    cancelable: false,
  }) as StorageEvent;

  // Manually assign StorageEvent-specific properties
  // This bypasses the constructor's type validation
  Object.defineProperties(event, {
    key: { value: eventInit.key ?? null, enumerable: true },
    newValue: { value: eventInit.newValue ?? null, enumerable: true },
    oldValue: { value: eventInit.oldValue ?? null, enumerable: true },
    storageArea: { value: eventInit.storageArea ?? null, enumerable: true },
    url: { value: eventInit.url ?? window.location.href, enumerable: true },
  });

  // Dispatch on window
  window.dispatchEvent(event);

  return event;
}

/**
 * Alternative: Use custom event as fallback for environments without StorageEvent
 *
 * @param eventInit - StorageEvent initialization options
 */
export function dispatchStorageEventLegacy(eventInit: StorageEventInit): CustomEvent {
  const event = new CustomEvent('storage', {
    bubbles: true,
    cancelable: false,
    detail: {
      key: eventInit.key ?? null,
      newValue: eventInit.newValue ?? null,
      oldValue: eventInit.oldValue ?? null,
      storageArea: eventInit.storageArea ?? null,
      url: eventInit.url ?? window.location.href,
    },
  });

  window.dispatchEvent(event);

  return event;
}
