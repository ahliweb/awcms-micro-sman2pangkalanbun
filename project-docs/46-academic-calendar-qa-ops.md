# Academic Calendar QA and Operations (D2.4)

This document defines test coverage and operator runbook steps for the academic calendar plugin rollout.

## Automated Test Coverage

Implemented tests:

- `packages/plugins/academic-calendar/tests/schema.test.ts`
  - schema validity
  - overlap/range rejection rules
  - upcoming ordering behavior
- `packages/plugins/academic-calendar/tests/routes.test.ts`
  - term create/list behavior
  - overlap rejection on create route
  - public upcoming route response shape

## Build and Validation Commands

Run from repository root:

```bash
pnpm --filter @emdash-cms/plugin-academic-calendar build
pnpm --filter @emdash-cms/plugin-academic-calendar test
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/academic-calendar
```

## Installation/Enablement Notes

1. Add `academicCalendarPlugin()` to site plugin registration.
2. Confirm plugin routes are mounted under `/_emdash/api/plugins/academic-calendar/*`.
3. Verify admin page `/calendar` and widget `upcoming-calendar` load.

## Smoke Verification (Dev)

1. Create one term via `terms/create` route.
2. Create one exam window via `exam-windows/create` route.
3. Query `upcoming/public?limit=5` and confirm items are returned.
4. Attempt invalid overlapping term create and confirm `{ success: false, error }`.

## Rollback Procedure

1. Disable plugin registration.
2. Revert plugin package changes to last known good revision.
3. Re-run build/tests and plugin bundle validation.
4. Re-enable after validation passes.
