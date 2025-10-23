#!/bin/bash
# Performance Measurement Script for Feature 018-technical-debt-cleanup
# Tracks build time and bundle size against baseline metrics

set -euo pipefail

# Dependency checks
if ! command -v bc &> /dev/null; then
    echo "Error: 'bc' is required but not installed. Please install it:" >&2
    echo "  Ubuntu/Debian: sudo apt-get install bc" >&2
    echo "  macOS: brew install bc" >&2
    echo "  Alpine: apk add bc" >&2
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is required but not installed. Please install it:" >&2
    echo "  Ubuntu/Debian: sudo apt-get install jq" >&2
    echo "  macOS: brew install jq" >&2
    echo "  Alpine: apk add jq" >&2
    exit 1
fi

# Make paths configurable via environment variables for reuse across features
FEATURE_ID="${FEATURE_ID:-018-technical-debt-cleanup}"
BASE_DIR="${BASE_DIR:-specs/$FEATURE_ID}"
BASELINE_FILE="${BASELINE_FILE:-$BASE_DIR/BASELINE_METRICS.json}"
RESULTS_DIR="${RESULTS_DIR:-$BASE_DIR/performance-results}"
LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-7}"
FRONTEND_DIR="${FRONTEND_DIR:-frontend}"  # Configurable frontend directory

# Validate paths to prevent traversal attacks
if [[ "$FEATURE_ID" =~ \.\. ]] || [[ "$FEATURE_ID" =~ ^/ ]]; then
    echo "Error: FEATURE_ID must not contain '..' or start with '/'" >&2
    echo "  Got: $FEATURE_ID" >&2
    exit 1
fi

if [[ "$BASE_DIR" =~ \.\. ]] || [[ ! "$BASE_DIR" =~ ^specs/ ]]; then
    echo "Error: BASE_DIR must be under specs/ and not contain '..'" >&2
    echo "  Got: $BASE_DIR" >&2
    exit 1
fi

mkdir -p "$RESULTS_DIR"

# Clean up old log files (keep last N days)
if [ "$LOG_RETENTION_DAYS" -gt 0 ]; then
    find "$RESULTS_DIR" -name "*.log" -type f -mtime +"$LOG_RETENTION_DAYS" -delete 2>/dev/null || true
    find "$RESULTS_DIR" -name "metrics-*.json" -type f -mtime +"$LOG_RETENTION_DAYS" -delete 2>/dev/null || true
fi

echo "📊 Measuring Performance Metrics..."
echo "=================================="

# Validate frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found: $FRONTEND_DIR" >&2
    echo "  Set FRONTEND_DIR environment variable or run from project root" >&2
    exit 1
fi

# Check if package.json exists in frontend directory
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "Error: package.json not found in $FRONTEND_DIR" >&2
    exit 1
fi

# Measure build time
echo "⏱️  Measuring build time..."
START_TIME=$(date +%s%N)

# Run build from frontend directory and capture output to log file for diagnostics
BUILD_LOG="$RESULTS_DIR/build-$(date +%Y%m%d-%H%M%S).log"
if ! (cd "$FRONTEND_DIR" && npm run build) > "$BUILD_LOG" 2>&1; then
    echo "Error: Build failed. Cannot measure performance metrics." >&2
    echo "Build output (last 20 lines):" >&2
    tail -n 20 "$BUILD_LOG" >&2
    echo "" >&2
    echo "Full build log saved to: $BUILD_LOG" >&2
    exit 1
fi

# Build succeeded, remove log file to avoid clutter
rm -f "$BUILD_LOG"

END_TIME=$(date +%s%N)
BUILD_TIME_MS=$(( (END_TIME - START_TIME) / 1000000 ))
BUILD_TIME_SEC=$(echo "scale=2; $BUILD_TIME_MS / 1000" | bc)

echo "Build time: ${BUILD_TIME_SEC}s (${BUILD_TIME_MS}ms)"

# Measure bundle size (cross-platform)
echo "📦 Measuring bundle size..."
FRONTEND_DIST="${FRONTEND_DIST:-$FRONTEND_DIR/dist}"
if [ -d "$FRONTEND_DIST" ]; then
    # Use find + wc for cross-platform compatibility (works on macOS and Linux)
    BUNDLE_SIZE=$(find "$FRONTEND_DIST" -type f -exec wc -c {} + 2>/dev/null | awk 'END {print $1}' || echo "0")
    BUNDLE_SIZE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1048576" | bc)
    echo "Bundle size: ${BUNDLE_SIZE_MB}MB (${BUNDLE_SIZE} bytes)"
else
    echo "Warning: $FRONTEND_DIST not found, bundle size measurement skipped"
    BUNDLE_SIZE=0
    BUNDLE_SIZE_MB="0.00"
fi

