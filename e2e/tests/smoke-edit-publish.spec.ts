import { test, expect } from "../fixtures";

test.describe("@smoke Admin edit-to-publish", () => {
	test.beforeEach(async ({ admin }) => {
		await admin.devBypassAuth();
	});

	test("publishes a draft post and renders publicly", async ({ admin }) => {
		await admin.goToContent("posts");
		await admin.page.getByRole("link", { name: "Draft Post", exact: true }).click();
		await admin.waitForLoading();

		await admin.fillField("title", "Draft Post Smoke Published");
		await admin.clickSave();
		await admin.waitForSaveComplete();

		const publishButton = admin.page.getByRole("button", { name: "Publish" });
		await expect(publishButton).toBeVisible();
		await publishButton.click();
		await admin.waitForLoading();

		await admin.page.goto("/posts/draft-post");
		await expect(admin.page.getByRole("heading", { level: 1 })).toContainText(
			"Draft Post Smoke Published",
		);
	});

	test("edits a draft page and persists change", async ({ admin }) => {
		await admin.goToContent("pages");
		await admin.page.getByRole("link", { name: "Contact", exact: true }).click();
		await admin.waitForLoading();
		const editUrl = admin.page.url();
		const pageId = editUrl.split("/").pop();

		await admin.fillField("title", "Contact Smoke Published");
		await admin.clickSave();
		await admin.waitForSaveComplete();

		const response = await admin.page.request.get(`/_emdash/api/content/pages/${pageId}`, {
			headers: { "X-EmDash-Request": "1" },
		});
		expect(response.ok()).toBe(true);
		const payload = await response.json();
		const item = payload.data?.item ?? payload.item;
		expect(item?.status).toBe("draft");
		expect(item?.data?.title).toBe("Contact Smoke Published");
	});

	test("renders media-linked published post", async ({ admin }) => {
		await admin.page.goto("/posts/post-with-image");
		await expect(admin.page.getByRole("heading", { level: 1 })).toContainText("Post With Image");
		await expect(admin.page.locator("img")).toBeVisible();
	});

	test("publishes a draft event and persists published status", async ({ admin }) => {
		await admin.goToContent("events");
		await admin.page.getByRole("link", { name: "Debate Workshop Draft", exact: true }).click();
		await admin.waitForLoading();
		const eventId = admin.page.url().split("/").pop();

		await admin.fillField("title", "Debate Workshop Published");
		await admin.clickSave();
		await admin.waitForSaveComplete();

		const publishButton = admin.page.getByRole("button", { name: "Publish" });
		await expect(publishButton).toBeVisible();
		await publishButton.click();
		await admin.waitForLoading();

		const response = await admin.page.request.get(`/_emdash/api/content/events/${eventId}`, {
			headers: { "X-EmDash-Request": "1" },
		});
		expect(response.ok()).toBe(true);
		const payload = await response.json();
		const item = payload.data?.item ?? payload.item;
		expect(item?.status).toBe("published");
		expect(item?.data?.title).toBe("Debate Workshop Published");
	});
});
