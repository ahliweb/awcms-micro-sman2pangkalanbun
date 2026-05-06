import { definePlugin } from "emdash";
import { z } from "zod";

import {
	type AcademicTerm,
	type CalendarEvent,
	type ExamWindow,
	type ValidationResult,
	getUpcomingItems,
	validateCalendarModel,
} from "./schema.js";

const termInputSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	academicYear: z.string().min(4),
	locale: z.string().min(2).default("id-ID"),
	startDate: z.string().min(10),
	endDate: z.string().min(10),
});

const examInputSchema = z.object({
	id: z.string().min(1),
	termId: z.string().min(1),
	title: z.string().min(1),
	kind: z.enum(["midterm", "final", "assessment"]),
	startAt: z.string().datetime({ offset: true }),
	endAt: z.string().datetime({ offset: true }),
});

const eventInputSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	type: z.enum(["holiday", "event"]),
	locale: z.string().min(2).default("id-ID"),
	startAt: z.string().datetime({ offset: true }),
	endAt: z.string().datetime({ offset: true }).optional(),
	allDay: z.boolean().default(false),
});

const deleteInputSchema = z.object({ id: z.string().min(1) });

function asErrorResult(message: string) {
	return {
		success: false as const,
		error: { code: "VALIDATION_ERROR", message },
	};
}

type StorageItem = { id: string; data: unknown };

async function loadModel(ctx: any) {
	const [termsRes, examsRes, eventsRes] = await Promise.all([
		ctx.storage.terms.query({ limit: 500 }),
		ctx.storage.exam_windows.query({ limit: 500 }),
		ctx.storage.events.query({ limit: 500 }),
	]);

	return {
		terms: termsRes.items.map((i: StorageItem) => i.data) as AcademicTerm[],
		examWindows: examsRes.items.map((i: StorageItem) => i.data) as ExamWindow[],
		events: eventsRes.items.map((i: StorageItem) => i.data) as CalendarEvent[],
	};
}

function validateOrError(model: unknown): ValidationResult {
	return validateCalendarModel(model);
}

