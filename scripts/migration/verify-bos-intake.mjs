import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const INPUT_DIR = path.resolve(process.env.BOS_SOURCE_DIR || "project-docs/migration/bos-intake");
const OUTPUT_PATH = path.resolve(process.env.BOS_MANIFEST_PATH || "project-docs/migration/bos-intake-manifest.json");
const EXPECTED_FILES = ["bos-tw1-2024.pdf", "bos-tw2-2024.pdf", "bos-tw3-2024.pdf"];

function usage() {
  console.log("Usage: BOS_SOURCE_DIR=<dir> BOS_MANIFEST_PATH=<path> node scripts/migration/verify-bos-intake.mjs");
}

function readMeta() {
  const operator = process.env.BOS_OPERATOR || "unknown";
  const provenanceOwner = process.env.BOS_PROVENANCE_OWNER || "unknown";
  const provenanceDate = process.env.BOS_PROVENANCE_DATE || "unknown";
  const handoffChannel = process.env.BOS_HANDOFF_CHANNEL || "unknown";
  return {
    operator,
    provenance: {
      owner: provenanceOwner,
      handoffDate: provenanceDate,
      channel: handoffChannel
    }
  };
}

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead > 0) {
        hash.update(buffer.subarray(0, bytesRead));
      }
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest("hex");
}

function readHeader(filePath) {
  const fd = fs.openSync(filePath, "r");
  try {
    const header = Buffer.alloc(4);
    fs.readSync(fd, header, 0, 4, 0);
    return header.toString("ascii");
  } finally {
    fs.closeSync(fd);
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function verify() {
  const issues = [];
  const results = [];

  for (const fileName of EXPECTED_FILES) {
    const absolutePath = path.join(INPUT_DIR, fileName);
    if (!fs.existsSync(absolutePath)) {
      issues.push({ file: fileName, reason: "missing" });
      continue;
    }

    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      issues.push({ file: fileName, reason: "not_a_file" });
      continue;
    }

    const header = readHeader(absolutePath);
    if (header !== "%PDF") {
      issues.push({ file: fileName, reason: "invalid_pdf_signature", observedHeader: header });
      continue;
    }

    results.push({
      file: fileName,
      sourcePath: absolutePath,
      sizeBytes: stat.size,
      sha256: sha256(absolutePath)
    });
  }

  return { results, issues };
}

function main() {
  if (process.argv.includes("--help")) {
    usage();
    return;
  }

  const meta = readMeta();
  const { results, issues } = verify();
  const ok = issues.length === 0 && results.length === EXPECTED_FILES.length;

  const manifest = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    expectedFiles: EXPECTED_FILES,
    sourceDir: INPUT_DIR,
    ok,
    ...meta,
    files: results,
    issues
  };

  ensureDir(OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n");

  if (!ok) {
    console.error(`BOS intake verification failed (${issues.length} issue(s)). Manifest: ${OUTPUT_PATH}`);
    process.exitCode = 1;
    return;
  }

  console.log(`BOS intake verification passed. Manifest: ${OUTPUT_PATH}`);
}

main();
