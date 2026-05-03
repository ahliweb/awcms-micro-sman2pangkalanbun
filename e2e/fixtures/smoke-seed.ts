export interface SmokeSeedItem {
	collection: "posts" | "pages" | "events";
	title: string;
	slug: string;
	excerpt?: string;
	description?: string;
	startsAt?: string;
	publish: boolean;
}

export const SMOKE_SEED_ITEMS: SmokeSeedItem[] = [
	{
		collection: "posts",
		title: "First Post",
		slug: "first-post",
		excerpt: "The very first post",
		publish: true,
	},
	{
		collection: "posts",
		title: "Second Post",
		slug: "second-post",
		excerpt: "Another post",
		publish: true,
	},
	{
		collection: "posts",
		title: "Draft Post",
		slug: "draft-post",
		excerpt: "Not published yet",
		publish: false,
	},
	{ collection: "pages", title: "About", slug: "about", publish: true },
	{ collection: "pages", title: "Contact", slug: "contact", publish: false },
	{
		collection: "events",
		title: "School Expo 2026",
		slug: "school-expo-2026",
		description: "Public school expo and student showcase",
		startsAt: "2026-08-10T08:00:00.000Z",
		publish: true,
	},
	{
		collection: "events",
		title: "Debate Workshop Draft",
		slug: "debate-workshop-draft",
		description: "Draft event for smoke publish flow",
		startsAt: "2026-09-01T07:30:00.000Z",
		publish: false,
	},
];
