#!/usr/bin/env bash
set -euo pipefail

# Simple PR monitor: logs PR status every 30s
# Requires: gh (GitHub CLI) already authenticated

INTERVAL="${INTERVAL:-30}"
LOG_DIR="${LOG_DIR:-logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/pr-monitor.log"
META_FILE="$LOG_DIR/pr-monitor.meta"

branch=$(git rev-parse --abbrev-ref HEAD)
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)

# Resolve PR number for current branch (open or closed)
pr_number=$(gh pr list --head "$branch" --state all --json number --jq '.[0].number' || true)

if [[ -z "${pr_number:-}" ]]; then
  echo "[$(date -Is)] No PR found for branch '$branch' in repo '$repo'" | tee -a "$LOG_FILE"
  exit 0
fi

echo "repo=$repo" > "$META_FILE"
echo "branch=$branch" >> "$META_FILE"
echo "pr=$pr_number" >> "$META_FILE"
echo "interval=$INTERVAL" >> "$META_FILE"

echo "[$(date -Is)] Monitoring PR #$pr_number on $repo (branch: $branch) every ${INTERVAL}s" | tee -a "$LOG_FILE"

while true; do
  ts=$(date -Is)
  # Core PR info
  gh pr view "$pr_number" --json number,title,state,mergeStateStatus,mergeable,updatedAt,headRefName,baseRefName,author --repo "$repo" \
    | jq -c \
    | sed "s/^/[$ts] PR_INFO /" \
    | tee -a "$LOG_FILE" >/dev/null

  # Latest reviews snapshot (summary only: state and author, last 10)
  gh pr view "$pr_number" --json latestReviews --repo "$repo" \
    | jq -c '.latestReviews | [.[] | {state: .state, author: .author.login, submittedAt: .submittedAt}] | .[:10]' \
    | sed "s/^/[$ts] REVIEWS /" \
    | tee -a "$LOG_FILE" >/dev/null

  # Checks summary (if available)
  if gh pr checks "$pr_number" --repo "$repo" >/dev/null 2>&1; then
    gh pr checks "$pr_number" --repo "$repo" \
      | sed "s/^/[$ts] CHECKS  /" \
      | tee -a "$LOG_FILE" >/dev/null
  fi

  sleep "$INTERVAL"
done

