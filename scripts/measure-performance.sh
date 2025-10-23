#!/bin/bash
# Performance Measurement Script for Feature 018-technical-debt-cleanup
# Tracks build time and bundle size against baseline metrics

set -e

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

mkdir -p "$RESULTS_DIR"

echo "📊 Measuring Performance Metrics..."
echo "=================================="

# Measure build time
echo "⏱️  Measuring build time..."
START_TIME=$(date +%s%N)

# Run build and capture output to log file for diagnostics
BUILD_LOG="$RESULTS_DIR/build-$(date +%Y%m%d-%H%M%S).log"
if ! npm run build > "$BUILD_LOG" 2>&1; then
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

# Measure bundle size
echo "📦 Measuring bundle size..."
if [ -d "frontend/dist" ]; then
    BUNDLE_SIZE=$(du -sb frontend/dist | cut -f1)
    BUNDLE_SIZE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1048576" | bc)
    echo "Bundle size: ${BUNDLE_SIZE_MB}MB (${BUNDLE_SIZE} bytes)"
else
    echo "Warning: frontend/dist not found, bundle size measurement skipped"
    BUNDLE_SIZE=0
    BUNDLE_SIZE_MB="0.00"
fi

# Count tests
echo "🧪 Counting tests..."
TEST_COUNT=$(npm test 2>&1 | grep -oP '\d+ test(s)?' | head -1 | grep -oP '\d+' || echo "0")
echo "Test count: $TEST_COUNT"

# Output results using jq for safe JSON generation
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Use millisecond precision in filename to prevent collisions
RESULTS_FILE="$RESULTS_DIR/metrics-$(date +%Y%m%d-%H%M%S-%3N).json"

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

    if [ "$BASELINE_BUILD_TIME" != "0" ] && [ "$BASELINE_BUILD_TIME" != "null" ]; then
        BUILD_INCREASE=$(echo "scale=2; ($BUILD_TIME_SEC / $BASELINE_BUILD_TIME - 1) * 100" | bc)
        echo "  Build Time Change: ${BUILD_INCREASE}%"

        # Check threshold (NFR-004: ≤10%)
        if (( $(echo "$BUILD_INCREASE > 10" | bc -l) )); then
            echo "  ⚠️  WARNING: Build time increased by more than 10%"
        fi
    fi

    if [ "$BASELINE_BUNDLE_SIZE" != "0" ] && [ "$BASELINE_BUNDLE_SIZE" != "null" ]; then
        BUNDLE_INCREASE=$(echo "scale=2; ($BUNDLE_SIZE_MB / $BASELINE_BUNDLE_SIZE - 1) * 100" | bc)
        echo "  Bundle Size Change: ${BUNDLE_INCREASE}%"

        # Check threshold (NFR-004: ≤5%)
        if (( $(echo "$BUNDLE_INCREASE > 5" | bc -l) )); then
            echo "  ⚠️  WARNING: Bundle size increased by more than 5%"
        fi
    fi
else
    echo "ℹ️  No baseline file found. Run this script again after implementation to compare."
fi

echo ""
echo "Done!"
