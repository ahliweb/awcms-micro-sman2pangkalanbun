import type { PluginDescriptor } from "emdash";

export interface KelulusanPluginOptions {
	publicGatePath?: string;
	adminPagePath?: string;
}

export function kelulusanPlugin(
	options: KelulusanPluginOptions = {},
): PluginDescriptor<KelulusanPluginOptions> {
	const publicGatePath = options.publicGatePath ?? "/kelulusan";
	const adminPagePath = options.adminPagePath ?? "/kelulusan";

	return {
		id: "kelulusan",
		version: "0.0.1",
		format: "standard",
		entrypoint: "@emdash-cms/plugin-kelulusan/sandbox",
		options: { publicGatePath, adminPagePath },
		capabilities: ["media:read", "media:write"],
		storage: {
			students: {
				indexes: ["nisn", "name", "createdAt"],
				uniqueIndexes: ["nisn"],
			},
			document_events: {
				indexes: ["studentId", "eventType", "actorType", "createdAt"],
			},
		},
		adminPages: [{ path: adminPagePath, label: "Kelulusan", icon: "list" }],
	};
}
