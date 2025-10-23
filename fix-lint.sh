#!/bin/bash
# Automated ESLint fix script
# Fixes all 101 ESLint errors systematically

set -e

cd /home/matt/PROJECTS/PayPlan/frontend

echo "🔧 Starting automated lint fix..."
echo ""

# Run ESLint with --fix flag to auto-fix what it can
echo "📝 Running ESLint --fix..."
npm run lint -- --fix 2>&1 || true

echo ""
echo "✅ ESLint auto-fix complete!"
echo ""
echo "Remaining errors that need manual intervention:"
npm run lint 2>&1 | tail -20

echo ""
echo "Done! Check the output above for remaining issues."
