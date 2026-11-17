import { newYorkDateParts, parseSheetDate } from "./meetup-dates";
import { PUBLIC_MEETUP_SHEET_CSV_URL } from "./endpoints";

export type PublicMeetup = {
  date: string;
  dateLabel: string;
  info: string;
};

export function formatMeetingInfo(info: string) {
  const parts = info
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return (parts.length > 2 ? parts.slice(2) : parts).join(", ");
}

export function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

export function upcomingMeetupsFromCsv(
  csv: string,
  now: Date,
  limit = 12,
): PublicMeetup[] {
  const rows = parseCsv(csv);
  const headerIndex = rows.findIndex((row) => row.includes("Meeting date"));
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex];
  const dateIndex = headers.indexOf("Meeting date");
  const infoIndex = headers.indexOf("Info on graphic");
  if (dateIndex < 0 || infoIndex < 0) return [];

  const today = newYorkDateParts(now);
  const todayKey = Date.UTC(today.year, today.month - 1, today.day);
  return rows
    .slice(headerIndex + 1)
    .map((row) => ({
      date: parseSheetDate(row[dateIndex] || ""),
      info: (row[infoIndex] || "").trim(),
    }))
    .filter(
      (item): item is { date: Date; info: string } =>
        item.date !== null &&
        item.date.getUTCDay() === 2 &&
        Date.UTC(
          item.date.getUTCFullYear(),
          item.date.getUTCMonth(),
          item.date.getUTCDate(),
        ) >= todayKey,
    )
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())
    .slice(0, limit)
    .map(({ date, info }) => ({
      date: date.toISOString().slice(0, 10),
      dateLabel: date.toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      info: formatMeetingInfo(info),
    }));
}

export async function getUpcomingPublicMeetups(now = new Date()) {
  try {
    const response = await fetch(PUBLIC_MEETUP_SHEET_CSV_URL, {
      next: { revalidate: 3600 },
    });
    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`);
    return upcomingMeetupsFromCsv(await response.text(), now);
  } catch (error) {
    console.warn("[calendar] Could not load public meetup schedule:", error);
    return [];
  }
}
