# Elite Fitness Developer Setup

## Recommended: GitHub Codespaces

1. Open the repository in GitHub.
2. Select `Code` -> `Codespaces` -> `Create codespace`.
3. Wait for dependencies to install.
4. Copy `.env.example` to `.env.local` and fill Firebase web app values.
5. Start the web app:

```bash
npm run dev:web
```

## Local Setup

Requirements:

- Node.js 22+
- npm
- Firebase CLI for deploy work

Install and verify:

```bash
npm ci
npm run check:web
npm run check:functions
```

Run locally:

```bash
npm run dev:web
```

## Firebase Notes

- Production project: `elite-fitness-2026`.
- Hosting deploys use `npm run deploy:hosting`.
- Rules deploys use `npm run deploy:rules`.
- Functions deploys use `npm run deploy:functions`.
- Interns should not deploy production unless explicitly approved.

## Package And Payment Workflow

- Staff create packages in `/packages`.
- Staff create members in `/members`.
- Selecting a package fills membership start, last day, and suggested amount.
- Staff can manually edit amount, paid amount, pending amount, method, and status.
- Paid admission or renewal payments update the member's paid-until date through Cloud Functions.

