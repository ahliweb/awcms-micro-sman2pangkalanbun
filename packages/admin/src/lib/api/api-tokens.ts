/**
 * API token management client functions
 */

import { API_BASE, apiFetch, parseApiResponse, throwResponseError } from "./client.js";

// =============================================================================
// Types
// =============================================================================

/** API token info returned from the server */
export interface ApiTokenInfo {
	id: string;
	name: string;
	prefix: string;
	scopes: string[];
	userId: string;
	expiresAt: string | null;
	lastUsedAt: string | null;
	createdAt: string;
}

/** Result from creating a new token */
export interface ApiTokenCreateResult {
	/** Raw token — shown once, never stored */
	token: string;
	/** Token metadata */
	info: ApiTokenInfo;
}

/** Input for creating a new token */
export interface CreateApiTokenInput {
	name: string;
	scopes: string[];
	expiresAt?: string;
}

/** Available scopes for API tokens */
export const API_TOKEN_SCOPES = [
	{ value: "content:read", label: "Content Read", description: "Read content entries" },
	{ value: "content:write", label: "Content Write", description: "Create, update, delete content" },
	{ value: "media:read", label: "Media Read", description: "Read media files" },
	{ value: "media:write", label: "Media Write", description: "Upload and delete media" },
	{ value: "schema:read", label: "Schema Read", description: "Read collection schemas" },
	{ value: "schema:write", label: "Schema Write", description: "Modify collection schemas" },
	{ value: "admin", label: "Admin", description: "Full admin access" },
] as const;

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch all API tokens for the current user
 */
export async function fetchApiTokens(): Promise<ApiTokenInfo[]> {
	const response = await apiFetch(`${API_BASE}/admin/api-tokens`);
	const result = await parseApiResponse<{ items: ApiTokenInfo[] }>(
		response,
		"Failed to fetch API tokens",
	);
	return result.items;
}

/**
 * Create a new API token
 */
export async function createApiToken(input: CreateApiTokenInput): Promise<ApiTokenCreateResult> {
	const response = await apiFetch(`${API_BASE}/admin/api-tokens`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	return parseApiResponse<ApiTokenCreateResult>(response, "Failed to create API token");
}

/**
 * Revoke (delete) an API token
 */
export async function revokeApiToken(id: string): Promise<void> {
	const response = await apiFetch(`${API_BASE}/admin/api-tokens/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) await throwResponseError(response, "Failed to revoke API token");
}
