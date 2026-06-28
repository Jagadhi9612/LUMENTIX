#!/bin/bash
# ELITE FITNESS FIREBASE LIVE DEPLOYMENT GUIDE
# Execute this step-by-step on your local machine or CI/CD

set -e

PROJECT_ID="elite-fitness-prod"
REGION="us-central1"
DOMAIN="app.eliteifitness.com"

echo "======================================"
echo "ELITE FITNESS LIVE DEPLOYMENT"
echo "======================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Domain: $DOMAIN"
echo "Start Time: $(date)"
echo "======================================"

# STEP 1: Pre-Deployment Checks
echo ""
echo "[STEP 1/10] Running pre-deployment checks..."
command -v firebase > /dev/null || { echo "Firebase CLI required. Install: npm install -g firebase-tools"; exit 1; }
command -v node > /dev/null || { echo "Node.js required"; exit 1; }
[ -f ".env.production" ] || { echo ".env.production required"; exit 1; }
echo "✓ Pre-deployment checks passed"

# STEP 2: Install Dependencies
echo ""
echo "[STEP 2/10] Installing dependencies..."
npm ci
echo "✓ Dependencies installed"

# STEP 3: Build API
echo ""
echo "[STEP 3/10] Building API for Cloud Functions..."
npm run build --workspace @elite/api
echo "✓ API build completed"

# STEP 4: Build Web
echo ""
echo "[STEP 4/10] Building web application..."
npm run build --workspace @elite/web
echo "✓ Web build completed"

# STEP 5: Type Checking
echo ""
echo "[STEP 5/10] Running type checks..."
npm run typecheck
echo "✓ Type checks passed"

# STEP 6: Linting
echo ""
echo "[STEP 6/10] Running linter..."
npm run lint
echo "✓ Linter checks passed"

# STEP 7: Database Backup
echo ""
echo "[STEP 7/10] Creating pre-deployment backup..."
if [ -n "$DATABASE_URL" ]; then
    BACKUP_FILE="backups/pre-deploy-$(date +%Y%m%d_%H%M%S).sql.gz"
    mkdir -p backups
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
    echo "✓ Backup created: $BACKUP_FILE"
else
    echo "⚠ Database URL not set, skipping backup"
fi

# STEP 8: Deploy Cloud Functions
echo ""
echo "[STEP 8/10] Deploying Cloud Functions..."
firebase deploy --project "$PROJECT_ID" --only functions:api
echo "✓ Cloud Functions deployed"

# STEP 9: Deploy Web Hosting
echo ""
echo "[STEP 9/10] Deploying web application..."
firebase deploy --project "$PROJECT_ID" --only hosting
echo "✓ Web application deployed"

# STEP 10: Deploy Firestore Rules & Indexes
echo ""
echo "[STEP 10/10] Deploying Firestore security rules..."
firebase deploy --project "$PROJECT_ID" --only firestore:rules,firestore:indexes,storage
echo "✓ Firestore rules deployed"

# POST-DEPLOYMENT VERIFICATION
echo ""
echo "======================================"
echo "POST-DEPLOYMENT VERIFICATION"
echo "======================================"

# Health Check
echo ""
echo "Health Check:"
API_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api"
HEALTH=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")
if echo "$HEALTH" | grep -q "ok"; then
    echo "✓ API Health Check: PASS"
else
    echo "✗ API Health Check: FAIL"
    echo "Response: $HEALTH"
fi

# Test Database Connection
echo ""
echo "Database Connection:"
if [ -n "$DATABASE_URL" ]; then
    if pg_isready -d "$DATABASE_URL" > /dev/null 2>&1; then
        echo "✓ Database Connection: PASS"
    else
        echo "✗ Database Connection: FAIL"
    fi
fi

# Verify Environment Variables
echo ""
echo "Environment Variables:"
echo "  - NODE_ENV: ${NODE_ENV:-not set}"
echo "  - CORS_ORIGIN: ${CORS_ORIGIN:-not set}"
echo "  - API_URL: $API_URL"
echo "  - Domain: $DOMAIN"

# DNS Configuration Reminder
echo ""
echo "======================================"
echo "DNS CONFIGURATION REQUIRED"
echo "======================================"
echo ""
echo "Update your DNS records to point to Firebase:"
echo ""
echo "CNAME Record:"
echo "  Name: app"
echo "  Value: c.storage.googleapis.com"
echo ""
echo "Or use:"
echo "  firebase hosting:channel:deploy live --project $PROJECT_ID"
echo ""

# Monitoring Setup Reminder
echo ""
echo "======================================"
echo "MONITORING SETUP"
echo "======================================"
echo ""
echo "Set up monitoring in Firebase Console:"
echo "  1. Go to https://console.firebase.google.com/project/$PROJECT_ID"
echo "  2. Enable Cloud Monitoring"
echo "  3. Create dashboards for:"
echo "     - API response times"
echo "     - Cloud Function errors"
echo "     - Firestore operations"
echo "     - Hosting performance"
echo ""

# Backup Verification
echo ""
echo "======================================"
echo "BACKUP VERIFICATION"
echo "======================================"
if [ -f "$BACKUP_FILE" ]; then
    echo "✓ Pre-deployment backup: $BACKUP_FILE"
    echo "  Size: $(du -h $BACKUP_FILE | cut -f1)"
    echo "  Integrity check:"
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        echo "  ✓ Backup is valid"
    else
        echo "  ✗ Backup integrity check failed"
    fi
fi

# Final Summary
echo ""
echo "======================================"
echo "DEPLOYMENT COMPLETE"
echo "======================================"
echo "Timestamp: $(date)"
echo ""
echo "Your Elite Fitness application is now live!"
echo ""
echo "Access at: https://$DOMAIN"
echo "Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "API Endpoint: $API_URL"
echo ""
echo "Next Steps:"
echo "  1. Verify all features are working"
echo "  2. Test member login and payments"
echo "  3. Verify email notifications"
echo "  4. Check monitoring dashboards"
echo "  5. Enable backups and recovery"
echo "  6. Notify stakeholders"
echo ""
echo "======================================"
