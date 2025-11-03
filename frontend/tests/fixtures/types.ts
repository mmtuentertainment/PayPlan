// Test fixture type definitions
// Feature #063: Business Logic Test Coverage

export interface TestFixture<T> {
  id: string;
  type: 'budget' | 'category' | 'transaction' | 'archive';
  isValid: boolean;
  scenario: string;
  data: T;
}

// Factory function type for creating test data
export type FixtureFactory<T> = (overrides?: Partial<T>) => T;

// Builder interface for complex test objects
export interface FixtureBuilder<T> {
  build(): T;
}
