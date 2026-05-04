/**
 * Public menu endpoint - no authentication required
 *
 * GET /_emdash/api/public/menus/:name - Get menu with resolved URLs
 *
 * Used by client-side scripts to fetch fresh menu data without
 * requiring authentication. Enables dynamic footer/header menus
 * that update immediately when changed in the admin panel,
 * even when pages are cached at the edge.
 */

import type { APIRoute } from "astro";

import { apiError, apiSuccess } from "#api/error.js";
import { getMenuWithDb } from "#menus/index.js";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
	const { emdash } = locals;
	const name = params.name;

	if (!name) {
		return apiError("BAD_REQUEST", "Menu name is required", 400);
	}

	if (!emdash?.db) {
		return apiError("NOT_CONFIGURED", "EmDash is not initialized", 500);
	}

	try {
		const menu = await getMenuWithDb(name, emdash.db);

		if (!menu) {
			return apiError("NOT_FOUND", `Menu '${name}' not found`, 404);
		}

		return apiSuccess(menu);
	} catch (error) {
		return apiError(
			"MENU_GET_ERROR",
			"Failed to fetch menu",
			500,
		);
	}
};
