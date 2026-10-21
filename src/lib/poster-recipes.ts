import { ART_DEFAULTS, PALETTES, PATTERNS, type PosterColors, type PosterData } from "../components/poster-builder/types";

export type Recipe = { version: 1; name: string; poster: PosterData };
export type Locks = { structure: boolean; colors: boolean; motion: boolean; texture: boolean };
export const EMPTY_LOCKS: Locks = { structure: false, colors: false, motion: false, texture: false };
export const NUMBER_LIMITS = {
  scale: [.35, 2.5, .05], density: [.35, 2.5, .05], weight: [.25, 3, .05],
  distortion: [0, 1.5, .05], noiseScale: [.25, 4, .05], grain: [0, .4, .01],
  grainSize: [.5, 3, .1], motion: [0, 3, .05], travel: [0, 2, .05], deformation: [0, 2, .05], tempo: [1, 8, 1], rotation: [-180, 180, 1],
} as const;
export type NumberControl = keyof typeof NUMBER_LIMITS;
const HEX = /^#[0-9a-f]{6}$/i;
const finite = (value: unknown, fallback: number, min: number, max: number) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const text = (value: unknown, fallback: string, max: number) => typeof value === "string" ? value.slice(0, max) : fallback;

export function readRecipe(value: unknown, fallback: PosterData): Recipe {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Choose a CCNYC recipe JSON file.");
  const input = value as Record<string, unknown>;
  if (input.version !== 1) throw new Error("Unsupported recipe version. This studio supports version 1.");
  if (!input.poster || typeof input.poster !== "object" || Array.isArray(input.poster)) throw new Error("The recipe is missing its poster settings.");
  const source = input.poster as Record<string, unknown>;
  if (!PATTERNS.some(item => item.id === source.pattern)) throw new Error("The recipe uses an unknown pattern family.");
  const poster: PosterData = {
    ...fallback, ...ART_DEFAULTS,
    title: text(source.title, fallback.title, 24), date: text(source.date, fallback.date, 70),
    location: text(source.location, fallback.location, 100), time: text(source.time, fallback.time, 40),
    pattern: source.pattern as PosterData["pattern"],
    motionStyle: source.motionStyle === "reverse" || source.motionStyle === "pingpong" ? source.motionStyle : "flow",
    palette: Math.round(finite(source.palette, 0, 0, PALETTES.length - 1)),
    seed: Math.round(finite(source.seed, 1, 0, 999999999)),
    variant: Math.round(finite(source.variant, 0, 0, 2)),
    composition: ["center", "diagonal", "mirror"].includes(String(source.composition)) ? source.composition as PosterData["composition"] : "center",
    duration: source.duration === 10 || source.duration === 20 ? source.duration : 15,
    format: source.format === "9:16" ? "9:16" : "4:5",
  };
  for (const [key, bounds] of Object.entries(NUMBER_LIMITS)) {
    const control = key as NumberControl;
    const defaultValue = control === "travel" || control === "deformation" ? 1 : fallback[control];
    poster[control] = finite(source[control], defaultValue, bounds[0], bounds[1]);
  }
  poster.tempo = Math.round(poster.tempo);
  if (source.customArt !== null && source.customArt !== undefined) {
    const art = source.customArt as Record<string, unknown>;
    if (!art || typeof art !== "object" || (art.language !== "glsl" && art.language !== "p5") || typeof art.code !== "string" || art.code.length > 50000) throw new Error("Custom art needs GLSL or p5 code under 50,000 characters.");
    poster.customArt = { enabled: art.enabled === true, language: art.language, code: art.code };
  }
  if (source.customColors !== null && source.customColors !== undefined) {
    const colors = source.customColors as Partial<PosterColors>;
    if (!colors || typeof colors !== "object" || !HEX.test(String(colors.paper)) || !HEX.test(String(colors.ink)) || !Array.isArray(colors.colors) || colors.colors.length !== 3 || !colors.colors.every(color => typeof color === "string" && HEX.test(color))) {
      throw new Error("Custom colors must contain five valid six-digit HEX colors.");
    }
    poster.customColors = { paper: colors.paper!, ink: colors.ink!, colors: [...colors.colors] as [string, string, string] };
  }
  return { version: 1, name: text(input.name, "Imported design", 60), poster };
}

export function recipeFor(poster: PosterData, name = "My CCNYC poster"): Recipe {
  return { version: 1, name, poster: { ...poster } };
}
export function effectiveColors(poster: PosterData): PosterColors {
  return poster.customColors ?? PALETTES[poster.palette] ?? PALETTES[0];
}
export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
}

export type Starter = { id: string; name: string; pattern: PosterData["pattern"]; settings: Partial<PosterData> };
// One neutral starting configuration per generator. The family is not a collection of mood presets.
export const STARTERS: Starter[] = PATTERNS.map((family, index) => ({
  id: family.id,
  name: family.name,
  pattern: family.id,
  settings: {
    ...ART_DEFAULTS,
    pattern: family.id,
    seed: 1019 + index * 821,
    scale: 1, density: 1, weight: 1, distortion: .5,
    motion: 1, travel: 1, deformation: 1,
  },
}));
export function randomizedPoster(poster: PosterData, locks: Locks, random: () => number): PosterData {
  const next = { ...poster };
  if (!locks.structure) {
    next.pattern = PATTERNS[Math.floor(random() * PATTERNS.length)].id;
    next.variant = Math.floor(random() * 3);
    next.seed = Math.floor(random() * 999999999);
    next.scale = .55 + random() * 1.3;
    next.density = .55 + random() * 1.5;
    next.weight = .45 + random() * 1.5;
    next.distortion = random() * 1.3;
    next.noiseScale = .4 + random() * 2.5;
    next.rotation = Math.round((random() - .5) * 90);
    next.composition = (["center", "diagonal", "mirror"] as const)[Math.floor(random() * 3)];
  }
  if (!locks.colors) { next.palette = Math.floor(random() * PALETTES.length); next.customColors = null; }
  if (!locks.motion) { next.motionStyle = (["flow", "reverse", "pingpong"] as const)[Math.floor(random() * 3)]; next.motion = .7 + random() * 1.3; next.travel = .4 + random() * 1.4; next.deformation = .4 + random() * 1.4; next.tempo = 1 + Math.floor(random() * 4); }
  if (!locks.texture) { next.grain = random() * .2; next.grainSize = .6 + random() * 1.8; }
  return next;
}
