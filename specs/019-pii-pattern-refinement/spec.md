# Feature Specification: PII Sanitization Pattern Refinement

**Feature Branch**: `019-pii-pattern-refinement`
**Created**: 2025-10-24
**Status**: Draft
**Input**: User description: "Build a PII Sanitization Pattern Refinement feature for PayPlan that fixes false positive and false negative detection in the current PiiSanitizer implementation (Feature 018). The current substring-based pattern matching causes over-sanitization (removing legitimate fields like 'filename', 'accountId') and under-sanitization (missing critical secrets like 'password', 'token', 'apiKey'). This security issue was identified in Feature 018 Phase 4 CodeRabbit review and deferred due to complexity (Linear: MMT-48)."

## Clarifications

### Session 2025-10-24

- Q: When a field name contains BOTH a legitimate technical term AND an authentication secret (e.g., `apiKeyFilename`, `tokenId`, `secretManagerConfig`), should the authentication secret pattern take precedence? → A: Authentication secrets take precedence - any field containing auth pattern (password, token, apiKey, secret, auth, credential) at word boundary is sanitized regardless of other terms

- Q: The spec mentions authentication patterns and 24 existing PII patterns. When checking field names, does the order matter for performance or correctness? → A: Check authentication secrets first, then other PII patterns (prioritize security-critical patterns for early detection). Current implementation includes 13 authentication patterns: password, passwd, token, bearer, apikey, api_key, accesskey, access_key, secret, auth, credential, credentials, authorization

## User Scenarios & Testing

### User Story 1 - Developer Debugging with Legitimate Fields Preserved (Priority: P1)

A developer reviews error logs to diagnose a production issue. The logging system includes fields like `filename`, `accountId`, and `dashboardUrl` that are essential for troubleshooting. Currently, the PII sanitizer incorrectly removes these fields because they contain substrings like 'name', 'account', and 'card', making debugging impossible. After the refinement, these legitimate fields remain visible while actual PII fields like `customerName` and `bankAccount` are properly sanitized.

**Why this priority**: This is the highest priority because it directly addresses the false positive problem that breaks production debugging. If developers can't debug effectively, they may disable sanitization entirely, creating a critical security risk.

**Independent Test**: Can be fully tested by logging error objects containing legitimate technical fields (`filename`, `accountId`, `dashboardUrl`) and verifying they remain unsanitized, while confirming actual PII fields (`name`, `account`, `card`) are still removed. Delivers immediate debugging value.

**Acceptance Scenarios**:

1. **Given** an error object with field `filename: "report.csv"`, **When** sanitization is applied, **Then** the `filename` field is preserved and not removed
2. **Given** an error object with field `accountId: "ACC_12345"`, **When** sanitization is applied, **Then** the `accountId` field is preserved and not removed
3. **Given** an error object with field `dashboardUrl: "/analytics/dashboard"`, **When** sanitization is applied, **Then** the `dashboardUrl` field is preserved and not removed
4. **Given** an error object with field `name: "John Doe"`, **When** sanitization is applied, **Then** the `name` field is removed (word boundary match)
5. **Given** an error object with field `account: "123456789"`, **When** sanitization is applied, **Then** the `account` field is removed (word boundary match)

---

### User Story 2 - Preventing Authentication Secret Leakage (Priority: P1)

A developer accidentally logs an API error response containing authentication tokens or passwords. The current sanitizer does not detect these critical secrets because patterns like `password`, `token`, `apiKey`, `secret`, `auth`, and `credential` are not in the pattern list. After refinement, these secrets are automatically detected and sanitized from all logs, preventing security incidents.

**Why this priority**: This is equally critical as P1 Story 1 because it addresses false negatives that create active security vulnerabilities. Missing authentication secrets in logs can lead to credential theft and unauthorized access.

**Independent Test**: Can be fully tested by logging objects containing authentication fields (`password`, `token`, `apiKey`, `secretKey`, `authToken`, `credentials`) and verifying all are sanitized. Delivers immediate security value by closing critical gaps.

**Acceptance Scenarios**:

