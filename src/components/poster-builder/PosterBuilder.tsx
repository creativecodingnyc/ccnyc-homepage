"use client";

import { useState } from "react";
import Link from "next/link";
import HomeNav from "@/components/HomeNav";
import ControlsPanel from "./ControlsPanel";
import PosterPreview from "./PosterPreview";
import type { PosterData } from "./types";
import styles from "./poster-builder.module.css";

type PosterBuilderProps = {
  initialDate: string;
  initialLocation: string;
};

export default function PosterBuilder({
  initialDate,
  initialLocation,
}: PosterBuilderProps) {
  const [poster, setPoster] = useState<PosterData>({
    title: "CCNYC",
    titleX: 50,
    titleY: 12,
    date: initialDate,
    dateX: 50,
    dateY: 62,
    time: "6–8 PM",
    timeX: 50,
    timeY: 74,
    location: initialLocation,
    locationX: 50,
    locationY: 68,
    fontFamily: "tanker",
    fontSize: 132,
    alignment: "center",
    fontColor: "#f3f0e8",
    background: "#3157ff",
    shader: "none",
  });

  const updatePoster = <Key extends keyof PosterData>(
    key: Key,
    value: PosterData[Key],
  ) => {
    setPoster((current) => ({ ...current, [key]: value }));
  };

  const moveContent = (
    key: "title" | "date" | "location" | "time",
    x: number,
    y: number,
  ) => {
    setPoster((current) => ({
      ...current,
      [`${key}X`]: x,
      [`${key}Y`]: y,
    }));
  };

  return (
    <main className={styles.page}>
      <HomeNav />
      <header className={styles.header}>
        <Link href="/">CCNYC</Link>
      </header>

      <div className={styles.workspace}>
        <ControlsPanel poster={poster} onChange={updatePoster} />
        <PosterPreview poster={poster} onMove={moveContent} />
      </div>
    </main>
  );
}
