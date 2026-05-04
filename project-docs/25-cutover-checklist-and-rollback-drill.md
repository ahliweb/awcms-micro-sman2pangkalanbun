# Cutover Readiness Checklist and Rollback Drill (R3 / #25)

This runbook defines cutover go/no-go checks, owner mapping, and rollback drill steps.

## Pre-Cutover Checklist

### Content and Media

- [ ] Migration verification matrix complete (`project-docs/29-wave2-verification-matrix.md`)
- [ ] Reference closure check clean (`project-docs/migration/reference-validation-report.json`)
- [ ] Idempotent import dry-run evidence captured (`project-docs/migration/import-runner-dry-run.json`)
- [ ] Known media exceptions tracked

### Reliability and CI

- [ ] Required branch protection active on `main`
- [ ] Query-count guard green on latest PR baseline
- [ ] E2E smoke workflow green

### Governance and Compliance

- [ ] Compliance pack reviewed (`project-docs/11-license-compliance-pack.md`)
- [ ] Editorial governance playbook adopted (`project-docs/12-editorial-governance-playbook.md`)

### Cloudflare and Storage (if applicable)

- [ ] D1 database reachable in target environment
- [ ] Storage bindings configured and verified
- [ ] Route/domain bindings verified for production hostnames

## Go / No-Go Criteria

- `Go` only when all critical checks above pass.
- `No-Go` if any of these fail:
  - CI required checks failing
  - unresolved critical content/media defects
  - missing compliance/governance sign-off

## Cutover Day Owner Matrix

- Incident commander: `Admin/maintainer`
- Content verification lead: `Editorial lead`
- Infrastructure lead: `Deployment maintainer`
- Comms owner: `School operations contact`

## Rollback Drill (Staging)

1. Capture known-good commit SHA and data snapshot marker.
2. Apply candidate release in staging.
3. Trigger synthetic regression (example: disable one content route) and confirm alert path.
4. Roll back to known-good SHA.
5. Re-run critical route checks and smoke suite.
6. Document recovery time and residual risks.

## Rollback Validation Record

- Drill status: `completed` (staging)
- Recovery objective target: `< 30 minutes`
- Evidence artifacts:
  - CI run links
  - route status output
  - smoke test output summary

## Open Risk Register
