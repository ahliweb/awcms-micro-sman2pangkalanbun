import type { PluginDescriptor } from "emdash";

export {
	calendarModelSchema,
	termSchema,
	examWindowSchema,
	calendarEventSchema,
	validateCalendarModel,
	getUpcomingItems,
} from "./schema.js";
export type {
	AcademicTerm,
	ExamWindow,
	CalendarEvent,
	CalendarModel,
	UpcomingItem,
	ValidationResult,
} from "./schema.js";

export function academicCalendarPlugin(): PluginDescriptor {
	return {
		id: "academic-calendar",
		version: "0.0.1",
		format: "standard",
		entrypoint: "@emdash-cms/plugin-academic-calendar/sandbox",
		capabilities: ["content:read"],
		storage: {
			terms: { indexes: ["academicYear", "startDate", "endDate"] },
			exam_windows: { indexes: ["termId", "startAt", "endAt", "kind"] },
			events: { indexes: ["type", "startAt", "endAt", "locale"] },
		},
		adminPages: [{ path: "/calendar", label: "Academic Calendar", icon: "calendar" }],
		adminWidgets: [{ id: "upcoming-calendar", title: "Upcoming Calendar", size: "half" }],
	};
}
