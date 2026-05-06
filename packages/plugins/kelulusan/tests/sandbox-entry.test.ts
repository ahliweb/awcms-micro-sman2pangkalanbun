import { describe, expect, it } from "vitest";

import plugin from "../src/sandbox-entry.js";

type RecordData = Record<string, unknown>;

class MockCollection {
	private readonly map = new Map<string, RecordData>();

	async put(id: string, data: RecordData) {
		this.map.set(id, data);
	}

	async get(id: string) {
		return this.map.get(id) ?? null;
	}

	async delete(id: string) {
		const existed = this.map.has(id);
		this.map.delete(id);
		return existed;
	}

	async count(where?: Record<string, unknown>) {
		const items = await this.query({ where, limit: 10_000 });
		return items.items.length;
	}

	async query(options?: {
		where?: Record<string, unknown>;
		orderBy?: Record<string, "asc" | "desc">;
		limit?: number;
		cursor?: string;
	}) {
		const where = options?.where;
		let items = Array.from(this.map.entries(), ([id, data]) => ({ id, data }));

		if (where) {
			items = items.filter((item) =>
				Object.entries(where).every(([key, value]) => item.data[key] === value),
			);
		}

		const orderByEntry = options?.orderBy ? Object.entries(options.orderBy)[0] : undefined;
		if (orderByEntry) {
			const [key, dir] = orderByEntry;
			items = items.toSorted((a, b) => {
				const av = String(a.data[key] ?? "");
				const bv = String(b.data[key] ?? "");
				return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
			});
		}

		const limit = options?.limit ?? items.length;
		return {
			items: items.slice(0, limit),
			cursor: undefined,
		};
	}
}

function makeCtx(input: unknown, overrides?: { ip?: string; userAgent?: string }) {
	const students = new MockCollection();
	const events = new MockCollection();
	const kv = new Map<string, unknown>();

	const ctx = {
		input,
		request: new Request("http://example.test"),
		requestMeta: {
			ip: overrides?.ip ?? "127.0.0.1",
			userAgent: overrides?.userAgent ?? "vitest-agent",
			referer: null,
			geo: null,
		},
		storage: {
			students,
			document_events: events,
		},
		kv: {
			async get(key: string) {
				return kv.get(key) ?? null;
			},
			async set(key: string, value: unknown) {
				kv.set(key, value);
			},
			async delete(key: string) {
				kv.delete(key);
			},
		},
		media: {
			async get(id: string) {
				if (id === "missing") return null;
				// Storage-key-like ids (containing `/` or ending in `.pdf`) simulate
				// the real behaviour where `media.get` queries the `media` table by
				// primary key and won't find entries keyed by R2 object paths.
				if (id.includes("/") || id.toLowerCase().endsWith(".pdf")) return null;
				return {
					id,
					filename: "kelulusan.pdf",
					mimeType: "application/pdf",
					size: 1200,
					url: `https://cdn.example.test/${id}.pdf`,
					createdAt: new Date().toISOString(),
				};
			},
		},
		log: {
			debug() {},
			info() {},
			warn() {},
			error() {},
		},
	};

	return { ctx, students, events, kv };
}

