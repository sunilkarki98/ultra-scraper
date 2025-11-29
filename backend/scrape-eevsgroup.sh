#!/bin/bash
# Scrape eevsgroup.com

# 1. Signup/Login to get token
echo "🔑 Authenticating..."
TOKEN_RESP=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test-$(date +%s)@example.com\",
    \"password\": \"TestPass123!\",
    \"name\": \"Terminal User\"
  }")

TOKEN=$(echo $TOKEN_RESP | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Auth failed. Trying login..."
    # Fallback to login if user exists (simplified for script)
    echo "Please run with a fresh database or check logs."
    exit 1
fi

# 2. Trigger Scrape
echo "🚀 Scraping eevsgroup.com..."
JOB_RESP=$(curl -s -X POST http://localhost:3000/api/scraper/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://eevsgroup.com"
  }')

JOB_ID=$(echo $JOB_RESP | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)
echo "✅ Job ID: $JOB_ID"

# 3. Poll Status
echo "⏳ Waiting for results..."
while true; do
    sleep 5
    STATUS_RESP=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/scraper/job/$JOB_ID)
    STATUS=$(echo $STATUS_RESP | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    echo "   Status: $STATUS"
    
    if [ "$STATUS" == "completed" ]; then
        echo "🎉 DONE! Result preview:"
        echo $STATUS_RESP | grep -o '"result":.*' | cut -c 1-200
        break
    elif [ "$STATUS" == "failed" ]; then
        echo "❌ Failed."
        echo $STATUS_RESP
        break
    fi
done
