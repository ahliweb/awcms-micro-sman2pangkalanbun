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

### Required API Token Scope (for Worker routes)

When `wrangler deploy` updates custom-domain routing (`routes` in `wrangler.jsonc`),
the token must include zone-scoped route permissions in addition to Workers account permissions.

Minimum practical scope set for this project:

- Account permissions:
	- `Workers Scripts:Edit`
	- `D1:Edit` (if migrations/remote DB ops are part of deploy flow)
	- `Workers KV Storage:Edit` (if KV namespace operations are needed)
	- `R2:Edit` (if bucket/object operations are needed)
- Zone permissions (for `sman2pangkalanbun.sch.id`):
	- `Workers Routes:Edit`

Resource scoping:

- Account resources: include the account that owns worker `sman2pangkalanbunweb`.
- Zone resources: include `sman2pangkalanbun.sch.id`.

Without `Zone > Workers Routes:Edit` on the correct zone, route mutation can fail with auth errors (including Cloudflare error code `10000`).

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

Token and route validation commands:

```bash
# 1) Verify wrangler sees the token identity
pnpm exec wrangler whoami

# 2) Verify deploy including route mutation path
pnpm exec wrangler deploy --config wrangler.jsonc

# 3) Verify route binding exists for target domain
pnpm exec wrangler deployments list --config wrangler.jsonc
```

If deploy still reports an auth failure around `/zones/.../workers/routes`:

1. Confirm token belongs to the same Cloudflare account as the zone.
2. Confirm token includes `Zone > Workers Routes:Edit` for `sman2pangkalanbun.sch.id`.
3. Recreate token (same scopes) and retry in a fresh shell session.
4. Re-run the three commands above and archive output in project docs/issue thread.

## Current Blocker

Automation environment currently lacks valid Cloudflare auth. Observed failure:

- `wrangler whoami` returns "Not logged in" / token fetch failure

Tracked in:

- `#57` Cloudflare auth unblock

Once #57 is resolved, execute M13.1 (#54) and M13.2 (#55).

Also execute KV binding slice: #58.

## Current Deploy Result

- Worker successfully deployed on workers.dev:
	- `https://sman2pangkalanbunweb.ahliweb.workers.dev`
- Root response currently redirects to setup flow:
	- `302 -> /_emdash/admin/setup`
- Remaining domain binding permission gap is tracked in `#59`.
