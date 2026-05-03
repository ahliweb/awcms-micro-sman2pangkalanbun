# Academic Calendar Model Contract (D2.1)

This document captures the plugin-level schema contract for academic calendar data.

## Scope

Contract implemented in `packages/plugins/academic-calendar/src/schema.ts`.

Entities:

- `AcademicTerm`
- `ExamWindow`
- `CalendarEvent`

## Locale and Date Handling

- Date-only term boundaries use ISO date strings (`YYYY-MM-DD`).
- Event/exam timestamps use ISO datetime strings with timezone offset.
- Locale is stored per term/event and defaults to `id-ID`.

## Validation Guarantees

- malformed ranges are rejected
- overlapping term ranges are rejected
- overlapping exam windows within a term are rejected
- exam windows cannot reference unknown terms
- event end-time must be after start-time

## Upcoming Query Contract

`getUpcomingItems(model, nowIso, limit)`:

- merges exam windows and events into a single feed
- removes items already completed relative to `nowIso`
- orders by `startAt` ascending
- supports deterministic widget data extraction

## Test Coverage

Implemented in `packages/plugins/academic-calendar/tests/schema.test.ts`:

- valid model acceptance
- overlapping term rejection
- invalid/overlapping exam-window rejection
- upcoming feed ordering and filtering
