# PayPlan v0.1 — Public Deploy & Landing

**Live:** https://frontend-ku48gid48-matthew-utts-projects-89452c41.vercel.app

## Summary

Ships the public vertical slice: paste/upload CSV → plan → ICS calendar. Adds complete Results UI (This Week, Risk Flags, Summary, Schedule Table) and deploys `/api/plan` serverless function on Vercel (Node 20 with ES modules).

## What Changed

### Frontend (Vite + React + TypeScript + shadcn/ui)
- Single-page application with CSV input (paste textarea + file upload tabs)
- Timezone auto-detection with override Select dropdown
- Payday input: RadioGroup (explicit dates OR cadence pattern)
- Results display: 4 cards showing weekly actions, risk flags, summary, normalized schedule
- ICS calendar download (base64 → Blob → payplan.ics)
- Mobile-responsive, WCAG AA accessible (keyboard nav, ARIA labels, focus rings)

### Backend (Vercel Serverless Functions)
- `/api/plan` endpoint with CORS enabled
- ES module imports (Vercel 2025 requirement)
- Reuses deterministic algorithm from v0.1
- Type coercion for autopay (boolean) and lateFee (number)
- Returns: {summary, actionsThisWeek, riskFlags, ics, normalized}

### Documentation
- OpenAPI spec at `/openapi.yaml`
- Swagger UI at `/docs`
- Privacy policy at `/privacy`
- Updated README with live URL, quickstart, API examples

## Key Technical Decisions

1. **ES Modules:** Converted all .js library files from CommonJS (require/module.exports) to ES modules (import/export) - required by Vercel 2025
2. **Type Coercion:** Added toBool/toNum helpers to ensure proper boolean/number types in API responses
3. **WEEKEND_AUTOPAY:** Strict boolean check - only flags when autopay === true
4. **Monorepo Structure:** Frontend in `/frontend`, API in `/frontend/api` for Vercel deployment

## Verification Checklist

- [ ] **E2E flow (<60s):** Use Sample CSV → Build Plan → Download .ics
- [ ] **API smoke test:** POST `/api/plan` returns complete response (see curl below)
- [ ] **CORS:** `curl -I -X OPTIONS <PROD>/api/plan` returns 204 with CORS headers
- [ ] **Docs:** Visit `/docs` - Swagger UI renders with `/openapi.yaml` loaded
- [ ] **Privacy:** Visit `/privacy` - policy page loads
- [ ] **ICS validation:** Download .ics, import to calendar app, verify:
  - All installments appear as events
  - 24-hour prior reminders present
  - Timezone correct (TZID matches selection)
- [ ] **Lighthouse ≥90:** Performance, Accessibility, Best Practices, SEO (attach report)
- [ ] **Mobile:** Responsive layout verified on mobile device
- [ ] **Keyboard nav:** All interactive elements accessible via keyboard
- [ ] **No console errors:** Check browser DevTools

### API Smoke Test

```bash
curl -s -X POST https://frontend-ku48gid48-matthew-utts-projects-89452c41.vercel.app/api/plan \
  -H "content-type: application/json" \
  -d '{"items":[{"provider":"Klarna","installment_no":1,"due_date":"2025-10-02","amount":45,"currency":"USD","autopay":true,"late_fee":7}],"paycheckDates":["2025-10-05","2025-10-19","2025-11-02"],"minBuffer":100,"timeZone":"America/New_York"}' \
  | jq -r '.summary, (.actionsThisWeek|length), (.riskFlags|length), (.ics|length>0)'
```

**Expected:** Summary text, action count, risk count, `true` for ICS present

## Screenshots

_(Add screenshots of:)_
- Homepage with sample CSV loaded
- Results display (This Week, Risk Flags, Summary, Table)
- /docs Swagger UI
- /privacy page

## Rollback Plan

**If critical issues discovered:**

1. **Vercel Dashboard:** Rollback to previous deployment
2. **Git:** Revert merge commit or checkout previous tag
3. **Tag cleanup:** `git tag -d v0.1.0 && git push origin :refs/tags/v0.1.0`
4. **README:** Remove live URL reference

**Recovery Time:** <5 minutes

## Related Issues

Closes #N/A (initial release)

## Notes

- Deployment protection disabled in Vercel for public access
- No authentication required
- No data persistence
- No analytics or tracking (privacy-first)