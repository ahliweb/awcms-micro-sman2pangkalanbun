import { describe, expect, it } from "vitest";

import { getOpenExternalUrlCommand } from "../../../src/cli/open-external-url.js";

describe("getOpenExternalUrlCommand", () => {
	it("returns macOS open command for https urls", () => {
		expect(getOpenExternalUrlCommand("darwin", "https://example.com/verify")).toEqual({
			command: "open",
			args: ["https://example.com/verify"],
		});
	});

	it("returns Windows rundll32 command for http urls", () => {
		expect(getOpenExternalUrlCommand("win32", "http://localhost:4321/dev")).toEqual({
			command: "rundll32.exe",
			args: ["url.dll,FileProtocolHandler", "http://localhost:4321/dev"],
		});
	});

	it("returns xdg-open command for linux-like platforms", () => {
		expect(getOpenExternalUrlCommand("linux", "https://example.com/verify")).toEqual({
			command: "xdg-open",
			args: ["https://example.com/verify"],
		});
	});

	it("rejects non-http schemes", () => {
		expect(getOpenExternalUrlCommand("darwin", "javascript:alert(1)")).toBeNull();
		expect(getOpenExternalUrlCommand("win32", "file:///etc/passwd")).toBeNull();
	});

	it("rejects invalid urls", () => {
		expect(getOpenExternalUrlCommand("linux", "not-a-url")).toBeNull();
	});
});
