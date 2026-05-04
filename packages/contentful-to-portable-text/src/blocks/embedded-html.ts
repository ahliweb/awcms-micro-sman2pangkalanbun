import type { ArbitraryTypedObject } from "@portabletext/types";

import type { ContentfulEntry } from "../types.js";

/** HTML is preserved verbatim — sanitization is the renderer's responsibility. */
export function transformEmbeddedHtml(entry: ContentfulEntry, key: string): ArbitraryTypedObject {
	const html = typeof entry.fields.customHtml === "string" ? entry.fields.customHtml : "";
	return {
		_type: "htmlBlock",
		_key: key,
		html,
	};
}
