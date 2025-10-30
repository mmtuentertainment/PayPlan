# Phase 0 Research: Dashboard with Charts

**Feature**: Dashboard with Charts (062-short-name-dashboard)  
**Created**: 2025-10-29  
**Status**: Research Complete ✓

---

## Research Methodology

This research was conducted using:
- **Context7 MCP Server**: For library documentation (Recharts)
- **Web Search**: For UX patterns, performance benchmarks, gamification best practices
- **Detailed Documentation**: All findings saved in `research-docs/` folder

---

## 1. Recharts Best Practices for Accessibility

**Source**: [`research-docs/recharts-accessibility.md`](./research-docs/recharts-accessibility.md)

### Key Findings

**Recharts 3.0+ Built-in Accessibility**:
- ✅ Keyboard navigation (Tab, Arrow keys, Enter/Space) - **Default enabled**
- ❌ ARIA labels - **Must add manually**
- ❌ ARIA roles - **Must add manually**
- ❌ Screen reader descriptions - **Must add manually**

**WCAG 2.1 AA Compliance Checklist**:
1. **Keyboard Navigation**: ✅ Built-in (Recharts 3.0+)
2. **ARIA Labels**: ❌ Must add to all chart components
3. **ARIA Roles**: ❌ Must add `role="img"` or `role="graphics-document"` to SVGs
4. **Color Contrast**: ❌ Must ensure 4.5:1 text, 3:1 chart segments (manual testing)
5. **Data Table Alternative**: ❌ Must provide `<table>` for screen readers
6. **Focus Indicators**: ❌ Must ensure visible focus states (CSS)
7. **Reduced Motion**: ❌ Must respect `prefers-reduced-motion` (CSS)

### Implementation Pattern

