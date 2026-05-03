# BOS Intake Verifier (M10.1 / #49)

This document defines the deterministic verification step for authoritative BOS files before mapping restoration in #31.

## Inputs

- Expected files (exact names):
	- `bos-tw1-2024.pdf`
	- `bos-tw2-2024.pdf`
	- `bos-tw3-2024.pdf`
- Default source directory: `project-docs/migration/bos-intake`

## Verification Script

- Path: `scripts/migration/verify-bos-intake.mjs`
- Checks:
	1. required file presence
	2. each path is a file
	3. binary signature begins with `%PDF`
	4. SHA-256 checksum calculation

## Output Artifact

- Manifest path (default): `project-docs/migration/bos-intake-manifest.json`
- Manifest fields:
	- `ok` (boolean pass/fail)
	- `files[]` with `file`, `sourcePath`, `sizeBytes`, `sha256`
	- `issues[]` with machine-readable failure reasons
	- operator/provenance metadata from environment variables

## Execution

```bash
mkdir -p project-docs/migration/bos-intake
# place authoritative files into the directory above

BOS_OPERATOR="migration-operator" \
BOS_PROVENANCE_OWNER="school-administration" \
BOS_PROVENANCE_DATE="2026-05-03" \
BOS_HANDOFF_CHANNEL="secure-copy" \
node scripts/migration/verify-bos-intake.mjs
```

Optional overrides:

- `BOS_SOURCE_DIR=/absolute/or/relative/path`
- `BOS_MANIFEST_PATH=/absolute/or/relative/path.json`

## Failure Behavior

- Script exits non-zero if any file is missing or fails `%PDF` signature validation.
- A manifest is still written to support audit/debug and unblock triage.

## Relationship to #31

After this verification passes, proceed to #48 for mapping restoration and reference revalidation.
