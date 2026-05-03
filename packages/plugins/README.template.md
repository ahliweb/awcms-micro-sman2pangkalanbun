# <Plugin Name>

## Overview

Short description of what this plugin does and why it exists.

## Status

- Package: `@emdash-cms/plugin-<id>`
- Version: `<x.y.z>`
- Format: `standard`
- Entrypoint: `@emdash-cms/plugin-<id>/sandbox`

## Capabilities

List only required capabilities and explain why each is needed.

- `content:read` - <reason>
- `content:write` - <reason>
- `network:request` - <reason>

If network access is used, document allowed hosts.

## Storage and Settings

### Storage collections

- `<collection>`: indexed by `<index-a>, <index-b>`

### Settings

- `<setting-key>`: `<type>` - <purpose/default>

## Hooks

Document each hook and behavior.

- `plugin:install` - <what it initializes>
- `content:afterSave` - <what it records/changes>

## Routes

Document route behavior and auth expectations.

- `/<route>` - `<method>` - `<auth/public>` - <summary>

## Admin UI

- Admin pages: `<path(s)>`
- Widgets: `<id(s)>`

## Testing

Run from repository root.

```bash
pnpm --filter @emdash-cms/plugin-<id> build
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/<plugin-id>
pnpm --filter @emdash-cms/plugin-<id> test
```

## Rollback

Describe safe rollback steps:

1. Disable plugin from site config/runtime.
2. Revert plugin package change.
3. Re-run validation and smoke checks.

## Compatibility Notes

- Backward-compatibility expectations:
  - keep existing settings keys stable
  - additive route/settings changes preferred
  - deprecations documented before removal

## References

- `CONTRIBUTING.md`
- `AGENTS.md`
- `project-docs/04-plugin-strategy.md`
- `packages/plugins/README.md`
