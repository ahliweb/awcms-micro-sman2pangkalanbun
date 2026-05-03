type LogLevel = "debug" | "info" | "warn" | "error";

const REDACT_KEYS = [
	"authorization",
	"cookie",
	"set-cookie",
	"password",
	"secret",
	"token",
	"apiKey",
	"apikey",
];

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSensitiveKey(key: string): boolean {
	const lower = key.toLowerCase();
	return REDACT_KEYS.some((item) => lower.includes(item));
}

function redact(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(redact);
	}

	if (!isObject(value)) {
		return value;
	}

	const out: Record<string, unknown> = {};
	for (const [key, item] of Object.entries(value)) {
		if (isSensitiveKey(key)) {
			out[key] = "[REDACTED]";
			continue;
		}
		out[key] = redact(item);
	}
	return out;
}

function serializeError(error: unknown): Record<string, unknown> {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}

	return { message: String(error) };
}

export interface EmDashLogRecord {
	event: string;
	context?: unknown;
	error?: unknown;
}

/**
 * Emit a structured runtime log line for EmDash server code.
 */
export function logEvent(level: LogLevel, record: EmDashLogRecord): void {
	const payload: Record<string, unknown> = {
		ts: new Date().toISOString(),
		scope: "emdash",
		level,
		event: record.event,
	};

	if (record.context !== undefined) {
		payload.context = redact(record.context);
	}

	if (record.error !== undefined) {
		payload.error = redact(serializeError(record.error));
	}

	const line = JSON.stringify(payload);
	if (level === "error") {
		console.error(line);
		return;
	}
	if (level === "warn") {
		console.warn(line);
		return;
	}
	if (level === "info") {
		console.info(line);
		return;
	}
	console.debug(line);
}
