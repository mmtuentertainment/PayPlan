# Vercel Cleanup & Fresh Setup Guide

**Date**: 2025-10-30
**Issue**: Two Vercel projects deploying simultaneously (frontend, payplan)
**Goal**: Single clean development project

---

## Current Problem

You have **two Vercel projects** connected to the same GitHub repo:
1. `Vercel – frontend`
2. `Vercel – payplan`

This causes:
- Duplicate deployments (wastes build time)
- Confusion about which URL is canonical
- Increased rate limit usage

---

## Step 1: Delete Old Vercel Projects

### Via Vercel Dashboard

1. **Go to Vercel Dashboard**: https://vercel.com/matthew-utts-projects-89452c41

2. **Delete the `frontend` project**:
   - Click on `frontend` project
   - Go to Settings (⚙️)
   - Scroll to "Delete Project"
   - Click "Delete"
   - Type project name to confirm
   - Click "Delete"

3. **Delete the `payplan` project**:
   - Click on `payplan` project
   - Go to Settings (⚙️)
   - Scroll to "Delete Project"
   - Click "Delete"
   - Type project name to confirm
   - Click "Delete"

### Via Vercel CLI (Alternative)

```bash
# List all projects
vercel ls

# Remove projects
vercel remove frontend --yes
vercel remove payplan --yes
```

---

## Step 2: Disconnect GitHub Integration

1. **Go to GitHub Repository Settings**:
   - Navigate to: https://github.com/mmtuentertainment/PayPlan/settings/installations

2. **Find Vercel integration**:
   - Click "Configure" next to Vercel
   - Scroll to "Repository access"
   - Click "Remove" or "Revoke access" for PayPlan
   - This removes all old webhooks and integrations

---

## Step 3: Create Fresh Vercel Project

### Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com

2. **Click "Add New..." → Project**

3. **Import Git Repository**:
   - Select "GitHub"
   - Find `mmtuentertainment/PayPlan`
   - Click "Import"

4. **Configure Project**:
   - **Project Name**: `payplan-dev` (or your preferred name)
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (leave as repository root)
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm ci`

5. **Environment Variables** (optional for now):
   - Skip for development
   - Can add later in Project Settings

6. **Deploy**:
   - Click "Deploy"
   - First deployment will take ~2-3 minutes

### Via Vercel CLI (Alternative)

```bash
# Navigate to project root
cd /home/matt/PROJECTS/PayPlan

# Link to new Vercel project
vercel

# Follow prompts:
# ? Set up and deploy? Yes
# ? Which scope? [your account]
# ? Link to existing project? No
# ? What's your project's name? payplan-dev
# ? In which directory is your code located? ./

# Deploy
vercel --prod
```

---

## Step 4: Verify New Configuration

### Check Deployment

1. **Wait for deployment to complete**
2. **Get preview URL** (format: `https://payplan-dev-[hash].vercel.app`)
3. **Test routes**:
   ```bash
   # Should all return 200 OK (not 404)
   curl -I https://payplan-dev-[hash].vercel.app/
   curl -I https://payplan-dev-[hash].vercel.app/transactions
   curl -I https://payplan-dev-[hash].vercel.app/categories
   curl -I https://payplan-dev-[hash].vercel.app/budgets
   ```

### Check GitHub Integration

1. **Go to PR #57**: https://github.com/mmtuentertainment/PayPlan/pull/57
2. **Verify only ONE Vercel check** appears (not two)
3. **Check name**: Should show `Vercel – payplan-dev` (or your chosen name)

---

## Step 5: Update Branch Protection Rules (Optional)

If you have branch protection rules requiring Vercel checks:

1. **Go to GitHub Repo Settings → Branches**
2. **Edit protection rule for `main`**
3. **Update "Status checks"**:
   - Remove old checks: `Vercel – frontend`, `Vercel – payplan`
   - Add new check: `Vercel – payplan-dev`
4. **Save changes**

---

## Configuration Files

### `vercel.json` (Root)

```json
{
  "name": "payplan-dev",
  "framework": "vite",
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Key Settings**:
- `name`: Single project name
- `buildCommand`: Builds from `frontend/` subdirectory
- `outputDirectory`: Points to Vite output
- `rewrites`: SPA fallback for React Router

### `.vercelignore` (Root)

Excludes unnecessary files:
- `node_modules/`
- `frontend/dist/` (Vercel builds fresh)
- `docs/`, `specs/`, `memory/`
- Test files, IDE configs

---

## Troubleshooting

### Issue: Still seeing two Vercel checks on PRs

**Cause**: Old webhooks still active
**Fix**:
1. Go to GitHub Repo Settings → Webhooks
2. Delete all Vercel webhooks
3. Reconnect Vercel (it will create new webhook)

### Issue: Build fails with "Cannot find frontend directory"

**Cause**: Vercel trying to build from wrong directory
**Fix**: Ensure `vercel.json` has correct build command:
```json
"buildCommand": "cd frontend && npm ci && npm run build"
```

### Issue: Routes return 404

**Cause**: Missing SPA rewrite rule
**Fix**: Ensure `vercel.json` has:
```json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

---

## Expected Result

After cleanup:

✅ **Single Vercel project**: `payplan-dev`
✅ **Single deployment per PR**: One preview URL
✅ **All routes work**: `/`, `/transactions`, `/categories`, etc.
✅ **Faster deployments**: No duplicate builds
✅ **Lower rate limit usage**: Half the builds

---

## Next Steps

1. Delete old projects (Step 1-2)
2. Create fresh project (Step 3)
3. Verify deployment (Step 4)
4. Update PR #57 with new preview URL
5. Re-run ChatGPT tests with new URL

---

## Questions?

If you encounter issues:
1. Check Vercel deployment logs
2. Run `vercel logs` CLI command
3. Check GitHub Actions for errors
4. Review `VERCEL-CONFIG.md` for detailed docs

---

**Ready to start?** Begin with Step 1: Delete old projects in Vercel Dashboard.
