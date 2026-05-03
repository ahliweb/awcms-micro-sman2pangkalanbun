export const prerender = false;

import type { APIRoute } from "astro";
import { publicSearch } from "../../utils/public-search";

export const GET: APIRoute = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim() ?? "";
	const type = url.searchParams.get("type")?.trim() ?? "all";
	const year = url.searchParams.get("year")?.trim() ?? "";
	const category = url.searchParams.get("category")?.trim() ?? "";

	if (!q) {
		return Response.json({ success: true, data: { items: [] } });
	}

	const items = await publicSearch({ q, type, year, category });
	return Response.json({ success: true, data: { items } });
};
