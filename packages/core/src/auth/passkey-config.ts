/**
 * Passkey configuration helper
 *
 * Extracts passkey configuration from the request URL.
 * This ensures the rpId and origin are correctly set for both
 * localhost development and production deployments.
 */

export interface PasskeyConfig {
	rpName: string;
	rpId: string;
	origin: string;
}

/**
 * Get passkey configuration from request URL
 *
 * @param url The request URL
 * @param siteName Optional site name for rpName (defaults to hostname)
 */
export function getPasskeyConfig(url: URL, siteName?: string): PasskeyConfig {
	return {
		rpName: siteName || url.hostname,
		rpId: url.hostname,
		origin: url.origin,
	};
}
