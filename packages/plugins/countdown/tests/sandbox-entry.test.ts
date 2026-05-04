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
});
