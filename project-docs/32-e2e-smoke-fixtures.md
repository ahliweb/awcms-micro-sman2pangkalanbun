# Deterministic E2E Smoke Fixture Dataset (C5 / #32)

This artifact locks the smoke fixture content set used by Playwright setup.

## Source of Truth

- `e2e/fixtures/smoke-seed.ts`

## Seed Guarantees

- Stable collection and slug set for smoke assertions.
- Stable publish-state expectations:
	- published: `first-post`, `second-post`, `about`
	- draft: `draft-post`, `contact`
- Global setup consumes this file directly to avoid ad-hoc drift.

## Integration Point

- `e2e/global-setup.ts` now seeds `posts` and `pages` from `SMOKE_SEED_ITEMS`.

## Reproducibility Check

- Running Playwright setup repeatedly should recreate the same slug set.
- Smoke tests should assert by slug/title from this locked fixture file, not random timestamps.
