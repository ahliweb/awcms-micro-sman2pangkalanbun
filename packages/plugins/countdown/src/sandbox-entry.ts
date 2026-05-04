import { definePlugin } from "emdash";

const MAX_CAPTION_LENGTH = 280;
const KEY_PREFIX = "settings:";

interface CountdownSettings {
	enabled: boolean;
	targetAt: string;
	caption: string;
	imageUrl: string;
	showFrom: string | null;
	showUntil: string | null;
	dismissOncePerSession: boolean;
}

const DEFAULT_COUNTDOWN_SETTINGS: CountdownSettings = {
	enabled: false,
	targetAt: "",
	caption: "",
	imageUrl: "",
	showFrom: null,
	showUntil: null,
	dismissOncePerSession: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isValidIsoDateTime(value: string | null | undefined): boolean {
	if (!value) return false;
	const t = Date.parse(value);
	if (Number.isNaN(t)) return false;
	return value.includes("T");
}

function validateCountdownSettings(input: Record<string, unknown>): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	if (typeof input.caption === "string" && input.caption.length > MAX_CAPTION_LENGTH) {
		errors.push(`caption must be ${MAX_CAPTION_LENGTH} characters or less`);
	}
	if (input.enabled && !isValidIsoDateTime(input.targetAt as string)) {
		errors.push("targetAt must be a valid ISO datetime when enabled is true");
	}
	if (input.targetAt && !isValidIsoDateTime(input.targetAt as string)) {
		errors.push("targetAt must be a valid ISO datetime");
	}
	if (input.showFrom && !isValidIsoDateTime(input.showFrom as string)) {
		errors.push("showFrom must be a valid ISO datetime or null");
	}
	if (input.showUntil && !isValidIsoDateTime(input.showUntil as string)) {
		errors.push("showUntil must be a valid ISO datetime or null");
	}
	if (input.showFrom && input.showUntil) {
		if (Date.parse(input.showFrom as string) > Date.parse(input.showUntil as string)) {
			errors.push("showFrom must be before or equal to showUntil");
		}
	}
	return { valid: errors.length === 0, errors };
}

function normalizeCountdownPatch(input: Record<string, unknown>): Partial<CountdownSettings> {
	if (!isRecord(input)) return {};
	const patch: Partial<CountdownSettings> = {};
	if ("enabled" in input) patch.enabled = input.enabled as boolean;
	if ("targetAt" in input) patch.targetAt = input.targetAt as string;
	if ("caption" in input) patch.caption = input.caption as string;
	if ("imageUrl" in input) patch.imageUrl = input.imageUrl as string;
	if ("showFrom" in input) patch.showFrom = input.showFrom as string | null;
	if ("showUntil" in input) patch.showUntil = input.showUntil as string | null;
	if ("dismissOncePerSession" in input) patch.dismissOncePerSession = input.dismissOncePerSession as boolean;
	return patch;
}

function applySettingsPatch(base: CountdownSettings, patch: Partial<CountdownSettings>): CountdownSettings {
	return {
		enabled: typeof patch.enabled === "boolean" ? patch.enabled : base.enabled,
		targetAt: typeof patch.targetAt === "string" ? patch.targetAt.trim() : base.targetAt,
		caption: typeof patch.caption === "string" ? patch.caption.trim() : base.caption,
		imageUrl: typeof patch.imageUrl === "string" ? patch.imageUrl.trim() : base.imageUrl,
		showFrom: patch.showFrom === null ? null : typeof patch.showFrom === "string" ? patch.showFrom.trim() : base.showFrom,
		showUntil: patch.showUntil === null ? null : typeof patch.showUntil === "string" ? patch.showUntil.trim() : base.showUntil,
		dismissOncePerSession: typeof patch.dismissOncePerSession === "boolean" ? patch.dismissOncePerSession : base.dismissOncePerSession,
	};
}

function getSettingKey(field: string): string {
	return `${KEY_PREFIX}${field}`;
}

function asRecord(value: unknown): Record<string, unknown> {
	if (typeof value !== "object" || value === null) return {};
	return value as Record<string, unknown>;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("\"", "&quot;")
		.replaceAll("'", "&#39;");
}

function serializeForInlineScript(value: unknown): string {
	return JSON.stringify(value).replaceAll("<", "\\u003c");
}

