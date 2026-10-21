import type { Metadata } from "next";
import PosterBuilder from "@/components/poster-builder/PosterBuilder";
import { getNextPosterEvent } from "@/lib/sheets";
import "./build-a-poster.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build a Poster — CCNYC",
  description: "Make a poster for an upcoming Creative Coding NYC meetup.",
};

export default async function BuildAPosterPage() {
  const event = await getNextPosterEvent();
  const date = event.date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return <PosterBuilder initialDate={date} initialLocation={event.location} />;
}
