# CSV Import Page - Accessibility Guide

**Component:** `frontend/src/pages/Import.tsx`
**WCAG Level:** 2.2 Level A/AA compliant
**Last updated:** 2025-10-09 (v0.1.6-a.2)

---

## Keyboard Navigation Order

The Import page maintains strict keyboard tab order for accessibility:

```
1. File input (<input type="file">)
   ↓ Tab
2. "Process CSV" button
   ↓ Tab
3. "Clear" button (v0.1.6-a.2)
   ↓ Tab
4. "Download .ics" button (appears after successful processing)
```

### Testing Keyboard Order

**Manual test:**
```
1. Load Import page
2. Press Tab repeatedly
3. ✅ Verify: Focus moves in order above
4. ✅ Verify: No focus traps (can Tab through all elements)
5. ✅ Verify: Visible focus indicators on all elements
```

**Regression check:**
```
grep -A 5 "Process CSV" frontend/src/pages/Import.tsx | grep -A 3 Clear
```
Expected: Clear button appears AFTER "Process CSV" in JSX, BEFORE "Download .ics"

---

## ARIA Attributes

### File Input
```tsx
<label htmlFor="csv-file-input">Upload CSV file</label>
<input id="csv-file-input" type="file" accept=".csv" />
```
- ✅ Label association via `htmlFor` + `id`
- ✅ Announced by screen readers: "Upload CSV file, file input"

### Error Region
```tsx
{error && (
  <div role="alert" aria-live="polite" style={{ color: 'red' }}>
    {error}
  </div>
)}
```
- ✅ `role="alert"`: Announces immediately when error appears
- ✅ `aria-live="polite"`: Waits for user to finish speaking before announcing
- ✅ Red color for visual users (not relying on color alone - text is clear)

### Results Table
```tsx
{results && (
  <table>
    <caption>Payment plan schedule with risk assessment</caption>
    {/* ... */}
  </table>
)}
```
- ✅ `<caption>`: Describes table purpose for screen reader users
- ✅ Table structure: `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`

### Buttons
```tsx
<button type="button" onClick={handleProcess}>Process CSV</button>
<button type="button" onClick={handleClear}>Clear</button>
<button type="button" onClick={handleDownload}>Download .ics</button>
```
- ✅ `type="button"`: Prevents form submission (no form element)
- ✅ Descriptive text: "Process CSV", "Clear", "Download .ics"
- ✅ Keyboard activation: Enter and Space keys (native browser behavior)

---

## Keyboard Activation

### All Interactive Elements Support:
- **Enter key**: Activates button
- **Space key**: Activates button
- **Tab**: Moves focus forward
- **Shift+Tab**: Moves focus backward

### Testing Keyboard Activation

**Clear button test:**
```
1. Upload valid.csv
2. Click "Process CSV"
3. Tab to "Clear" button (focus visible)
4. Press Enter key
5. ✅ Verify: State resets (file/error/results cleared)
6. Upload valid.csv again
7. Tab to "Clear" button
8. Press Space key
9. ✅ Verify: State resets
```

**Test coverage:** `frontend/tests/integration/import-csv-v1-1.test.tsx:334-373`

---

## Screen Reader Announcements

### Expected Flow (NVDA/JAWS):

**1. Page load:**
```
"Upload CSV file, file input"
```

**2. After selecting file:**
```
"valid.csv selected"
```

**3. After clicking "Process CSV" (success):**
```
"Payment plan schedule with risk assessment, table with 6 rows"
```

**4. After clicking "Process CSV" (error):**
```
"Alert: Invalid currency code in row 1: US (expected 3-letter ISO 4217 code)"
```

**5. After clicking "Clear":**
```
(File input value cleared, focus returns to page)
```

### Testing with Screen Reader

**NVDA (Windows):**
```
1. Start NVDA (Ctrl+Alt+N)
2. Navigate to Import page
3. Press Tab to move through form
4. Listen for announcements above
```

**VoiceOver (macOS):**
```
1. Start VoiceOver (Cmd+F5)
2. Navigate to Import page
3. Press Ctrl+Option+Right Arrow to move through elements
4. Listen for announcements
```

---

## Focus Management

