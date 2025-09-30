# Implementation Plan: PayPlan v0.1 Public Deployment

**Branch**: `002-public-deployment` | **Date**: 2025-09-30 | **Spec**: [feature-spec.md](feature-spec.md)
**Input**: Feature specification from `/specs/public-deployment/feature-spec.md`

---

## Summary

Ship PayPlan v0.1 publicly by deploying POST /api/plan as a Vercel serverless function and building a React SPA landing page with live CSV pastebox, sample data, results display, and .ics download. Complete user flow: land → paste/upload CSV → generate plan → download .ics in <60 seconds.

---

## Technical Context

**Frontend Stack**:
- Language: TypeScript 5.3+
- Framework: React 18 + Vite 5
- UI Library: shadcn/ui (Radix UI primitives)
- Styling: Tailwind CSS 3.4
- State: React hooks (useState, useEffect)
- Routing: React Router 6 (/, /docs, /privacy)

**Backend Stack**:
- Runtime: Node.js 20 (Vercel serverless)
- Existing: Express-based POST /plan endpoint
- Migration: Adapt to Vercel function format (/api/plan.ts)
- Dependencies: luxon, ics (already in project)

**Build & Deploy**:
- Build Tool: Vite (SPA)
- Platform: Vercel (free tier)
- Deploy: `vercel --prod`
- Domain: *.vercel.app subdomain

**Testing**:
- Unit: Vitest + React Testing Library
- Integration: Supertest for API endpoint
- E2E: Manual (verify full flow)

**Performance Goals**:
- Page load: <3 seconds
- API response: <5 seconds (typical)
- Complete flow: <60 seconds

**Constraints**:
- No authentication or authorization
- No data persistence (in-memory only)
- No analytics or tracking
- WCAG 2.1 AA accessibility
- Mobile-first responsive design

---

## Constitution Check

**Principles Applied:**
1. ✅ **Stateless**: Frontend + API both stateless, no sessions
2. ✅ **Privacy-First**: No data storage, no tracking, no cookies
3. ✅ **Accessible**: WCAG AA, keyboard nav, ARIA labels
4. ✅ **Serverless-Ready**: Vercel functions, no filesystem writes
5. ✅ **Performance**: <60s user flow, <5s API, <3s page load

**No violations** - Public deployment follows privacy and performance best practices.

---

## Project Structure

### Documentation (this feature)
```
specs/public-deployment/
├── plan.md              # This file
├── feature-spec.md      # Feature specification
├── data-model.md        # Data model (TBD)
├── quickstart.md        # Deployment guide (TBD)
└── contracts/
    └── api-plan.yaml    # Already exists (specs/bnpl-manager/contracts/post-plan.yaml)
```

### Frontend (repository root - new)
```
public/
└── openapi.yaml         # OpenAPI spec (static)

src/
├── main.tsx             # Vite entry point
├── App.tsx              # Root component with routing
├── components/
│   ├── ui/              # shadcn/ui generated components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── radio-group.tsx
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   └── separator.tsx
│   ├── Header.tsx       # Brand + nav links
│   ├── InputCard.tsx    # CSV input + controls
│   ├── ResultsThisWeek.tsx  # Prioritized actions
│   ├── RiskFlags.tsx    # Risk badges
│   ├── SummaryCard.tsx  # Plain-English summary
│   └── ScheduleTable.tsx    # Normalized schedule table
├── lib/
│   ├── utils.ts         # shadcn/ui utils (cn helper)
│   ├── api.ts           # API client
│   ├── csv.ts           # CSV parsing + validation
│   ├── tz.ts            # Timezone detection
│   └── sample.ts        # Sample CSV data
├── pages/
│   ├── Home.tsx         # Landing page
│   ├── Docs.tsx         # Swagger UI
│   └── Privacy.tsx      # Privacy policy
└── styles/
    └── index.css        # Global + Tailwind imports

vite.config.ts
tsconfig.json
tailwind.config.ts
postcss.config.js
components.json          # shadcn/ui config
```

