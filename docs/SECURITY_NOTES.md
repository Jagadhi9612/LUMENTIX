# Security Notes

## Current Dependency Audit

`npm audit --omit=dev` currently reports a moderate advisory for `next@16.2.9` because Next packages a nested `postcss@8.4.31`.

The root workspace pins a patched PostCSS line through `overrides`, and Tailwind uses `postcss@8.5.15`, but npm still reports the nested Next dependency. The automatic fix proposed by npm would downgrade Next to `9.3.3`, which would remove the App Router and conflict with the requested modern Next.js architecture.

Recommended action: track the next stable Next.js release that updates its internal PostCSS dependency, then run:

```bash
npm install next@latest --workspace @elite/web
npm audit --omit=dev
```

Do not run `npm audit fix --force` unless you intentionally accept a breaking Next downgrade.
