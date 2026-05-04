import { PluginRouteError, definePlugin } from "emdash";
import { z } from "zod";

const studentListSchema = z.object({
	limit: z.number().int().min(1).max(100).optional(),
	cursor: z.string().min(1).optional(),
});

const studentByNisnSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
});

const gateSessionStartSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
});

const gateSessionResolveSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
	accessToken: z.string().trim().min(8),
});

const documentAccessSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
	accessToken: z.string().trim().min(8).optional(),
	eventType: z.enum(["opened", "downloaded"]),
});

const documentAccessAdminSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
	eventType: z.enum(["opened", "downloaded"]),
});

const studentUpsertSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
	name: z.string().trim().min(1).max(200),
	pdfMediaId: z.string().trim().min(1),
	pdfFilename: z.string().trim().min(1).max(255),
});

type StudentRecord = {
	nisn: string;
	name: string;
	pdfMediaId: string;
	pdfFilename: string;
	createdAt: string;
};

type DocumentEventRecord = {
	studentId: string;
	eventType: "opened" | "downloaded";
	createdAt: string;
};

type GateSession = {
	token: string;
	expiresAt: string;
	issuedIp: string | null;
	issuedUserAgent: string | null;
};

type RateLimitState = {
	attempts: string[];
	lockedUntil?: string;
};

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LOCK_MS = 15 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 20;

function nowIso() {
	return new Date().toISOString();
}

