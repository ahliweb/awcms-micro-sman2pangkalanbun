import { definePlugin } from "emdash";
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

const documentAccessSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
	accessToken: z.string().trim().min(8).optional(),
	eventType: z.enum(["opened", "downloaded"]),
});

const documentAccessAdminSchema = z.object({
	nisn: z.string().trim().min(6).max(32),
	eventType: z.enum(["opened", "downloaded"]),
});

type StudentRecord = {
	nisn: string;
	name: string;
	pdfMediaId: string;
	pdfFilename: string;
	createdAt: string;
};

type GateSession = {
	token: string;
	expiresAt: string;
};

function apiError(code: string, message: string) {
	return {
		success: false as const,
		error: { code, message },
	};
}

function nowIso() {
	return new Date().toISOString();
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
	return new Date(gate.expiresAt).getTime() > Date.now();
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

async function startGateSession(ctx: any, nisn: string) {
	const expiresInSeconds = 15 * 60;
	const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
	const token = makeAccessToken();
	await ctx.kv.set(`gate-session:${nisn}`, {
		token,
		expiresAt,
	});
	return {
		accessToken: token,
		expiresAt,
		expiresInSeconds,
	};
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
			handler: async (ctx: any) => {
				const result = await ctx.storage.students.query({
					orderBy: { createdAt: "desc" },
					limit: ctx.input.limit ?? 50,
					cursor: ctx.input.cursor,
				});
				return {
					success: true,
					data: {
						items: result.items.map((item: any) => item.data),
						nextCursor: result.cursor,
					},
				};
			},
		},
		"students/get-by-nisn": {
			public: true,
			input: studentByNisnSchema,
			handler: async (ctx: any) => {
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					return apiError("NOT_FOUND", "Student record not found");
				}

				return {
					success: true,
					data: {
						nisn: student.nisn,
						name: student.name,
						pdfFilename: student.pdfFilename,
					},
				};
			},
		},
		"gate/session/start": {
			public: true,
			input: gateSessionStartSchema,
			handler: async (ctx: any) => {
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					return apiError("INVALID_NISN", "NISN is not valid");
				}

				const session = await startGateSession(ctx, student.nisn);

				return {
					success: true,
					data: {
						nisn: student.nisn,
						name: student.name,
						pdfFilename: student.pdfFilename,
						...session,
					},
				};
			},
		},
		"documents/access/public": {
			public: true,
			input: documentAccessSchema,
			handler: async (ctx: any) => {
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					return apiError("NOT_FOUND", "Student record not found");
				}

				const authorized = await isValidGateSession(ctx, student.nisn, ctx.input.accessToken);
				if (!authorized) {
					return apiError("UNAUTHORIZED", "Invalid or expired access token");
				}

				if (!ctx.media) {
					return apiError("MEDIA_NOT_AVAILABLE", "Media access is not available");
				}

				const media = await ctx.media.get(student.pdfMediaId);
				if (!media) {
					return apiError("NOT_FOUND", "Student document not found");
				}

				await recordDocumentEvent(ctx, student, ctx.input.eventType, "public");

				return {
					success: true,
					data: {
						nisn: student.nisn,
						name: student.name,
						pdfFilename: student.pdfFilename,
						pdfUrl: media.url,
						eventType: ctx.input.eventType,
					},
				};
			},
		},
		"documents/access/admin": {
			input: documentAccessAdminSchema,
			handler: async (ctx: any) => {
				const student = await findStudentByNisn(ctx, ctx.input.nisn);
				if (!student) {
					return apiError("NOT_FOUND", "Student record not found");
				}

				if (!ctx.media) {
					return apiError("MEDIA_NOT_AVAILABLE", "Media access is not available");
				}

				const media = await ctx.media.get(student.pdfMediaId);
				if (!media) {
					return apiError("NOT_FOUND", "Student document not found");
				}

				await recordDocumentEvent(ctx, student, ctx.input.eventType, "admin");

				return {
					success: true,
					data: {
						nisn: student.nisn,
						name: student.name,
						pdfFilename: student.pdfFilename,
						pdfUrl: media.url,
						eventType: ctx.input.eventType,
					},
				};
			},
		},
	},
});
