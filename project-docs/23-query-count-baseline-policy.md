# Query-Count Baseline and Regression Guard (C3 / #23)

This policy defines how query-count baselines are measured and when CI should fail.

## Inputs

- Route set: `scripts/query-counts.routes.json`
- Baselines:
	- `scripts/query-counts.snapshot.sqlite.json`
	- `scripts/query-counts.snapshot.d1.json`
- Thresholds: `scripts/query-counts.thresholds.json`

## CI Enforcement

- Workflow: `.github/workflows/query-counts.yml`
- Flow:
	1. Capture baseline snapshots from branch state.
	2. Regenerate snapshots on PR code.
	3. Run `scripts/query-counts-regression-check.mjs`.
	4. Fail if any route-phase increase exceeds configured threshold.

## Current Threshold Rule

- Default `maxIncrease = 0` queries per route-phase.
- Any increase is treated as a regression unless explicitly approved and re-baselined.

## Review Guidance

- Query-count reductions are always acceptable.
- Increases require:
	- justification in PR description,
	- code-level rationale,
	- explicit baseline update.

## Route Baseline Notes

- `GET /`: homepage aggregation baseline.
- `GET /posts`: list path with pagination and joins.
- `GET /posts/building-for-the-long-term`: detail path with revision/content fetch.
- `GET /pages/about`: page route baseline.
- `GET /category/development` and `GET /tag/webdev`: taxonomy listing paths.
- `GET /rss.xml`: feed generation path.
- `GET /search?q=static`: search query route.
