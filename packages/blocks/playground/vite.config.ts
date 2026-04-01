import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			// Resolve @emdashcms/blocks from source for HMR
			"@emdashcms/blocks": new URL("../src/index.ts", import.meta.url).pathname,
		},
	},
});