describe("kelulusan plugin routes", () => {
	it("starts gate session for valid NISN", async () => {
		const route = (plugin as any).routes["gate/session/start"];
		const { ctx, students } = makeCtx({ nisn: "1234567890" });

		await students.put("stu-1", {
			nisn: "1234567890",
			name: "Budi",
			pdfMediaId: "pdf-1",
			pdfFilename: "budi.pdf",
			createdAt: "2026-01-01T00:00:00.000Z",
		});

		const parsed = route.input.parse(ctx.input);
		const result = await route.handler({ ...ctx, input: parsed });

		expect(result.nisn).toBe("1234567890");
		expect(result.name).toBe("Budi");
		expect(result.pdfFilename).toBe("budi.pdf");
		expect(typeof result.accessToken).toBe("string");
		expect(result.expiresInSeconds).toBe(600);
	});

	it("starts gate session for formatted NISN input", async () => {
		const route = (plugin as any).routes["gate/session/start"];
		const { ctx, students } = makeCtx({ nisn: "0051 7188-71" });

		await students.put("stu-formatted", {
			nisn: "0051718871",
			nisnNormalized: "0051718871",
			name: "EVA ELISTIANI",
			pdfMediaId: "pdf-formatted",
			pdfFilename: "eva.pdf",
			createdAt: "2026-01-01T00:00:00.000Z",
		});

		const parsed = route.input.parse(ctx.input);
		const result = await route.handler({ ...ctx, input: parsed });

		expect(result.nisn).toBe("0051718871");
		expect(result.name).toBe("EVA ELISTIANI");
		expect(typeof result.accessToken).toBe("string");
	});

	it("rejects gate session start for unknown NISN", async () => {
		const route = (plugin as any).routes["gate/session/start"];
		const { ctx } = makeCtx({ nisn: "0000000000" });

		const parsed = route.input.parse(ctx.input);
		await expect(route.handler({ ...ctx, input: parsed })).rejects.toMatchObject({
			code: "BAD_REQUEST",
		});
	});

	it("resolves active gate session and rejects mismatched token", async () => {
		const startRoute = (plugin as any).routes["gate/session/start"];
		const resolveRoute = (plugin as any).routes["gate/session/resolve"];
		const { ctx, students } = makeCtx(
			{ nisn: "5566778899", accessToken: "placeholder" },
			{ ip: "10.8.0.1", userAgent: "test-browser" },
		);

		await students.put("stu-resolve", {
			nisn: "5566778899",
			name: "Rahma",
			pdfMediaId: "pdf-5",
			pdfFilename: "rahma.pdf",
			createdAt: "2026-02-01T00:00:00.000Z",
		});

		const started = await startRoute.handler({
			...ctx,
			input: startRoute.input.parse({ nisn: "5566778899" }),
		});

		const resolved = await resolveRoute.handler({
			...ctx,
			input: resolveRoute.input.parse({
				nisn: "5566778899",
				accessToken: started.accessToken,
			}),
		});
		expect(resolved).toMatchObject({
			nisn: "5566778899",
			name: "Rahma",
			pdfFilename: "rahma.pdf",
		});

		await expect(
			resolveRoute.handler({
				...ctx,
				input: resolveRoute.input.parse({
					nisn: "5566778899",
					accessToken: "wrong-token",
				}),
			}),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("denies public document access with invalid token", async () => {
		const route = (plugin as any).routes["documents/access/public"];
		const { ctx, students } = makeCtx({
			nisn: "1234567890",
			accessToken: "invalid-token",
			eventType: "opened",
		});

		await students.put("stu-1", {
			nisn: "1234567890",
			name: "Budi",
			pdfMediaId: "pdf-1",
			pdfFilename: "budi.pdf",
			createdAt: "2026-01-01T00:00:00.000Z",
		});

		const parsed = route.input.parse(ctx.input);
		await expect(route.handler({ ...ctx, input: parsed })).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("records opened and downloaded events and reports telemetry", async () => {
		const startRoute = (plugin as any).routes["gate/session/start"];
		const accessPublicRoute = (plugin as any).routes["documents/access/public"];
		const listRoute = (plugin as any).routes["students/list"];

		const { ctx, students } = makeCtx({ nisn: "9876543210" }, { ip: "10.1.2.3" });

		await students.put("stu-2", {
			nisn: "9876543210",
			name: "Sari",
			pdfMediaId: "pdf-2",
			pdfFilename: "sari.pdf",
			createdAt: "2026-02-01T00:00:00.000Z",
		});

		const start = await startRoute.handler({
			...ctx,
			input: startRoute.input.parse({ nisn: "9876543210" }),
		});

		const openResult = await accessPublicRoute.handler({
			...ctx,
			input: accessPublicRoute.input.parse({
				nisn: "9876543210",
				accessToken: start.accessToken,
				eventType: "opened",
			}),
		});
		expect(openResult.pdfUrl).toContain("pdf-2.pdf");

		const downloadResult = await accessPublicRoute.handler({
			...ctx,
			input: accessPublicRoute.input.parse({
				nisn: "9876543210",
				accessToken: start.accessToken,
				eventType: "downloaded",
			}),
		});
		expect(downloadResult.pdfUrl).toContain("dl=1");
		expect(downloadResult.pdfUrl).toContain("name=sari.pdf");

		const listed = await listRoute.handler({
			...ctx,
			input: listRoute.input.parse({ limit: 10 }),
		});

		expect(listed.items).toHaveLength(1);
		expect(listed.items[0].nisn).toBe("9876543210");
		expect(listed.items[0].openedCount).toBe(1);
		expect(listed.items[0].downloadedCount).toBe(1);
		expect(listed.items[0].lastOpenedAt).toBeTruthy();
		expect(listed.items[0].lastDownloadedAt).toBeTruthy();
	});

	it("deduplicates rapid repeated public opened events", async () => {
		const startRoute = (plugin as any).routes["gate/session/start"];
		const accessPublicRoute = (plugin as any).routes["documents/access/public"];
		const listRoute = (plugin as any).routes["students/list"];

		const { ctx, students } = makeCtx({ nisn: "1122334455" }, { ip: "10.1.2.3" });

		await students.put("stu-3", {
			nisn: "1122334455",
			name: "Dina",
			pdfMediaId: "pdf-3",
			pdfFilename: "dina.pdf",
			createdAt: "2026-02-01T00:00:00.000Z",
		});

		const start = await startRoute.handler({
			...ctx,
			input: startRoute.input.parse({ nisn: "1122334455" }),
		});

		const payload = {
			nisn: "1122334455",
			accessToken: start.accessToken,
			eventType: "opened",
		};

		await accessPublicRoute.handler({
			...ctx,
			input: accessPublicRoute.input.parse(payload),
		});
		await accessPublicRoute.handler({
			...ctx,
			input: accessPublicRoute.input.parse(payload),
		});

		const listed = await listRoute.handler({
			...ctx,
			input: listRoute.input.parse({ limit: 10 }),
		});

		expect(listed.items).toHaveLength(1);
		expect(listed.items[0].openedCount).toBe(1);
	});

	it("builds admin blocks and returns document URL banner for selected student", async () => {
		const adminRoute = (plugin as any).routes.admin;
		const { ctx, students } = makeCtx({ type: "page_load", page: "/kelulusan" });

		await students.put("stu-4", {
			nisn: "4455667788",
			name: "Rina",
			pdfMediaId: "pdf-4",
			pdfFilename: "rina.pdf",
			createdAt: "2026-03-01T00:00:00.000Z",
		});

		const pageLoad = await adminRoute.handler(
			{ ...ctx, input: { type: "page_load", page: "/kelulusan" } },
			ctx,
		);
		expect(Array.isArray(pageLoad.blocks)).toBe(true);
		expect(pageLoad.blocks[0]).toMatchObject({ type: "header", text: "Kelulusan SKL 2025/2026" });

		const action = await adminRoute.handler(
			{
				...ctx,
				input: {
					type: "form_submit",
					action_id: "open_document",
					values: { nisn: "4455667788", eventType: "opened" },
				},
			},
			ctx,
		);

		expect(action.toast).toMatchObject({ type: "success" });
		expect(action.blocks[0]).toMatchObject({ type: "banner" });
		expect(String(action.blocks[0].description)).toContain("https://cdn.example.test/pdf-4.pdf");
	});

	it("resolves storage-key pdfMediaId for public opened event", async () => {
		const startRoute = (plugin as any).routes["gate/session/start"];
		const accessPublicRoute = (plugin as any).routes["documents/access/public"];

		const { ctx, students } = makeCtx({ nisn: "0051718871" }, { ip: "10.8.0.2" });

		await students.put("stu-sk", {
			nisn: "0051718871",
			name: "EVA ELISTIANI",
			pdfMediaId: "SKL-2026/SKL-0051718871-SMAN 2 PANGKALAN BUN-2026.pdf",
			pdfFilename: "SKL-0051718871-SMAN 2 PANGKALAN BUN-2026.pdf",
			createdAt: "2026-04-01T00:00:00.000Z",
		});

		const start = await startRoute.handler({
			...ctx,
			input: startRoute.input.parse({ nisn: "0051718871" }),
		});

		const result = await accessPublicRoute.handler({
			...ctx,
			input: accessPublicRoute.input.parse({
				nisn: "0051718871",
				accessToken: start.accessToken,
				eventType: "opened",
			}),
		});

		expect(result.pdfUrl).toBe(
			"/_emdash/api/media/file/SKL-2026/SKL-0051718871-SMAN%202%20PANGKALAN%20BUN-2026.pdf",
		);
	});

	it("resolves storage-key pdfMediaId in admin open_document banner", async () => {
		const adminRoute = (plugin as any).routes.admin;
		const { ctx, students } = makeCtx({ nisn: "0051718871" });

		await students.put("stu-sk-admin", {
			nisn: "0051718871",
			name: "EVA ELISTIANI",
			pdfMediaId: "SKL-2026/SKL-0051718871-SMAN 2 PANGKALAN BUN-2026.pdf",
			pdfFilename: "SKL-0051718871-SMAN 2 PANGKALAN BUN-2026.pdf",
			createdAt: "2026-04-01T00:00:00.000Z",
		});

		const action = await adminRoute.handler(
			{
				...ctx,
				input: {
					type: "form_submit",
					action_id: "open_document",
					values: { nisn: "0051718871", eventType: "opened" },
				},
			},
			ctx,
		);

		expect(action.toast).toMatchObject({ type: "success" });
		expect(action.blocks[0]).toMatchObject({ type: "banner" });
		expect(String(action.blocks[0].description)).toContain("/_emdash/api/media/file/SKL-2026/SKL");
	});

	it("falls back to SKL-2026/filename when pdfMediaId is unresolvable", async () => {
		const startRoute = (plugin as any).routes["gate/session/start"];
		const accessPublicRoute = (plugin as any).routes["documents/access/public"];

		const { ctx, students } = makeCtx({ nisn: "1122334455" }, { ip: "10.8.0.3" });

		await students.put("stu-fallback", {
			nisn: "1122334455",
			name: "Dina",
			// media.get will return null for "missing" (explicitly mocked to null).
			pdfMediaId: "missing",
			pdfFilename: "dina-fallback.pdf",
			createdAt: "2026-04-01T00:00:00.000Z",
		});

		const start = await startRoute.handler({
			...ctx,
			input: startRoute.input.parse({ nisn: "1122334455" }),
		});

		const result = await accessPublicRoute.handler({
			...ctx,
			input: accessPublicRoute.input.parse({
				nisn: "1122334455",
				accessToken: start.accessToken,
				eventType: "opened",
			}),
		});

		expect(result.pdfUrl).toBe("/_emdash/api/media/file/SKL-2026/dina-fallback.pdf");
	});
});
