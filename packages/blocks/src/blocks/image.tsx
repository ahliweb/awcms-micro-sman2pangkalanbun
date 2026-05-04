import type { ImageBlock } from "../types.js";

function safeImageUrl(raw: string): string | undefined {
	if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
		return raw;
	}

	try {
		const parsed = new URL(raw);
		if (parsed.protocol === "https:" || parsed.protocol === "http:") {
			return parsed.toString();
		}
	} catch {
		return undefined;
	}

	return undefined;
}

export function ImageBlockComponent({ block }: { block: ImageBlock }) {
	const src = safeImageUrl(block.url);
	if (!src) return null;

	return (
		<figure>
			<img src={src} alt={block.alt} className="max-w-full rounded" />
			{block.title && (
				<figcaption className="mt-1 text-sm text-kumo-subtle">{block.title}</figcaption>
			)}
		</figure>
	);
}
