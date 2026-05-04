/**
 * Serve uploaded media files
 *
 * GET /_emdash/api/media/file/:key - Serve file from storage
 */

import type { APIRoute } from "astro";

import { apiError, handleError } from "#api/error.js";

export const prerender = false;

/**
 * Content types that are safe to display inline (images, video, audio, PDF).
 * Everything else gets Content-Disposition: attachment to prevent script execution.
 * PDFs are included because browser built-in viewers sandbox JS and in-iframe
 * rendering requires inline disposition.
 */
const SAFE_INLINE_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/x-icon",
	"video/mp4",
	"video/webm",
	"audio/mpeg",
	"audio/wav",
	"audio/ogg",
	"application/pdf",
]);

const CRLF_RE = /[\r\n]/g;
const SLASH_RE = /[\\/]/g;
const QUOTE_RE = /"/g;

function getDownloadFilename(key: string, requestedName: string | null): string {
	const raw = (requestedName ?? "").trim();
	if (!raw) {
		return key.includes("/") ? key.slice(key.lastIndexOf("/") + 1) : key;
	}

	const normalized = raw
		.replace(CRLF_RE, "")
		.replace(SLASH_RE, "-")
		.replace(QUOTE_RE, "")
		.trim();

	if (!normalized) {
		return key.includes("/") ? key.slice(key.lastIndexOf("/") + 1) : key;
	}

	return normalized;
}

export const GET: APIRoute = async ({ params, locals, url }) => {
	const { key } = params;
	const { emdash } = locals;

	if (!key) {
		return apiError("NOT_FOUND", "File not found", 404);
	}

	if (!emdash?.storage) {
		return apiError("NOT_CONFIGURED", "Storage not configured", 500);
	}

	try {
		const result = await emdash.storage.download(key);

		const forceDownload = url.searchParams.has("dl");
		const isInline = !forceDownload && SAFE_INLINE_TYPES.has(result.contentType);

		const headers: Record<string, string> = {
			"Content-Type": result.contentType,
			"Cache-Control": forceDownload
				? "private, max-age=300"
				: "public, max-age=31536000, immutable",
			"X-Content-Type-Options": "nosniff",
			"Content-Disposition": isInline ? "inline" : "attachment",
		};

		if (result.size) {
			headers["Content-Length"] = String(result.size);
		}

		// When forcing download, include the filename derived from the storage key
		// so browsers save with the correct name instead of the object-key UUID.
		if (forceDownload) {
			const requestedName = url.searchParams.get("name");
			const filename = getDownloadFilename(key, requestedName);
			headers["Content-Disposition"] = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
		}

		// Sandbox CSP on non-inline content — prevents script execution for SVGs,
		// HTML, JS, etc. navigated to directly. Skipped for safe inline types
		// (images, video, audio, PDF) because sandbox blocks in-iframe PDF rendering
		// and is unnecessary for content types without active script execution.
		if (!isInline) {
			headers["Content-Security-Policy"] =
				"sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'";
		}

		return new Response(result.body, { status: 200, headers });
	} catch (error) {
		// Check if it's a "not found" error
		if (
			error instanceof Error &&
			(error.message.includes("not found") || error.message.includes("NOT_FOUND"))
		) {
			return apiError("NOT_FOUND", "File not found", 404);
		}
		return handleError(error, "Failed to serve file", "FILE_SERVE_ERROR");
	}
};
