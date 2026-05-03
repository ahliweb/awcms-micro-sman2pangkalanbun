# Wave 2 Migration Verification Matrix (M8 / #29)

This matrix validates route health, media resolution, locale rows, admin editability, and frontend source isolation using Wave 2 artifacts.

## Run Metadata

- Run ID: `wave2-matrix-run-001`
- Result artifact: `project-docs/migration/verification-matrix-run-001.json`

## Matrix

| Check ID | Category | Check | Criteria | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| R1 | Routes | Critical public routes resolve | `/`, `/posts`, `/pages/profil-sekolah`, `/pages/kontak`, `/pages/prestasi`, `/pages/profil-alumni`, `/pages/layanan` return HTTP 200 | Pass | `/tmp/opencode/wave2-route-status.txt` |
| M1 | Media | No unresolved transformed paths | `unresolvedCount = 0` after resolution mapping | Pass | `project-docs/migration/reference-validation-report.json` |
| L1 | Locale | `id/en` row emission | Transform outputs include locale rows for bilingual records | Pass | `project-docs/migration/transforms/news.sample.json` |
| A1 | Admin editability | Draft to publish flow works | Create draft post and publish via EmDash API succeeds | Pass | `/tmp/opencode/wave2-create-post-response.json`, `/tmp/opencode/wave2-publish-post-response.json` |
| A2 | Public render | Published edit is visible | Published verification post appears on `/posts` | Pass | `/tmp/opencode/wave2-posts.html` |
| S1 | Source isolation | No legacy runtime dependency | No `src/data`/legacy import usage in `demos/simple/src`; runtime uses EmDash live loader | Pass | `demos/simple/src/live.config.ts` |

## Commands Used

```bash
node scripts/migration/generate-wave2-transform-samples.mjs
node scripts/migration/validate-wave2-references.mjs
node scripts/migration/wave2-import-runner.mjs
curl -sS http://127.0.0.1:4330/posts
```

## Notes

- This matrix is the required input for #17 verification and #25 cutover readiness evidence.
