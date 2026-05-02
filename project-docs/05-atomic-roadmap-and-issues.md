# Atomic Roadmap and Issue Plan

## Delivery Method

All execution is issue-first and atomic. Each issue should be independently testable and mergeable.

## Epic A - Foundation and Branding

### Issue A1 - Project Bootstrap for Website SMAN 2 Pangkalanbun

- Create site workspace target (demo/template base) for school website.
- Verify local run, setup bypass, and admin access.
- Document bootstrap commands and baseline configuration.

### Issue A2 - Information Architecture and Navigation

- Define primary menu and footer structure.
- Map page hierarchy for profile, admissions, news, and contact.
- Add content owner mapping per section.

### Issue A3 - Visual Identity Baseline

- Set design tokens and base typography/colors.
- Implement reusable layout primitives.
- Validate responsive behavior on desktop/mobile.

## Epic B - Content System

### Issue B1 - Collections for Pages, News, Announcements

- Create and validate collection schemas.
- Define required fields, slug rules, and editorial statuses.
- Add seed examples for editor onboarding.

### Issue B2 - Collections for Events, Achievements, Gallery, Downloads

- Implement remaining core collections.
- Add list/detail rendering patterns per collection.
- Ensure admin labels and help text are clear.

### Issue B3 - Public Search and Filtering

- Add search endpoint/UI integration for relevant collections.
- Add filters (date/category/type) where appropriate.
- Verify query performance and result relevance.

## Epic C - Reliability and Operations

### Issue C1 - CI Quality Gates and Branch Protection Policy

- Enforce lint, typecheck, and tests on PRs.
- Define merge requirements and commit hygiene.
- Document incident rollback basics.

### Issue C2 - Observability and Error Reporting Baseline

- Add structured logging approach for key flows.
- Define minimal dashboard or diagnostics checklist.
- Document production verification procedure.

## Epic D - Plugin Enablement

### Issue D1 - Plugin Scaffolding Standard

- Create a repeatable scaffold process for school plugins.
- Provide conventions for settings, hooks, and API routes.
- Add a plugin readme template.

### Issue D2 - First Custom Plugin (Academic Calendar)

- Implement plugin MVP with calendar data model.
- Expose admin controls and public rendering hooks.
- Add tests and usage documentation.

## Epic E - Governance and Compliance

### Issue E1 - AW Non-Commercial License Compliance Pack

- Add license references and usage constraints to repository docs.
- Define release checklist to prevent accidental non-compliant use.
- Document attribution and legal notice handling.

### Issue E2 - Content and Editorial Governance

- Define publishing workflow and approval roles.
- Add policy for corrections and archival handling.
- Document SLA targets for urgent announcements.

## Issue Template Requirements

Each issue should include:

- Problem statement.
- Scope in/out.
- Acceptance criteria.
- Technical notes.
- Test plan.
- Risk and rollback notes.
