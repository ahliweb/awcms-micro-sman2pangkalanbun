# Cloudflare Production-Test Setup (M13)

This runbook configures a production-like environment for the SMAN 2 Pangkalanbun deployment target.

## Target Naming

- Domain: `sman2pangkalanbun.sch.id`
- R2 bucket: `sman2pangkalanbunweb`
- Prefix for service resources: `sman2pangkalanbunweb`

## Required Cloudflare Services

- Workers (application runtime)
- D1 (content/auth database)
- R2 (media and BOS PDF objects)
- KV (Astro session binding `SESSION`)
- DNS/Route for custom domain

## Config Changes Applied

- `demos/cloudflare/wrangler.jsonc`
	- Worker name: `sman2pangkalanbunweb`
	- D1 database name: `sman2pangkalanbunweb`
	- D1 database id: `24247c48-0dd9-472f-9d55-3098da8d799e`
	- R2 bucket name: `sman2pangkalanbunweb`
	- KV binding `SESSION`:
		- id: `b40b1549d5ed4cd289fb68292252bfae`
		- preview_id: `37a3ede4864d4914aa136239640269b0`
- `demos/cloudflare/astro.config.mjs`
	- removed demo-specific Cloudflare Access dependency for portability
- `demos/cloudflare/package.json`
	- updated D1 create script to `sman2pangkalanbunweb`

## Required Secrets/Env

Set via wrangler secret/vars in deployment environment:

- `CF_MEDIA_ACCOUNT_ID` (Cloudflare account ID for Images/Stream provider)
- `CF_MEDIA_API_TOKEN` (API token with Images/Stream/R2 rights if used)

Optional, if using direct worker deployment with wrangler:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Provisioning Commands

Run from `demos/cloudflare` after auth is available:

```bash
pnpm exec wrangler whoami
pnpm exec wrangler kv namespace create sman2pangkalanbunweb-session
pnpm exec wrangler r2 bucket create sman2pangkalanbunweb
pnpm exec wrangler d1 create sman2pangkalanbunweb
pnpm exec wrangler deploy
```

After KV creation, add the returned namespace ID to `wrangler.jsonc` as binding `SESSION`.

If route binding is not auto-applied by deploy, create/update route explicitly:

```bash
pnpm exec wrangler deploy --config wrangler.jsonc
```

## Validation Checklist

1. Worker deployed: `sman2pangkalanbunweb`
2. D1 binding `DB` resolves at runtime
3. R2 binding `MEDIA` resolves at runtime
4. KV binding `SESSION` resolves at runtime
5. workers.dev URL responds: `https://sman2pangkalanbunweb.ahliweb.workers.dev`
6. (pending) custom domain `https://sman2pangkalanbun.sch.id` responds with TLS valid certificate
7. Admin route loads on target host: `/_emdash/admin`

## Current Blocker

Automation environment currently lacks valid Cloudflare auth. Observed failure:

- `wrangler whoami` returns "Not logged in" / token fetch failure

Tracked in:

- `#57` Cloudflare auth unblock

Once #57 is resolved, execute M13.1 (#54), M13.2 (#55), and R2 upload flow (#51).

Also execute KV binding slice: #58.

## Current Deploy Result

- Worker successfully deployed on workers.dev:
	- `https://sman2pangkalanbunweb.ahliweb.workers.dev`
- Root response currently redirects to setup flow:
	- `302 -> /_emdash/admin/setup`
- Remaining domain binding permission gap is tracked in `#59`.
