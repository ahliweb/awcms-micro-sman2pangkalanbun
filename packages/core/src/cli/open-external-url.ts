interface OpenCommand {
	command: string;
	args: string[];
}

function isAllowedExternalUrl(value: string): boolean {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
}

export function getOpenExternalUrlCommand(
	platform: NodeJS.Platform,
	url: string,
): OpenCommand | null {
	if (!isAllowedExternalUrl(url)) {
		return null;
	}

	if (platform === "darwin") {
		return { command: "open", args: [url] };
	}

	if (platform === "win32") {
		return {
			command: "rundll32.exe",
			args: ["url.dll,FileProtocolHandler", url],
		};
	}

	return { command: "xdg-open", args: [url] };
}