### Backend (Vercel functions)
```
api/
└── plan.ts              # Vercel serverless function (POST /api/plan)

src/lib/                 # Existing (reused)
├── payday-calculator.js
├── risk-detector.js
├── action-prioritizer.js
└── ics-generator.js

vercel.json              # Vercel config (Node 20, rewrites)
```

---

## Phase 0: Research & Dependencies ✅

**Research Tasks:**

1. ✅ **Vite + React + TypeScript Setup**
   - Vite 5 with React template
   - TypeScript 5.3+ configuration
   - Path aliases (@/ for src/)

2. ✅ **shadcn/ui Integration**
   - Install via `npx shadcn-ui@latest init`
   - Component installation on-demand
   - Tailwind CSS configuration

3. ✅ **Vercel Serverless Functions**
   - Node 20 runtime
   - Function format: `export default function handler(req, res)`
   - Reusing existing Express middleware logic

4. ✅ **CSV Parsing**
   - Library: papaparse (robust, browser-friendly)
   - Max 2,000 lines validation
   - Header validation

5. ✅ **Swagger UI Integration**
   - Library: swagger-ui-react
   - Embed in /docs route
   - Point to /openapi.yaml

**Dependencies to Add:**

**Frontend:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zod": "^3.22.4",
    "papaparse": "^5.4.1",
    "swagger-ui-react": "^5.10.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/papaparse": "^5.3.14",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2"
  }
}
```

**Backend** (already have luxon, ics):
- No new dependencies needed for API

---

## Phase 1: Design & Contracts ✅

### Data Model

**Frontend State:**
```typescript
interface AppState {
  // Input
  csvText: string;
  csvFile: File | null;
  paydayMode: 'explicit' | 'cadence';
  paycheckDates: string; // comma-separated
  payCadence: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  nextPayday: string;
  timeZone: string;
  minBuffer: number;

  // UI State
  isLoading: boolean;
  error: string | null;
  isEdited: boolean;

  // Results
  results: PlanResponse | null;
}

interface PlanResponse {
  summary: string;
  actionsThisWeek: string[];
  riskFlags: string[];
  ics: string; // base64
  normalized: NormalizedInstallment[];
}

interface NormalizedInstallment {
  provider: string;
  dueDate: string;
  amount: number;
}
```

**API Contract** (reuse existing):
- Request: Same as current POST /plan
- Response: Same as current response
- Route: Change from `/plan` to `/api/plan`

**CSV Schema:**
```typescript
interface CSVRow {
  provider: string;
  installment_no: string;
  due_date: string; // yyyy-mm-dd
  amount: string;
  currency: string;
  autopay: string; // "true" | "false"
  late_fee: string;
}
```

### Component Architecture

**Page Components:**
1. **Home.tsx** - Landing page orchestrator
   - Manages AppState
   - Composes Header + Hero + InputCard + Results
   - Handles API calls

2. **Docs.tsx** - Swagger UI embed
   - Loads /openapi.yaml
   - Renders SwaggerUI component

3. **Privacy.tsx** - Privacy policy
   - Static markdown content
   - No data storage statement

**Feature Components:**
4. **Header.tsx** - Navigation
   - Props: none
   - Renders: Brand + Links (Docs, Privacy)

5. **InputCard.tsx** - Data input
   - Props: state, setState, onSubmit
   - Contains: Tabs (Paste/Upload), RadioGroup (Payday), TZ Select, Buffer, Buttons, Alert

6. **ResultsThisWeek.tsx** - Weekly actions
   - Props: actions (string[])
   - Renders: Card with ordered list + Copy button

7. **RiskFlags.tsx** - Risk display
   - Props: riskFlags (string[])
   - Renders: Card with Badges (color-coded by type)

8. **SummaryCard.tsx** - Summary bullets
   - Props: summary (string)
   - Renders: Card with bullet list

9. **ScheduleTable.tsx** - Data table
   - Props: normalized (NormalizedInstallment[])
   - Renders: Card with responsive table

### Routes

```typescript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/docs" element={<Docs />} />
  <Route path="/privacy" element={<Privacy />} />
