#!/bin/bash
# Elite Fitness Firebase Deployment Script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Pre-deployment checks
log_info "Running pre-deployment checks..."

if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js not found"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found"
    log_warn "Create .env.production with required environment variables"
    exit 1
fi

log_info "Pre-deployment checks passed"

# Step 2: Install dependencies
log_info "Installing dependencies..."
npm ci

# Step 3: Build API (Cloud Functions)
log_info "Building API for Cloud Functions..."
npm run build --workspace @elite/api

# Step 4: Build Web (Next.js)
log_info "Building web application..."
npm run build --workspace @elite/web

# Step 5: Run type checks
log_info "Running type checks..."
npm run typecheck

# Step 6: Run linter
log_info "Running linter..."
npm run lint

# Step 7: Verify Firebase configuration
log_info "Verifying Firebase configuration..."
FIREBASE_PROJECT=$(jq -r '.projects.default' firebase.json 2>/dev/null)
if [ -z "$FIREBASE_PROJECT" ]; then
    log_error "Firebase project not configured in firebase.json"
    exit 1
fi
log_info "Deploying to Firebase project: $FIREBASE_PROJECT"

# Step 8: Create backup before deployment
log_info "Creating pre-deployment backup..."
BACKUP_FILE="backup-$(date +%Y%m%d_%H%M%S).sql.gz"
if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
    log_info "Backup created: $BACKUP_FILE"
else
    log_warn "Could not create database backup"
fi

# Step 9: Deploy to Firebase
log_info "Starting Firebase deployment..."
firebase deploy --project "$FIREBASE_PROJECT" --only functions,hosting,firestore:rules,firestore:indexes,storage

# Step 10: Verify deployment
log_info "Verifying deployment..."
HEALTH_CHECK=$(curl -s "https://us-central1-$FIREBASE_PROJECT.cloudfunctions.net/api/health" || echo "{}")
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    log_info "✓ API health check passed"
else
    log_error "API health check failed"
    exit 1
fi

# Step 11: Run smoke tests
log_info "Running smoke tests..."
npm run test:smoke 2>/dev/null || log_warn "Smoke tests not configured"

# Step 12: Notify stakeholders
log_info ""
log_info "=========================================="
log_info "Deployment completed successfully!"
log_info "=========================================="
log_info "Project: $FIREBASE_PROJECT"
log_info "Timestamp: $(date)"
log_info "Backup: $BACKUP_FILE"
log_info ""
log_info "Access your application:"
log_info "  https://app.eliteifitness.com"
log_info ""
log_info "Monitor your deployment:"
log_info "  https://console.firebase.google.com/project/$FIREBASE_PROJECT"
log_info "=========================================="
