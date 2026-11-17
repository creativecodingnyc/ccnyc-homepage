import { describe, expect, it } from "vitest";
import {
  formatMeetingInfo,
  parseCsv,
  upcomingMeetupsFromCsv,
} from "../../src/lib/public-meetups";

const csv = `"Private intro with
a line break",,,,,
Name,Instagram,Due date,Meeting date,Info on graphic,Notes
Person,,11/13/26,11/17/26,"Creative Coding NYC, Tuesday, TBD, 6-8PM",private
Person,,11/20/26,11/24/26,"Creative Coding NYC, Tuesday, Pier 57, 6-8PM",private
Person,,11/21/26,11/25/26,"Not a Tuesday",private
Person,,11/6/26,11/10/26,"Past meetup",private`;

describe("public meetup CSV", () => {
  it("removes the repeated event name and weekday from meeting details", () => {
    expect(
      formatMeetingInfo("Creative Coding NYC, Tuesday, Pier 57, 6-8PM"),
    ).toBe("Pier 57, 6-8PM");
  });

  it("parses quoted commas and line breaks", () => {
    const rows = parseCsv(csv);
    expect(rows[0][0]).toContain("a line break");
    expect(rows[2][4]).toBe("Creative Coding NYC, Tuesday, TBD, 6-8PM");
  });

  it("returns only upcoming Tuesdays and exposes only public fields", () => {
    expect(
      upcomingMeetupsFromCsv(csv, new Date("2026-11-17T17:00:00Z")),
    ).toEqual([
      {
        date: "2026-11-17",
        dateLabel: "Nov 17, 2026",
        info: "TBD, 6-8PM",
      },
      {
        date: "2026-11-24",
        dateLabel: "Nov 24, 2026",
        info: "Pier 57, 6-8PM",
      },
    ]);
  });
});