function toTime(value: string | undefined | null) {
	if (!value) return 0;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeIp(ip: string | null) {
	if (!ip) return "unknown";
	return ip.trim().toLowerCase() || "unknown";
}

function rateKey(ip: string | null) {
	return `gate-rate:${sanitizeIp(ip)}`;
}

function makeEventId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeAccessToken() {
	const randomPart = Math.random().toString(36).slice(2, 10);
	return `${Date.now().toString(36)}-${randomPart}`;
}

async function findStudentByNisn(ctx: any, nisn: string): Promise<StudentRecord | null> {
	const result = await ctx.storage.students.query({
		where: { nisn },
		limit: 1,
	});
	if (!result.items[0]) return null;
	return result.items[0].data as StudentRecord;
}

async function isValidGateSession(ctx: any, nisn: string, accessToken: string | undefined) {
	if (!accessToken) return false;
	const gate = (await ctx.kv.get(`gate-session:${nisn}`)) as GateSession | null;
	if (!gate) return false;
	if (gate.token !== accessToken) return false;
	if (new Date(gate.expiresAt).getTime() <= Date.now()) return false;

	const requestIp = sanitizeIp(ctx.requestMeta?.ip ?? null);
	const gateIp = sanitizeIp(gate.issuedIp ?? null);
	if (gateIp !== "unknown" && requestIp !== gateIp) return false;

	const requestUserAgent = (ctx.requestMeta?.userAgent ?? "").trim();
	if (gate.issuedUserAgent && requestUserAgent && gate.issuedUserAgent !== requestUserAgent) {
		return false;
	}

	return true;
}

async function recordDocumentEvent(ctx: any, student: StudentRecord, eventType: "opened" | "downloaded", actorType: "public" | "admin") {
	await ctx.storage.document_events.put(makeEventId(), {
		studentId: student.nisn,
		nisn: student.nisn,
		studentName: student.name,
		pdfFilename: student.pdfFilename,
		eventType,
		actorType,
		createdAt: nowIso(),
	});
}

async function buildTelemetrySummary(ctx: any, studentIds: string[]) {
	if (!studentIds.length) return new Map<string, {
		openedCount: number;
		downloadedCount: number;
		lastOpenedAt: string | null;
		lastDownloadedAt: string | null;
	}>();

	const events = await ctx.storage.document_events.query({
		orderBy: { createdAt: "desc" },
		limit: 5000,
	});

	const wanted = new Set(studentIds);
	const summary = new Map<string, {
		openedCount: number;
		downloadedCount: number;
		lastOpenedAt: string | null;
		lastDownloadedAt: string | null;
	}>();

	for (const id of studentIds) {
		summary.set(id, {
			openedCount: 0,
			downloadedCount: 0,
			lastOpenedAt: null,
			lastDownloadedAt: null,
		});
	}

	for (const item of events.items) {
		const event = item.data as DocumentEventRecord;
		if (!wanted.has(event.studentId)) continue;
		const row = summary.get(event.studentId);
		if (!row) continue;

		if (event.eventType === "opened") {
			row.openedCount += 1;
			if (!row.lastOpenedAt) row.lastOpenedAt = event.createdAt;
		} else if (event.eventType === "downloaded") {
			row.downloadedCount += 1;
			if (!row.lastDownloadedAt) row.lastDownloadedAt = event.createdAt;
		}
	}

	return summary;
}

async function startGateSession(ctx: any, nisn: string) {
	const expiresInSeconds = 10 * 60;
	const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
	const token = makeAccessToken();
	const issuedIp = ctx.requestMeta?.ip ?? null;
	const issuedUserAgent = (ctx.requestMeta?.userAgent ?? "").trim() || null;
	await ctx.kv.set(`gate-session:${nisn}`, {
		token,
		expiresAt,
		issuedIp,
		issuedUserAgent,
	});
	return {
		accessToken: token,
		expiresAt,
		expiresInSeconds,
	};
}

async function enforceRateLimit(ctx: any) {
	const key = rateKey(ctx.requestMeta?.ip ?? null);
	const now = Date.now();
	const state = ((await ctx.kv.get(key)) as RateLimitState | null) ?? { attempts: [] };

	if (state.lockedUntil && toTime(state.lockedUntil) > now) {
		throw PluginRouteError.forbidden("Unable to verify NISN");
	}

	const attempts = state.attempts.filter((ts) => now - toTime(ts) < RATE_WINDOW_MS);
	if (attempts.length >= RATE_MAX_ATTEMPTS) {
		await ctx.kv.set(key, {
			attempts,
			lockedUntil: new Date(now + RATE_LOCK_MS).toISOString(),
		});
		throw PluginRouteError.forbidden("Unable to verify NISN");
	}

	attempts.push(new Date(now).toISOString());
	await ctx.kv.set(key, { attempts });
}

export default definePlugin({
	routes: {
		admin: {
			handler: async (routeCtx: any) => {
				const interaction = routeCtx.input as { type?: string; page?: string };
				if (interaction.type === "page_load" && interaction.page === "/kelulusan") {
					return {
						blocks: [
							{ type: "header", text: "Kelulusan" },
							{
								type: "context",
								text: "Kelulusan admin scaffold is active. Student list and telemetry will be added in follow-up issues.",
							},
						],
					};
				}

				return { blocks: [] };
			},
		},
		"students/list": {
			input: studentListSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				const result = await ctx.storage.students.query({
					orderBy: { createdAt: "desc" },
					limit: ctx.input.limit ?? 50,
					cursor: ctx.input.cursor,
				});
				const students = result.items.map((item: any) => item.data as StudentRecord);
				const telemetry = await buildTelemetrySummary(
					ctx,
					students.map((student: StudentRecord) => student.nisn),
				);

				return {
					items: students.map((student: StudentRecord) => {
						const t = telemetry.get(student.nisn);
						return {
							...student,
							openedCount: t?.openedCount ?? 0,
							downloadedCount: t?.downloadedCount ?? 0,
							lastOpenedAt: t?.lastOpenedAt ?? null,
							lastDownloadedAt: t?.lastDownloadedAt ?? null,
						};
					}),
					nextCursor: result.cursor,
				};
			},
		},
		"students/upsert": {
			input: studentUpsertSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				const record: StudentRecord = {
					nisn: ctx.input.nisn,
					name: ctx.input.name,
					pdfMediaId: ctx.input.pdfMediaId,
					pdfFilename: ctx.input.pdfFilename,
					createdAt: nowIso(),
				};

				await ctx.storage.students.put(record.nisn, record);
				return record;
			},
		},
		"students/get-by-nisn": {
			input: studentByNisnSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					throw PluginRouteError.notFound("Student record not found");
				}

				return {
					nisn: student.nisn,
					name: student.name,
					pdfFilename: student.pdfFilename,
				};
			},
		},
		"gate/session/start": {
			public: true,
			input: gateSessionStartSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				await enforceRateLimit(ctx);

				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					ctx.log.warn("Kelulusan NISN verification rejected", {
						reason: "invalid_nisn",
						ip: sanitizeIp(ctx.requestMeta?.ip ?? null),
					});
					throw PluginRouteError.badRequest("Unable to verify NISN");
				}

				const session = await startGateSession(ctx, student.nisn);

				return {
					nisn: student.nisn,
					name: student.name,
					pdfFilename: student.pdfFilename,
					...session,
				};
			},
		},
		"gate/session/resolve": {
			public: true,
			input: gateSessionResolveSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					throw PluginRouteError.notFound("Student record not found");
				}

				const authorized = await isValidGateSession(ctx, student.nisn, ctx.input.accessToken);
				if (!authorized) {
					throw PluginRouteError.forbidden("Invalid or expired access token");
				}

				return {
					nisn: student.nisn,
					name: student.name,
					pdfFilename: student.pdfFilename,
				};
			},
		},
		"documents/access/public": {
			public: true,
			input: documentAccessSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					throw PluginRouteError.notFound("Student record not found");
				}

				const authorized = await isValidGateSession(ctx, student.nisn, ctx.input.accessToken);
				if (!authorized) {
					throw PluginRouteError.forbidden("Invalid or expired access token");
				}

				if (!ctx.media) {
					throw PluginRouteError.internal("Media access is not available");
				}

				const media = await ctx.media.get(student.pdfMediaId);
				if (!media) {
					throw PluginRouteError.notFound("Student document not found");
				}

				await recordDocumentEvent(ctx, student, ctx.input.eventType, "public");

				return {
					nisn: student.nisn,
					name: student.name,
					pdfFilename: student.pdfFilename,
					pdfUrl: media.url,
					eventType: ctx.input.eventType,
				};
			},
		},
		"documents/access/admin": {
			input: documentAccessAdminSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					throw PluginRouteError.notFound("Student record not found");
				}

				if (!ctx.media) {
					throw PluginRouteError.internal("Media access is not available");
				}

				const media = await ctx.media.get(student.pdfMediaId);
				if (!media) {
					throw PluginRouteError.notFound("Student document not found");
				}

				await recordDocumentEvent(ctx, student, ctx.input.eventType, "admin");

				return {
					nisn: student.nisn,
					name: student.name,
					pdfFilename: student.pdfFilename,
					pdfUrl: media.url,
					eventType: ctx.input.eventType,
				};
			},
		},
	},
});
