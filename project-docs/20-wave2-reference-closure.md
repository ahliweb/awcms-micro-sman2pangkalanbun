# Wave 2 Missing-Reference Closure Check (M6 / #20)

This check confirms transformed payloads contain no unresolved local references after applying #30 mappings.

## Validation Command

```bash
node scripts/migration/validate-wave2-references.mjs
```

## Validation Output

- `project-docs/migration/reference-validation-report.json`

Expected success condition:

- `unresolvedCount` equals `0`.

## Dependency Inputs

- `project-docs/migration/missing-source-resolution.json` (#30)
- `project-docs/migration/transforms/*.sample.json` (#16)

## Closure Criteria for #20

- All transformed records either:
  - point to existing local owned replacements, or
  - have missing-source attachments removed intentionally.
- No unresolved `/images/*` or `/documents/*` paths remain in transform samples.
