---
description: "Implementation plan for user preference management system"
scripts:
  sh: scripts/bash/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
---

# Implementation Plan: User Preference Management System

**Branch**: `012-user-preference-management` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-user-preference-management/spec.md`

## Execution Flow (/plan command scope)

```text
1. Load feature spec from Input path
   ✓ Feature spec loaded and analyzed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✓ Project Type: Web application (frontend + backend)
   ✓ Structure Decision: Option 2 (frontend/backend split)
3. Fill the Constitution Check section
   ✓ Constitution is template-based, using general best practices
4. Evaluate Constitution Check section
   ✓ No constitutional violations detected
   ✓ Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   ✓ COMPLETE (research.md created with Puppeteer MCP research)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   ✓ COMPLETE (all artifacts generated)
7. Re-evaluate Constitution Check
   ✓ COMPLETE (no new violations)
8. Plan Phase 2 → Describe task generation approach
   ✓ COMPLETE (described in Phase 2 section)
9. STOP - Ready for /tasks command
   ✓ READY
```

**IMPORTANT**: The /plan command STOPS at step 8. Phase 2 is executed by the /tasks command.

## Summary

**Primary Requirement**: Build a privacy-first user preference management system that automatically saves and restores user settings (timezone, payday dates, business day rules, currency format, locale) across browser sessions using local-only storage.

**Technical Approach**:
- Client-side only implementation using browser localStorage
- React hooks for preference state management and persistence
- Industry-standard UX patterns (inline toggles + centralized settings, toast notifications, <100ms restoration)
- WCAG 2.1 AA accessibility compliance
- 5KB storage limit with validation
- Flexible payday date patterns supporting both specific dates and recurring patterns

## Technical Context

**Language/Version**: TypeScript 5.8.3, React 19.1.1, Node.js 20.x
**Primary Dependencies**: React 19, Zod 4.1 (validation), luxon 3.7 (date handling), @radix-ui/* (accessible UI components), Vite 7.1 (build tool)
**Storage**: Browser localStorage (client-side only, no server persistence)
**Testing**: Vitest 3.2.4, @testing-library/react 16.3.0, @testing-library/user-event 14.6.1
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: web (frontend + backend structure, this feature is frontend-only)
**Performance Goals**: <100ms preference restoration (Google RAIL model compliance), <500ms save operations
**Constraints**:
- Privacy-first: No server storage, local-only
- Accessibility: WCAG 2.1 Level AA compliance
- Storage limit: <5KB total preference data
- Performance: <100ms restoration (imperceptible to users)
**Scale/Scope**:
- 5 preference categories (timezone, payday dates, business day settings, currency format, locale)
- 14 functional requirements + 3 non-functional requirements
- Single-user, per-device preference storage

**User-Provided Context**: Research phase must use Puppeteer MCP server to gather up-to-date data for this specification feature (today's date: 10/11/2025)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✓ PASS (No violations detected)

### Evaluation Criteria

1. **Simplicity**: ✓ Feature uses existing browser APIs (localStorage), no new dependencies beyond validation (Zod already in use)
2. **Test-First**: ✓ Plan includes contract tests, unit tests for validation logic, integration tests for user scenarios
3. **Single Responsibility**: ✓ Preference management is isolated, doesn't mix concerns with payment logic
4. **Privacy-First Alignment**: ✓ Local-only storage aligns with PayPlan's no-authentication, privacy-first principle
5. **Accessibility**: ✓ WCAG 2.1 AA compliance specified in NFR-003

**Complexity Justification**: None required - feature follows established patterns

## Project Structure

### Documentation (this feature)

```text
specs/012-user-preference-management/
├── plan.md              # This file (/plan command output) - COMPLETE
├── spec.md              # Feature specification (already exists) - COMPLETE
├── research.md          # Phase 0 output (/plan command) - COMPLETE
├── data-model.md        # Phase 1 output (/plan command) - COMPLETE
├── quickstart.md        # Phase 1 output (/plan command) - COMPLETE
├── contracts/           # Phase 1 output (/plan command) - COMPLETE
│   ├── PreferenceStorageService.contract.md - COMPLETE
│   ├── PreferenceValidationService.contract.md - COMPLETE
│   └── PreferenceUIComponents.contract.md - COMPLETE
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```text
# Option 2: Web application (frontend + backend, this feature is frontend-only)
frontend/
├── src/
│   ├── components/
│   │   ├── preferences/          # NEW: Preference UI components
│   │   │   ├── PreferenceToggle.tsx
│   │   │   ├── PreferenceSettings.tsx
│   │   │   ├── ToastNotification.tsx
│   │   │   └── InlineStatusIndicator.tsx
│   │   └── ...                   # Existing components
│   ├── hooks/
│   │   ├── usePreferences.ts     # NEW: Main preference management hook
│   │   ├── useLocalStorage.ts    # NEW: localStorage abstraction hook
│   │   └── ...                   # Existing hooks
│   ├── lib/
│   │   └── preferences/          # NEW: Preference business logic
│   │       ├── storage.ts        # localStorage operations
│   │       ├── validation.ts     # Zod schemas and validation
│   │       ├── types.ts          # TypeScript types
│   │       └── constants.ts      # Defaults, limits (5KB)
│   ├── utils/
│   │   └── ...                   # Existing utilities
│   └── ...
└── tests/
    ├── unit/
    │   ├── preferences/           # NEW: Unit tests
    │   │   ├── storage.test.ts
    │   │   ├── validation.test.ts
    │   │   └── hooks.test.ts
    ├── integration/
    │   └── preferences/           # NEW: Integration tests
    │       ├── save-restore.test.ts
    │       ├── opt-in-opt-out.test.ts
    │       ├── reset.test.ts
    │       └── edge-cases.test.ts
    └── ...
```

