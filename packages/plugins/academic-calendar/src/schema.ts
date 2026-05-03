import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.string().datetime({ offset: true });

export const termSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	academicYear: z.string().min(4),
	locale: z.string().min(2).default("id-ID"),
	startDate: isoDate,
	endDate: isoDate,
});

export const examWindowSchema = z.object({
	id: z.string().min(1),
	termId: z.string().min(1),
	title: z.string().min(1),
	kind: z.enum(["midterm", "final", "assessment"]),
	startAt: isoDateTime,
	endAt: isoDateTime,
});

export const calendarEventSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	type: z.enum(["holiday", "event"]),
	locale: z.string().min(2).default("id-ID"),
	startAt: isoDateTime,
	endAt: isoDateTime.optional(),
	allDay: z.boolean().default(false),
});

export const calendarModelSchema = z.object({
	terms: z.array(termSchema),
	examWindows: z.array(examWindowSchema),
	events: z.array(calendarEventSchema),
});

export type AcademicTerm = z.infer<typeof termSchema>;
export type ExamWindow = z.infer<typeof examWindowSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarModel = z.infer<typeof calendarModelSchema>;

export type ValidationResult =
	| { ok: true; data: CalendarModel }
	| { ok: false; errors: string[] };

function toTime(value: string): number {
	return new Date(value).getTime();
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
	return aStart < bEnd && bStart < aEnd;
}

function validateTermRanges(terms: AcademicTerm[]): string[] {
	const errors: string[] = [];
	for (const term of terms) {
		const start = toTime(`${term.startDate}T00:00:00.000Z`);
		const end = toTime(`${term.endDate}T23:59:59.999Z`);
		if (start > end) {
			errors.push(`Term ${term.id} has invalid range (startDate > endDate)`);
		}
	}

	for (let i = 0; i < terms.length; i++) {
		for (let j = i + 1; j < terms.length; j++) {
			const a = terms[i];
			const b = terms[j];
			if (!a || !b) continue;
			const aStart = toTime(`${a.startDate}T00:00:00.000Z`);
			const aEnd = toTime(`${a.endDate}T23:59:59.999Z`);
			const bStart = toTime(`${b.startDate}T00:00:00.000Z`);
			const bEnd = toTime(`${b.endDate}T23:59:59.999Z`);
			if (overlaps(aStart, aEnd, bStart, bEnd)) {
				errors.push(`Terms ${a.id} and ${b.id} overlap`);
			}
		}
	}

	return errors;
}

function validateExamWindows(examWindows: ExamWindow[], termIds: Set<string>): string[] {
	const errors: string[] = [];
	for (const exam of examWindows) {
		const start = toTime(exam.startAt);
		const end = toTime(exam.endAt);
		if (start >= end) {
			errors.push(`Exam window ${exam.id} has invalid range (startAt >= endAt)`);
		}
		if (!termIds.has(exam.termId)) {
			errors.push(`Exam window ${exam.id} references unknown term ${exam.termId}`);
		}
	}

	for (let i = 0; i < examWindows.length; i++) {
		for (let j = i + 1; j < examWindows.length; j++) {
			const a = examWindows[i];
			const b = examWindows[j];
			if (!a || !b) continue;
			if (a.termId !== b.termId) continue;
			if (
				overlaps(toTime(a.startAt), toTime(a.endAt), toTime(b.startAt), toTime(b.endAt))
			) {
				errors.push(`Exam windows ${a.id} and ${b.id} overlap in term ${a.termId}`);
			}
		}
	}

	return errors;
}

function validateEvents(events: CalendarEvent[]): string[] {
	const errors: string[] = [];
	for (const event of events) {
		if (!event.endAt) continue;
		if (toTime(event.startAt) >= toTime(event.endAt)) {
			errors.push(`Event ${event.id} has invalid range (startAt >= endAt)`);
		}
	}
	return errors;
}

export function validateCalendarModel(input: unknown): ValidationResult {
	const parsed = calendarModelSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			errors: parsed.error.issues.map((issue) => issue.message),
		};
	}

	const data = parsed.data;
	const termIds = new Set(data.terms.map((term) => term.id));
	const errors = [
		...validateTermRanges(data.terms),
		...validateExamWindows(data.examWindows, termIds),
		...validateEvents(data.events),
	];

	if (errors.length > 0) {
		return { ok: false, errors };
	}

	return { ok: true, data };
}

export interface UpcomingItem {
	id: string;
	kind: "exam" | "event";
	title: string;
	startAt: string;
	endAt?: string;
}

export function getUpcomingItems(
	model: CalendarModel,
	nowIso: string,
	limit = 5,
): UpcomingItem[] {
	const now = toTime(nowIso);
	const exams: UpcomingItem[] = model.examWindows
		.filter((exam) => toTime(exam.endAt) >= now)
		.map((exam) => ({
			id: exam.id,
			kind: "exam",
			title: exam.title,
			startAt: exam.startAt,
			endAt: exam.endAt,
		}));

	const events: UpcomingItem[] = model.events
		.filter((event) => toTime(event.endAt ?? event.startAt) >= now)
		.map((event) => ({
			id: event.id,
			kind: "event",
			title: event.title,
			startAt: event.startAt,
			endAt: event.endAt,
		}));

	return [...exams, ...events]
		.toSorted((a, b) => toTime(a.startAt) - toTime(b.startAt))
		.slice(0, Math.max(1, limit));
}
