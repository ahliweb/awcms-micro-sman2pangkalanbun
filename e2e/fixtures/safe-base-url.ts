export function parseSafeHttpBaseUrl(raw: string): URL {
	const parsed = new URL(raw);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Unsafe base URL protocol: ${parsed.protocol}`);
	}
	return parsed;
}

export function buildFromBase(base: URL, path: string): URL {
	if (!path.startsWith("/")) {
		throw new Error(`Path must start with '/': ${path}`);
	}
	return new URL(path, base);
}