**Structure Decision**: Option 2 (Web application) - feature is frontend-only, no backend changes required

## Phase 0: Outline & Research

**Objective**: Research up-to-date (October 2025) best practices for browser preference management, localStorage patterns, and accessibility requirements.

### Research Tasks (using Puppeteer MCP)

1. **localStorage Best Practices (2025)**
   - Research MDN Web Docs for current localStorage API usage patterns
   - Investigate quota management and quotaExceededError handling
   - Find performance benchmarks for localStorage read/write operations

2. **React State Management Patterns (React 19)**
   - Research React 19 hooks best practices for persistent state
   - Investigate custom hook patterns for localStorage synchronization
   - Find patterns for handling storage events across tabs

3. **Accessibility Standards (WCAG 2.1 AA - 2025 updates)**
   - Research ARIA live region patterns for toast notifications
   - Investigate keyboard accessibility for preference controls
   - Find screen reader testing best practices

4. **Flexible Date Pattern Storage**
   - Research common payroll schedule patterns (biweekly, monthly, semi-monthly)
   - Investigate date pattern validation approaches
   - Find locale-aware date pattern handling

5. **Performance Optimization**
   - Research debouncing/throttling patterns for preference saves
   - Investigate lazy loading strategies for preference restoration
   - Find Web Vitals compliance strategies for <100ms initialization

### Output Format (research.md)

For each research area:

```markdown
## [Research Area]

**Decision**: [Chosen approach]

**Rationale**: [Why chosen based on 2025 best practices]

**Alternatives Considered**:
- [Alternative 1]: [Why not chosen]
- [Alternative 2]: [Why not chosen]

**Sources**: [URLs from research, dated October 2025]

**Implementation Notes**: [Key technical details]
```

**Output**: research.md with all decisions documented and sourced

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### 1. Data Model (data-model.md)

**Entities to Extract from Spec**:

- **UserPreference** (lines 152-156 in spec.md)
  - Fields: category, value, optInStatus, timestamp
  - Validation: Zod schemas for each category
  - Relationships: Part of PreferenceCollection

- **PreferenceCategory** (lines 158-163 in spec.md)
  - Fields: Enum (Timezone, PaydayDates, BusinessDaySettings, CurrencyFormat, Locale)
  - Validation: category-specific value validation rules

- **PreferenceCollection**
  - Fields: version, preferences (Map<PreferenceCategory, UserPreference>), totalSize
  - Validation: totalSize < 5KB (FR-014)

- **PaydayDatePattern**
  - Fields: type (specific | recurring), values (number[] | RecurringPattern)
  - Validation: date validation, pattern syntax

### 2. API Contracts (contracts/)

**Contract 1: PreferenceStorageService**
- `savePreference(category, value)` → `Promise<Result<void, StorageError>>`
- `loadPreferences()` → `Promise<Result<PreferenceCollection, StorageError>>`
- `resetAllPreferences()` → `Promise<Result<void, StorageError>>`
- `getStorageSize()` → `number`

**Contract 2: PreferenceValidationService**
- `validatePreferenceValue(category, value)` → `Result<void, ValidationError>`
- `validateStorageSize(preferences)` → `Result<void, QuotaError>`
- `validatePaydayPattern(pattern)` → `Result<void, ValidationError>`

**Contract 3: PreferenceUIComponents**
- `<PreferenceToggle />` - Inline opt-in/opt-out control
- `<PreferenceSettings />` - Centralized settings screen
- `<ToastNotification />` - 2-3 second auto-dismiss feedback
- `<InlineStatusIndicator />` - Persistent restoration indicator

### 3. Contract Tests

Contract tests will be written FIRST (TDD), must FAIL before implementation:

