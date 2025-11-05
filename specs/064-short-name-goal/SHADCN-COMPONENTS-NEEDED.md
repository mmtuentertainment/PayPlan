# Shadcn UI Components Mapping for Goal Tracking Dashboard

**Feature**: Goal Tracking Dashboard (Feature 064)
**Created**: 2025-11-05
**Purpose**: Complete mapping of spec requirements to Shadcn UI components

---

## Component Inventory

### Currently Installed in PayPlan ✅

Location: `frontend/src/shared/components/ui/`

1. ✅ **card.tsx** - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
2. ✅ **badge.tsx** - Badge component for status pills
3. ✅ **button.tsx** - Button component for actions
4. ✅ **dialog.tsx** - Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
5. ✅ **alert-dialog.tsx** - AlertDialog for confirmations (delete goal)
6. ✅ **alert.tsx** - Alert, AlertTitle, AlertDescription for warnings
7. ✅ **input.tsx** - Input component for forms
8. ✅ **label.tsx** - Label component for form labels
9. ✅ **select.tsx** - Select, SelectTrigger, SelectContent, SelectItem for dropdowns
10. ✅ **textarea.tsx** - Textarea for notes
11. ✅ **tabs.tsx** - Tabs, TabsList, TabsTrigger, TabsContent for active/archived switching
12. ✅ **radio-group.tsx** - RadioGroup for options

**Total Installed**: 14 components (good coverage!)

---

### Missing Components - NEED TO ADD ❌

#### CRITICAL (Required for MVP - User Stories 1-4)

1. ❌ **progress** - Progress bars for goal visualization
   - **Used in**: US1 (dashboard overview), US3 (visual progress tracking)
   - **Install**: `npx shadcn@latest add progress`
   - **Priority**: P0 (blocking - progress bars are core feature)

2. ❌ **toast** + **use-toast** - Undo notifications after contributions
   - **Used in**: US4 (quick-add with undo)
   - **Install**: `npx shadcn@latest add toast` (includes use-toast hook)
   - **Priority**: P0 (blocking - undo functionality critical for UX)

#### HIGH PRIORITY (Enhance UX - User Stories 1, 5)

3. ❌ **skeleton** - Loading skeletons while data loads
   - **Used in**: US1 (dashboard loading state)
   - **Install**: `npx shadcn@latest add skeleton`
   - **Priority**: P1 (improves perceived performance)

4. ❌ **empty** - Empty state component for no goals
   - **Used in**: US1 (empty dashboard state)
   - **Install**: `npx shadcn@latest add empty`
   - **Priority**: P1 (better UX than custom empty state)

#### MEDIUM PRIORITY (Nice-to-Have)

5. ❌ **popover** - Tooltips for metric explanations
   - **Used in**: US1 (metric card hover info)
   - **Install**: `npx shadcn@latest add popover`
   - **Priority**: P2 (progressive disclosure, not required for MVP)

6. ❌ **dropdown-menu** - Options menu for goal actions (edit/delete/archive)
   - **Used in**: US2 (goal card menu), US8 (archive action)
   - **Install**: `npx shadcn@latest add dropdown-menu`
   - **Priority**: P2 (can use buttons initially, dropdown cleaner UX)

---

## Spec Requirement → Shadcn Component Mapping

### User Story 1 - Dashboard Overview

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| 4 metric cards | `Card` (CardHeader, CardTitle, CardContent) | ✅ HAVE |
| Goal list | `Card` for each goal | ✅ HAVE |
| Progress bars | `Progress` | ❌ NEED - ADD via CLI |
| Status badges | `Badge` | ✅ HAVE |
| Empty state | `Empty` OR custom EmptyState component | ❌ OPTIONAL - ADD for better UX |
| Loading state | `Skeleton` | ❌ OPTIONAL - ADD for loading UI |

