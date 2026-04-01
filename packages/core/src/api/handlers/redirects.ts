/**
 * Redirect CRUD and 404 log handlers
 */

import type { Kysely } from "kysely";

import {
	RedirectRepository,
	type Redirect,
	type NotFoundEntry,
	type NotFoundSummary,
} from "../../database/repositories/redirect.js";
import type { FindManyResult } from "../../database/repositories/types.js";
import type { Database } from "../../database/types.js";
import { validatePattern, validateDestinationParams, isPattern } from "../../redirects/patterns.js";
import type { ApiResult } from "../types.js";

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

/**
 * List redirects with cursor pagination and optional filters
 */
export async function handleRedirectList(
	db: Kysely<Database>,
	params: {
		cursor?: string;
		limit?: number;
		search?: string;
		group?: string;
		enabled?: boolean;
		auto?: boolean;
	},
): Promise<ApiResult<FindManyResult<Redirect>>> {
	try {
		const repo = new RedirectRepository(db);
		const result = await repo.findMany(params);
		return { success: true, data: result };
	} catch {
		return {
			success: false,
			error: { code: "REDIRECT_LIST_ERROR", message: "Failed to fetch redirects" },
		};
	}
}

/**
 * Create a redirect rule
 */
export async function handleRedirectCreate(
	db: Kysely<Database>,
	input: {
		source: string;
		destination: string;
		type?: number;
		enabled?: boolean;
		groupName?: string | null;
	},
): Promise<ApiResult<Redirect>> {
	try {
		const repo = new RedirectRepository(db);

		// Source and destination must differ
		if (input.source === input.destination) {
			return {
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Source and destination must be different",
				},
			};
		}

		// If source looks like a pattern, validate it
		const sourceIsPattern = isPattern(input.source);
		if (sourceIsPattern) {
			const patternError = validatePattern(input.source);
			if (patternError) {
				return {
					success: false,
					error: { code: "VALIDATION_ERROR", message: `Invalid source pattern: ${patternError}` },
				};
			}

			// Validate destination params reference valid source params
			const destError = validateDestinationParams(input.source, input.destination);
			if (destError) {
				return {
					success: false,
					error: { code: "VALIDATION_ERROR", message: destError },
				};
			}
		}

		// Check for duplicate source (exact match only for non-patterns)
		const existing = await repo.findBySource(input.source);
		if (existing) {
			return {
				success: false,
				error: {
					code: "CONFLICT",
					message: `A redirect from "${input.source}" already exists`,
				},
			};
		}

		const redirect = await repo.create({
			source: input.source,
			destination: input.destination,
			type: input.type ?? 301,
			isPattern: sourceIsPattern,
			enabled: input.enabled ?? true,
			groupName: input.groupName ?? null,
		});

		return { success: true, data: redirect };
	} catch {
		return {
			success: false,
			error: { code: "REDIRECT_CREATE_ERROR", message: "Failed to create redirect" },
		};
	}
}

/**
 * Get a redirect by ID
 */
export async function handleRedirectGet(
	db: Kysely<Database>,
	id: string,
): Promise<ApiResult<Redirect>> {
	try {
		const repo = new RedirectRepository(db);
		const redirect = await repo.findById(id);

		if (!redirect) {
			return {
				success: false,
				error: { code: "NOT_FOUND", message: `Redirect "${id}" not found` },
			};
		}

		return { success: true, data: redirect };
	} catch {
		return {
			success: false,
			error: { code: "REDIRECT_GET_ERROR", message: "Failed to fetch redirect" },
		};
	}
}

/**
 * Update a redirect by ID
 */