export default definePlugin({
	routes: {
		"upcoming/public": {
			public: true,
			handler: async (ctx: any) => {
				const url = new URL(ctx.request.url);
				const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "5", 10);
				const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 20)) : 5;
				const locale = url.searchParams.get("locale") ?? undefined;
				const model = await loadModel(ctx);
				const filteredModel = locale
					? {
							...model,
							events: model.events.filter((event) => event.locale === locale),
						}
					: model;
				const items = getUpcomingItems(filteredModel, new Date().toISOString(), limit);
				return { success: true, data: { items } };
			},
		},
		admin: {
			handler: async (ctx: any) => {
				const interaction = ctx.input as { type?: string; page?: string };
				if (interaction.type === "page_load" && interaction.page === "/calendar") {
					return {
						blocks: [
							{ type: "header", text: "Academic Calendar" },
							{ type: "context", text: "Manage terms, exams, and events." },
						],
					};
				}
				if (interaction.type === "page_load" && interaction.page === "widget:upcoming-calendar") {
					const model = await loadModel(ctx);
					const upcoming = getUpcomingItems(model, new Date().toISOString(), 5);
					return {
						blocks: [
							{ type: "header", text: "Upcoming" },
							{
								type: "fields",
								fields: upcoming.map((item) => ({ label: item.kind, value: item.title })),
							},
						],
					};
				}
				return { blocks: [] };
			},
		},
		"terms/list": {
			handler: async (ctx: any) => {
				const result = await ctx.storage.terms.query({ orderBy: { startDate: "asc" }, limit: 200 });
				return { success: true, data: { items: result.items.map((i: StorageItem) => i.data) } };
			},
		},
		"terms/create": {
			input: termInputSchema,
			handler: async (ctx: any) => {
				await ctx.storage.terms.put(ctx.input.id, ctx.input);
				const validation = validateOrError(await loadModel(ctx));
				if (!validation.ok) {
					await ctx.storage.terms.delete(ctx.input.id);
					return asErrorResult(validation.errors.join("; "));
				}
				return { success: true, data: ctx.input };
			},
		},
		"terms/update": {
			input: termInputSchema,
			handler: async (ctx: any) => {
				const previous = await ctx.storage.terms.get(ctx.input.id);
				await ctx.storage.terms.put(ctx.input.id, ctx.input);
				const validation = validateOrError(await loadModel(ctx));
				if (!validation.ok) {
					if (previous) {
						await ctx.storage.terms.put(ctx.input.id, previous);
					}
					return asErrorResult(validation.errors.join("; "));
				}
				return { success: true, data: ctx.input };
			},
		},
		"terms/delete": {
			input: deleteInputSchema,
			handler: async (ctx: any) => {
				await ctx.storage.terms.delete(ctx.input.id);
				return { success: true, data: { id: ctx.input.id } };
			},
		},
		"exam-windows/list": {
			handler: async (ctx: any) => {
				const result = await ctx.storage.exam_windows.query({
					orderBy: { startAt: "asc" },
					limit: 200,
				});
				return { success: true, data: { items: result.items.map((i: StorageItem) => i.data) } };
			},
		},
		"exam-windows/create": {
			input: examInputSchema,
			handler: async (ctx: any) => {
				await ctx.storage.exam_windows.put(ctx.input.id, ctx.input);
				const validation = validateOrError(await loadModel(ctx));
				if (!validation.ok) {
					await ctx.storage.exam_windows.delete(ctx.input.id);
					return asErrorResult(validation.errors.join("; "));
				}
				return { success: true, data: ctx.input };
			},
		},
		"exam-windows/update": {
			input: examInputSchema,
			handler: async (ctx: any) => {
				const previous = await ctx.storage.exam_windows.get(ctx.input.id);
				await ctx.storage.exam_windows.put(ctx.input.id, ctx.input);
				const validation = validateOrError(await loadModel(ctx));
				if (!validation.ok) {
					if (previous) {
						await ctx.storage.exam_windows.put(ctx.input.id, previous);
					}
					return asErrorResult(validation.errors.join("; "));
				}
				return { success: true, data: ctx.input };
			},
		},
		"exam-windows/delete": {
			input: deleteInputSchema,
			handler: async (ctx: any) => {
				await ctx.storage.exam_windows.delete(ctx.input.id);
				return { success: true, data: { id: ctx.input.id } };
			},
		},
		"events/list": {
			handler: async (ctx: any) => {
				const result = await ctx.storage.events.query({ orderBy: { startAt: "asc" }, limit: 200 });
				return { success: true, data: { items: result.items.map((i: StorageItem) => i.data) } };
			},
		},
		"events/create": {
			input: eventInputSchema,
			handler: async (ctx: any) => {
				await ctx.storage.events.put(ctx.input.id, ctx.input);
				const validation = validateOrError(await loadModel(ctx));
				if (!validation.ok) {
					await ctx.storage.events.delete(ctx.input.id);
					return asErrorResult(validation.errors.join("; "));
				}
				return { success: true, data: ctx.input };
			},
		},
		"events/update": {
			input: eventInputSchema,
			handler: async (ctx: any) => {
				const previous = await ctx.storage.events.get(ctx.input.id);
				await ctx.storage.events.put(ctx.input.id, ctx.input);
				const validation = validateOrError(await loadModel(ctx));
				if (!validation.ok) {
					if (previous) {
						await ctx.storage.events.put(ctx.input.id, previous);
					}
					return asErrorResult(validation.errors.join("; "));
				}
				return { success: true, data: ctx.input };
			},
		},
		"events/delete": {
			input: deleteInputSchema,
			handler: async (ctx: any) => {
				await ctx.storage.events.delete(ctx.input.id);
				return { success: true, data: { id: ctx.input.id } };
			},
		},
	},
	hooks: {
		"page:metadata": {
			handler: async (_event: unknown, ctx: any) => {
				return {
					kind: "link",
					rel: "alternate",
					href: ctx.url(`/_emdash/api/plugins/${ctx.plugin.id}/upcoming/public?limit=5`),
					key: "academic-calendar-upcoming-feed",
				};
			},
		},
	},
});