```typescript
// tests/contract/PreferenceStorageService.contract.test.ts
describe('PreferenceStorageService Contract', () => {
  it('should save preference and return success', async () => {
    const result = await service.savePreference('timezone', 'America/New_York');
    expect(result.isOk()).toBe(true);
  });

  it('should reject preferences exceeding 5KB limit', async () => {
    const largeValue = 'x'.repeat(5 * 1024);
    const result = await service.savePreference('timezone', largeValue);
    expect(result.isErr()).toBe(true);
    expect(result.error.type).toBe('QuotaExceeded');
  });

  // ... 10-15 contract tests per service
});
```

### 4. Quickstart Tests (quickstart.md)

Extract from acceptance scenarios (spec.md lines 77-98):

1. **Scenario 1**: First-time user saves timezone → restore in new session
2. **Scenario 2**: User resets all preferences → all revert to defaults
3. **Scenario 3**: User opts out of timezone → only timezone not restored
4. **Scenario 7**: User sees inline toggle → can opt in/out immediately

Manual test steps with expected outcomes for each scenario.

### 5. Agent Context Update

```bash
scripts/bash/update-agent-context.sh CLAUDE
```

Updates `CLAUDE.md` with:
- New preference management hooks and components
- localStorage patterns
- Zod validation schemas
- WCAG 2.1 AA accessibility requirements

**Output**: data-model.md, contracts/*, failing contract tests, quickstart.md, CLAUDE.md updated

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

1. Load `.specify/templates/tasks-template.md` as base structure
2. Generate tasks from Phase 1 artifacts in TDD order:
   - **Contract test tasks** (from contracts/) - Write failing tests FIRST
   - **Data model tasks** (from data-model.md) - Zod schemas, TypeScript types
   - **Storage layer tasks** - localStorage abstraction, quota management
   - **Validation tasks** - Preference validation, payday pattern validation
   - **Hook tasks** - usePreferences, useLocalStorage with tests
   - **Component tasks** - UI components with accessibility
   - **Integration test tasks** (from quickstart.md) - User scenarios
   - **Edge case tasks** (from spec.md edge cases) - Error handling, corruption, quota

**Ordering Strategy**:

1. **Phase 0: Setup** (1-2 tasks)
   - Types and constants [P]
   - Zod schemas [P]

2. **Phase 1: Storage Layer** (3-5 tasks) - TDD order
   - [TEST] localStorage abstraction contract tests
   - [IMPL] localStorage abstraction implementation
   - [TEST] Quota management tests
   - [IMPL] Quota management implementation

3. **Phase 2: Validation** (3-4 tasks) - TDD order
   - [TEST] Preference validation tests
   - [IMPL] Preference validation
   - [TEST] Payday pattern validation tests
   - [IMPL] Payday pattern validation

4. **Phase 3: Hooks** (4-6 tasks) - TDD order
   - [TEST] useLocalStorage hook tests
   - [IMPL] useLocalStorage hook
   - [TEST] usePreferences hook tests
   - [IMPL] usePreferences hook

5. **Phase 4: UI Components** (6-8 tasks) - TDD order
   - [TEST] PreferenceToggle component tests (accessibility)
   - [IMPL] PreferenceToggle component
   - [TEST] PreferenceSettings screen tests
   - [IMPL] PreferenceSettings screen
   - [TEST] ToastNotification tests (ARIA live)
   - [IMPL] ToastNotification
   - [TEST] InlineStatusIndicator tests
   - [IMPL] InlineStatusIndicator

6. **Phase 5: Integration** (5-7 tasks)
   - Integration test: Save/restore flow
   - Integration test: Opt-in/opt-out flow
   - Integration test: Reset flow
   - Integration test: Edge cases (corruption, quota, invalid data)
   - Performance test: <100ms restoration (NFR-001)

7. **Phase 6: Accessibility** (2-3 tasks)
   - WCAG 2.1 AA audit (automated + manual)
   - Screen reader testing (NVDA, VoiceOver)
   - Keyboard navigation testing

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**Parallel Execution Markers**: [P] indicates tasks that can run in parallel (independent files)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD principles)
**Phase 5**: Validation (run all tests, execute quickstart.md, verify NFR-001 performance target)

## Complexity Tracking

*No constitutional violations detected - this section is empty*

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) - COMPLETE
- [x] Phase 1: Design complete (/plan command) - COMPLETE
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - COMPLETE
- [ ] Phase 3: Tasks generated (/tasks command) - Ready to execute
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Clarifications section exists (5 clarifications from 2025-10-13)
- [x] Post-Design Constitution Check: PASS
- [x] All research complete (5 research areas documented)
- [x] Complexity deviations documented (N/A - no violations)

---

*Based on PayPlan architecture | React 19.1.1 + TypeScript 5.8.3 | Today: 2025-10-13*
