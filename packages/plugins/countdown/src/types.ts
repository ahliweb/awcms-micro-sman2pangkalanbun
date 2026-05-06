export interface CountdownSettings {
	enabled: boolean;
	targetAt: string;
	caption: string;
	imageUrl: string;
	showFrom: string | null;
	showUntil: string | null;
	dismissOncePerSession: boolean;
}

export interface CountdownSettingsPatch {
	enabled?: unknown;
	targetAt?: unknown;
	caption?: unknown;
	imageUrl?: unknown;
	showFrom?: unknown;
	showUntil?: unknown;
	dismissOncePerSession?: unknown;
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}
