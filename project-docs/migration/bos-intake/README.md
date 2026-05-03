# BOS Intake Drop Zone

Place authoritative BOS PDFs in this directory before running the restoration flow.

Required filenames (exact):

- `bos-tw1-2024.pdf`
- `bos-tw2-2024.pdf`
- `bos-tw3-2024.pdf`

Then run:

```bash
node scripts/migration/verify-bos-intake.mjs
node scripts/migration/restore-bos-mappings.mjs
```

If verification passes, upload the PDFs to the R2 bucket `sman2pangkalanbunweb`, capture keys/checksums, and attach closure artifacts to issue #31.
