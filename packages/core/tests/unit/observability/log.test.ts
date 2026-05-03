import { beforeEach, describe, expect, it, vi } from "vitest";

import { logEvent } from "../../../src/observability/log.js";

describe("logEvent", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("writes structured JSON payloads", () => {
		const spy = vi.spyOn(console, "info").mockImplementation(() => {});

		logEvent("info", {
			event: "test.event",
			context: { path: "/_emdash/api/content/posts" },
		});

		expect(spy).toHaveBeenCalledOnce();
		const raw = spy.mock.calls[0]?.[0];
		expect(typeof raw).toBe("string");
		const payload = JSON.parse(String(raw)) as Record<string, unknown>;
		expect(payload.scope).toBe("emdash");
		expect(payload.level).toBe("info");
		expect(payload.event).toBe("test.event");
	});

	it("redacts sensitive context keys", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		logEvent("error", {
			event: "api.handle_error",
			context: {
				authorization: "Bearer secret",
				nested: { tokenValue: "abc", normal: "ok" },
			},
			error: new Error("boom"),
		});

		const payload = JSON.parse(String(spy.mock.calls[0]?.[0])) as Record<string, unknown>;
		const context = payload.context as Record<string, unknown>;
		expect(context.authorization).toBe("[REDACTED]");
		expect((context.nested as Record<string, unknown>).tokenValue).toBe("[REDACTED]");
		expect((context.nested as Record<string, unknown>).normal).toBe("ok");
	});
});
