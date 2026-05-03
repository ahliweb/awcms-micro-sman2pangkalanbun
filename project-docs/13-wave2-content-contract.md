# Wave 2 Content Contract Lock (M1 / #13)

This document freezes the legacy-to-EmDash mapping contract for the first migration pass.

## Contract Version

- Version: `v1.0`
- Status: `locked-for-wave2-import`
- Effective for: issues #13, #16, #21

## Source Inventory in Scope

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
- `src/data/images.json`

## Canonical EmDash Targets

- `pages`
- `news`
- `announcements`
- `events`
- `finance_reports`
- `staff_profiles`
- `achievements`
- `service_items`
- `galleries`
- menus: `primary`, `footer`, `social`
- site settings: organization metadata and contacts

## Locale Policy (`id` / `en`)

- Legacy bilingual nodes map to two rows in the same `translation_group`:
  - `id` -> row with `locale = "id"`
  - `en` -> row with `locale = "en"`
- If `en` is missing, generate only `id` row and leave no synthetic translation.
- If a field is not bilingual in source, copy identical value into both locales only when field is non-editorial metadata (example: phone).

## Slug and Identity Policy

- Ignore legacy `id` as primary key for EmDash content IDs.
- Preserve legacy `slug` where valid and unique per locale.
- If duplicate slug in same locale:
  - Keep first record slug unchanged.
  - Suffix next records with deterministic `-2`, `-3`, ... based on stable source order.
- `translation_group` key seed: `sha1(source_file + ":" + legacy_record_anchor)`.

## Mapping Matrix

| Source | Legacy node | Target | Mapping rule |
| --- | --- | --- | --- |
| `site.json` | `site`, `stats`, `headmaster` | site settings + `pages` (`profil-sekolah`) | Organization metadata goes to settings; narrative summary goes to page body blocks. |
| `navigation.json` | `mainMenu` tree | EmDash menus (`primary`) | Keep hierarchy depth and labels; preserve hrefs where routed in EmDash, mark unresolved routes as placeholders. |
| `pages/profile.json` | profile sections | `pages` | Each top-level node maps to one page; HTML `content` mapped to Portable Text. |
| `pages/staff.json` | `teachingStaff.staff`, `adminStaff.staff` | `staff_profiles` + `pages` index | Staff cards normalized to collection rows; page intro text remains in `pages`. |
| `pages/services.json` | service nodes, labs, activities | `service_items` + `pages` | Structured arrays become JSON fields in `service_items`; long HTML blocks to Portable Text. |
| `pages/organization.json` | organization nodes | `pages` | Keep sections per slug path; position arrays stay structured JSON fields. |
| `pages/achievements.json` | `achievements[]` | `achievements` | One row per achievement entry; year kept as sortable integer/string. |
| `pages/alumni.json` | featured alumni and stats | `pages` + optional `staff_profiles` extension | Wave 2 stores alumni as page-embedded structured JSON; later extraction optional. |
| `pages/contact.json` | contact info, social links, map | site settings + `pages` | Operational contacts to settings; map/socials also retained in contact page payload. |
| `blogs/blogs.json` | `blogs[]`, `schoolInfo`, `agenda`, `gallery` | `news`, `announcements`, `events`, `galleries` | News posts map to `news`; schedule list to `events`; gallery categories to `galleries`. |
| `blogs/finance.json` | `bos`, `apbd`, `committee` | `finance_reports` | Each finance section imported as separate finance record with attachments list. |
| `images.json` | external image pools | `galleries` seed references only | Classified as `external-third-party`; not hotlinked in production import. |

## Field-Level Normalization Rules

- HTML fields (`content.id`, `content.en`) -> Portable Text blocks.
- Dates:
  - ISO date strings (example `2024-04-15`) -> datetime/date field.
  - Non-ISO periods remain string metadata.
- Booleans and numerics are preserved as native types where explicit in source.
- Arrays of simple objects stay JSON-typed fields when they are not standalone content entities.

## Nullable/Missing Fallback Policy

- Missing optional text -> `null` (not empty string).
- Missing optional arrays -> `[]`.
- Missing media references -> keep unresolved token and classify under #14.
- Missing required bilingual value in one locale:
  - keep available locale,
  - register missing counterpart in transform diagnostics.

## Out-of-Scope for This Contract Version

- Full extraction of every nested array into standalone collections.
- Advanced relation graphs between `news`, `events`, and `galleries`.
- Auto-translation generation for missing English copy.

## Validation Checklist

- Every source file above has a declared target.
- Every content-bearing node has a deterministic mapping rule.
- Fallback rules are explicit for null/missing/media gaps.
- Locale policy is fixed for `id` and `en`.

## Known Exceptions Registered

- Duplicate legacy blog ID values exist (`blog-001` reused); importer must not trust legacy IDs.
- Several media/document paths are missing from legacy repo and are tracked under #14.
