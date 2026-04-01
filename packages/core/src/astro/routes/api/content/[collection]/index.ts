/**
 * Content list and create endpoints - injected by EmDash integration
 *
 * GET  /_emdash/api/content/{collection} - List content
 * POST /_emdash/api/content/{collection} - Create content
 */

import type { APIRoute } from "astro";

import { requirePerm } from "#api/authorize.js";
import { apiError, unwrapResult } from "#api/error.js";
import { parseBody, parseQuery, isParseError } from "#api/parse.js";
import { contentListQuery, contentCreateBody } from "#api/schemas.js";

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
	const { emdash, user } = locals;
	const denied = requirePerm(user, "content:read");
	if (denied) return denied;
	const collection = params.collection!;
	const query = parseQuery(url, contentListQuery);
	if (isParseError(query)) return query;

	if (!emdash?.handleContentList) {
		return apiError("NOT_CONFIGURED", "EmDash is not initialized", 500);
	}

	const result = await emdash.handleContentList(collection, query);

	return unwrapResult(result);
};

export const POST: APIRoute = async ({ params, request, locals, cache }) => {
	const { emdash, user } = locals;
	const denied = requirePerm(user, "content:create");
	if (denied) return denied;
	const collection = params.collection!;
	const body = await parseBody(request, contentCreateBody);
	if (isParseError(body)) return body;

	if (!emdash?.handleContentCreate) {
		return apiError("NOT_CONFIGURED", "EmDash is not initialized", 500);
	}

	// Auto-set authorId to current user when creating content
	const result = await emdash.handleContentCreate(collection, {
		...body,
		authorId: user?.id,
		locale: body.locale,
		translationOf: body.translationOf,
	});

	if (!result.success) return unwrapResult(result);

	if (cache.enabled) await cache.invalidate({ tags: [collection] });

	return unwrapResult(result, 201);
};
