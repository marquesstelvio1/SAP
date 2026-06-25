#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_URL="${API_URL:-http://localhost:4000}"
REPORT_DIR="${SCRIPT_DIR}/reports"

mkdir -p "$REPORT_DIR"

echo "=== Running Load Tests ==="
echo "API URL: $API_URL"
echo ""

# Auth scenario
echo "--- Auth Scenario ---"
k6 run --out json="$REPORT_DIR/auth-results.json" \
  -e API_URL="$API_URL" \
  "$SCRIPT_DIR/scenarios/auth-scenario.js" || true

# Cargo scenario
echo "--- Cargo Scenario ---"
k6 run --out json="$REPORT_DIR/cargo-results.json" \
  -e API_URL="$API_URL" \
  "$SCRIPT_DIR/scenarios/cargo-scenario.js" || true

# Tracking scenario
echo "--- Tracking Scenario ---"
k6 run --out json="$REPORT_DIR/tracking-results.json" \
  -e API_URL="$API_URL" \
  "$SCRIPT_DIR/scenarios/tracking-scenario.js" || true

echo ""
echo "=== Load Tests Complete ==="
echo "Reports saved to: $REPORT_DIR"
