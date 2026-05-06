# Academic Calendar Plugin (Foundation)

## Overview

This package defines the academic calendar data model and schema contract used by the plugin implementation chain.

## Included in This Slice

- Typed schema contracts for terms, exam windows, and events
- Cross-entity validation for invalid ranges and overlaps
- Upcoming-items query helper for widget/feed usage
- Minimal plugin descriptor/runtime scaffold for follow-up slices

## Admin and Secured Routes

- Admin page: `/calendar`
- Admin widget: `widget:upcoming-calendar`
- Secured CRUD routes (non-public by default):
  - `terms/list`, `terms/create`, `terms/update`, `terms/delete`
  - `exam-windows/list`, `exam-windows/create`, `exam-windows/update`, `exam-windows/delete`
  - `events/list`, `events/create`, `events/update`, `events/delete`

All mutating routes use schema-validated inputs and rollback writes when cross-entity validation fails.

## Data Model Entities

- `AcademicTerm`: semester boundary and locale/year metadata
- `ExamWindow`: term-scoped exam period (`midterm`, `final`, `assessment`)
- `CalendarEvent`: holiday or event entry with localized datetime

## Validation Rules

- term `startDate <= endDate`
- terms cannot overlap
- exam window `startAt < endAt`
- exam windows must reference an existing term
- exam windows cannot overlap within the same term
- event `startAt < endAt` when `endAt` is present

## Upcoming Widget Query Support

- `getUpcomingItems(model, nowIso, limit)` merges exams/events
- filters out completed items
- returns deterministic chronological ordering

## Commands

Run from repository root:

```bash
pnpm --filter @emdash-cms/plugin-academic-calendar build
pnpm --filter @emdash-cms/plugin-academic-calendar test
node packages/core/dist/cli/index.mjs plugin bundle --validateOnly --dir packages/plugins/academic-calendar
```
