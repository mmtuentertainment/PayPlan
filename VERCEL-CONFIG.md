# Vercel Development Configuration

**Last Updated**: 2025-10-30
**Environment**: Development Only
**Framework**: Vite + React 19.1.1

---

## Overview

This configuration is optimized for **development previews only**. Production deployment is deferred until Phase 2.

## Files

### 1. `vercel.json` - Main Configuration

**Purpose**: Configures Vercel deployment settings for the PayPlan frontend

**Key Settings**:
- **Framework**: Vite (auto-detected)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Dev Command**: `cd frontend && npm run dev`
- **Output Directory**: `frontend/dist`
- **SPA Routing**: All routes rewritten to `/index.html` for React Router

**Security Headers**:
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection

**Caching**:
- Static assets (`/assets/*`): 1 year cache (`immutable`)
- HTML: No cache (always fresh)

### 2. `.vercelignore` - Deployment Exclusions

**Purpose**: Excludes unnecessary files from Vercel deployment

**Excluded**:
- `node_modules/` - Dependencies (Vercel installs fresh)
- `frontend/dist/` - Build artifacts (Vercel builds fresh)
- `docs/`, `specs/`, `memory/` - Documentation (not needed for runtime)
- `frontend/src/archive/` - Archived BNPL code (not used in bundle)
- Test files, IDE configs, logs

### 3. `.env.development` - Environment Variables

**Purpose**: Development-specific environment configuration

**Key Variables**:
- `NODE_ENV=development` - Enables dev mode
- `VITE_ENABLE_DEBUG_MODE=true` - Debug logging
- `VITE_STORAGE_TYPE=localStorage` - Privacy-first storage
- `VITE_ENABLE_TELEMETRY=false` - No tracking (Constitutional Principle I)
- `VITE_ENABLE_ANALYTICS=false` - No analytics (Constitutional Principle I)

---

## Deployment Workflow

### Automatic Deployments

Vercel automatically deploys on:
1. **Pull Request**: Creates preview deployment
2. **Push to `main`**: Deploys to production (disabled for now)
3. **Push to feature branches**: Creates preview deployments

### Preview URLs

Format: `https://frontend-git-[branch-name]-[project-id].vercel.app`

Example:
```
Branch: 062-dashboard-chunk2-spending
URL: https://frontend-git-062-dashboar-11bdf8-matthew-utts-projects-89452c41.vercel.app
```

### Manual Deployment

To manually trigger deployment:
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production (Phase 2+)
vercel --prod
```

---

## SPA Routing Configuration

**Problem**: Vercel returns 404 for client-side routes like `/transactions`, `/categories`

**Solution**: Rewrite all routes to `/index.html`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This allows React Router to handle all client-side routing.

---

## Environment Variables in Vercel Dashboard

For sensitive variables (not in `.env.development`):

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add variables for each environment:
   - **Development**: Used for preview deployments
   - **Production**: Used for production deployments (Phase 2+)

**Examples** (when needed):
- `VITE_API_URL` - Backend API endpoint
- `VITE_SUPABASE_URL` - Supabase project URL (premium features)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (premium features)

---

## Build Settings in Vercel Dashboard

**Framework Preset**: Vite
**Build Command**: `cd frontend && npm install && npm run build`
**Output Directory**: `frontend/dist`
**Install Command**: `cd frontend && npm install`
**Development Command**: `cd frontend && npm run dev`

---

## Troubleshooting

### Issue: 404 on Client-Side Routes

**Symptom**: `/transactions`, `/categories`, etc. return 404
**Cause**: Missing SPA rewrite rule
**Fix**: Ensure `vercel.json` has catch-all rewrite to `/index.html`

### Issue: Build Fails with TypeScript Errors

**Symptom**: Vercel build fails with `TS2322` or similar errors
**Cause**: TypeScript strict mode violations
**Fix**: Run `npm run build` locally first, fix all errors before pushing

### Issue: Environment Variables Not Working

**Symptom**: `import.meta.env.VITE_*` returns `undefined`
**Cause**: Variables not prefixed with `VITE_` or not set in Vercel Dashboard
**Fix**:
1. Prefix all Vite env vars with `VITE_`
2. Set in Vercel Dashboard → Environment Variables
3. Redeploy

### Issue: Rate Limit Errors

**Symptom**: "Deployment rate limited — retry in 1 hour"
**Cause**: Too many deployments in short time (free tier limit)
**Fix**:
1. Wait for rate limit to reset (~1 hour)
2. Reduce deployment frequency
3. Consider upgrading to Vercel Pro ($20/month, unlimited builds)

---

## Security Considerations

### Headers Applied

All responses include security headers:
- **X-Content-Type-Options**: Prevents MIME sniffing attacks
- **X-Frame-Options**: Prevents clickjacking (no iframes)
- **X-XSS-Protection**: Browser XSS protection

### What's NOT Included (Phase 1)

- ❌ HTTPS enforcement (Vercel auto-enforces)
- ❌ Content Security Policy (defer to Phase 2)
- ❌ Rate limiting (defer to Phase 2)
- ❌ DDoS protection (Vercel provides basic protection)

---

## Performance Optimization

### Caching Strategy

**Static Assets** (`/assets/*`):
- **Cache**: 1 year (`max-age=31536000`)
- **Immutable**: Yes (content-hashed filenames)
- **Why**: Vite generates unique hashes for each build

**HTML** (`index.html`):
- **Cache**: None (always fetch fresh)
- **Why**: Ensures users always get latest app version

### Bundle Size Monitoring

Check bundle size after each deployment:
```bash
npm run build

# Output shows:
# dist/assets/index-XXX.js    761.24 kB │ gzip: 238.35 kB
```

**Phase 1 Targets** (guidelines, not enforced):
- Initial JS bundle: <1MB (uncompressed)
- Gzipped: <300KB
- Total page load: <3MB

---

## Phase 2 Considerations (Future)

When moving to production:

1. **Enable Production Deployment**:
   - Set `main` branch to deploy to production
   - Configure custom domain

2. **Add Production Environment Variables**:
   - `NODE_ENV=production`
   - `VITE_ENABLE_DEBUG_MODE=false`
   - Production API URLs
   - Analytics keys (if opt-in enabled)

3. **Enable Advanced Security**:
   - Content Security Policy (CSP)
   - Subresource Integrity (SRI)
   - Rate limiting (Vercel Edge Config)

4. **Performance Monitoring**:
   - Vercel Analytics (optional, requires user consent)
   - Web Vitals tracking
   - Error monitoring (Sentry integration)

---

## Related Documentation

- **Constitutional Principles**: `memory/constitution_v1.1_TEMP.md`
- **Development Guide**: `CLAUDE.md`
- **Vite Configuration**: `frontend/vite.config.ts`
- **React Router Configuration**: `frontend/src/App.tsx`

---

## Support

**Vercel Documentation**: https://vercel.com/docs
**Vite Documentation**: https://vite.dev
**React Router Documentation**: https://reactrouter.com

For project-specific issues, see [Linear](https://linear.app/mmtu-entertainment) or create GitHub issue.
