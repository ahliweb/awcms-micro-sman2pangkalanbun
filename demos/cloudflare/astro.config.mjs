// @ts-check
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import {
	d1,
	r2,
	cloudflareCache,
	cloudflareImages,
	cloudflareStream,
} from "@emdash-cms/cloudflare";
import { academicCalendarPlugin } from "@emdash-cms/plugin-academic-calendar";
import { countdownPlugin } from "@emdash-cms/plugin-countdown";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { kelulusanPlugin } from "@emdash-cms/plugin-kelulusan";
import { webhookNotifierPlugin } from "@emdash-cms/plugin-webhook-notifier";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare({
		imageService: "cloudflare",
	}),
	image: {
		// Enable responsive images globally
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			// D1 database - binding name must match wrangler.jsonc
			// session: "auto" enables read replicas (nearest replica for anon,
			// bookmark-based consistency for authenticated users)
			database: d1({ binding: "DB", session: "auto" }),
			// R2 storage for media
			storage: r2({ binding: "MEDIA" }),
			// Use EmDash built-in auth providers for deployment portability.
			// Media providers - Cloudflare Images and Stream
			// Reads from env vars at runtime: CF_ACCOUNT_ID, CF_IMAGES_TOKEN, CF_STREAM_TOKEN
			// Or customize with accountIdEnvVar/apiTokenEnvVar options
			mediaProviders: [
				cloudflareImages({
					accountIdEnvVar: "CF_MEDIA_ACCOUNT_ID",
					apiTokenEnvVar: "CF_MEDIA_API_TOKEN",
					accountHash: "5LGXGUnHU18h6ehN_xjpXQ",
				}),
				cloudflareStream({
					accountIdEnvVar: "CF_MEDIA_ACCOUNT_ID",
					apiTokenEnvVar: "CF_MEDIA_API_TOKEN",
				}),
			],
			// Trusted plugins (run in host worker)
			plugins: [
				academicCalendarPlugin(),
				countdownPlugin(),
				formsPlugin(),
				kelulusanPlugin(),
				webhookNotifierPlugin(),
			],
		}),
	],
	experimental: {
		cache: {
			provider: cloudflareCache(),
		},
		routeRules: {
			"/": {
				maxAge: 3_600,
				swr: 864_000,
			},
			"/[...slug]": {
				maxAge: 3_600,
				swr: 864_000,
			},
		},
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-sans",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
