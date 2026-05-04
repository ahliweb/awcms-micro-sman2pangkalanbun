const TYPEGEN_MAX_BYTES = 2_000_000;
const FORBIDDEN_CONTROL_PATTERN = new RegExp(
	"[" +
	String.fromCodePoint(0x0000) +
	String.fromCodePoint(0x0001) + "-" + String.fromCodePoint(0x0008) +
	String.fromCodePoint(0x000B) +
	String.fromCodePoint(0x000C) +
	String.fromCodePoint(0x000E) + "-" + String.fromCodePoint(0x001F) +
	String.fromCodePoint(0x007F) +
	"]"
);
const SCHEMA_JSON_MAX_BYTES = 2_000_000;

/**
 * Guard typegen payloads before writing them to disk.
 */
export function validateGeneratedTypesPayload(
	types: string,
): { ok: true } | { ok: false; reason: string } {
	if (types.length > TYPEGEN_MAX_BYTES) {
		return { ok: false, reason: "Schema types payload is unexpectedly large" };
	}
	if (!types.includes("declare")) {
		return { ok: false, reason: "Schema types payload is invalid" };
	}
	if (FORBIDDEN_CONTROL_PATTERN.test(types)) {
		return { ok: false, reason: "Schema types payload contains control characters" };
	}
	return { ok: true };
}

/**
 * Guard schema export payloads before writing them to disk.
 */
export function validateSchemaExportPayload(
	schema: unknown,
): { ok: true; serialized: string } | { ok: false; reason: string } {
	if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
		return { ok: false, reason: "Schema export payload is invalid" };
	}

	const record = schema as Record<string, unknown>;
	if (!Array.isArray(record.collections)) {
		return { ok: false, reason: "Schema export payload is invalid" };
	}
	if (typeof record.version !== "number") {
		return { ok: false, reason: "Schema export payload is invalid" };
	}

	const serialized = JSON.stringify(schema, null, 2);
	if (serialized.length > SCHEMA_JSON_MAX_BYTES) {
		return { ok: false, reason: "Schema export payload is unexpectedly large" };
	}

	return { ok: true, serialized };
}
