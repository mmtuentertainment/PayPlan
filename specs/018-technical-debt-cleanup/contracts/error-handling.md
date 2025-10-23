# Error Handling Contract

**Feature**: 018-technical-debt-cleanup
**Version**: 1.0
**Date**: 2025-10-23

## Overview

This contract defines how errors are handled, sanitized, and logged in the PayPlan application. It implements FR-002 (generic client errors) and FR-001 (dev-only sensitive logging).

---

## Error Response Contract

### Client-Facing Errors (Generic)

ALL errors returned to clients MUST use this exact message (per Clarification Answer 4):

```json
{
  "error": "An error occurred. Please try again."
}
```

**Requirements**:
- ✅ MUST be identical for all error types
- ✅ MUST NOT reveal implementation details
- ✅ MUST NOT include field names, validation errors, or stack traces
- ✅ MUST NOT differentiate between error sources (validation, database, network, etc.)

**Rationale**: Prevents information leakage that could be exploited by attackers (FR-002).

### Server-Side Logging (Detailed)

Server logs MUST include full error context for debugging:

```typescript
interface ServerErrorLog {
  timestamp: number; // Unix timestamp in milliseconds
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string; // Human-readable error description
  error: {
    name: string; // Error class name
    message: string; // Original error message
    stack?: string; // Stack trace
    code?: string; // Error code (if applicable)
  };
  context: {
    requestId: string; // Unique request identifier
    userId?: string; // User ID (if authenticated, optional for privacy)
    endpoint: string; // API endpoint or route
    method: string; // HTTP method (GET, POST, etc.)
    userAgent?: string; // Client user agent
    ip?: string; // Client IP (hashed for privacy)
    additionalData?: Record<string, unknown>; // Error-specific context
  };
}
```

---

## ErrorSanitizer Interface

### Implementation Contract

```typescript
export interface SanitizedError {
  clientMessage: string; // Always "An error occurred. Please try again."
  serverLog: ServerErrorLog;
}

export interface ErrorSanitizer {
  /**
   * Sanitizes an error for client response while preserving server logging.
   *
   * @param error - The original error object
   * @param context - Additional context for server logging
   * @returns Sanitized error with generic client message and detailed server log
   */
  sanitize(error: Error, context?: ErrorContext): SanitizedError;
}

export interface ErrorContext {
  requestId: string;
  userId?: string;
  endpoint: string;
  method: string;
  additionalData?: Record<string, unknown>;
}
```

### Example Usage

```typescript
import { errorSanitizer } from '@/lib/security/ErrorSanitizer';

try {
  // Some operation that might fail
  const result = await processPayment(data);
} catch (error) {
  // Sanitize error
  const sanitized = errorSanitizer.sanitize(error as Error, {
    requestId: req.id,
    userId: req.user?.id,
    endpoint: '/api/payment',
    method: 'POST',
    additionalData: { paymentId: data.id }
  });

  // Log full details server-side
  logger.error(sanitized.serverLog.message, sanitized.serverLog);

  // Return generic message to client
  return res.status(500).json({
    error: sanitized.clientMessage // "An error occurred. Please try again."
  });
}
```

---

## ConsoleGuard Interface

### Implementation Contract

```typescript
export interface ConsoleGuard {
  /**
   * Log error with details (only in development)
   */
  error(message: string, ...details: unknown[]): void;

  /**
   * Log warning with details (only in development)
   */
  warn(message: string, ...details: unknown[]): void;

  /**
   * Log info with details (only in development)
   */
  log(message: string, ...details: unknown[]): void;
}

export type LogLevel = 'error' | 'warn' | 'log' | 'debug';
```

### Environment Detection

Per Research Decision 1, use `import.meta.env.DEV` for environment detection:

```typescript
class ConsoleGuardImpl implements ConsoleGuard {
  error(message: string, ...details: unknown[]): void {
    if (import.meta.env.DEV) {
      console.error(`[DEV] ${message}`, ...details);
    }
    // Production: Silent (no logging)
  }

  warn(message: string, ...details: unknown[]): void {
    if (import.meta.env.DEV) {
      console.warn(`[DEV] ${message}`, ...details);
    }
  }

  log(message: string, ...details: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log(`[DEV] ${message}`, ...details);
    }
  }
}

export const consoleGuard = new ConsoleGuardImpl();
```

### Usage Examples

```typescript
// frontend/src/components/results/ResultsThisWeek.tsx

// ❌ BEFORE (FR-001 violation - logs in production):
console.error('Payment validation failed:', paymentDetails);

// ✅ AFTER (FR-001 compliant - dev-only logging):
import { consoleGuard } from '@/lib/security/ConsoleGuard';
consoleGuard.error('Payment validation failed', paymentDetails);
// Logs in development: "[DEV] Payment validation failed { amount: 100, ... }"
// Silent in production
```

---

## Error Classification

### Error Types

| Error Type | Client Message | Server Log Level | Example |
|------------|----------------|------------------|---------|
| Validation Error | Generic | `warn` | Invalid request body |
| Not Found | Generic | `info` | Resource not found |
| Authorization | Generic | `warn` | Unauthorized access attempt |
| Internal Server | Generic | `error` | Database connection failed |
| External Service | Generic | `error` | Payment gateway timeout |