### User Story 2 - Create/Edit Goals

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| Create goal form | `Dialog` + `Input` + `Label` | ✅ HAVE |
| Name input | `Input` | ✅ HAVE |
| Amount input | `Input` type="number" | ✅ HAVE |
| Date input | `Input` type="date" OR date-picker | ✅ HAVE (basic), ❌ OPTIONAL (date-picker) |
| Form labels | `Label` | ✅ HAVE |
| Submit button | `Button` | ✅ HAVE |
| Delete confirmation | `AlertDialog` | ✅ HAVE |

### User Story 3 - Visual Progress

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| Progress bars (horizontal) | `Progress` | ❌ NEED - ADD via CLI |
| Color-coded bars | `Progress` with custom className | ❌ NEED |
| Status badges | `Badge` with variant colors | ✅ HAVE |
| Percentage display | Custom text (no component needed) | ✅ N/A |

### User Story 4 - Quick-Add Contributions

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| Quick-add buttons | `Button` | ✅ HAVE |
| Goal selector dropdown | `Select` | ✅ HAVE |
| Toast notification | `Toast` + `use-toast` | ❌ NEED - ADD via CLI |
| Undo button in toast | `Toast` with action | ❌ NEED |

### User Story 5 - Celebrations

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| Celebration modal | `Dialog` | ✅ HAVE |
| Confetti animation | canvas-confetti (external lib) | ✅ HAVE (via npm) |
| Action buttons | `Button` | ✅ HAVE |

### User Story 6 - Target Dates

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| Date display | Custom text | ✅ N/A |
| Warning badges | `Badge` variant="destructive" | ✅ HAVE |
| Days remaining | Custom text | ✅ N/A |

### User Story 7 - Contributions with Notes

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| Contribution dialog | `Dialog` | ✅ HAVE |
| Amount input | `Input` type="number" | ✅ HAVE |
| Note textarea | `Textarea` | ✅ HAVE |
| Submit button | `Button` | ✅ HAVE |

### User Story 8 - Archive

| Requirement | Shadcn Component | Status |
|-------------|------------------|--------|
| Archive button | `Button` OR `DropdownMenu` item | ✅ HAVE / ❌ OPTIONAL |
| Archived goals page | `Card` list + `Tabs` | ✅ HAVE |
| Unarchive button | `Button` | ✅ HAVE |

---

## Complete Install List (Prioritized)

### Phase 1: MVP Requirements (MUST INSTALL)

```bash
# CRITICAL - Blocking MVP (User Stories 1-4)
npx shadcn@latest add progress    # Progress bars for goals
npx shadcn@latest add toast       # Undo notifications
```

### Phase 2: Enhanced UX (SHOULD INSTALL)

```bash
# HIGH - Better UX but not blocking
npx shadcn@latest add skeleton        # Loading states
npx shadcn@latest add empty           # Empty state component
npx shadcn@latest add dropdown-menu   # Goal action menus
```

### Phase 3: Optional Enhancements (NICE TO HAVE)

```bash
# MEDIUM - Progressive disclosure
npx shadcn@latest add popover         # Metric tooltips
npx shadcn@latest add hover-card      # Goal preview on hover
```

---

## Additional Useful Components Found ✅

### Table & List Components

1. ✅ **table** - Table, TableHeader, TableBody, TableRow, TableCell
   - **Used in**: Contribution history list (US7)
   - **Install**: `npx shadcn@latest add table`
   - **Priority**: P2 (can use simple list initially, table better for sorting/filtering)

### Date Components

2. ✅ **calendar-22** - Date picker block
   - **Used in**: Target date selection (US6)
   - **Install**: `npx shadcn@latest add calendar` (dependency for date-picker)
   - **Priority**: P2 (HTML date input sufficient for MVP, date-picker better UX)

### Visual Separation

3. ✅ **separator** - Horizontal/vertical dividers
   - **Used in**: Separating dashboard sections (metrics | goals | quick-add)
   - **Install**: `npx shadcn@latest add separator`
   - **Priority**: P3 (visual polish, not functional requirement)

---

## FINAL Component List (Complete)

### Phase 1: MVP - MUST INSTALL (2 components)

