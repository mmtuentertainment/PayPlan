# Task List: PayPlan v0.1 Public Deployment

**Feature**: 002-public-deployment
**Branch**: `002-public-deployment`
**Estimated Total Time**: 8-10 hours

---

## Task 1: Project Scaffold & Dependencies
**Time**: 45-60 minutes

### Acceptance Criteria
- [x] Vite + React + TypeScript project created in `/frontend` directory
- [x] Tailwind CSS configured and working
- [x] shadcn/ui initialized with base components
- [x] React Router configured with routes: `/`, `/docs`, `/privacy`
- [x] Dependencies installed: papaparse, zod, swagger-ui-react
- [x] Dev server runs without errors at `localhost:5173`
- [x] TypeScript compiles without errors

### Files to Create/Modify
```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── components.json (shadcn)
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── styles/
│       └── index.css
```

### Commands
```bash
# Create Vite project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install base dependencies
npm install react-router-dom zod papaparse swagger-ui-react

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Initialize shadcn/ui
npx shadcn-ui@latest init
# Choose: TypeScript, Tailwind, default style, CSS variables

# Install types
npm install -D @types/papaparse
```

### Verification Steps
1. Run `npm run dev` - server starts on port 5173
2. Visit `http://localhost:5173` - blank page loads
3. Check terminal - no TypeScript errors
4. Run `npm run build` - builds successfully

### Definition of Done
- Vite dev server runs cleanly
- Tailwind classes work (test with `className="text-red-500"`)
- shadcn/ui config present (`components.json` exists)
- All dependencies in `package.json`

---

## Task 2: Serverless API Migration
**Time**: 45-60 minutes

### Acceptance Criteria
- [x] `/api/plan.ts` Vercel function created
- [x] CORS headers added (allow all origins for v0.1)
- [x] Existing validation logic ported
- [x] Existing plan generation logic reused (payday-calculator, risk-detector, etc.)
- [x] Function responds to POST with JSON
- [x] OPTIONS preflight handled
- [x] Function tested locally with `vercel dev`

### Files to Create/Modify
```
api/
└── plan.ts           # New Vercel function

vercel.json           # Vercel config
package.json          # Add @vercel/node type

# Reuse existing (no changes needed)
src/lib/payday-calculator.js
src/lib/risk-detector.js
src/lib/action-prioritizer.js
src/lib/ics-generator.js
src/middleware/validate-plan-request.js
```

### Commands
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Install types
npm install -D @vercel/node

