# CI Quality Gates and Branch Protection Policy

This policy defines merge requirements for `main`, commit hygiene expectations, and rollback basics for CI incidents.

## Required Status Checks on `main`

Protect `main` with required checks from repository workflows:

- `CI / Typecheck`
- `CI / Lint`
- `CI / Log Safety`
- `CI / Version Check`
- `CI / Tests`
- `CI / Validate Plugins`
- `CI / Smoke Tests`
- `CI / Integration Tests`
- `CI / Browser Tests`
- `CI / E2E tests (1/8)` through `CI / E2E tests (8/8)`
- `CI / E2E Tests`
- `PR Compliance / Validate PR`
- `Query Counts / Measure`

## Merge Requirements

- Require pull request before merge.
- Require all required checks to pass.
- Require branches to be up to date before merge.
- Disallow force-pushes to `main`.
- Disallow branch deletion of `main`.

## Commit Hygiene

- Keep PR scope atomic and aligned to a single issue slice.
- Do not merge red CI except under explicit incident override.
- Use PR template and include AI disclosure when applicable.
- Avoid mixed-purpose commits; include clear intent in commit message.

## Incident Rollback Basics

When a merged change causes CI or runtime incidents:

1. **Freeze merges** to `main` until diagnosis is complete.
2. **Revert offending PR** (preferred over force-push/reset).
3. **Re-run CI** and confirm required checks are green.
4. **Open a follow-up issue** for root cause and durable fix.
5. **Document impact and rollback time** in issue/PR thread.

## Validation Procedure

- Open a test PR with one intentional failing check (example: lint) and verify merge is blocked.
- Restore passing state and verify merge unblocks only when all required checks are green.

## Ownership

- Repository maintainers own branch protection settings.
- Contributors propose policy changes through issues/PRs; maintainers apply settings in GitHub branch rules.
