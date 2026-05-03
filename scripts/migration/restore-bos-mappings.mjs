import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const RESOLUTION_PATH = path.resolve(process.env.MISSING_SOURCE_RESOLUTION_PATH || "project-docs/migration/missing-source-resolution.json");
const MANIFEST_PATH = path.resolve(process.env.BOS_MANIFEST_PATH || "project-docs/migration/bos-intake-manifest.json");
const CLOSURE_REPORT_PATH = path.resolve(process.env.BOS_CLOSURE_REPORT_PATH || "project-docs/migration/bos-restoration-closure.json");
const REPLACEMENT_PREFIX = process.env.BOS_REPLACEMENT_PREFIX || "/documents";

const EXPECTED = ["bos-tw1-2024.pdf", "bos-tw2-2024.pdf", "bos-tw3-2024.pdf"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function runNode(scriptPath) {
  const run = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    env: process.env
  });
  if (run.status !== 0) {
    throw new Error(`Command failed: node ${scriptPath}`);
  }
}

function normalizeManifest(manifest) {
  if (!manifest || manifest.ok !== true) {
    throw new Error(`BOS manifest is not marked ok=true: ${MANIFEST_PATH}`);
  }

  const fileMap = new Map();
  for (const item of manifest.files || []) {
    if (typeof item.file === "string") {
      fileMap.set(item.file, item);
    }
  }

  for (const name of EXPECTED) {
    if (!fileMap.has(name)) {
      throw new Error(`BOS manifest missing expected file '${name}'`);
    }
  }

  return fileMap;
}

function updateResolution(resolution, fileMap) {
  const requiredMissing = new Set(EXPECTED.map((name) => `${REPLACEMENT_PREFIX}/${name}`));
  let updated = 0;

  resolution.items = (resolution.items || []).map((item) => {
    if (!requiredMissing.has(item.missing)) {
      return item;
    }

    const fileName = item.missing.split("/").pop();
    const manifestFile = fileMap.get(fileName);
    if (!manifestFile) {
      return item;
    }

    updated += 1;
    return {
      ...item,
      disposition: "replaced-owned",
      replacement: `${REPLACEMENT_PREFIX}/${manifestFile.file}`,
      checksumSha256: manifestFile.sha256
    };
  });

  if (updated !== EXPECTED.length) {
    throw new Error(`Expected to update ${EXPECTED.length} BOS mapping entries, updated ${updated}`);
  }

  return { resolution, updated };
}

function readUnresolvedCount() {
  const reportPath = path.resolve("project-docs/migration/reference-validation-report.json");
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  const report = readJson(reportPath);
  return typeof report.unresolvedCount === "number" ? report.unresolvedCount : null;
}

function main() {
	if (!fs.existsSync(MANIFEST_PATH)) {
		throw new Error(`BOS manifest file not found: ${MANIFEST_PATH}`);
	}
	if (!fs.existsSync(RESOLUTION_PATH)) {
		throw new Error(`Resolution file not found: ${RESOLUTION_PATH}`);
	}

  const resolution = readJson(RESOLUTION_PATH);
  const manifest = readJson(MANIFEST_PATH);
  const fileMap = normalizeManifest(manifest);

  const beforeUnresolved = readUnresolvedCount();
  const { resolution: updatedResolution, updated } = updateResolution(resolution, fileMap);
  writeJson(RESOLUTION_PATH, updatedResolution);

  runNode(path.resolve("scripts/migration/generate-wave2-transform-samples.mjs"));
  runNode(path.resolve("scripts/migration/validate-wave2-references.mjs"));

  const afterUnresolved = readUnresolvedCount();
  const closureReport = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    manifestPath: MANIFEST_PATH,
    resolutionPath: RESOLUTION_PATH,
    updatedEntries: updated,
    beforeUnresolvedCount: beforeUnresolved,
    afterUnresolvedCount: afterUnresolved,
    status: afterUnresolved === 0 ? "ready_to_close" : "follow_up_required"
  };
  writeJson(CLOSURE_REPORT_PATH, closureReport);

  if (afterUnresolved !== 0) {
    console.error(`BOS mapping restoration incomplete. See: ${CLOSURE_REPORT_PATH}`);
    process.exitCode = 1;
    return;
  }

  console.log(`BOS mapping restoration complete. Closure report: ${CLOSURE_REPORT_PATH}`);
}

try {
	main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`BOS mapping restoration failed: ${message}`);
	process.exitCode = 1;
}
