import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const inputFiles = [
	path.resolve("project-docs/migration/transforms/news.sample.json"),
	path.resolve("project-docs/migration/transforms/pages.sample.json"),
	path.resolve("project-docs/migration/transforms/finance-reports.sample.json"),
];

const statePath = path.resolve("project-docs/migration/import-runner-state.json");
const logPath = path.resolve("project-docs/migration/import-runner-dry-run.json");

function readState() {
	if (!fs.existsSync(statePath)) return { seen: {} };
	return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeJson(filePath, data) {
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function digest(value) {
	return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function operationKey(collection, locale, slug) {
	return `${collection}:${locale}:${slug}`;
}

function loadRows() {
	const rows = [];
	for (const file of inputFiles) {
		const data = JSON.parse(fs.readFileSync(file, "utf8"));
		for (const item of data) {
			for (const localeRow of item.localeRows || []) {
				rows.push({
					collection: item.collection,
					locale: localeRow.locale,
					slug: localeRow.slug,
					payload: localeRow,
				});
			}
		}
	}
	rows.sort((a, b) =>
		operationKey(a.collection, a.locale, a.slug).localeCompare(
			operationKey(b.collection, b.locale, b.slug),
		),
	);
	return rows;
}

const state = readState();
const rows = loadRows();
const operations = [];

for (const row of rows) {
	const key = operationKey(row.collection, row.locale, row.slug);
	const hash = digest(row.payload);
	const prev = state.seen[key];
	if (!prev) {
		operations.push({ key, action: "create", hash });
		state.seen[key] = hash;
		continue;
	}
	if (prev === hash) {
		operations.push({ key, action: "skip", hash });
		continue;
	}
	operations.push({ key, action: "update", hash, previousHash: prev });
	state.seen[key] = hash;
}

writeJson(logPath, {
	generatedAt: new Date().toISOString(),
	totalRows: rows.length,
	operations,
});

writeJson(statePath, state);

const summary = operations.reduce(
	(acc, operation) => {
		acc[operation.action] += 1;
		return acc;
	},
	{ create: 0, skip: 0, update: 0 },
);

console.log("Dry-run summary", summary);
