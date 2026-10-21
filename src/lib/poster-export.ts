import { createCustomRenderer, customArtSize } from "./custom-art";
import { drawPoster, posterDimensions } from "./poster-renderer";
import type { PosterData } from "../components/poster-builder/types";
export function videoFormat() {
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement.prototype.captureStream !== "function") return null;
  return ["video/mp4;codecs=avc1.42E01E", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(type => MediaRecorder.isTypeSupported(type)) ?? null;
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export async function posterFonts() { await Promise.all([document.fonts.load("100px Tanker"), document.fonts.load("600 40px Karla")]); }
export async function exportStill(poster: PosterData, phase: number) {
  await posterFonts();
  const custom = poster.customArt?.enabled ? createCustomRenderer(poster.customArt) : null;
  try {
    const canvas = document.createElement("canvas"); Object.assign(canvas, posterDimensions(poster.format));
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas is unavailable.");
    const size = customArtSize(canvas.width, canvas.height);
    const art = custom ? await custom.render(poster, phase, size.width, size.height) : undefined;
    drawPoster(ctx, poster, phase, false, art);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not create the image. Please try again.");
    saveBlob(blob, `ccnyc-${poster.seed}.png`);
  } finally { custom?.dispose(); }
}
export async function exportVideo(poster: PosterData, signal: AbortSignal, progress: (n: number) => void) {
  const mimeType = videoFormat(); if (!mimeType) throw new Error("Video recording is unavailable in this browser. Download a PNG instead.");
  await posterFonts();
  if (signal.aborted) throw new Error("Export cancelled.");
  const custom = poster.customArt?.enabled ? createCustomRenderer(poster.customArt) : null;
  const cancelCustom = () => custom?.dispose();
  signal.addEventListener("abort", cancelCustom, { once: true });
  try {
  const canvas = document.createElement("canvas"); Object.assign(canvas, posterDimensions(poster.format, 1080));
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas is unavailable.");
  const size = customArtSize(canvas.width, canvas.height);
  const render = async (phase: number) => { const art = custom ? await custom.render(poster, phase, size.width, size.height) : undefined; drawPoster(ctx, poster, phase, false, art); };
  await render(0);
  const stream = canvas.captureStream(30);
  let recorder: MediaRecorder;
  try { recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 }); }
  catch (error) { stream.getTracks().forEach(track => track.stop()); throw error; }
  return await new Promise<void>((resolve, reject) => {
    const chunks: Blob[] = []; let frame = 0, last = 0, lastProgress = 0, failed = false;
    const cleanup = () => { cancelAnimationFrame(frame); stream.getTracks().forEach(track => track.stop()); signal.removeEventListener("abort", cancel); document.removeEventListener("visibilitychange", hidden); };
    const fail = (message: string) => { if (failed) return; failed = true; if (recorder.state !== "inactive") recorder.stop(); cleanup(); reject(new Error(message)); };
    const cancel = () => fail("Export cancelled.");
    const hidden = () => { if (document.hidden) fail("Export stopped because the tab was hidden. Keep this tab open while recording."); };
    signal.addEventListener("abort", cancel, { once: true }); document.addEventListener("visibilitychange", hidden);
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => fail("Recording failed. Try another browser or download a PNG.");
    recorder.onstop = () => { cleanup(); if (failed) return; const blob = new Blob(chunks, { type: recorder.mimeType }); if (!blob.size) { reject(new Error("The recording was empty. Please try again.")); return; } saveBlob(blob, `ccnyc-${poster.seed}.${recorder.mimeType.includes("mp4") ? "mp4" : "webm"}`); progress(1); resolve(); };
    if (document.hidden || signal.aborted) { fail("Keep this tab open to start recording."); return; }
    try { recorder.start(); } catch { fail("Could not start recording. Try another browser or download a PNG."); return; } const start = performance.now();
    const tick = async (now: number) => {
      if (failed) return;
      const elapsed = (now - start) / 1000;
      if (elapsed >= poster.duration) { recorder.stop(); return; }
      if (now - last >= 1000 / 30) { try { await render(elapsed / poster.duration); } catch (error) { fail(error instanceof Error ? error.message : "Custom frame failed."); return; } if (failed) return; if (now - lastProgress > 150) { progress(elapsed / poster.duration); lastProgress = now; } last = now; }
      frame = requestAnimationFrame(tick);
    }; frame = requestAnimationFrame(tick);
  });
  } catch (error) { if (signal.aborted) throw new Error("Export cancelled."); throw error; }
  finally { signal.removeEventListener("abort", cancelCustom); custom?.dispose(); }
}
