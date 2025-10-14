# Contract: Preference UI Components

**Feature**: 012-user-preference-management
**Created**: 2025-10-13
**Purpose**: Define component contracts for preference UI with accessibility (WCAG 2.1 AA)

---

## Overview

Preference UI components implement the industry-standard UX patterns defined in clarifications: inline toggles + centralized settings, toast notifications with ARIA live regions, and inline status indicators.

---

## Component Contracts

### 1. PreferenceToggle

**Purpose**: Inline opt-in/opt-out checkbox next to each preference control (Clarification Q1).

**Props**:

```typescript
interface PreferenceToggleProps {
  category: PreferenceCategory;
  optInStatus: boolean;
  onChange: (optIn: boolean) => void;
  disabled?: boolean;
}
```

**Accessibility** (WCAG 2.1 AA):
- `<input type="checkbox" aria-label="Save {category} preference automatically">`
- Keyboard accessible (Tab, Space/Enter)
- `aria-describedby` for help text

**Contract Tests**:

```typescript
describe('<PreferenceToggle />', () => {
  it('should render checkbox with aria-label', () => {
    render(<PreferenceToggle category="timezone" optInStatus={false} onChange={jest.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', expect.stringContaining('timezone'));
  });

  it('should call onChange when toggled', () => {
    const onChange = jest.fn();
    render(<PreferenceToggle category="timezone" optInStatus={false} onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should be keyboard accessible', () => {
    const onChange = jest.fn();
    render(<PreferenceToggle category="timezone" optInStatus={false} onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

---

### 2. ToastNotification

**Purpose**: 2-3 second auto-dismiss feedback for saves/resets (Clarification Q4, FR-005, FR-007).

**Props**:

```typescript
interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
  duration?: number; // Default: 3000ms
}
```

**Accessibility**:
- `role="status"` (success) or `role="alert"` (error)
- `aria-live="polite"` (success) or `aria-live="assertive"` (error)
- `aria-atomic="true"`
- Dismiss button: `aria-label="Dismiss notification"`
- Escape key to dismiss

**Contract Tests**:

```typescript
describe('<ToastNotification />', () => {
  it('should render with ARIA live region', () => {
    render(<ToastNotification message="Saved" type="success" onDismiss={jest.fn()} />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('should auto-dismiss after duration', async () => {
    const onDismiss = jest.fn();
    render(<ToastNotification message="Saved" type="success" onDismiss={onDismiss} duration={1000} />);
    await waitFor(() => expect(onDismiss).toHaveBeenCalled(), { timeout: 1500 });
  });

  it('should dismiss on Escape key', () => {
    const onDismiss = jest.fn();
    render(<ToastNotification message="Saved" type="success" onDismiss={onDismiss} />);
    userEvent.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

---

### 3. PreferenceSettings

**Purpose**: Centralized settings screen for bulk preference management (Clarification Q1).

**Props**:

```typescript
interface PreferenceSettingsProps {
  preferences: PreferenceCollection | null;
  onSave: (category: PreferenceCategory, value: unknown, optIn: boolean) => void;
  onResetAll: () => void;
}
```

**Accessibility**:
- Proper heading hierarchy (`<h2>Preference Settings</h2>`)
- Form labels associated with inputs
- Reset button with confirmation dialog

**Contract Tests**:

```typescript
describe('<PreferenceSettings />', () => {
  it('should render all preference categories', () => {
    render(<PreferenceSettings preferences={null} onSave={jest.fn()} onResetAll={jest.fn()} />);
    expect(screen.getByText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByText(/payday/i)).toBeInTheDocument();
    expect(screen.getByText(/currency/i)).toBeInTheDocument();
  });

  it('should show reset all button', () => {
    render(<PreferenceSettings preferences={null} onSave={jest.fn()} onResetAll={jest.fn()} />);
    const button = screen.getByRole('button', { name: /reset all/i });
    expect(button).toBeInTheDocument();
  });
});
```

---

### 4. InlineStatusIndicator

**Purpose**: Persistent indicator showing restored preferences (Clarification Q4, FR-006).

**Props**:

```typescript
interface InlineStatusIndicatorProps {
  category: PreferenceCategory;
  restored: boolean;
}
```

**Accessibility**:
- `aria-label="Timezone preference restored from previous session"`
- Icon + text for visual + semantic meaning

**Contract Tests**:

```typescript
describe('<InlineStatusIndicator />', () => {
  it('should show restored status with aria-label', () => {
    render(<InlineStatusIndicator category="timezone" restored={true} />);
    const indicator = screen.getByLabelText(/restored/i);
    expect(indicator).toBeInTheDocument();
  });

  it('should not render when not restored', () => {
    render(<InlineStatusIndicator category="timezone" restored={false} />);
    expect(screen.queryByLabelText(/restored/i)).not.toBeInTheDocument();
  });
});
```

---

## Implementation Files

**Paths**:
- `frontend/src/components/preferences/PreferenceToggle.tsx`
- `frontend/src/components/preferences/ToastNotification.tsx`
- `frontend/src/components/preferences/PreferenceSettings.tsx`
- `frontend/src/components/preferences/InlineStatusIndicator.tsx`

**Dependencies**: @radix-ui components (already in use), lucide-react icons

**Testing**: Component tests MUST be written FIRST (TDD) and MUST FAIL before implementation

---

## Summary

**Total Components**: 4
**Accessibility**: WCAG 2.1 AA compliant (NFR-003)
**UX Pattern**: Inline toggles + centralized settings (Clarification Q1)
**Feedback**: Toast (2-3s) + inline indicators (Clarification Q4)

**Next Artifact**: quickstart.md
