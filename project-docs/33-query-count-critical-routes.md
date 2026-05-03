# Query-Count Critical Route Set (C6 / #33)

This document locks the canonical route set used for query-count baseline measurement.

## Route Source of Truth

- `scripts/query-counts.routes.json`

The harness loads this file at runtime, so route changes are explicit and reviewable.

## Locked Route Set

- `GET /`
- `GET /posts`
- `GET /posts/building-for-the-long-term`
- `GET /pages/about`
- `GET /category/development`
- `GET /tag/webdev`
- `GET /rss.xml`
- `GET /search?q=static`

## Selection Rationale

- Covers homepage, list/detail content routes, page content, taxonomy routes, RSS generation, and search query path.
- Provides stable signal across read-heavy content flows that are sensitive to query regressions.

## Change Control

- Any route-set change must update `scripts/query-counts.routes.json` and this document in the same PR.
- Query-count snapshot diffs should be reviewed as intentional baseline changes, not incidental drift.
