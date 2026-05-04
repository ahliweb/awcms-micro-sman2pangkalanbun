import type { ArbitraryTypedObject } from "@portabletext/types";

import type { ContentfulEntry } from "../types.js";

export function transformCodeBlock(entry: ContentfulEntry, key: string): ArbitraryTypedObject {
	const code = typeof entry.fields.code === "string" ? entry.fields.code : "";
	const language = typeof entry.fields.language === "string" ? entry.fields.language : "";
	return {
		_type: "code",
		_key: key,
		code,
		language,
	};
}