</Routes>
```

### API Migration

**Current:** Express route at `/plan`
```javascript
// src/routes/plan.js
router.post('/', validatePlanRequest, async (req, res) => { ... });
```

**New:** Vercel function at `/api/plan.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Reuse existing validation + logic
  const { items, paycheckDates, payCadence, nextPayday, minBuffer, timeZone } = req.body;

  // ... existing implementation from src/routes/plan.js
}
```

---

## Phase 2: Implementation Tasks

### Setup Tasks (1-5)

1. **Initialize Vite + React + TypeScript project** [P]
   - Run `npm create vite@latest frontend -- --template react-ts`
   - Configure tsconfig.json with path aliases
   - Set up folder structure

2. **Install and configure Tailwind CSS** [P]
   - Install tailwindcss, postcss, autoprefixer
   - Create tailwind.config.ts with content paths
   - Set up postcss.config.js
   - Import Tailwind directives in index.css

3. **Initialize shadcn/ui**
   - Run `npx shadcn-ui@latest init`
   - Configure components.json
   - Set up utils.ts (cn helper)

4. **Install remaining dependencies** [P]
   - React Router, zod, papaparse, swagger-ui-react
   - Radix UI components (as needed)

5. **Set up Vercel configuration**
   - Create vercel.json (Node 20, SPA rewrites)
   - Configure build settings

### Backend Migration (6-8)

6. **Create /api/plan.ts Vercel function**
   - Export default handler
   - Add CORS headers
   - Handle OPTIONS preflight

7. **Migrate validation logic**
   - Copy validatePlanRequest logic
   - Adapt for Vercel function format

8. **Migrate plan generation logic**
   - Import existing lib modules (payday-calculator, risk-detector, etc.)
   - Reuse exact same algorithm
   - Test with existing fixtures

### Component Development (9-20)

9. **Add shadcn/ui components** [P]
   - `npx shadcn-ui@latest add button card input textarea select tabs radio-group alert badge separator`

10. **Build lib/csv.ts** [P]
    - CSV parsing with papaparse
    - Header validation (7 required columns)
    - Max 2,000 lines check
    - Row validation (zod schema)

11. **Build lib/tz.ts** [P]
    - Browser timezone detection (Intl.DateTimeFormat().resolvedOptions().timeZone)
    - Common timezone list
    - Validation

12. **Build lib/sample.ts** [P]
    - Sample CSV with real providers (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
    - Demonstrates all 3 risk types
    - 5-6 rows

13. **Build lib/api.ts** [P]
    - POST /api/plan client
    - Zod request/response schemas
    - Error handling

14. **Build Header.tsx** [P]
    - Brand logo/text
    - Navigation links (Docs, Privacy)
    - Responsive layout

15. **Build InputCard.tsx**
    - Tabs (Paste CSV, Upload CSV)
    - Textarea with auto-resize
    - File input with drag-drop
    - RadioGroup (Explicit Dates vs Cadence)
    - Timezone Chip + Select
    - Buffer Input
    - Build Plan button
    - Download .ics button (disabled initially)
    - Error Alert (hidden by default)

16. **Build ResultsThisWeek.tsx** [P]
    - Card wrapper
    - Ordered list of actions
    - Copy Plan button

17. **Build RiskFlags.tsx** [P]
    - Card wrapper
    - Badge for each risk
    - Color coding (red=COLLISION, yellow=CASH_CRUNCH, blue=WEEKEND_AUTOPAY)

18. **Build SummaryCard.tsx** [P]
    - Card wrapper
    - Bullet list from multi-line summary

19. **Build ScheduleTable.tsx** [P]
    - Responsive table
    - Columns: Provider, Due Date, Amount, Autopay, Late Fee
    - Mobile: stack rows

20. **Build Home.tsx**
    - Orchestrate all components
    - Manage AppState
    - Handle form submission
    - Call API
    - Download .ics logic (base64 → Blob)

### Additional Pages (21-23)

21. **Build Docs.tsx** [P]
    - Import SwaggerUI from swagger-ui-react
    - Point to /openapi.yaml
    - Wrapper styling

22. **Build Privacy.tsx** [P]
    - Static content
    - No data storage statement
    - In-memory processing explanation

23. **Create public/openapi.yaml**
    - Copy from specs/bnpl-manager/contracts/post-plan.yaml
    - Update paths to /api/plan

### Routing & Entry (24-26)

24. **Build App.tsx**
    - React Router setup
    - Route definitions (/, /docs, /privacy)
    - 404 handling

25. **Build main.tsx**
    - React.StrictMode
    - RouterProvider
    - Mount to #root

26. **Update index.html**
    - Meta tags (viewport, charset)
    - Title: "PayPlan - BNPL Payment Manager"
    - Favicon (optional)

### Testing (27-30)

27. **Unit test lib/csv.ts**
    - Valid CSV parsing
    - Invalid header detection
    - Max lines enforcement
    - Row validation

28. **Unit test lib/tz.ts**
    - Timezone detection
    - Validation

29. **Integration test /api/plan endpoint**
    - Successful request
    - Error handling
    - CORS headers

30. **Manual E2E test**
    - Load landing page
    - Use sample CSV
    - Generate plan
    - Download .ics
    - Verify <60 seconds

### Deployment (31-33)

31. **Local development test**
    - Run `npm run dev` (Vite)
    - Test frontend locally
    - Run `vercel dev` to test API locally

32. **Deploy to Vercel**
    - Run `vercel --prod`
    - Verify deployment
    - Test public URL

33. **Post-deployment validation**
    - Test full user flow on vercel.app
    - Verify .ics download
    - Check mobile responsiveness
    - Validate accessibility (keyboard nav, screen readers)

---

## Phase 3: Task Planning Approach

**Task Generation Strategy:**
- Setup tasks first (Vite, Tailwind, shadcn/ui, deps)
- Backend migration (Vercel function)
- Component library tasks (all [P] parallelizable)
- Page composition (Home, Docs, Privacy)
- Testing and deployment

**Ordering Strategy:**
- Foundation → Components → Pages → Integration → Deploy
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 33 tasks total

---

## Complexity Tracking

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| React + Vite | Modern SPA framework with fast HMR | Next.js (overkill for single page), Vanilla JS (lacks component structure) |
| shadcn/ui | Accessible Radix primitives with Tailwind, copy-paste approach | Material-UI (too heavy), Chakra UI (different styling approach) |
| Vercel Functions | Seamless deployment, zero config | AWS Lambda (more setup), Cloudflare Workers (different runtime) |
| TypeScript | Type safety for form state and API contracts | JavaScript (loses type safety) |

No constitutional violations - all choices align with stateless, privacy-first, serverless principles.

---

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [ ] Phase 2: Implementation (33 tasks)
- [ ] Phase 3: Testing
- [ ] Phase 4: Deployment
- [ ] Phase 5: Validation

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] No NEEDS CLARIFICATION remaining
- [x] Complexity deviations documented

---

## Success Criteria

**Primary**: A new visitor can:
1. Land on payplan.vercel.app
2. Click "Use Sample CSV"
3. Click "Build Plan"
4. See results (actions, risks, summary)
5. Click "Download .ics"
6. Complete entire flow in <60 seconds

**Additional**:
- /docs renders Swagger UI with /openapi.yaml ✅
- Timezone chip shows browser TZ with working override ✅
- Errors display inline ✅
- File upload and textarea both work ✅
- Sample replaced on edit with "Edited" badge ✅
- Mobile responsive ✅
- WCAG AA accessible ✅

---

## Deliverables Summary

**Code:**
- Vite + React + TypeScript SPA (9 components + 3 pages)
- Vercel serverless function (/api/plan.ts)
- 6 lib utilities (csv, api, tz, sample, utils, existing backend libs)
- 33 implementation tasks

**Documentation:**
- Feature specification (complete)
- Implementation plan (this file)
- QuickStart guide (TBD)
- README updates (TBD)

**Deploy:**
- Public URL on Vercel (*.vercel.app)
- /api/plan endpoint
- /docs with Swagger UI
- /privacy page
- Static /openapi.yaml

---

**Status**: ✅ **READY FOR IMPLEMENTATION (/tasks)**

*Plan created on 2025-09-30*