1. **Given** an error object with field `password: "secret123"`, **When** sanitization is applied, **Then** the `password` field is removed
2. **Given** an error object with field `token: "eyJhbGci..."`, **When** sanitization is applied, **Then** the `token` field is removed
3. **Given** an error object with field `apiKey: "sk_live_..."`, **When** sanitization is applied, **Then** the `apiKey` field is removed
4. **Given** an error object with field `secret: "my_secret_key"`, **When** sanitization is applied, **Then** the `secret` field is removed
5. **Given** an error object with field `auth: "Bearer token..."`, **When** sanitization is applied, **Then** the `auth` field is removed
6. **Given** an error object with field `credentials: {...}`, **When** sanitization is applied, **Then** the `credentials` field is removed
7. **Given** an error object with compound field `tokenId: "tok_123"`, **When** sanitization is applied, **Then** the `tokenId` field is removed (authentication secret takes precedence)
8. **Given** an error object with compound field `apiKeyFilename: "key.json"`, **When** sanitization is applied, **Then** the `apiKeyFilename` field is removed (authentication secret takes precedence)

---

### User Story 3 - Scoped IP Address Detection (Priority: P2)

A developer logs network diagnostic information containing fields like `zip: "12345"`, `shipmentId: "SHIP_001"`, or `relationship: "parent"`. The current sanitizer incorrectly removes these because the substring 'ip' appears in 'zip', 'ship', and 'ship'. After refinement, only actual IP address fields like `ipAddress` or `remote_ip` are sanitized, while other fields with incidental 'ip' substrings are preserved.

**Why this priority**: This is a lower priority than P1 stories because while it causes debugging friction, it doesn't create security vulnerabilities. However, it significantly improves developer experience and reduces the temptation to disable sanitization.

**Independent Test**: Can be fully tested by logging objects with incidental 'ip' substrings (`zip`, `shipmentId`, `relationship`) and IP address fields (`ipAddress`, `remote_ip`, `clientIp`) and verifying only the latter are sanitized. Delivers improved debugging experience.

**Acceptance Scenarios**:

1. **Given** an error object with field `zip: "12345"`, **When** sanitization is applied, **Then** the `zip` field is preserved (not an IP address)
2. **Given** an error object with field `shipmentId: "SHIP_001"`, **When** sanitization is applied, **Then** the `shipmentId` field is preserved
3. **Given** an error object with field `relationship: "parent"`, **When** sanitization is applied, **Then** the `relationship` field is preserved
4. **Given** an error object with field `ipAddress: "192.168.1.1"`, **When** sanitization is applied, **Then** the `ipAddress` field is removed
5. **Given** an error object with field `remote_ip: "10.0.0.1"`, **When** sanitization is applied, **Then** the `remote_ip` field is removed
6. **Given** an error object with field `clientIp: "172.16.0.1"`, **When** sanitization is applied, **Then** the `clientIp` field is removed

---

### User Story 4 - Backward Compatibility for Existing Logs (Priority: P2)

An operations team relies on existing sanitization behavior for compliance auditing and log analysis tools. After the pattern refinement is deployed, all previously sanitized PII fields (like `email`, `ssn`, `phone`) continue to be detected and removed exactly as before. No valid PII detection is broken, ensuring compliance continuity.

**Why this priority**: This ensures that fixing false positives and false negatives doesn't introduce new problems. All existing valid sanitization must continue working to maintain security posture and compliance.

**Independent Test**: Can be fully tested by running the complete existing test suite (226+ tests) and verifying all pass without modification. Also verifying that all 24 original PII patterns (`email`, `phone`, `address`, `ssn`, etc.) still trigger sanitization correctly. Delivers confidence in the upgrade.

**Acceptance Scenarios**:

1. **Given** an error object with field `email: "user@example.com"`, **When** sanitization is applied, **Then** the `email` field is removed (existing behavior preserved)
2. **Given** an error object with field `userEmail: "user@example.com"`, **When** sanitization is applied, **Then** the `userEmail` field is removed (existing behavior preserved)
3. **Given** an error object with field `ssn: "123-45-6789"`, **When** sanitization is applied, **Then** the `ssn` field is removed
4. **Given** an error object with field `phone: "555-1234"`, **When** sanitization is applied, **Then** the `phone` field is removed
5. **Given** the complete existing test suite (226+ tests), **When** tests are executed, **Then** all tests pass without modification
6. **Given** performance benchmarks from Feature 018, **When** sanitization is executed on typical error objects, **Then** performance remains under 50ms per sanitization

