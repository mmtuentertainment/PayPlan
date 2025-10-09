# Research Notes: CSV Import v1.1 — Currency Regex + Clear Button

**Date**: 2025-10-09
**Feature**: Add strict currency code validation and Clear button to CSV Import
**Branch**: `008-0020-2-csv-v1-1`

---

## Sources (Accessed 2025-10-09)

1. **ISO 4217 Currency Codes** — https://www.iso.org/iso-4217-currency-codes.html
2. **OWASP CSV Injection** — https://owasp.org/www-community/attacks/CSV_Injection
3. **WCAG 2.2 SC 3.3.2: Labels or Instructions** — https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html
4. **W3C WAI-ARIA 1.2: Alert Role** — https://www.w3.org/TR/wai-aria-1.2/#alert
5. **React XSS Protection (2025)** — Multiple sources via web search covering React 18/19 security practices

---

## 1. Currency Code Format (ISO 4217)

### Key Findings

ISO 4217 establishes internationally recognized codes for currency representation [1]:

- **Alphabetic format**: Three-letter codes (e.g., USD, EUR, GBP)
- **Structure**: First two letters match ISO 3166 country code; third letter typically corresponds to currency name
- **Examples**:
  - USD: US (country) + D (dollar)
  - CHF: CH (Switzerland) + F (franc)
  - EUR: European Union currency

### Pattern-Only Validation Rationale

For this client-only patch, we use pattern validation (`^[A-Z]{3}$`) rather than an ISO 4217 allowlist for the following reasons:

1. **Client-only constraint**: No server lookups permitted; all validation must happen in-browser
2. **Maintenance burden**: ISO 4217 codes change periodically (new currencies added, obsolete ones removed); embedding a static list creates drift risk
3. **Patch scope**: Adding regex validation is minimal LOC (≤10 lines); embedding a full code list would exceed budget
4. **Format consistency**: All valid ISO 4217 alphabetic codes match `^[A-Z]{3}$`; the pattern catches formatting errors (lowercase, wrong length, special characters) which are the primary user errors

**Trade-off**: Pattern-only validation will accept three-letter codes that are not official ISO 4217 currencies (e.g., "ZZZ"). This is acceptable for v1.1 scope because:
- Primary goal is format validation (prevent "usd", "US", "US1" errors)
- False positives (valid format, non-existent currency) are less harmful than false negatives in a client-only tool
- Full ISO validation can be added in a future feature if needed (tracked separately)

---

## 2. CSV Injection & Formula Safety (OWASP)

### Attack Vectors

OWASP documents CSV Injection (also called Formula Injection) as occurring when untrusted input is embedded in CSV files [2]:

**Dangerous prefixes** that trigger formula execution in spreadsheet programs:
- `=` (equals)
- `+` (plus)
- `-` (minus)
- `@` (at)
- Tab (`0x09`)
- Carriage return (`0x0D`)
- Line feed (`0x0A`)

### Current Implementation Status

**Existing protection** (unchanged in v1.1):
- All CSV data is rendered as **plain text** in React JSX
- No use of `dangerouslySetInnerHTML`
- Values are displayed directly in `<td>{item.provider}</td>` format
- React's default escaping prevents HTML/script injection

**No spreadsheet export**: The Import page does not provide CSV export functionality; users only upload CSVs and download ICS calendar files. Since we never generate CSV files for download, formula injection risk is limited to:
1. Display in the browser (mitigated by React text rendering)
2. Data copied from browser to external spreadsheet (user action, out of scope)

**Conclusion**: Existing formula-injection mitigations remain unchanged; v1.1 adds no new attack surface.

---

## 3. WCAG 2.2 Accessibility (Labels & Instructions)

### Success Criterion 3.3.2: Labels or Instructions (Level A)

**Requirement** [3]:
> "Labels or instructions are provided when content requires user input."

**Intent**:
- Help users understand what input data is expected
- Provide enough information without cluttering the page
- Particularly benefits users with cognitive, language, and learning disabilities

**Current compliance** (already implemented):
- File input has associated `<label for="csv-file-input">` element
- Error region uses `role="alert" aria-live="polite"`
- Results table includes `<caption>` element for screen readers

**v1.1 requirements**:
- Maintain existing label/alert/caption affordances
- Clear button must be keyboard accessible (default for `<button>`)
- Clear button must have `type="button"` to prevent form submission

**Note**: SC 3.3.2 focuses on *presence* of labels/instructions, not correct markup (covered by SC 1.3.1) or descriptive quality (covered by SC 2.4.6).

