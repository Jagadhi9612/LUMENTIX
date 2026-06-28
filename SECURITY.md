# Security Policy

## Secrets

Never commit:

- `.env.local`
- `.env.production`
- Firebase service account JSON files
- exported Auth/Firestore/Storage customer data
- private API keys or payment credentials

Use GitHub Actions secrets for CI/CD values.

## Reporting Issues

Report security issues privately to the repository owner or project maintainer. Do not open a public issue with live credentials, customer data, or exploit steps.

## Firebase Rules

Firestore and Storage rules are production controls. Any pull request that changes them must include:

- which roles can read/write
- what data is protected
- test evidence or manual verification notes