---

### Edge Cases

- **What happens when a field contains multiple patterns?** (e.g., `userEmailAddress` contains both 'email' and 'address') - The field should be sanitized if it matches any PII pattern, regardless of how many patterns match.

- **What happens with camelCase vs snake_case boundaries?** (e.g., `firstName` vs `first_name`) - Word boundary matching should handle both camelCase (`firstName` matches `name` boundary) and snake_case (`first_name` matches `name` boundary) correctly.

- **What happens with compound fields containing legitimate and PII terms?** (e.g., `filenamePassword` - contains both legitimate 'filename' and secret 'password') - Authentication secret patterns take precedence: if any authentication secret pattern (password, token, apiKey, secret, auth, credential) matches at a word boundary, the entire field is sanitized regardless of other terms. Examples: `tokenId` (sanitized), `apiKeyFilename` (sanitized), `secretManagerConfig` (sanitized), `passwordFile` (sanitized).

- **What happens with nested objects containing thousands of fields?** - Performance must remain under 50ms for typical error objects. If performance degrades significantly, the system should still complete sanitization but may log a performance warning for objects exceeding expected size.

- **What happens when new authentication patterns emerge in the future?** (e.g., `bearerToken`, `jwtToken`, `refreshToken`) - The pattern list should be extensible. These compound patterns should be detected if they contain the base pattern `token` at a word boundary (e.g., `bearerToken` contains `token` at boundary).

- **What happens with all-lowercase vs all-uppercase field names?** (e.g., `PASSWORD` vs `password` vs `PaSsWoRd`) - Pattern matching should remain case-insensitive as in the original implementation, detecting all case variations.

