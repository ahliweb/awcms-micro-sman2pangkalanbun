#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(argv) {
	const out = {
		before: "",
		after: "",
		thresholds: resolve("scripts/query-counts.thresholds.json")
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--before") out.before = argv[++i] ?? "";
		else if (arg === "--after") out.after = argv[++i] ?? "";
		else if (arg === "--thresholds") out.thresholds = argv[++i] ?? out.thresholds;
		else throw new Error(`Unknown argument: ${arg}`);
	}
	if (!out.before || !out.after) throw new Error("Usage: --before <path> --after <path> [--thresholds <path>]");
	return out;
}

function main() {
	const { before, after, thresholds } = parseArgs(process.argv.slice(2));
	const beforeCounts = JSON.parse(readFileSync(before, "utf8"));
	const afterCounts = JSON.parse(readFileSync(after, "utf8"));
	const rules = JSON.parse(readFileSync(thresholds, "utf8"));

	const keys = [...new Set([...Object.keys(beforeCounts), ...Object.keys(afterCounts)])].toSorted();
	const regressions = [];

	for (const key of keys) {
		const previous = beforeCounts[key] ?? 0;
		const next = afterCounts[key] ?? 0;
		const increase = next - previous;
		const maxIncrease = rules.overrides?.[key]?.maxIncrease ?? rules.default?.maxIncrease ?? 0;
		if (increase > maxIncrease) {
			regressions.push({ key, previous, next, increase, maxIncrease });
		}
	}

	if (regressions.length === 0) {
		process.stdout.write("No query-count regressions beyond configured thresholds.\n");
		return;
	}

	process.stderr.write("Query-count regression(s) detected:\n");
	for (const regression of regressions) {
		process.stderr.write(
			`  ${regression.key}: before=${regression.previous} after=${regression.next} increase=+${regression.increase} threshold=+${regression.maxIncrease}\n`
		);
	}
	process.exit(1);
}

main();
