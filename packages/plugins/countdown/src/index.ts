import type { PluginDescriptor } from "emdash";

export function countdownPlugin(): PluginDescriptor {
	return {
		id: "countdown",
		version: "0.0.1",
		format: "standard",
		entrypoint: "@emdash-cms/plugin-countdown/sandbox",
		capabilities: ["hooks.page-fragments:register"],
		storage: {
			dismissals: { indexes: ["createdAt", "sessionId"] },
		},
		adminPages: [{ path: "/settings", label: "Countdown Settings", icon: "clock" }],
	};
}