export async function handleRedirectUpdate(
	db: Kysely<Database>,
	id: string,
	input: {
		source?: string;
		destination?: string;
		type?: number;
		enabled?: boolean;
		groupName?: string | null;
	},
): Promise<ApiResult<Redirect>> {
	try {
		const repo = new RedirectRepository(db);

		const existing = await repo.findById(id);
		if (!existing) {
			return {
				success: false,
				error: { code: "NOT_FOUND", message: `Redirect "${id}" not found` },
			};
		}

		const newSource = input.source ?? existing.source;
		const newDest = input.destination ?? existing.destination;

		// Source and destination must differ
		if (newSource === newDest) {
			return {
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Source and destination must be different",
				},
			};
		}

		// If source is changing, validate patterns
		if (input.source !== undefined) {
			const sourceIsPattern = isPattern(input.source);
			if (sourceIsPattern) {
				const patternError = validatePattern(input.source);
				if (patternError) {
					return {
						success: false,
						error: {
							code: "VALIDATION_ERROR",
							message: `Invalid source pattern: ${patternError}`,
						},
					};
				}
			}

			// Check for duplicate source (exclude self)
			const dup = await repo.findBySource(input.source);
			if (dup && dup.id !== id) {
				return {
					success: false,
					error: {
						code: "CONFLICT",
						message: `A redirect from "${input.source}" already exists`,
					},
				};
			}
		}

		// Validate destination params against the (possibly updated) source
		if (isPattern(newSource)) {
			const destError = validateDestinationParams(newSource, newDest);
			if (destError) {
				return {
					success: false,
					error: { code: "VALIDATION_ERROR", message: destError },
				};
			}
		}

		const updated = await repo.update(id, {
			source: input.source,
			destination: input.destination,
			type: input.type,
			enabled: input.enabled,
			groupName: input.groupName,
		});

		if (!updated) {
			return {
				success: false,
				error: { code: "REDIRECT_UPDATE_ERROR", message: "Failed to update redirect" },
			};
		}

		return { success: true, data: updated };
	} catch {
		return {
			success: false,
			error: { code: "REDIRECT_UPDATE_ERROR", message: "Failed to update redirect" },
		};
	}
}

/**
 * Delete a redirect by ID
 */
export async function handleRedirectDelete(
	db: Kysely<Database>,
	id: string,
): Promise<ApiResult<{ deleted: true }>> {
	try {
		const repo = new RedirectRepository(db);
		const deleted = await repo.delete(id);

		if (!deleted) {
			return {
				success: false,
				error: { code: "NOT_FOUND", message: `Redirect "${id}" not found` },
			};
		}

		return { success: true, data: { deleted: true } };
	} catch {
		return {
			success: false,
			error: { code: "REDIRECT_DELETE_ERROR", message: "Failed to delete redirect" },
		};
	}
}

// ---------------------------------------------------------------------------
// 404 Log
// ---------------------------------------------------------------------------

/**
 * List 404 log entries with cursor pagination
 */
export async function handleNotFoundList(
	db: Kysely<Database>,
	params: { cursor?: string; limit?: number; search?: string },
): Promise<ApiResult<FindManyResult<NotFoundEntry>>> {
	try {
		const repo = new RedirectRepository(db);
		const result = await repo.find404s(params);
		return { success: true, data: result };
	} catch {
		return {
			success: false,
			error: { code: "NOT_FOUND_LIST_ERROR", message: "Failed to fetch 404 log" },
		};
	}
}

/**
 * Get 404 summary (grouped by path, sorted by count)
 */
export async function handleNotFoundSummary(
	db: Kysely<Database>,
	limit?: number,
): Promise<ApiResult<{ items: NotFoundSummary[] }>> {
	try {
		const repo = new RedirectRepository(db);
		const items = await repo.get404Summary(limit);
		return { success: true, data: { items } };
	} catch {
		return {
			success: false,
			error: { code: "NOT_FOUND_SUMMARY_ERROR", message: "Failed to fetch 404 summary" },
		};
	}
}

/**
 * Clear all 404 log entries
 */
export async function handleNotFoundClear(
	db: Kysely<Database>,
): Promise<ApiResult<{ deleted: number }>> {
	try {
		const repo = new RedirectRepository(db);
		const deleted = await repo.clear404s();
		return { success: true, data: { deleted } };
	} catch {
		return {
			success: false,
			error: { code: "NOT_FOUND_CLEAR_ERROR", message: "Failed to clear 404 log" },
		};
	}
}

/**
 * Prune 404 log entries older than a given date
 */
export async function handleNotFoundPrune(
	db: Kysely<Database>,
	olderThan: string,
): Promise<ApiResult<{ deleted: number }>> {
	try {
		const repo = new RedirectRepository(db);
		const deleted = await repo.prune404s(olderThan);
		return { success: true, data: { deleted } };
	} catch {
		return {
			success: false,
			error: { code: "NOT_FOUND_PRUNE_ERROR", message: "Failed to prune 404 log" },
		};
	}
}
