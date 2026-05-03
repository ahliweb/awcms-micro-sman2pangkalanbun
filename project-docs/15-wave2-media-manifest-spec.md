# Wave 2 Deterministic Media Manifest Spec (M3 / #15)

This spec defines machine-readable deterministic manifests for media import.

## Manifest Goals

- Deterministic output for identical source input.
- Idempotent imports (same key/checksum means no duplicate media rows).
- Traceability from imported media back to legacy source path.

## File Layout

- `project-docs/manifests/staff.sample.json`
- `project-docs/manifests/backgrounds.sample.json`
- `project-docs/manifests/gallery.sample.json`
- `project-docs/manifests/documents.sample.json`

Each domain keeps a separate manifest shard and a stable sort order.

## Manifest Entry Schema

```json
{
	"sourcePath": "/public/images/staff/teachers/teacher-01.webp",
	"checksum": "sha256:bda774c97a9206147f01ae1fb1da7b7bee222c000958a50ff8f635fd8b66e3f4",
	"targetKey": "legacy/staff/teacher-01-bda774c97a92.webp",
	"mimeType": "image/webp"
}
```

Required fields:

- `sourcePath`: legacy repo-relative absolute-style path.
- `checksum`: SHA-256 with `sha256:` prefix.
- `targetKey`: deterministic storage key.
- `mimeType`: explicit MIME for upload and validation.

## Deterministic Key Strategy

- Normalize filename stem:
  - lower-case
  - non-alphanumeric converted to `-`
  - trim leading/trailing `-`
- Compute `sha256` over file bytes.
- Build key as:
  - `legacy/{domain}/{normalizedStem}-{sha256Prefix12}.{ext}`

Example:

- Source: `/public/images/backgrounds/hero-campus.webp`
- SHA-256: `f862ce203b1f...`
- Target key: `legacy/backgrounds/hero-campus-f862ce203b1f.webp`

## Idempotent Re-Run Rules

- Manifest generator must sort source paths lexicographically before hashing.
- Re-running against unchanged files must produce byte-identical manifest JSON.
- Importer behavior:
  - if `targetKey` exists and checksum matches: `skip`
  - if `targetKey` exists and checksum differs: `error` (requires manual collision resolution)
  - if `targetKey` missing: `upload`

## Domain Batching

- `staff`: profile and role photos.
- `backgrounds`: hero and section backgrounds.
- `gallery`: activity/media gallery source files.
- `documents`: PDF/DOCX/PNG report or institutional documents.

## Dry-Run Validation Steps

1. Generate manifests twice from the same source tree.
2. Compare generated JSON checksums.
3. Dry-run import subset and verify no duplicate key creation.

## Known Limits (Current Sample)

- Sample manifests contain only a subset per domain for contract proof.
- Full manifests should be generated in #21 runner implementation.
