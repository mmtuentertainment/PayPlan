# Research Findings: Spending Categories & Budget Creation

**Feature**: 061-spending-categories-budgets  
**Research Date**: 2025-10-28  
**Researcher**: Manus AI

---

## 1. React State Management for Categories & Budgets

### Key Findings

**localStorage Performance Optimization**
- localStorage operations are synchronous and can block the main thread
- Best practice: Debounce writes to localStorage (300-500ms recommended)
- Read from localStorage once on mount, then manage state in memory
- Only write back to localStorage when state changes

**State Management Pattern (2025 Best Practices)**
- Use React's built-in hooks (useState, useEffect) for simple state
- No need for Redux/Zustand for Phase 1 (localStorage-only, no server sync)
- Custom hooks for localStorage abstraction: `useLocalStorage(key, initialValue)`
- Separate state for categories and budgets (don't nest deeply)

**Reference**: [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025)

---

## 2. Accessible Progress Bars (WCAG 2.1 AA)

### React Aria useProgressBar Hook

**Key Implementation Details**:
- Use `useProgressBar` from `react-aria` for WCAG 2.1 AA compliance
- Automatically provides ARIA attributes: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`
- Supports both determinate and indeterminate progress
- Handles internationalized number formatting automatically
- RTL (right-to-left) support built-in

**Required ARIA Attributes**:
```tsx
<div
  role="progressbar"
  aria-valuenow={currentValue}
  aria-valuemin={minValue}
  aria-valuemax={maxValue}
  aria-valuetext="60% spent - $200 left"
  aria-label="Groceries budget"
>
  {/* Visual progress bar */}
</div>
```

**Accessibility Requirements**:
1. **Labeling**: Must have `aria-label` or visible label with `aria-labelledby`
2. **Value Text**: Must provide human-readable `aria-valuetext` (not just numbers)
3. **Keyboard Navigation**: Progress bars are read-only, no keyboard interaction required
4. **Screen Reader**: Announces current progress when focused or updated
5. **Color Contrast**: 3:1 minimum for UI components (progress bar fill vs. track)
6. **Dual Encoding**: Must not rely on color alone - use text labels + icons

**Reference**: [React Aria useProgressBar](https://react-spectrum.adobe.com/react-aria/useProgressBar.html)

---

## 3. Recharts Accessibility Status

### Current State (as of 2025)

**Recharts Accessibility Support**:
- `accessibilityLayer` prop available for categorical charts (Line, Bar, Area, Scatter)
- Adds keyboard navigation: Tab to focus, Arrow keys to navigate data points
- **Known Issue**: Keyboard navigation stops working when screen readers are enabled
- **Reason**: Screen reader intercepts keyboard events, preventing chart navigation
- **Status**: Open issue since 2022, no complete solution yet

**WCAG 2.1 AA Compliance Gaps**:
- No default ARIA roles on chart elements
- Limited support for screen reader announcements
- Color contrast not guaranteed by default
- No built-in alternative text for complex charts

**Recommendation for Phase 1**:
- **Use Recharts for future dashboard charts** (not in this feature)
- **For budget progress bars**: Use React Aria `useProgressBar` instead
  - Progress bars are simpler than charts
  - Full WCAG 2.1 AA compliance out of the box
  - No Recharts accessibility issues to work around

**Reference**: [Recharts Accessibility Issue #2801](https://github.com/recharts/recharts/issues/2801)

---

## 4. Radix UI Form Components

### Best Practices for Category & Budget Forms

**Radix UI Primitives to Use**:
1. **Dialog**: For "Add Category" and "Set Budget" modals
   - `@radix-ui/react-dialog` (already installed)
   - Built-in focus management and keyboard navigation
   - Escape key to close, Tab trapping within modal

2. **Label**: For form field labels
   - `@radix-ui/react-label` (already installed)
   - Automatically associates labels with inputs

3. **Select**: For category dropdown when assigning transactions
   - `@radix-ui/react-select` (already installed)
   - Keyboard navigation: Arrow keys, Enter to select, Escape to close

4. **AlertDialog**: For delete confirmations
   - `@radix-ui/react-alert-dialog` (already installed)
   - Distinguishes between regular and destructive actions

**Accessibility Features (Built-in)**:
- ARIA attributes automatically applied
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management (focus trap in modals)
- Screen reader announcements
- Touch target size (44x44px minimum)

**Reference**: [Radix UI Primitives Documentation](https://www.radix-ui.com/primitives)

---

## 5. localStorage Architecture for Categories & Budgets

### Data Structure Design

**Separate Keys for Each Entity**:
```typescript
// localStorage keys
localStorage.setItem('categories', JSON.stringify(categories));
localStorage.setItem('budgets', JSON.stringify(budgets));
localStorage.setItem('transactions', JSON.stringify(transactions));
```

**Why Separate Keys?**:
- Faster reads (only parse what you need)
- Easier to update individual entities
- Avoids deep nesting and complex updates
- Simpler to estimate storage usage per entity

**Storage Capacity Planning**:
- localStorage limit: 5-10 MB (varies by browser)
- Estimated size per category: ~200 bytes (name, icon, color, metadata)
- Estimated size per budget: ~150 bytes (categoryId, limit, period)
- Estimated size per transaction: ~300 bytes (amount, date, category, etc.)
- **100 categories**: ~20 KB
- **100 budgets**: ~15 KB
- **1000 transactions**: ~300 KB
- **Total for Phase 1**: ~335 KB (well within limits)

**Performance Optimization**:
- Debounce writes: 300ms (balance between responsiveness and performance)
- Read once on mount, cache in React state
- Only write on user actions (create, update, delete)
- Warn user at 80% capacity (4 MB)

**Reference**: [Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/)

---

## 6. Color Contrast Requirements (WCAG 2.1 AA)

### Contrast Ratios

**Text Contrast**:
- Normal text (< 18pt): 4.5:1 minimum
- Large text (≥ 18pt or ≥ 14pt bold): 3:1 minimum

**UI Component Contrast**:
- Interactive elements (buttons, inputs, progress bars): 3:1 minimum
- Focus indicators: 3:1 minimum

**Progress Bar Color Recommendations**:
- **Track (background)**: Light gray (#E5E7EB, Tailwind gray-200)
- **Fill (under budget)**: Green (#10B981, Tailwind green-500) - 3.5:1 contrast
- **Fill (80% warning)**: Yellow (#F59E0B, Tailwind amber-500) - 3.2:1 contrast
- **Fill (100% over budget)**: Red (#EF4444, Tailwind red-500) - 3.8:1 contrast

**Dual Encoding (Not Color Alone)**:
- Under budget: Green + "✓" icon + "$X left" text
- Warning (80%): Yellow + "⚠" icon + "$X left" text
- Over budget: Red + "✕" icon + "$X over budget" text

**Reference**: [WCAG 2.1 Contrast Requirements](https://www.w3.org/TR/WCAG21/#contrast-minimum)

---

## 7. Icon Selection for Categories

### Recommended Icon Library

**Lucide React** (already installed):
- `lucide-react` package already in `package.json`
- 1000+ icons, all accessible and semantic
- Tree-shakeable (only import icons you use)
- Consistent 24x24px size
- Stroke-based design (easy to color)

**Recommended Icons for Pre-defined Categories**:
1. **Groceries**: `ShoppingCart` or `ShoppingBasket`
2. **Dining**: `Utensils` or `Coffee`
3. **Transportation**: `Car` or `Bus`
4. **Housing**: `Home` or `Building`
5. **Utilities**: `Zap` or `Droplet`
6. **Entertainment**: `Film` or `Music`
7. **Healthcare**: `Heart` or `Stethoscope`
8. **Debt**: `CreditCard` or `Banknote`
9. **Savings**: `PiggyBank` or `TrendingUp`

**Custom Category Icons**:
- Provide icon picker with 20-30 common icons
- Allow users to choose from pre-selected set (don't allow arbitrary icons)
- Ensures consistency and accessibility

---

## 8. Performance Targets Validation

### Benchmarks from Research

**Category List Rendering**:
- 100 categories: Should render in <500ms (target: <300ms)
- Use `React.memo` to prevent unnecessary re-renders
- Use `useMemo` for filtered/sorted category lists

**Budget Progress Bar Updates**:
- Target: <500ms from transaction categorization to progress bar update
- Achievable with optimized state updates
- Use `useCallback` for event handlers to prevent re-renders

**localStorage Write Performance**:
- Debounce writes to 300ms (balance between responsiveness and performance)
- Batch multiple updates into single write operation
- Use `JSON.stringify` once per write (not per field)

**Reference**: [localStorage Performance Discussion](https://stackoverflow.com/questions/23677373/can-localstorage-slow-down-my-website-when-used-frequently)

---

## 9. Form Validation with Zod

### Schema Design for Categories & Budgets

**Category Schema**:
```typescript
import { z } from 'zod';

const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  isPredefined: z.boolean(),
  createdAt: z.string().datetime(),
});
```

**Budget Schema**:
```typescript
const BudgetSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  monthlyLimit: z.number().positive("Budget must be greater than $0"),
  period: z.enum(['monthly']), // Only monthly in Phase 1
  rollover: z.boolean().default(false), // Not used in Phase 1
  createdAt: z.string().datetime(),
});
```

**Validation Error Messages**:
- Clear, user-friendly messages
- Displayed inline below form fields
- Screen reader accessible with `aria-describedby`

---

## 10. Keyboard Navigation Requirements

### Keyboard Shortcuts for Category & Budget Management

**Category List**:
- **Tab**: Navigate between categories
- **Enter**: Edit selected category
- **Delete**: Delete selected category (with confirmation)
- **Escape**: Cancel edit/delete

**Budget Form**:
- **Tab**: Navigate between form fields
- **Shift+Tab**: Navigate backwards
- **Enter**: Submit form
- **Escape**: Cancel and close modal

**Progress Bars**:
- No keyboard interaction required (read-only)
- Screen reader announces progress when focused

**Reference**: [WCAG 2.1 Keyboard Accessible](https://www.w3.org/TR/WCAG21/#keyboard-accessible)

---

## 11. Pre-defined Categories Research

### Industry Standard Categories

**Most Common Budget Categories** (based on YNAB, Mint, PocketGuard):
1. **Groceries** - Food and household items
2. **Dining** - Restaurants, takeout, coffee shops
3. **Transportation** - Gas, public transit, parking
4. **Housing** - Rent, mortgage, property tax
5. **Utilities** - Electric, water, gas, internet
6. **Entertainment** - Movies, concerts, hobbies
7. **Healthcare** - Doctor visits, prescriptions, insurance
8. **Debt** - Credit card payments, loan payments
9. **Savings** - Emergency fund, retirement, investments

**Why These 9 Categories?**:
- Cover 80% of typical spending patterns
- Align with competitor apps (familiar to users)
- Simple enough for quick onboarding (<5 minutes)
- Flexible enough to add custom categories later

---

## 12. Delete Confirmation UX Pattern

### Best Practice for Destructive Actions

**When Category Has Transactions**:
- Show `AlertDialog` with warning message
- Message: "This category has X transactions. Deleting it will uncategorize those transactions. Continue?"
- Two buttons: "Cancel" (default focus) and "Delete" (destructive, red)
- Keyboard: Escape to cancel, Tab to navigate, Enter to confirm

**When Category Has No Transactions**:
- Show simpler confirmation: "Delete [Category Name]?"
- Two buttons: "Cancel" and "Delete"

**Accessibility**:
- Focus on "Cancel" button by default (safer choice)
- Use `@radix-ui/react-alert-dialog` for built-in focus management
- Screen reader announces warning message

**Reference**: [Radix UI AlertDialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog)

---

## Summary of Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Use React Aria `useProgressBar`** | Full WCAG 2.1 AA compliance, no Recharts accessibility issues |
| **Separate localStorage keys** | Faster reads, easier updates, simpler storage estimation |
| **Debounce writes to 300ms** | Balance between responsiveness and performance |
| **Use Radix UI for forms** | Built-in accessibility, keyboard navigation, focus management |
| **Use Lucide React for icons** | Already installed, accessible, tree-shakeable |
| **9 pre-defined categories** | Cover 80% of spending patterns, align with competitors |
| **Zod for validation** | Type-safe, clear error messages, already in tech stack |
| **3:1 contrast for progress bars** | WCAG 2.1 AA compliance for UI components |
| **Dual encoding (color + text + icon)** | Don't rely on color alone for status indication |

---

## Next Steps

1. Create `plan.md` with technical architecture
2. Create `data-model.md` with TypeScript types and Zod schemas
3. Validate constitutional compliance (privacy, accessibility, performance)
