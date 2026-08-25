#!/bin/bash
set -e

# Default to localhost if not specified
BASE_URL=${API_BASE_URL:-"http://localhost:8080"}

# Ensure DATABASE_URL is set for psql
if [ -z "$DATABASE_URL" ]; then
  # Try reading from backend/.env if it exists and DATABASE_URL is not set
  if [ -f "./backend/.env" ]; then
    export $(grep -v '^#' ./backend/.env | xargs)
  else
    echo "Error: DATABASE_URL must be set in the environment or backend/.env"
    exit 1
  fi
fi

CLEANUP=true
if [ "$1" == "--no-cleanup" ]; then
  CLEANUP=false
fi

# Utility for printing PASS/FAIL
print_result() {
  if [ "$1" -eq 0 ]; then
    echo -e "[\033[32mPASS\033[0m] $2"
  else
    echo -e "[\033[31mFAIL\033[0m] $2"
  fi
}

echo "Starting automated tests..."
echo "Using DATABASE_URL: $DATABASE_URL"

# Create a minimal valid 1x1 PNG (base64-decoded) for upload testing.
# A plain text file would be rejected by the backend's MIME-sniffing validation.
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" | base64 -d > /tmp/dummy.png

# Generate timestamps
TS=$(date +%s)
USER_A="testA-$TS@example.com"
USER_B="testB-$TS@example.com"
USER_C="testC-$TS@example.com"
PASS="password123"
NEW_PASS="password456"

CREATED_USERS=()

cleanup() {
  if [ "$CLEANUP" = true ]; then
    echo -e "\nCleaning up test users..."
    for u in "${CREATED_USERS[@]}"; do
      psql "$DATABASE_URL" -tAc "DELETE FROM users WHERE email = '$u';" >/dev/null 2>&1 || true
    done
    rm -f cookieA.txt cookieB.txt cookieC.txt cookieA_old.txt cookieA_new.txt /tmp/dummy.png
  else
    echo -e "\nSkipping cleanup (--no-cleanup flag used)."
  fi
}
trap cleanup EXIT

# -------------------------------------------------------------------------
# Setup: Create Test Users
# -------------------------------------------------------------------------

# Create User A
RES_A=$(curl -s -c cookieA.txt -X POST "$BASE_URL/auth/signup" -H "Content-Type: application/json" -d "{\"email\":\"$USER_A\", \"password\":\"$PASS\"}")
ID_A=$(echo "$RES_A" | grep -o '"user_id":"[^"]*"' | awk -F'"' '{print $4}')
if [ -z "$ID_A" ]; then
  echo "Failed to sign up User A: $RES_A"
  exit 1
fi
CREATED_USERS+=("$USER_A")

# Create User B
RES_B=$(curl -s -c cookieB.txt -X POST "$BASE_URL/auth/signup" -H "Content-Type: application/json" -d "{\"email\":\"$USER_B\", \"password\":\"$PASS\"}")
ID_B=$(echo "$RES_B" | grep -o '"user_id":"[^"]*"' | awk -F'"' '{print $4}')
CREATED_USERS+=("$USER_B")

# Elevate User A to a starter plan so they can create a book project
psql "$DATABASE_URL" -c "UPDATE subscriptions SET plan = 'starter', status = 'active' WHERE user_id = '${ID_A}';" >/dev/null 2>&1

# -------------------------------------------------------------------------
# Test 1: IDOR fix on job status
# -------------------------------------------------------------------------
RES_PROJ=$(curl -s -b cookieA.txt -X POST "$BASE_URL/book-projects" -H "Content-Type: application/json" -d '{"title":"Test Project"}')
PROJ_ID=$(echo "$RES_PROJ" | grep -o '"id":"[^"]*"' | awk -F'"' '{print $4}')

RES_UP=$(curl -s -b cookieA.txt -X POST "$BASE_URL/upload" -F "cover=@/tmp/dummy.png" -F "book_project_id=$PROJ_ID")
JOB_ID=$(echo "$RES_UP" | grep -o '"job_id":"[^"]*"' | awk -F'"' '{print $4}')

STATUS_B=$(curl -s -o /dev/null -w "%{http_code}" -b cookieB.txt "$BASE_URL/jobs/$JOB_ID")
if [ "$STATUS_B" = "404" ]; then
  print_result 0 "1. IDOR fix on job status (User B got 404 on User A's job)"
else
  print_result 1 "1. IDOR fix on job status (Expected 404, got $STATUS_B)"
fi