**Note**: All types use the same generic client message to prevent information leakage.

### Status Codes

Map error types to HTTP status codes:

```typescript
const ERROR_STATUS_CODES = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

function getStatusCode(error: Error): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof UnauthorizedError) return 401;
  // ... etc
  return 500; // Default to internal server error
}
```

---

## Logging Patterns

### Structured Logging

Use structured logging for server-side error details:

```typescript
import { logger } from '@/lib/logging';

logger.error('Payment processing failed', {
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
  },
  context: {
    requestId: req.id,
    userId: req.user?.id,
    endpoint: '/api/payment',
    method: 'POST',
    paymentAmount: data.amount,
    paymentId: data.id,
  },
  timestamp: Date.now(),
});
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Critical failures requiring immediate attention | Database connection lost, payment gateway down |
| `warn` | Recoverable issues or suspicious activity | Validation failure, retry attempts, rate limit approaching |
| `info` | Normal operations, audit trail | User login, payment completed, cache miss |
| `debug` | Detailed debugging information | Request/response payloads, timing measurements |

---

## Error Boundaries (Frontend)

### React Error Boundary Pattern

```typescript
import { Component, ReactNode } from 'react';
import { consoleGuard } from '@/lib/security/ConsoleGuard';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development only
    consoleGuard.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // TODO: Send to error tracking service (e.g., Sentry) in production
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert">
          <h2>An error occurred. Please try again.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Testing Contract

### Error Sanitization Tests

```typescript
import { errorSanitizer } from '@/lib/security/ErrorSanitizer';

describe('ErrorSanitizer', () => {
  test('returns generic client message', () => {
    const error = new Error('Database connection failed');
    const sanitized = errorSanitizer.sanitize(error, {
      requestId: 'req-123',
      endpoint: '/api/payment',
      method: 'POST',
    });

    expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
  });

  test('preserves full error details in server log', () => {
    const error = new Error('Validation failed: amount is required');
    error.stack = 'Error: ...\n  at ...';

    const sanitized = errorSanitizer.sanitize(error, {
      requestId: 'req-456',
      endpoint: '/api/plan',
      method: 'POST',
    });

    expect(sanitized.serverLog.error.message).toBe('Validation failed: amount is required');
    expect(sanitized.serverLog.error.stack).toContain('Error:');
    expect(sanitized.serverLog.context.requestId).toBe('req-456');
  });

  test('does not leak implementation details to client', () => {
    const error = new Error('SELECT * FROM users WHERE id = 123');
    const sanitized = errorSanitizer.sanitize(error, {
      requestId: 'req-789',
      endpoint: '/api/user',
      method: 'GET',
    });

    expect(sanitized.clientMessage).not.toContain('SELECT');
    expect(sanitized.clientMessage).not.toContain('users');
    expect(sanitized.clientMessage).toBe('An error occurred. Please try again.');
  });
});
```

### ConsoleGuard Tests

```typescript
import { consoleGuard } from '@/lib/security/ConsoleGuard';

describe('ConsoleGuard', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('logs in development', () => {
    // Simulate development environment
    import.meta.env.DEV = true;

    consoleGuard.error('Test error', { detail: 'value' });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[DEV] Test error',
      { detail: 'value' }
    );
  });

  test('does not log in production', () => {
    // Simulate production environment
    import.meta.env.DEV = false;
    import.meta.env.PROD = true;

    consoleGuard.error('Test error', { detail: 'value' });

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
```

---

## Security Considerations

### Information Leakage Prevention

Never include in client errors:
- ❌ Database names, table names, column names
- ❌ File paths, directory structures
- ❌ Stack traces
- ❌ Validation field names (e.g., "email is required")
- ❌ Internal service names (e.g., "payment-service-v2 timeout")
- ❌ Version numbers, dependency names
- ❌ User IDs, session tokens

### PII in Error Logs

Remove PII before logging (use PiiSanitizer):

```typescript
const sanitizedContext = piiSanitizer.sanitize(errorContext);
logger.error('Error occurred', sanitizedContext);
```

### Error Timing Attacks

Ensure error responses have consistent timing to prevent timing attacks:

```typescript
// ❌ BAD: Different timing reveals information
if (!user) {
  return res.status(404).json({ error: "..." }); // Fast
}
if (!verifyPassword(user, password)) {
  await delay(100); // Slow - reveals user exists
  return res.status(401).json({ error: "..." });
}

// ✅ GOOD: Consistent timing
const user = await findUser(username);
const isValid = user && await verifyPassword(user, password);
if (!isValid) {
  return res.status(401).json({ error: "..." }); // Same timing
}
```

---

## Migration Checklist

When implementing error handling:

- [ ] Replace all `console.error()` in production code with `consoleGuard.error()`
- [ ] Wrap API endpoints with ErrorSanitizer
- [ ] Ensure all client errors use generic message
- [ ] Add structured logging for server errors
- [ ] Implement React Error Boundaries
- [ ] Test that no implementation details leak to clients
- [ ] Verify dev-only logging works correctly
- [ ] Add monitoring for error rates

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial error handling contract |
