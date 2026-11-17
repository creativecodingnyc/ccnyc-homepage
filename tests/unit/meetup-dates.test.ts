import { describe, expect, it } from "vitest";
import {
  newYorkDateParts,
  nextTuesday,
  parseSheetDate,
  selectNextEvent,
  sheetRowsToEvents,
} from "../../src/lib/meetup-dates";

describe("parseSheetDate", () => {
  it("parses ISO and Google Sheets formatted dates deterministically", () => {
    expect(parseSheetDate("2026-11-17")?.toISOString()).toBe(
      "2026-11-17T12:00:00.000Z",
    );
    expect(parseSheetDate("11/24/2026")?.toISOString()).toBe(
      "2026-11-24T12:00:00.000Z",
    );
    expect(parseSheetDate("11/24/26")?.toISOString()).toBe(
      "2026-11-24T12:00:00.000Z",
    );
  });

  it("rejects invalid and ambiguous dates", () => {
    expect(parseSheetDate("2/30/2026")).toBeNull();
    expect(parseSheetDate("November 17")).toBeNull();
  });
});

describe("New York calendar logic", () => {
  it("uses New York's date across a UTC date boundary", () => {
    expect(newYorkDateParts(new Date("2026-11-18T02:00:00Z"))).toEqual({
      year: 2026,
      month: 11,
      day: 17,
    });
  });

  it("returns the following Tuesday, including when today is Tuesday", () => {
    expect(nextTuesday(new Date("2026-11-16T17:00:00Z")).toISOString()).toBe(
      "2026-11-17T12:00:00.000Z",
    );
    expect(nextTuesday(new Date("2026-11-17T17:00:00Z")).toISOString()).toBe(
      "2026-11-24T12:00:00.000Z",
    );
  });
});

describe("sheet event conversion", () => {
  it("applies defaults and respects overrides", () => {
    expect(
      sheetRowsToEvents([
        { "Meeting date": "11/17/2026", Classroom: "Oyster" },
        {
          "Meeting date": "11/24/2026",
          "Override title": "Showcase",
          "Override time": "7 PM",
          "Override location": "Online",
        },
      ]),
    ).toEqual([
      {
        date: "11/17/2026",
        time: "6PM-8PM",
        title: "CCNYC meetup",
        location: "Pier 57, Oyster classroom",
      },
      {
        date: "11/24/2026",
        time: "7 PM",
        title: "Showcase",
        location: "Online",
      },
    ]);
  });

  it("selects today's event and sorts unsorted rows", () => {
    const events = sheetRowsToEvents([
      { "Meeting date": "11/24/2026" },
      { "Meeting date": "11/10/2026" },
      { "Meeting date": "11/17/2026", "Override location": "Today" },
    ]);
    expect(
      selectNextEvent(events, new Date("2026-11-17T15:00:00Z"))?.event.location,
    ).toBe("Today");
  });
});