---

## 4. ARIA Alert Role Semantics

### Alert Role Definition

Per WAI-ARIA 1.2 specification [4]:

**Role**: `alert`
- **Implicit `aria-live`**: `assertive` (interrupts screen reader)
- **Implicit `aria-atomic`**: `true` (reads entire region)
- **Use case**: Important, time-sensitive information

**Current implementation**:
```tsx
<div role="alert" aria-live="polite">{error}</div>
```

**Behavior**:
- Explicitly sets `aria-live="polite"` (queues announcement rather than interrupting)
- This is a valid pattern; authors may override implicit values for better UX
- "Polite" is appropriate for CSV validation errors (important but not urgent)

**v1.1 decision**: Keep existing `role="alert" aria-live="polite"` unchanged. The combination provides:
1. Semantic meaning (`role="alert"` indicates error/warning content)
2. Non-interruptive announcement (`aria-live="polite"` queues message)
3. Complete message reading (`aria-atomic="true"` implicit from `alert` role)

---

## 5. React XSS Protection (2025 Status)

### Default Protections

React 18/19 provides XSS protection through automatic escaping [5]:

**Safe by default**:
- All values embedded in JSX expressions are escaped before rendering
- Example: `<td>{item.provider}</td>` safely renders `<script>alert('xss')</script>` as literal text

**Dangerous APIs** that bypass protection:
- `dangerouslySetInnerHTML` (explicitly named for the risk)
- Direct DOM manipulation via refs
- `javascript:` URLs in `href` attributes

### Current Implementation Analysis

**Import.tsx review**:
- ✅ All data rendering uses JSX text interpolation (`{variable}`)
- ✅ No `dangerouslySetInnerHTML` usage
- ✅ No inline event handlers with user data
- ✅ No `href` or `src` attributes with user-supplied URLs

**v1.1 impact**:
- No changes to rendering logic
- Clear button adds only UI control (no new data rendering)
- Currency validation adds string comparison (no DOM manipulation)

**Conclusion**: React's default XSS protections are sufficient; no additional sanitization required for this patch.

---

## 6. Date Validation (Luxon Rationale)

### Current Implementation

Uses `luxon` library for date validation:

```typescript
const dt = DateTime.fromISO(dueISO, { zone: 'America/New_York' });
if (!dt.isValid) {
  throw new Error(`Invalid date in row ${rowNum}: ${dueISO}`);
}
```

### Why Luxon (Prior Decision)

**Benefits** (unchanged in v1.1):
1. **Real calendar validation**: Catches invalid dates like 2025-13-45, 2025-02-30, 2025-04-31
2. **Timezone awareness**: Properly handles DST transitions for risk detection
3. **Immutability**: Functional API reduces bugs vs. native `Date` object
4. **ISO 8601 parsing**: Strict format validation for YYYY-MM-DD strings

**Alternatives considered** (not changing):
- Native `Date`: Accepts invalid dates via auto-correction (e.g., Feb 30 → Mar 2)
- Regex-only: Cannot validate calendar rules (leap years, month lengths)
- date-fns: Similar capability; Luxon already in use for timezone features

**v1.1 scope**: Date validation logic remains unchanged; currency validation adds a parallel check.

---

## Summary: Research-Driven Decisions

| Decision | Rationale | Source |
|----------|-----------|--------|
| Pattern-only currency validation (`^[A-Z]{3}$`) | Client-only; avoids code list drift; catches formatting errors | [1] ISO 4217 |
| No formula injection changes | React text rendering already safe; no CSV export | [2] OWASP |
| Maintain label/alert/caption | Already WCAG 2.2 Level A compliant | [3] WCAG |
| Keep `aria-live="polite"` on alert | Appropriate for non-urgent validation errors | [4] WAI-ARIA |
| No XSS sanitization needed | React default escaping sufficient; no `dangerouslySetInnerHTML` | [5] React docs |
| Luxon for dates (unchanged) | Real calendar validation with timezone support | Prior research |

---

## Open Questions / Future Work

None for v1.1 scope. The following are explicitly **out of scope**:

- ❌ ISO 4217 allowlist validation (pattern-only sufficient for patch)
- ❌ Analytics/instrumentation (tracked in MMT-12)
- ❌ Design/visual restyle (UI stable except Clear button addition)
- ❌ ICS calendar enhancements (no changes to export logic)

---

**End of Research Notes**
