import type { ArbitraryTypedObject } from "@portabletext/types";

import { sanitizeUri } from "../sanitize.js";
import type { ContentfulEntry, ContentfulIncludes } from "../types.js";

export function transformImageBlock(
	entry: ContentfulEntry,
	includes: ContentfulIncludes,
	key: string,
): ArbitraryTypedObject {
	const fieldAsset = entry.fields.assetFile;
	let assetId: string | undefined;
	if (fieldAsset && typeof fieldAsset === "object") {
		const sys = "sys" in fieldAsset ? fieldAsset.sys : undefined;
		if (sys && typeof sys === "object" && "id" in sys && typeof sys.id === "string") {
			assetId = sys.id;
		}
	}
	const asset = assetId ? includes.assets.get(assetId) : undefined;

	const src = asset?.url ? (asset.url.startsWith("//") ? `https:${asset.url}` : asset.url) : "";

	const linkUrl =
		typeof entry.fields.linkUrl === "string" ? sanitizeUri(entry.fields.linkUrl) : undefined;
	const size = typeof entry.fields.size === "string" ? entry.fields.size : undefined;

	return {
		_type: "image",
		_key: key,
		asset: {
			src,
			alt: asset?.description ?? asset?.title ?? "",
			width: asset?.width,
			height: asset?.height,
		},
		linkUrl,
		size,
	};
}
