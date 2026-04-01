/**
 * Shared URL validation and transformation utilities
 */

const DEFAULT_REDIRECT = "/_emdash/admin";

/**
 * Sanitize a redirect URL to prevent open-redirect and javascript: XSS attacks.
 *
 * Only allows relative paths starting with `/`. Rejects protocol-relative
 * URLs (`//evil.com`), backslash tricks (`/\evil.com`), and non-path schemes
 * like `javascript:`.
 *
 * Returns the default admin URL when the input is unsafe.
 */
export function sanitizeRedirectUrl(raw: string): string {
	if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
		return raw;
	}
	return DEFAULT_REDIRECT;
}

/** Matches http:// or https:// URLs */
export const SAFE_URL_RE = /^https?:\/\//i;

/** Returns true if the URL uses a safe scheme (http/https) */
export function isSafeUrl(url: string): boolean {
	return SAFE_URL_RE.test(url);
}

/**
 * Build an icon URL with a width query param, or return null for unsafe URLs.
 * Validates the URL scheme and appends `?w=<width>` for image resizing.
 */
export function safeIconUrl(url: string, width: number): string | null {
	if (!SAFE_URL_RE.test(url)) return null;
	try {
		const u = new URL(url);
		u.searchParams.set("w", String(width));
		return u.href;
	} catch {
		return null;
	}
}