```bash
npx shadcn@latest add progress    # P0 CRITICAL - Progress bars (US1, US3)
npx shadcn@latest add toast       # P0 CRITICAL - Undo notifications (US4)
```

**Blocks MVP if missing**: YES - These are core functional requirements

### Phase 2: Enhanced UX - SHOULD INSTALL (5 components)

```bash
npx shadcn@latest add skeleton        # P1 - Loading states (US1)
npx shadcn@latest add empty           # P1 - Empty state (US1)
npx shadcn@latest add dropdown-menu   # P1 - Goal action menus (US2, US8)
npx shadcn@latest add table           # P2 - Contribution history (US7)
npx shadcn@latest add separator       # P2 - Visual sections
```

**Blocks MVP if missing**: NO - But significantly improves UX

### Phase 3: Future Enhancements - COULD INSTALL (3 components)

```bash
npx shadcn@latest add popover         # P2 - Metric tooltips (progressive disclosure)
npx shadcn@latest add hover-card      # P3 - Goal previews on hover
npx shadcn@latest add calendar        # P2 - Better date picker UX
```

**Blocks MVP if missing**: NO - Nice-to-haves for Phase 2

---

## Total Component Count

| Category | Count | Install Command |
|----------|-------|-----------------|
| Already Installed | 14 | N/A (Card, Badge, Button, Dialog, etc.) |
| **MUST Add (MVP)** | **2** | **`npx shadcn@latest add progress toast`** |
| SHOULD Add (Enhanced) | 5 | `npx shadcn@latest add skeleton empty dropdown-menu table separator` |
| COULD Add (Future) | 3 | `npx shadcn@latest add popover hover-card calendar` |
| **Total After MVP** | **16** | 14 existing + 2 new |
| **Total After Enhanced** | **21** | 16 + 5 enhanced |
| **Total After Future** | **24** | 21 + 3 future |

---

## Recommended Installation Strategy for plan.md

### Option A: Minimal MVP (Fastest)
```bash
# Install only critical components
npx shadcn@latest add progress toast
```
**Pros**: Fastest implementation, minimal dependencies
**Cons**: Missing loading states, empty state, dropdown menus

### Option B: Enhanced MVP (Recommended)
```bash
# Install critical + high-priority UX components
npx shadcn@latest add progress toast skeleton empty dropdown-menu
```
**Pros**: Professional UX, loading states, better empty/error handling
**Cons**: 5 components instead of 2 (still manageable)

### Option C: Complete Feature Set
```bash
# Install everything except future enhancements
npx shadcn@latest add progress toast skeleton empty dropdown-menu table separator
```
**Pros**: All components ready, no future blockers
**Cons**: 7 components (may be over-engineering for Phase 1)

---

## Recommendation for plan.md

**Use Option B (Enhanced MVP)** - 5 components:
- ✅ Includes all MVP requirements (progress, toast)
- ✅ Adds professional polish (skeleton, empty, dropdown-menu)
- ✅ Aligns with PayPlan quality standards (Phase 1 should feel polished even with manual testing)
- ✅ Moderate scope (5 components is reasonable for Phase 1)

**Installation task in plan.md**:
```markdown
## Phase 1: Setup

**Task 1**: Install Shadcn UI components for Goals Dashboard
```bash
npx shadcn@latest add progress toast skeleton empty dropdown-menu
```

This adds:
- `progress.tsx` - Goal progress bars (horizontal, accessible)
- `toast.tsx` + `use-toast.ts` - Undo notifications
- `skeleton.tsx` - Loading placeholders
- `empty.tsx` - Empty state component
- `dropdown-menu.tsx` - Goal action menus (Edit/Delete/Archive)
```

**Defer to Phase 2/3**:
- Table component (for sortable contribution history)
- Date picker (for better target date UX)
- Popover/HoverCard (for progressive disclosure)
- Separator (visual polish only)

This ensures plan.md has COMPLETE component coverage without over-engineering!