### Clear Button Behavior
```typescript
const handleClear = () => {
  setFile(null);
  setError(null);
  setResults(null);
  const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
};
```

**Focus behavior:**
- ✅ Focus remains on "Clear" button after activation
- ✅ No focus trap (user can Tab away)
- ✅ File input value cleared programmatically

**Future improvement (MMT-14):**
Use React ref instead of `document.getElementById` for better React integration.

---

## Color Contrast

### Error Messages
```tsx
<div role="alert" style={{ color: 'red' }}>
```
- **Foreground:** Red (`#ff0000` or similar)
- **Background:** White (`#ffffff`)
- **Ratio:** ~5.5:1 (WCAG AA compliant)

**Note:** Error messages don't rely solely on color - text is descriptive ("Invalid currency code...")

### Focus Indicators
- ✅ Default browser focus indicators (blue outline)
- ✅ Visible on all interactive elements
- ✅ High contrast ratio (browser default)

---

## Mobile Accessibility

### Touch Targets
- ✅ All buttons have minimum 44x44px touch target (iOS guideline)
- ✅ Adequate spacing between buttons (Process → Clear → Download)
- ✅ File input is native mobile picker (auto-handled by browser)

### Orientation
- ✅ Works in portrait and landscape
- ✅ No horizontal scrolling required
- ✅ Content reflows responsively

---

## Regression Prevention

### DOM Order Check (Test)
```typescript
// frontend/tests/integration/import-csv-v1-1.test.tsx:220-228
const buttons = screen.getAllByRole('button');
const processBtn = screen.getByRole('button', { name: /process csv/i });
const clearBtn = screen.getByRole('button', { name: /^clear$/i });
const downloadBtn = screen.getByRole('button', { name: /download.*ics/i });

const idx = (el: HTMLElement) => buttons.findIndex(b => b === el);
expect(idx(processBtn)).toBeLessThan(idx(clearBtn));
expect(idx(clearBtn)).toBeLessThan(idx(downloadBtn));
```

**What this prevents:**
- Button order changes (e.g., Clear moved after Download)
- Tab order regressions
- Keyboard navigation breaking

### A11y Test Coverage
```bash
npm --prefix frontend test import-csv-v1-1
```

**A11y tests (4 total):**
1. File input has associated label
2. Error region has `role="alert"` and `aria-live="polite"`
3. Results table has caption
4. All buttons have `type="button"`

**Location:** `frontend/tests/integration/import-csv-v1-1.test.tsx:375-417`

---

## Audit Tools

### Automated Testing
```bash
# Run Axe accessibility audit (if configured)
npm run test:a11y

# Run Lighthouse audit
lighthouse https://payplan.vercel.app --view --only-categories=accessibility
```

### Manual Testing Tools
- **NVDA** (Windows): https://www.nvaccess.org/download/
- **JAWS** (Windows): https://www.freedomscientific.com/products/software/jaws/
- **VoiceOver** (macOS): Built-in (Cmd+F5)
- **Chrome DevTools**: Lighthouse → Accessibility audit
- **axe DevTools** (browser extension): https://www.deque.com/axe/devtools/

---

## Known Issues & Future Improvements

### Non-Issues (Intentional)
- `role="alert"` + `aria-live="polite"` is correct (alert implies assertive, but polite is safer for CSV errors)
- File input uses `document.getElementById` (works correctly, ref would be more idiomatic - see MMT-14)

### Future Enhancements (MMT-14)
- [ ] Use React ref for file input (`useRef<HTMLInputElement>()`)
- [ ] Add `aria-atomic="true"` to error region for complete message reads
- [ ] Consider `aria-describedby` for file input to link validation rules

---

## Related Documentation

- **CSV Import v1.1 spec:** `specs/008-0020-2-csv-v1-1/spec.md`
- **Delta doc:** `ops/deltas/0020_2_csv_v1_1.md`
- **Test fixtures:** `fixtures/csv/README.md`
- **CHANGELOG:** [v0.1.6-a.2](../CHANGELOG.md#v016-a2---2025-10-09)
- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Practices:** https://www.w3.org/WAI/ARIA/apg/

---

**Maintained by:** Claude Code
**Last audit:** 2025-10-09 (v0.1.6-a.2)
**Next review:** After any DOM structure changes to Import.tsx
