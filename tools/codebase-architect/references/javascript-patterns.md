# JavaScript/TypeScript Patterns Guide

## Modern JavaScript Project Structure

### React Application Structure

```
src/
├── features/              # Feature-based modules
│   ├── auth/
│   │   ├── components/   # Feature-specific components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API calls and external services
│   │   ├── stores/       # State management (Redux/Zustand)
│   │   ├── types/        # TypeScript types/interfaces
│   │   ├── utils/        # Feature-specific utilities
│   │   └── index.ts      # Public API/barrel export
│   └── dashboard/
│       └── ...
├── shared/               # Shared across features
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Shared custom hooks
│   ├── utils/          # Common utilities
│   └── types/          # Shared types
├── core/                # Core application setup
│   ├── api/            # API client configuration
│   ├── config/         # App configuration
│   ├── router/         # Routing setup
│   └── store/          # Global state setup
└── styles/             # Global styles

```

### Node.js Backend Structure

```
src/
├── modules/            # Business modules
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.dto.ts
│   │   └── auth.module.ts
│   └── users/
├── common/            # Shared functionality
│   ├── database/      # Database configuration
│   ├── middleware/    # Express middleware
│   ├── guards/        # Authorization guards
│   ├── decorators/    # Custom decorators
│   └── exceptions/    # Error handling
├── config/           # Configuration files
└── main.ts          # Application entry point
```

## Import Organization Best Practices

### Import Order Convention

```typescript
// 1. Node.js built-ins
import fs from 'fs';
import path from 'path';

// 2. External packages
import express from 'express';
import { Controller, Get } from '@nestjs/common';

// 3. Internal modules (absolute imports)
import { UserService } from '@/modules/user/user.service';
import { AuthGuard } from '@/common/guards';

// 4. Relative imports (parent directories)
import { SharedComponent } from '../shared';

// 5. Relative imports (same directory)
import { localHelper } from './helper';

// 6. Style imports
import styles from './Component.module.css';

// 7. Type imports (TypeScript)
import type { User } from '@/types';
```

## Module Patterns

### Barrel Exports Pattern

```typescript
// features/auth/index.ts
export { LoginForm } from './components/LoginForm';
export { useAuth } from './hooks/useAuth';
export { authService } from './services/authService';
export type { AuthState, User } from './types';
```

### Service Layer Pattern

```typescript
// services/userService.ts
class UserService {
  private repository: UserRepository;
  
  constructor(repository: UserRepository) {
    this.repository = repository;
  }
  
  async getUser(id: string): Promise<User> {
    return this.repository.findById(id);
  }
  
  async createUser(data: CreateUserDto): Promise<User> {
    // Business logic here
    return this.repository.create(data);
  }
}

// Singleton export
export const userService = new UserService(new UserRepository());
```

### Custom Hook Pattern

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}
```

## TypeScript Specific Patterns

### Interface Segregation

```typescript
// types/user.ts
// Separate interfaces for different concerns
interface UserBase {
  id: string;
  email: string;
  name: string;
}

interface UserWithAuth extends UserBase {
  password: string;
  lastLogin: Date;
}

interface UserProfile extends UserBase {
  avatar?: string;
  bio?: string;
}

// Use type for unions and intersections
type User = UserWithAuth & UserProfile;
```

### Generic Repository Pattern

```typescript
// repositories/base.repository.ts
abstract class BaseRepository<T extends { id: string }> {
  protected abstract collection: string;
  
  async findById(id: string): Promise<T | null> {
    // Implementation
  }
  
  async findAll(): Promise<T[]> {
    // Implementation
  }
  
  async create(data: Omit<T, 'id'>): Promise<T> {
    // Implementation
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    // Implementation
  }
  
  async delete(id: string): Promise<void> {
    // Implementation
  }
}
```

## Testing Structure

### Test File Organization

```
src/
├── features/
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   └── LoginForm.test.tsx
│       └── services/
│           ├── authService.ts
│           └── authService.test.ts
└── __tests__/           # Integration tests
    ├── api/
    └── e2e/
```

### Test Naming Convention

```typescript
// ComponentName.test.tsx
describe('LoginForm', () => {
  describe('when user is not authenticated', () => {
    it('should display login fields', () => {
      // Test implementation
    });
    
    it('should validate email format', () => {
      // Test implementation
    });
  });
  
  describe('when user submits valid credentials', () => {
    it('should call authentication service', () => {
      // Test implementation
    });
  });
});
```

## Common Anti-Patterns to Avoid

### ❌ Circular Dependencies

```typescript
// Bad: Circular dependency
// userService.ts
import { authService } from './authService';

// authService.ts  
import { userService } from './userService';
```

### ✅ Solution: Dependency Injection

```typescript
// Good: Dependency injection
class UserService {
  constructor(private authService: AuthService) {}
}

class AuthService {
  constructor(private userService: UserService) {}
}

// Wire up with DI container
```

### ❌ Deep Nesting

```
// Bad: Too deep
src/features/user/profile/settings/privacy/components/forms/...
```

### ✅ Solution: Flatten Structure

```
// Good: Flatter structure
src/features/user-settings/components/PrivacyForm.tsx
```

### ❌ Mixed Concerns

```typescript
// Bad: Component with business logic
function UserProfile() {
  const calculateAge = (birthDate: Date) => {
    // Complex calculation
  };
  
  const validateEmail = (email: string) => {
    // Validation logic
  };
  
  return <div>...</div>;
}
```

### ✅ Solution: Separate Concerns

```typescript
// Good: Separated concerns
// utils/userUtils.ts
export const calculateAge = (birthDate: Date) => { /* ... */ };

// validators/emailValidator.ts
export const validateEmail = (email: string) => { /* ... */ };

// components/UserProfile.tsx
import { calculateAge } from '@/utils/userUtils';
import { validateEmail } from '@/validators/emailValidator';

function UserProfile() {
  return <div>...</div>;
}
```

## Configuration Best Practices

### Environment-based Configuration

```typescript
// config/index.ts
interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableAnalytics: boolean;
  };
}

const config: Config = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    timeout: Number(process.env.REACT_APP_API_TIMEOUT) || 5000,
  },
  features: {
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  },
};

export default config;
```

### Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@components/*": ["components/*"],
      "@features/*": ["features/*"],
      "@shared/*": ["shared/*"],
      "@utils/*": ["utils/*"],
      "@types/*": ["types/*"]
    }
  }
}
```

## Build and Bundle Optimization

### Code Splitting by Route

```typescript
// router/index.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/features/dashboard'));
const Profile = lazy(() => import('@/features/profile'));

function Router() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

### Bundle Analysis Commands

```json
{
  "scripts": {
    "analyze": "source-map-explorer 'build/static/js/*.js'",
    "bundle-report": "webpack-bundle-analyzer build/stats.json"
  }
}
```
