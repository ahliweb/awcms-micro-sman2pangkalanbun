# B1-B3 Implementation Notes (#4, #5, #6)

## #4 Core Collections (Pages, News, Announcements)

- Existing `pages` and `posts` remain the core baseline.
- Added `announcements` collection schema and onboarding seed content in `demos/simple/seed/seed.json`.

## #5 Additional Collections (Events, Achievements, Gallery, Downloads)

- Added collection schemas in `demos/simple/seed/seed.json`:
  - `events`
  - `achievements`
  - `galleries`
  - `downloads`
- Added seed examples (published + draft where relevant) for onboarding and CRUD validation.
- Added public list/detail routes:
  - `demos/simple/src/pages/announcements/index.astro`
  - `demos/simple/src/pages/announcements/[slug].astro`
  - `demos/simple/src/pages/events/index.astro`
  - `demos/simple/src/pages/events/[slug].astro`
  - `demos/simple/src/pages/achievements/index.astro`
  - `demos/simple/src/pages/achievements/[slug].astro`
  - `demos/simple/src/pages/galleries/index.astro`
  - `demos/simple/src/pages/galleries/[slug].astro`
  - `demos/simple/src/pages/downloads/index.astro`
  - `demos/simple/src/pages/downloads/[slug].astro`

## #6 Public Search and Filtering

- Added shared public search utility with type/year/category filtering:
  - `demos/simple/src/utils/public-search.ts`
- Added endpoint integration:
  - `demos/simple/src/pages/api/search.json.ts`
- Updated search UI integration with filters:
  - `demos/simple/src/pages/search.astro`

## Validation

- `pnpm --silent lint:quick` passes.
- `pnpm --filter emdash-demo build` passes.
