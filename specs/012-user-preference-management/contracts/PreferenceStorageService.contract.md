# Contract: PreferenceStorageService

**Feature**: 012-user-preference-management
**Created**: 2025-10-13
**Purpose**: Define the contract for localStorage operations with error handling and quota management

---

## Overview

The PreferenceStorageService provides a robust abstraction over browser localStorage for saving, loading, and managing user preferences. It implements error handling for quota exceeded and security errors, validates storage size limits, and provides cross-tab synchronization support.

---

## API Contract

### 1. savePreference

**Purpose**: Save a single preference to localStorage with validation and error handling.

**Signature**:

```typescript
function savePreference(
  category: PreferenceCategory,
  value: unknown,
  optInStatus: boolean
): Promise<Result<void, StorageError>>
```

**Parameters**:
- `category`: Which preference category to save
- `value`: The preference value (type validated by category)
- `optInStatus`: Whether user has consented to persist this preference

**Returns**: `Promise<Result<void, StorageError>>`
- Success: `{ ok: true, value: undefined }`
- Error: `{ ok: false, error: StorageError }`

**Behavior**:
1. If `optInStatus === false`, return success without persisting (in-memory only)
2. Load existing `PreferenceCollection` from localStorage
3. Create/update `UserPreference` for the category with current timestamp
4. Recalculate `totalSize` of updated collection
5. If `totalSize > 5120` bytes, return `QuotaExceededError`
6. Serialize collection to JSON and save to `localStorage.setItem('payplan_preferences_v1', json)`
7. Update `lastModified` timestamp
8. Return success

**Error Conditions**:
- `QuotaExceededError`: Total size exceeds 5KB limit (FR-014)
- `SecurityError`: localStorage access denied (cookies blocked, private browsing)
- `SerializationError`: JSON.stringify fails (circular references, invalid data)

**Performance**: <50ms for save operation (synchronous localStorage.setItem)

**Contract Tests**:

```typescript
describe('savePreference', () => {
  it('should save preference and update timestamp', async () => {
    const result = await service.savePreference(
      'timezone',
      'America/New_York',
      true
    );
    expect(result.ok).toBe(true);

    const stored = localStorage.getItem('payplan_preferences_v1');
    const parsed = JSON.parse(stored!);
    expect(parsed.preferences.timezone.value).toBe('America/New_York');
    expect(parsed.preferences.timezone.timestamp).toBeDefined();
  });

  it('should not persist when optInStatus is false', async () => {
    const result = await service.savePreference(
      'timezone',
      'America/New_York',
      false
    );
    expect(result.ok).toBe(true);

    const stored = localStorage.getItem('payplan_preferences_v1');
    expect(stored).toBeNull();
  });

  it('should reject preferences exceeding 5KB limit', async () => {
    const largeValue = 'x'.repeat(5 * 1024);
    const result = await service.savePreference(
      'timezone',
      largeValue,
      true
    );
    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('QuotaExceeded');
    expect(result.error.message).toContain('5KB');
  });

  it('should handle localStorage SecurityError', async () => {
    // Mock localStorage to throw SecurityError
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const error = new Error('SecurityError');
      error.name = 'SecurityError';
      throw error;
    });

    const result = await service.savePreference(
      'timezone',
      'America/New_York',
      true
    );
    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('Security');
  });

  it('should update existing preference without duplicating', async () => {
    await service.savePreference('timezone', 'America/New_York', true);
    await service.savePreference('timezone', 'America/Los_Angeles', true);

    const stored = JSON.parse(localStorage.getItem('payplan_preferences_v1')!);
    expect(Object.keys(stored.preferences).length).toBe(1);
    expect(stored.preferences.timezone.value).toBe('America/Los_Angeles');
  });
});
```

---

### 2. loadPreferences

**Purpose**: Load all saved preferences from localStorage with validation and error recovery.

**Signature**:

```typescript
function loadPreferences(): Promise<Result<PreferenceCollection | null, StorageError>>
```

**Parameters**: None

**Returns**: `Promise<Result<PreferenceCollection | null, StorageError>>`
- Success with data: `{ ok: true, value: PreferenceCollection }`
- Success with no data: `{ ok: true, value: null }`
- Error: `{ ok: false, error: StorageError }`

**Behavior**:
1. Read from `localStorage.getItem('payplan_preferences_v1')`
2. If `null`, return success with `null` value (first-time user)
3. Parse JSON string to object
4. Validate schema version (must be "1.0.0")
5. Deserialize `preferences` object to Map
6. Validate each preference using Zod schemas
7. If validation fails for any preference, remove invalid preference and continue
8. Recalculate `totalSize` to verify integrity
9. Return validated `PreferenceCollection`

