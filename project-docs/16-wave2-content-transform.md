# Wave 2 Content Transform Artifacts (M4 / #16)

This document defines and evidences contract-driven content transforms using `project-docs/13-wave2-content-contract.md`.

## Transform Scope Implemented

- `blogs/blogs.json` -> `news`
- `pages/profile.json` -> `pages` (sample: principal message + history)
- `blogs/finance.json` -> `finance_reports`

## Locale Strategy Applied

- Every transformed record emits `localeRows` for `id` and `en` when present.
- Locale rows keep a shared source anchor (`source.file` + source key/index).

## Missing-Source Policy Applied

- Transform pipeline consumes `project-docs/migration/missing-source-resolution.json`.
- `replaced-owned` references are rewritten to owned local replacements.
- `removed` references are omitted from output payload (example: BOS attachments).

## Generated Artifacts

- `project-docs/migration/transforms/news.sample.json`
- `project-docs/migration/transforms/pages.sample.json`
- `project-docs/migration/transforms/finance-reports.sample.json`

## Generator Command

```bash
node scripts/migration/generate-wave2-transform-samples.mjs
```

Optional legacy source root override:

```bash
LEGACY_ROOT=/absolute/path/to/smandapbun node scripts/migration/generate-wave2-transform-samples.mjs
```

## Notes

- Sample output intentionally focuses on high-risk content groups (news, profile pages, finance reports).
- Full-batch transforms for all collections are expected to be expanded during #21 runner execution.
