#!/bin/bash
# ELITE FITNESS FIREBASE DEPLOYMENT SCRIPT
# Deploy to existing Firebase project: elite-fitness
# Run this on your local machine with Firebase CLI installed

set -e

echo "=================================================="
echo "  ELITE FITNESS - FIREBASE DEPLOYMENT"
echo "=================================================="
echo ""

# Configuration
PROJECT_ID="elite-fitness"
REGION="us-central1"

echo "📱 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo ""

# STEP 1: Check prerequisites
echo "[1/8] Checking prerequisites..."
command -v firebase > /dev/null || { echo "❌ Firebase CLI required. Install: npm install -g firebase-tools"; exit 1; }
command -v node > /dev/null || { echo "❌ Node.js required"; exit 1; }
command -v npm > /dev/null || { echo "❌ npm required"; exit 1; }
echo "✅ Prerequisites OK"
echo ""

# STEP 2: Install dependencies
echo "[2/8] Installing dependencies..."
npm ci
echo "✅ Dependencies installed"
echo ""

# STEP 3: Create environment file
echo "[3/8] Setting up environment..."
if [ ! -f ".env.production" ]; then
    echo "⚠️  Creating .env.production - PLEASE FILL IN YOUR SECRETS"
    cp .env.example .env.production
    echo ""
    echo "❗ IMPORTANT: Edit .env.production and add:"
    echo "   - JWT_ACCESS_SECRET (generate strong value)"
    echo "   - JWT_REFRESH_SECRET (generate strong value)"
    echo "   - DATABASE_URL (PostgreSQL connection)"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN"
    echo "   - SMTP_USER, SMTP_PASSWORD"
    echo ""
    read -p "Press Enter after editing .env.production... "
fi
echo "✅ Environment file ready"
echo ""

# STEP 4: Build
echo "[4/8] Building application..."
npm run build --workspace @elite/api
npm run build --workspace @elite/web
echo "✅ Build complete"
echo ""

# STEP 5: Type checks & lint
echo "[5/8] Running quality checks..."
npm run typecheck
npm run lint
echo "✅ All checks passed"
echo ""

# STEP 6: Firebase login
echo "[6/8] Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || {
    echo "Logging in to Firebase..."
    firebase login
}
echo "✅ Firebase authenticated"
echo ""

# STEP 7: Deploy
echo "[7/8] Deploying to Firebase project: $PROJECT_ID"
echo ""

# Deploy with specific project
firebase deploy --project "$PROJECT_ID" --only functions,hosting,firestore:rules,firestore:indexes,storage

echo ""
echo "✅ Deployment complete!"
echo ""

# STEP 8: Verify
echo "[8/8] Verifying deployment..."
echo ""
echo "🔍 Health Check:"
HEALTH=$(curl -s "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api/health" 2>/dev/null || echo "{}")
if echo "$HEALTH" | grep -q "ok"; then
    echo "✅ API is running!"
else
    echo "⚠️  API health check - response: $HEALTH"
fi
echo ""

# Print access information
echo "=================================================="
echo "✨ DEPLOYMENT SUCCESSFUL!"
echo "=================================================="
echo ""
echo "🎉 Your Elite Fitness app is now live!"
echo ""
echo "📊 Access Information:"
echo "  • Firebase Console:"
echo "    https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "  • Hosting URL:"
echo "    https://$(firebase hosting:channel:list --project=$PROJECT_ID 2>/dev/null | grep -oP '(?<=live\s)\S+' || echo 'YOUR-FIREBASE-URL.web.app')"
echo ""
echo "  • API Endpoint:"
echo "    https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api"
echo ""
echo "  • Health Check:"
echo "    https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api/health"
echo ""

echo "📋 Next Steps:"
echo "  1. Test member login at your hosting URL"
echo "  2. Verify Firestore database has data"
echo "  3. Test payment flow"
echo "  4. Check Cloud Function logs for errors"
echo ""

echo "📚 Documentation:"
echo "  • User Guide: docs/USER_GUIDE.md"
echo "  • API Docs: apps/api/openapi.json"
echo "  • Deployment: DEPLOYMENT.md"
echo ""

echo "🔗 Quick Links:"
echo "  • Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "  • Cloud Functions: https://console.firebase.google.com/project/$PROJECT_ID/functions"
echo "  • Firestore: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo "  • Hosting: https://console.firebase.google.com/project/$PROJECT_ID/hosting"
echo ""

echo "✅ Setup complete!"
echo "=================================================="
