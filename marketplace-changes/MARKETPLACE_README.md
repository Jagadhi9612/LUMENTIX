# Marketplace module — Elite Fitness (LUMENTIX)

Built and verified directly against your repo (`Jagadhi9612/LUMENTIX`) — both
`npm run typecheck` and `npm run build --workspace @elite/web` pass clean
with these changes applied, including the static export (`output: "export"`)
your `next.config.ts` requires.

## How to apply

**Option A — patch:**
```bash
git apply marketplace.patch
```

**Option B — manual:** copy the files from `marketplace-changes.zip` into
your repo at matching paths (all are either new files or small additions to
existing ones — diffs are in the patch if you want to see exactly what
changed line-by-line in the modified files).

## What was added, and why it looks the way it does

I read the actual code before building anything, and several things changed
my approach from a generic Next.js marketplace:

- **`next.config.ts` has `output: "export"`** — this is a fully static site
  with no server runtime. There's no way to host Next.js API routes here, so
  all payment logic lives in **Firebase Cloud Functions** (`apps/api`,
  already your real backend — the Postgres/Prisma stuff in `packages/db` is
  confirmed unused for v1) instead.
- **Money is stored as plain rupee numbers**, matching `GymPackage.price` /
  `Payment.amount` — not paise, unlike a typical Razorpay integration. The
  conversion to paise happens only right at the Razorpay API boundary
  (`createMarketplaceOrder` in `apps/api/src/index.ts`).
- **No multi-tenancy** — no `gymId` anywhere, matching the rest of the app.
- **Dynamic routes use query params, not path segments** — `/marketplace/product?id=xyz`
  rather than `/marketplace/product/[id]`, because static export can't
  server-render a path segment for an ID that doesn't exist at build time.
- **Staff product management reuses `<ModuleManager>`** — the same generic
  CRUD component that already drives Packages, Trainers, etc. Adding
  `productSchema` / `productFields` / `productDefaults` to
  `lib/module-config.ts` was enough to get a full staff admin screen at
  `/store` for free, styled identically to your other module pages.
- **Trainer bookability is additive** — `Trainer` gained optional fields
  (`bio`, `photoUrl`, `pricePerSession`, `bookable`, `availabilityText`).
  Existing trainer records keep working with zero migration;
  `availabilityText` uses a plain-text format (`"Mon 06:00-07:00, Wed 06:00-07:00"`)
  so it fits your existing text/textarea field types in `ModuleManager`
  rather than needing a new nested-array UI.

## Member accounts (the part you asked to add)

Members had no Firebase Auth accounts before this. Now:

1. A member creates an account at `/member-login` (email + password).
2. That calls the new `linkMemberAccount` Cloud Function, which verifies
   their **Member ID + phone** against the existing `members` collection —
   the same verification approach your existing `registerMemberDevice`
   function already uses, so no new verification channel was introduced.
3. On match, it sets a `MEMBER` custom claim and a `users/{uid}` doc, same
   pattern as `syncStaffClaims` does for staff.
4. `<MemberGuard>` (parallel to your existing `<StaffGuard>`) gates every
   `/marketplace/*` and `/account/*` page behind this.

## New Cloud Functions (`apps/api/src/index.ts`)

| Function | Purpose |
|---|---|
| `linkMemberAccount` | Links a new Firebase Auth account to an existing member record |
| `createMarketplaceOrder` | Creates a Razorpay order; amount always re-derived server-side from Firestore, never trusted from the client |
| `verifyMarketplacePayment` | Verifies the Razorpay HMAC signature, marks the order paid, decrements stock — all in one transaction |
| `createBooking` | Books a trainer session with a transactional double-booking guard |

**Before deploying:** set the two Razorpay secrets (Cloud Functions v2 uses
`defineSecret`, not plain env vars):
```bash
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
```
Also register a Razorpay webhook (`payment.captured`) pointed at a small
additional function using the same HMAC-verification logic as
`verifyMarketplacePayment` — the client-side call handles the happy path,
but if someone closes the tab mid-payment, only a webhook catches it. I
didn't add this webhook function itself since it needs your Razorpay
dashboard webhook secret, which I don't have.

## Firestore rules

Added `products`, `carts`, `orders`, `bookings` collections to
`firestore.rules`, following your existing `role()` / `canManageSystem()`
pattern. Orders can only ever be created client-side in `pending_payment`
status — every later transition happens through the Cloud Functions above
via the Admin SDK, which bypasses rules entirely. Deploy with:
```bash
firebase deploy --only firestore:rules
```

## New Firestore indexes you'll likely need

The category-filtered product browse query (`where("active") + where("category") + orderBy("updatedAt")`)
needs a composite index. Run the app locally first — Firestore throws an
error with a direct link to auto-create each missing index, same as any
other module in this app.

## What I did not build

- The Razorpay webhook function (needs your webhook secret from the
  Razorpay dashboard).
- Invoice/shipping for physical products — `MarketplaceOrder` has a
  `shippingAddress` string field but no dedicated form; add one on
  `/marketplace/checkout` if you sell physical goods.
- Digital-goods delivery (how a purchased diet/workout plan actually reaches
  the buyer) — depends on choices specific to your content, not something I
  could generalize.
- Product reviews — flagged as a nice-to-have in my first pass but skipped
  here to keep this changeset focused on what you asked for (products +
  trainers + payments + member accounts).
