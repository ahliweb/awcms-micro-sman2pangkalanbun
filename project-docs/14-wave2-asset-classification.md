# Wave 2 Asset Classification and Ownership Gaps (M2 / #14)

This document classifies legacy assets and records ownership/remediation status before ingestion.

## Classification Policy

- `owned-local`: file exists in legacy repository and is eligible for managed import.
- `external-third-party`: externally hosted URL (Unsplash/Pexels/other) that must not be hotlinked in production without explicit exception.
- `missing-source`: referenced by content but missing from legacy local files.

## Current Counts (from structured sources)

- Referenced local paths (`/images/*`, `/documents/*`): `72`
- Present local files: `54`
- Missing local files: `18`
- External URLs in structured data (`http(s)`): present in `site.json`, `contact.json`, `services.json`, `images.json`

## Owned-Local Buckets

- `/public/images/staff/teachers/*.webp` (teacher profile photos)
- `/public/images/staff/admin/*.webp` (admin profile photos)
- `/public/images/backgrounds/*.webp` (hero/section backgrounds)
- `/public/images/smanda-logo.png`, `/public/images/smanda-logo.webp`, `/public/images/smanda-struktur.webp`
- `/src/assets/foto-smandapbun/**/*` (gallery/activity source media)
- `/src/assets/smandapbun-materi-web/*` (local PDF/DOCX/PNG materials)

## External Third-Party Buckets

- `src/data/images.json` image pools (Unsplash/Pexels URLs)
- Social/media links and map embeds in `site.json`, `contact.json`, `services.json`

Decision for Wave 2:

- External visual assets from `images.json` are excluded from production media import.
- They may be used only as temporary placeholders in non-production preview.

## Missing-Source Registry

| Reference                             | Source file                            | Status         | Disposition                                                        |
| ------------------------------------- | -------------------------------------- | -------------- | ------------------------------------------------------------------ |
| `/images/news/osn-2024.jpg`           | `blogs/blogs.json`                     | missing-source | replace from owned photo archive or mark non-featured              |
| `/images/news/mpls-2024.jpg`          | `blogs/blogs.json`                     | missing-source | replace from owned photo archive or mark non-featured              |
| `/images/news/hardiknas-2024.jpg`     | `blogs/blogs.json`                     | missing-source | replace from owned photo archive or mark non-featured              |
| `/images/alumni/hasan-basri.jpg`      | `pages/alumni.json`                    | missing-source | request consented portrait or switch to no-photo card              |
| `/images/alumni/siti-nurhaliza.jpg`   | `pages/alumni.json`                    | missing-source | request consented portrait or switch to no-photo card              |
| `/images/alumni/ahmad-yani.jpg`       | `pages/alumni.json`                    | missing-source | request consented portrait or switch to no-photo card              |
| `/images/alumni/rini-wulandari.jpg`   | `pages/alumni.json`                    | missing-source | request consented portrait or switch to no-photo card              |
| `/images/alumni/budi-prasetyo.jpg`    | `pages/alumni.json`                    | missing-source | request consented portrait or switch to no-photo card              |
| `/images/alumni/dewi-permatasari.jpg` | `pages/alumni.json`                    | missing-source | request consented portrait or switch to no-photo card              |
| `/images/staff/kepala-sekolah.jpg`    | `site.json`, `pages/organization.json` | missing-source | replace with existing staff webp or re-upload authoritative source |
| `/images/staff/wakasek-kurikulum.jpg` | `pages/organization.json`              | missing-source | request source or map to placeholder silhouette                    |
| `/images/staff/wakasek-kesiswaan.jpg` | `pages/organization.json`              | missing-source | request source or map to placeholder silhouette                    |
| `/images/staff/wakasek-sarpras.jpg`   | `pages/organization.json`              | missing-source | request source or map to placeholder silhouette                    |
| `/images/staff/wakasek-humas.jpg`     | `pages/organization.json`              | missing-source | request source or map to placeholder silhouette                    |
| `/images/staff/kepala-tu.jpg`         | `pages/organization.json`              | missing-source | request source or map to placeholder silhouette                    |

## Ownership Gap Decisions

- Do not import unresolved `missing-source` assets in Wave 2 production batch.
- Replace with either:
  - an owned-local equivalent,
  - a neutral managed placeholder,
  - or content-level removal with editorial sign-off.
- Do not keep external hotlinks for core UI media.

## Atomic Follow-Up Needed

- Missing-source resolution exceeds simple transform scope and should be tracked as its own implementation issue before #20 completion.

Proposed follow-up issue:

- `M9`: Resolve and ingest missing-source media/document pack for finance/news/alumni/organization references.
