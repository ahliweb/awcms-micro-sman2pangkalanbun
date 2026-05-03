# Wave 2 Idempotent Import Runner Dry-Run (M7 / #21)

This document defines the deterministic dry-run runner and evidence files for idempotent replay behavior.

## Runner

- Script: `scripts/migration/wave2-import-runner.mjs`
- Inputs:
  - `project-docs/migration/transforms/news.sample.json`
  - `project-docs/migration/transforms/pages.sample.json`
  - `project-docs/migration/transforms/finance-reports.sample.json`

## Behavior

- Stable operation key: `collection:locale:slug`
- Stable payload digest: SHA-256 over canonical JSON payload
- Actions:
  - `create` when first seen
  - `skip` when digest unchanged on replay
  - `update` when digest changed

## Dry-Run Commands

```bash
node scripts/migration/wave2-import-runner.mjs
node scripts/migration/wave2-import-runner.mjs
```

Expected pattern:

- first run: mostly `create`
- second run without changes: all `skip`

## Evidence Outputs

- `project-docs/migration/import-runner-dry-run.json`
- `project-docs/migration/import-runner-state.json`

## Notes

- This runner is a deterministic operation planner and dry-run verifier.
- It is designed to gate and de-risk the eventual live EmDash import implementation.
