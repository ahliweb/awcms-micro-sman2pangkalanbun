import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";

import {
	DEFAULT_COUNTDOWN_SETTINGS,
	applySettingsPatch,
	getSettingKey,
	normalizeCountdownPatch,
	validateCountdownSettings,
} from "./settings.js";
import type { CountdownSettings } from "./types.js";

async function getSettings(ctx: PluginContext): Promise<CountdownSettings> {
	const enabled = await ctx.kv.get<boolean>(getSettingKey("enabled"));
	const targetAt = await ctx.kv.get<string>(getSettingKey("targetAt"));
	const caption = await ctx.kv.get<string>(getSettingKey("caption"));
	const imageUrl = await ctx.kv.get<string>(getSettingKey("imageUrl"));
	const showFrom = await ctx.kv.get<string | null>(getSettingKey("showFrom"));
	const showUntil = await ctx.kv.get<string | null>(getSettingKey("showUntil"));
	const dismissOncePerSession = await ctx.kv.get<boolean>(getSettingKey("dismissOncePerSession"));

	return {
		enabled: typeof enabled === "boolean" ? enabled : DEFAULT_COUNTDOWN_SETTINGS.enabled,
		targetAt: typeof targetAt === "string" ? targetAt : DEFAULT_COUNTDOWN_SETTINGS.targetAt,
		caption: typeof caption === "string" ? caption : DEFAULT_COUNTDOWN_SETTINGS.caption,
		imageUrl: typeof imageUrl === "string" ? imageUrl : DEFAULT_COUNTDOWN_SETTINGS.imageUrl,
		showFrom:
			typeof showFrom === "string" || showFrom === null
				? showFrom
				: DEFAULT_COUNTDOWN_SETTINGS.showFrom,
		showUntil:
			typeof showUntil === "string" || showUntil === null
				? showUntil
				: DEFAULT_COUNTDOWN_SETTINGS.showUntil,
		dismissOncePerSession:
			typeof dismissOncePerSession === "boolean"
				? dismissOncePerSession
				: DEFAULT_COUNTDOWN_SETTINGS.dismissOncePerSession,
	};
}

async function saveSettings(ctx: PluginContext, settings: CountdownSettings): Promise<void> {
	await ctx.kv.set(getSettingKey("enabled"), settings.enabled);
	await ctx.kv.set(getSettingKey("targetAt"), settings.targetAt);
	await ctx.kv.set(getSettingKey("caption"), settings.caption);
	await ctx.kv.set(getSettingKey("imageUrl"), settings.imageUrl);
	await ctx.kv.set(getSettingKey("showFrom"), settings.showFrom);
	await ctx.kv.set(getSettingKey("showUntil"), settings.showUntil);
	await ctx.kv.set(getSettingKey("dismissOncePerSession"), settings.dismissOncePerSession);
}

export default definePlugin({
	hooks: {
		"plugin:install": {
			handler: async (_event: unknown, ctx: PluginContext) => {
				await saveSettings(ctx, DEFAULT_COUNTDOWN_SETTINGS);
				ctx.log.info("[countdown] defaults initialized");
			},
		},
	},
	routes: {
		settings: {
			handler: async (_routeCtx: unknown, ctx: PluginContext) => {
				const settings = await getSettings(ctx);
				const validation = validateCountdownSettings(settings);
				if (!validation.valid) {
					return {
						success: false,
						error: {
							code: "INVALID_SETTINGS",
							message: validation.errors.join("; "),
						},
					};
				}

				return { success: true, settings };
			},
		},
		"settings/save": {
			handler: async (routeCtx: { input: unknown }, ctx: PluginContext) => {
				const current = await getSettings(ctx);
				const patch = normalizeCountdownPatch(routeCtx.input);
				const merged = applySettingsPatch(current, patch);
				const validation = validateCountdownSettings(merged);

				if (!validation.valid) {
					return {
						success: false,
						error: {
							code: "VALIDATION_ERROR",
							message: validation.errors.join("; "),
						},
					};
				}

				await saveSettings(ctx, merged);
				return { success: true, settings: merged };
			},
		},
	},
});
