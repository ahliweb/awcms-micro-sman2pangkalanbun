import node from "@astrojs/node";
import react from "@astrojs/react";
import { academicCalendarPlugin } from "@emdash-cms/plugin-academic-calendar";
import { auditLogPlugin } from "@emdash-cms/plugin-audit-log";
import { countdownPlugin } from "@emdash-cms/plugin-countdown";
import { kelulusanPlugin } from "@emdash-cms/plugin-kelulusan";
import { webhookNotifierPlugin } from "@emdash-cms/plugin-webhook-notifier";
import { defineConfig, fontProviders } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: sqlite({ url: "file:./data.db" }),
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
			plugins: [
				academicCalendarPlugin(),
				auditLogPlugin(),
				countdownPlugin(),
				kelulusanPlugin(),
				webhookNotifierPlugin(),
			],
		}),
	],
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
