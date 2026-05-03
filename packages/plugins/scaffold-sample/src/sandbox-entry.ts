import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";

export default definePlugin({
	hooks: {
		"plugin:install": {
			handler: async (_event: unknown, ctx: PluginContext) => {
				ctx.log.info("[scaffold-sample] installed");
			},
		},
	},
	routes: {
		ping: {
			handler: async (_routeCtx: unknown, ctx: PluginContext) => {
				return {
					ok: true,
					pluginId: ctx.plugin.id,
					timestamp: new Date().toISOString(),
				};
			},
		},
	},
});
