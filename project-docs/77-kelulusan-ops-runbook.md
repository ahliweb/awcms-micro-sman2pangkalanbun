# Kelulusan Ops Runbook (D3.9 / #77)

This document defines operational steps for importing kelulusan student data, mapping PDFs, deploying, verifying, and rolling back.

## Scope

- Plugin: `@emdash-cms/plugin-kelulusan`
- Public path: `/kelulusan`
- Admin path: `/kelulusan/admin`
- Plugin API base: `/_emdash/api/plugins/kelulusan`

## Data Contract

Each student record in plugin storage must include:

- `nisn` (string, unique)
- `name` (string)
- `pdfMediaId` (string; must point to an existing EmDash media item)
- `pdfFilename` (string)
- `createdAt` (ISO timestamp)

Telemetry events are recorded in `document_events` with:

- `studentId` (NISN)
- `eventType` (`opened` or `downloaded`)
- `actorType` (`public` or `admin`)
- `createdAt` (ISO timestamp)

## Import Workflow

1. Prepare CSV or spreadsheet source with columns:
   - `nisn`, `name`, `pdf_filename`, `pdf_local_path`
2. Upload each PDF through EmDash media pipeline (or storage-compatible batch process) and capture resulting media IDs.
3. Build normalized import payload mapping `pdfMediaId` to each NISN.
4. Insert/update student records via plugin storage flow (route or trusted script) using the data contract above.
5. Verify no duplicate NISN rows exist.

## Storage and Media Validation

Before enabling public access:

- `students` storage has expected row count.
- Every `pdfMediaId` resolves to a valid media item.
- Every media item points to a readable PDF object.
- `students.list` returns rows with expected fields and telemetry defaults.

## Required Runtime/Bindings

- EmDash plugin registration includes `kelulusanPlugin()`.
- Media storage is configured and reachable by EmDash runtime.
- For Cloudflare deployment:
  - D1 binding active
  - R2 binding active
  - session KV binding active

## Deployment Checklist

Run from repository root:

```bash
pnpm --silent lint:quick
pnpm --filter @emdash-cms/plugin-kelulusan typecheck
pnpm --filter @emdash-cms/plugin-kelulusan test
```

Then deploy site target (example for cloudflare demo):

```bash
pnpm --filter @emdash-cms/demo-cloudflare run deploy
```

## Post-Deploy Verification

Public checks:

1. Open `/kelulusan`.
2. Submit a known valid NISN.
3. Confirm NISN, name, and PDF filename are shown.
4. Open PDF popup and confirm PDF renders.
5. Trigger download and confirm file opens/downloads.

Admin checks:

1. Login to admin.
2. Open `/kelulusan/admin`.
3. Confirm list rows render with NISN/name/filename.
4. Open PDF popup from one row.
5. Confirm telemetry columns (`Dibuka`, `Diunduh`) update after actions.

Security checks:

1. Repeated invalid NISN attempts eventually return generic rejection.
2. Expired/invalid gate tokens fail public PDF access.
3. No NISN leakage in error messages.

## Rollback Procedure

If a release is unhealthy:

1. Remove `kelulusanPlugin()` from site plugin registration.
2. Redeploy last known good revision.
3. Keep student and event data intact unless a data corruption incident requires manual cleanup.
4. If needed, restore D1/R2 from latest valid backups/bookmarks.
5. Re-run smoke checks on public and admin routes.

## Operational Notes

- Treat NISN as sensitive student identifier; do not emit it in verbose logs.
- Prefer additive updates to storage records and avoid destructive bulk operations without backup.
- Keep gate token TTL short and monitor rejection patterns for abuse signals.
