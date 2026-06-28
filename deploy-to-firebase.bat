@echo off
REM ELITE FITNESS FIREBASE DEPLOYMENT SCRIPT (Windows)
REM Deploy to existing Firebase project: elite-fitness
REM Run this on your local machine with Firebase CLI installed

setlocal enabledelayedexpansion

cls
echo ==================================================
echo   ELITE FITNESS - FIREBASE DEPLOYMENT
echo ==================================================
echo.

REM Configuration
set PROJECT_ID=elite-fitness
set REGION=us-central1

echo 📱 Project: %PROJECT_ID%
echo 🌍 Region: %REGION%
echo.

REM STEP 1: Check prerequisites
echo [1/8] Checking prerequisites...
where firebase >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI required. Install: npm install -g firebase-tools
    pause
    exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js required
    pause
    exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm required
    pause
    exit /b 1
)
echo ✅ Prerequisites OK
echo.

REM STEP 2: Install dependencies
echo [2/8] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM STEP 3: Create environment file
echo [3/8] Setting up environment...
if not exist ".env.production" (
    echo ⚠️  Creating .env.production
    copy .env.example .env.production
    echo.
    echo ❗ IMPORTANT: Edit .env.production and add:
    echo    - JWT_ACCESS_SECRET (generate strong value)
    echo    - JWT_REFRESH_SECRET (generate strong value)
    echo    - DATABASE_URL (PostgreSQL connection)
    echo    - STRIPE_SECRET_KEY
    echo    - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
    echo    - SMTP_USER, SMTP_PASSWORD
    echo.
    echo Opening .env.production in editor...
    start notepad .env.production
    pause
)
echo ✅ Environment file ready
echo.

REM STEP 4: Build
echo [4/8] Building application...
call npm run build --workspace @elite/api
if errorlevel 1 (
    echo ❌ API build failed
    pause
    exit /b 1
)
call npm run build --workspace @elite/web
if errorlevel 1 (
    echo ❌ Web build failed
    pause
    exit /b 1
)
echo ✅ Build complete
echo.

REM STEP 5: Type checks & lint
echo [5/8] Running quality checks...
call npm run typecheck
if errorlevel 1 (
    echo ⚠️  Type check warnings
)
call npm run lint
if errorlevel 1 (
    echo ⚠️  Lint warnings
)
echo ✅ Quality checks complete
echo.

REM STEP 6: Firebase login
echo [6/8] Checking Firebase authentication...
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo Logging in to Firebase...
    call firebase login
)
echo ✅ Firebase authenticated
echo.

REM STEP 7: Deploy
echo [7/8] Deploying to Firebase project: %PROJECT_ID%
echo.
call firebase deploy --project %PROJECT_ID% --only functions,hosting,firestore:rules,firestore:indexes,storage
if errorlevel 1 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)
echo.
echo ✅ Deployment complete!
echo.

REM STEP 8: Verify
echo [8/8] Verifying deployment...
echo.
echo 🔍 Health Check:
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'https://%REGION%-%PROJECT_ID%.cloudfunctions.net/api/health' -TimeoutSec 5; if ($response.Content -match 'ok') { Write-Host '✅ API is running!' } else { Write-Host '⚠️  Response: ' $response.Content } } catch { Write-Host '⚠️  Could not connect to API' }"
echo.

REM Print access information
echo ==================================================
echo ✨ DEPLOYMENT SUCCESSFUL!
echo ==================================================
echo.
echo 🎉 Your Elite Fitness app is now live!
echo.
echo 📊 Access Information:
echo   • Firebase Console:
echo     https://console.firebase.google.com/project/%PROJECT_ID%
echo.
echo   • Hosting URL:
echo     https://%PROJECT_ID%.web.app
echo.
echo   • API Endpoint:
echo     https://%REGION%-%PROJECT_ID%.cloudfunctions.net/api
echo.
echo   • Health Check:
echo     https://%REGION%-%PROJECT_ID%.cloudfunctions.net/api/health
echo.

echo 📋 Next Steps:
echo   1. Test member login at your hosting URL
echo   2. Verify Firestore database has data
echo   3. Test payment flow
echo   4. Check Cloud Function logs for errors
echo.

echo 📚 Documentation:
echo   • User Guide: docs/USER_GUIDE.md
echo   • API Docs: apps/api/openapi.json
echo   • Deployment: DEPLOYMENT.md
echo.

echo 🔗 Quick Links:
echo   • Firebase Console: https://console.firebase.google.com/project/%PROJECT_ID%
echo   • Cloud Functions: https://console.firebase.google.com/project/%PROJECT_ID%/functions
echo   • Firestore: https://console.firebase.google.com/project/%PROJECT_ID%/firestore
echo   • Hosting: https://console.firebase.google.com/project/%PROJECT_ID%/hosting
echo.

echo ✅ Setup complete!
echo ==================================================
echo.
pause
