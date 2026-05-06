---
"emdash": patch
---

Fixes media file downloads to honor an explicit `name` query parameter when `dl=1`, so PDF downloads can keep a stable `.pdf` filename instead of a storage key.