**Error Conditions**:
- `DeserializationError`: JSON.parse fails (corrupted data)
- `ValidationError`: Preferences fail Zod schema validation (partially recoverable)
- `SecurityError`: localStorage access denied

**Performance**: <10ms for load operation (synchronous localStorage.getItem + validation)

**Contract Tests**:

```typescript
describe('loadPreferences', () => {
  it('should return null when no preferences are saved', async () => {
    localStorage.clear();
    const result = await service.loadPreferences();
    expect(result.ok).toBe(true);
    expect(result.value).toBeNull();
  });

  it('should load and deserialize saved preferences', async () => {
    const mockCollection = {
      version: '1.0.0',
      preferences: {
        timezone: {
          category: 'timezone',
          value: 'America/New_York',
          optInStatus: true,
          timestamp: '2025-10-13T14:00:00.000Z'
        }
      },
      totalSize: 120,
      lastModified: '2025-10-13T14:00:00.000Z'
    };
    localStorage.setItem('payplan_preferences_v1', JSON.stringify(mockCollection));

    const result = await service.loadPreferences();
    expect(result.ok).toBe(true);
    expect(result.value).toBeDefined();
    expect(result.value!.preferences.get('timezone')!.value).toBe('America/New_York');
  });

  it('should handle corrupted JSON data gracefully', async () => {
    localStorage.setItem('payplan_preferences_v1', 'invalid{json}');

    const result = await service.loadPreferences();
    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('Deserialization');
  });

  it('should remove invalid preferences and continue', async () => {
    const mockCollection = {
      version: '1.0.0',
      preferences: {
        timezone: {
          category: 'timezone',
          value: 'InvalidTimezone', // Invalid IANA timezone
          optInStatus: true,
          timestamp: '2025-10-13T14:00:00.000Z'
        },
        locale: {
          category: 'locale',
          value: 'en-US', // Valid
          optInStatus: true,
          timestamp: '2025-10-13T14:00:00.000Z'
        }
      },
      totalSize: 200,
      lastModified: '2025-10-13T14:00:00.000Z'
    };
    localStorage.setItem('payplan_preferences_v1', JSON.stringify(mockCollection));

    const result = await service.loadPreferences();
    expect(result.ok).toBe(true);
    expect(result.value!.preferences.has('timezone')).toBe(false); // Invalid removed
    expect(result.value!.preferences.has('locale')).toBe(true);    // Valid retained
  });
});
```

---

### 3. resetAllPreferences

**Purpose**: Clear all saved preferences and revert to application defaults.

**Signature**:

```typescript
function resetAllPreferences(): Promise<Result<void, StorageError>>
```

**Parameters**: None

**Returns**: `Promise<Result<void, StorageError>>`
- Success: `{ ok: true, value: undefined }`
- Error: `{ ok: false, error: StorageError }`

**Behavior**:
1. Call `localStorage.removeItem('payplan_preferences_v1')`
2. Clear in-memory cache (if any)
3. Emit storage event for cross-tab synchronization
4. Return success

**Error Conditions**:
- `SecurityError`: localStorage access denied

**Performance**: <5ms (synchronous localStorage.removeItem)

**Contract Tests**:

```typescript
describe('resetAllPreferences', () => {
  it('should remove all preferences from localStorage', async () => {
    localStorage.setItem('payplan_preferences_v1', '{"version":"1.0.0"}');

    const result = await service.resetAllPreferences();
    expect(result.ok).toBe(true);
    expect(localStorage.getItem('payplan_preferences_v1')).toBeNull();
  });

  it('should succeed even when no preferences exist', async () => {
    localStorage.clear();

    const result = await service.resetAllPreferences();
    expect(result.ok).toBe(true);
  });

  it('should handle SecurityError gracefully', async () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      const error = new Error('SecurityError');
      error.name = 'SecurityError';
      throw error;
    });

    const result = await service.resetAllPreferences();
    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('Security');
  });
});
```

---

### 4. getStorageSize

**Purpose**: Calculate current total storage size in bytes.

**Signature**:

```typescript
function getStorageSize(): number
```

**Parameters**: None

**Returns**: `number` - Storage size in bytes, or 0 if no preferences saved

**Behavior**:
1. Read from `localStorage.getItem('payplan_preferences_v1')`
2. If `null`, return 0
3. Calculate size: `new Blob([jsonString]).size`
4. Return size in bytes

**Performance**: <5ms (synchronous read + size calculation)

