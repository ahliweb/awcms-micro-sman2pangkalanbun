#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env from this repo
if [ -f "$REPO_ROOT/.env" ]; then
	set -a
	source "$REPO_ROOT/.env"
	set +a
fi

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
	echo "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in .env" >&2
	exit 1
fi

exec npx -y @cloudflare/mcp-server-cloudflare run "$CLOUDFLARE_ACCOUNT_ID"
