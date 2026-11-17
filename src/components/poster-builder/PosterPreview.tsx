import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import type { PosterData } from "./types";
import styles from "./poster-builder.module.css";

type PosterPreviewProps = {
  poster: PosterData;
  onMove: (key: ContentKey, x: number, y: number) => void;
};

type ContentKey = "title" | "date" | "location" | "time";

const snap = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value / 5) * 5));

export default function PosterPreview({ poster, onMove }: PosterPreviewProps) {
  const fontFamilies = {
    tanker: "Tanker, sans-serif",
    karla: "Karla, sans-serif",
    mono: '"IBM Plex Mono", monospace',
  };
  const posterStyle = {
    "--poster-accent": poster.background,
    "--poster-ink": poster.fontColor,
    "--poster-font": fontFamilies[poster.fontFamily],
    "--poster-title-size": `${poster.fontSize}px`,
    "--poster-align": poster.alignment,
  } as CSSProperties;
  const position = (x: number, y: number) => ({ left: `${x}%`, top: `${y}%` });

  const startDrag = (key: ContentKey, event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    const posterElement = event.currentTarget.closest("article");
    if (!posterElement) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: globalThis.PointerEvent) => {
      const bounds = posterElement.getBoundingClientRect();
      onMove(
        key,
        snap(((moveEvent.clientX - bounds.left) / bounds.width) * 100),
        snap(((moveEvent.clientY - bounds.top) / bounds.height) * 100),
      );
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const nudge = (
    key: ContentKey,
    x: number,
    y: number,
    event: KeyboardEvent<HTMLElement>,
  ) => {
    const movement = {
      ArrowLeft: [-5, 0],
      ArrowRight: [5, 0],
      ArrowUp: [0, -5],
      ArrowDown: [0, 5],
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    onMove(key, snap(x + movement[0]), snap(y + movement[1]));
  };

  return (
    <section className={styles.preview} aria-label="Poster preview">
      <article
        className={styles.poster}
        style={posterStyle}
        data-shader={poster.shader}
      >
        <h2
          className={styles.movable}
          style={position(poster.titleX, poster.titleY)}
          tabIndex={0}
          onPointerDown={(event) => startDrag("title", event)}
          onKeyDown={(event) =>
            nudge("title", poster.titleX, poster.titleY, event)
          }
        >
          {poster.title || "Untitled poster"}
        </h2>
        <p
          className={`${styles.detail} ${styles.movable}`}
          style={position(poster.dateX, poster.dateY)}
          tabIndex={0}
          onPointerDown={(event) => startDrag("date", event)}
          onKeyDown={(event) =>
            nudge("date", poster.dateX, poster.dateY, event)
          }
        >
          {poster.date}
        </p>
        <p
          className={`${styles.detail} ${styles.movable}`}
          style={position(poster.locationX, poster.locationY)}
          tabIndex={0}
          onPointerDown={(event) => startDrag("location", event)}
          onKeyDown={(event) =>
            nudge("location", poster.locationX, poster.locationY, event)
          }
        >
          {poster.location}
        </p>
        <p
          className={`${styles.detail} ${styles.movable}`}
          style={position(poster.timeX, poster.timeY)}
          tabIndex={0}
          onPointerDown={(event) => startDrag("time", event)}
          onKeyDown={(event) =>
            nudge("time", poster.timeX, poster.timeY, event)
          }
        >
          {poster.time}
        </p>
      </article>
    </section>
  );
}
