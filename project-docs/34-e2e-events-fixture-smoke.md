# E2E Events Fixture and Smoke Coverage (C7 / #34)

This artifact adds deterministic `events` fixture support and validates one event publish smoke path.

## Delivered

- Added `events` collection schema to fixture seed:
  - `e2e/fixture/.emdash/seed.json`
- Extended deterministic fixture dataset with event records:
  - `e2e/fixtures/smoke-seed.ts`
- Global setup now seeds events via content API:
  - `e2e/global-setup.ts`
- Smoke scenario for draft event publish and persistence:
  - `e2e/tests/smoke-edit-publish.spec.ts`

## Seeded Event Records

- Published: `school-expo-2026`
- Draft: `debate-workshop-draft`

## Validation

- `pnpm test:e2e:smoke` passes with event scenario included.
