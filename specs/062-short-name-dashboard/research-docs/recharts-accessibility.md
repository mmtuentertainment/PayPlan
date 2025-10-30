# Recharts Accessibility Documentation

**Source**: Context7 MCP Server - `/recharts/recharts`  
**Retrieved**: 2025-10-29  
**Topic**: Accessibility, ARIA labels, keyboard navigation, screen reader support

---

## Key Findings

### Built-in Accessibility (Recharts 3.0+)

Recharts 3.0+ includes **default keyboard navigation** for interactive chart elements:

- **Tab**: Navigate between focusable elements
- **Arrow keys**: Navigate through data points within a chart
- **Enter/Space**: Activate interactive elements

### Custom Accessibility Enhancements Required

**Default ARIA roles do NOT exist** in Recharts out-of-box. Developers must add custom ARIA attributes:

1. **ARIA Labels on Charts**: Add `aria-label` to chart containers
2. **ARIA Roles**: Add `role="img"` or `role="graphics-document"` to chart SVGs
3. **Screen Reader Descriptions**: Add `aria-describedby` pointing to hidden description text
4. **Data Table Alternative**: Provide `<table>` alternative for screen readers

### Example: Accessible LineChart with Keyboard Navigation

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 500 },
];

function AccessibleLineChart() {
  return (
    <div role="region" aria-label="Monthly spending trend">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} aria-label="Line chart showing monthly spending">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }}
            aria-label="Monthly spending values"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Hidden table alternative for screen readers */}
      <table className="sr-only" aria-label="Monthly spending data">
        <thead>
          <tr>
            <th>Month</th>
            <th>Spending ($)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Custom Axis Tick Components with ARIA

```tsx
const CustomTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#666"
        aria-label={`Category: ${payload.value}`}
      >
        {payload.value}
      </text>
    </g>
  );
};

<XAxis dataKey="name" tick={<CustomTick />} />
```

### Custom Tooltip for Accessibility

```tsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="custom-tooltip" 
        role="tooltip" 
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="label" aria-label={`Month: ${label}`}>{`${label}`}</p>
        <p className="value" aria-label={`Value: $${payload[0].value}`}>
          {`Value: $${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

<Tooltip content={<CustomTooltip />} />
```

### ResponsiveContainer Usage

```tsx
<ResponsiveContainer width="100%" height={300} minWidth={300}>
  <PieChart aria-label="Spending breakdown by category">
    {/* Chart content */}
  </PieChart>
</ResponsiveContainer>
```

---

## WCAG 2.1 AA Compliance Checklist

Based on Recharts documentation, here's what's needed for WCAG 2.1 AA:

- [x] **Keyboard Navigation**: Built-in in Recharts 3.0+ (Tab, Arrow keys, Enter/Space)
- [ ] **ARIA Labels**: Must add manually to all chart components
- [ ] **ARIA Roles**: Must add `role="img"` or `role="graphics-document"` to SVGs
- [ ] **ARIA Descriptions**: Must add `aria-describedby` with hidden text descriptions
- [ ] **Color Contrast**: Must ensure 4.5:1 for text, 3:1 for chart segments (manual testing)
- [ ] **Data Table Alternative**: Must provide `<table>` for screen readers
- [ ] **Focus Indicators**: Must ensure visible focus states (CSS)
- [ ] **Reduced Motion**: Must respect `prefers-reduced-motion` (CSS)

---

## Implementation Recommendations

1. **Wrap all Recharts components** in accessible containers with `role="region"` and `aria-label`
2. **Provide hidden `<table>` alternatives** for all charts using `.sr-only` class
3. **Add custom ARIA attributes** to all interactive chart elements
4. **Test with screen readers** (NVDA, VoiceOver) to validate accessibility
5. **Use high-contrast colors** that meet WCAG 2.1 AA contrast ratios
6. **Implement keyboard focus styles** using Tailwind `focus:ring-2` utilities

---

## Sources

- Recharts Official Documentation (via Context7 MCP)
- Recharts GitHub Issues: Accessibility improvements in 3.0+
- Web Accessibility Initiative (WAI) Chart Patterns
