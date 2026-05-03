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
	- R2 bucket name: `sman2pangkalanbunweb`
	- Custom route pattern: `sman2pangkalanbun.sch.id`
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
5. `https://sman2pangkalanbun.sch.id` responds with TLS valid certificate
6. Admin route loads: `https://sman2pangkalanbun.sch.id/_emdash/admin`

## Current Blocker

Automation environment currently lacks valid Cloudflare auth. Observed failure:

- `wrangler whoami` returns "Not logged in" / token fetch failure

Tracked in:

- `#57` Cloudflare auth unblock

Once #57 is resolved, execute M13.1 (#54), M13.2 (#55), and R2 upload flow (#51).

Also execute KV binding slice: #58.
