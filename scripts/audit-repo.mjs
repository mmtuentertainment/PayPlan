#!/usr/bin/env node
/**
 * PayPlan Repo Audit (frontend-first, zero deps)
 * - Writes: ops/audits/audit-<YYYYMMDD-HHMM>.md and .json
 *
 * Usage:
 *   node scripts/audit-repo.mjs
 *   node scripts/audit-repo.mjs --baseline v0.1.5-a.1
 *   node scripts/audit-repo.mjs --no-gh   # skip GitHub PR inspection
 *
 * Notes:
 * - Auto-detects baseline = previous tag (v* sorted semver-ish) if not provided.
 * - If GitHub CLI (gh) is installed and authenticated, includes a PR summary.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const argv = Object.fromEntries(
  args.map(a => {
    const [k, ...rest] = a.replace(/^-+/, '').split('=');
    return [k, rest.length ? rest.join('=') : true];
  })
);

function sh(cmd, opts={}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'], ...opts }).trim();
  } catch (e) {
    return '';
  }
}

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

function nowStamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function* walk(dir, ignoreDirs = new Set(['node_modules','.git','dist','build','coverage','.vercel','.next'])) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ignoreDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p, ignoreDirs);
    else yield p;
  }
}

function countLines(filePath) {
  try {
    const buf = fs.readFileSync(filePath, 'utf8');
    // Count newline occurrences; ensure at least 1 for non-empty
    const lines = buf.split('\n').length;
    return lines;
  } catch {
    return 0;
  }
}

function extOf(p) { return path.extname(p).toLowerCase(); }

function semverTagSort(a,b) {
  // naive vX.Y.Z-ish sort; fallback lexicographically
  const va = (a||'').replace(/^v/,'').split('.').map(n=>parseInt(n,10)||0);
  const vb = (b||'').replace(/^v/,'').split('.').map(n=>parseInt(n,10)||0);
  for (let i=0;i<Math.max(va.length,vb.length);i++){
    const da = va[i]||0, db = vb[i]||0;
    if (da!==db) return db-da;
  }
  return (b||'').localeCompare(a||'');
}

// --- Git info
const branch   = sh('git rev-parse --abbrev-ref HEAD') || 'unknown';
const headSha  = sh('git rev-parse --short HEAD') || 'unknown';
const headDate = sh('git show -s --format=%ci HEAD');
const tagsRaw  = sh(`git tag --list "v*"`) || '';
const tags = tagsRaw.split('\n').filter(Boolean).sort(semverTagSort);
const latestTag = tags[0] || '';
const prevTag   = tags[1] || '';
const baseline  = argv.baseline && argv.baseline !== true ? String(argv.baseline) : (prevTag || '');

const commitsLast50 = sh('git log --pretty=format:"%h %ad %s" --date=short -n 50');
const shortlog = sh('git shortlog -sne --all');

// --- Diff against baseline
const hasBaseline = Boolean(baseline && sh(`git rev-parse -q --verify ${baseline}`));
const diffStat = hasBaseline ? sh(`git diff --shortstat ${baseline}..HEAD`) : '(no baseline)';
const diffNames = hasBaseline ? sh(`git diff --name-status ${baseline}..HEAD`) : '';
const addedRemoved = (() => {
  if (!hasBaseline) return { added: 0, deleted: 0, changedFiles: 0 };
  const m = diffStat.match(/(\d+)\sfiles* changed(?:, (\d+)\sinsertions?\(\+\))?(?:, (\d+)\sdeletions?\(-\))?/);
  return {
    changedFiles: m ? parseInt(m[1]||'0',10) : 0,
    added: m ? parseInt(m[2]||'0',10) : 0,
    deleted: m ? parseInt(m[3]||'0',10) : 0
  };
})();

// --- Structure probes
const root = process.cwd();
const indicators = {
  hasAppsDir: exists(path.join(root,'apps')),
  hasPackagesDir: exists(path.join(root,'packages')),
  hasTurbo: exists(path.join(root,'turbo.json')),
  hasPnpmWorkspace: exists(path.join(root,'pnpm-workspace.yaml')),
  hasFrontend: exists(path.join(root,'frontend')),
  hasApiDir: exists(path.join(root,'api')) || exists(path.join(root,'vercel.json')),
};

let moduleStyle = 'monolith';
if (indicators.hasAppsDir || indicators.hasPackagesDir || indicators.hasTurbo || indicators.hasPnpmWorkspace) {
  moduleStyle = 'monorepo';
} else if (indicators.hasFrontend) {
  moduleStyle = 'modular (frontend folder)';
}

// --- File stats (focused on frontend/src if present)
const scanRoot = indicators.hasFrontend ? path.join(root,'frontend','src') : path.join(root);
const fileStats = {
  totalFiles: 0,
  byExt: { '.ts':0,'.tsx':0,'.js':0,'.jsx':0,'.json':0,'.css':0,'.md':0 },
  tests: 0,
  totalLoc: 0,
  topDirs: {} // { dir: fileCount }
};

for (const file of walk(scanRoot)) {
  fileStats.totalFiles++;
  const ext = extOf(file);
  if (fileStats.byExt[ext] !== undefined) fileStats.byExt[ext]++;
  const isTest = /\.test\.(t|j)sx?$/.test(file) || /(^|\/)tests?\//.test(file);
  if (isTest) fileStats.tests++;
  // LOC (only for source code)
  if (['.ts','.tsx','.js','.jsx'].includes(ext)) {
    fileStats.totalLoc += countLines(file);
  }
  const top = path.relative(scanRoot, file).split(path.sep)[0] || '.';
  fileStats.topDirs[top] = (fileStats.topDirs[top]||0) + 1;
}

// --- Presence checks for key modules
const present = {
  emailExtractor: exists(path.join(root,'frontend','src','lib','email-extractor.ts')),
  providerDetectors: exists(path.join(root,'frontend','src','lib','provider-detectors.ts')),
  dateParser: exists(path.join(root,'frontend','src','lib','date-parser.ts')),
  redact: exists(path.join(root,'frontend','src','lib','redact.ts')),
  detectLocale: exists(path.join(root,'frontend','src','utils','detect-locale.ts')),
  localeToggle: exists(path.join(root,'frontend','src','components','LocaleToggle.tsx')),
  emailPreview: exists(path.join(root,'frontend','src','components','EmailPreview.tsx')),
  emailIssues: exists(path.join(root,'frontend','src','components','EmailIssues.tsx')),
  useEmailExtractor: exists(path.join(root,'frontend','src','hooks','useEmailExtractor.ts')),
  apiPlan: exists(path.join(root,'api','plan.ts')) || exists(path.join(root,'api','plan.js')) || exists(path.join(root,'frontend','api','plan.ts')),
};

// --- Optional PRs via GitHub CLI
let prSummary = '';
if (!argv['no-gh']) {
  const ghOk = !!sh('gh --version');
  if (ghOk) {
    prSummary = sh('gh pr list --limit 30 --state all --json number,title,state,mergedAt,headRefName,baseRefName | jq -r \'.[] | "#"+.number+" ["+.state+"] "+.title+" ("+.headRefName+"->"+.baseRefName+") "+(.mergedAt//"")\'');
    if (!prSummary) {
      // try without jq
      prSummary = sh('gh pr list --limit 10 --state all');
    }
  }
}

// --- Compose outputs
const stamp = nowStamp();
const outDir = path.join(root, 'ops', 'audits');
fs.mkdirSync(outDir, { recursive: true });

const summary = {
  meta: { when: new Date().toISOString(), branch, headSha, headDate },
  tags: { latestTag, prevTag, baseline: hasBaseline ? baseline : null, tagsCount: tags.length },
  diff: { ...addedRemoved, baseline, hasBaseline, names: diffNames.split('\n').filter(Boolean).slice(0,200) },
  structure: { moduleStyle, indicators },
  files: fileStats,
  modulesPresent: present,
  authors: shortlog.split('\n').slice(0,20),
  recentCommits: commitsLast50.split('\n').slice(0,30),
  prs: prSummary ? prSummary.split('\n') : []
};

const md = `# PayPlan Repository Audit (${stamp})

## Meta
- Branch: \`${branch}\`
- HEAD: \`${headSha}\` on ${headDate}
- Latest tag: \`${latestTag||'-'}\`
- Baseline: \`${hasBaseline?baseline:'(none)'}\`

## Structure
- Style: **${moduleStyle}**
- Indicators: ${Object.entries(indicators).map(([k,v])=>`${k}=${v?'✅':'❌'}`).join(', ')}

## File Stats (scanned: ${path.relative(root, scanRoot) || '.'})
- Total files: ${fileStats.totalFiles}
- LOC (ts/js): ${fileStats.totalLoc}
- By ext: ${Object.entries(fileStats.byExt).map(([k,v])=>`${k}:${v}`).join(', ')}
- Test files: ${fileStats.tests}
- Top subdirs: ${Object.entries(fileStats.topDirs).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([d,c])=>`${d}(${c})`).join(', ')}

## Key Module Presence
${Object.entries(present).map(([k,v])=>`- ${k}: ${v?'✅':'❌'}`).join('\n')}

## Diff vs Baseline ${hasBaseline? `(\`${baseline}\`)` : '(none)'}
- ${hasBaseline ? `${addedRemoved.changedFiles} files changed, +${addedRemoved.added} / -${addedRemoved.deleted}` : 'n/a'}
${hasBaseline ? `\n<details><summary>Changed files (first 200)</summary>\n\n${summary.diff.names.map(n=>'- '+n).join('\n')}\n\n</details>\n` : ''}

## Authors (top 20)
\`\`\`
${summary.authors.join('\n')}
\`\`\`

## Recent Commits (last 30)
\`\`\`
${summary.recentCommits.join('\n')}
\`\`\`

## PRs (last 10-30 via gh)
\`\`\`
${summary.prs.slice(0,30).join('\n') || '(gh unavailable or not authenticated)'}
\`\`\`

---

### Plan Alignment Hints
- Modular front-end libs detected: ${present.emailExtractor&&present.providerDetectors&&present.dateParser?'✅':'❓'} (email-extractor/provider-detectors/date-parser)
- Locale system present: ${present.detectLocale&&present.localeToggle?'✅':'❌'}
- Preview/Issues components present: ${present.emailPreview&&present.emailIssues?'✅':'❌'}
- Hook present: ${present.useEmailExtractor?'✅':'❌'}
- API plan route present: ${present.apiPlan?'✅ (serverless function)': '⚠️ not found in common paths'}

> Use this section to realign upcoming micro-batches (e.g., currency detection, quick-fix UI, persistence).
`;

const mdPath = path.join(outDir, `audit-${stamp}.md`);
const jsonPath = path.join(outDir, `audit-${stamp}.json`);
fs.writeFileSync(mdPath, md, 'utf8');
fs.writeFileSync(jsonPath, JSON.stringify(summary,null,2), 'utf8');

console.log(`Wrote:\n- ${path.relative(root, mdPath)}\n- ${path.relative(root, jsonPath)}`);
if (!hasBaseline) {
  console.warn('Note: no baseline tag detected. Pass one via --baseline vX.Y.Z for diff context.');
}
