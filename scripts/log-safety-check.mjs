#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const SENSITIVE_PATTERN =
	/\b(authorization|cookie|set-cookie|token|password|secret|api[_-]?key)\b/i;
const SUPPRESS_MARKER = "log-safety: allow";
const CONSOLE_LOG_PATTERN = /console\.(debug|info|log|warn|error)\(/;
const STRUCTURED_LOG_PATTERN = /logEvent\(/;

const SCAN_DIRS = ["packages/core/src", "packages/admin/src", "demos/simple/src"];
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".astro"]);

function parseArgs(argv) {
	const args = { mode: "changed", base: "origin/main", head: "HEAD" };
	for (const arg of argv) {
		if (!arg.startsWith("--")) continue;
		const [key, value] = arg.slice(2).split("=");
		if (key === "mode" && value) args.mode = value;
		if (key === "base" && value) args.base = value;
		if (key === "head" && value) args.head = value;
	}
	return args;
}

function run(command) {
	return execSync(command, { encoding: "utf8" }).trim();
}

function listAllTrackedFiles() {
	const out = run("git ls-files");
	if (!out) return [];
	return out.split("\n").filter(Boolean);
}

function listChangedFiles(base, head) {
	const out = run(`git diff --name-only ${base}...${head}`);
	if (!out) return [];
	return out.split("\n").filter(Boolean);
}

function isScannable(file) {
	if (!SCAN_DIRS.some((dir) => file.startsWith(`${dir}/`))) return false;
	return SCAN_EXTS.has(path.extname(file));
}

function checkFile(filePath) {
	const contents = readFileSync(filePath, "utf8");
	const lines = contents.split("\n");
	const findings = [];

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index] ?? "";
		if (line.includes(SUPPRESS_MARKER)) continue;

		const isConsoleLog = CONSOLE_LOG_PATTERN.test(line);
		const isStructuredLog = STRUCTURED_LOG_PATTERN.test(line);
		if (!isConsoleLog && !isStructuredLog) continue;
		if (!SENSITIVE_PATTERN.test(line)) continue;

		findings.push({
			filePath,
			line: index + 1,
			text: line.trim(),
		});
	}

	return findings;
}

function main() {
	const { mode, base, head } = parseArgs(process.argv.slice(2));
	const files = mode === "all" ? listAllTrackedFiles() : listChangedFiles(base, head);
	const targets = files.filter(isScannable);

	if (targets.length === 0) {
		console.log("[log-safety] No matching files to scan.");
		return;
	}

	const findings = [];
	for (const target of targets) {
		findings.push(...checkFile(target));
	}

	if (findings.length === 0) {
		console.log(`[log-safety] OK. Scanned ${targets.length} files.`);
		return;
	}

	console.error(`[log-safety] Found ${findings.length} unsafe logging pattern(s):`);
	for (const finding of findings) {
		console.error(`- ${finding.filePath}:${finding.line} ${finding.text}`);
	}
	console.error(
		`\nRemediation:\n- Remove sensitive key/value from logging call, or\n- Emit sanitized structured context, or\n- Add '${SUPPRESS_MARKER}' with rationale on the same line for explicit exceptions.`,
	);
	process.exit(1);
}

main();
