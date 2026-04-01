import type { Kysely } from "kysely";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { BylineRepository } from "../../../../src/database/repositories/byline.js";
import { ContentRepository } from "../../../../src/database/repositories/content.js";
import type { Database } from "../../../../src/database/types.js";
import { setupTestDatabaseWithCollections, teardownTestDatabase } from "../../../utils/test-db.js";

describe("BylineRepository", () => {
	let db: Kysely<Database>;
	let bylineRepo: BylineRepository;
	let contentRepo: ContentRepository;

	beforeEach(async () => {
		db = await setupTestDatabaseWithCollections();
		bylineRepo = new BylineRepository(db);
		contentRepo = new ContentRepository(db);
	});

	afterEach(async () => {
		await teardownTestDatabase(db);
	});

	it("creates and reads bylines", async () => {
		const created = await bylineRepo.create({
			slug: "jane-doe",
			displayName: "Jane Doe",
			isGuest: true,
		});

		expect(created.slug).toBe("jane-doe");
		expect(created.displayName).toBe("Jane Doe");
		expect(created.isGuest).toBe(true);

		const foundById = await bylineRepo.findById(created.id);
		expect(foundById?.id).toBe(created.id);

		const foundBySlug = await bylineRepo.findBySlug("jane-doe");
		expect(foundBySlug?.id).toBe(created.id);

		const foundByUser = await bylineRepo.findByUserId("missing-user");
		expect(foundByUser).toBeNull();
	});

	it("supports updates and paginated listing", async () => {
		const alpha = await bylineRepo.create({
			slug: "alpha",
			displayName: "Alpha Writer",
			isGuest: true,
		});
		await bylineRepo.create({
			slug: "beta",
			displayName: "Beta Writer",
			isGuest: false,
		});

		const updated = await bylineRepo.update(alpha.id, {
			displayName: "Alpha Updated",
			websiteUrl: "https://example.com",
		});
		expect(updated?.displayName).toBe("Alpha Updated");
		expect(updated?.websiteUrl).toBe("https://example.com");

		const searchResult = await bylineRepo.findMany({ search: "Beta" });
		expect(searchResult.items).toHaveLength(1);
		expect(searchResult.items[0]?.slug).toBe("beta");

		const page1 = await bylineRepo.findMany({ limit: 1 });
		expect(page1.items).toHaveLength(1);
		expect(page1.nextCursor).toBeTruthy();

		const page2 = await bylineRepo.findMany({ limit: 1, cursor: page1.nextCursor });
		expect(page2.items).toHaveLength(1);
		expect(page2.items[0]?.id).not.toBe(page1.items[0]?.id);
	});

	it("assigns ordered bylines to content and syncs primary_byline_id", async () => {
		const lead = await bylineRepo.create({
			slug: "lead",
			displayName: "Lead Author",
		});
		const second = await bylineRepo.create({
			slug: "second",
			displayName: "Second Author",
		});

		const content = await contentRepo.create({
			type: "post",
			slug: "bylined-post",
			data: { title: "Bylined Post" },
		});

		const assigned = await bylineRepo.setContentBylines("post", content.id, [
			{ bylineId: lead.id },
			{ bylineId: second.id, roleLabel: "Editor" },
		]);

		expect(assigned).toHaveLength(2);
		expect(assigned[0]?.byline.id).toBe(lead.id);
		expect(assigned[0]?.sortOrder).toBe(0);
		expect(assigned[1]?.byline.id).toBe(second.id);
		expect(assigned[1]?.roleLabel).toBe("Editor");

		const refreshed = await contentRepo.findById("post", content.id);
		expect(refreshed?.primaryBylineId).toBe(lead.id);
	});

	it("reorders bylines and updates primary_byline_id", async () => {
		const first = await bylineRepo.create({
			slug: "first",
			displayName: "First",
		});
		const second = await bylineRepo.create({
			slug: "second-reorder",
			displayName: "Second",
		});

		const content = await contentRepo.create({
			type: "post",
			slug: "reordered-post",
			data: { title: "Reordered" },
		});

		await bylineRepo.setContentBylines("post", content.id, [
			{ bylineId: first.id },
			{ bylineId: second.id },
		]);

		await bylineRepo.setContentBylines("post", content.id, [
			{ bylineId: second.id },
			{ bylineId: first.id },
		]);

		const refreshed = await contentRepo.findById("post", content.id);
		expect(refreshed?.primaryBylineId).toBe(second.id);

		const bylines = await bylineRepo.getContentBylines("post", content.id);
		expect(bylines[0]?.byline.id).toBe(second.id);
		expect(bylines[1]?.byline.id).toBe(first.id);
	});

	it("deletes byline, removes links, and nulls primary_byline_id", async () => {
		const byline = await bylineRepo.create({
			slug: "delete-me",
			displayName: "Delete Me",
		});

		const content = await contentRepo.create({
			type: "post",
			slug: "delete-byline-post",
			data: { title: "Delete Byline" },
		});

		await bylineRepo.setContentBylines("post", content.id, [{ bylineId: byline.id }]);

		const deleted = await bylineRepo.delete(byline.id);
		expect(deleted).toBe(true);

		const unresolved = await bylineRepo.getContentBylines("post", content.id);
		expect(unresolved).toHaveLength(0);

		const refreshed = await contentRepo.findById("post", content.id);
		expect(refreshed?.primaryBylineId).toBeNull();
	});
});
