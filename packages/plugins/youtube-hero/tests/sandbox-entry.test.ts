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
		log: {
			debug() {},
			info() {},
			warn() {},
			error() {},
		},
	};

	return { ctx, kvStore };
}

describe("youtube hero admin route", () => {
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
		expect(result.blocks[0]).toMatchObject({ type: "header", text: "YouTube Hero Settings" });
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
						videoUrl: "https://www.youtube.com/watch?v=uXC7q9HTx70",
						title: "SMANDA Video",
						description: "Kegiatan sekolah terbaru.",
					},
				},
			},
			ctx,
		);

		expect(kvStore.get("settings:enabled")).toBe(true);
		expect(kvStore.get("settings:videoUrl")).toBe("https://www.youtube.com/watch?v=uXC7q9HTx70");
		expect(kvStore.get("settings:title")).toBe("SMANDA Video");
		expect(result.toast).toMatchObject({ type: "success" });
	});

	it("returns validation error for invalid video URL", async () => {
		const adminRoute = (plugin as any).routes.admin;
		const { ctx } = makeCtx();

		const result = await adminRoute.handler(
			{
				input: {
					type: "form_submit",
					action_id: "save_settings",
					values: {
						enabled: true,
						videoUrl: "https://example.com/not-youtube",
						title: "Invalid",
						description: "Invalid URL should fail.",
					},
				},
			},
			ctx,
		);

		expect(result.toast).toMatchObject({ type: "error" });
		expect(result.blocks[0]).toMatchObject({ type: "banner", style: "error" });
	});
});

describe("youtube hero public fragments", () => {
	it("returns null when hero is disabled", async () => {
		const fragmentHook = (plugin as any).hooks["page:fragments"];
		const { ctx, kvStore } = makeCtx();
		kvStore.set("settings:enabled", false);

		const result = await fragmentHook.handler({ page: { kind: "content" } }, ctx);
		expect(result).toBeNull();
	});

	it("returns fragments when enabled with valid settings", async () => {
		const fragmentHook = (plugin as any).hooks["page:fragments"];
		const { ctx, kvStore } = makeCtx();
		kvStore.set("settings:enabled", true);
		kvStore.set("settings:videoUrl", "https://youtu.be/RHI2y0XorAE");
		kvStore.set("settings:title", "Hero Title");
		kvStore.set("settings:description", "Hero Description");

		const result = await fragmentHook.handler({ page: { kind: "content" } }, ctx);

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({ kind: "html", placement: "head" });
		expect(result[1]).toMatchObject({ kind: "inline-script", placement: "body:end" });
	});
});
