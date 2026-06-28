# Contributing To Elite Fitness

Elite Fitness uses a protected branch workflow so interns can build safely without touching production directly.

## Branches

- `main`: production branch. Only reviewed, passing changes should merge here.
- `develop`: integration branch for tested work before production.
- `intern/<name>/<feature>`: intern feature branches.

Examples:

```bash
git checkout develop
git pull
git checkout -b intern/ravi/package-dropdown
```

## Pull Requests

- Open pull requests into `develop`, not `main`.
- Keep each pull request focused on one feature or bug fix.
- Include screenshots for UI changes.
- Include test evidence from the commands below.

```bash
npm run check:web
npm run check:functions
npm audit --omit=dev --audit-level=high
```

## Production Rules

- Do not commit `.env.local`, `.env.production`, Firebase service account JSON files, or exported customer data.
- Do not deploy to production from intern branches.
- Do not change Firebase rules without describing the security impact in the pull request.
- Do not remove live routes or staff workflows unless the issue explicitly asks for it.

