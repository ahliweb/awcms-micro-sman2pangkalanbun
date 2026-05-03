# Plugin Scaffold Smoke Check (D1.2)

This record captures the reproducible commands used to verify the scaffolded sample plugin package.

## Sample Package

- Path: `packages/plugins/scaffold-sample`
- Package: `@emdash-cms/plugin-scaffold-sample`

## Smoke Commands

Run from repository root:

```bash
pnpm --filter @emdash-cms/plugin-scaffold-sample build
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/scaffold-sample
```

## Expected Results

1. Build emits both descriptor and sandbox outputs to `dist/`.
2. Bundle validation completes successfully with no schema/export errors.
3. Plugin manifest shows expected id/version/format/entrypoint and canonical capabilities.

## Notes

- This package is intentionally minimal and intended as a scaffold conformance proof.
- Production plugin features are implemented in dedicated feature plugins, not this sample package.
