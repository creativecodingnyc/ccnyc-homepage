import "server-only";
import {
  nextTuesday,
  selectNextEvent,
  sheetRowsToEvents,
  type SheetRow,
} from "@/lib/meetup-dates";

export {
  sheetRowsToEvents,
  type MeetupEvent,
  type SheetRow,
} from "@/lib/meetup-dates";

export async function fetchSheetRows(range: string): Promise<SheetRow[]> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!apiKey || !sheetId) return [];

  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`);
    const data: { values?: string[][] } = await response.json();
    const [header, ...body] = data.values ?? [];
    if (!header) return [];
    const keys = header.map((key) => key.trim());
    return body
      .filter((row) => row.some((cell) => cell?.trim()))
      .map((row) =>
        Object.fromEntries(
          keys.map((key, index) => [key, (row[index] ?? "").trim()]),
        ),
      );
  } catch (error) {
    console.warn(`[sheets] Could not read ${range}:`, error);
    return [];
  }
}

export async function getNextPosterEvent() {
  const events = sheetRowsToEvents(
    await fetchSheetRows("'Poster Signups'!A2:L"),
  );
  const now = new Date();
  const upcoming = selectNextEvent(events, now);
  if (upcoming)
    return { date: upcoming.date, location: upcoming.event.location };
  return { date: nextTuesday(now), location: "Location TBA" };
}
