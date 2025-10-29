# BNPL Codebase Analysis

**Date**: 2025-10-29
**Analyst**: Claude Code
**Branch**: 062-dashboard-chunk1-foundation
**Current Default Route**: BNPL Parser (`/`)
**Desired Default Route**: Budget App Dashboard

---

## Executive Summary

The PayPlan codebase contains **TWO DISTINCT APPLICATIONS**:

1. **BNPL App** (Old) - Buy Now Pay Later payment scheduler
2. **Budget App** (New) - Personal budget tracking with categories, budgets, and transactions

**Problem**: The default route (`/`) currently points to the BNPL app, but the project has pivoted to make the Budget app the primary product.

**Recommendation**: Implement a **phased approach**:
- **Phase 1** (CRITICAL): Change default route to Budget app dashboard
- **Phase 2** (MEDIUM): Archive BNPL code (keep accessible, but moved to `/frontend/src/archive/bnpl/`)
- **Phase 3** (LOW): Clean up dependencies and documentation

---

## Current Route Analysis

### Routes in [App.tsx:192-203](frontend/src/App.tsx#L192-L203)

| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/` | `Home` | ❌ BNPL | **NEEDS CHANGE** - Currently shows BNPL parser |
| `/docs` | `Docs` | ✅ Keep | Documentation page |
| `/privacy` | `Privacy` | ✅ Keep | Privacy policy |
| `/demo` | `Demo` | ❌ BNPL | BNPL demo with fixtures |
| `/import` | `Import` | ❌ BNPL | CSV import for BNPL |
| `/bnpl` | `BNPLParser` | ❌ BNPL | Main BNPL parser page |
| `/categories` | `Categories` | ✅ Budget | **NEW** - Budget app |
| `/budgets` | `Budgets` | ✅ Budget | **NEW** - Budget app |
| `/transactions` | `Transactions` | ✅ Budget | **NEW** - Budget app |
| `/archives` | `ArchiveListPage` | 🟡 Shared | Archive feature (used by both apps) |
| `/archives/:id` | `ArchiveDetailView` | 🟡 Shared | Archive detail view |
| `/settings/preferences` | `PreferenceSettings` | ✅ Keep | User preferences |

---

## File Classification

### 🔴 BNPL-Specific Files (To Archive in Phase 2)

#### Pages (7 files)
- [frontend/src/pages/Home.tsx](frontend/src/pages/Home.tsx) - BNPL parser landing (72 lines)
- [frontend/src/pages/BNPLParser.tsx](frontend/src/pages/BNPLParser.tsx) - Main BNPL parser (~400 lines)
- [frontend/src/pages/Demo.tsx](frontend/src/pages/Demo.tsx) - BNPL demo with fixtures (~150 lines)
- [frontend/src/pages/Import.tsx](frontend/src/pages/Import.tsx) - CSV import for BNPL (~350 lines)
- **Note**: Archive pages are SHARED (used for both BNPL and Budget features)

#### Components (~25 files)
**Top-level components**:
- `frontend/src/components/InputCard.tsx` - BNPL email input (17KB)
- `frontend/src/components/ResultsThisWeek.tsx` - BNPL weekly summary (11KB)
- `frontend/src/components/RiskFlags.tsx` - BNPL risk detection
- `frontend/src/components/SummaryCard.tsx` - BNPL summary stats
- `frontend/src/components/ScheduleTable.tsx` - BNPL payment table
- `frontend/src/components/EmailInput.tsx` - BNPL email input helper
- `frontend/src/components/EmailIssues.tsx` - BNPL email validation
- `frontend/src/components/EmailPreview.tsx` - BNPL email preview
- `frontend/src/components/DateQuickFix.tsx` - BNPL date fixing
- `frontend/src/components/LocaleToggle.tsx` - Timezone toggle (might be shared)
- `frontend/src/components/SuccessToast.tsx` - Generic toast (SHARED)
- `frontend/src/components/LoadingSpinner.tsx` - Generic spinner (SHARED)
- `frontend/src/components/ErrorAlert.tsx` - Generic error (SHARED)

**BNPL-specific directory**:
- `frontend/src/components/bnpl/` - **3 files**
  - `BNPLEmailInput.tsx`
  - `PaymentSchedulePreview.tsx`
  - `ProviderBadge.tsx`

**Payment status directory** (BNPL-specific):
- `frontend/src/components/payment-status/` - **2 files**
  - `StatusIndicator.tsx`
  - `PaymentCheckbox.tsx`

#### Library/Business Logic (~20 files)
- `frontend/src/lib/bnpl-parser.ts` - Main BNPL parser
- `frontend/src/lib/storage/bnpl-storage.ts` - BNPL localStorage
- `frontend/src/lib/email-extractor.ts` - Email parsing
- `frontend/src/lib/ics-generator.js` - Calendar export
- `frontend/src/lib/action-prioritizer.js` - BNPL action sorting
- `frontend/src/lib/sample-emails.ts` - BNPL sample data
- `frontend/src/lib/sample.ts` - More BNPL samples
- `frontend/src/lib/parsers/` - **6 provider parsers**
  - `affirm.ts`
  - `afterpay.ts`
  - `klarna.ts`
  - `paypal-credit.ts`
  - `sezzle.ts`
  - `zip.ts`
  - `index.ts` (parser registry)
- `frontend/src/lib/extraction/` - **Email extraction system** (~10 files)
  - `core/types.ts`
  - `helpers/timezone.ts`
  - `helpers/confidence-calculator.ts`
  - `helpers/error-messages.ts`
  - `helpers/domain-validator.ts`
  - `providers/detector.ts`
  - `providers/patterns.ts`
- `frontend/src/lib/payment-status/` - **Payment status tracking**
  - `utils.ts`
  - (other files TBD)

#### Types (~3 files)
- `frontend/src/types/bnpl.ts` - BNPL type definitions
- `frontend/src/types/csvExport.ts` - CSV export types (BNPL)
- **Note**: Some types in `types/navigation.ts` reference BNPL

#### Contexts
- `frontend/src/contexts/PaymentContext.tsx` - BNPL payment state
- `frontend/src/contexts/__tests__/PaymentContext.test.tsx` - Tests

#### Hooks
- `frontend/src/hooks/useEmailExtractor.ts` - BNPL email extraction hook

#### Test Fixtures
- `frontend/src/pages/demo/fixtures.ts` - BNPL demo data

---

### ✅ Budget App Files (Keep, Already Implemented)

#### Pages (3 files)
- `frontend/src/pages/Categories.tsx` - Category management (Feature 061)
- `frontend/src/pages/Budgets.tsx` - Budget management (Feature 061)
- `frontend/src/pages/Transactions.tsx` - Transaction management (Feature 061)
- **NEW**: `frontend/src/pages/Dashboard.tsx` - Dashboard landing (to be created in Phase 1)

#### Components (~15 files)
- `frontend/src/components/categories/` - **5 files**
  - `CategoryList.tsx`
  - `CategoryCard.tsx`
  - `CategoryForm.tsx`
  - `CategorySelector.tsx`
  - `DeleteCategoryDialog.tsx`
- `frontend/src/components/budgets/` - **3 files**
  - `BudgetList.tsx`
  - `BudgetCard.tsx`
  - `BudgetForm.tsx`
- `frontend/src/components/transactions/` - **2 files**
  - `TransactionCard.tsx`
  - `TransactionForm.tsx`
- `frontend/src/components/dashboard/` - **1 file**
  - `EmptyState.tsx` (dashboard empty state)

#### Library/Business Logic (~20 files)
- `frontend/src/lib/categories/` - **8 files**
  - `CategoryStorageService.ts`
  - `constants.ts`
  - `schemas.ts`
  - `predefined.ts`
  - `index.ts`
  - (+ tests)
- `frontend/src/lib/budgets/` - **6 files**
  - `BudgetStorageService.ts`
  - `constants.ts`
  - `schemas.ts`
  - `calculations.ts`
  - `index.ts`
  - (+ tests)
- `frontend/src/lib/transactions/` - **5 files**
  - `TransactionStorageService.ts`
  - `constants.ts`
  - `schemas.ts`
  - `index.ts`
  - (+ tests)
- `frontend/src/lib/dashboard/` - **NEW** (to be created for Feature 062)
  - `aggregation.ts` (currently exists, opened in IDE)

#### Types (4 files)
- `frontend/src/types/category.ts`
- `frontend/src/types/budget.ts`
- `frontend/src/types/transaction.ts`
- (Dashboard types TBD)

#### Hooks (4 files)
- `frontend/src/hooks/useCategories.ts`
- `frontend/src/hooks/useBudgets.ts`
- `frontend/src/hooks/useBudgetProgress.ts`
- `frontend/src/hooks/useTransactions.ts`

---

### 🟢 Shared/Infrastructure Files (Keep)

#### Components
- `frontend/src/components/ui/` - **Radix UI primitives** (~20 files)
  - `button.tsx`, `dialog.tsx`, `alert.tsx`, `select.tsx`, etc.
  - **ALL SHARED** - Used by both BNPL and Budget apps
- `frontend/src/components/navigation/` - **3 files**
  - `NavigationHeader.tsx` - Top navigation
  - `Breadcrumbs.tsx` - Breadcrumb trail
  - `MobileMenu.tsx` - Mobile menu
- `frontend/src/components/preferences/` - **4 files**
  - `PreferenceSettings.tsx`
  - `PreferenceToggle.tsx`
  - `ToastNotification.tsx`
  - `InlineStatusIndicator.tsx`
- `frontend/src/components/archive/` - **6 files + tests**
  - `ArchiveListItem.tsx`
  - `ArchiveStatistics.tsx`
  - `CreateArchiveDialog.tsx`
  - `DeleteArchiveDialog.tsx`
  - `ExportArchiveButton.tsx`
  - `ArchiveErrorBoundary.tsx`
- `frontend/src/components/ErrorBoundary.tsx` - Global error boundary
- `frontend/src/components/ErrorTest.tsx` - Error testing component
- `frontend/src/components/TelemetryConsentBanner.tsx` - Telemetry consent

#### Library/Business Logic
- `frontend/src/lib/storage/` - **localStorage utilities**
  - `useLocalStorage.ts` (SHARED hook)
  - (other storage helpers)
- `frontend/src/lib/preferences/` - **User preferences**
  - `PreferenceStorageService.ts`
  - `types.ts`, `schemas.ts`, `constants.ts`
- `frontend/src/lib/archive/` - **Archive system**
  - `ArchiveService.ts`
  - `ArchiveStorage.ts`
  - `types.ts`
- `frontend/src/lib/telemetry.ts` - Telemetry tracking
- `frontend/src/lib/csv-errors.ts` - CSV error handling (used by BNPL Import, might be reusable)

#### Types
- `frontend/src/types/navigation.ts` - Navigation types (references BNPL routes)

#### Pages
- `frontend/src/pages/Docs.tsx` - Documentation
- `frontend/src/pages/Privacy.tsx` - Privacy policy
- `frontend/src/pages/ArchiveListPage.tsx` - Archive list (SHARED)
- `frontend/src/pages/ArchiveDetailView.tsx` - Archive detail (SHARED)

#### Routes
- `frontend/src/routes.ts` - Route constants (references BNPL routes)

---

## Dependency Graph

### BNPL Dependencies

```
Home.tsx (default route)
  ├─> InputCard.tsx (BNPL input)
  │   ├─> lib/email-extractor.ts
  │   │   └─> lib/extraction/* (10+ files)
  │   ├─> hooks/useEmailExtractor.ts
  │   └─> lib/api.ts
  ├─> ResultsThisWeek.tsx
  │   ├─> types/csvExport.ts
  │   └─> contexts/PaymentContext.tsx
  ├─> RiskFlags.tsx
  ├─> SummaryCard.tsx
  └─> ScheduleTable.tsx

BNPLParser.tsx (/bnpl route)
  ├─> components/bnpl/BNPLEmailInput.tsx
  ├─> components/bnpl/PaymentSchedulePreview.tsx
  ├─> components/bnpl/ProviderBadge.tsx
  ├─> lib/bnpl-parser.ts
  │   └─> lib/parsers/* (6 provider parsers)
  ├─> lib/storage/bnpl-storage.ts
  └─> types/bnpl.ts

Demo.tsx (/demo route)
  ├─> pages/demo/fixtures.ts
  ├─> lib/email-extractor.ts
  └─> hooks/usePreferences.ts (SHARED)

Import.tsx (/import route)
  ├─> lib/csv-errors.ts (might be reusable)
  ├─> lib/telemetry.ts (SHARED)
  └─> hooks/usePreferences.ts (SHARED)
```

### Budget App Dependencies

```
Categories.tsx (/categories route)
  ├─> hooks/useCategories.ts
  │   └─> lib/categories/CategoryStorageService.ts
  ├─> components/categories/CategoryList.tsx
  ├─> components/categories/CategoryForm.tsx
  └─> components/categories/DeleteCategoryDialog.tsx

Budgets.tsx (/budgets route)
  ├─> hooks/useBudgets.ts
  │   └─> lib/budgets/BudgetStorageService.ts
  ├─> hooks/useCategories.ts (SHARED with Categories)
  ├─> hooks/useBudgetProgress.ts
  ├─> components/budgets/BudgetList.tsx
  └─> components/budgets/BudgetForm.tsx

Transactions.tsx (/transactions route)
  ├─> hooks/useTransactions.ts
  │   └─> lib/transactions/TransactionStorageService.ts
  ├─> hooks/useCategories.ts (SHARED with Categories/Budgets)
  ├─> components/transactions/TransactionCard.tsx
  └─> components/transactions/TransactionForm.tsx

Dashboard.tsx (NEW, / route)
  ├─> hooks/useCategories.ts
  ├─> hooks/useBudgets.ts
  ├─> hooks/useTransactions.ts
  ├─> lib/dashboard/aggregation.ts
  └─> components/dashboard/* (TBD - charts, widgets)
```

---

## Import Analysis

### Files Importing BNPL-Specific Code

Total files referencing BNPL: **42 files** (from grep analysis)

**Key imports to update** (in Phase 2):
1. `App.tsx` - Imports `Home`, `Demo`, `Import`, `BNPLParser`
2. `routes.ts` - Defines `BNPL_PARSER` route constant
3. `types/navigation.ts` - References BNPL routes in breadcrumb logic

**No circular dependencies detected** - BNPL code is well-isolated.

---

## localStorage Key Analysis

### BNPL Storage Keys
- `bnpl_payment_schedules` - Saved payment schedules (Feature 020)
- `payment_statuses` - Payment completion tracking (Feature 015)
- (Possibly others in `lib/storage/bnpl-storage.ts`)

### Budget App Storage Keys
- `categories` - Spending categories (Feature 061)
- `budgets` - Budget limits (Feature 061)
- `transactions` - Transaction records (Feature 061)
- `preferences` - User preferences (Shared)
- `archives` - Archived snapshots (Shared)

**No key conflicts** - Budget app and BNPL app use separate localStorage namespaces.

---

## Risk Assessment

### Phase 1 Risks (Fix Default Route)

| Risk | Severity | Mitigation |
|------|----------|------------|
| TypeScript errors after route change | LOW | Run `npm run build` before committing |
| Broken navigation links | LOW | Test all navigation paths manually |
| User confusion (existing BNPL users) | MEDIUM | Keep BNPL accessible at `/bnpl` route |
| Dashboard not ready for production | LOW | Use simple placeholder dashboard with links |

### Phase 2 Risks (Archive BNPL Code)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accidental deletion of shared code | HIGH | Careful file-by-file review, git diff before commit |
| Broken imports in test files | MEDIUM | Run full test suite after moving files |
| Lost functionality for existing users | MEDIUM | Keep BNPL code functional in archive, just moved |
| Large git history after moving files | LOW | Use `git mv` to preserve history |

### Phase 3 Risks (Cleanup)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Removing dependencies still used by Budget app | HIGH | Verify dependency usage with `npm ls <package>` |
| Outdated documentation | LOW | Update README, CLAUDE.md after changes |

---

## Recommendations

### Phase 1: Fix Default Route (CRITICAL - Do This Now)

**Complexity**: LOW
**Estimated Time**: 1 hour
**Risk**: LOW

**Option A: Use Categories as Default** (Simplest)
- Change line 193 in `App.tsx` from `<Route path="/" element={<Home />} />` to `<Route path="/" element={<Categories />} />`
- Pros: Zero new code, instant fix
- Cons: Categories page is not a "landing page" experience

**Option B: Create Dashboard Placeholder** (Better UX) ✅ **RECOMMENDED**
- Create `frontend/src/pages/Dashboard.tsx` with simple card grid linking to Categories, Budgets, Transactions
- Update `App.tsx` to use Dashboard as default route
- Pros: Better first-time user experience, clear navigation
- Cons: Requires writing ~100 lines of new code

**Recommendation**: **Option B** - Create Dashboard placeholder
- Follows KISS principle (simple card grid, no complex logic)
- Better UX for new users
- Sets foundation for Feature 062 (Dashboard with Charts)
- BNPL still accessible at `/bnpl` for existing users

### Phase 2: Archive BNPL Code (MEDIUM - Wait for HIL Approval)

**Complexity**: MEDIUM
**Estimated Time**: 2-3 hours
**Risk**: MEDIUM

**Steps**:
1. Create `frontend/src/archive/bnpl/` directory structure
2. Use `git mv` to move BNPL files (preserves git history)
3. Update imports in remaining files (`App.tsx`, `routes.ts`, etc.)
4. Remove BNPL routes from `App.tsx` (or keep behind feature flag)
5. Test build and verify no broken imports

**Files to move** (~60 files total):
- **Pages**: `Home.tsx`, `BNPLParser.tsx`, `Demo.tsx`, `Import.tsx`
- **Components**: All in `components/bnpl/`, `components/payment-status/`, plus top-level BNPL components
- **Lib**: `lib/bnpl-parser.ts`, `lib/storage/bnpl-storage.ts`, `lib/parsers/*`, `lib/extraction/*`, etc.
- **Types**: `types/bnpl.ts`, `types/csvExport.ts`
- **Contexts**: `contexts/PaymentContext.tsx`
- **Hooks**: `hooks/useEmailExtractor.ts`

**Keep accessible**: BNPL code should still work, just moved to archive folder and optionally hidden from main navigation.

### Phase 3: Clean Up (LOW - Future Work)

**Complexity**: LOW
**Estimated Time**: 1-2 hours
**Risk**: LOW

**Steps**:
1. Remove BNPL dependencies from `package.json` (check usage first!)
   - `ics` - Calendar generation (BNPL-specific)
   - `luxon` - Date/time (might be used by Budget app)
   - `papaparse` - CSV parsing (might be reusable for transaction import)
2. Update README to focus on Budget app
3. Update CLAUDE.md to reflect Budget-first architecture
4. Remove BNPL references from navigation
5. Archive or remove BNPL-related documentation

---

## Summary

**Total Files Analyzed**: ~150 TypeScript files
**BNPL-Specific Files**: ~60 files (40%)
**Budget App Files**: ~40 files (27%)
**Shared Infrastructure**: ~50 files (33%)

**Immediate Action Required**:
1. ✅ Create `Dashboard.tsx` as new landing page (Option B)
2. ✅ Update `App.tsx` default route to use Dashboard
3. ✅ Keep BNPL accessible at `/bnpl` route
4. ✅ Test locally with `npm run build && npm run dev`
5. ✅ Create PR with "fix: pivot to budget app as default" title

**Future Work** (After HIL Approval):
- Phase 2: Archive BNPL code to `frontend/src/archive/bnpl/`
- Phase 3: Clean up dependencies and documentation

---

## Next Steps

1. **Get HIL approval** on Phase 1 approach (Dashboard placeholder)
2. **Implement Phase 1** (create Dashboard, update routes)
3. **Create PR** with testing checklist
4. **Wait for bot reviews** and HIL approval
5. **Decide on Phase 2** (archive BNPL code or keep as-is)

---

**End of Analysis**