async function buildSettingsPage(ctx: any) {
	const settings = await getSettings(ctx);
	return {
		blocks: [
			{ type: "header", text: "Countdown Popup Settings" },
			{
				type: "context",
				text: "Configure the public countdown popup image, caption, and visibility window.",
			},
			{ type: "divider" },
			{
				type: "form",
				block_id: "countdown-settings",
				fields: [
					{ type: "toggle", action_id: "enabled", label: "Enable popup", initial_value: settings.enabled },
					{ type: "text_input", action_id: "targetAt", label: "Target datetime (ISO)", initial_value: settings.targetAt },
					{ type: "text_input", action_id: "caption", label: "Caption", multiline: true, initial_value: settings.caption },
					{ type: "text_input", action_id: "imageUrl", label: "Image URL", initial_value: settings.imageUrl },
					{ type: "text_input", action_id: "showFrom", label: "Show from (ISO, optional)", initial_value: settings.showFrom ?? "" },
					{ type: "text_input", action_id: "showUntil", label: "Show until (ISO, optional)", initial_value: settings.showUntil ?? "" },
					{
						type: "toggle",
						action_id: "dismissOncePerSession",
						label: "Dismiss once per session",
						initial_value: settings.dismissOncePerSession,
					},
				],
				submit: { label: "Save settings", action_id: "save_settings" },
			},
		],
	};
}

async function saveSettingsFromAdmin(ctx: any, values: Record<string, unknown>) {
	const patch = normalizeCountdownPatch({
		enabled: values.enabled,
		targetAt: values.targetAt,
		caption: values.caption,
		imageUrl: values.imageUrl,
		showFrom: values.showFrom === "" ? null : values.showFrom,
		showUntil: values.showUntil === "" ? null : values.showUntil,
		dismissOncePerSession: values.dismissOncePerSession,
	});
	const merged = applySettingsPatch(await getSettings(ctx), patch);
	const validation = validateCountdownSettings(merged);
	if (!validation.valid) {
		return {
			blocks: [
				{ type: "banner", style: "error", text: validation.errors.join("; ") },
				...(await buildSettingsPage(ctx)).blocks,
			],
			toast: { message: "Failed to save countdown settings", type: "error" },
		};
	}
	await saveSettings(ctx, merged);
	return {
		...(await buildSettingsPage(ctx)),
		toast: { message: "Countdown settings saved", type: "success" },
	};
}

async function buildCountdownFragments(ctx: any) {
	const settings = await getSettings(ctx);
	if (!settings.enabled) return null;
	const validation = validateCountdownSettings(settings);
	if (!validation.valid) {
		ctx.log.warn("[countdown] skipped fragments due to invalid settings", validation.errors);
		return null;
	}
	const initial = {
		targetAt: settings.targetAt,
		caption: settings.caption,
		imageUrl: settings.imageUrl,
		showFrom: settings.showFrom,
		showUntil: settings.showUntil,
		dismissOncePerSession: settings.dismissOncePerSession,
	};
	const caption = escapeHtml(settings.caption);
	return [
		{
			kind: "html",
			placement: "body:end",
			key: "countdown-popup-root",
			html: `<div id="ecountdown-root" hidden><div class="ecountdown-overlay" data-ecountdown-close></div><section class="ecountdown-card" role="dialog" aria-modal="true" aria-label="Countdown popup"><button type="button" class="ecountdown-close" data-ecountdown-close aria-label="Close">×</button>${settings.imageUrl ? `<img class="ecountdown-image" src="${escapeHtml(settings.imageUrl)}" alt="${caption}">` : ""}<p class="ecountdown-caption">${caption}</p><p class="ecountdown-timer" data-ecountdown-timer>--:--:--</p></section></div>`,
		},
		{
			kind: "inline-script",
			placement: "body:end",
			key: "countdown-popup-script",
			code: `(function(){var cfg=${serializeForInlineScript(initial)};var root=document.getElementById('ecountdown-root');if(!root)return;var now=Date.now();if(cfg.showFrom&&Date.parse(cfg.showFrom)>now)return;if(cfg.showUntil&&Date.parse(cfg.showUntil)<now)return;var target=Date.parse(cfg.targetAt);if(!Number.isFinite(target)||target<=now)return;var dismissKey='ecountdown:dismissed';if(cfg.dismissOncePerSession&&window.sessionStorage&&sessionStorage.getItem(dismissKey)==='1')return;var timer=root.querySelector('[data-ecountdown-timer]');var close=function(){root.hidden=true;if(cfg.dismissOncePerSession&&window.sessionStorage){try{sessionStorage.setItem(dismissKey,'1')}catch(_){}}};root.querySelectorAll('[data-ecountdown-close]').forEach(function(el){el.addEventListener('click',close)});var tick=function(){var diff=target-Date.now();if(diff<=0){close();return}var sec=Math.floor(diff/1000)%60;var min=Math.floor(diff/60000)%60;var hour=Math.floor(diff/3600000)%24;var day=Math.floor(diff/86400000);if(timer){timer.textContent=day+'d '+String(hour).padStart(2,'0')+':'+String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0')}};tick();root.hidden=false;var id=setInterval(tick,1000);window.addEventListener('pagehide',function(){clearInterval(id)},{once:true});})();`,
		},
		{
			kind: "html",
			placement: "head",
			key: "countdown-popup-css",
			html: `<style>#ecountdown-root{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:1rem}#ecountdown-root[hidden]{display:none!important}.ecountdown-overlay{position:absolute;inset:0;background:rgb(15 23 42 / .55);backdrop-filter:blur(2px)}.ecountdown-card{position:relative;max-width:30rem;width:min(100%,30rem);background:#fff;color:#0f172a;border-radius:1rem;box-shadow:0 25px 60px rgb(2 6 23 / .35);overflow:hidden;display:grid;gap:.75rem;padding:1rem 1rem 1.25rem}.ecountdown-image{width:100%;height:auto;max-height:14rem;object-fit:cover;border-radius:.75rem}.ecountdown-caption{margin:0;font:600 1rem/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.ecountdown-timer{margin:0;font:700 1.2rem/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#0b4db6}.ecountdown-close{position:absolute;inset-inline-end:.5rem;top:.5rem;border:0;background:rgb(255 255 255 / .9);width:2rem;height:2rem;border-radius:999px;cursor:pointer;font:700 1.1rem/1 sans-serif}@media (max-width:640px){.ecountdown-card{max-width:22rem;padding:.875rem}.ecountdown-caption{font-size:.95rem}.ecountdown-timer{font-size:1.05rem}}</style>`,
		},
	];
}

