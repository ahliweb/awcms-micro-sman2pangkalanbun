# Wave 1 Bootstrap Baseline

## Purpose

Define the reproducible local bootstrap path for this project and record the validated admin bypass flow for development.

## Workspace Target

- Primary implementation target: `demos/simple`
- Runtime: Astro server output with EmDash integration
- Database (local): `sqlite` file `demos/simple/data.db`
- Media storage (local): `demos/simple/uploads`

## Prerequisites

Run from repository root unless noted.

```bash
pnpm install
pnpm build
```

Notes:

- `pnpm build` is required in this monorepo so workspace package `dist` outputs exist before the demo can run.
- Running `pnpm --silent lint:json` currently reports pre-existing workspace diagnostics not introduced by this project scope.

## Local Run

Canonical command from repository root:

```bash
pnpm dev:simple --host 127.0.0.1 --port 4330
```

Expected:

- Local app available at `http://127.0.0.1:4330/`
- EmDash admin mounted at `/_emdash/admin`
- EmDash API mounted at `/_emdash/api/*`

## Dev Bypass Verification

Validated endpoints in dev mode:

- `/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin`
- `/_emdash/api/auth/dev-bypass?redirect=/_emdash/admin`

Observed behavior:

- Both endpoints return `200 OK` and redirect HTML to `/_emdash/admin`.
- Session cookie is issued (`astro-session=...`) and reused.

Verification command used:

```bash
curl -i -c /tmp/opencode/smanda-cookie.txt "http://127.0.0.1:4330/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin"
curl -i -b /tmp/opencode/smanda-cookie.txt -c /tmp/opencode/smanda-cookie.txt "http://127.0.0.1:4330/_emdash/api/auth/dev-bypass?redirect=/_emdash/admin"
```

## Baseline Config References

- Demo config: `demos/simple/astro.config.mjs`
- EmDash runtime wiring in demo:
  - Database: `sqlite({ url: "file:./data.db" })`
  - Storage: `local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" })`
  - Plugin baseline: `auditLogPlugin()`

## Operational Notes

- Use `pnpm dev:simple --host 127.0.0.1 --port 4330` for deterministic host/port binding in this workspace.
- During first start, EmDash can auto-seed default collections and trigger type generation.
