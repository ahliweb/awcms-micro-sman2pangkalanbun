# Countdown Plugin

## Overview

This plugin renders a public countdown popup and provides admin-side settings management for the popup image, caption, and visibility schedule.

## Status

- Package: `@emdash-cms/plugin-countdown`
- Version: `0.0.1`
- Format: `standard`
- Entrypoint: `@emdash-cms/plugin-countdown/sandbox`

## Capabilities

- `hooks.page-fragments:register` - required to inject trusted popup fragments into public pages

## Storage and Settings

### Storage collections

- `dismissals`: indexed by `createdAt`, `sessionId` (reserved for popup dismissal tracking)

### Settings

- `settings:enabled`: `boolean` - enables/disables popup rendering (default `false`)
- `settings:targetAt`: `string` - ISO datetime countdown target
- `settings:caption`: `string` - popup caption text
- `settings:imageUrl`: `string` - popup image URL
- `settings:showFrom`: `string | null` - optional ISO datetime visibility start
- `settings:showUntil`: `string | null` - optional ISO datetime visibility end
- `settings:dismissOncePerSession`: `boolean` - remembers dismissal per browser session

## Hooks

- `plugin:install` - initializes deterministic default settings
- `page:fragments` - injects popup markup/CSS/script for eligible public pages

## Routes

- `/admin` - Block Kit interactions for settings page and save actions
- `/settings` - returns validated settings payload for API consumers
- `/settings/save` - validates and persists settings patch

## Admin UI

- Admin pages: `/settings`
- Fields: enabled toggle, target datetime, caption, image URL, visibility window, dismiss behavior

## Testing

Run from repository root:

```bash
pnpm --filter @emdash-cms/plugin-countdown build
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/countdown
pnpm dlx vitest run packages/plugins/countdown/tests/settings.test.ts packages/plugins/countdown/tests/sandbox-entry.test.ts
```

## Rollback

1. Disable the `countdown` plugin in site plugin config.
2. Revert `packages/plugins/countdown` changes.
3. Re-run lint/typecheck/tests and redeploy.

## Compatibility Notes

- Settings keys are stable and additive.
- New fields/routes should remain backward compatible with existing saved settings.

## References

- `packages/plugins/README.template.md`
- `packages/plugins/CONTRIBUTOR-CHECKLIST.md`
- `AGENTS.md`
