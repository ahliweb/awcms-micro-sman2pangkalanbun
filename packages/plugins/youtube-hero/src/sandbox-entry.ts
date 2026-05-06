import { definePlugin } from "emdash";

interface YoutubeHeroSettings {
	enabled: boolean;
	videoUrl: string;
	title: string;
	description: string;
}

const DEFAULT_SETTINGS: YoutubeHeroSettings = {
	enabled: true,
	videoUrl: "https://www.youtube.com/watch?v=RHI2y0XorAE",
	title: "SMAN 2 Pangkalan Bun",
	description: "Profil dan kegiatan terbaru dari kanal resmi sekolah.",
};

const MAX_TEXT_LENGTH = 180;
const KEY_PREFIX = "settings:";
const YOUTUBE_VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
const WWW_PREFIX_REGEX = /^www\./;

function getSettingKey(field: keyof YoutubeHeroSettings): string {
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
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function serializeForInlineScript(value: unknown): string {
	return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function parseYoutubeVideoId(input: string): string | null {
	const value = input.trim();
	if (!value) return null;

	if (YOUTUBE_VIDEO_ID_REGEX.test(value)) {
		return value;
	}

	try {
		const url = new URL(value);
		const hostname = url.hostname.replace(WWW_PREFIX_REGEX, "").toLowerCase();
		if (hostname === "youtube.com" || hostname === "m.youtube.com") {
			if (url.pathname === "/watch") {
				const id = url.searchParams.get("v");
				if (id && YOUTUBE_VIDEO_ID_REGEX.test(id)) return id;
			}
			if (url.pathname.startsWith("/shorts/")) {
				const id = url.pathname.split("/")[2] ?? "";
				if (YOUTUBE_VIDEO_ID_REGEX.test(id)) return id;
			}
		}
		if (hostname === "youtu.be") {
			const id = url.pathname.split("/").find((segment) => segment.length > 0) ?? "";
			if (YOUTUBE_VIDEO_ID_REGEX.test(id)) return id;
		}
	} catch {
		return null;
	}

	return null;
}

function normalizeSettingsPatch(input: Record<string, unknown>): Partial<YoutubeHeroSettings> {
	const patch: Partial<YoutubeHeroSettings> = {};
	if (typeof input.enabled === "boolean") patch.enabled = input.enabled;
	if (typeof input.videoUrl === "string") patch.videoUrl = input.videoUrl.trim();
	if (typeof input.title === "string") patch.title = input.title.trim();
	if (typeof input.description === "string") patch.description = input.description.trim();
	return patch;
}

function applyPatch(
	current: YoutubeHeroSettings,
	patch: Partial<YoutubeHeroSettings>,
): YoutubeHeroSettings {
	return {
		enabled: typeof patch.enabled === "boolean" ? patch.enabled : current.enabled,
		videoUrl: typeof patch.videoUrl === "string" ? patch.videoUrl : current.videoUrl,
		title: typeof patch.title === "string" ? patch.title : current.title,
		description: typeof patch.description === "string" ? patch.description : current.description,
	};
}

function validateSettings(settings: YoutubeHeroSettings): string[] {
	const errors: string[] = [];
	if (!parseYoutubeVideoId(settings.videoUrl)) {
		errors.push("videoUrl must be a valid YouTube URL or video ID");
	}
	if (settings.title.length > MAX_TEXT_LENGTH) {
		errors.push(`title must be ${MAX_TEXT_LENGTH} characters or less`);
	}
	if (settings.description.length > MAX_TEXT_LENGTH) {
		errors.push(`description must be ${MAX_TEXT_LENGTH} characters or less`);
	}
	return errors;
}

async function getSettings(ctx: any): Promise<YoutubeHeroSettings> {
	const enabled = await ctx.kv.get(getSettingKey("enabled"));
	const videoUrl = await ctx.kv.get(getSettingKey("videoUrl"));
	const title = await ctx.kv.get(getSettingKey("title"));
	const description = await ctx.kv.get(getSettingKey("description"));

	const hasAnySetting =
		typeof enabled === "boolean" ||
		typeof videoUrl === "string" ||
		typeof title === "string" ||
		typeof description === "string";

	if (!hasAnySetting) {
		await saveSettings(ctx, DEFAULT_SETTINGS);
		return DEFAULT_SETTINGS;
	}

	return {
		enabled: typeof enabled === "boolean" ? enabled : DEFAULT_SETTINGS.enabled,
		videoUrl: typeof videoUrl === "string" ? videoUrl : DEFAULT_SETTINGS.videoUrl,
		title: typeof title === "string" ? title : DEFAULT_SETTINGS.title,
		description: typeof description === "string" ? description : DEFAULT_SETTINGS.description,
	};
}

async function saveSettings(ctx: any, settings: YoutubeHeroSettings): Promise<void> {
	await ctx.kv.set(getSettingKey("enabled"), settings.enabled);
	await ctx.kv.set(getSettingKey("videoUrl"), settings.videoUrl);
	await ctx.kv.set(getSettingKey("title"), settings.title);
	await ctx.kv.set(getSettingKey("description"), settings.description);
}

async function buildSettingsPage(ctx: any) {
	const settings = await getSettings(ctx);
	const validationErrors = validateSettings(settings);

	return {
		blocks: [
			{ type: "header", text: "YouTube Hero Settings" },
			{
				type: "context",
				text: "Display a sitewide hero section below the header with an autoplaying YouTube video.",
			},
			{ type: "divider" },
			{
				type: "form",
				block_id: "youtube-hero-settings",
				fields: [
					{
						type: "toggle",
						action_id: "enabled",
						label: "Enable hero section",
						initial_value: settings.enabled,
					},
					{
						type: "text_input",
						action_id: "videoUrl",
						label: "YouTube URL or video ID",
						initial_value: settings.videoUrl,
						placeholder: "https://www.youtube.com/watch?v=...",
					},
					{
						type: "text_input",
						action_id: "title",
						label: "Hero title",
						initial_value: settings.title,
					},
					{
						type: "text_input",
						action_id: "description",
						label: "Hero description",
						multiline: true,
						initial_value: settings.description,
					},
				],
				submit: { label: "Save settings", action_id: "save_settings" },
			},
			{ type: "divider" },
			{
				type: "context",
				text:
					validationErrors.length === 0
						? "Settings are valid and ready to publish."
						: `Current validation errors: ${validationErrors.join("; ")}`,
			},
		],
	};
}

async function saveSettingsFromAdmin(ctx: any, values: Record<string, unknown>) {
	const merged = applyPatch(await getSettings(ctx), normalizeSettingsPatch(values));
	const errors = validateSettings(merged);

	if (errors.length > 0) {
		return {
			blocks: [
				{ type: "banner", style: "error", text: errors.join("; ") },
				...(await buildSettingsPage(ctx)).blocks,
			],
			toast: { message: "Failed to save YouTube hero settings", type: "error" },
		};
	}

	await saveSettings(ctx, merged);
	return {
		...(await buildSettingsPage(ctx)),
		toast: { message: "YouTube hero settings saved", type: "success" },
	};
}

const HERO_CSS = `<style>
#eyt-hero{position:relative;isolation:isolate;padding:1.25rem var(--spacing-6) 1.5rem}
#eyt-hero .eyt-hero-wrap{max-width:var(--wide-width);margin:0 auto;background:color-mix(in srgb,var(--color-bg) 70%,#0000);border:1px solid var(--color-border);border-radius:1rem;overflow:hidden;box-shadow:0 16px 42px rgb(0 0 0/.16)}
#eyt-hero .eyt-hero-copy{padding:1rem 1.25rem;border-bottom:1px solid var(--color-border-subtle);background:color-mix(in srgb,var(--color-bg-subtle) 75%,#0000)}
#eyt-hero .eyt-hero-title{margin:0;font-size:clamp(1.05rem,1.7vw,1.35rem);line-height:1.2;color:var(--color-text)}
#eyt-hero .eyt-hero-description{margin:.4rem 0 0;color:var(--color-text-secondary);font-size:.95rem;line-height:1.45}
#eyt-hero .eyt-hero-media{position:relative;aspect-ratio:16/9;background:#000}
#eyt-hero .eyt-hero-media iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
@media (max-width:640px){#eyt-hero{padding:.85rem var(--spacing-4) 1rem}#eyt-hero .eyt-hero-copy{padding:.8rem 1rem}}
</style>`;

function buildHeroScript(settings: YoutubeHeroSettings): string {
	const videoId = parseYoutubeVideoId(settings.videoUrl);
	const title = escapeHtml(settings.title);
	const description = escapeHtml(settings.description);
	const embedUrl =
		videoId !== null
			? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1`
			: "";

	const initial = {
		enabled: settings.enabled,
		embedUrl,
		title,
		description,
	};

	return `(function(){var cfg=${serializeForInlineScript(initial)};if(!cfg.enabled||!cfg.embedUrl)return;if(location.pathname.startsWith('/_emdash/'))return;var header=document.querySelector('.site-header');if(!header)return;if(document.getElementById('eyt-hero'))return;var hero=document.createElement('section');hero.id='eyt-hero';hero.innerHTML='<div class="eyt-hero-wrap">'+(cfg.title||cfg.description?'<div class="eyt-hero-copy">'+(cfg.title?'<h2 class="eyt-hero-title">'+cfg.title+'</h2>':'')+(cfg.description?'<p class="eyt-hero-description">'+cfg.description+'</p>':'')+'</div>':'')+'<div class="eyt-hero-media"><iframe src="'+cfg.embedUrl+'" title="YouTube hero video" loading="eager" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>';header.insertAdjacentElement('afterend',hero);})();`;
}

async function buildHeroFragments(ctx: any) {
	const settings = await getSettings(ctx);
	if (!settings.enabled) return null;

	const errors = validateSettings(settings);
	if (errors.length > 0) {
		ctx.log.warn("[youtube-hero] fragments skipped: invalid settings", errors);
		return null;
	}

	return [
		{
			kind: "html",
			placement: "head",
			key: "youtube-hero-css",
			html: HERO_CSS,
		},
		{
			kind: "inline-script",
			placement: "body:end",
			key: "youtube-hero-script",
			code: buildHeroScript(settings),
		},
	];
}

export default definePlugin({
	hooks: {
		"plugin:install": {
			handler: async (_event: unknown, ctx: any) => {
				await saveSettings(ctx, DEFAULT_SETTINGS);
				ctx.log.info("[youtube-hero] defaults initialized");
			},
		},
		"page:fragments": {
			errorPolicy: "continue",
			handler: async (_event: unknown, ctx: any) => {
				return buildHeroFragments(ctx);
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
				const errors = validateSettings(settings);
				if (errors.length > 0) {
					return {
						success: false,
						error: { code: "INVALID_SETTINGS", message: errors.join("; ") },
					};
				}
				return { success: true, settings };
			},
		},
	},
});
