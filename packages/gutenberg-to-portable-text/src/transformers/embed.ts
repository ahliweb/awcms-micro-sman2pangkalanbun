/**
 * Transformers for WordPress embed blocks
 */

import type { BlockTransformer } from "../types.js";
import { attrString } from "../types.js";

// Regex patterns for embed parsing
const IFRAME_SRC_PATTERN = /<iframe[^>]+src=["']([^"']+)["']/i;
const VIDEO_SRC_PATTERN = /<video[^>]+src=["']([^"']+)["']/i;
const VIDEO_SOURCE_PATTERN = /<source[^>]+src=["']([^"']+)["']/i;
const AUDIO_SRC_PATTERN = /<audio[^>]+src=["']([^"']+)["']/i;
const AUDIO_SOURCE_PATTERN = /<source[^>]+src=["']([^"']+)["']/i;

/**
 * core/embed and variants → embed block
 */
export const embed: BlockTransformer = (block, _options, context) => {
	const url = attrString(block.attrs, "url");
	const providerSlug = attrString(block.attrs, "providerNameSlug");

	// Extract iframe src if present
	const iframeMatch = block.innerHTML.match(IFRAME_SRC_PATTERN);
	const iframeSrc = iframeMatch?.[1];

	return [
		{
			_type: "embed",
			_key: context.generateKey(),
			url: url || iframeSrc || "",
			provider: providerSlug || detectProvider(url || iframeSrc || ""),
			html: block.innerHTML.trim() || undefined,
		},
	];
};

/**
 * core-embed/youtube → embed block
 */
export const youtube: BlockTransformer = (block, options, context) => {
	return embed(block, options, context);
};

/**
 * core-embed/twitter → embed block
 */
export const twitter: BlockTransformer = (block, options, context) => {
	return embed(block, options, context);
};

/**
 * core-embed/vimeo → embed block
 */
export const vimeo: BlockTransformer = (block, options, context) => {
	return embed(block, options, context);
};

/**
 * core/video → embed block (self-hosted video)
 */
export const video: BlockTransformer = (block, _options, context) => {
	const src = attrString(block.attrs, "src");

	// Extract from video tag if not in attrs
	const videoMatch = block.innerHTML.match(VIDEO_SRC_PATTERN);
	const sourceMatch = block.innerHTML.match(VIDEO_SOURCE_PATTERN);
	const videoSrc = src || videoMatch?.[1] || sourceMatch?.[1];

	return [
		{
			_type: "embed",
			_key: context.generateKey(),
			url: videoSrc || "",
			provider: "video",
			html: block.innerHTML.trim() || undefined,
		},
	];
};

/**
 * core/audio → embed block (self-hosted audio)
 */
export const audio: BlockTransformer = (block, _options, context) => {
	const src = attrString(block.attrs, "src");

	// Extract from audio tag if not in attrs
	const audioMatch = block.innerHTML.match(AUDIO_SRC_PATTERN);
	const sourceMatch = block.innerHTML.match(AUDIO_SOURCE_PATTERN);
	const audioSrc = src || audioMatch?.[1] || sourceMatch?.[1];

	return [
		{
			_type: "embed",
			_key: context.generateKey(),
			url: audioSrc || "",
			provider: "audio",
			html: block.innerHTML.trim() || undefined,
		},
	];
};

/**
 * Detect embed provider from URL
 */
function detectProvider(url: string): string | undefined {
	if (!url) return undefined;

	const host = getLowercaseHostname(url);
	if (!host) return undefined;

	if (hostMatches(host, "youtube.com") || hostMatches(host, "youtu.be")) {
		return "youtube";
	}
	if (hostMatches(host, "vimeo.com")) {
		return "vimeo";
	}
	if (hostMatches(host, "twitter.com") || hostMatches(host, "x.com")) {
		return "twitter";
	}
	if (hostMatches(host, "instagram.com")) {
		return "instagram";
	}
	if (hostMatches(host, "facebook.com")) {
		return "facebook";
	}
	if (hostMatches(host, "tiktok.com")) {
		return "tiktok";
	}
	if (hostMatches(host, "spotify.com")) {
		return "spotify";
	}
	if (hostMatches(host, "soundcloud.com")) {
		return "soundcloud";
	}
	if (hostMatches(host, "codepen.io")) {
		return "codepen";
	}
	if (hostMatches(host, "gist.github.com")) {
		return "gist";
	}

	return undefined;
}

function getLowercaseHostname(rawUrl: string): string | undefined {
	try {
		return new URL(rawUrl).hostname.toLowerCase();
	} catch {
		return undefined;
	}
}

function hostMatches(hostname: string, expectedHost: string): boolean {
	return hostname === expectedHost || hostname.endsWith(`.${expectedHost}`);
}
