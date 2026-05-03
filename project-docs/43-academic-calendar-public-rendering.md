# Academic Calendar Public Rendering Slice (D2.3)

This document captures the public rendering hooks and upcoming-events output surface for the academic calendar plugin.

## Implemented

- Public route: `upcoming/public`
  - `public: true`
  - returns upcoming calendar items for frontend consumption
  - supports `limit` and optional `locale` filtering
- Page hook: `page:metadata`
  - emits an alternate link contribution to the plugin's public upcoming feed
- Admin widget support: `widget:upcoming-calendar`
  - uses same upcoming-item query contract for deterministic ordering

## Behavior Guarantees

- Upcoming items are chronologically ordered.
- Completed items are excluded by current timestamp filtering.
- Locale filtering applies to event items for localized display surfaces.
- Empty datasets return a valid success response with an empty list.

## Verification

```bash
pnpm --filter @emdash-cms/plugin-academic-calendar build
pnpm --filter @emdash-cms/plugin-academic-calendar test
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/academic-calendar
```
