/**
 * SEO Handlers
 *
 * Business logic for sitemap generation and robots.txt.
 */

import { sql, type Kysely } from "kysely";

import type { Database } from "../../database/types.js";
import { validateIdentifier } from "../../database/validate.js";
import type { ApiResult } from "../types.js";

/** Raw content data for sitemap generation — the route builds the actual URLs */
export interface SitemapContentEntry {
	/** Collection slug (e.g., "post", "page") */
	collection: string;
	/** Content slug or ID */
	identifier: string;
	/** ISO date of last modification */
	updatedAt: string;
}

export interface SitemapDataResponse {
	entries: SitemapContentEntry[];
}

/** Maximum entries per sitemap (per spec) */
const SITEMAP_MAX_ENTRIES = 50_000;

/**
 * Collect all published, indexable content across SEO-enabled collections
 * for sitemap generation.
 *
 * Only includes content from collections with `has_seo = 1`.
 * Excludes content with `seo_no_index = 1` in the `_emdash_seo` table.
 *
 * Returns raw data (collection + identifier + date). The caller (route)
 * is responsible for building absolute URLs — this handler does NOT
 * assume a URL structure.
 */
export async function handleSitemapData(
	db: Kysely<Database>,
): Promise<ApiResult<SitemapDataResponse>> {
	try {
		// Find all SEO-enabled collections
		const collections = await db
			.selectFrom("_emdash_collections")
			.select(["slug"])
			.where("has_seo", "=", 1)
			.execute();

		const entries: SitemapContentEntry[] = [];

		for (const col of collections) {
			if (entries.length >= SITEMAP_MAX_ENTRIES) break;

			// Validate the slug before using it as a table name identifier.
			// Should always pass (slugs are validated on creation), but
			// guards against corrupted DB data.
			try {
				validateIdentifier(col.slug, "collection slug");
			} catch {
				console.warn(`[SITEMAP] Skipping collection with invalid slug: ${col.slug}`);
				continue;
			}

			const tableName = `ec_${col.slug}`;
			const remaining = SITEMAP_MAX_ENTRIES - entries.length;

			// Query published, non-deleted content.
			// LEFT JOIN _emdash_seo to check noindex flag.
			// Content without an SEO row is assumed indexable (default).
			// Wrapped in try/catch so a missing/broken table doesn't fail the
			// entire sitemap — we skip that collection and continue.
			try {
				const rows = await sql<{
					slug: string | null;
					id: string;
					updated_at: string;
				}>`
					SELECT c.slug, c.id, c.updated_at
					FROM ${sql.ref(tableName)} c
					LEFT JOIN _emdash_seo s
						ON s.collection = ${col.slug}
						AND s.content_id = c.id
					WHERE c.status = 'published'
					AND c.deleted_at IS NULL
					AND (s.seo_no_index IS NULL OR s.seo_no_index = 0)
					ORDER BY c.updated_at DESC
					LIMIT ${remaining}
				`.execute(db);

				for (const row of rows.rows) {
					entries.push({
						collection: col.slug,
						identifier: row.slug || row.id,
						updatedAt: row.updated_at,
					});
				}
			} catch (err) {
				// Table missing or query error — skip this collection
				console.warn(`[SITEMAP] Failed to query collection "${col.slug}":`, err);
				continue;
			}
		}

		return { success: true, data: { entries } };
	} catch (error) {
		console.error("[SITEMAP_ERROR]", error);
		return {
			success: false,
			error: { code: "SITEMAP_ERROR", message: "Failed to generate sitemap data" },
		};
	}
}
