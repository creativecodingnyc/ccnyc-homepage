export type Pattern =
  | "ribbons" | "interference" | "orbit" | "grid"
  | "packing" | "guilloche" | "cells" | "contours"
  | "halftone" | "checker" | "rosette" | "constellation";

export type PosterColors = { paper: string; ink: string; colors: [string, string, string] };
export type PosterData = {
  customArt: { enabled: boolean; language: "glsl" | "p5"; code: string } | null;
  title: string;
  date: string;
  time: string;
  location: string;
  pattern: Pattern;
  variant: number;
  palette: number;
  customColors: PosterColors | null;
  seed: number;
  motion: number;
  motionStyle: "flow" | "reverse" | "pingpong";
  travel: number;
  deformation: number;
  scale: number;
  density: number;
  weight: number;
  distortion: number;
  noiseScale: number;
  grain: number;
  grainSize: number;
  tempo: number;
  rotation: number;
  composition: "center" | "diagonal" | "mirror";
  duration: 10 | 15 | 20;
  format: "4:5" | "9:16";
};
export const PATTERNS: { id: Pattern; name: string; description: string; variants: [string, string, string] }[] = [
  { id: "ribbons", name: "Ribbon", description: "Flowing bands", variants: ["Bands", "Threads", "Folded"] },
  { id: "interference", name: "Interference", description: "Crossing wave fields", variants: ["Waves", "Crosshatch", "Echo"] },
  { id: "orbit", name: "Orbit", description: "Circular rhythms", variants: ["Arcs", "Eclipse", "Satellites"] },
  { id: "grid", name: "Playground", description: "Modular geometric print", variants: ["Mixed", "Stripes", "Quarter circles"] },
  { id: "packing", name: "Pebbles", description: "Seeded circle packing", variants: ["Solid", "Rings", "Nested"] },
  { id: "guilloche", name: "Guilloché", description: "Woven parametric curves", variants: ["Spirograph", "Lissajous", "Woven"] },
  { id: "cells", name: "Cellular", description: "Clipped Voronoi mosaics", variants: ["Mosaic", "Windows", "Inset"] },
  { id: "contours", name: "Contours", description: "Topographic level sets", variants: ["Terrain", "Islands", "Ridges"] },
  { id: "halftone", name: "Halftone", description: "Modulated print screens", variants: ["Dots", "Diamonds", "Crosses"] },
  { id: "checker", name: "Op art", description: "Warped tessellations", variants: ["Checker", "Stripes", "Triangles"] },
  { id: "rosette", name: "Rosette", description: "Radial petal symmetries", variants: ["Petals", "Fans", "Lace"] },
  { id: "constellation", name: "Constellation", description: "Networks and star maps", variants: ["Network", "Stars", "Trails"] },
];
export const PALETTES: (PosterColors & { name: string })[] = [
  { name: "Vermilion", paper: "#f4eeda", ink: "#27251f", colors: ["#ee482f", "#e8b4cb", "#353e9c"] },
  { name: "Cobalt", paper: "#dfe9ec", ink: "#153736", colors: ["#2855e9", "#a0cf83", "#77b5d0"] },
  { name: "Acid", paper: "#e2ef91", ink: "#253626", colors: ["#3c653d", "#e95d32", "#8caa4e"] },
  { name: "After hours", paper: "#27282b", ink: "#f3eddf", colors: ["#e994b3", "#d8ee86", "#6c7cc9"] },
  { name: "Signal", paper: "#f7efdc", ink: "#262930", colors: ["#ed5929", "#1752a4", "#f1bc2c"] },
  { name: "Poolside", paper: "#daeee7", ink: "#194b4d", colors: ["#157b84", "#fa805f", "#8cc6d9"] },
  { name: "Orchid", paper: "#e8d9eb", ink: "#382442", colors: ["#9257a8", "#d34069", "#f3a56e"] },
  { name: "Blueprint", paper: "#193c78", ink: "#f0f0d9", colors: ["#e2edce", "#7aaad9", "#f3ab65"] },
  { name: "Newsprint", paper: "#e4e0d3", ink: "#282929", colors: ["#383b3e", "#a7a59c", "#f14736"] },
  { name: "Moss", paper: "#e2e2c7", ink: "#303c2b", colors: ["#71814e", "#bc542d", "#b3b84f"] },
  { name: "Ultraviolet", paper: "#262039", ink: "#eee8df", colors: ["#a48ded", "#f38993", "#cbd97b"] },
  { name: "Candy shop", paper: "#f6deda", ink: "#50312f", colors: ["#ed4c73", "#3c8a9e", "#f5a635"] },
];
export const ART_DEFAULTS = {
  customArt: null,
  motionStyle: "flow",
  variant: 0, customColors: null, density: 1, weight: 1, distortion: .5,
  noiseScale: 1, grain: 0, grainSize: 1, tempo: 1, rotation: 0, composition: "center",
  travel: 1, deformation: 1,
} as const;
