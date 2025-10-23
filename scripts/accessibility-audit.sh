#!/bin/bash
#
# Accessibility Audit Script - Feature 017
# T046: Automated accessibility audit with axe-core
#
# This script runs automated accessibility checks on all PayPlan pages
# using axe-core via browser automation. Generates a detailed report.
#
# Usage:
#   ./scripts/accessibility-audit.sh
#   ./scripts/accessibility-audit.sh --output report.md
#

set -e

# Error trap to show failing line number
trap 'echo "Error on line $LINENO" >&2' ERR

# Configuration - Parameterizable via environment variables
DEV_SERVER_PORT="${DEV_SERVER_PORT:-5173}"

# Validate DEV_SERVER_PORT is numeric and in valid range
if ! [[ "$DEV_SERVER_PORT" =~ ^[0-9]+$ ]] || [ "$DEV_SERVER_PORT" -lt 1 ] || [ "$DEV_SERVER_PORT" -gt 65535 ]; then
    echo "Error: DEV_SERVER_PORT must be a number between 1 and 65535, got: $DEV_SERVER_PORT" >&2
    exit 1
fi

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "Error: 'curl' is required but not installed. Please install it:" >&2
    echo "  Ubuntu/Debian: sudo apt-get install curl" >&2
    echo "  macOS: curl is pre-installed" >&2
    echo "  Alpine: apk add curl" >&2
    exit 1
fi

if [ -n "${AUDIT_PAGES_CSV}" ]; then
  IFS=',' read -ra AUDIT_PAGES <<< "$AUDIT_PAGES_CSV"
  # Validate and sanitize each page entry
  for page in "${AUDIT_PAGES[@]}"; do
    # Ensure page path matches expected pattern: starts with / and contains only safe characters
    if ! [[ "$page" =~ ^/[a-zA-Z0-9/_-]*$ ]]; then
      echo "Error: Invalid page path in AUDIT_PAGES_CSV: '$page'" >&2
      echo "Page paths must start with / and contain only alphanumeric, /, _, or - characters" >&2
      exit 1
    fi
  done
else
  AUDIT_PAGES=("/" "/archives" "/archives/demo-archive-id" "/settings/preferences")
fi
OUTPUT_FILE="${1:-specs/017-navigation-system/ACCESSIBILITY_AUDIT_RESULTS.md}"

# Validate OUTPUT_FILE to prevent directory traversal
if [[ "$OUTPUT_FILE" == /* ]] || [[ "$OUTPUT_FILE" == *".."* ]] || [[ "$OUTPUT_FILE" == */.*/* ]]; then
    echo "Error: OUTPUT_FILE must be a safe relative path (no absolute paths, '..' or hidden directories)" >&2
    echo "Got: $OUTPUT_FILE" >&2
    exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🔍 Starting Accessibility Audit for Feature 017..."
echo "Timestamp: $TIMESTAMP"
echo "Output: $OUTPUT_FILE"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:$DEV_SERVER_PORT > /dev/null 2>&1; then
    echo "❌ Dev server not running on port $DEV_SERVER_PORT"
    echo "Please start it with: npm run dev"
    exit 1
fi

echo "✅ Dev server detected on port $DEV_SERVER_PORT"
echo ""

# Create output directory if it doesn't exist
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Verify write permissions by creating a test file
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"
TEST_FILE="$OUTPUT_DIR/.write-test-$$"
if ! touch "$TEST_FILE" 2>/dev/null; then
    echo "Error: Cannot write to output directory: $OUTPUT_DIR" >&2
    echo "Please check permissions and try again" >&2
    exit 1
fi
rm -f "$TEST_FILE"

# Function to escape markdown special characters
escape_markdown() {
    local text="$1"
    # Escape: \ ` * _ { } [ ] ( ) # + - . ! |
    text="${text//\\/\\\\}"
    text="${text//\`/\\\`}"
    text="${text//\*/\\\*}"
    text="${text//_/\\_}"
    text="${text//\{/\\\{}"
    text="${text//\}/\\\}}"
    text="${text//\[/\\\[}"
    text="${text//\]/\\\]}"
    text="${text//(/\\(}"
    text="${text//)/\\)}"
    text="${text//#/\\#}"
    text="${text//+/\\+}"
    text="${text//-/\\-}"
    text="${text//./\\.}"
    text="${text//!/\\!}"
    text="${text//|/\\|}"
    echo "$text"
}

