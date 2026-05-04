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

const importTemplateSchema = z.object({
	rows: z
		.array(
			z.object({
				nisn: z.string().trim().min(6).max(32),
				name: z.string().trim().min(1).max(200),
				filename: z.string().trim().min(1).max(255),
			}),
		)
		.min(1)
		.max(1000),
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
const PUBLIC_EVENT_DEDUPE_MS = 5 * 1000;

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

async function recordDocumentEvent(
	ctx: any,
	student: StudentRecord,
	eventType: "opened" | "downloaded",
	actorType: "public" | "admin",
) {
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

async function shouldRecordPublicEvent(
	ctx: any,
	studentNisn: string,
	eventType: "opened" | "downloaded",
	accessToken: string,
): Promise<boolean> {
	const key = `event-dedupe:${studentNisn}:${eventType}:${accessToken}`;
	const last = (await ctx.kv.get(key)) as string | null;
	const now = Date.now();
	if (last) {
		const age = now - toTime(last);
		if (age >= 0 && age < PUBLIC_EVENT_DEDUPE_MS) return false;
	}
	await ctx.kv.set(key, new Date(now).toISOString());
	return true;
}

async function buildTelemetrySummary(ctx: any, studentIds: string[]) {
	if (!studentIds.length)
		return new Map<
			string,
			{
				openedCount: number;
				downloadedCount: number;
				lastOpenedAt: string | null;
				lastDownloadedAt: string | null;
			}
		>();

	const events = await ctx.storage.document_events.query({
		orderBy: { createdAt: "desc" },
		limit: 5000,
	});

	const wanted = new Set(studentIds);
	const summary = new Map<
		string,
		{
			openedCount: number;
			downloadedCount: number;
			lastOpenedAt: string | null;
			lastDownloadedAt: string | null;
		}
	>();

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

async function listStudentsWithTelemetry(ctx: any, limit: number, cursor?: string) {
	const result = await ctx.storage.students.query({
		orderBy: { createdAt: "desc" },
		limit,
		cursor,
	});
	const students = result.items.map((item: any) => item.data as StudentRecord);
	const telemetry = await buildTelemetrySummary(
		ctx,
		students.map((student: StudentRecord) => student.nisn),
	);

	const items = students.map((student: StudentRecord) => {
		const t = telemetry.get(student.nisn);
		return {
			...student,
			openedCount: t?.openedCount ?? 0,
			downloadedCount: t?.downloadedCount ?? 0,
			lastOpenedAt: t?.lastOpenedAt ?? null,
			lastDownloadedAt: t?.lastDownloadedAt ?? null,
		};
	});

	return { items, nextCursor: result.cursor };
}

function buildAdminBlocks(
	items: Array<
		StudentRecord & {
			openedCount: number;
			downloadedCount: number;
			lastOpenedAt: string | null;
			lastDownloadedAt: string | null;
		}
	>,
	selectedNisn?: string,
	eventType: "opened" | "downloaded" = "opened",
	banner?: { title: string; description: string },
	childBlocks?: Array<Record<string, unknown>>,
) {
	const options = items.map((item) => ({
		label: `${item.nisn} - ${item.name}`,
		value: item.nisn,
	}));

	const blocks: Array<Record<string, unknown>> = [];
	if (banner) {
		blocks.push({
			type: "banner",
			variant: "default",
			title: banner.title,
			description: banner.description,
		});
	}

	const totalOpened = items.reduce((sum, item) => sum + item.openedCount, 0);
	const totalDownloaded = items.reduce((sum, item) => sum + item.downloadedCount, 0);

	blocks.push(
		{ type: "header", text: "Kelulusan SKL 2025/2026" },
		{
			type: "context",
			text: `${items.length} siswa terdaftar. Total dibuka: ${totalOpened} · Total diunduh: ${totalDownloaded}`,
		},
	);

	if (childBlocks) {
		blocks.push(...childBlocks);
	}

	blocks.push(
		{ type: "divider" },
		{
			type: "table",
			blockId: "kelulusan-students",
			columns: [
				{ key: "nisn", label: "NISN", format: "code" },
				{ key: "name", label: "Nama", format: "text" },
				{ key: "pdfFilename", label: "File PDF", format: "text" },
				{ key: "openedCount", label: "Dibuka", format: "badge" },
				{ key: "downloadedCount", label: "Diunduh", format: "badge" },
			],
			rows: items,
			emptyText: "Belum ada data siswa.",
		},
		{
			type: "form",
			block_id: "kelulusan-admin-action",
			fields: [
				{
					type: "select",
					action_id: "nisn",
					label: "Pilih siswa",
					options,
					initial_value: selectedNisn ?? options[0]?.value,
				},
				{
					type: "select",
					action_id: "eventType",
					label: "Aksi dokumen",
					options: [
						{ label: "Buka PDF", value: "opened" },
						{ label: "Unduh PDF", value: "downloaded" },
					],
					initial_value: eventType,
				},
			],
			submit: { label: "Ambil URL PDF", action_id: "open_document" },
		},
	);

	return { blocks };
}

function buildImportBlocks(existingCount: number, banner?: { title: string; description: string }) {
	const blocks: Array<Record<string, unknown>> = [];
	if (banner) {
		blocks.push({
			type: "banner",
			variant:
				banner.title.includes("berhasil") || banner.title.includes("Berhasil")
					? "default"
					: "error",
			title: banner.title,
			description: banner.description,
		});
	}

	blocks.push(
		{ type: "header", text: "Import Data Siswa" },
		{
			type: "context",
			text: `Gunakan template: | No | NISN | Nama Peserta Didik | File PDF |. Data yang sudah ada (${existingCount} siswa) akan diperbarui berdasarkan NISN. Upload folder SKL-2026 ke R2 terlebih dahulu, lalu import data di bawah.`,
		},
		{ type: "divider" },
		{
			type: "form",
			block_id: "kelulusan-import",
			fields: [
				{
					type: "text_input",
					action_id: "template",
					label: "Template data (paste dari SKL-DATA.md)",
					multiline: true,
					placeholder:
						"| No | NISN | Nama Peserta Didik | File PDF |\n| 1 | 0051718871 | EVA ELISTIANI | SKL-0051718871-SMAN 2 PANGKALAN BUN-2026.pdf |",
				},
			],
			submit: { label: "Import data", action_id: "import_template" },
		},
	);

	return { blocks };
}

const NISN_PATTERN = /^\d{7,}$/;

function parseTemplateRows(input: string): Array<{ nisn: string; name: string; filename: string }> {
	const rows: Array<{ nisn: string; name: string; filename: string }> = [];
	const lines = input.split("\n");

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("|")) continue;
		if (trimmed.includes("---")) continue;
		if (trimmed.includes("No") && trimmed.includes("NISN") && trimmed.includes("Nama")) continue;

		const cols = trimmed
			.split("|")
			.map((c) => c.trim())
			.filter(Boolean);
		if (cols.length < 4) continue;

		const nisn = cols[1];
		const name = cols[2];
		const filename = cols[3];

		if (!nisn || !name || !filename) continue;
		if (!NISN_PATTERN.test(nisn)) continue;

		rows.push({ nisn, name, filename });
	}

	return rows;
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
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				const interaction = routeCtx.input as {
					type?: string;
					page?: string;
					action_id?: string;
					values?: Record<string, unknown>;
				};

				if (interaction.type === "page_load") {
					const listed = await listStudentsWithTelemetry(ctx, 200);

					const importSection = {
						type: "section" as const,
						fields: [
							{
								type: "button",
								action_id: "show_import",
								label: "Import Data Siswa",
								style: "primary",
							},
						],
					};

					return {
						...buildAdminBlocks(listed.items),
						blocks: [
							...(buildAdminBlocks(listed.items).blocks || []),
							{ type: "divider" },
							importSection,
						],
					};
				}

				if (interaction.type === "form_submit" && interaction.action_id === "import_template") {
					const template =
						typeof interaction.values?.template === "string" ? interaction.values.template : "";
					if (!template.trim()) {
						const listed = await listStudentsWithTelemetry(ctx, 200);
						return {
							blocks: [
								...buildImportBlocks(listed.items.length, {
									title: "Error",
									description: "Template data kosong. Silakan paste data dari SKL-DATA.md.",
								}).blocks,
							],
						};
					}

					const rows = parseTemplateRows(template);
					if (!rows.length) {
						const listed = await listStudentsWithTelemetry(ctx, 200);
						return {
							blocks: [
								...buildImportBlocks(listed.items.length, {
									title: "Error",
									description:
										"Tidak dapat membaca data. Pastikan format: | No | NISN | Nama | File PDF |",
								}).blocks,
							],
						};
					}

					let imported = 0;
					for (const row of rows) {
						await ctx.storage.students.put(row.nisn, {
							nisn: row.nisn,
							name: row.name,
							pdfMediaId: `SKL-2026/${row.filename}`,
							pdfFilename: row.filename,
							createdAt: nowIso(),
						});
						imported++;
					}

					const listed = await listStudentsWithTelemetry(ctx, 200);
					return {
						blocks: [
							...buildImportBlocks(listed.items.length, {
								title: "Import Berhasil",
								description: `${imported} dari ${rows.length} data siswa berhasil diimpor. Total: ${listed.items.length} siswa.`,
							}).blocks,
							{ type: "divider" },
							...buildAdminBlocks(listed.items).blocks,
						],
						toast: { message: `${imported} siswa berhasil diimpor`, type: "success" },
					};
				}

				if (interaction.type === "interaction" && interaction.action_id === "show_import") {
					const listed = await listStudentsWithTelemetry(ctx, 200);
					return {
						blocks: [
							...buildImportBlocks(listed.items.length).blocks,
							{ type: "divider" },
							...buildAdminBlocks(listed.items).blocks,
						],
					};
				}

				if (interaction.type === "form_submit" && interaction.action_id === "open_document") {
					const nisn = typeof interaction.values?.nisn === "string" ? interaction.values.nisn : "";
					const eventType =
						interaction.values?.eventType === "downloaded" ? "downloaded" : "opened";
					if (!nisn) {
						const listed = await listStudentsWithTelemetry(ctx, 200);
						return {
							...buildAdminBlocks(listed.items, undefined, eventType),
							toast: { message: "Pilih siswa terlebih dahulu", type: "error" },
						};
					}
					const student = await findStudentByNisn(ctx, nisn);
					if (!student) {
						const listed = await listStudentsWithTelemetry(ctx, 200);
						return {
							...buildAdminBlocks(listed.items, nisn, eventType),
							toast: { message: "Data siswa tidak ditemukan", type: "error" },
						};
					}
					if (!ctx.media) {
						throw PluginRouteError.internal("Media access is not available");
					}
					const media = await ctx.media.get(student.pdfMediaId);
					if (!media) {
						const listed = await listStudentsWithTelemetry(ctx, 200);
						return {
							...buildAdminBlocks(listed.items, nisn, eventType),
							toast: {
								message: "Dokumen siswa belum diupload. Upload ke R2: SKL-2026/",
								type: "error",
							},
						};
					}
					await recordDocumentEvent(ctx, student, eventType, "admin");
					const listed = await listStudentsWithTelemetry(ctx, 200);

					return {
						...buildAdminBlocks(listed.items, nisn, eventType, {
							title: "URL PDF tersedia",
							description: `${student.pdfFilename}: ${media.url}`,
						}),
						toast: {
							message:
								eventType === "downloaded"
									? "URL unduh PDF berhasil diambil"
									: "URL buka PDF berhasil diambil",
							type: "success",
						},
					};
				}

				const listed = await listStudentsWithTelemetry(ctx, 200);
				return buildAdminBlocks(listed.items);
			},
		},
		"students/list": {
			input: studentListSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				return listStudentsWithTelemetry(ctx, ctx.input.limit ?? 50, ctx.input.cursor);
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
		"students/import-template": {
			input: importTemplateSchema,
			handler: async (routeCtx: any, pluginCtx: any) => {
				const ctx = { ...pluginCtx, ...routeCtx };
				let imported = 0;
				for (const row of ctx.input.rows) {
					await ctx.storage.students.put(row.nisn, {
						nisn: row.nisn,
						name: row.name,
						pdfMediaId: `SKL-2026/${row.filename}`,
						pdfFilename: row.filename,
						createdAt: nowIso(),
					});
					imported++;
				}
				return { imported, total: ctx.input.rows.length };
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

				if (ctx.media) {
					const media = await ctx.media.get(student.pdfMediaId);
					return {
						nisn: student.nisn,
						name: student.name,
						pdfFilename: student.pdfFilename,
						pdfUrl: media?.url ?? null,
						...session,
					};
				}

				return {
					nisn: student.nisn,
					name: student.name,
					pdfFilename: student.pdfFilename,
					pdfUrl: null,
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

				const shouldRecord = await shouldRecordPublicEvent(
					ctx,
					student.nisn,
					ctx.input.eventType,
					ctx.input.accessToken,
				);
				if (shouldRecord) {
					await recordDocumentEvent(ctx, student, ctx.input.eventType, "public");
				}

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