# -------------------------------------------------------------------------
# Test 2: Race condition in versioning
# -------------------------------------------------------------------------
# Fire two near-simultaneous uploads to the same project
curl -s -b cookieA.txt -X POST "$BASE_URL/upload" -F "cover=@/tmp/dummy.png" -F "book_project_id=$PROJ_ID" >/dev/null &
PID1=$!
curl -s -b cookieA.txt -X POST "$BASE_URL/upload" -F "cover=@/tmp/dummy.png" -F "book_project_id=$PROJ_ID" >/dev/null &
PID2=$!
wait $PID1
wait $PID2

# Query the database directly
VERSIONS=$(psql "$DATABASE_URL" -tAc "SELECT version_number FROM covers WHERE book_project_id = '$PROJ_ID' ORDER BY version_number ASC;" | paste -sd, -)
if [ "$VERSIONS" = "1,2,3" ]; then
  print_result 0 "2. Race condition in versioning (Versions are strictly sequential: $VERSIONS)"
else
  print_result 1 "2. Race condition in versioning (Got duplicate or missing versions: $VERSIONS)"
fi

# -------------------------------------------------------------------------
# Test 3: Change password
# -------------------------------------------------------------------------
curl -s -b cookieA.txt -X POST "$BASE_URL/user/change-password" -H "Content-Type: application/json" -d "{\"current_password\":\"$PASS\", \"new_password\":\"$NEW_PASS\"}" >/dev/null

# Attempt login with OLD password
STATUS_OLD=$(curl -s -o /dev/null -w "%{http_code}" -c cookieA_old.txt -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$USER_A\", \"password\":\"$PASS\"}")
# Attempt login with NEW password
STATUS_NEW=$(curl -s -o /dev/null -w "%{http_code}" -c cookieA_new.txt -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$USER_A\", \"password\":\"$NEW_PASS\"}")

if [ "$STATUS_OLD" = "401" ] && [ "$STATUS_NEW" = "200" ]; then
  print_result 0 "3. Change password (Old password correctly fails, new password succeeds)"
else
  print_result 1 "3. Change password (Expected 401/200, got $STATUS_OLD / $STATUS_NEW)"
fi

# -------------------------------------------------------------------------
# Test 4 & 5: Manual Browser Checks
# -------------------------------------------------------------------------
echo ""
echo "-------------------------------------------------------------------------"
echo "4. Unknown route handling:"
echo "   [MANUAL] Open http://localhost:5173/#this-page-does-not-exist"
echo "   Confirm 'Page Not Found' view renders successfully."
echo ""
echo "5. Error Boundary and backend-down state:"
echo "   [MANUAL] Disconnect your network or kill the backend server."
echo "   Confirm the fallback UI renders instead of a blank screen."
echo "-------------------------------------------------------------------------"
echo ""

# -------------------------------------------------------------------------
# Test 6: Account Deletion
# -------------------------------------------------------------------------
# Sign up User C
RES_C=$(curl -s -c cookieC.txt -X POST "$BASE_URL/auth/signup" -H "Content-Type: application/json" -d "{\"email\":\"$USER_C\", \"password\":\"$PASS\"}")
ID_C=$(echo "$RES_C" | grep -o '"user_id":"[^"]*"' | awk -F'"' '{print $4}')
CREATED_USERS+=("$USER_C")

# Give polar subscription ID for the test (bypass checkout)
psql "$DATABASE_URL" -c "UPDATE subscriptions SET plan = 'starter', status = 'active', polar_subscription_id = 'fake-sub-test-123' WHERE user_id = '${ID_C}';" >/dev/null 2>&1

# Upload a cover (no project)
curl -s -b cookieC.txt -X POST "$BASE_URL/upload" -F "cover=@/tmp/dummy.png" >/dev/null

# Delete account
STATUS_DEL=$(curl -s -o /dev/null -w "%{http_code}" -b cookieC.txt -X DELETE "$BASE_URL/user/me")

if [ "$STATUS_DEL" != "200" ]; then
  print_result 1 "6. Account deletion (DELETE request failed with status $STATUS_DEL)"
else
  # Verify DB cascade cleanup
  USER_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM users WHERE id = '$ID_C';")
  SUB_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM subscriptions WHERE user_id = '$ID_C';")
  COVER_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM covers WHERE user_id = '$ID_C';")

  if [ "$USER_COUNT" = "0" ] && [ "$SUB_COUNT" = "0" ] && [ "$COVER_COUNT" = "0" ]; then
    print_result 0 "6. Account deletion (User, Subscription, and Covers removed via Cascade/API)"
    echo "       -> Note: This tests the DB/S3 cleanup logic. The real Polar cancellation API"
    echo "       -> requires a manual browser test with a real/test-mode checkout session."
  else
    print_result 1 "6. Account deletion (Cleanup failed. User: $USER_COUNT, Sub: $SUB_COUNT, Covers: $COVER_COUNT)"
  fi
fi

echo -e "\nTest run complete."
