# Observability and Error Reporting Baseline

This baseline closes the minimum operational gap for issue `#8` by standardizing server error logs and documenting a repeatable diagnostics checklist.

## Implemented Logging Baseline

- Structured log utility added at `packages/core/src/observability/log.ts`.
- API catch-path now emits structured error events via `logEvent()` in `packages/core/src/api/error.ts` (`event: "api.handle_error"`).
- Sensitive keys are redacted recursively (`authorization`, `cookie`, `set-cookie`, `password`, `secret`, `token`, `apiKey`).
- Error payloads are normalized to `{ name, message, stack }` to preserve debugging signal.

Structured line shape:

```json
{
  "ts": "2026-05-03T00:00:00.000Z",
  "scope": "emdash",
  "level": "error",
  "event": "api.handle_error",
  "context": {
    "code": "CONTENT_UPDATE_ERROR"
  },
  "error": {
    "name": "Error",
    "message": "...",
    "stack": "..."
  }
}
```

## Diagnostics Checklist (Minimal Dashboard Alternative)

Use this checklist for release verification and incident triage.

1. Confirm app health routes return expected status (home, admin mount, key API routes).
2. Exercise a known success path and a known failure path.
3. Verify structured logs include `scope`, `level`, `event`, and non-empty `ts`.
4. Verify redaction by ensuring no tokens/cookies/passwords appear in emitted logs.
5. Confirm user-facing API responses remain sanitized (`{ error: { code, message } }`, no raw stack leakage).
6. Record run metadata in deployment notes: environment, timestamp window, operator, result.

## Cloudflare/Workers Verification Path

Canonical references were checked from Cloudflare Workers docs (Context7):

- Structured JSON logs are recommended for queryable Workers logs.
- `console.error` is captured as error severity.
- `wrangler tail` is the baseline live stream path.

Command examples:

```bash
pnpm wrangler tail <worker-name>
```

During a verification run, trigger one successful request and one failing request, then check tail output for:

- `event: "api.handle_error"` on failures
- Redacted sensitive keys
- Consistent `scope: "emdash"`

## Test Evidence

- Unit coverage for structured output and redaction: `packages/core/tests/unit/observability/log.test.ts`.
- Existing API response behavior and cache-header expectations retained: `packages/core/tests/unit/api/cache-headers.test.ts`.

## Follow-up Atomic Work (if needed)

- Expand structured logging to non-API runtime paths currently using ad hoc `console.*`.
- Add a log-query playbook per deployment target (Node and Workers) with exact filters.
- Add CI guardrails for accidental logging of sensitive key names in changed files.
