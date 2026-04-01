import { describe, it, expect } from "vitest";

import { generatePlaceholder } from "../../../src/media/placeholder.js";

const CSS_RGB_PATTERN = /^rgb\(\d+,\s?\d+,\s?\d+\)$/;

/** Minimal 4x4 solid red JPEG */
const JPEG_4x4 = Buffer.from(
	"/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAAHCf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ADoDFU3/2Q==",
	"base64",
);

/** Minimal 4x4 solid red PNG */
const PNG_4x4 = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAQAAAAEAQMAAACTPww9AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURf8AAP///0EdNBEAAAABYktHRAH/Ai3eAAAAB3RJTUUH6gIcETMVn1ZhnwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wMi0yOFQxNzo1MToyMCswMDowMJE6EiQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjYtMDItMjhUMTc6NTE6MjArMDA6MDDgZ6qYAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTAyLTI4VDE3OjUxOjIwKzAwOjAwt3KLRwAAAAtJREFUCNdjYIAAAAAIAAEvIN0xAAAAAElFTkSuQmCC",
	"base64",
);

/** 100x100 solid blue JPEG (for downsampling test) */
const JPEG_100x100 = Buffer.from(
	"/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCABkAGQDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAYJ/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Anu1TQ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//2Q==",
	"base64",
);

describe("generatePlaceholder", () => {
	it("generates blurhash and dominantColor from a JPEG", async () => {
		const result = await generatePlaceholder(new Uint8Array(JPEG_4x4), "image/jpeg");

		expect(result).not.toBeNull();
		expect(result!.blurhash).toBeTruthy();
		expect(typeof result!.blurhash).toBe("string");
		expect(result!.dominantColor).toBeTruthy();
		expect(typeof result!.dominantColor).toBe("string");
	});

	it("generates blurhash and dominantColor from a PNG", async () => {
		const result = await generatePlaceholder(new Uint8Array(PNG_4x4), "image/png");

		expect(result).not.toBeNull();
		expect(result!.blurhash).toBeTruthy();
		expect(result!.dominantColor).toBeTruthy();
	});

	it("returns a valid CSS color string for dominantColor", async () => {
		const result = await generatePlaceholder(new Uint8Array(JPEG_4x4), "image/jpeg");

		expect(result).not.toBeNull();
		// Should be rgb() format from rgbColorToCssString
		expect(result!.dominantColor).toMatch(CSS_RGB_PATTERN);
	});

	it("returns null for non-image MIME types", async () => {
		const buffer = new Uint8Array([0, 1, 2, 3]);
		const result = await generatePlaceholder(buffer, "application/pdf");

		expect(result).toBeNull();
	});

	it("returns null for unsupported image types", async () => {
		const buffer = new Uint8Array([0, 1, 2, 3]);
		const result = await generatePlaceholder(buffer, "image/svg+xml");

		expect(result).toBeNull();
	});

	it("returns null for corrupt image data", async () => {
		const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0]);
		const result = await generatePlaceholder(buffer, "image/jpeg");

		expect(result).toBeNull();
	});

	it("handles larger images by downsampling", async () => {
		const result = await generatePlaceholder(new Uint8Array(JPEG_100x100), "image/jpeg");

		expect(result).not.toBeNull();
		expect(result!.blurhash).toBeTruthy();
		// Blurhash string length should be reasonable (not huge from 100x100)
		expect(result!.blurhash.length).toBeLessThan(50);
	});
});
