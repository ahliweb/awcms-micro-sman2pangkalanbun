# Production Log Query Playbook (Node + Workers)

This playbook defines repeatable operator steps for release verification and incident triage using EmDash structured logs.

## Required Structured Fields

All checks in this playbook assume log lines include these fields:

- `scope` (expected: `emdash`)
- `event` (for example: `api.handle_error`, `plugin.route_handler_failed`)
- `level` (`debug`, `info`, `warn`, `error`)
- `ts` (ISO timestamp)

## Node Runtime Playbook

### 1) Start app and capture logs

```bash
pnpm dev:simple --host 127.0.0.1 --port 4330 2>&1 | tee /tmp/opencode/emdash-node.log
```

### 2) Trigger one success and one failure path

Success probe:

```bash
curl -i "http://127.0.0.1:4330/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin"
```

Failure probe (example: invalid API input):

```bash
curl -i -X POST "http://127.0.0.1:4330/_emdash/api/content/posts"
```

### 3) Verify structured fields in captured logs

```bash
rg '"scope":"emdash"' /tmp/opencode/emdash-node.log
rg '"event":"api\.handle_error"|"event":"plugin\.route_handler_failed"' /tmp/opencode/emdash-node.log
rg '"level":"error"' /tmp/opencode/emdash-node.log
rg '"ts":"' /tmp/opencode/emdash-node.log
```

### 4) Verify redaction

```bash
rg 'authorization|cookie|token|password|secret' /tmp/opencode/emdash-node.log
```

Expected result: sensitive fields appear only as `[REDACTED]`, never raw secrets.

## Cloudflare Workers Playbook

Canonical references (Cloudflare Workers docs via Context7): use structured JSON logging and `wrangler tail` for live stream validation.

### 1) Tail logs

```bash
pnpm wrangler tail <worker-name>
```

### 2) Trigger one success and one failure path

Use the same request pattern as Node against the deployed base URL.

### 3) Validate event presence and field consistency

In tail output, verify:

- `scope:"emdash"`
- `event` present on each structured line
- `level:"error"` for failure path
- `ts` present and parseable

### 4) Validate redaction

Ensure sensitive keys (`authorization`, `cookie`, `token`, `password`, `secret`) do not contain raw values.

## Release Verification Snippet

Record this minimum metadata after each release verification run:

- environment (`staging` or `production`)
- UTC time window
- operator
- success probe endpoint + status
- failure probe endpoint + status
- observed structured events
- redaction verification result

## Incident Triage Snippet

1. Bound the incident window (`start/end UTC`).
2. Filter for `level:error` and `scope:emdash`.
3. Group by `event` to identify dominant failure class.
4. Correlate first-seen timestamp with deploy/traffic changes.
5. Confirm no sensitive leakage in relevant lines before sharing excerpts.
