echo "=== TODOS & FIXMES ==="
grep -rnEi "todo|fixme|hardcode|dummy|mock" frontend/src/ backend/internal/ backend/cmd/ | grep -v "node_modules" | head -n 30

echo -e "\n=== BACKEND HANDLERS WITH FAKE DATA (returning hardcoded json) ==="
grep -rn "gin.H{" backend/internal/api/ | grep -i "fake\|mock\|placeholder\|TODO"

echo -e "\n=== CHECKING SPECIFIC FRONTEND PAGES ==="
for page in WorkflowsPage.jsx ExportStudio.jsx ColorPalette.jsx ScoreReport.jsx AccountPage.jsx; do
  echo "Checking $page:"
  find frontend/src/ -name "$page" -exec grep -Hn "useState(" {} \;
  find frontend/src/ -name "$page" -exec grep -Hn "fetch" {} \;
done

echo -e "\n=== CHECKING PAYMENTS ==="
grep -rn "Polar" backend/internal/api/ frontend/src/ || echo "No Polar mentions"
grep -rn "Stripe" backend/internal/api/ frontend/src/ || echo "No Stripe mentions"

echo -e "\n=== CHECKING EMAILS (ZeptoMail) ==="
grep -rn "zepto" backend/internal/ || echo "No zeptomail mentions"

echo -e "\n=== CHECKING TEST FILES ==="
ls -l backend/cmd/test_scraper.go 2>/dev/null || echo "No test_scraper.go"

echo -e "\n=== CHECKING .ENV ==="
cat backend/.env | grep -v "apify" | grep -v "DATABASE_URL" | head -n 20
