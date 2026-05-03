# Reference Audit - Legacy SMAN 2 Website

## Source Boundaries

Reference sources used:

- Public site: `https://awcms-smandapangkalanbun-web.pages.dev`
- Local legacy repo: `/home/data/dev_react/awcms-dev/awcms-public/smandapbun/`

Allowed reuse:

- UI/UX direction (visual style and information architecture)
- Text/content substance
- Media/assets (images/documents), subject to ownership and compliance checks

Explicitly not reused:

- Legacy architecture, runtime, scripts, deployment topology, and platform-specific logic

## Observed Information Architecture

Top-level sections identified from legacy navigation:

- Beranda
- Profil Sekolah
- Blog
- Keuangan
- Layanan
- Prestasi
- Profil Alumni
- Kontak

Nested profile and service pages are already structured and can map cleanly to EmDash collections + menus.

## Legacy Content Source Files

Primary structured content sources:

- `src/data/site.json`
- `src/data/navigation.json`
- `src/data/pages/profile.json`
- `src/data/pages/staff.json`
- `src/data/pages/services.json`
- `src/data/pages/organization.json`
- `src/data/pages/achievements.json`
- `src/data/pages/alumni.json`
- `src/data/pages/contact.json`
- `src/data/blogs/blogs.json`
- `src/data/blogs/finance.json`

Supplemental/asset source:

- `src/data/images.json` (contains many third-party image URLs)
- `public/images/**/*`
- `src/assets/foto-smandapbun/**/*`

## Asset Observations

- There is a substantial local image set in `.webp` (teachers, staff, hero/backgrounds, activity galleries).
- `images.json` includes Unsplash/Pexels links; these should be treated as external references, not assumed-owned assets.
- Several content records reference files that are not yet verified in this repo (example patterns like `/documents/*.pdf`).

### Current Inventory Snapshot

- `public/images/**/*`: 72 files total
  - `staff/*`: 55
  - `backgrounds/*`: 14
  - root logos/structure images: 3
- `src/assets/foto-smandapbun/**/*`: 113 local photo assets
- `src/assets/smandapbun-materi-web/*`: 7 files (PDF/DOCX/PNG)

### Referenced But Missing in Legacy Repo

Detected from structured JSON references:

- 25 referenced `/images/...` files do not exist in `public/images`.
- Missing groups include:
  - `/images/news/*.jpg` (news thumbnails)
  - `/images/alumni/*.jpg` (featured alumni portraits)
  - `/images/gallery/*.jpg` (gallery category thumbnails)
  - `/images/staff/*.jpg` (non-webp organization portraits)

## Data Quality Notes (for migration)

- Some IDs are duplicated in legacy JSON (example: repeated blog id values), so EmDash import should use deterministic new IDs/slugs as source-of-truth keys.
- Rich text is HTML strings in legacy files; migration should normalize into Portable Text blocks for long-term editing quality.
- Bilingual fields (`id` and `en`) are present in many records; this aligns with EmDash i18n model using locale rows.

## EmDash-First Mapping Direction

- Use EmDash collections and admin workflows as canonical source.
- Build menu trees in EmDash menu features, not static JSON.
- Upload and manage media via EmDash media system (local/S3/R2 abstraction).
- Keep front-end rendering bound to EmDash queries, not local data files.

## Immediate Migration Risks

- Copyright uncertainty for externally hosted imagery.
- Inconsistent field shapes across legacy files.
- Potential mismatch between old route slugs and new collection model.
- Broken media/document links if missing references are imported verbatim.

Mitigation: create a content contract and import staging workflow before full import.
