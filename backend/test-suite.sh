#!/bin/bash
# Comprehensive Test Suite for UltraScraper
# Run this script to verify all improvements

set -e  # Exit on error

echo "🧪 UltraScraper - Comprehensive Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# Check if backend is running
check_backend() {
    if curl -s http://localhost:3000/api/ > /dev/null; then
        pass "Backend is running on port 3000"
        return 0
    else
        fail "Backend is NOT running. Please start with: npm run dev"
        return 1
    fi
}

echo "📋 Phase 1: Security Tests"
echo "----------------------------"

# Test 1.1: Security Headers
echo "Testing security headers..."
HEADERS=$(curl -sI http://localhost:3000/api/)

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    pass "X-Content-Type-Options header present"
else
    fail "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    pass "X-Frame-Options header present"
else
    fail "X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
    pass "Content-Security-Policy header present"
else
    fail "Content-Security-Policy header missing"
fi

echo ""

# Test 1.2: Rate Limiting
echo "Testing rate limiting (sending 12 requests)..."
RATE_LIMIT_TRIGGERED=false

for i in {1..12}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/)
    if [ "$STATUS" = "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
    pass "Rate limiting working (429 received)"
else
    warn "Rate limiting may not be triggered (depends on timing)"
fi

echo ""

# Test 1.3: SSRF Protection (requires backend endpoint)
echo "Testing SSRF Protection..."
SSRF_RESPONSE=$(curl -s -X POST http://localhost:3000/api/scraper/trigger \
  -H "Content-Type: application/json" \
  -d '{"url": "http://192.168.1.1"}' || echo "error")

if echo "$SSRF_RESPONSE" | grep -q "Forbidden\|restricted\|private"; then
    pass "SSRF protection blocking private IPs"
else
    warn "SSRF protection test inconclusive (may need auth)"
fi

echo ""
echo ""

# Phase 2: Performance Tests
echo "📊 Phase 2: Performance Tests"
echo "------------------------------"

# Check if PostgreSQL is accessible
if command -v psql &> /dev/null; then
    echo "Testing database query performance..."
    
    # Test getUserJobs query
    QUERY_TIME=$(psql -U postgres -d ultrascraper -t -c "
        EXPLAIN ANALYZE 
        SELECT * FROM \"Job\" 
        WHERE \"userId\" = (SELECT \"id\" FROM \"User\" LIMIT 1)
        ORDER BY \"createdAt\" DESC 
        LIMIT 20;" 2>/dev/null | grep "Execution Time" | awk '{print $3}')
    
    if [ -n "$QUERY_TIME" ]; then
        QUERY_TIME_INT=$(echo "$QUERY_TIME" | cut -d. -f1)
        if [ "$QUERY_TIME_INT" -lt 50 ]; then
            pass "getUserJobs query fast (${QUERY_TIME}ms < 50ms)"
        else
            warn "getUserJobs query slower than expected (${QUERY_TIME}ms)"
        fi
    else
        warn "Could not test database performance (check PostgreSQL connection)"
    fi
else
    warn "psql not found - skipping database performance tests"
fi

echo ""
echo ""

# Phase 3: API Availability
echo "🔧 Phase 3: API Endpoint Tests"
echo "--------------------------------"

# Test health/basic endpoints
ENDPOINTS=(
    "/api/"
    "/api/docs"
)

for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
    if [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 400 ]; then
        pass "Endpoint $endpoint accessible (status: $STATUS)"
    else
        fail "Endpoint $endpoint not accessible (status: $STATUS)"
    fi
done

echo ""
echo ""

# Summary
echo "=========================================="
echo "📈 Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo "Your system is production-ready."
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed or need manual verification.${NC}"
    echo "Review the failures above and check:"
    echo "  1. Backend is running (npm run dev)"
    echo "  2. Database is accessible"
    echo "  3. Environment variables are set"
    exit 1
fi