# Create vercel.json
cat > vercel.json << 'EOF'
{
  "version": 2,
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
EOF

# Test locally
vercel dev
# Then: curl -X POST http://localhost:3000/api/plan -H "Content-Type: application/json" -d @tests/fixtures/klarna-pay-in-4.json
```

### Verification Steps
1. Run `vercel dev`
2. POST to `http://localhost:3000/api/plan` with test fixture
3. Verify 200 response with correct JSON structure
4. Verify CORS headers present in response
5. Test OPTIONS request returns 200

### Definition of Done
- Function returns valid JSON for valid request
- Function returns 400 for invalid request with error message
- CORS headers present: `Access-Control-Allow-Origin: *`
- Existing unit tests still pass (`npm test`)

---

## Task 3: OpenAPI Docs
**Time**: 20-30 minutes

### Acceptance Criteria
- [x] `/public/openapi.yaml` created and served statically
- [x] `/docs` route renders Swagger UI
- [x] Swagger UI loads and displays API documentation
- [x] "Try it out" functionality works (can send test requests)
- [x] API spec updated to reflect `/api/plan` path

### Files to Create/Modify
```
frontend/
├── public/
│   └── openapi.yaml    # Copy from specs/bnpl-manager/contracts/post-plan.yaml
└── src/
    └── pages/
        └── Docs.tsx     # New page component
```

### Commands
```bash
# In frontend directory
npm install swagger-ui-react
npm install -D @types/swagger-ui-react

# Copy and update OpenAPI spec
cp ../specs/bnpl-manager/contracts/post-plan.yaml public/openapi.yaml

# Update paths in openapi.yaml: /plan → /api/plan
sed -i 's|/plan|/api/plan|g' public/openapi.yaml
```

### Implementation Code

**src/pages/Docs.tsx:**
```typescript
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function Docs() {
  return (
    <div className="container mx-auto py-8">
      <SwaggerUI url="/openapi.yaml" />
    </div>
  );
}
```

### Verification Steps
1. Navigate to `http://localhost:5173/docs`
2. Swagger UI renders with PayPlan API documentation
3. Expand POST /api/plan endpoint
4. Click "Try it out"
5. Enter example request body
6. Execute - see response (or CORS error if API not running)

### Definition of Done
- `/docs` route accessible
- OpenAPI spec loads without errors
- All endpoints documented
- Example requests visible

---

## Task 4: Header & Layout
**Time**: 20-30 minutes

### Acceptance Criteria
- [x] Header component created with brand and navigation links
- [x] Links to Docs and Privacy functional
- [x] Responsive layout (mobile-first)
- [x] WCAG AA color contrast verified
- [x] Keyboard navigation works (Tab, Enter)
- [x] Focus indicators visible

### Files to Create/Modify
```
frontend/src/
├── components/
│   └── Header.tsx       # New component
└── App.tsx              # Update to include Header
```

### Commands
```bash
# In frontend/src directory
npx shadcn-ui@latest add button
```

### Implementation Code

**src/components/Header.tsx:**
```typescript
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary hover:text-primary/80">
          PayPlan
        </Link>
        <nav className="flex gap-4">
          <Link
            to="/docs"
            className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
          >
            Docs
          </Link>
          <Link
            to="/privacy"
            className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

### Verification Steps
1. Header appears at top of all pages
2. Click "Docs" - navigates to /docs
3. Click "Privacy" - navigates to /privacy
4. Click "PayPlan" brand - returns to home
5. Press Tab - focus indicators visible
6. Press Enter on focused link - navigates
7. Resize to mobile - layout remains usable

### Definition of Done
- Header renders on all routes
- All links functional
- Keyboard accessible
- Mobile responsive

---

## Task 5: InputCard (CSV Tabs)
**Time**: 60 minutes

### Acceptance Criteria
- [x] Tabs component with "Paste CSV" and "Upload CSV" options
- [x] Textarea in "Paste CSV" tab (monospace font, resizable)
- [x] File input in "Upload CSV" tab with drag-drop support
- [x] CSV validation: headers, max 2,000 lines
- [x] File upload mirrors content into textarea
- [x] "Use Sample CSV" button fills textarea
- [x] "Clear" button empties textarea
- [x] "Edited" badge appears when sample is modified
- [x] Inline error alert (hidden by default, aria-live)
- [x] Auto-clear sample on user edit

### Files to Create/Modify
```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── tabs.tsx          # shadcn component
│   │   ├── textarea.tsx      # shadcn component
│   │   ├── input.tsx         # shadcn component
│   │   ├── button.tsx        # shadcn component
│   │   ├── alert.tsx         # shadcn component
│   │   └── badge.tsx         # shadcn component
│   └── InputCard.tsx         # New component
├── lib/
│   ├── csv.ts                # CSV parsing/validation
│   └── sample.ts             # Sample data
└── pages/
    └── Home.tsx              # Update to use InputCard
```

### Commands
```bash
npx shadcn-ui@latest add tabs textarea input button alert badge card separator
```

### Implementation Code

**src/lib/csv.ts:**
```typescript
import Papa from 'papaparse';
import { z } from 'zod';

const CSVRowSchema = z.object({
  provider: z.string().min(1),
  installment_no: z.string().regex(/^\d+$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.string().regex(/^\d+\.?\d*$/),
  currency: z.string().length(3),
  autopay: z.enum(['true', 'false']),
  late_fee: z.string().regex(/^\d+\.?\d*$/),
});

export function parseCSV(csvText: string): { data: any[], errors: string[] } {
  const lines = csvText.trim().split('\n');

  if (lines.length > 2001) { // 1 header + 2000 rows
    return { data: [], errors: ['CSV exceeds 2,000 line limit'] };
  }

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  const requiredHeaders = ['provider', 'installment_no', 'due_date', 'amount', 'currency', 'autopay', 'late_fee'];
  const actualHeaders = result.meta.fields || [];

  requiredHeaders.forEach(header => {
    if (!actualHeaders.includes(header)) {
      errors.push(`Missing required header: ${header}`);
    }
  });

  if (errors.length > 0) {
    return { data: [], errors };
  }

  const validatedData = result.data.map((row, index) => {
    try {
      return CSVRowSchema.parse(row);
    } catch (e) {
      errors.push(`Row ${index + 1}: Invalid data format`);
      return null;
    }
  }).filter(Boolean);

  return { data: validatedData, errors };
}
```

**src/lib/sample.ts:**
```typescript
export const SAMPLE_CSV = `provider,installment_no,due_date,amount,currency,autopay,late_fee
Klarna,1,2025-10-02,45.00,USD,true,7.00
Affirm,1,2025-10-02,58.00,USD,false,15.00
Afterpay,2,2025-10-05,32.50,USD,true,8.00
PayPal,1,2025-10-09,50.00,USD,false,10.00
Zip,1,2025-10-15,40.00,USD,true,5.00
Sezzle,2,2025-10-16,35.00,USD,true,6.00`;
```

### Verification Steps
1. Click "Use Sample CSV" - textarea fills with sample data
2. Edit textarea - "Edited" badge appears
3. Click "Upload CSV" tab - file input visible
4. Drag valid .csv file - content appears in textarea
5. Upload invalid CSV - error alert shows
6. Upload >2000 line CSV - error shows
7. Click "Clear" - textarea empties

### Definition of Done
- Both tabs functional
- CSV validation works (headers, line count)
- Sample data loads correctly
- File upload works with drag-drop
- Error messages clear and helpful
- Badge appears on edit

---

## Task 6: Payday & Timezone Controls
**Time**: 45 minutes

### Acceptance Criteria
- [x] RadioGroup with "Explicit Dates" and "Cadence" options
- [x] Explicit mode: Input for comma-separated dates with validation
- [x] Cadence mode: Select (weekly/biweekly/semimonthly/monthly) + Date input
- [x] Only one mode active at a time
- [x] Browser timezone auto-detected on load
- [x] Timezone displayed in Chip component
- [x] Select dropdown for timezone override with search
- [x] Min buffer number input (default: 100)

### Files to Create/Modify
```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── radio-group.tsx   # shadcn component
│   │   └── select.tsx        # shadcn component
│   └── InputCard.tsx         # Update
└── lib/
    └── tz.ts                 # Timezone utilities
```

### Commands
```bash
npx shadcn-ui@latest add radio-group select label
```

### Implementation Code

**src/lib/tz.ts:**
```typescript
export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (US)' },
  { value: 'America/Chicago', label: 'Central (US)' },
  { value: 'America/Denver', label: 'Mountain (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris/Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

export function validateTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
```

### Verification Steps
1. Page loads - timezone chip shows detected TZ (e.g., "Detected: America/New_York")
2. Click timezone select - dropdown opens with common zones
3. Select different timezone - chip updates
4. Select "Explicit Dates" radio - date input appears
5. Enter "2025-10-01, 2025-10-15" - validates
6. Select "Cadence" radio - select + date input appear
7. Choose "biweekly" - no errors
8. Enter min buffer "200" - updates state

### Definition of Done
- Timezone auto-detection works
- Timezone override functional
- RadioGroup switches between modes correctly
- Explicit dates input accepts comma-separated ISO dates
- Cadence mode shows select + date input
- Min buffer accepts numbers only

---

## Task 7: Build Plan Request
**Time**: 45 minutes

### Acceptance Criteria
- [x] "Build Plan" button calls POST /api/plan
- [x] Request body validated with Zod before sending
- [x] Loading state shows spinner, disables button
- [x] Success: stores response, displays results
- [x] Error: displays inline alert with message
- [x] Field-level validation errors shown below inputs
- [x] Button disabled if required fields missing

### Files to Create/Modify
```
frontend/src/
├── lib/
│   └── api.ts            # API client
├── components/
│   └── InputCard.tsx     # Update with submit handler
└── pages/
    └── Home.tsx          # Update with state management
```

### Implementation Code

**src/lib/api.ts:**
```typescript
import { z } from 'zod';

const PlanRequestSchema = z.object({
  items: z.array(z.object({
    provider: z.string(),
    installment_no: z.number(),
    due_date: z.string(),
    amount: z.number(),
    currency: z.string(),
    autopay: z.boolean(),
    late_fee: z.number(),
  })).min(1),
  paycheckDates: z.array(z.string()).optional(),
  payCadence: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']).optional(),
  nextPayday: z.string().optional(),
  minBuffer: z.number().min(0),
  timeZone: z.string(),
});

const PlanResponseSchema = z.object({
  summary: z.string(),
  actionsThisWeek: z.array(z.string()),
  riskFlags: z.array(z.string()),
  ics: z.string(),
  normalized: z.array(z.object({
    provider: z.string(),
    dueDate: z.string(),
    amount: z.number(),
  })),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;
export type PlanResponse = z.infer<typeof PlanResponseSchema>;

export async function generatePlan(request: PlanRequest): Promise<PlanResponse> {
  const validated = PlanRequestSchema.parse(request);

  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate plan');
  }

  const data = await response.json();
  return PlanResponseSchema.parse(data);
}
```

### Verification Steps
1. Fill all required fields correctly
2. Click "Build Plan" - button shows loading spinner
3. Request succeeds - results appear below
4. Leave CSV empty - button disabled
5. Enter invalid timezone - error shows
6. Submit with missing payday info - error shows
7. Check Network tab - POST to /api/plan with correct body

### Definition of Done
- API client validates requests with Zod
- Loading state prevents double-submit
- Success response stored in state
- Errors displayed clearly
- Button disabled for invalid state

---

## Task 8: Results: This Week
**Time**: 25 minutes

### Acceptance Criteria
- [x] Card component displays weekly actions
- [x] Ordered list with priority numbers
- [x] Each action shows due date and amount as chips
- [x] "Copy Plan" button copies actions to clipboard
- [x] Copy success feedback (toast or temporary badge)
- [x] Card hidden until results available

### Files to Create/Modify
```
frontend/src/
└── components/
    └── ResultsThisWeek.tsx    # New component
```

### Commands
```bash
npx shadcn-ui@latest add card badge
```

### Implementation Code

**src/components/ResultsThisWeek.tsx:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  actions: string[];
}

export default function ResultsThisWeek({ actions }: Props) {
  const handleCopy = () => {
    navigator.clipboard.writeText(actions.join('\n'));
    // TODO: Show toast notification
    alert('Plan copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 list-decimal list-inside">
          {actions.map((action, index) => (
            <li key={index} className="text-sm">
              {action}
            </li>
          ))}
        </ol>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={handleCopy}
        >
          Copy Plan
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Verification Steps
1. Generate plan - "This Week" card appears
2. Actions listed in order (1, 2, 3...)
3. Each action readable and formatted
4. Click "Copy Plan" - clipboard contains actions
5. Paste in notepad - actions appear line by line

### Definition of Done
- Card displays after successful API response
- Actions ordered correctly
- Copy to clipboard works
- Mobile responsive

---

## Task 9: Results: Risk Flags
**Time**: 20 minutes

### Acceptance Criteria
- [x] Card component displays risk flags
- [x] Each flag shown as colored Badge
- [x] COLLISION = red, CASH_CRUNCH = yellow, WEEKEND_AUTOPAY = blue
- [x] Each badge includes short explanation text
- [x] Card hidden if no risks detected
- [x] Card shows "No risks detected" if empty

### Files to Create/Modify
```
frontend/src/
└── components/
    └── RiskFlags.tsx    # New component
```

### Implementation Code

**src/components/RiskFlags.tsx:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  riskFlags: string[];
}

export default function RiskFlags({ riskFlags }: Props) {
  const getRiskColor = (flag: string): string => {
    if (flag.includes('COLLISION')) return 'destructive';
    if (flag.includes('CASH_CRUNCH')) return 'default'; // yellow
    if (flag.includes('WEEKEND_AUTOPAY')) return 'secondary'; // blue
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Flags</CardTitle>
      </CardHeader>
      <CardContent>
        {riskFlags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No risks detected ✓</p>
        ) : (
          <div className="space-y-2">
            {riskFlags.map((flag, index) => (
              <div key={index}>
                <Badge variant={getRiskColor(flag)} className="mb-1">
                  {flag.split(':')[0]}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {flag.split(':')[1]?.trim()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Verification Steps
1. Generate plan with sample data - risk flags appear
2. Verify COLLISION badge is red/destructive
3. Verify CASH_CRUNCH badge is yellow/warning
4. Verify WEEKEND_AUTOPAY badge is blue/secondary
5. Each flag has explanation text below badge

### Definition of Done
- Risk flags displayed with correct colors
- Explanations readable
- "No risks" message shown when empty
- Card responsive

---

## Task 10: Results: Summary
**Time**: 15 minutes

### Acceptance Criteria
- [x] Card displays plain-English summary
- [x] Summary split into 6-8 bullet points
- [x] Bullets formatted as list
- [x] Card hidden until results available
- [x] Summary text readable and well-spaced

### Files to Create/Modify
```
frontend/src/
└── components/
    └── SummaryCard.tsx    # New component
```

### Implementation Code

**src/components/SummaryCard.tsx:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  summary: string;
}

export default function SummaryCard({ summary }: Props) {
  const bullets = summary.split('\n').filter(line => line.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 list-disc list-inside">
          {bullets.map((bullet, index) => (
            <li key={index} className="text-sm">
              {bullet.replace(/^[•\-*]\s*/, '')}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

### Verification Steps
1. Generate plan - Summary card appears
2. 6-8 bullet points displayed
3. Text readable with good spacing
4. Emojis (if present) render correctly
5. Mobile view - text wraps appropriately

### Definition of Done
- Summary displays as bulleted list
- All points visible
- Formatting clean
- Mobile responsive

---

## Task 11: Results: Schedule Table + ICS
**Time**: 35 minutes

### Acceptance Criteria
- [x] Table displays normalized schedule
- [x] Columns: Provider, Due Date, Amount, Autopay, Late Fee
- [x] Mobile: table scrolls horizontally or stacks
- [x] "Download .ics" button enabled after plan generated
- [x] Button click converts base64 ICS to Blob
- [x] Downloads file named `payplan-YYYY-MM-DD.ics`
- [x] Note displayed: "24h prior alarms included"
- [x] Downloaded .ics opens in calendar apps

### Files to Create/Modify
```
frontend/src/
└── components/
    └── ScheduleTable.tsx    # New component
```

### Commands
```bash
npx shadcn-ui@latest add table
```

### Implementation Code

**src/components/ScheduleTable.tsx:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Installment {
  provider: string;
  dueDate: string;
  amount: number;
}

interface Props {
  normalized: Installment[];
  icsBase64: string;
}

export default function ScheduleTable({ normalized, icsBase64 }: Props) {
  const handleDownload = () => {
    const icsContent = atob(icsBase64);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payplan-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalized.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.provider}</TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                    <TableCell>${item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={handleDownload} className="w-full">
              Download Calendar (.ics)
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Includes 24-hour prior reminders at 9:00 AM
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
```

### Verification Steps
1. Generate plan - table appears with all installments
2. Click "Download .ics" - file downloads
3. Check filename - matches `payplan-YYYY-MM-DD.ics`
4. Open .ics in Google Calendar or Apple Calendar
5. Verify events appear with correct dates
6. Check events have 24h prior alarms
7. Mobile: table scrolls or stacks appropriately

### Definition of Done
- Table displays all normalized installments
- Download button functional
- ICS file valid and importable
- Mobile responsive
- Reminder note visible

---

## Task 12: Deploy & Verify
**Time**: 30-45 minutes

### Acceptance Criteria
- [x] Frontend built successfully (`npm run build`)
- [x] Deployed to Vercel with `vercel --prod`
- [x] Public URL accessible (*.vercel.app)
- [x] Page loads in <3 seconds
- [x] Full E2E test passes in <60 seconds:
  - Click "Use Sample CSV"
  - Click "Build Plan"
  - Results appear
  - Download .ics
- [x] /docs renders Swagger UI
- [x] /privacy page loads
- [x] Mobile responsive verified
- [x] README updated with public URL

### Files to Modify
```
README.md                 # Add public URL, quickstart
frontend/.env.production  # Set API base URL if needed
vercel.json              # Verify config
```

### Commands
```bash
# Build frontend
cd frontend
npm run build

# Test build locally
npm run preview

# Deploy to Vercel
vercel --prod

# Verify deployment
curl https://your-app.vercel.app/api/plan

# Update README
cat >> ../README.md << 'EOF'

## 🚀 Live Demo

**Public URL**: https://payplan-XXXXX.vercel.app

### Quick Start
1. Visit the URL
2. Click "Use Sample CSV"
3. Click "Build Plan"
4. Download your .ics calendar file
5. Import to Google Calendar or Apple Calendar

### API Endpoint
- **Docs**: https://payplan-XXXXX.vercel.app/docs
- **Privacy**: https://payplan-XXXXX.vercel.app/privacy

EOF
```

### Verification Steps

**Pre-Deploy Checks:**
1. Run `npm run build` - no errors
2. Run `npm run preview` - test build locally
3. Test all features locally

**Deploy:**
4. Run `vercel --prod`
5. Note the production URL

**Post-Deploy Smoke Tests:**
6. Visit production URL - page loads quickly
7. Check browser DevTools - no console errors
8. Click "Use Sample CSV" - fills textarea
9. Click "Build Plan" - results appear
10. Check timing - entire flow <60 seconds
11. Click "Download .ics" - file downloads
12. Open .ics - events appear in calendar
13. Visit /docs - Swagger UI loads
14. Visit /privacy - page renders
15. Test on mobile device - responsive
16. Test keyboard navigation - all focusable

**Performance:**
17. Run Lighthouse audit - Performance >90
18. Check Core Web Vitals - all green

**Final:**
19. Update README with production URL
20. Commit and push all changes

### Definition of Done
- Production URL live and fast
- All routes functional
- E2E flow works end-to-end
- Mobile responsive
- Performance metrics good
- README updated
- Zero console errors

---

## Runbook

### Local Development

**Start Frontend Dev Server:**
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

**Start API Dev Server:**
```bash
# In project root
vercel dev
# API available at http://localhost:3000/api/plan
```

**Run Both (recommended):**
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: API (from root)
vercel dev
```

### Build & Deploy

**Build Frontend:**
```bash
cd frontend
npm run build
npm run preview  # Test build locally
```

**Deploy to Vercel:**
```bash
vercel --prod
# Follow prompts
# Note production URL
```

**Rollback:**
```bash
vercel rollback
```

### Testing

**Run Unit Tests:**
```bash
cd frontend
npm test
```

**Test API Locally:**
```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d @../tests/fixtures/klarna-pay-in-4.json
```

**Manual E2E Test (Production):**
1. Visit https://[your-url].vercel.app
2. Click "Use Sample CSV" (✓ textarea fills)
3. Verify detected timezone shown (✓ chip displays)
4. Click "Build Plan" (✓ loading spinner)
5. Wait for results (✓ all 4 cards appear)
6. Click "Download .ics" (✓ file downloads)
7. Open .ics (✓ events with reminders)
8. Visit /docs (✓ Swagger UI loads)
9. Visit /privacy (✓ policy renders)
10. Test on mobile (✓ responsive)

**Timing:** Step 2-6 should complete in <60 seconds

### Smoke Checks

**After Deploy:**
```bash
# Check homepage
curl -I https://[your-url].vercel.app
# Should return 200

# Check API
curl -X OPTIONS https://[your-url].vercel.app/api/plan
# Should return 200 with CORS headers

# Check OpenAPI spec
curl https://[your-url].vercel.app/openapi.yaml
# Should return YAML content
```

### Environment Variables

**Frontend (.env):**
```
# None needed for v0.1
```

**Vercel (if needed):**
```
# Set in Vercel dashboard
NODE_VERSION=20
```

### Troubleshooting

**Issue**: CORS errors in browser
**Fix**: Check /api/plan.ts has `Access-Control-Allow-Origin: *` header

**Issue**: 404 on /docs or /privacy
**Fix**: Check React Router routes in App.tsx

**Issue**: ICS download fails
**Fix**: Check base64 decoding in ScheduleTable.tsx

**Issue**: Build fails
**Fix**: Run `npm install` in frontend directory, check TypeScript errors

**Issue**: Vercel function timeout
**Fix**: Check API response time, optimize if >10 seconds

### Success Metrics

- [ ] Page load: <3 seconds
- [ ] API response: <5 seconds
- [ ] E2E flow: <60 seconds
- [ ] Lighthouse score: >90
- [ ] Mobile responsive: Yes
- [ ] WCAG AA: Pass
- [ ] Zero console errors: Yes

---

## Summary

**12 Atomic Tasks | ~8-10 Hours Total**

1. ✅ Project scaffold (60 min)
2. ✅ API migration (60 min)
3. ✅ OpenAPI docs (30 min)
4. ✅ Header (30 min)
5. ✅ InputCard CSV (60 min)
6. ✅ Payday/TZ (45 min)
7. ✅ Build Plan (45 min)
8. ✅ Results: Week (25 min)
9. ✅ Results: Risks (20 min)
10. ✅ Results: Summary (15 min)
11. ✅ Results: Table+ICS (35 min)
12. ✅ Deploy (45 min)

**Deliverables:**
- React SPA with 9 components
- Vercel serverless API
- OpenAPI docs at /docs
- Privacy page at /privacy
- Public URL with <60s user flow

**Ready to ship PayPlan v0.1 publicly! 🚀**