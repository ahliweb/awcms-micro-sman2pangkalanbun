# External BOS Handoff Packet (M11.1 / #50)

Use the text below as a copy-paste request to school administration to unblock #35 and #31.

## Packet: Request Email / Message

Subject: Request for Authoritative BOS PDF Files (TW1/TW2/TW3 2024) - Website Migration

Hello [Admin Owner Name/Team],

To complete finance attachment restoration for the school website migration, we need the authoritative BOS quarterly PDF files listed below.

Required files (exact filenames):
- `bos-tw1-2024.pdf`
- `bos-tw2-2024.pdf`
- `bos-tw3-2024.pdf`

Required metadata (include in your reply):
- Document owner/unit: [example: Administration / Finance]
- Handoff date: [YYYY-MM-DD]
- Delivery channel used: [e.g., secure drive, encrypted transfer, direct handoff]

Delivery requirements:
- File type must be real PDF binary files (header `%PDF`), not links or HTML pages.
- Please do not rename the files; keep exact filenames above.
- If delivered via link, ensure raw downloadable files are provided (not viewer pages).

Target delivery date:
- [YYYY-MM-DD, HH:MM, timezone]

Send files to:
- [Owner name/contact + approved secure destination]

Why this is needed:
- These files are required to restore BOS attachments in finance reports and close migration blockers (`#35` -> `#31`).

Thank you.

## Packet: Receiver Acknowledgment Template

Subject: BOS File Handoff Received - Verification Start

Received from: [owner/unit]
Received at: [YYYY-MM-DD HH:MM timezone]
Channel: [channel]

Files received:
- [ ] `bos-tw1-2024.pdf`
- [ ] `bos-tw2-2024.pdf`
- [ ] `bos-tw3-2024.pdf`

Initial checks:
- [ ] all three filenames match exactly
- [ ] each file opens as PDF
- [ ] migration intake verification started

Next actions:
1. Run `node scripts/migration/verify-bos-intake.mjs`
2. Run `node scripts/migration/restore-bos-mappings.mjs`
3. Attach generated artifacts to #31 and close if all checks pass

## Acceptance Reminder (for internal operator)

- `project-docs/migration/bos-intake-manifest.json` has `ok: true`
- `project-docs/migration/bos-restoration-closure.json` has:
	- `updatedEntries: 3`
	- `afterUnresolvedCount: 0`
	- `status: "ready_to_close"`
