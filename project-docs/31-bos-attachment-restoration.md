# BOS Attachment Restoration Status (M10 / #31)

This status tracks restoration of BOS TW1/TW2/TW3 finance attachments.

## Current Outcome

- Automated fetch attempts to legacy URLs returned HTML fallback pages (HTTP 200) rather than valid PDFs.
- Result: authoritative BOS files are still unavailable for managed import.

## Verification Evidence

- URL probes attempted:
	- `https://awcms-smandapangkalanbun-web.pages.dev/documents/bos-tw1-2024.pdf`
	- `https://awcms-smandapangkalanbun-web.pages.dev/documents/bos-tw2-2024.pdf`
	- `https://awcms-smandapangkalanbun-web.pages.dev/documents/bos-tw3-2024.pdf`
- File inspection showed `HTML document` instead of `%PDF` header.

## Required External Inputs

- School administration must provide authoritative BOS documents:
	- `bos-tw1-2024.pdf`
	- `bos-tw2-2024.pdf`
	- `bos-tw3-2024.pdf`

## Import Readiness Checklist

1. Place authoritative PDFs into managed source path.
2. Record SHA-256 checksums.
3. Update `project-docs/migration/missing-source-resolution.json` replacements.
4. Regenerate transforms and run reference validator.

## Interim Cutover Posture

- Finance report attachment rows remain omitted in initial Wave 2 batch.
- This is a known quality gap tracked by #31 and should be called out in cutover go/no-go.
