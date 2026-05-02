# Technical Architecture - EmDash Foundation

## Platform Decision

This project is built as an EmDash-based Astro website with structured content in SQL-backed collections and optional Cloudflare-native runtime components.

## Environment Strategy

- **Local development**: `demos/simple` pattern (Node.js + SQLite).
- **Cloudflare runtime (recommended production target)**: Workers + D1 + R2 + KV.
- **Plugin model**: start with safe mode/in-process where needed; move to sandboxed workers when available.

## Reference Topology

- Frontend rendering: Astro pages and components.
- CMS runtime: EmDash core integration and admin app.
- Data plane: content collections (`ec_*`), system tables (`_emdash_*`).
- Media plane: local storage (dev) and R2/S3-compatible storage (prod).
- Access plane: passkey-first auth with role/permission controls.

## Proposed Content Model (Initial)

- `pages`: static-like informational pages (profile, admissions, contact).
- `news`: school news and press updates.
- `announcements`: urgent notices and short-form updates.
- `events`: academic and extracurricular calendar items.
- `achievements`: student and school achievements.
- `gallery`: photo/video showcases.
- `downloads`: public documents and forms.

Each collection should include locale-aware behavior where needed and keep slug conventions predictable.

## Deployment Blueprint

1. Keep app code in this monorepo with `workspace:*` package links.
2. Use environment-specific config for database/storage/session bindings.
3. Automate checks before deployment (lint, typecheck, tests).
4. Roll out with clear rollback path and migration tracking.

## Security Baseline

- Enforce permission checks on all state-changing routes.
- Maintain CSRF header requirements for admin mutations.
- Validate all user input via schema-based parsers.
- Keep secrets out of source control and use runtime bindings.

## Performance Baseline

- Use request-level caching for repeated template helper reads.
- Minimize query count in critical public routes.
- Favor batched queries over repeated lookups.
- Track regressions with query-count snapshots when backend behavior changes.

## Documentation-Driven Architecture Control

- Any new collection, API shape, or plugin capability must be documented before implementation starts.
- Any breaking behavior requires explicit proposal and versioning decision.
