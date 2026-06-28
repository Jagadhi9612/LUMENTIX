# Elite Fitness Production Status

Live Hosting URL: https://elite-fitness-2026.web.app
Firebase project: `elite-fitness-2026`

## Shipped In This Pass

- Static Next.js export is deployed to Firebase Hosting.
- `/`, `/dashboard`, `/login`, `/staff/dashboard`, `/members`, `/payments`, `/reports`, and `/members/card` return `200` live.
- `/manifest.json`, `/sw.js`, `/logo.jpeg`, and all `/videos/*.mp4` return `200` live.
- Admin user `admin@elite.in` exists in Firebase Auth.
- Firestore role document exists for UID `BAaZiFHFZSQ4dYVTqy8YzE1HGMc2` with `role: SUPER_ADMIN`.
- Firebase custom claim sync completed for UID `BAaZiFHFZSQ4dYVTqy8YzE1HGMc2` with `role: SUPER_ADMIN`.
- Firestore rules and indexes are deployed.
- Firestore PITR and delete protection are enabled.
- Firebase Storage default bucket is initialized: `elite-fitness-2026.firebasestorage.app`.
- Firebase Storage rules are deployed.
- Cloud Functions are deployed in `us-central1`:
  - `health`
  - `recordAudit`
  - `syncStaffClaims`
  - `registerMemberDevice`
  - `checkMembershipExpiry`
  - `dailyFirestoreExport`
- `sendPaymentReminders` placeholder function and scheduler were removed; expiry and payment reminder logic now lives in `checkMembershipExpiry`.
- `checkMembershipExpiry` runs at 9:00 AM and 6:00 PM Asia/Kolkata and checks `membershipEnd`, latest payment status, and registered member devices before sending reminders.
- Cloud Scheduler jobs are enabled for the two scheduled functions.
- Member forms only require full name, phone, emergency contact, and address; membership fields remain available for expiry automation.
- Member creation now uses live active package selection, auto-fills start/last-day dates, suggests package amount, and can create the opening admission payment in the same workflow.
- Payment lists show amount, paid amount, payment due, last day, and status for renewal follow-up.
- Member dashboard includes device linking for plan expiry reminders and a Pay/Renew CTA from settings `renewalPaymentUrl` or `upiId`.
- Firestore has a private `memberDevices` collection; client writes are blocked and registration is routed through `registerMemberDevice`.
- Artifact Registry cleanup policy is enabled for Cloud Functions images older than 1 day.
- Artifact Registry vulnerability scanning is active.
- Browser-created `auditLogs` writes are blocked by rules; audit logging is routed through the deployed `recordAudit` callable.
- The old Express/Prisma API is no longer the production build path. `apps/api` now builds as Firebase Cloud Functions.
- Production scripts exist:
  - `npm run check:web`
  - `npm run check:functions`
  - `npm run check:production`
  - `npm run deploy:hosting`
  - `npm run deploy:rules`
  - `npm run deploy:functions`

## Verified Gates

```bash
npm run check:functions
npm run lint --workspace @elite/web
npm run build --workspace @elite/web
npm run check:production
npm audit --omit=dev --audit-level=high
firebase deploy --only firestore:rules,firestore:indexes --project elite-fitness-2026
firebase deploy --only hosting --project elite-fitness-2026
firebase deploy --only functions --project elite-fitness-2026 --force
firebase deploy --only storage --project elite-fitness-2026
gcloud firestore databases update --database="(default)" --enable-pitr --delete-protection --project=elite-fitness-2026
```

`check:production` blocks high and critical production vulnerabilities. NPM still reports moderate advisories from Next/PostCSS and Firebase Admin transitive packages; the suggested automated fixes are breaking downgrades, so they are tracked for framework/vendor update follow-up.

## Remaining Follow-Up

- Rotate the initial `admin@elite.in` password before real gym staff use.
- Add `NEXT_PUBLIC_FIREBASE_VAPID_KEY` from Firebase Console Web Push certificates to enable browser push token creation in production builds.
- Configure settings `upiId` or `renewalPaymentUrl` from the staff Settings page so renewal notifications can open a payment option.
- Add WhatsApp/SMS/email provider delivery later if the gym wants reminders outside the installed app.
- Configure a dedicated backup export bucket before turning `dailyFirestoreExport` from checkpoint logging into managed export.
- Track moderate dependency advisories from Firebase Admin transitive packages and Next/PostCSS; do not apply NPM's suggested breaking downgrades.
- Keep interns on `intern/<name>/<feature>` branches with pull requests into `develop`; production deploys should stay protected on `main`.

## Rollback

Use Firebase Hosting release history in the Console, or run:

```bash
firebase hosting:clone elite-fitness-2026:<previous-version> elite-fitness-2026:live --project elite-fitness-2026
```
