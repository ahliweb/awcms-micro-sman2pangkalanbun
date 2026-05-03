import { describe, expect, it } from "vitest";

import { getUpcomingItems, validateCalendarModel } from "../src/schema.js";

describe("academic calendar schema contract", () => {
	it("accepts a valid model", () => {
		const result = validateCalendarModel({
			terms: [
				{
					id: "term-1",
					name: "Semester 1",
					academicYear: "2026/2027",
					locale: "id-ID",
					startDate: "2026-07-15",
					endDate: "2026-12-20",
				},
			],
			examWindows: [
				{
					id: "exam-1",
					termId: "term-1",
					title: "Ujian Tengah Semester",
					kind: "midterm",
					startAt: "2026-09-01T01:00:00.000Z",
					endAt: "2026-09-03T10:00:00.000Z",
				},
			],
			events: [
				{
					id: "evt-1",
					title: "Hari Guru",
					type: "event",
					locale: "id-ID",
					startAt: "2026-11-25T01:00:00.000Z",
					endAt: "2026-11-25T04:00:00.000Z",
				},
			],
		});

		expect(result.ok).toBe(true);
	});

	it("rejects overlapping terms", () => {
		const result = validateCalendarModel({
			terms: [
				{
					id: "term-1",
					name: "Semester 1",
					academicYear: "2026/2027",
					locale: "id-ID",
					startDate: "2026-07-01",
					endDate: "2026-12-31",
				},
				{
					id: "term-2",
					name: "Semester 2",
					academicYear: "2026/2027",
					locale: "id-ID",
					startDate: "2026-12-01",
					endDate: "2027-05-30",
				},
			],
			examWindows: [],
			events: [],
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.some((e) => e.includes("overlap"))).toBe(true);
		}
	});

	it("rejects invalid and overlapping exam windows", () => {
		const result = validateCalendarModel({
			terms: [
				{
					id: "term-1",
					name: "Semester 1",
					academicYear: "2026/2027",
					locale: "id-ID",
					startDate: "2026-07-01",
					endDate: "2026-12-31",
				},
			],
			examWindows: [
				{
					id: "exam-1",
					termId: "term-1",
					title: "Final A",
					kind: "final",
					startAt: "2026-12-10T08:00:00.000Z",
					endAt: "2026-12-12T08:00:00.000Z",
				},
				{
					id: "exam-2",
					termId: "term-1",
					title: "Final B",
					kind: "final",
					startAt: "2026-12-11T08:00:00.000Z",
					endAt: "2026-12-13T08:00:00.000Z",
				},
			],
			events: [],
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.some((e) => e.includes("Exam windows"))).toBe(true);
		}
	});

	it("returns upcoming items in chronological order", () => {
		const result = validateCalendarModel({
			terms: [
				{
					id: "term-1",
					name: "Semester 1",
					academicYear: "2026/2027",
					locale: "id-ID",
					startDate: "2026-07-01",
					endDate: "2026-12-31",
				},
			],
			examWindows: [
				{
					id: "exam-1",
					termId: "term-1",
					title: "UTS",
					kind: "midterm",
					startAt: "2026-09-10T01:00:00.000Z",
					endAt: "2026-09-12T02:00:00.000Z",
				},
			],
			events: [
				{
					id: "event-1",
					title: "Hari Batik",
					type: "event",
					locale: "id-ID",
					startAt: "2026-10-02T01:00:00.000Z",
					endAt: "2026-10-02T03:00:00.000Z",
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const upcoming = getUpcomingItems(result.data, "2026-09-01T00:00:00.000Z", 5);
		expect(upcoming).toHaveLength(2);
		expect(upcoming[0]?.id).toBe("exam-1");
		expect(upcoming[1]?.id).toBe("event-1");
	});
});