async function getSettings(ctx: any): Promise<CountdownSettings> {
	const enabled = await ctx.kv.get(getSettingKey("enabled"));
	const targetAt = await ctx.kv.get(getSettingKey("targetAt"));
	const caption = await ctx.kv.get(getSettingKey("caption"));
	const imageUrl = await ctx.kv.get(getSettingKey("imageUrl"));
	const showFrom = await ctx.kv.get(getSettingKey("showFrom"));
	const showUntil = await ctx.kv.get(getSettingKey("showUntil"));
	const dismissOncePerSession = await ctx.kv.get(getSettingKey("dismissOncePerSession"));

	return {
		enabled: typeof enabled === "boolean" ? enabled : DEFAULT_COUNTDOWN_SETTINGS.enabled,
		targetAt: typeof targetAt === "string" ? targetAt : DEFAULT_COUNTDOWN_SETTINGS.targetAt,
		caption: typeof caption === "string" ? caption : DEFAULT_COUNTDOWN_SETTINGS.caption,
		imageUrl: typeof imageUrl === "string" ? imageUrl : DEFAULT_COUNTDOWN_SETTINGS.imageUrl,
		showFrom: typeof showFrom === "string" || showFrom === null ? showFrom : DEFAULT_COUNTDOWN_SETTINGS.showFrom,
		showUntil: typeof showUntil === "string" || showUntil === null ? showUntil : DEFAULT_COUNTDOWN_SETTINGS.showUntil,
		dismissOncePerSession: typeof dismissOncePerSession === "boolean" ? dismissOncePerSession : DEFAULT_COUNTDOWN_SETTINGS.dismissOncePerSession,
	};
}

async function saveSettings(ctx: any, settings: CountdownSettings) {
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
			handler: async (_event: unknown, ctx: any) => {
				await saveSettings(ctx, DEFAULT_COUNTDOWN_SETTINGS);
				ctx.log.info("[countdown] defaults initialized");
			},
		},
		"page:fragments": {
			errorPolicy: "continue",
			handler: async (_event: unknown, ctx: any) => {
				return buildCountdownFragments(ctx);
			},
		},
	},
	routes: {
		admin: {
			handler: async (routeCtx: any, ctx: any) => {
				const interaction = asRecord(routeCtx.input);
				const interactionType = typeof interaction.type === "string" ? interaction.type : "";
				const page = typeof interaction.page === "string" ? interaction.page : "";
				const actionId = typeof interaction.action_id === "string" ? interaction.action_id : "";

				if (interactionType === "page_load" && page === "/settings") {
					return buildSettingsPage(ctx);
				}
				if (interactionType === "form_submit" && actionId === "save_settings") {
					return saveSettingsFromAdmin(ctx, asRecord(interaction.values));
				}
				return { blocks: [] };
			},
		},
		settings: {
			handler: async (_routeCtx: any, ctx: any) => {
				const settings = await getSettings(ctx);
				const validation = validateCountdownSettings(settings);
				if (!validation.valid) {
					return { success: false, error: { code: "INVALID_SETTINGS", message: validation.errors.join("; ") } };
				}
				return { success: true, settings };
			},
		},
		"settings/save": {
			handler: async (routeCtx: any, ctx: any) => {
				const merged = applySettingsPatch(await getSettings(ctx), normalizeCountdownPatch(routeCtx.input));
				const validation = validateCountdownSettings(merged);
				if (!validation.valid) {
					return { success: false, error: { code: "VALIDATION_ERROR", message: validation.errors.join("; ") } };
				}
				await saveSettings(ctx, merged);
				return { success: true, settings: merged };
			},
		},
	},
});
