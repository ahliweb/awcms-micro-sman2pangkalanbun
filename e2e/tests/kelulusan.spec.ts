import { expect, test } from "../fixtures";

async function upsertStudent(
	page: any,
	sessionCookie: string,
	mediaId: string,
	nisn: string,
	name: string,
) {
	const response = await page.request.post("/_emdash/api/plugins/kelulusan/students/upsert", {
		headers: {
			Cookie: sessionCookie,
			"X-EmDash-Request": "1",
			"Content-Type": "application/json",
		},
		data: {
			nisn,
			name,
			pdfMediaId: mediaId,
			pdfFilename: `${nisn}.pdf`,
		},
	});

	if (!response.ok()) {
		const text = await response.text();
		throw new Error(`students/upsert failed (${response.status()}): ${text}`);
	}
}

test.describe("Kelulusan flows", () => {
	test("public NISN flow opens popup viewer", async ({ admin, page, serverInfo }) => {
		await admin.devBypassAuth();
		await upsertStudent(
			page,
			serverInfo.sessionCookie,
			serverInfo.mediaIds.testImage,
			"1234567890",
			"Siswa Uji",
		);

		await page.goto("/kelulusan");
		await page.fill("#nisn", "1234567890");
		await page.click("button[type='submit']");
		await expect(page).toHaveURL(/\/kelulusan\/hasil$/);

		await expect(page.locator("#result")).toBeVisible();
		await expect(page.locator("#student-name")).toContainText("Siswa Uji");

		await page.click("#open-pdf");
		await expect(page.locator("#pdf-dialog")).toHaveAttribute("open", "");
		await expect(page.locator("#pdf-frame")).toHaveAttribute("src", /\/media\//);
	});

	test("result page redirects to gate without valid session", async ({ page }) => {
		await page.goto("/kelulusan/hasil");
		await expect(page).toHaveURL(/\/kelulusan$/);
	});

	test("result page rejects tampered gate session token", async ({ admin, page, serverInfo }) => {
		await admin.devBypassAuth();
		await upsertStudent(
			page,
			serverInfo.sessionCookie,
			serverInfo.mediaIds.testImage,
			"3344556677",
			"Token Tamper",
		);

		await page.goto("/kelulusan");
		await page.fill("#nisn", "3344556677");
		await page.click("button[type='submit']");
		await expect(page).toHaveURL(/\/kelulusan\/hasil$/);

		await page.evaluate(() => {
			const raw = sessionStorage.getItem("kelulusan:gate-session");
			if (!raw) return;
			const parsed = JSON.parse(raw);
			parsed.accessToken = "tampered-token";
			sessionStorage.setItem("kelulusan:gate-session", JSON.stringify(parsed));
		});

		await page.goto("/kelulusan/hasil");
		await expect(page).toHaveURL(/\/kelulusan/);
	});

	test("admin list shows row and updates telemetry after actions", async ({ admin, page, serverInfo }) => {
		await admin.devBypassAuth();
		await upsertStudent(
			page,
			serverInfo.sessionCookie,
			serverInfo.mediaIds.testImage,
			"9988776655",
			"Admin Siswa",
		);

		await page.goto("/kelulusan/admin");

		const row = page.locator("#rows tr", { hasText: "9988776655" }).first();
		await expect(row).toBeVisible();
		await expect(row).toContainText("0");

		await row.locator("button[data-action='open']").click();
		await expect(page.locator("#pdf-dialog")).toHaveAttribute("open", "");

		await page.locator("#close-dialog").click();
		await row.locator("button[data-action='download']").click();

		await expect
			.poll(async () => {
				const text = await row.textContent();
				return text ?? "";
			})
			.toContain("1");
	});
});
