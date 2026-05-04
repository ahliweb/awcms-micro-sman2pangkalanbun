const TYPEGEN_MAX_BYTES = 2_000_000;
const FORBIDDEN_CONTROL_PATTERN = /[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/**
 * Guard typegen payloads before writing them to disk.
 */
export function validateGeneratedTypesPayload(types: string): { ok: true } | { ok: false; reason: string } {
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