**Contract Tests**:

```typescript
describe('getStorageSize', () => {
  it('should return 0 when no preferences are saved', () => {
    localStorage.clear();
    expect(service.getStorageSize()).toBe(0);
  });

  it('should calculate accurate byte size', () => {
    const mockData = '{"version":"1.0.0","preferences":{}}';
    localStorage.setItem('payplan_preferences_v1', mockData);

    const size = service.getStorageSize();
    expect(size).toBe(new Blob([mockData]).size);
  });

  it('should reflect size increases with more preferences', () => {
    localStorage.setItem('payplan_preferences_v1', '{"a":1}');
    const size1 = service.getStorageSize();

    localStorage.setItem('payplan_preferences_v1', '{"a":1,"b":2,"c":3}');
    const size2 = service.getStorageSize();

    expect(size2).toBeGreaterThan(size1);
  });
});
```

---

### 5. subscribeToChanges

**Purpose**: Subscribe to storage changes for cross-tab synchronization.

**Signature**:

```typescript
function subscribeToChanges(
  callback: (collection: PreferenceCollection | null) => void
): () => void
```

**Parameters**:
- `callback`: Function called when preferences change in another tab

**Returns**: Unsubscribe function

**Behavior**:
1. Add `storage` event listener on `window`
2. Filter events for key `'payplan_preferences_v1'`
3. Parse new value and call callback with updated collection
4. Return function to remove event listener

**Performance**: Event-driven (no polling overhead)

**Contract Tests**:

```typescript
describe('subscribeToChanges', () => {
  it('should call callback when storage changes', (done) => {
    const unsubscribe = service.subscribeToChanges((collection) => {
      expect(collection).toBeDefined();
      expect(collection!.preferences.has('timezone')).toBe(true);
      unsubscribe();
      done();
    });

    // Simulate storage event from another tab
    const event = new StorageEvent('storage', {
      key: 'payplan_preferences_v1',
      newValue: JSON.stringify({
        version: '1.0.0',
        preferences: { timezone: { category: 'timezone', value: 'UTC', optInStatus: true, timestamp: '2025-10-13T14:00:00.000Z' } },
        totalSize: 100,
        lastModified: '2025-10-13T14:00:00.000Z'
      })
    });
    window.dispatchEvent(event);
  });

  it('should not call callback for other localStorage keys', (done) => {
    let called = false;
    const unsubscribe = service.subscribeToChanges(() => {
      called = true;
    });

    const event = new StorageEvent('storage', {
      key: 'other_key',
      newValue: 'some_value'
    });
    window.dispatchEvent(event);

    setTimeout(() => {
      expect(called).toBe(false);
      unsubscribe();
      done();
    }, 100);
  });

  it('should stop receiving events after unsubscribe', (done) => {
    let callCount = 0;
    const unsubscribe = service.subscribeToChanges(() => {
      callCount++;
    });

    const event1 = new StorageEvent('storage', {
      key: 'payplan_preferences_v1',
      newValue: '{"version":"1.0.0","preferences":{},"totalSize":0,"lastModified":"2025-10-13T14:00:00.000Z"}'
    });
    window.dispatchEvent(event1);

    unsubscribe();

    const event2 = new StorageEvent('storage', {
      key: 'payplan_preferences_v1',
      newValue: '{"version":"1.0.0","preferences":{},"totalSize":0,"lastModified":"2025-10-13T14:05:00.000Z"}'
    });
    window.dispatchEvent(event2);

    setTimeout(() => {
      expect(callCount).toBe(1); // Only first event before unsubscribe
      done();
    }, 100);
  });
});
```

---

## Error Types

```typescript
type StorageErrorType =
  | 'QuotaExceeded'
  | 'Security'
  | 'Serialization'
  | 'Deserialization'
  | 'Validation';

interface StorageError {
  type: StorageErrorType;
  message: string;
  originalError?: Error;
}
```

---

## Implementation File

**Path**: `frontend/src/lib/preferences/storage.ts`

**Dependencies**:
- Browser localStorage API
- Zod validation schemas from `validation.ts`
- Types from `types.ts`

**Testing Strategy**: Contract tests MUST be written FIRST and MUST FAIL before implementation (TDD)

---

## Summary

**Total Methods**: 5
**Error Handling**: Comprehensive (quota, security, validation, serialization)
**Performance**: All operations <50ms (meets <100ms NFR-001)
**Cross-tab Sync**: Supported via storage events
**Storage Limit**: 5KB enforced (FR-014)

**Next Contract**: PreferenceValidationService.contract.md
