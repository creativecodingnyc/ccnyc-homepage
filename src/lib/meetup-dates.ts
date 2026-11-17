export type SheetRow = Record<string, string>;

export type MeetupEvent = {
  date: string;
  time: string;
  title: string;
  location: string;
};

export function sheetRowsToEvents(rows: SheetRow[]): MeetupEvent[] {
  return rows.map((row) => ({
    date: row["Meeting date"],
    time: row["Override time"] || "6PM-8PM",
    title: row["Override title"] || "CCNYC meetup",
    location:
      row["Override location"] ||
      `Pier 57, ${row["Classroom"] ? `${row["Classroom"]} classroom` : "classroom TBD"}`,
  }));
}

export function parseSheetDate(value: string): Date | null {
  const match = value
    .trim()
    .match(
      /^(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4}))$/,
    );
  if (!match) return null;

  const parsedYear = Number(match[1] || match[6]);
  const year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
  const month = Number(match[2] || match[4]);
  const day = Number(match[3] || match[5]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function newYorkDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

export function nextTuesday(now: Date): Date {
  const { year, month, day } = newYorkDateParts(now);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCDate(date.getUTCDate() + ((2 - date.getUTCDay() + 7) % 7 || 7));
  return date;
}

export function selectNextEvent(events: MeetupEvent[], now: Date) {
  const today = newYorkDateParts(now);
  const todayKey = Date.UTC(today.year, today.month - 1, today.day);
  return events
    .map((event) => ({ event, date: parseSheetDate(event.date) }))
    .filter(
      (item): item is { event: MeetupEvent; date: Date } =>
        item.date !== null &&
        Date.UTC(
          item.date.getUTCFullYear(),
          item.date.getUTCMonth(),
          item.date.getUTCDate(),
        ) >= todayKey,
    )
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())[0];
}
