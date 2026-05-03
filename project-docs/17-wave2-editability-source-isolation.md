# Wave 2 Admin Editability and Source Isolation Verification (M5 / #17)

This verification uses matrix evidence from `project-docs/29-wave2-verification-matrix.md` and runtime checks in the `demos/simple` environment.

## Environment

- Demo app: `demos/simple`
- Dev bypass used:
  - `/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin`
  - `/_emdash/api/auth/dev-bypass?redirect=/_emdash/admin`

## Editability Verification

### Draft -> Publish Workflow

- Created draft post in `posts` collection via API with `X-EmDash-Request: 1`.
- Published the same post via `/_emdash/api/content/posts/{id}/publish`.
- Publish response returned item status `published`.

Evidence:

- `/tmp/opencode/wave2-create-post-response.json`
- `/tmp/opencode/wave2-publish-post-response.json`

### Public Render Verification

- Verified the published post title and excerpt marker are visible on `/posts`.

Evidence:

- `/tmp/opencode/wave2-posts.html`

## Source Isolation Verification

- No legacy source imports detected in `demos/simple/src` for:
  - `src/data`
  - legacy repo paths
  - `smandapbun`
- Live content is configured through EmDash loader in `demos/simple/src/live.config.ts`.

Evidence:

- `demos/simple/src/live.config.ts`

## Route Health Verification

- Verified critical routes return HTTP 200:
  - `/`
  - `/posts`
  - `/pages/profil-sekolah`
  - `/pages/kontak`
  - `/pages/prestasi`
  - `/pages/profil-alumni`
  - `/pages/layanan`

Evidence:

- `/tmp/opencode/wave2-route-status.txt`

## Result

- #17 acceptance criteria for admin editability and source isolation: `met`.
