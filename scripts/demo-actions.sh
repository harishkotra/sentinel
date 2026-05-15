#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"

run_case() {
  local name="$1"
  local prompt="$2"
  echo "== $name =="
  curl -s -X POST "$API_URL/api/security/scan" \
    -H 'content-type: application/json' \
    -d "{\"sessionId\":\"demo-actions\",\"actor\":\"user\",\"surface\":\"user_prompt\",\"input\":\"$prompt\"}" | jq '{action, level: .assessment.level, score: .assessment.totalScore, reasons: .assessment.reasons}'
  echo
}

run_case "WARN" "sentinel_demo_warn Please summarize this paragraph"
run_case "SANITIZE" "sentinel_demo_sanitize Please summarize this paragraph"
run_case "REQUIRE_HUMAN_APPROVAL" "sentinel_demo_approval Please summarize this paragraph"
run_case "BLOCK" "sentinel_demo_block Please summarize this paragraph"
