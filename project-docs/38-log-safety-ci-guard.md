# Log Safety CI Guard

This document defines the CI guard that prevents accidental sensitive-data logging regressions.

## Guard Entry Points

- Script: `scripts/log-safety-check.mjs`
- CI job: `CI / Log Safety` in `.github/workflows/ci.yml`

Execution mode:

- Pull requests: scans changed files only (against base branch)
- Push/main: scans targeted source directories

## What the Guard Flags

The guard fails when a logging call line contains both:

1. a logging call (`console.debug/info/log/warn/error` or `logEvent()`), and
2. a sensitive key token (`authorization`, `cookie`, `set-cookie`, `token`, `password`, `secret`, `apiKey`).

Targeted directories:

- `packages/core/src`
- `packages/admin/src`
- `demos/simple/src`

## Remediation

Preferred fixes:

1. Remove sensitive key/value from the log call.
2. Move to sanitized structured context.
3. Use existing redaction-aware logging path where appropriate.

## Suppression and False Positives

If a line is intentionally safe and must remain, add this marker on the same line with rationale:

- `log-safety: allow`

Example:

```ts
console.error("token parsing failed (no raw value)"); // log-safety: allow - static message only
```

Suppressions should be rare and justified in code review.
