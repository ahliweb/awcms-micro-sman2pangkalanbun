import type { CountdownSettings, CountdownSettingsPatch, ValidationResult } from "./types.js";

const MAX_CAPTION_LENGTH = 280;
const KEY_PREFIX = "settings:";

export const DEFAULT_COUNTDOWN_SETTINGS: CountdownSettings = {
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

function isValidIsoDateTime(value: string): boolean {
	if (!value) return false;
	const t = Date.parse(value);
	if (Number.isNaN(t)) return false;
	return value.includes("T");
}

export function validateCountdownSettings(input: CountdownSettings): ValidationResult {
	const errors: string[] = [];

	if (input.caption.length > MAX_CAPTION_LENGTH) {
		errors.push(`caption must be ${MAX_CAPTION_LENGTH} characters or less`);
	}

	if (input.enabled && !isValidIsoDateTime(input.targetAt)) {
		errors.push("targetAt must be a valid ISO datetime when enabled is true");
	}

	if (input.targetAt && !isValidIsoDateTime(input.targetAt)) {
		errors.push("targetAt must be a valid ISO datetime");
	}

	if (input.showFrom && !isValidIsoDateTime(input.showFrom)) {
		errors.push("showFrom must be a valid ISO datetime or null");
	}

	if (input.showUntil && !isValidIsoDateTime(input.showUntil)) {
		errors.push("showUntil must be a valid ISO datetime or null");
	}

	if (input.showFrom && input.showUntil) {
		const fromAt = Date.parse(input.showFrom);
		const untilAt = Date.parse(input.showUntil);
		if (fromAt > untilAt) {
			errors.push("showFrom must be before or equal to showUntil");
		}
	}

	return { valid: errors.length === 0, errors };
}

export function normalizeCountdownPatch(input: unknown): CountdownSettingsPatch {
	if (!isRecord(input)) return {};

	const patch: CountdownSettingsPatch = {};

	if ("enabled" in input) patch.enabled = input.enabled;
	if ("targetAt" in input) patch.targetAt = input.targetAt;
	if ("caption" in input) patch.caption = input.caption;
	if ("imageUrl" in input) patch.imageUrl = input.imageUrl;
	if ("showFrom" in input) patch.showFrom = input.showFrom;
	if ("showUntil" in input) patch.showUntil = input.showUntil;
	if ("dismissOncePerSession" in input) patch.dismissOncePerSession = input.dismissOncePerSession;

	return patch;
}

export function applySettingsPatch(
	base: CountdownSettings,
	patch: CountdownSettingsPatch,
): CountdownSettings {
	return {
		enabled: typeof patch.enabled === "boolean" ? patch.enabled : base.enabled,
		targetAt: typeof patch.targetAt === "string" ? patch.targetAt.trim() : base.targetAt,
		caption: typeof patch.caption === "string" ? patch.caption.trim() : base.caption,
		imageUrl: typeof patch.imageUrl === "string" ? patch.imageUrl.trim() : base.imageUrl,
		showFrom:
			patch.showFrom === null
				? null
				: typeof patch.showFrom === "string"
					? patch.showFrom.trim()
					: base.showFrom,
		showUntil:
			patch.showUntil === null
				? null
				: typeof patch.showUntil === "string"
					? patch.showUntil.trim()
					: base.showUntil,
		dismissOncePerSession:
			typeof patch.dismissOncePerSession === "boolean"
				? patch.dismissOncePerSession
				: base.dismissOncePerSession,
	};
}

export function getSettingKey(field: keyof CountdownSettings): string {
	return `${KEY_PREFIX}${field}`;
}
