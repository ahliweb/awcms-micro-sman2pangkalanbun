import type { PluginDescriptor } from "emdash";

export function youtubeHeroPlugin(): PluginDescriptor {
	return {
		id: "youtube-hero",
		version: "0.0.1",
		format: "standard",
		entrypoint: "@emdash-cms/plugin-youtube-hero/sandbox",
		capabilities: ["hooks.page-fragments:register"],
		adminPages: [
			{
				path: "/settings",
				label: "YouTube Hero",
				icon: "video",
			},
		],
	};
}
