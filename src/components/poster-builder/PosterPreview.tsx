"use client";
import { useEffect, useRef } from "react";
import { drawPoster } from "@/lib/poster-renderer";
import { createCustomRenderer, customArtSize } from "@/lib/custom-art";
import { createLatestPainter } from "@/lib/latest-painter";
import { posterFonts } from "@/lib/poster-export";
import type { PosterData } from "./types";
import styles from "./poster-builder.module.css";
export default function PosterPreview({ poster, playing, phase, onPhase, onError }: { poster: PosterData; playing: boolean; phase: number; onPhase: (n: number) => void; onError: (message: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), position = useRef(phase), callback = useRef(onPhase), latestPoster = useRef(poster);
  const isPlaying = useRef(playing), resizeLatest = useRef<() => void>(() => {}), syncPlayback = useRef<() => void>(() => {});
  const runtime = useRef<ReturnType<typeof createCustomRenderer> | null>(null), paintLatest = useRef<() => void>(() => {}), errorCallback = useRef(onError), lastError = useRef("");
  useEffect(() => { errorCallback.current = onError; }, [onError]);
  useEffect(() => {
    lastError.current = "";
    if (!poster.customArt?.enabled) { runtime.current = null; return; }
    const renderer = createCustomRenderer(poster.customArt); runtime.current = renderer;
    return () => { renderer.dispose(); if (runtime.current === renderer) runtime.current = null; };
  }, [poster.customArt?.enabled, poster.customArt?.language, poster.customArt?.code]);
  useEffect(() => { latestPoster.current = poster; paintLatest.current(); }, [poster]);
  useEffect(() => { resizeLatest.current(); }, [poster.format]);
  useEffect(() => { isPlaying.current = playing; syncPlayback.current(); }, [playing]);
  useEffect(() => { callback.current = onPhase; }, [onPhase]);
  useEffect(() => { position.current = phase; paintLatest.current(); }, [phase]);
  useEffect(() => {
    const element = canvas.current; if (!element) return;
    const ctx = element.getContext("2d"); if (!ctx) return;
    let active = true, frame = 0, last = 0, update = 0;
    const painter = createLatestPainter(async () => {
      if (!active) return;
      const poster = latestPoster.current;
      const renderer = runtime.current, current = position.current;
      const width = element.width, height = element.height;
      try {
        const size = customArtSize(element.width, element.height);
        const art = poster.customArt?.enabled && renderer ? await renderer.render(poster, current, size.width, size.height) : undefined;
        if (active && poster === latestPoster.current && renderer === runtime.current && width === element.width && height === element.height) drawPoster(ctx, poster, current, false, art);
        else if (active) painter.request();
      } catch (error) { if (active) { const message = error instanceof Error ? error.message : "Custom artwork failed."; if (lastError.current !== message) { lastError.current = message; errorCallback.current(message); } } }
    });
    const paint = () => painter.request();
    paintLatest.current = paint;
    posterFonts().then(() => { if (active) paint(); }).catch(() => { if (active) paint(); });
    const stage = element.parentElement;
    const resize = () => {
      if (!stage) return;
      const rect = stage.getBoundingClientRect(), aspect = latestPoster.current.format === "4:5" ? 4 / 5 : 9 / 16;
      const cssWidth = Math.max(1, Math.min(rect.width, rect.height * aspect));
      element.style.width = `${cssWidth}px`; element.style.height = `${cssWidth / aspect}px`;
      const width = Math.min(900, Math.round(cssWidth * Math.min(devicePixelRatio, 1.5)));
      const height = Math.round(width / aspect);
      if (element.width !== width || element.height !== height) { element.width = width; element.height = height; paint(); }
    };
    resizeLatest.current = resize;
    const observer = new ResizeObserver(resize); if (stage) observer.observe(stage); resize();
    const tick = (now: number) => {
      if (now - last >= 1000 / 30) { const delta = last ? Math.min(now - last, 100) : 0; last = now; position.current = (position.current + delta / (latestPoster.current.duration * 1000)) % 1; paint(); if (now - update > 120) { callback.current(position.current); update = now; } }
      frame = requestAnimationFrame(tick);
    };
    const visibility = () => { cancelAnimationFrame(frame); last = 0; if (isPlaying.current && !document.hidden) frame = requestAnimationFrame(tick); };
    syncPlayback.current = visibility;
    document.addEventListener("visibilitychange", visibility); visibility();
    return () => { active = false; painter.dispose(); paintLatest.current = () => {}; resizeLatest.current = () => {}; syncPlayback.current = () => {}; cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <canvas ref={canvas} className={styles.poster} style={{ aspectRatio: poster.format === "4:5" ? "4 / 5" : "9 / 16" }} role="img" aria-label={`${poster.title}, ${poster.date}, ${poster.location}, ${poster.time}. Animated ${poster.customArt?.enabled ? `custom ${poster.customArt.language}` : poster.pattern} poster.`} />;
}
