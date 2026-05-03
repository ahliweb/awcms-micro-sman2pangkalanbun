import { getEmDashCollection } from "emdash";

export interface PublicSearchFilters {
	q: string;
	type: string;
	year: string;
	category: string;
}

export interface PublicSearchResult {
	collection: string;
	slug: string;
	title: string;
	snippet: string;
	url: string;
	category?: string;
	year?: string;
}

const COLLECTIONS = ["posts", "galleries", "downloads"];

function extractText(value: unknown): string {
	if (!Array.isArray(value)) return "";
	return value
		.flatMap((block) => {
			if (!block || typeof block !== "object") return [];
			const children = (block as { children?: unknown }).children;
			if (!Array.isArray(children)) return [];
			return children
				.filter((child): child is { text?: unknown } => !!child && typeof child === "object")
				.map((child) => (typeof child.text === "string" ? child.text : ""));
		})
		.join(" ")
		.trim();
}

function entryDateYear(data: Record<string, unknown>): string | undefined {
	const candidate =
		data.publishedAt ??
		data.announcement_date ??
		data.starts_at ??
		data.awarded_on ??
		data.published_on;
	if (!(candidate instanceof Date)) return undefined;
	return String(candidate.getUTCFullYear());
}

function buildUrl(collection: string, slug: string): string {
	if (collection === "posts") return `/posts/${slug}`;
	return `/${collection}/${slug}`;
}

export async function publicSearch(filters: PublicSearchFilters): Promise<PublicSearchResult[]> {
	const query = filters.q.trim().toLowerCase();
	if (!query) return [];

	const targetCollections = filters.type && filters.type !== "all" ? [filters.type] : COLLECTIONS;

	const batches = await Promise.all(
		targetCollections.map(async (collection) => {
			const { entries } = await getEmDashCollection(collection, {
				orderBy: { published_at: "desc" },
				limit: 100,
			});
			return entries.map((entry) => ({ collection, entry }));
		}),
	);

	const flat = batches.flat();

	return flat
		.map(({ collection, entry }) => {
			const data = entry.data as Record<string, unknown>;
			const title = typeof data.title === "string" ? data.title : "Untitled";
			const excerpt =
				typeof data.excerpt === "string"
					? data.excerpt
					: typeof data.summary === "string"
						? data.summary
						: typeof data.description === "string"
							? data.description
							: "";
			const content = extractText(data.content);
			const haystack = `${title} ${excerpt} ${content}`.toLowerCase();
			const category = typeof data.category === "string" ? data.category : undefined;
			const year = entryDateYear(data);

			return {
				collection,
				slug: entry.id,
				title,
				snippet: excerpt || content.slice(0, 180),
				url: buildUrl(collection, entry.id),
				category,
				year,
				haystack,
			};
		})
		.filter((item) => item.haystack.includes(query))
		.filter((item) => (filters.year ? item.year === filters.year : true))
		.filter((item) => (filters.category ? item.category === filters.category : true))
		.map(({ haystack: _haystack, ...item }) => item);
}

export function searchCollections(): string[] {
	return COLLECTIONS;
}
