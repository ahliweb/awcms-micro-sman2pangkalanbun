import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MANIFEST_PATH = path.resolve(process.env.BOS_MANIFEST_PATH || "project-docs/migration/bos-intake-manifest.json");
const REPORT_PATH = path.resolve(process.env.BOS_UPLOAD_REPORT_PATH || "project-docs/migration/bos-r2-upload-report.json");
const BUCKET = process.env.BOS_R2_BUCKET || "sman2pangkalanbunweb";
const KEY_PREFIX = process.env.BOS_R2_KEY_PREFIX || "documents";
const URL_BASE = process.env.BOS_PUBLIC_URL_BASE || "https://sman2pangkalanbun.sch.id";
const WORKSPACE_ENV = path.resolve(process.env.BOS_ENV_FILE || ".env");
const TRAILING_SLASH_REGEX = /\/$/;

const EXPECTED = ["bos-tw1-2024.pdf", "bos-tw2-2024.pdf", "bos-tw3-2024.pdf"];

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function runUpload(filePath, key) {
	const command = `set -a && source "${WORKSPACE_ENV}" && set +a && pnpm --filter @emdash-cms/demo-cloudflare exec wrangler r2 object put "${BUCKET}/${key}" --file "${filePath}"`;
	const result = spawnSync("bash", ["-lc", command], {
		stdio: "pipe",
		encoding: "utf8",
	});
	return result;
}

function ensureManifest(manifest) {
	if (!manifest || manifest.ok !== true) {
		throw new Error(`Manifest must exist with ok=true: ${MANIFEST_PATH}`);
	}
	const files = Array.isArray(manifest.files) ? manifest.files : [];
	for (const file of EXPECTED) {
		if (!files.some((item) => item.file === file)) {
			throw new Error(`Manifest missing required file: ${file}`);
		}
	}
	return files;
}

function main() {
	if (!fs.existsSync(MANIFEST_PATH)) {
		throw new Error(`Manifest file not found: ${MANIFEST_PATH}`);
	}
	if (!fs.existsSync(WORKSPACE_ENV)) {
		throw new Error(`Env file not found: ${WORKSPACE_ENV}`);
	}

	const manifest = readJson(MANIFEST_PATH);
	const files = ensureManifest(manifest);

	const uploads = [];
	for (const fileName of EXPECTED) {
		const source = files.find((item) => item.file === fileName);
		const sourcePath = source?.sourcePath;
		if (typeof sourcePath !== "string" || !fs.existsSync(sourcePath)) {
			throw new Error(`Source file missing for ${fileName}: ${String(sourcePath)}`);
		}

		const key = `${KEY_PREFIX}/${fileName}`;
		const upload = runUpload(sourcePath, key);
		if (upload.status !== 0) {
			throw new Error(`Upload failed for ${fileName}: ${upload.stderr || upload.stdout}`);
		}

		uploads.push({
			file: fileName,
			key,
			bucket: BUCKET,
			url: `${URL_BASE.replace(TRAILING_SLASH_REGEX, "")}/${key}`,
			sha256: source?.sha256,
			sizeBytes: source?.sizeBytes,
			uploadOutput: upload.stdout.trim(),
		});
	}

	const report = {
		version: "1.0",
		generatedAt: new Date().toISOString(),
		bucket: BUCKET,
		keyPrefix: KEY_PREFIX,
		manifestPath: MANIFEST_PATH,
		uploads,
	};
	writeJson(REPORT_PATH, report);

	manifest.r2Upload = {
		bucket: BUCKET,
		keyPrefix: KEY_PREFIX,
		uploadedAt: report.generatedAt,
		files: uploads.map((item) => ({
			file: item.file,
			key: item.key,
			url: item.url,
			sha256: item.sha256,
		})),
	};
	writeJson(MANIFEST_PATH, manifest);

	console.log(`Uploaded ${uploads.length} BOS files to R2 bucket '${BUCKET}'.`);
	console.log(`Upload report: ${REPORT_PATH}`);
}

try {
	main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`BOS R2 upload failed: ${message}`);
	process.exitCode = 1;
}
