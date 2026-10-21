import type { PosterData } from "../components/poster-builder/types";
import { PALETTES } from "../components/poster-builder/types";
export type CustomArt = { enabled: boolean; language: "glsl" | "p5"; code: string };
export const GLSL_STARTER = `precision highp float;
uniform vec2 u_resolution;
uniform float u_phase, u_seed, u_motion, u_scale, u_density;
uniform vec3 u_paper, u_color1, u_color2, u_color3;
void main() {
  vec2 uv = (gl_FragCoord.xy - .5*u_resolution) / u_resolution.y;
  float t = u_phase * 6.2831853;
  float wave = sin(uv.x*9.0/u_scale + sin(uv.y*6.0 + u_seed*.001) + sin(t)*u_motion);
  float bands = .5 + .5*sin((uv.y*8.0 + wave)*max(.35,u_density) + cos(t)*u_motion);
  vec3 ink = mix(u_color1, u_color2, smoothstep(.2,.8,bands));
  ink = mix(ink,u_color3,smoothstep(.7,1.0,bands));
  gl_FragColor = vec4(mix(u_paper,ink,smoothstep(.08,.14,bands)),1.0);
}`;
export const P5_STARTER = `// p is a real p5.js instance. The studio owns the canvas and clock.
function setup(p, frame) {
  p.noStroke();
}
function draw(p, frame) {
  p.background(frame.paper);
  const t = frame.phase * p.TWO_PI;
  const count = Math.round(16 * frame.density);
  for (let i = 0; i < count; i++) {
    const x = (i + .5) * p.width / count;
    const y = p.height * (.5 + .28 * Math.sin(t + i * .4) * frame.motion);
    p.fill(frame.colors[i % 3]);
    p.circle(x, y, p.width / count * 1.6 * frame.scale);
  }
}`;
export function customArtSize(width: number, height: number) { return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height - 590 * width / 1000)) }; }
export function createCustomRenderer(art: CustomArt) {
  const iframe = document.createElement("iframe");
  iframe.sandbox.add("allow-scripts"); iframe.src = "/custom-art/sandbox.html"; iframe.title = "Isolated custom artwork"; iframe.setAttribute("aria-hidden", "true"); iframe.tabIndex = -1;
  Object.assign(iframe.style, { position: "fixed", left: "-10000px", top: "0", width: "1px", height: "1px", border: "0", pointerEvents: "none" });
  const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  let stopped = false, nextId = 1, chain: Promise<unknown> = Promise.resolve();
  const pending = new Map<number, { resolve: (value: HTMLCanvasElement) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>; width: number; height: number }>();
  let readyResolve: () => void, readyReject: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const initialTimer = setTimeout(() => readyReject(new Error("Custom code did not start. Check your code and run again.")), 12000);
  const params = (poster: PosterData, phase: number, width: number, height: number) => {
    const palette = poster.customColors ?? PALETTES[poster.palette] ?? PALETTES[0];
    const raw = (((phase * poster.tempo) % 1) + 1) % 1;
    const progress = poster.motion === 0 ? 0 : poster.motionStyle === "reverse" ? (1 - raw) % 1 : poster.motionStyle === "pingpong" ? .5 - .5 * Math.cos(raw * Math.PI * 2) : raw;
    return { ...poster, customArt: undefined, ...palette, phase: progress, time: progress * poster.duration, width, height };
  };
  const receive = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow || event.data?.channel !== "ccnyc-custom-art") return;
    const data = event.data;
    if (data.id === 0) { clearTimeout(initialTimer); if (data.type === "error") readyReject(new Error(String(data.message))); else if (data.type === "ready") readyResolve(); return; }
    const task = pending.get(data.id);
    if (!task) { data.bitmap?.close?.(); return; }
    pending.delete(data.id); clearTimeout(task.timer);
    if (data.type === "error") { task.reject(new Error(String(data.message))); return; }
    try { canvas.width = task.width; canvas.height = task.height; context.drawImage(data.bitmap, 0, 0, task.width, task.height); data.bitmap.close(); task.resolve(canvas); }
    catch (error) { data.bitmap?.close?.(); task.reject(error instanceof Error ? error : new Error("Could not read the custom frame.")); }
  };
  window.addEventListener("message", receive);
  // Defer initialization until the sandbox document has loaded; the first render supplies its frame context.
  let initialized = false;
  const loaded = new Promise<void>(resolve => iframe.onload = () => resolve());
  document.body.append(iframe);
  return {
    render(poster: PosterData, phase: number, width: number, height: number): Promise<HTMLCanvasElement> {
      const request = async () => {
        if (stopped) throw new Error("Custom renderer stopped.");
        const frame = params(poster, phase, width, height);
        if (!initialized) { initialized = true; await loaded; if (stopped) throw new Error("Custom renderer stopped."); iframe.contentWindow!.postMessage({ channel: "ccnyc-custom-art", type: "init", art, params: frame }, "*"); }
        await ready;
        if (stopped) throw new Error("Custom renderer stopped.");
        return new Promise<HTMLCanvasElement>((resolve, reject) => {
          const id = nextId++;
          const timer = setTimeout(() => { pending.delete(id); reject(new Error("Custom frame timed out. Simplify the code and run again.")); }, 5000);
          pending.set(id, { resolve, reject, timer, width, height });
          iframe.contentWindow!.postMessage({ channel: "ccnyc-custom-art", type: "render", id, params: frame }, "*");
        });
      };
      const result = chain.then(request); chain = result.catch(() => {}); return result;
    },
    dispose() {
      if (stopped) return; stopped = true; clearTimeout(initialTimer); readyReject(new Error("Custom renderer stopped.")); ready.catch(() => {});
      for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error("Custom renderer stopped.")); }
      pending.clear(); window.removeEventListener("message", receive); iframe.remove();
    },
  };
}
