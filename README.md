# ELITE FITNESS

Premium gym management SaaS platform for member operations, revenue control, attendance, packages, trainers, payments, expenses, reports, and settings.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide
- Firebase Authentication, Cloud Firestore, Firebase Storage rules, Firebase Hosting
- Firebase Cloud Functions, Firebase Admin SDK, TypeScript, Zod
- PostgreSQL/Prisma code is retained only as a future migration track, not the live v1 backend

## Quick Start

```bash
npm install
npm run check:web
npm run dev:web
```

Open `http://localhost:3000`. The first screen is the member gym companion dashboard. Staff tools are behind the Staff Login button.

## Staff Member Workflow

- Create active plans in `/packages`.
- Create members in `/members`.
- Select a package from the live package dropdown to auto-fill membership start, paid-until date, and suggested amount.
- Staff can manually edit amount, paid amount, pending amount, payment method, payment status, date, and invoice number.
- Paid admission/renewal payments are finalized by Cloud Functions and update the member's subscription last day.
- Pending and partial payments remain visible as payment-due records for staff follow-up and reminders.

## Intern Development

- Recommended environment: GitHub Codespaces.
- Branch format: `intern/<name>/<feature>`.
- Pull requests should target `develop`.
- Production deploys are protected and should only run from `main`.
- See `CONTRIBUTING.md`, `DEVELOPMENT.md`, and `SECURITY.md`.

## Firebase Setup

Create a Firebase web app, enable Authentication, Cloud Firestore, Storage, and Hosting, then fill these values in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
```

Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The web modules read and write directly to Firestore collections: `members`, `packages`, `payments`, `attendance`, `trainers`, `expenses`, `notifications`, and `settings`.
Audit logs are written through the `recordAudit` Cloud Function after Functions are deployed.

Create the first staff user in Firebase Authentication, then create `users/{uid}` with `role: SUPER_ADMIN`:

```bash
email: admin@elite.in
password: admin@elite
```

Member IDs are generated automatically when a staff user creates a member record.

For Firebase Functions:

```bash
npm run check:functions
npm run deploy:functions
```

Functions deployment requires the Firebase project to be on the Blaze plan.

## Staff Access

- Super Admin bootstrap email: `admin@elite.in`
- Initial password: `admin@elite`, then change it before real staff use

## Production Notes

- Current production v1 is Firebase-first: Auth, Firestore, Hosting, Storage rules, and Cloud Functions.
- Upgrade the Firebase project to Blaze before deploying Functions, Storage, PITR, and scheduled jobs.
- See `PRODUCTION_STATUS.md` for live verification, blockers, rollback, and follow-up work.