- **What happens with obfuscated field names?** (e.g., `p_a_s_s_w_o_r_d`, `p4ssw0rd`, `pass word`) - The system uses exact word boundary matching and does not attempt to detect obfuscated or leetspeak variations. Fields like `p_a_s_s_w_o_r_d` are NOT sanitized (each character separated by underscore doesn't match 'password' at word boundary). This is by design to avoid false positives; obfuscation detection is out of scope.

## Requirements

### Functional Requirements

- **FR-001**: System MUST implement word boundary pattern matching for PII detection to prevent false positives (e.g., 'name' should not match 'filename', but should match 'name' or 'user_name')

- **FR-002**: System MUST support both camelCase word boundaries (e.g., `firstName` → 'first' and 'Name') and snake_case word boundaries (e.g., `first_name` → 'first' and 'name')

- **FR-003**: System MUST add authentication secret patterns to the sanitization list: `password`, `passwd`, `token`, `bearer`, `apikey`, `api_key`, `accesskey`, `access_key`, `secret`, `auth`, `credential`, `credentials`, `authorization` (13 patterns total). System MUST also support versioned field variants with numeric suffixes (e.g., `password1`, `token_2`, `apiKey3`) for both authentication secrets and regular PII patterns

- **FR-004**: System MUST scope the 'ip' pattern to only match complete IP address field names (e.g., `ipAddress`, `remote_ip`, `client_ip`, `clientIp`) and not incidental 'ip' substrings (e.g., `zip`, `ship`, `relationship`)

- **FR-005**: System MUST maintain case-insensitive pattern matching for all PII patterns (existing behavior)

- **FR-006**: System MUST preserve all existing PII pattern detection for the original 24 patterns (email, phone, address, name, ssn, dob, birthdate, dateofbirth, passport, license, driverslicense, nationalid, card, cardnumber, pan, cvv, cvc, expiry, account, bankaccount, routing, iban, swift, tin, taxid, vat)

- **FR-007**: System MUST pass all 226+ existing backend tests without modification to test files (backward compatibility requirement)

- **FR-008**: System MUST complete sanitization of typical error objects (containing 10-50 fields with 2-3 levels of nesting) in under 50ms

- **FR-009**: System MUST prevent false positives: fields like `filename`, `accountId`, `accountType`, `dashboard`, `discard`, `zip`, `shipmentId`, `hostname`, `username` (where PII pattern is not a complete word) must NOT be sanitized

- **FR-010**: System MUST detect false negative cases: fields like `password`, `token`, `apiKey`, `secretKey`, `authToken`, `credentials` must BE sanitized

- **FR-011**: System MUST handle compound field names correctly (e.g., `userPassword` should be sanitized because 'password' is a complete word boundary; `passwordFile` should be sanitized for the same reason)

- **FR-012**: System MUST give authentication secret patterns (password, passwd, token, apiKey, secret, auth, credential, authorization) precedence over non-secret patterns - if any authentication secret pattern matches at a word boundary, the field is sanitized regardless of other terms present (e.g., `tokenId`, `apiKeyFilename`, `secretManagerConfig` are all sanitized)

- **FR-013**: System MUST evaluate authentication secret patterns first (password, passwd, token, apiKey, secret, auth, credential, authorization) before checking other PII patterns, enabling early detection of security-critical fields

- **FR-014**: System MUST maintain structural sharing optimization (return same object reference when no PII is detected, new object when PII is removed)

### Key Entities

- **PII Pattern**: Represents a field name pattern that indicates personally identifiable information or secrets (e.g., 'email', 'password', 'token'). Each pattern has:
  - Pattern text (e.g., 'name', 'token')
  - Matching rule (word boundary matching vs specific field names)
  - Category (contact, identity, financial, authentication secret, network)
  - Evaluation priority (authentication secrets evaluated first for early security-critical detection)

- **Field Match Rule**: Represents the criteria for determining if a field name matches a PII pattern. Has:
  - Match type (word boundary, exact match, or specific compound patterns)
  - Boundary detection logic (camelCase, snake_case, exact word)
  - Case sensitivity (case-insensitive)

- **Sanitization Result**: Represents the outcome of sanitizing a field or object. Contains:
  - Whether sanitization occurred (boolean)
  - Original data reference (if no changes)
  - New sanitized data (if changes occurred)
  - Performance metrics (time taken)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero false positives for common legitimate field names - 100% of fields like `filename`, `accountId`, `accountType`, `dashboard`, `discard`, `zip`, `shipmentId`, `hostname`, `username` are preserved when logged

- **SC-002**: Zero false negatives for critical authentication secrets - 100% of fields like `password`, `token`, `apiKey`, `secret`, `auth`, `credential` are sanitized when logged

- **SC-003**: All 226+ existing backend tests pass without modification, demonstrating zero breaking changes to valid sanitization behavior

- **SC-004**: Sanitization performance remains under 50ms for typical error objects (10-50 fields, 2-3 levels of nesting), measured by existing performance benchmarks

- **SC-005**: Developer satisfaction improves as measured by zero complaints about legitimate fields being removed from production logs (currently blocking debugging)

- **SC-006**: Security posture improves as measured by zero authentication secrets appearing in production logs after deployment (currently a known vulnerability)

- **SC-007**: Test coverage increases to 240-250 tests (from 226) with comprehensive assertions for:
  - Word boundary matching (30+ test cases for false positives)
  - Authentication secret detection (15+ test cases for false negatives)
  - Scoped IP address detection (10+ test cases)
  - Backward compatibility (all existing 226+ tests passing)

- **SC-008**: Documentation clarity is achieved when all pattern matching rules are clearly documented with examples, and 90% of developers can correctly predict which fields will be sanitized based on the documentation

- **SC-009**: Authentication secret detection optimization is achieved when fields containing authentication patterns are detected before other PII patterns are evaluated, enabling early-exit performance optimization for security-critical fields

- **SC-010**: Versioned field detection correctly handles numeric suffixes - 100% of fields like `email1`, `password_2`, `token3`, `name_backup_1`, `apiKey123` are sanitized when logged (CodeRabbit Issue 9 enhancement)

## Technical Implementation Guidance

### Word Boundary Regex Best Practices (MDN JavaScript, 2025)

Based on Context7 analysis of MDN Web Docs (Trust Score: 9.9/10), the following regex patterns are recommended for word boundary matching:

1. **Standard Word Boundary (`\b`)**: Matches position where word character is not followed/preceded by another word character
   - Example: `/\bname\b/` matches 'name' in 'user name' but not 'filename'
   - Limitation: `\b` treats underscore `_` as word character, so `/\bname\b/` won't match 'user_name'

2. **camelCase Boundary Pattern**: `/(^|[A-Z])pattern/` or `/pattern([A-Z]|$)/`
   - Example: `/Name/` with uppercase detection matches 'Name' in 'firstName'
   - Works with capital letter boundaries in camelCase

3. **snake_case Boundary Pattern**: `/(^|_)pattern(_|$)/`
   - Example: `/(^|_)name(_|$)/` matches 'name' in 'user_name'
   - Uses underscore as explicit boundary marker

4. **Combined Pattern for Both**: `/(^|_|[A-Z])pattern(_|[A-Z]|$)/i` with case-insensitive flag
   - Handles both camelCase (firstName) and snake_case (first_name)
   - Case-insensitive flag (`/i`) ensures 'Name', 'name', 'NAME' all match

**Critical Warning from MDN**: `/\w\b\w/` will **never** match (word char → boundary → word char is impossible)

### Performance Optimization Patterns (Node.js Best Practices, 2025)

Based on Context7 analysis of Node.js Best Practices (Trust Score: 9.6/10):

1. **Regex Performance Risks**:
   - **ReDoS (Regular Expression Denial of Service)**: Complex patterns like `/^([a-zA-Z0-9])(([-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$/` are vulnerable
   - Use `safe-regex` library to validate patterns during development
   - Recommendation: Keep patterns simple - our word boundary approach (`/(^|_)pattern(_|$)/`) is safe

2. **Pattern Evaluation Order Optimization**:
   - Check most frequent patterns first for general optimization
   - Check security-critical patterns first for defense-in-depth (our approach via FR-013)
   - Early-exit on first match reduces CPU cycles

3. **Native JavaScript Performance**:
   - String operations (`toLowerCase()`, `includes()`) are highly optimized in V8
   - Avoid external dependencies (lodash, underscore) for simple operations
   - Use `String.prototype.toLowerCase()` + `Array.prototype.some()` (current implementation)

### Testing Strategy (Node.js Testing Best Practices, 2025)

Based on Context7 analysis of Node.js Testing Best Practices (Trust Score: 9.6/10):

1. **Edge Case Testing Pattern**:
   - **Boundary Conditions**: Test exact word boundaries (`'name'` vs `'filename'`)
   - **Case Variations**: Test `'password'`, `'PASSWORD'`, `'PaSsWoRd'`
   - **Compound Fields**: Test `'tokenId'`, `'apiKeyFilename'`, `'secretConfig'`
   - **Negative Cases**: Test fields that should NOT be sanitized (`'filename'`, `'accountId'`)

2. **Test Organization by Pattern Category**:
   ```javascript
   describe('PII Pattern Matching', () => {
     describe('Authentication Secrets', () => {
       test('password at word boundary', ...)
       test('token in compound field', ...)
     });
     describe('False Positive Prevention', () => {
       test('filename not sanitized', ...)
       test('accountId not sanitized', ...)
     });
   });
   ```

3. **Test Data Generation**:
   - Use unique suffixes for test fields to avoid collisions: `externalIdentifier: 'id-${getShortUnique()}'`
   - Create test records within each test (not in global setup) for isolation
   - Clean up mocks with `sinon.restore()` in `beforeEach` hooks

4. **Assertion Patterns**:
   - Use `expect.any(Type)` for dynamic fields (timestamps, IDs)
   - Use `toMatchObject()` for partial schema validation
   - Test both positive (field removed) and negative (field preserved) cases

## Security & Compliance Alignment

### OWASP Best Practices Compliance

This feature aligns with OWASP secure logging guidelines (OWASP Cheat Sheet Series, 2025):

1. **Parameterized Logging** - Field name pattern matching (not value inspection) prevents log injection attacks while maintaining structured logging integrity

2. **Defense-in-Depth Security** - Multi-layer approach with authentication secret precedence (FR-012) and priority evaluation (FR-013) ensures critical secrets are caught first

3. **Fail-Safe Defaults** - Current implementation returns `'[Circular]'` for circular references instead of throwing exceptions, maintaining logging availability while preventing crashes (existing behavior from Feature 018 Phase 4, lines 121-124 of PiiSanitizer.js)

4. **Input Validation at Boundaries** - Word boundary regex matching prevents both over-sanitization (false positives) and under-sanitization (false negatives), following OWASP input validation principles

5. **Security Event Logging** - Preserves all legitimate technical fields (filename, accountId, dashboard URL) required for security incident investigation while removing sensitive authentication secrets

6. **Structured Error Handling** - Maintains structural sharing optimization (FR-014) and handles special object types (Date, RegExp, Map, Set) safely without exposing sensitive data

### Privacy-First Design

- **No Value Inspection**: System only evaluates field names, never inspects field values, preventing accidental PII exposure during sanitization process itself
- **Transparent Operation**: Zero configuration changes required; all improvements invisible to API consumers (Assumption 7)
- **Performance-Conscious Security**: <50ms sanitization overhead ensures security doesn't degrade observability in production (FR-008, SC-004)

## Assumptions

- **Assumption 1**: The existing 226+ backend tests represent the complete set of valid sanitization behavior that must be preserved. Any test failures indicate breaking changes.

- **Assumption 2**: The word boundary matching approach using regex patterns like `/(^|_)pattern(_|$)/` or `\bpattern\b` is sufficient to handle both camelCase and snake_case field naming conventions used in the PayPlan codebase.

- **Assumption 3**: Authentication secrets (password, token, apiKey, etc.) are higher security priority than traditional PII (name, email) because they provide direct access to systems rather than just exposing user data.

- **Assumption 4**: The performance target of <50ms for typical error objects is consistent with Feature 018 Phase 4 performance benchmarks and represents acceptable overhead for production logging.

- **Assumption 5**: The scoped IP address pattern should match field names containing 'ip' as a distinct component (e.g., `ipAddress`, `remote_ip`, `client_ip`) but not incidental occurrences (e.g., `zip`, `ship`). The pattern `/(^|_)ip(_|[A-Z]|$)/` captures this intent.

- **Assumption 6**: No new infrastructure or dependencies are required - all changes can be implemented within the existing `PiiSanitizer.js` module and tested within the existing test suite structure.

- **Assumption 7**: The feature will be deployed as a drop-in replacement with zero configuration changes required by developers. All improvements are transparent to consumers of the `piiSanitizer.sanitize()` API.

- **Assumption 8**: The combined regex pattern `/(^|_|[A-Z])pattern(_|[A-Z]|$)/i` (from MDN Web Docs analysis) is sufficient for both camelCase and snake_case boundary detection. This pattern is validated against MDN JavaScript standards and is not vulnerable to ReDoS attacks per Node.js Best Practices guidance (simple patterns with bounded repetition are safe).

## Dependencies

- **Dependency 1**: Completion of Feature 018 Phase 4 (Technical Debt Cleanup) - this feature directly modifies the `PiiSanitizer.js` module created in that phase

- **Dependency 2**: Existing test suite (226+ backend tests in `backend/tests/unit/PiiSanitizer.test.ts`) must remain passing to validate backward compatibility

- **Dependency 3**: Linear issue MMT-48 tracks this work - completion of this feature should close that issue

## Out of Scope

- **Out of Scope 1**: Machine learning or AI-based PII detection - this feature uses explicit pattern matching only

- **Out of Scope 2**: Adding new PII categories beyond authentication secrets (e.g., biometric data, genetic information, health records) - only addressing documented false positives/negatives

- **Out of Scope 3**: Internationalization of PII patterns (e.g., non-English field names like `contraseña`, `mot_de_passe`) - English field names only

- **Out of Scope 4**: Configuration or customization of PII patterns by application users - pattern list is fixed at deployment

- **Out of Scope 5**: Value-based PII detection (e.g., detecting email addresses by format rather than field name) - field name pattern matching only

- **Out of Scope 6**: Retroactive re-sanitization of existing logs - feature applies only to new logs generated after deployment

- **Out of Scope 7**: Performance optimization beyond the existing <50ms target - the focus is correctness (fixing false positives/negatives), not performance improvement

- **Out of Scope 8**: Support for pattern negation or exclusion rules (e.g., "sanitize 'name' except in 'filename'") - word boundary matching is sufficient

- **Out of Scope 9**: Detection of obfuscated or leetspeak field names (e.g., `p4ssw0rd`, `t0ken`, `p_a_s_s_w_o_r_d`, `pass word`) - exact word boundary matching only; fuzzy/similarity matching would introduce unacceptable false positive rates
