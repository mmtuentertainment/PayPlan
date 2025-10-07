#!/usr/bin/env node
// Delta 0016 — API Drift Sentinel (Node 20, built-ins only)
import { execSync } from "node:child_process";

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function mergeBase() {
  try {
    const remote = process.env.GITHUB_BASE_REF || "origin/main";
    return sh(`git merge-base HEAD ${remote}`);
  } catch {
    try {
      return sh(`git rev-parse HEAD~1`);
    } catch {
      return sh(`git rev-parse HEAD`);
    }
  }
}

function changedFiles(base) {
  try {
    const result = sh(`git diff --name-only ${base}...HEAD`);
    return result.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const API_PATTERNS = [
  /^api\/.*/i,
  /^frontend\/src\/pages\/api\/.*/i,
  /vercel\.json$/i,
  /serverless\.yml$/i,
  /^frontend\/src\/lib\/.*shifter.*\.ts$/i,
  /^frontend\/src\/lib\/.*ics.*\.ts$/i,
];

const SPEC_FILES = [
  "openapi.yaml",
  "openapi.yml",
  "api/openapi.yaml",
  "api/openapi.yml",
];

function matchesAny(fp, regs) {
  return regs.some((r) => r.test(fp));
}

const base = process.env.API_DRIFT_BASE || mergeBase();
const files = changedFiles(base);

const api_changes = files.filter((f) => matchesAny(f, API_PATTERNS));
const spec_changes = files.filter((f) => SPEC_FILES.includes(f));

const sha = (() => {
  try {
    return sh(`git rev-parse --short HEAD`);
  } catch {
    return "HEAD";
  }
})();

if (api_changes.length && spec_changes.length === 0) {
  const pd = {
    type: "about:blank",
    title: "API drift detected (spec not updated)",
    detail: "API files changed without an OpenAPI spec change.",
    instance: sha,
    api_changes,
    spec_touched: false,
    remediation: "Update openapi.(yml|yaml) or justify with label 'api-no-spec'.",
  };
  console.log(JSON.stringify(pd, null, 2));
  process.exit(1);
}

if (api_changes.length === 0) {
  console.log("No API changes detected; skipping.");
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      title: "API changes with spec touch detected",
      instance: sha,
      api_changes,
      spec_touched: true,
    },
    null,
    2
  )
);
process.exit(0);
