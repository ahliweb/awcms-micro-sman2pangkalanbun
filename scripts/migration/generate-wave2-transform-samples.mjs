import fs from "node:fs";
import path from "node:path";

const legacyRoot =
	process.env.LEGACY_ROOT || "/home/data/dev_react/awcms-dev/awcms-public/smandapbun";
const outDir = path.resolve("project-docs/migration/transforms");
const resolutionPath = path.resolve("project-docs/migration/missing-source-resolution.json");

const resolution = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
const resolutionMap = new Map(resolution.items.map((item) => [item.missing, item]));
const HTML_TAG_REGEX = /<[^>]+>/g;
const MULTI_WS_REGEX = /\s+/g;

function readLegacy(file) {
	const full = path.join(legacyRoot, "src/data", file);
	return JSON.parse(fs.readFileSync(full, "utf8"));
}

function asPortableText(html) {
	return [
		{
			_type: "block",
			style: "normal",
			children: [
				{
					_type: "span",
					text: html.replace(HTML_TAG_REGEX, " ").replace(MULTI_WS_REGEX, " ").trim(),
				},
			],
		},
	];
}

function resolveAsset(value) {
	if (typeof value !== "string") return value;
	const match = resolutionMap.get(value);
	if (!match) return value;
	if (match.disposition === "removed") return null;
	return match.replacement;
}

function writeJson(name, value) {
	fs.mkdirSync(outDir, { recursive: true });
	fs.writeFileSync(path.join(outDir, name), JSON.stringify(value, null, 2) + "\n");
}

function mapNews() {
	const src = readLegacy("blogs/blogs.json");
	const items = src.blogs.map((row, index) => ({
		source: { file: "blogs/blogs.json", index },
		collection: "news",
		localeRows: ["id", "en"].map((locale) => ({
			locale,
			slug: row.slug,
			title: row.title[locale],
			excerpt: row.excerpt[locale],
			body: asPortableText(row.content[locale]),
			authorName: row.author,
			publishedAt: row.publishedAt,
			featured: !!row.featured,
			imageSource: resolveAsset(row.image),
		})),
	}));
	writeJson("news.sample.json", items);
}

function mapPages() {
	const src = readLegacy("pages/profile.json");
	const principal = src.principalMessage;
	const history = src.history;
	const items = [principal, history].map((row, index) => ({
		source: { file: "pages/profile.json", key: index === 0 ? "principalMessage" : "history" },
		collection: "pages",
		localeRows: ["id", "en"].map((locale) => ({
			locale,
			slug: row.slug,
			title: row.title[locale],
			body: asPortableText(row.content[locale]),
			heroImageSource: resolveAsset(row.image || null),
		})),
	}));
	writeJson("pages.sample.json", items);
}

function mapFinance() {
	const src = readLegacy("blogs/finance.json");
	const records = [src.bos, src.apbd, src.committee].map((row, index) => ({
		source: { file: "blogs/finance.json", key: ["bos", "apbd", "committee"][index] },
		collection: "finance_reports",
		localeRows: ["id", "en"].map((locale) => ({
			locale,
			slug: row.slug,
			title: row.title[locale],
			body: asPortableText(row.content[locale]),
			attachments: (row.reports || [])
				.map((report) => ({
					period: report.period,
					fileSource: resolveAsset(report.file),
				}))
				.filter((item) => item.fileSource),
		})),
	}));
	writeJson("finance-reports.sample.json", records);
}

mapNews();
mapPages();
mapFinance();

console.log("Generated transform samples in", outDir);
