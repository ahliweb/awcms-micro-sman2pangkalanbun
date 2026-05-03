export interface SmokeSeedItem {
	collection: "posts" | "pages";
	title: string;
	slug: string;
	excerpt?: string;
	publish: boolean;
}

export const SMOKE_SEED_ITEMS: SmokeSeedItem[] = [
	{ collection: "posts", title: "First Post", slug: "first-post", excerpt: "The very first post", publish: true },
	{ collection: "posts", title: "Second Post", slug: "second-post", excerpt: "Another post", publish: true },
	{ collection: "posts", title: "Draft Post", slug: "draft-post", excerpt: "Not published yet", publish: false },
	{ collection: "pages", title: "About", slug: "about", publish: true },
	{ collection: "pages", title: "Contact", slug: "contact", publish: false }
];