```tsx
function AccessiblePieChart({ data }: { data: ChartData[] }) {
  return (
    <div role="region" aria-label="Spending breakdown by category">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart aria-label="Pie chart showing spending by category">
          <Pie data={data} dataKey="value" nameKey="name" />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Hidden table alternative for screen readers */}
      <table className="sr-only" aria-label="Spending data">
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>${item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Action Items for Implementation

1. Wrap all Recharts components in `<div role="region" aria-label="...">` containers
2. Add `aria-label` to all chart components (`<PieChart>`, `<BarChart>`, etc.)
3. Provide hidden `<table>` alternatives using `.sr-only` Tailwind class
4. Test with NVDA (Windows) and VoiceOver (Mac) screen readers
5. Use high-contrast colors (4.5:1 text, 3:1 chart segments) from Tailwind palette
6. Implement keyboard focus styles with `focus:ring-2` utilities

---

## 2. Dashboard UX Patterns

**Source**: [`research-docs/dashboard-ux-patterns.md`](./research-docs/dashboard-ux-patterns.md)

### Key Findings

**Industry Context (2024)**:
- **Mint shutdown** (March 2024) created opportunity for privacy-focused alternatives
- **YNAB** is market leader but has UX barriers: 30+ min onboarding, $109/year, steep learning curve

**UX Best Practices**:

#### 1. Instant Visibility (<3 seconds to insight)
- Hero metric (net worth or total spending) large and prominent
- Color-coded status: green (good), yellow (warning), red (danger)
- 3-5 widgets max on initial view (avoid cognitive overload)

#### 2. Visual-First Design
- **22% increase** in budget adherence with visual dashboards vs. text-only
- Charts for trends, pie charts for categories, progress bars for goals
- Icons for quick scanning (category icons: groceries 🛒, transport 🚗)

#### 3. Gamification Elements
- **48% engagement increase** with gamification (Fortune City case study)
- Streaks ("7-day logging streak" 🔥)
- Achievements ("Paid off first BNPL loan!" 🏆)
- Personalized insights ("You saved $50 vs. last month" 💡)

#### 4. Widget Prioritization
- **P0 (Must-Have)**: Spending breakdown (pie), income vs. expenses (bar)
- **P1 (High-Value)**: Recent transactions, upcoming bills, goal progress
- **P2 (Nice-to-Have)**: Gamification, net worth graph, insights

#### 5. Performance Expectations
- Dashboard load: <1s (including data aggregation)
- Chart rendering: <500ms (including animations)
- Widget updates: <300ms (when data changes)

### PayPlan Competitive Advantages

Based on competitive analysis (YNAB, Monarch, PocketGuard):

1. **Privacy-First**: localStorage-only (no bank sync required) vs. competitors
2. **BNPL Tracking**: Unique widget for upcoming BNPL payments (differentiator)
3. **Free Core**: All dashboard widgets free vs. $99-$109/year competitors
4. **Visual-First**: Charts + gamification vs. YNAB's spreadsheet complexity
5. **Instant Onboarding**: <5 minutes vs. YNAB's 30+ minutes

---

## 3. Performance Optimization for Data Aggregation

**Source**: [`research-docs/react-performance-optimization.md`](./research-docs/react-performance-optimization.md)

### Key Findings

**useMemo Benchmarks** (10,000 transactions):
- **Without useMemo**: 1,200ms per render, 85% CPU usage, visible lag
- **With useMemo**: 300ms per render (**75% reduction**), 20% CPU usage, smooth

**When to Use useMemo**:
- ✅ Expensive calculations (array aggregations, filtering, sorting >100 items)
- ✅ Derived data (totals, averages, percentages)
- ✅ Chart data transformations (transaction → chart format)
- ❌ Cheap operations (simple arithmetic, string concatenation)

### Implementation Pattern

```tsx
function useDashboardData(transactions: Transaction[]) {
  // ✅ GOOD: Expensive aggregation cached with useMemo
  const spendingByCategory = useMemo(() => {
    return transactions
      .filter((t) => t.amount < 0) // Expenses only
      .reduce((acc, t) => {
        const category = t.categoryId || 'uncategorized';
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]); // Recalculate only when transactions change

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  return { spendingByCategory, monthlyIncome };
}
```

### React.memo for Widget Components

```tsx
// ✅ GOOD: Memoized component only re-renders when data changes
export const SpendingChart = React.memo(({ data }: { data: ChartData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" />
      </PieChart>
    </ResponsiveContainer>
  );
});

SpendingChart.displayName = 'SpendingChart';
```

### Virtualization (for 1,000+ items)

**Benchmark** (15,000 transactions):
- **Without virtualization**: 5,000ms initial render, 85% CPU usage
- **With react-window**: 150ms initial render (**97% improvement**), 15% CPU usage

**Action**: Defer virtualization to Phase 2 (most users have <1,000 transactions in Phase 1)

### Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| Dashboard load | <1s | useMemo for aggregations |
| Chart rendering | <500ms | React.memo for widgets |
| Widget updates | <300ms | Memoization + efficient state |
| Transaction list (1,000+ items) | <150ms | Virtualization (Phase 2) |
| localStorage read | <50ms | Debounced reads |

---

## 4. Gamification Algorithms

**Source**: [`research-docs/gamification-algorithms.md`](./research-docs/gamification-algorithms.md)

### Key Findings

**Behavioral Impact**:
- **48% higher daily active users** with gamification (Fortune City)
- **67.9% of users** report improved financial behavior
- **2.3x higher 90-day retention** vs. non-gamified apps

**Gamification Types**:

#### 1. Streak Tracking
- **Pattern**: Reward consecutive days of logging transactions
- **Algorithm**: Increment streak if user logged yesterday, reset if missed a day
- **UI**: "🔥 7-day streak!" with fire icon

#### 2. Achievement System
- **Pattern**: Unlock badges for milestones (e.g., "Paid off first BNPL loan")
- **Types**: First Transaction 🎉, Week Under Budget 🏆, BNPL Freedom 🎊
- **Defer to Phase 2**: Requires modal/popover UI (out of scope for Phase 1)

#### 3. Personalized Insights
- **Pattern**: Surface actionable insights (e.g., "You spent 20% less on dining!")
- **Algorithm**: Compare current month to previous month, detect trends
- **UI**: "💡 You saved $50 vs. last month"

#### 4. Recent Wins
- **Pattern**: Show recent positive actions (e.g., "Stayed under budget for Groceries")
- **Algorithm**: Detect large debt payments, under-budget categories
- **UI**: Show top 1-3 recent wins

### Phase 1 Implementation (MVP)

Focus on **simple gamification** with minimal UI:

1. **Streak tracking**: Show current streak in dashboard widget (1-2 lines)
2. **Recent wins**: Show 1-3 recent positive actions
3. **Personalized insights**: Show 1-2 spending insights

**Defer to Phase 2**:
- Achievement badges (requires modal/popover UI)
- Leaderboards (requires multi-user system)
- Points/rewards system (requires premium tier)

---

## Research Summary

### Constitutional Alignment

All research findings align with PayPlan's constitutional principles:

1. **Privacy-First** ✅: localStorage aggregation only (no server calls)
2. **Accessibility-First** ✅: WCAG 2.1 AA compliance with Recharts enhancements
3. **Free Core** ✅: All dashboard widgets free (Tier 0 feature)
4. **Visual-First** ✅: 6 widgets with charts (pie, bar, progress bars)
5. **Mobile-First** ✅: Responsive design (320px, 768px, 1920px breakpoints)
6. **Quality-First (Phase 1)** ✅: Manual testing only, ship fast
7. **Performance** ✅: <1s dashboard load with useMemo optimization

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Recharts 2.15.0** | React-friendly, documented accessibility (needs custom enhancements) |
| **useMemo for aggregations** | 75% reduction in render time for 10,000+ transactions |
| **React.memo for widgets** | Prevent unnecessary re-renders |
| **localStorage read-only** | No writes from dashboard (privacy + performance) |
| **Simple gamification (Phase 1)** | Streaks + insights only (defer badges to Phase 2) |
| **WCAG 2.1 AA compliance** | 4.5:1 text contrast, 3:1 chart segments, ARIA labels, hidden tables |
| **Mobile-first layout** | Stack vertically (320px), 2-col (768px), 3-col (1920px) |

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Recharts not fully accessible** | Add custom ARIA labels, hidden tables, test with screen readers |
| **Performance degradation (10,000+ transactions)** | Use useMemo, React.memo, defer virtualization to Phase 2 |
| **Gamification complexity** | Start simple (streaks + insights), defer badges/achievements to Phase 2 |
| **Empty states** | Show helpful messages with CTAs ("Add your first transaction") |

---

## Next Steps (Phase 1)

1. **Create data-model.md**: Define TypeScript types for widgets, charts, gamification
2. **Create contracts/**: Define chart data contracts (SpendingChartData, IncomeExpensesChartData, etc.)
3. **Create quickstart.md**: Developer setup guide for dashboard implementation
4. **Run update-agent-context.sh**: Update Claude with research findings
5. **Re-evaluate Constitution Check**: Verify all 7 gates still pass after design decisions

---

## Research Documentation

All detailed research is available in:

- [recharts-accessibility.md](./research-docs/recharts-accessibility.md) - Recharts WCAG 2.1 AA compliance
- [dashboard-ux-patterns.md](./research-docs/dashboard-ux-patterns.md) - Industry best practices, competitive analysis
- [react-performance-optimization.md](./research-docs/react-performance-optimization.md) - useMemo benchmarks, performance targets
- [gamification-algorithms.md](./research-docs/gamification-algorithms.md) - Streak tracking, insights, achievements

**Research Status**: ✓ Complete (Phase 0)  
**Ready for**: Phase 1 Design (data-model.md, contracts/, quickstart.md)
