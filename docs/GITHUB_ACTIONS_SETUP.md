# GitHub Actions Setup

The Firebase CI workflow is stored as `docs/ci-workflow-template.yml`.

It is not currently committed under `.github/workflows/ci.yml` because the GitHub CLI token used for the first upload did not have the `workflow` scope. GitHub rejects workflow-file pushes without that scope.

## Enable The Workflow

1. Refresh GitHub CLI auth with workflow scope:

```bash
gh auth refresh -h github.com -s workflow
```

2. Copy the template into the workflow folder:

```bash
mkdir -p .github/workflows
cp docs/ci-workflow-template.yml .github/workflows/ci.yml
```

3. Commit and push:

```bash
git add .github/workflows/ci.yml
git commit -m "Add Firebase CI workflow"
git push
```

## Required GitHub Secrets

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT_ELITE_FITNESS_2026`

## Branch Protection

GitHub rejected branch protection on this private repository because the current account/plan requires GitHub Pro for private-repo branch protection. Enable it from GitHub settings after upgrading, or make the repository public only if that is acceptable for the business.

