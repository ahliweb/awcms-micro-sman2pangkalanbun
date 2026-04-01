/**
 * Storage Adapter Functions
 *
 * These run at config time (astro.config.mjs) and return serializable descriptors.
 * The actual storage is created at runtime by loading the entrypoint.
 *
 * @example
 * ```ts
 * // astro.config.mjs
 * import emdash, { s3, local } from "emdash/astro";
 *
 * export default defineConfig({
 *   integrations: [
 *     emdash({
 *       storage: s3({
 *         endpoint: "https://xxx.r2.cloudflarestorage.com",
 *         bucket: "media",
 *         accessKeyId: process.env.R2_ACCESS_KEY_ID!,
 *         secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
 *       }),
 *       // or: storage: local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" }),
 *     }),
 *   ],
 * });
 * ```
 *
 * For Cloudflare R2 bindings, use `r2()` from `@emdash-cms/cloudflare`.
 */

import type { StorageDescriptor, S3StorageConfig, LocalStorageConfig } from "./types.js";

/**
 * S3-compatible storage adapter
 *
 * Works with AWS S3, Cloudflare R2 (via S3 API), Minio, etc.
 *
 * @example
 * ```ts
 * storage: s3({
 *   endpoint: "https://xxx.r2.cloudflarestorage.com",
 *   bucket: "media",
 *   accessKeyId: process.env.R2_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
 *   publicUrl: "https://cdn.example.com", // optional CDN
 * })
 * ```
 */
export function s3(config: S3StorageConfig): StorageDescriptor {
	return {
		entrypoint: "emdash/storage/s3",
		config,
	};
}

/**
 * Local filesystem storage adapter
 *
 * For development and testing. Stores files in a local directory.
 * Does NOT support signed upload URLs.
 *
 * @example
 * ```ts
 * storage: local({
 *   directory: "./uploads",
 *   baseUrl: "/_emdash/api/media/file",
 * })
 * ```
 */
export function local(config: LocalStorageConfig): StorageDescriptor {
	return {
		entrypoint: "emdash/storage/local",
		config,
	};
}
