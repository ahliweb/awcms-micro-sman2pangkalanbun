# Plugin Strategy - Custom Extensions for School Website

## Goal

Enable controlled, maintainable extension development so school-specific functionality can be delivered without destabilizing core CMS behavior.

## Plugin Development Principles

- Build plugins for discrete capabilities, not broad cross-cutting rewrites.
- Keep plugin interfaces explicit: declared capabilities, settings, and lifecycle hooks.
- Preserve backward compatibility for any plugin consumed in production.
- Prefer additive evolution (new settings/endpoints) over breaking replacement.

## Initial Plugin Candidates

- **Academic Calendar Plugin**
  - Structured semester periods, exam windows, and school holidays.
  - Widgets for upcoming events and date highlights.
- **Teacher and Staff Directory Plugin**
  - Profile cards, department grouping, and contact metadata.
- **School Announcement Booster Plugin**
  - Priority notices, expiration windows, and optional channel forwarding.
- **Document Center Plugin**
  - Public file catalog with category filters and download analytics.

## Plugin Lifecycle

1. Define functional contract and acceptance criteria.
2. Open an issue with scope, risk, and test strategy.
3. Implement minimal viable plugin with typed settings.
4. Add tests for hooks, permissions, and failure paths.
5. Run adversarial review before PR.
6. Document usage and operational notes.

## Technical Guardrails

- Keep route handlers thin; place logic in handler/service layers.
- Validate all plugin input and setting payloads.
- Do not bypass authz helpers for plugin-owned routes.
- Respect API envelope consistency (`{ success, data?, error? }`).

## Versioning and Change Management

- Use semver discipline for plugin packages.
- Add changesets when behavior changes affect users.
- Mark deprecated options early and keep old paths functioning during transition windows.

## Tooling References

- Use the repository skill set under `skills/creating-plugins/` for implementation patterns.
- Use EmDash CLI workflows where automation helps content/schema operations.
