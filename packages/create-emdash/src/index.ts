/**
 * create-emdash
 *
 * Interactive CLI for creating new EmDash projects
 *
 * Usage: npm create emdash@latest
 */

import { execSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import * as p from "@clack/prompts";
import { downloadTemplate } from "giget";
import pc from "picocolors";

type Template = "blog" | "cloudflare" | "blank";

const PROJECT_NAME_PATTERN = /^[a-z0-9-]+$/;

const TEMPLATES = {
	blog: {
		name: "Blog",
		description: "A blog with posts and pages (Node.js + SQLite)",
		dir: "blog",
		repo: "github:emdash-cms/emdash/templates/blog",
	},
	cloudflare: {
		name: "Cloudflare",
		description: "A blog on Cloudflare Workers (D1 + R2)",
		dir: "cloudflare",
		repo: "github:emdash-cms/emdash/templates/cloudflare",
	},
	blank: {
		name: "Blank",
		description: "A minimal starter project",
		dir: "blank",
		repo: "github:emdash-cms/emdash/templates/blank",
	},
} as const;

/** Build select options from a config object, preserving literal key types */
function selectOptions<K extends string>(
	obj: Readonly<Record<K, Readonly<{ name: string; description: string }>>>,
): { value: K; label: string; hint: string }[] {
	// eslint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- Object.keys returns string[]; narrowed to K which is the known key union
	return (Object.keys(obj) as K[]).map((key) => ({
		value: key,
		label: obj[key].name,
		hint: obj[key].description,
	}));
}

function findMonorepoRoot(): string | null {
	let dir = process.cwd();
	while (true) {
		if (existsSync(resolve(dir, "pnpm-workspace.yaml")) && existsSync(resolve(dir, "templates"))) {
			return dir;
		}
		const parent = resolve(dir, "..");
		if (parent === dir) return null;
		dir = parent;
	}
}

const useRemote = process.argv.includes("--remote");

async function main() {
	console.clear();

	const monorepoRoot = useRemote ? null : findMonorepoRoot();

	p.intro(`— ${pc.bgCyan(pc.black(" create-emdash "))}`);

	const projectName = await p.text({
		message: "Project name?",
		placeholder: "my-site",
		defaultValue: "my-site",
		validate: (value) => {
			if (!value) return "Project name is required";
			if (!PROJECT_NAME_PATTERN.test(value))
				return "Project name can only contain lowercase letters, numbers, and hyphens";
			return undefined;
		},
	});

	if (p.isCancel(projectName)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	const projectDir = monorepoRoot
		? resolve(monorepoRoot, "demos", projectName)
		: resolve(process.cwd(), projectName);

	if (existsSync(projectDir)) {
		const overwrite = await p.confirm({
			message: `Directory ${monorepoRoot ? `demos/${projectName}` : projectName} already exists. Overwrite?`,
			initialValue: false,
		});

		if (p.isCancel(overwrite) || !overwrite) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		rmSync(projectDir, { recursive: true, force: true });
	}

	const template = await p.select<Template>({
		message: "Which template?",
		options: selectOptions(TEMPLATES),
		initialValue: "blog",
	});

	if (p.isCancel(template)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	const s = p.spinner();
	s.start("Creating project...");

	try {
		const templateConfig = TEMPLATES[template];

		if (monorepoRoot) {
			const templateDir = resolve(monorepoRoot, "templates", templateConfig.dir);
			cpSync(templateDir, projectDir, { recursive: true });
		} else {
			await downloadTemplate(templateConfig.repo, {
				dir: projectDir,
				force: true,
			});
		}

		// Set project name in package.json
		const pkgPath = resolve(projectDir, "package.json");
		if (existsSync(pkgPath)) {
			const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
			pkg.name = projectName;

			// Add emdash config for CLI commands (init reads seed path from here)
			const hasSeed = existsSync(resolve(projectDir, ".emdash", "seed.json"));
			if (hasSeed) {
				pkg.emdash = {
					label: templateConfig.name,
					seed: ".emdash/seed.json",
				};
			}

			writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
		}

		s.stop("Project created!");

		s.start("Installing dependencies...");
		try {
			execSync("pnpm install", {
				cwd: monorepoRoot ?? projectDir,
				stdio: "ignore",
			});
			s.stop("Dependencies installed!");
		} catch {
			s.stop("Failed to install dependencies");
			p.log.warn(
				monorepoRoot
					? `Run ${pc.cyan("pnpm install")} from the repo root manually`
					: `Run ${pc.cyan(`cd ${projectName} && pnpm install`)} manually`,
			);
		}

		const filterOrCd = monorepoRoot ? `pnpm --filter ${projectName}` : `cd ${projectName}\nnpm`;

		p.note(`${filterOrCd} run bootstrap\n${filterOrCd} run dev`, "Next steps");

		const displayPath = monorepoRoot ? `demos/${projectName}` : projectName;
		p.outro(`${pc.green("Done!")} Your EmDash project is ready at ${pc.cyan(displayPath)}`);
	} catch (error) {
		s.stop("Failed to create project");
		p.log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
