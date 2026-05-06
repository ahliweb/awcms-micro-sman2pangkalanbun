---
"emdash": patch
---

Fixes plugin API route resilience by returning standardized API errors when plugin route metadata lookup or execution fails instead of surfacing unhandled 500s.

Updates WebSite JSON-LD so publisher logo is emitted on the homepage only, while non-home pages rely on post/page SEO metadata.
