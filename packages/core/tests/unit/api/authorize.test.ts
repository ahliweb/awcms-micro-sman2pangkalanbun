import { describe, expect, it } from "vitest";

import { Role } from "@emdash-cms/auth";

import { requireOwnerPerm, requirePerm } from "../../../src/api/authorize.js";

describe("authorize helpers", () => {
	it("returns session-expired message when requirePerm user is missing", async () => {
		const denied = requirePerm(null, "schema:manage");
		expect(denied).not.toBeNull();

		const body = await denied!.json();
		expect(body).toEqual({
			error: {
				code: "UNAUTHORIZED",
				message: "Session expired. Please sign in again.",
			},
		});
	});

	it("returns session-expired message when requireOwnerPerm user is missing", async () => {
		const denied = requireOwnerPerm(null, "owner-1", "content:edit_own", "content:edit_any");
		expect(denied).not.toBeNull();

		const body = await denied!.json();
		expect(body).toEqual({
			error: {
				code: "UNAUTHORIZED",
				message: "Session expired. Please sign in again.",
			},
		});
	});

	it("still returns forbidden for authenticated users without permission", async () => {
		const denied = requirePerm({ id: "user-1", role: Role.AUTHOR }, "schema:manage");
		expect(denied).not.toBeNull();

		const body = await denied!.json();
		expect(body).toEqual({
			error: {
				code: "FORBIDDEN",
				message: "Insufficient permissions",
			},
		});
	});
});
