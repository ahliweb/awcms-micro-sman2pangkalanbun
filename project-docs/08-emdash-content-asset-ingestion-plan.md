# EmDash Content and Asset Ingestion Plan

## Objective

Ingest legacy website content/assets into EmDash so all ongoing management happens through EmDash admin and frontend in this repository.

## Canonical Target in This Repo

- Content: EmDash collections (database-backed)
- Navigation: EmDash menus
- Settings/profile metadata: EmDash site settings + dedicated collections where needed
- Media: EmDash media storage abstraction

## Proposed Collection Model

- `pages` - static/public informational pages (profile, contact, alumni, etc.)
- `news` - blog/news posts
- `announcements` - short notices
- `events` - school agenda/calendar entries
- `finance_reports` - BOS/APBD/Komite transparency content + attachments
- `staff_profiles` - teacher/admin staff cards
- `achievements` - achievements and awards
- `service_items` - school services/extracurricular/labs/library info
- `galleries` - gallery sets and media references

## Migration Phases (Atomic)

1. **Contract Phase**
   - Define field schema for each target collection.
   - Decide locale strategy (`id` and optional `en`).
   - Freeze slug rules and URL policy.

2. **Asset Intake Phase**
   - Build source inventory of local files from legacy repo.
   - Classify assets: owned/local vs external/third-party.
   - Import owned assets into EmDash media and capture new references.

3. **Content Transform Phase**
   - Convert legacy JSON records into EmDash import format.
   - Normalize HTML to Portable Text where practical.
   - Validate internal links and media references.

4. **Seed/Import Phase**
   - Run schema seed/create steps.
   - Execute content import in batches by collection.
   - Verify admin editability for imported records.

5. **Frontend Binding Phase**
   - Replace static data usage with EmDash queries.
   - Render menu/content/media from EmDash APIs.
   - Verify routing parity with legacy public URL structure.

6. **QA and Cutover Phase**
   - Validate visual parity for core pages.
   - Check SEO/meta and critical user journeys.
   - Finalize redirect strategy if slug changes occur.

## Atomic Execution Backlog (Preparation)

1. **Legacy content contract lock**
   - Freeze canonical field mappings for each target EmDash collection.
   - Record legacy-to-EmDash mapping table (source file -> collection -> field).
   - Define fallback behavior for nullable/missing legacy values.

2. **Owned vs external asset classification**
   - Tag every referenced asset as one of: `owned-local`, `external-third-party`, `missing-source`.
   - Reject hotlinked Unsplash/Pexels URLs for production unless policy exception is approved.
   - Produce a missing-asset resolution list (replace, request source, or drop).

3. **Media import manifest generation**
   - Build deterministic manifest (source path, checksum, target media key, alt seed text).
   - Batch manifests by domain (`staff`, `backgrounds`, `gallery`, `documents`).
   - Verify idempotency (re-running does not duplicate media).

4. **Content transform and locale split**
   - Convert bilingual `id/en` fields into locale rows.
   - Normalize HTML-rich fields to Portable Text-compatible structures.
   - Resolve route slugs and parent-child relations for profile/service trees.

5. **Admin-editability verification**
   - Verify imported records are editable in EmDash admin.
   - Verify media entries are reusable from admin UI.
   - Validate no frontend rendering path depends on legacy JSON files.

## Asset Rules

- Do not hotlink external Unsplash/Pexels URLs in production without explicit policy decision.
- Prefer fully managed media in EmDash storage.
- Keep file naming deterministic where possible and preserve attribution metadata when required.

## Known Source Gaps to Resolve Before Cutover

- Legacy JSON references include missing files in `/images/news/*`, `/images/alumni/*`, `/images/gallery/*`, and `/images/staff/*`.
- Legacy finance JSON references `/documents/bos-tw1-2024.pdf`, `/documents/bos-tw2-2024.pdf`, `/documents/bos-tw3-2024.pdf` that are not present in the legacy repo path.
- These references must be replaced with imported EmDash media IDs/URLs or intentionally removed.

## Verification Checklist

- Every migrated page is editable in EmDash admin.
- Every image shown in frontend exists in EmDash media library.
- Every public route resolves using EmDash-driven content.
- No dependency on legacy runtime code or scripts remains.

## Tooling Guidance

- Use EmDash CLI workflows for schema/content operations where available.
- Use atomic issues for each phase step and sub-step.
- Keep reversible, small imports per batch to simplify rollback.
