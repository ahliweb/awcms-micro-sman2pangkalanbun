# Wave 2 Execution Checklist and Handoff Gates

This checklist defines the atomic execution order for Wave 2 issues and the gate criteria required before each dependent issue begins.

## Scope Coverage

- Core content model: #4, #5, #6
- Migration contract and assets: #13, #14, #15, #16, #20
- Import and verification: #21, #29, #17
- Cutover dependency handoff: #25

## Gate 0: Wave 1 Baseline Complete

- **Entry:** Wave 1 foundation/IA/visual issues closed.
- **Exit evidence:** closed issues #1, #2, #3, #22, #27.

## Gate 1: Collection Contract Locked

- **Primary issue:** #13
- **Entry:** Gate 0 complete.
- **Exit criteria:**
  - Legacy-to-EmDash field mapping is frozen for initial import.
  - Required collections and field types are finalized for Wave 2.
  - Known non-mappable fields are explicitly marked with disposition.
- **Evidence artifact:** contract document + mapping table in `project-docs/`.

## Gate 2: Asset Classification and Ownership

- **Primary issue:** #14
- **Entry:** Gate 1 complete.
- **Exit criteria:**
  - All referenced assets are classified (image/file/unknown).
  - Ownership gaps are identified with remediation owners and due status.
  - Missing legacy references are tracked and linked to resolution work.
- **Evidence artifact:** asset classification report + unresolved reference log.

## Gate 3: Deterministic Media Manifests

- **Primary issue:** #15
- **Entry:** Gate 2 complete.
- **Exit criteria:**
  - Deterministic media manifest format is defined and reproducible.
  - Stable identifiers/paths are assigned for import-safe replay.
  - Duplicate and collision handling rules are documented.
- **Evidence artifact:** manifest spec + sample generated manifests.

## Gate 4: Content Transform Payloads

- **Primary issue:** #16
- **Entry:** Gates 1 and 3 complete.
- **Exit criteria:**
  - Legacy content transforms produce EmDash import payloads per collection.
  - Transform output is deterministic for identical input.
  - Validation failures are surfaced with actionable diagnostics.
- **Evidence artifact:** transform examples + validation output logs.

## Gate 5: Missing Reference Resolution

- **Primary issue:** #20
- **Entry:** Gates 2, 3, and 4 complete.
- **Exit criteria:**
  - Missing media/document references are either resolved or explicitly waived.
  - Every unresolved item has status and rationale.
  - Import is not blocked by unknown/missing references.
- **Evidence artifact:** resolved/waived registry with traceable IDs.

## Gate 6: Idempotent Import Runner

- **Primary issue:** #21
- **Entry:** Gates 4 and 5 complete.
- **Exit criteria:**
  - Import runner can replay safely without duplicating records.
  - Re-run semantics are documented (upsert/skip/replace behavior).
  - Batch failure handling and resume behavior are verified.
- **Evidence artifact:** runner docs + staged dry-run logs.

## Gate 7: Migration Verification Matrix

- **Primary issue:** #29
- **Entry:** Gate 6 complete.
- **Exit criteria:**
  - Route/media/locale/editability verification matrix is complete.
  - Pass/fail criteria are objective and repeatable.
  - Evidence fields are populated for staged test batches.
- **Evidence artifact:** completed verification matrix + defect log.

## Gate 8: Editability and Source Isolation Validation

- **Primary issue:** #17
- **Entry:** Gates 6 and 7 complete.
- **Exit criteria:**
  - EmDash admin editability confirmed across migrated collections.
  - Frontend rendering uses EmDash source of truth with no legacy coupling.
  - Critical defects from Gate 7 are resolved or accepted with rationale.
- **Evidence artifact:** admin/frontend validation report.

## Gate 9: Cutover Readiness Input

- **Downstream issue:** #25
- **Entry:** Gate 8 complete.
- **Exit criteria:**
  - Wave 2 artifacts are attached/linked for cutover checklist and rollback drill.
  - Open risk register for migration-specific defects is current.
- **Evidence artifact:** handoff package linked from #25.

## Parallelization Rules

- Work in parallel only when earlier gate exit criteria are met.
- Do not start #21 before #16 and #20 are complete.
- Do not start #17 or #25 validation sign-off before #29 is complete.
- Any contract or manifest change after Gate 4 requires impact review on #21 and #29.

## Minimal Command Evidence

- Lint quick check after each implementation slice: `pnpm --silent lint:quick`
- Demo build proof for frontend-impacting migration checks: `pnpm --filter emdash-demo build`
- Keep command outputs linked from issue comments, not embedded as large dumps.
