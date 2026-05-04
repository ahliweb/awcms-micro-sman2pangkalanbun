import { describe, expect, it } from "vitest";

import plugin from "../src/sandbox-entry.js";

function makeCtx() {
	const kvStore = new Map<string, unknown>();

	const ctx = {
		kv: {
			async get(key: string) {
				return kvStore.has(key) ? kvStore.get(key) : null;
			},
			async set(key: string, value: unknown) {
				kvStore.set(key, value);
			},
		},
		storage: {
			dismissals: {
				async count() {
					return 0;
				},
			},
		},
		log: {
			debug() {},
			info() {},
			warn() {},
			error() {},
		},
	};

	return { ctx, kvStore };
}

describe("countdown admin route", () => {
	it("renders settings page blocks", async () => {
		const adminRoute = (plugin as any).routes.admin;
		const { ctx } = makeCtx();

		const result = await adminRoute.handler(
			{
				input: {
					type: "page_load",
					page: "/settings",
				},
			},
			ctx,
		);

		expect(Array.isArray(result.blocks)).toBe(true);
		expect(result.blocks[0]).toMatchObject({ type: "header", text: "Countdown Popup Settings" });
	});

	it("saves settings from form submit", async () => {
		const adminRoute = (plugin as any).routes.admin;
		const { ctx, kvStore } = makeCtx();

		const result = await adminRoute.handler(
			{
				input: {
					type: "form_submit",
					action_id: "save_settings",
					values: {
						enabled: true,
						targetAt: "2027-06-01T00:00:00.000Z",
						caption: "School anniversary",
						imageUrl: "https://cdn.example.com/countdown.jpg",
						showFrom: "",
						showUntil: "",
						dismissOncePerSession: false,
					},
				},
			},
			ctx,
		);

		expect(kvStore.get("settings:enabled")).toBe(true);
		expect(kvStore.get("settings:caption")).toBe("School anniversary");
		expect(kvStore.get("settings:imageUrl")).toBe("https://cdn.example.com/countdown.jpg");
		expect(kvStore.get("settings:showFrom")).toBeNull();
		expect(kvStore.get("settings:dismissOncePerSession")).toBe(false);
		expect(result.toast).toMatchObject({ type: "success" });
	});

	it("returns validation error toast for invalid form values", async () => {
		const adminRoute = (plugin as any).routes.admin;
		const { ctx } = makeCtx();

		const result = await adminRoute.handler(
			{
				input: {
					type: "form_submit",
					action_id: "save_settings",
					values: {
						enabled: true,
						targetAt: "",
						caption: "Invalid",
						imageUrl: "https://cdn.example.com/countdown.jpg",
					},
				},
			},
			ctx,
		);

		expect(result.toast).toMatchObject({ type: "error" });
		expect(Array.isArray(result.blocks)).toBe(true);
		expect(result.blocks[0]).toMatchObject({ type: "banner", style: "error" });
	});
});

describe("countdown public fragments", () => {
	it("returns null when popup is disabled", async () => {
		const fragmentHook = (plugin as any).hooks["page:fragments"];
		const { ctx, kvStore } = makeCtx();
		kvStore.set("settings:enabled", false);
		kvStore.set("settings:targetAt", "");

		const result = await fragmentHook.handler({ page: { kind: "content" } }, ctx);
		expect(result).toBeNull();
	});

	it("auto-initializes settings on first access", async () => {
		const fragmentHook = (plugin as any).hooks["page:fragments"];
		const { ctx, kvStore } = makeCtx();

		const result = await fragmentHook.handler({ page: { kind: "content" } }, ctx);

		expect(Array.isArray(result)).toBe(true);
		expect(kvStore.has("settings:enabled")).toBe(true);
		expect(kvStore.get("settings:enabled")).toBe(true);
		expect(typeof kvStore.get("settings:targetAt")).toBe("string");
	});

	it("returns fragments when popup is enabled with valid settings", async () => {
		const fragmentHook = (plugin as any).hooks["page:fragments"];
		const { ctx, kvStore } = makeCtx();
		kvStore.set("settings:enabled", true);
		kvStore.set("settings:targetAt", "2099-06-01T00:00:00.000Z");
		kvStore.set("settings:caption", "Countdown to graduation");
		kvStore.set("settings:imageUrl", "https://cdn.example.com/popup.jpg");
		kvStore.set("settings:showFrom", null);
		kvStore.set("settings:showUntil", null);
		kvStore.set("settings:dismissOncePerSession", true);

		const result = await fragmentHook.handler({ page: { kind: "content" } }, ctx);

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({ kind: "html", placement: "body:end" });
		expect(result[1]).toMatchObject({ kind: "inline-script", placement: "body:end" });
		expect(result[2]).toMatchObject({ kind: "html", placement: "head" });
	});
});