# Count tests using Vitest list command (2025 best practice)
# This is faster than running the full test suite and more reliable than regex parsing
echo "🧪 Counting tests..."
if command -v npx &> /dev/null; then
    # Use Vitest's --list flag to count test cases without running them
    # This is 10-100x faster than running the full suite
    # Each line in the output is a test case (e.g., "tests/file.test.ts > describe > it")
    TEST_COUNT=$(cd "$FRONTEND_DIR" && npx vitest list 2>/dev/null | wc -l || echo "0")

    # Remove leading/trailing whitespace from wc output
    TEST_COUNT=$(echo "$TEST_COUNT" | tr -d '[:space:]')

    # Fallback: Count test files if vitest list fails or returns 0
    # WARNING: This creates inconsistent metrics (files ≠ test cases)
    # Only use fallback for environments where vitest list is unavailable
    if [ "$TEST_COUNT" = "0" ] || [ -z "$TEST_COUNT" ]; then
        TEST_COUNT=$(find "$FRONTEND_DIR/src" "$FRONTEND_DIR/tests" -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d '[:space:]')
        echo "  ⚠️  WARNING: Counted test FILES (vitest list failed). Metrics may be inconsistent."
        echo "  Test files: $TEST_COUNT (not test cases)"
    fi
else
    # Fallback: Count test files if npx is not available
    # WARNING: This creates inconsistent metrics (files ≠ test cases)
    TEST_COUNT=$(find "$FRONTEND_DIR/src" "$FRONTEND_DIR/tests" -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d '[:space:]')
    echo "  ⚠️  WARNING: Counted test FILES (npx not available). Metrics may be inconsistent."
    echo "  Test files: $TEST_COUNT (not test cases)"
fi

echo "Test count: $TEST_COUNT"

# Output results using jq for safe JSON generation
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Use millisecond precision in filename to prevent collisions
# Generate unique timestamp for results file (POSIX-compliant)
# Use PID for uniqueness since %3N (milliseconds) is not POSIX (P2: Claude review)
TIMESTAMP_UNIQUE="$(date +%Y%m%d-%H%M%S)-$$"
RESULTS_FILE="$RESULTS_DIR/metrics-${TIMESTAMP_UNIQUE}.json"

# Use jq to safely build JSON (prevents injection)
jq -n \
  --arg timestamp "$TIMESTAMP" \
  --argjson buildTimeMs "$BUILD_TIME_MS" \
  --arg buildTimeSec "$BUILD_TIME_SEC" \
  --argjson bundleSizeBytes "$BUNDLE_SIZE" \
  --arg bundleSizeMB "$BUNDLE_SIZE_MB" \
  --argjson testCount "$TEST_COUNT" \
  '{
    timestamp: $timestamp,
    buildTimeMs: $buildTimeMs,
    buildTimeSec: $buildTimeSec,
    bundleSizeBytes: $bundleSizeBytes,
    bundleSizeMB: $bundleSizeMB,
    testCount: $testCount
  }' > "$RESULTS_FILE"

echo ""
echo "✅ Results saved to: $RESULTS_FILE"
echo ""
echo "Summary:"
echo "  Build Time: ${BUILD_TIME_SEC}s"
echo "  Bundle Size: ${BUNDLE_SIZE_MB}MB"
echo "  Test Count: $TEST_COUNT"
echo ""

# Compare with baseline if it exists
if [ -f "$BASELINE_FILE" ]; then
    echo "📈 Comparing with baseline..."

    # Parse baseline JSON with jq (robust parsing)
    BASELINE_BUILD_TIME=$(jq -r '.buildTimeSec // "0"' "$BASELINE_FILE" 2>/dev/null || echo "0")
    BASELINE_BUNDLE_SIZE=$(jq -r '.bundleSizeMB // "0"' "$BASELINE_FILE" 2>/dev/null || echo "0")

    # Validate baseline values to prevent division by zero
    if [ "$BASELINE_BUILD_TIME" != "0" ] && [ "$BASELINE_BUILD_TIME" != "null" ] && [ "$BUILD_TIME_SEC" != "0.00" ]; then
        # Protect against zero division with bc comparison
        if (( $(echo "$BASELINE_BUILD_TIME > 0" | bc -l) )); then
            BUILD_INCREASE=$(echo "scale=2; ($BUILD_TIME_SEC / $BASELINE_BUILD_TIME - 1) * 100" | bc)
            echo "  Build Time Change: ${BUILD_INCREASE}%"

            # Check threshold (NFR-004: ≤10%)
            if (( $(echo "$BUILD_INCREASE > 10" | bc -l) )); then
                echo "  ⚠️  WARNING: Build time increased by more than 10%"
            fi
        else
            echo "  ⚠️  WARNING: Baseline build time is 0 or invalid, skipping comparison"
        fi
    fi

    # Validate baseline values to prevent division by zero
    if [ "$BASELINE_BUNDLE_SIZE" != "0" ] && [ "$BASELINE_BUNDLE_SIZE" != "null" ] && [ "$BUNDLE_SIZE_MB" != "0.00" ]; then
        # Protect against zero division with bc comparison
        if (( $(echo "$BASELINE_BUNDLE_SIZE > 0" | bc -l) )); then
            BUNDLE_INCREASE=$(echo "scale=2; ($BUNDLE_SIZE_MB / $BASELINE_BUNDLE_SIZE - 1) * 100" | bc)
            echo "  Bundle Size Change: ${BUNDLE_INCREASE}%"

            # Check threshold (NFR-004: ≤5%)
            if (( $(echo "$BUNDLE_INCREASE > 5" | bc -l) )); then
                echo "  ⚠️  WARNING: Bundle size increased by more than 5%"
            fi
        else
            echo "  ⚠️  WARNING: Baseline bundle size is 0 or invalid, skipping comparison"
        fi
    fi
else
    echo "ℹ️  No baseline file found. Run this script again after implementation to compare."
fi

echo ""
echo "Done!"
