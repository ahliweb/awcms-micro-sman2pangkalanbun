# Plugin Contributor Checklist

Use this checklist before opening a PR for any plugin package.

## Scaffold and Contract

- [ ] Package follows scaffold contract in `packages/plugins/README.md`
- [ ] Descriptor/runtime split is correct (`src/index.ts` and `src/sandbox-entry.ts`)
- [ ] `package.json` exports include `"."` and `"./sandbox"`

## Capabilities and Security

- [ ] Capabilities are minimal and use canonical names
- [ ] `allowedHosts` is restricted when `network:request` is used
- [ ] No sensitive values are logged in hook/route paths

## Behavior and Compatibility

- [ ] Route handlers return safe API payloads and avoid internal error leakage
- [ ] Settings and storage changes are additive/backward-compatible
- [ ] Any deprecation is documented in package notes

## Validation

- [ ] `pnpm --filter @emdash-cms/plugin-<id> build`
- [ ] `node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/<plugin-id>`
- [ ] `pnpm --filter @emdash-cms/plugin-<id> test` (if tests exist)
- [ ] `pnpm --silent lint:quick`

## Documentation

- [ ] Package README is present using `packages/plugins/README.template.md`
- [ ] README documents capabilities, settings, hooks, routes, testing, rollback
- [ ] PR includes AI disclosure and follows `.github/PULL_REQUEST_TEMPLATE.md`
