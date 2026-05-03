import { describe, expect, it } from "vitest";

import plugin from "../src/sandbox-entry.js";

type Stored = { id: string; data: Record<string, unknown> };

function makeCollection() {
	const map = new Map<string, Record<string, unknown>>();
	return {
		async put(id: string, data: Record<string, unknown>) {
			map.set(id, data);
		},
		async get(id: string) {
			return map.get(id) ?? null;
		},
		async delete(id: string) {
			map.delete(id);
		},
		async query({ orderBy, limit }: { orderBy?: Record<string, "asc" | "desc">; limit?: number }) {
			let items: Stored[] = Array.from(map.entries(), ([id, data]) => ({ id, data }));
			const firstKey = orderBy ? Object.keys(orderBy)[0] : undefined;
			if (firstKey) {
				items = items.toSorted((a, b) => {
					const av = `${a.data[firstKey] ?? ""}`;
					const bv = `${b.data[firstKey] ?? ""}`;
					return av.localeCompare(bv);
				});
			}
			return { items: items.slice(0, limit ?? items.length) };
		},
	};
}

function makeCtx(input: unknown, url = "http://example.test") {
	const terms = makeCollection();
	const examWindows = makeCollection();
	const events = makeCollection();
	return {
		input,
		request: new Request(url),
		storage: {
			terms,
			exam_windows: examWindows,
			events,
		},
		plugin: { id: "academic-calendar", version: "0.0.1" },
		url: (path: string) => `https://site.test${path}`,
	};
}

describe("academic calendar routes", () => {
	it("creates and lists term entries", async () => {
		const ctx = makeCtx({
			id: "term-1",
			name: "Semester 1",
			academicYear: "2026/2027",
			locale: "id-ID",
			startDate: "2026-07-01",
			endDate: "2026-12-01",
		});

		const createRoute = (plugin as any).routes["terms/create"];
		const listRoute = (plugin as any).routes["terms/list"];

		const parsed = createRoute.input.parse(ctx.input);
		const created = await createRoute.handler({ ...ctx, input: parsed });
		expect(created.success).toBe(true);

		const listed = await listRoute.handler({ ...ctx, input: {} });
		expect(listed.success).toBe(true);
		expect(listed.data.items).toHaveLength(1);
	});

	it("rejects overlapping terms on create", async () => {
		const createRoute = (plugin as any).routes["terms/create"];

		const baseCtx = makeCtx({
			id: "term-1",
			name: "Semester 1",
			academicYear: "2026/2027",
			locale: "id-ID",
			startDate: "2026-07-01",
			endDate: "2026-12-20",
		});

		await createRoute.handler({ ...baseCtx, input: createRoute.input.parse(baseCtx.input) });

		const overlapInput = {
			id: "term-2",
			name: "Semester 2",
			academicYear: "2026/2027",
			locale: "id-ID",
			startDate: "2026-12-01",
			endDate: "2027-05-10",
		};

		const result = await createRoute.handler({
			...baseCtx,
			input: createRoute.input.parse(overlapInput),
		});

		expect(result.success).toBe(false);
		expect(result.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns public upcoming items", async () => {
		const ctx = makeCtx({}, "http://example.test/?limit=2&locale=id-ID");
		await ctx.storage.terms.put("term-1", {
			id: "term-1",
			name: "Semester 1",
			academicYear: "2026/2027",
			locale: "id-ID",
			startDate: "2026-07-01",
			endDate: "2026-12-20",
		});
		await ctx.storage.exam_windows.put("exam-1", {
			id: "exam-1",
			termId: "term-1",
			title: "UTS",
			kind: "midterm",
			startAt: "2099-09-01T01:00:00.000Z",
			endAt: "2099-09-02T01:00:00.000Z",
		});
		await ctx.storage.events.put("event-1", {
			id: "event-1",
			title: "Hari Batik",
			type: "event",
			locale: "id-ID",
			startAt: "2099-10-02T01:00:00.000Z",
			endAt: "2099-10-02T03:00:00.000Z",
			allDay: false,
		});

		const route = (plugin as any).routes["upcoming/public"];
		const result = await route.handler(ctx);

		expect(result.success).toBe(true);
		expect(Array.isArray(result.data.items)).toBe(true);
		expect(result.data.items.length).toBeGreaterThan(0);
	});
});
