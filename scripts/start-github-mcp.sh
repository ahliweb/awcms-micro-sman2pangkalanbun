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

# Resolve token
if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
	token="${GITHUB_PERSONAL_ACCESS_TOKEN}"
elif [ -n "${GITHUB_MCP_PERSONAL_ACCESS_TOKEN:-}" ]; then
	token="${GITHUB_MCP_PERSONAL_ACCESS_TOKEN}"
elif [ -n "${GH_TOKEN:-}" ]; then
	token="${GH_TOKEN}"
elif [ -n "${GITHUB_TOKEN:-}" ]; then
	token="${GITHUB_TOKEN}"
else
	echo "No GitHub token found in .env" >&2
	exit 1
fi

exec docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN="$token" ghcr.io/github/github-mcp-server stdio "$@"