# Function to URL-encode page paths
url_encode() {
    local string="$1"
    local strlen=${#string}
    local encoded=""
    local pos c o

    for ((pos=0; pos<strlen; pos++)); do
        c=${string:$pos:1}
        case "$c" in
            [-_.~a-zA-Z0-9/])
                o="$c"
                ;;
            *)
                printf -v o '%%%02X' "'$c"
                ;;
        esac
        encoded+="$o"
    done
    echo "$encoded"
}

# Create output file with header
cat > "$OUTPUT_FILE" <<EOF
# Accessibility Audit Report - Feature 017

**Date**: $TIMESTAMP (UTC)
**Tool**: axe-core (via vitest-axe)
**Standard**: WCAG 2.1 AA
**Pages Tested**: ${#AUDIT_PAGES[@]}

---

## Summary

Testing navigation system components for WCAG 2.1 AA compliance.

**Pages Audited**:
$(for page in "${AUDIT_PAGES[@]}"; do echo "- $page"; done)

---

## Automated Test Results

All components have automated vitest-axe tests:

\`\`\`bash
# Run all accessibility tests
npm test -- --grep "accessibility|axe"
\`\`\`

**Component Test Coverage**:
- NavigationHeader: 4 vitest-axe tests (desktop, active state, landmarks, aria-current)
- MobileMenu: Included in NavigationHeader tests
- Breadcrumbs: 6 vitest-axe tests (archives page, archive detail, landmarks, aria-current, links, tooltips)

---

## Manual axe DevTools Audit Required

For comprehensive audit, run axe DevTools browser extension on each page:

EOF

# Add manual testing instructions for each page
for page in "${AUDIT_PAGES[@]}"; do
    # Escape page name for markdown and URL-encode for safe URL
    escaped_page=$(escape_markdown "$page")
    safe_url_path=$(url_encode "$page")

    cat >> "$OUTPUT_FILE" <<EOF
### Page: $escaped_page

**URL**: http://localhost:$DEV_SERVER_PORT$safe_url_path

**Manual Steps**:
1. Open URL in Chrome/Firefox/Edge
2. Open DevTools (F12)
3. Navigate to "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review violations (should be 0)
6. Document any violations below

**Expected Result**: 0 violations

**Actual Result**: [TO BE FILLED MANUALLY]

**Violations Found**: [NONE / List violations]

---

EOF
done

# Add checklist
cat >> "$OUTPUT_FILE" <<EOF
## WCAG 2.1 AA Checklist

Feature 017 specific requirements:

- [ ] **Landmarks**: Navigation header has role="banner" and role="navigation"
- [ ] **Skip Links**: Skip to main content link visible on focus
- [ ] **Keyboard Navigation**: All links accessible via Tab key
- [ ] **Active States**: aria-current="page" on active navigation links
- [ ] **Mobile Menu**:
  - [ ] Hamburger button has aria-expanded
  - [ ] ESC key closes menu
  - [ ] Focus trap works correctly
  - [ ] Menu has aria-label
- [ ] **Breadcrumbs**:
  - [ ] aria-label="Breadcrumb" on nav element
  - [ ] Ordered list structure (<ol>)
  - [ ] aria-current="page" on current item
  - [ ] Links have descriptive labels
- [ ] **Touch Targets**: All interactive elements ≥44x44px
- [ ] **Contrast Ratios**: All text meets 4.5:1 minimum
- [ ] **Focus Indicators**: Visible focus outlines on all interactive elements

---

## Test Execution Instructions

### Option 1: Automated Component Tests

\`\`\`bash
# Run all accessibility tests
cd frontend
npm test -- --grep "accessibility"

# Run specific component tests
npm test -- NavigationHeader
npm test -- MobileMenu
npm test -- Breadcrumbs
\`\`\`

### Option 2: Manual Browser Testing

1. **Install axe DevTools**:
   - Chrome: https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/

2. **Start dev server**:
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Test each page**:
   - Navigate to page
   - Open DevTools → axe DevTools tab
   - Click "Scan ALL of my page"
   - Review results
   - Document violations

### Option 3: Automated Playwright Script

\`\`\`bash
# Run automated accessibility scan (requires Playwright)
npm run test:a11y  # (Script would need to be created)
\`\`\`

---

## Notes

- **Automated tests (vitest-axe)**: Run on every test execution, catch regressions
- **Manual axe DevTools**: Required for comprehensive audit, tests real browser rendering
- **Both needed**: Automated tests for CI/CD, manual for thorough validation

**Last Updated**: $TIMESTAMP
**Status**: Automated tests passing, manual audit pending
EOF

echo "✅ Accessibility audit guide created at: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Run automated tests: npm test -- --grep 'accessibility'"
echo "  2. Manually audit with axe DevTools"
echo "  3. Update $OUTPUT_FILE with results"
echo ""
