import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: [
			"tests/integration/smoke/**/*.test.ts",
			"tests/integration/cli/**/*.test.ts",
			"tests/integration/client/**/*.test.ts",
		],
	},
});
