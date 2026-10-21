"use client";
import { useEffect, useRef, useState } from "react";
import ControlsPanel from "./ControlsPanel";
import PosterPreview from "./PosterPreview";
import { exportStill, exportVideo, videoFormat } from "@/lib/poster-export";
import { ART_DEFAULTS, type PosterData } from "./types";
import styles from "./poster-builder.module.css";
export default function PosterBuilder({ initialDate, initialLocation }: { initialDate: string; initialLocation: string }) {
  const [poster, setPoster] = useState<PosterData>({ ...ART_DEFAULTS, title: "CCNYC", date: initialDate, location: initialLocation, time: "6–8 PM", pattern: "ribbons", palette: 0, seed: Array.from(initialDate).reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) % 1000000, 17), motion: 1, scale: 1, duration: 15, format: "4:5" });
  const [playing, setPlaying] = useState(false), [phase, setPhase] = useState(0), [format, setFormat] = useState<string | null>(null), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [message, setMessage] = useState("");
  const [codeWorkspace, setCodeWorkspace] = useState(false);
  const abort = useRef<AbortController | null>(null), scrubber = useRef<HTMLInputElement>(null), elapsed = useRef<HTMLOutputElement>(null), currentPhase = useRef(0);
  useEffect(() => { const reduce = matchMedia("(prefers-reduced-motion: reduce)"); setPlaying(!reduce.matches); setFormat(videoFormat()); return () => abort.current?.abort(); }, []);
  const update = <K extends keyof PosterData>(key: K, value: PosterData[K]) => {
    if (key === "motion") setPlaying(Number(value) > 0);
    setPoster(previous => ({ ...previous, [key]: value }));
  };
  const applyPoster = (next: PosterData) => {
    if (next.motion === 0) setPlaying(false);
    setPoster(next);
  };
  const syncPhase = (value: number) => { currentPhase.current = value; if (scrubber.current) scrubber.current.value = String(value); if (elapsed.current) elapsed.current.textContent = `${(value * poster.duration).toFixed(1)} / ${poster.duration}s`; };
  const record = async () => { const controller = new AbortController(); abort.current = controller; setBusy(true); setPlaying(false); setProgress(0); setMessage(""); try { await exportVideo(poster, controller.signal, setProgress); setMessage("Your video is ready. Download started."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not export the video."); } finally { abort.current = null; setBusy(false); } };
  const still = async () => { setMessage(""); try { await exportStill(poster, currentPhase.current); setMessage("Your PNG is ready. Download started."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not export the image."); } };
  return <main className={styles.page}>
    <header className={styles.header}><a className={styles.brand} href="/" aria-label="CCNYC homepage">CCNYC<span>Poster studio</span></a><div className={styles.headerActions}><button type="button" disabled={busy} onClick={still}>Download PNG</button><button className={styles.primary} type="button" disabled={busy || !format} onClick={record}>{busy ? `Recording ${Math.round(progress * 100)}%` : `Export ${format?.includes("mp4") ? "MP4" : "WebM"} ↗`}</button></div></header>
    <div className={`${styles.workspace} ${codeWorkspace ? styles.codeWorkspace : ""}`}><section className={styles.previewArea} aria-label="Live poster preview"><div className={styles.canvasStage}><PosterPreview poster={poster} playing={playing && !busy && poster.motion > 0} phase={phase} onPhase={syncPhase} onError={setMessage} /></div><div className={styles.transport}><button type="button" disabled={busy || poster.motion === 0} onClick={() => setPlaying(value => !value)} aria-label={poster.motion === 0 ? "Still mode: increase motion intensity to play" : playing ? "Pause animation" : "Play animation"} title={poster.motion === 0 ? "Increase motion intensity to play" : undefined}>{poster.motion === 0 ? "Still" : playing ? "Pause" : "Play"}</button><input ref={scrubber} type="range" aria-label="Animation timeline" min="0" max="1" step="0.001" defaultValue="0" disabled={busy} onChange={event => { const value = Number(event.target.value); setPlaying(false); setPhase(value); syncPhase(value); }} /><output ref={elapsed}>0.0 / {poster.duration}s</output><span className={styles.loopLabel}>Seamless loop</span></div></section><ControlsPanel poster={poster} onChange={update} onApply={applyPoster} disabled={busy} onWorkspaceChange={setCodeWorkspace} /></div>
    <footer className={styles.footer}><span>Creative Coding NYC</span><span>{format ? `${poster.duration}s video · 1080px · ${format.includes("mp4") ? "MP4" : "WebM"}` : "PNG available · Video requires a supported browser"}</span></footer>
    {busy && <div className={styles.recording} role="status"><div><strong>Recording your {poster.duration}s loop… {Math.round(progress * 100)}%</strong><span>Keep this tab open. Your poster records in real time.</span><progress value={progress} max={1} /></div><button type="button" onClick={() => abort.current?.abort()}>Cancel</button></div>}
    {message && <div className={styles.notice} role="status">{message}<button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}>Close</button></div>}
  </main>;
}
