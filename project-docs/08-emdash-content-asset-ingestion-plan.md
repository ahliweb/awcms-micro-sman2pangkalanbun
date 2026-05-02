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

## Asset Rules

- Do not hotlink external Unsplash/Pexels URLs in production without explicit policy decision.
- Prefer fully managed media in EmDash storage.
- Keep file naming deterministic where possible and preserve attribution metadata when required.

## Verification Checklist

- Every migrated page is editable in EmDash admin.
- Every image shown in frontend exists in EmDash media library.
- Every public route resolves using EmDash-driven content.
- No dependency on legacy runtime code or scripts remains.

## Tooling Guidance

- Use EmDash CLI workflows for schema/content operations where available.
- Use atomic issues for each phase step and sub-step.
- Keep reversible, small imports per batch to simplify rollback.
