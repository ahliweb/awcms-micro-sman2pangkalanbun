# Academic Calendar Admin/API Slice (D2.2)

This document records the secured admin/API foundation for the academic calendar plugin.

## Implemented

- Admin page route: `/calendar`
- Admin widget route: `widget:upcoming-calendar`
- Secured CRUD routes (private by default, no `public: true`):
  - terms: list/create/update/delete
  - exam windows: list/create/update/delete
  - events: list/create/update/delete

## Validation and Safety

- Mutating routes use input schemas (`zod`) per entity.
- After create/update, cross-entity validation (`validateCalendarModel`) is executed.
- On validation failure, writes are rolled back and route returns `{ success: false, error }`.
- List routes return deterministic ordering by start fields.

## Alignment Notes

- API payload style uses explicit success/error envelope for plugin route consumers.
- Non-public default keeps CRUD endpoints behind plugin route auth flow.

## Verification Commands

```bash
pnpm --filter @emdash-cms/plugin-academic-calendar build
pnpm --filter @emdash-cms/plugin-academic-calendar test
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/academic-calendar
```
