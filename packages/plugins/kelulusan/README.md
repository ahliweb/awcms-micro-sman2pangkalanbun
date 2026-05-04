# Kelulusan Plugin

## Overview

`@emdash-cms/plugin-kelulusan` provides a two-step NISN verification flow for graduation-result PDF access:

1. Public gate page verifies NISN and starts a short-lived session token.
2. Result page resolves that session before allowing open/download actions.

The plugin also records document telemetry for public and admin access paths.

## Status

- Package: `@emdash-cms/plugin-kelulusan`
- Version: `0.0.1`
- Format: `standard`
- Entrypoint: `@emdash-cms/plugin-kelulusan/sandbox`

## Capabilities

- `media:read` - required for PDF retrieval flow

## Storage and indexes

- `students`
  - unique index: `nisn`
  - indexes: `nisn`, `name`, `createdAt`
- `document_events`
  - indexes: `studentId`, `eventType`, `actorType`, `createdAt`

## Routes

- `admin` - Block Kit admin panel for student list, telemetry, and document URL actions
- `students/list` - paginated student list with telemetry summary fields
- `students/upsert` - admin route for creating/updating student records
- `students/get-by-nisn` - public student lookup by NISN
- `gate/session/start` - public NISN verifier and gate session issuer (10-minute token)
- `gate/session/resolve` - validates active gate session for the result page
- `documents/access/public` - NISN + gate token PDF access with telemetry event (deduplicated briefly)
- `documents/access/admin` - authenticated admin PDF access with telemetry event

## Route/session model

- `gate/session/start` stores `gate-session:{nisn}` in plugin KV with `token`, `expiresAt`, `issuedIp`, and `issuedUserAgent`.
- `gate/session/resolve` and `documents/access/public` both enforce token validity, expiration, IP binding, and user-agent binding.
- Result pages should never trust local session storage alone; always call `gate/session/resolve` before rendering student data.
- On resolve/access failures, clear local session state and redirect back to `/kelulusan` for re-verification.

## Telemetry behavior

- Public document events (`opened`, `downloaded`) are deduplicated for 5 seconds per `nisn + eventType + accessToken`.
- Admin document actions always record events.
- Student listing telemetry fields: `openedCount`, `downloadedCount`, `lastOpenedAt`, `lastDownloadedAt`.

## Troubleshooting runbook

- **Result page keeps redirecting to gate:**
  - confirm `sessionStorage` contains `kelulusan:gate-session` with `nisn` and `accessToken`
  - verify the token has not expired (default 10 minutes)
  - verify request IP/user-agent did not change between gate and result access
- **PDF open/download fails for a valid student:**
  - verify `pdfMediaId` exists and media object is still present
  - verify plugin has `media:read` capability available in runtime context
- **Telemetry appears lower than click count:**
  - expected for rapid repeated public clicks within dedupe window
  - use admin path for explicit, non-deduped audit actions

## Validation checklist

- `pnpm --silent lint:quick`
- `pnpm --filter @emdash-cms/plugin-kelulusan typecheck`
- `pnpm --filter @emdash-cms/plugin-kelulusan test`
- `pnpm exec playwright test e2e/tests/kelulusan.spec.ts --project=chromium`
