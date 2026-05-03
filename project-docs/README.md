# Website SMAN 2 Pangkalanbun - Project Documentation

This documentation set defines how to build and operate **Website SMAN 2 Pangkalanbun** using a fully AI-driven workflow on top of EmDash.

## Document Map

- `project-docs/01-product-vision.md` - scope, goals, users, and success metrics.
- `project-docs/02-ai-native-workflow.md` - 100% AI-first implementation process and model orchestration.
- `project-docs/03-technical-architecture.md` - EmDash-based architecture, environments, and deployment blueprint.
- `project-docs/04-plugin-strategy.md` - plugin roadmap, design rules, and extension lifecycle.
- `project-docs/05-atomic-roadmap-and-issues.md` - atomic delivery plan plus issue definitions.
- `project-docs/06-license-and-compliance.md` - AW Non-Commercial licensing and compliance operating guide.
- `project-docs/07-reference-audit-smanda-legacy.md` - audit of legacy site content/assets and reuse boundaries.
- `project-docs/08-emdash-content-asset-ingestion-plan.md` - migration plan to EmDash-managed content and media.
- `project-docs/09-wave1-bootstrap-baseline.md` - validated local bootstrap, run path, and dev bypass checks.
- `project-docs/10-wave1-information-architecture.md` - Wave 1 IA/menu tree and section ownership mapping.
- `project-docs/11-wave1-visual-identity-plan.md` - visual identity baseline plan for Wave 1 implementation.
- `project-docs/12-wave2-execution-checklist.md` - Wave 2 gate checklist and dependency handoff criteria.
- `project-docs/13-wave2-content-contract.md` - locked legacy-to-EmDash mapping contract for Wave 2 import.
- `project-docs/14-wave2-asset-classification.md` - asset ownership classification and missing-source resolution registry.
- `project-docs/15-wave2-media-manifest-spec.md` - deterministic media manifest schema, key rules, and idempotency strategy.
- `project-docs/manifests/*.sample.json` - machine-readable sample manifest shards for staff/backgrounds/gallery/documents.
- `project-docs/30-missing-source-resolution-pack.md` - resolved disposition pack for all missing source references.
- `project-docs/16-wave2-content-transform.md` - transform outputs and rules applied from the locked Wave 2 contract.
- `project-docs/20-wave2-reference-closure.md` - unresolved-reference closure verification for transformed payloads.
- `project-docs/21-wave2-import-runner.md` - idempotent import runner dry-run behavior and evidence outputs.
- `project-docs/29-wave2-verification-matrix.md` - Wave 2 matrix for routes, media, locale, editability, and source isolation.
- `project-docs/17-wave2-editability-source-isolation.md` - focused #17 verification report for EmDash editability and legacy isolation.
- `project-docs/33-query-count-critical-routes.md` - canonical route-set lock for query-count baseline measurement.
- `project-docs/23-query-count-baseline-policy.md` - regression threshold policy and CI guard behavior for query counts.
- `project-docs/34-e2e-events-fixture-smoke.md` - events fixture extension and smoke coverage parity artifact.
- `project-docs/31-bos-attachment-restoration.md` - BOS attachment restoration status and external input checklist.
- `project-docs/11-license-compliance-pack.md` - non-commercial compliance controls and release checklist gates.
- `project-docs/12-editorial-governance-playbook.md` - publishing workflow, correction policy, archival policy, and urgent SLAs.
- `project-docs/25-cutover-checklist-and-rollback-drill.md` - go/no-go checks, owner mapping, and rollback drill runbook.
- `project-docs/04-05-06-content-chain-implementation.md` - implementation evidence for core/secondary collections and public search/filtering.
- `project-docs/35-observability-error-reporting-baseline.md` - structured logging baseline, diagnostics checklist, and Workers verification path.
- `project-docs/37-production-log-query-playbook.md` - operator query/verification playbook for Node and Cloudflare Workers logs.
- `project-docs/38-log-safety-ci-guard.md` - CI guard rules, remediation, and suppression process for sensitive logging regressions.

## Principles

- EmDash is the source platform for content, admin, APIs, and extension points.
- Every implementation task is atomic, testable, and issue-driven.
- AI agents are used for analysis, coding, review, and documentation.
- Backward compatibility is preserved unless a planned breaking change is explicitly approved.

## Recommended Immediate Start

1. Read `project-docs/01-product-vision.md` and lock scope.
2. Follow `project-docs/02-ai-native-workflow.md` for your execution loop.
3. Open implementation issues from `project-docs/05-atomic-roadmap-and-issues.md`.
4. Enforce `project-docs/06-license-and-compliance.md` checks before public release.
