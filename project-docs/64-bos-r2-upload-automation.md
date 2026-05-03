# BOS R2 Upload Automation (M11.4 / #64)

This step uploads verified BOS intake files to Cloudflare R2 and records key/URL/checksum evidence for issue closure.

## Preconditions

1. `project-docs/migration/bos-intake-manifest.json` exists and has `ok: true`
2. BOS source files exist at the `sourcePath` values inside the manifest
3. Cloudflare credentials are available in `.env`

## Script

- Path: `scripts/migration/upload-bos-to-r2.mjs`
- Default bucket: `sman2pangkalanbunweb`
- Default key prefix: `documents`
- Default report output: `project-docs/migration/bos-r2-upload-report.json`

## Command

```bash
node scripts/migration/upload-bos-to-r2.mjs
```

Optional overrides:

- `BOS_MANIFEST_PATH=/path/to/bos-intake-manifest.json`
- `BOS_UPLOAD_REPORT_PATH=/path/to/bos-r2-upload-report.json`
- `BOS_R2_BUCKET=sman2pangkalanbunweb`
- `BOS_R2_KEY_PREFIX=documents`
- `BOS_PUBLIC_URL_BASE=https://sman2pangkalanbun.sch.id`
- `BOS_ENV_FILE=/absolute/path/to/.env`

## Output Artifacts

1. Upload report JSON with file->bucket/key/url mappings:
	- `project-docs/migration/bos-r2-upload-report.json`
2. Manifest enrichment under `r2Upload` inside:
	- `project-docs/migration/bos-intake-manifest.json`

## Failure Behavior

- Script exits non-zero if manifest is missing/invalid, files are missing, or any upload fails.
- Upload process is strict by design to keep #51 evidence deterministic.
