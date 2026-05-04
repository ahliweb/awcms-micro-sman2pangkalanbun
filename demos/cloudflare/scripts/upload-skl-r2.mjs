#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../../..");
const pdfDir = resolve(repoRoot, "temp/pdf-skl");
const sklDataPath = resolve(repoRoot, "temp/SKL-DATA.md");
const outPath = resolve(repoRoot, "temp/SKL-LINKS.md");

const bucket = process.env.SKL_R2_BUCKET || "sman2pangkalanbunweb";
const keyPrefix = process.env.SKL_R2_PREFIX || "SKL-2026";
const publicBase = (process.env.SKL_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const dryRun = process.argv.includes("--dry-run");
const localMode = process.argv.includes("--local");

if (!existsSync(pdfDir)) {
	console.error(`Missing directory: ${pdfDir}`);
	process.exit(1);
}

if (!existsSync(sklDataPath)) {
	console.error(`Missing file: ${sklDataPath}`);
	process.exit(1);
}

const markdown = await readFile(sklDataPath, "utf8");
const rowRegex = /^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;

const rows = [];
let match;
while ((match = rowRegex.exec(markdown)) !== null) {
	const [, no, nisn, name, filename] = match;
	rows.push({
		no: Number(no),
		nisn,
		name: name.trim(),
		filename: filename.trim(),
	});
}

if (rows.length === 0) {
	console.error("No SKL rows found in temp/SKL-DATA.md");
	process.exit(1);
}

const localFiles = new Set(readdirSync(pdfDir).filter((name) => name.toLowerCase().endsWith(".pdf")));
const missing = rows.filter((row) => !localFiles.has(row.filename));
if (missing.length > 0) {
	console.error(`Missing ${missing.length} PDF(s) referenced by SKL-DATA.md`);
	for (const row of missing.slice(0, 10)) {
		console.error(`- ${row.filename}`);
	}
	process.exit(1);
}

let uploaded = 0;
for (const row of rows) {
	const key = `${keyPrefix}/${row.filename}`;
	const filePath = resolve(pdfDir, row.filename);

	if (dryRun) {
		console.log(
			`[dry-run] wrangler r2 object put ${bucket}/${key} --file ${filePath} ${localMode ? "--local" : "--remote"}`,
		);
		uploaded += 1;
		continue;
	}

	const storageFlag = localMode ? "--local" : "--remote";

	const result = spawnSync(
		"npx",
		["wrangler", "r2", "object", "put", `${bucket}/${key}`, "--file", filePath, storageFlag],
		{
			cwd: resolve(repoRoot, "demos/cloudflare"),
			stdio: "pipe",
			encoding: "utf8",
		},
	);

	if (result.status !== 0) {
		console.error(`Upload failed for ${row.filename}`);
		if (result.stdout) console.error(result.stdout.trim());
		if (result.stderr) console.error(result.stderr.trim());
		process.exit(result.status ?? 1);
	}

	uploaded += 1;
	if (uploaded % 25 === 0 || uploaded === rows.length) {
		console.log(`Uploaded ${uploaded}/${rows.length}`);
	}
}

const lines = [
	"# SKL Public Links",
	"",
	`Generated from temp/SKL-DATA.md (${new Date().toISOString()})`,
	"",
	"| No | NISN | Nama | File PDF | Public Link |",
	"|----|------|------|----------|-------------|",
];

for (const row of rows) {
	const key = `${keyPrefix}/${row.filename}`;
	const link = publicBase ? `${publicBase}/${key}` : key;
	lines.push(`| ${row.no} | ${row.nisn} | ${row.name} | ${row.filename} | ${link} |`);
}

mkdirSync(resolve(repoRoot, "temp"), { recursive: true });
writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Completed ${dryRun ? "dry-run for" : "upload of"} ${uploaded} file(s)`);
console.log(`Wrote link manifest: ${outPath}`);
