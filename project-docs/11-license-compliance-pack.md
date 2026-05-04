# AW Non-Commercial License Compliance Pack (E1 / #11)

This pack codifies repository-level compliance controls for non-commercial usage.

## License and Usage Constraints

- Primary compliance references:
  - `project-docs/06-license-and-compliance.md`
  - repository `LICENSE` files (where applicable)
- Non-commercial usage constraints must be explicitly documented in release notes and deployment approvals.

## Required Compliance Gates Before Release

1. Confirm intended deployment context is non-commercial.
2. Confirm no paid/ad-monetized usage path is introduced.
3. Confirm attribution and notice copy is present in site footer/legal page.
4. Confirm compliance checklist sign-off in release issue/PR.

## Attribution and Legal Notice Handling

- Maintain a visible legal notice location (footer or dedicated legal page).
- Keep attribution text version-controlled and reviewed on release PRs.
- Record any third-party media/license exceptions in migration docs.

## Release Checklist (Compliance Section)

- [ ] Non-commercial usage validated for target environment
- [ ] Attribution notice present and linked
- [ ] Compliance docs reviewed for latest policy
- [ ] Any exceptions approved and documented

## Dry-Run Scenario

- Apply checklist against current staging candidate.
- Verify all checkboxes can be satisfied with existing repository artifacts.
