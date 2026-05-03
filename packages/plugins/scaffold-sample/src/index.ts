import type { PluginDescriptor } from "emdash";

export function scaffoldSamplePlugin(): PluginDescriptor {
	return {
		id: "scaffold-sample",
		version: "0.0.1",
		format: "standard",
		entrypoint: "@emdash-cms/plugin-scaffold-sample/sandbox",
		capabilities: ["content:read"],
		storage: {
			events: { indexes: ["timestamp", "type"] },
		},
	};
}
