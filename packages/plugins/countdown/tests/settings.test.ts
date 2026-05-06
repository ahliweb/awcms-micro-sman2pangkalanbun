import { describe, expect, it } from "vitest";

import {
	DEFAULT_COUNTDOWN_SETTINGS,
	applySettingsPatch,
	normalizeCountdownPatch,
	validateCountdownSettings,
} from "../src/settings.js";

describe("countdown settings", () => {
	it("accepts default settings", () => {
		const result = validateCountdownSettings(DEFAULT_COUNTDOWN_SETTINGS);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("rejects enabled settings without a valid target datetime", () => {
		const result = validateCountdownSettings({
			...DEFAULT_COUNTDOWN_SETTINGS,
			enabled: true,
			targetAt: "",
		});

		expect(result.valid).toBe(false);
		expect(result.errors).toContain("targetAt must be a valid ISO datetime when enabled is true");
	});

	it("rejects invalid visibility window order", () => {
		const result = validateCountdownSettings({
			...DEFAULT_COUNTDOWN_SETTINGS,
			showFrom: "2027-01-02T10:00:00.000Z",
			showUntil: "2027-01-02T09:00:00.000Z",
		});

		expect(result.valid).toBe(false);
		expect(result.errors).toContain("showFrom must be before or equal to showUntil");
	});

	it("normalizes and applies patch values", () => {
		const patch = normalizeCountdownPatch({
			enabled: true,
			targetAt: " 2027-06-01T00:00:00.000Z ",
			caption: " School anniversary ",
			imageUrl: " https://cdn.example.com/banner.png ",
			showFrom: null,
			dismissOncePerSession: false,
		});

		const settings = applySettingsPatch(DEFAULT_COUNTDOWN_SETTINGS, patch);
		expect(settings.enabled).toBe(true);
		expect(settings.targetAt).toBe("2027-06-01T00:00:00.000Z");
		expect(settings.caption).toBe("School anniversary");
		expect(settings.imageUrl).toBe("https://cdn.example.com/banner.png");
		expect(settings.showFrom).toBeNull();
		expect(settings.dismissOncePerSession).toBe(false);
	});
});
