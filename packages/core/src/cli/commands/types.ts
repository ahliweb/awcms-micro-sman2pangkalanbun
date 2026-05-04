/**
 * emdash types
 *
 * Fetch schema from an EmDash instance and generate TypeScript types
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";

import { defineCommand } from "citty";
import consola from "consola";

import { connectionArgs, createClientFromArgs } from "../client-factory.js";
import { validateGeneratedTypesPayload } from "../../typegen/validate.js";

function isInside(baseDir: string, targetPath: string): boolean {
	return targetPath === baseDir || targetPath.startsWith(`${baseDir}${sep}`);
}

export const typesCommand = defineCommand({
	meta: {
		name: "types",
		description: "Generate TypeScript types from schema",
	},
	args: {
		...connectionArgs,
		output: {
			type: "string",
			alias: "o",
			description: "Output path for generated types",
			default: ".emdash/types.ts",
		},
		cwd: {
			type: "string",
			description: "Working directory",
			default: process.cwd(),
		},
	},
	async run({ args }) {
		const cwd = resolve(args.cwd);
		consola.start("Fetching schema...");

		try {
			const client = createClientFromArgs(args);

			// Fetch JSON schema
			const schema = await client.schemaExport();
			consola.success(`Found ${schema.collections.length} collections`);

			// Fetch TypeScript types
			const types = await client.schemaTypes();
			const validation = validateGeneratedTypesPayload(types);
			if (!validation.ok) {
				throw new Error(validation.reason);
			}

			// Write types file
			const outputPath = resolve(cwd, args.output);
			if (!isInside(cwd, outputPath)) {
				throw new Error("Output path must stay within the working directory");
			}
			await mkdir(dirname(outputPath), { recursive: true });
			await writeFile(outputPath, types, "utf-8");
			consola.success(`Generated ${args.output}`);

			// Also write a schema.json for reference
			const schemaJsonPath = resolve(dirname(outputPath), "schema.json");
			await writeFile(schemaJsonPath, JSON.stringify(schema, null, 2), "utf-8");
			consola.info(`Schema version: ${schema.version}`);

			consola.box({
				title: "Types generated",
				message: `${schema.collections.length} collections\n\nTypes: ${args.output}\nSchema: .emdash/schema.json`,
			});
		} catch (error) {
			consola.error("Failed to fetch schema:", error instanceof Error ? error.message : error);
			process.exit(1);
		}
	},
});
