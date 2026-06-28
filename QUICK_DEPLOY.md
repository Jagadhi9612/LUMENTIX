# 🚀 Quick Deploy to Firebase - Elite Fitness

## Your Firebase Project: `elite-fitness`

Your app will be deployed to:
- **Hosting:** https://elite-fitness.web.app
- **API:** https://us-central1-elite-fitness.cloudfunctions.net/api

---

## ⚡ Deploy in 5 Minutes

### Step 1: Open Terminal/PowerShell
Navigate to the Elite Fitness project folder:
```bash
cd "d:/SUNNY/LUMENTIX_MGT/LUMENTIX Solutions/09_Product_Development/Design/Elite Fitness"
```

### Step 2: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
firebase login
```

### Step 3: Create Environment File
```bash
# This will create .env.production
copy .env.example .env.production
```

Then **edit `.env.production`** and add these values:

```
NODE_ENV=production
CORS_ORIGIN=https://elite-fitness.web.app

# JWT - Generate strong random values
JWT_ACCESS_SECRET=your-super-secret-key-min-32-chars-long-12345678
JWT_REFRESH_SECRET=another-super-secret-key-min-32-chars-1234567

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/elite_fitness

# Payment (Get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# Email (Get from Gmail or your email provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SMS (Get from Twilio dashboard)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 4: Run Deployment

**On Windows:**
```bash
.\deploy-to-firebase.bat
```

**On Mac/Linux:**
```bash
chmod +x deploy-to-firebase.sh
./deploy-to-firebase.sh
```

That's it! 🎉

---

## 📊 During Deployment

The script will:
1. ✅ Install dependencies
2. ✅ Build API (Cloud Functions)
3. ✅ Build Web (Next.js)
4. ✅ Run type checks & linting
5. ✅ Deploy Cloud Functions
6. ✅ Deploy Web Hosting
7. ✅ Deploy Firestore Security Rules
8. ✅ Verify everything is working

---

## 🎯 After Deployment

### Access Your App
- **Web App:** https://elite-fitness.web.app
- **Firebase Console:** https://console.firebase.google.com/project/elite-fitness

### Test It Works
1. Go to https://elite-fitness.web.app
2. Login with your credentials
3. Try adding a member
4. Process a payment
5. Check dashboard

### Monitor Everything
Go to Firebase Console → Functions → Logs to see:
- API requests
- Errors
- Performance metrics

---

## 🔑 Create Test Admin User

In Firebase Console:
1. Go to **Authentication**
2. Click **Add User**
3. Email: `admin@elite.in`
4. Password: `admin@elite`
5. Click **Create User**

Then login at https://elite-fitness.web.app with these credentials.

---

## 🐛 Troubleshooting

### Deployment Failed
```bash
# Check what went wrong
firebase deploy --project elite-fitness --only functions --debug
```

### Can't Access the App
- Wait 2-3 minutes for deployment to complete
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check Firebase Console for errors

### API Returns 500 Error
- Check Cloud Functions logs in Firebase Console
- Verify .env.production has all required variables
- Check DATABASE_URL if using PostgreSQL

### Firestore Errors
- Go to Firebase Console → Firestore
- Check "Rules" tab for security rules
- Ensure rules are deployed correctly

---

## 📱 Access URLs

| Resource | URL |
|----------|-----|
| **Web App** | https://elite-fitness.web.app |
| **API** | https://us-central1-elite-fitness.cloudfunctions.net/api |
| **Health Check** | https://us-central1-elite-fitness.cloudfunctions.net/api/health |
| **Firebase Console** | https://console.firebase.google.com/project/elite-fitness |
| **Firestore** | https://console.firebase.google.com/project/elite-fitness/firestore |
| **Functions** | https://console.firebase.google.com/project/elite-fitness/functions |
| **Hosting** | https://console.firebase.google.com/project/elite-fitness/hosting |

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `docs/USER_GUIDE.md` | Staff training manual |
| `apps/api/openapi.json` | API documentation |
| `DEPLOYMENT.md` | Full deployment guide |
| `docs/PERFORMANCE.md` | Performance optimization |
| `docs/DISASTER_RECOVERY.md` | Backup & recovery |

---

## 🔐 Security Notes

- ✅ Change default admin password
- ✅ Use strong JWT secrets
- ✅ Enable 2FA in Firebase
- ✅ Review Firestore security rules
- ✅ Set up Cloud Functions timeout
- ✅ Enable audit logging

---

## ✨ Features Now Live

- ✅ Member Management
- ✅ Payment Processing (Stripe)
- ✅ Trainer Scheduling
- ✅ QR Attendance Tracking
- ✅ Email Notifications
- ✅ SMS Reminders
- ✅ Admin Dashboard
- ✅ Expense Tracking
- ✅ Audit Logging
- ✅ Role-Based Access Control

---

## 🆘 Need Help?

**Check Logs:**
```bash
firebase functions:log --project elite-fitness
```

**Re-deploy:**
```bash
firebase deploy --project elite-fitness
```

**Manual Deploy Steps:**
```bash
# If automatic script fails, run manually:
npm install
npm run build --workspace @elite/api
npm run build --workspace @elite/web
firebase deploy --project elite-fitness --only functions,hosting,firestore:rules
```

---

## ✅ Checklist Before Going Live

- [ ] `.env.production` created with all secrets
- [ ] Firebase project "elite-fitness" exists
- [ ] Firebase CLI installed and logged in
- [ ] Node.js 20+ installed
- [ ] Tested admin login works
- [ ] Tested member creation
- [ ] Tested payment flow
- [ ] Checked Cloud Functions logs
- [ ] Verified Firestore has data
- [ ] Shared access with team

---

**🚀 Ready to Deploy! Run the deployment script now!**
