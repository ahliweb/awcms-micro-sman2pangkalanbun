# AI-Native Development Workflow

## Objective

Run an end-to-end development lifecycle that is intentionally designed for AI pair programming and multi-model execution.

## Model Roles

- **GPT-5.3 Codex**: primary coding and refactoring executor.
- **GPT-5.4 Mini**: fast drafting, decomposition, and lightweight review.
- **DeepSeek V4 Pro**: alternative implementation and adversarial perspective.
- **Other models**: optional tie-breakers for architecture and review conflicts.

## Operating Pattern (Single Atomic Task)

1. Define one task with one measurable outcome.
2. Ask a planning model to generate acceptance criteria and test plan.
3. Ask implementation model to produce minimal scoped changes.
4. Run checks (`lint`, `typecheck`, targeted tests, then full tests as needed).
5. Ask a reviewer model to perform adversarial review.
6. Fix findings and rerun checks.
7. Commit with a concise reason-focused message.

## Branch and Issue Convention

- One issue per atomic unit.
- One branch per issue (`feat/issue-<id>-short-topic` or `fix/issue-<id>-short-topic`).
- Keep PR scope narrow; avoid cross-domain bundling.
- Link every commit and PR to its issue.

## Required Quality Gates

- `pnpm --silent lint:quick` after each edit batch.
- `pnpm typecheck` (or `pnpm typecheck:demos` where applicable).
- `pnpm test` before merge for non-trivial change sets.
- Backward-compatibility check for behavior touching published packages.

## Prompting Standard

- State the exact file scope and constraints.
- Include existing conventions from `AGENTS.md`.
- Request delta-only responses (no broad refactors).
- Demand explicit assumptions and risk notes in model output.

## Documentation Standard

- Every merged issue updates relevant docs in `project-docs/`.
- Architectural changes require updates in `03-technical-architecture.md`.
- Plugin changes require updates in `04-plugin-strategy.md`.
- Roadmap progress updates `05-atomic-roadmap-and-issues.md`.

## Adversarial Review Checklist

- Security: input validation, authz, and SQL safety.
- Compatibility: no silent break in API shape or schema behavior.
- i18n and RTL: user-facing admin strings and layout safety.
- Error handling: consistent API envelopes and safe catch blocks.
- Performance: no avoidable extra queries in hot paths.
