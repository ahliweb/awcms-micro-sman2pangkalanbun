# Scaffold Sample Plugin

## Overview

This package is a minimal scaffolded plugin used to validate the D1 scaffold contract and smoke-check workflow.

## Status

- Package: `@emdash-cms/plugin-scaffold-sample`
- Version: `0.0.1`
- Format: `standard`
- Entrypoint: `@emdash-cms/plugin-scaffold-sample/sandbox`

## Capabilities

- `content:read` - verifies canonical capability declaration in descriptor

## Storage and Settings

### Storage collections

- `events`: indexed by `timestamp`, `type`

### Settings

- none

## Hooks

- `plugin:install` - emits an installation log line for lifecycle smoke-checking

## Routes

- `/ping` - plugin route smoke endpoint returning `{ ok, pluginId, timestamp }`

## Admin UI

- none (this sample intentionally keeps surface area minimal)

## Testing

Run from repository root:

```bash
pnpm --filter @emdash-cms/plugin-scaffold-sample build
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/scaffold-sample
```

## Rollback

1. Remove `packages/plugins/scaffold-sample` package.
2. Re-run plugin validation workflow.

## Compatibility Notes

- This package is scaffold validation only and not intended for production feature use.

## References

- `packages/plugins/README.md`
- `packages/plugins/README.template.md`
- `packages/plugins/CONTRIBUTOR-CHECKLIST.md`
