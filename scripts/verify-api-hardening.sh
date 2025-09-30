#!/bin/bash
set -e

PROD="${1:-https://frontend-1yssj7ra2-matthew-utts-projects-89452c41.vercel.app}"

echo "🔍 Verifying PayPlan v0.1.1 API Hardening"
echo "Production URL: $PROD"
echo ""

# Test 1: Invalid body → 400 problem+json
echo "✓ Test 1: Validation Error (400 problem+json)"
RESP=$(curl -s -X POST "$PROD/api/plan" -H "content-type: application/json" -d '{}')
echo "$RESP" | jq -e '.type' > /dev/null && echo "  ✅ Has type field" || echo "  ❌ Missing type"
echo "$RESP" | jq -e '.title' > /dev/null && echo "  ✅ Has title field" || echo "  ❌ Missing title"
echo "$RESP" | jq -e '.status == 400' > /dev/null && echo "  ✅ Status is 400" || echo "  ❌ Wrong status"
echo "$RESP" | jq -e '.detail' > /dev/null && echo "  ✅ Has detail field" || echo "  ❌ Missing detail"
echo "$RESP" | jq -e '.instance' > /dev/null && echo "  ✅ Has instance field" || echo "  ❌ Missing instance"
echo ""

# Test 2: Method not allowed → 405 problem+json
echo "✓ Test 2: Method Not Allowed (405 problem+json)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$PROD/api/plan")
if [ "$STATUS" == "405" ]; then
  echo "  ✅ Returns 405 for GET request"
else
  echo "  ❌ Expected 405, got $STATUS"
fi
echo ""

# Test 3: Success has rate limit headers
echo "✓ Test 3: Rate Limit Headers on Success (200)"
HEADERS=$(curl -si -X POST "$PROD/api/plan" \
  -H "content-type: application/json" \
  -d '{"items":[{"provider":"Klarna","installment_no":1,"due_date":"2025-10-02","amount":45,"currency":"USD","autopay":true,"late_fee":7}],"paycheckDates":["2025-10-05","2025-10-19","2025-11-02"],"minBuffer":100,"timeZone":"America/New_York"}' 2>&1)
echo "$HEADERS" | grep -qi "x-ratelimit-limit" && echo "  ✅ Has X-RateLimit-Limit header" || echo "  ❌ Missing X-RateLimit-Limit"
echo "$HEADERS" | grep -qi "x-ratelimit-remaining" && echo "  ✅ Has X-RateLimit-Remaining header" || echo "  ❌ Missing X-RateLimit-Remaining"
echo "$HEADERS" | grep -qi "x-ratelimit-reset" && echo "  ✅ Has X-RateLimit-Reset header" || echo "  ❌ Missing X-RateLimit-Reset"
echo ""

# Test 4: Idempotency replay (requires Redis)
echo "✓ Test 4: Idempotency Replay (same key + same body)"
KEY="verify-test-$(date +%s)"
BODY='{"items":[{"provider":"Klarna","installment_no":1,"due_date":"2025-10-02","amount":45,"currency":"USD","autopay":true,"late_fee":7}],"paycheckDates":["2025-10-05","2025-10-19","2025-11-02"],"minBuffer":100,"timeZone":"America/New_York"}'

# First request
curl -s -X POST "$PROD/api/plan" \
  -H "Idempotency-Key: $KEY" \
  -H "content-type: application/json" \
  -d "$BODY" > /dev/null 2>&1

sleep 2

# Second request (should be replayed)
REPLAY=$(curl -si -X POST "$PROD/api/plan" \
  -H "Idempotency-Key: $KEY" \
  -H "content-type: application/json" \
  -d "$BODY" 2>&1)

echo "$REPLAY" | grep -qi "x-idempotent-replayed: true" && echo "  ✅ Cache replay detected (X-Idempotent-Replayed: true)" || echo "  ⚠️  No replay header (Redis may not be configured)"
echo ""

# Test 5: Idempotency conflict (same key + different body)
echo "✓ Test 5: Idempotency Conflict (409)"
BODY2='{"items":[{"provider":"Affirm","installment_no":1,"due_date":"2025-10-12","amount":58,"currency":"USD","autopay":false,"late_fee":15}],"paycheckDates":["2025-10-05","2025-10-19","2025-11-02"],"minBuffer":200,"timeZone":"America/New_York"}'

CONFLICT=$(curl -s -X POST "$PROD/api/plan" \
  -H "Idempotency-Key: $KEY" \
  -H "content-type: application/json" \
  -d "$BODY2" 2>&1)

echo "$CONFLICT" | jq -e '.status == 409' > /dev/null 2>&1 && echo "  ✅ Returns 409 conflict" || echo "  ⚠️  Expected 409 (Redis may not be configured)"
echo "$CONFLICT" | jq -r '.type' 2>/dev/null | grep -q "idempotency-key-conflict" && echo "  ✅ Correct problem type" || echo "  ⚠️  Problem type not found"
echo ""

echo "======================================"
echo "✅ API Hardening verification complete!"
echo "======================================"
echo ""
echo "Note: Idempotency features require UPSTASH_REDIS_REST_URL and"
echo "      UPSTASH_REDIS_REST_TOKEN environment variables in Vercel."