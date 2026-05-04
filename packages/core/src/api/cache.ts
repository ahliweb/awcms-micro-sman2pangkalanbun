interface CacheInvalidator {
	enabled: boolean;
	invalidate: (input: { tags: string[] }) => Promise<void>;
}

/**
 * Best-effort cache invalidation for mutable API routes.
 *
 * Some runtimes/adapters expose a cache object but may throw at runtime when
 * tag invalidation is unavailable. Mutations should still succeed in that case.
 */
export async function invalidateTags(cache: CacheInvalidator | undefined, tags: string[]): Promise<void> {
	if (!cache?.enabled) return;
	try {
		await cache.invalidate({ tags });
	} catch (error) {
		console.warn("[cache] tag invalidation skipped:", error);
	}
}
