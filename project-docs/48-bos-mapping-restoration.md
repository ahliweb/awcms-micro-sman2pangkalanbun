# BOS Mapping Restoration and Revalidation (M10.2 / #48)

This step applies verified BOS intake outputs to migration mapping artifacts and regenerates reference-closure evidence.

## Preconditions

1. #35 external handoff delivered authoritative BOS PDFs.
2. Intake verification passed via `scripts/migration/verify-bos-intake.mjs`.
3. `project-docs/migration/bos-intake-manifest.json` exists with `ok: true`.

## Script

- Path: `scripts/migration/restore-bos-mappings.mjs`
- Responsibilities:
	1. read verified BOS manifest
	2. update BOS entries in `project-docs/migration/missing-source-resolution.json`
	3. regenerate transform samples
	4. rerun reference validation
	5. write closure artifact `project-docs/migration/bos-restoration-closure.json`

## Commands

```bash
node scripts/migration/restore-bos-mappings.mjs
```

Optional overrides:

- `MISSING_SOURCE_RESOLUTION_PATH=/path/to/missing-source-resolution.json`
- `BOS_MANIFEST_PATH=/path/to/bos-intake-manifest.json`
- `BOS_CLOSURE_REPORT_PATH=/path/to/bos-restoration-closure.json`
- `BOS_REPLACEMENT_PREFIX=/documents`

## Expected Output

- `missing-source-resolution.json` BOS entries transition from:
	- `disposition: "removed"`, `replacement: null`
- to:
	- `disposition: "replaced-owned"`
	- `replacement: "/documents/bos-twX-2024.pdf"`
	- `checksumSha256: "..."`

- `project-docs/migration/bos-restoration-closure.json` contains:
	- `updatedEntries` (should be `3`)
	- `beforeUnresolvedCount`
	- `afterUnresolvedCount` (must be `0` for closure)
	- `status` (`ready_to_close` when complete)

## Failure Behavior

- Script exits non-zero if:
	- manifest is missing or not `ok: true`
	- expected BOS mapping rows are not found/updated
	- regenerated reference validator still reports unresolved BOS refs

## Closure Path

When the closure artifact reports `status: ready_to_close`, attach both:

- `project-docs/migration/bos-intake-manifest.json`
- `project-docs/migration/bos-restoration-closure.json`

to #31 and close #31.
