import { PALETTES, type PosterData } from "../components/poster-builder/types";

const TAU = Math.PI * 2;
type Point = { x: number; y: number; radius: number; phase: number; color: number };
type Geometry = { points: Point[]; cells: { polygon: [number, number][]; color: number }[] };
const geometryCache = new Map<string, Geometry>();
const grainCache = new Map<string, { mask: HTMLCanvasElement; canvas: HTMLCanvasElement; color: string }>();

export function randomGenerator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
export function posterDimensions(format: PosterData["format"], width = 1080) {
  return { width, height: Math.round(width * (format === "4:5" ? 1.25 : 16 / 9)) };
}
function cachePut<T>(cache: Map<string, T>, key: string, value: T, max: number) {
  if (cache.size >= max) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
  return value;
}
function clipPolygon(polygon: [number, number][], nx: number, ny: number, limit: number) {
  const result: [number, number][] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = a[0] * nx + a[1] * ny - limit;
    const db = b[0] * nx + b[1] * ny - limit;
    if (da <= 0) result.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const ratio = da / (da - db);
      result.push([a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio]);
    }
  }
  return result;
}
function geometry(poster: PosterData): Geometry {
  const key = `${poster.pattern}:${poster.seed}:${poster.density}:${poster.scale}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;
  const random = randomGenerator(poster.seed);
  const points: Point[] = [];
  const cells: Geometry["cells"] = [];
  const count = Math.round((poster.pattern === "cells" ? 23 : 55) * poster.density / Math.sqrt(poster.scale));
  for (let attempt = 0; attempt < (poster.pattern === "packing" ? 2200 : count); attempt++) {
    const point = { x: random() * 1160 - 80, y: random() * 860 + 170, radius: (18 + random() * 75) * poster.scale / Math.sqrt(poster.density), phase: random() * TAU, color: Math.floor(random() * 3) };
    if (poster.pattern === "packing") {
      let radius = Math.min(point.radius, 120);
      for (const other of points) radius = Math.min(radius, Math.hypot(point.x - other.x, point.y - other.y) - other.radius - 5);
      if (radius < 9) continue;
      point.radius = radius;
    }
    points.push(point);
    if (points.length >= count && poster.pattern === "packing") break;
  }
  if (poster.pattern === "cells") {
    for (const point of points) {
      let polygon: [number, number][] = [[-150, 120], [1150, 120], [1150, 1080], [-150, 1080]];
      for (const other of points) {
        if (other === point || !polygon.length) continue;
        const nx = other.x - point.x, ny = other.y - point.y;
        polygon = clipPolygon(polygon, nx, ny, (other.x ** 2 + other.y ** 2 - point.x ** 2 - point.y ** 2) / 2);
      }
      cells.push({ polygon, color: point.color });
    }
  }
  return cachePut(geometryCache, key, { points, cells }, 24);
}
function grainTexture(poster: PosterData, color: string) {
  if (typeof document === "undefined") return null;
  const key = `${poster.seed}:${poster.grainSize}`;
  let cached = grainCache.get(key);
  if (!cached) {
    const mask = document.createElement("canvas"), canvas = document.createElement("canvas");
    mask.width = canvas.width = 256; mask.height = canvas.height = 256;
    const ctx = mask.getContext("2d");
    if (!ctx) return null;
    const random = randomGenerator(poster.seed ^ 98743);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 2200; i++) {
      ctx.globalAlpha = .15 + random() * .65;
      const size = (.3 + random()) * poster.grainSize;
      ctx.fillRect(random() * 256, random() * 256, size, size);
    }
    cached = cachePut(grainCache, key, { mask, canvas, color: "" }, 8);
  }
  if (cached.color !== color) {
    const ctx = cached.canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, 256, 256);
    ctx.drawImage(cached.mask, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalCompositeOperation = "source-over";
    cached.color = color;
  }
  return cached.canvas;
}
function fitText(ctx: CanvasRenderingContext2D, text: string, max: number, size: number, family: string, weight = "400") {
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > max && size > 10) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
}

function drawArt(ctx: CanvasRenderingContext2D, p: PosterData, time: number, colors: string[], paper: string) {
  const random = randomGenerator(p.seed);
  const loopTime = p.motionStyle === "reverse" ? -time : p.motionStyle === "pingpong" ? Math.PI * (1 - Math.cos(time)) : time;
  const cycle = loopTime * p.tempo;
  // Gentle periodic easing softens dense-field raster changes at the loop join.
  const t = cycle - .25 * Math.sin(cycle), motion = p.motion, density = p.density;
  const travel = motion * (p.travel ?? 1), deformation = motion * (p.deformation ?? 1);
  // The seed changes aspect, orientation, harmonics and local structure, not colors or an animation timestamp.
  const seedPhase = random() * TAU;
  const seedWidth = .7 + random() * .6, seedHeight = .75 + random() * .5;
  const seedTilt = (random() - .5) * .65;
  const harmonic = 2 + Math.floor(random() * 5);
  const warp = (x: number, y: number) =>
    p.distortion * (Math.sin(x * .007 * p.noiseScale + y * .003 + seedPhase) * 44 + Math.cos(y * .009 * p.noiseScale + seedPhase) * 25)
    + deformation * (Math.sin(x * .005 * p.noiseScale + t + seedPhase) * 42 + Math.cos(y * .006 * p.noiseScale - t + seedPhase) * 30);
  ctx.save();
  ctx.translate(500 + Math.sin(t + seedPhase) * 38 * travel, 600 + Math.cos(t + seedPhase) * 30 * travel);
  ctx.rotate(seedTilt);
  ctx.scale(seedWidth, seedHeight);
  ctx.translate(-500, -600);
  const line = (points: [number, number][], close = false) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    if (close) ctx.closePath();
  };
  ctx.lineJoin = "round";
  if (p.pattern === "ribbons") {
    const offset = random() * TAU, amplitude = 65 + random() * 100, wavelength = 130 + random() * 180;
    const count = Math.round((9 + random() * 8) * density), spacing = 660 / count;
    ctx.lineCap = p.variant === 2 ? "butt" : "round";
    for (let i = 0; i < count; i++) {
      ctx.strokeStyle = colors[i % 3];
      ctx.lineWidth = Math.max(1, (p.variant === 1 ? 3 : spacing * .8) * p.weight);
      const points: [number, number][] = [];
      for (let x = -200; x <= 1200; x += 12) {
        const argument = x / (wavelength * p.scale) + i * .25 + offset + Math.sin(t + i * .09) * 1.5 * travel;
        const wave = p.variant === 2 ? Math.abs(Math.sin(argument)) : Math.sin(argument);
        points.push([x, 270 + i * spacing + wave * amplitude * (1 + Math.sin(t + i * .2) * .22 * deformation) + warp(x, i * 30) + Math.sin(t + i * .3) * 90 * travel]);
      }
      line(points); ctx.stroke();
    }
  } else if (p.pattern === "interference") {
    const offset = random() * 2, frequency = (135 + random() * 140) * p.scale;
    // Density controls line count independently of wave scale. Bound work without a dead slider zone.
    const count = Math.round(60 * density), step = 1330 / count;
    // Smoothly approach the spacing limit so dense, heavy fields retain visible gaps.
    ctx.lineWidth = step * (1 - Math.exp(-3 * p.weight / step));
    for (let layer = 0; layer < (p.variant === 2 ? 3 : 2); layer++) {
      ctx.save();
      if (p.variant === 1 && layer === 1) { ctx.translate(500, 600); ctx.rotate(Math.PI / 2); ctx.translate(-500, -600); }
      ctx.strokeStyle = colors[layer];
      for (let row = 0; row < count; row++) {
        const y = -80 + row * step;
        const points: [number, number][] = [];
        for (let x = -300; x <= 1300; x += 14) points.push([x, y + Math.sin(x / frequency + offset + layer * 1.7 + Math.sin(t + layer * .7) * 2.1 * travel) * (100 + layer * 65) * (1 + Math.sin(t + layer) * .2 * deformation) + warp(x, y) + Math.cos(t + layer * 2) * 80 * travel]);
        line(points); ctx.stroke();
      }
      ctx.restore();
    }
  } else if (p.pattern === "orbit") {
    const cx = 350 + random() * 300, cy = 540 + random() * 150;
    const count = Math.round((11 + random() * 12) * density);
    for (let i = 0; i < count; i++) {
      const start = random() * TAU + Math.sin(t + i * .18) * travel * 2.1;
      const radius = Math.max(3, (32 + i * 430 / count) * p.scale * (1 + Math.sin(t + i * .23 + seedPhase) * .12 * deformation));
      ctx.strokeStyle = colors[i % 3]; ctx.fillStyle = colors[i % 3];
      ctx.lineWidth = 19 * p.weight / Math.sqrt(density);
      const cx2 = cx + warp(i * 25, cy) + Math.sin(t + i * .14) * 55 * travel;
      const cy2 = cy + Math.sin(i * p.noiseScale) * p.distortion * 24 + Math.cos(t + i * .14) * 55 * travel;
      ctx.beginPath();
      // Full circles use canonical endpoints: some rasterizers disagree at a rotated 2π boundary.
      ctx.arc(cx2, cy2, radius, p.variant === 1 ? 0 : start, p.variant === 1 ? TAU : start + 4.5);
      ctx.stroke();
      if (p.variant === 2) { ctx.beginPath(); ctx.arc(cx2 + Math.cos(start) * radius, cy2 + Math.sin(start) * radius, 9 * p.weight, 0, TAU); ctx.fill(); }
    }
  } else if (p.pattern === "grid") {
    const cell = 200 * p.scale / Math.sqrt(density);
    for (let y = 160; y < 1100; y += cell) for (let x = -cell; x < 1200; x += cell) {
      const choice = p.variant === 0 ? Math.floor(random() * 4) : p.variant === 1 ? 1 : 0;
      const shift = random() * TAU;
      ctx.save();
      ctx.translate(x + cell / 2 + warp(x, y) * .3, y + cell / 2);
      ctx.rotate(Math.floor(random() * 4) * Math.PI / 2 + Math.sin(t + shift) * 1.15 * travel);
      const size = cell * (.72 + p.weight * .12) * Math.max(.15, 1 + Math.sin(t + shift) * .25 * deformation);
      ctx.fillStyle = colors[Math.floor(random() * 3)]; ctx.strokeStyle = ctx.fillStyle;
      if (choice === 0) { ctx.beginPath(); ctx.arc(-size / 2, -size / 2, size, 0, Math.PI / 2); ctx.lineTo(-size / 2, -size / 2); ctx.fill(); }
      else if (choice === 1) for (let k = 0; k < 5; k++) ctx.fillRect(-size / 2 + k * size / 5, -size / 2, size / 10, size);
      else if (choice === 2) { ctx.lineWidth = size * .13; ctx.beginPath(); ctx.arc(0, 0, size * .34, 0, TAU); ctx.stroke(); }
      else { line([[-size / 2, size / 2], [size / 2, -size / 2], [size / 2, size / 2]], true); ctx.fill(); }
      ctx.restore();
    }
  } else if (p.pattern === "packing") {
    for (const point of geometry(p).points) {
      const radius = Math.max(2, point.radius * (1 + Math.sin(t + point.phase) * .28 * deformation));
      const x = point.x + warp(point.x, point.y) * .6 + Math.sin(t + point.phase) * 50 * travel, y = point.y + Math.cos(t + point.phase) * 50 * travel;
      ctx.fillStyle = colors[point.color]; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 4 * p.weight;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
      if (p.variant === 1) ctx.stroke(); else ctx.fill();
      if (p.variant === 2) { ctx.strokeStyle = paper; for (let ring = .35; ring < .9; ring += .25) { ctx.beginPath(); ctx.arc(x, y, radius * ring, 0, TAU); ctx.stroke(); } }
      if (p.variant === 0) { ctx.strokeStyle = paper; ctx.lineWidth = 2 * p.weight; ctx.stroke(); }
    }
  } else if (p.pattern === "guilloche") {
    const a = 3 + Math.floor(random() * 4), b = 5 + Math.floor(random() * 4);
    const layers = Math.round(9 * density);
    ctx.lineWidth = 1.6 * p.weight;
    for (let layer = 0; layer < layers; layer++) {
      ctx.strokeStyle = colors[layer % 3];
      const points: [number, number][] = [];
      for (let i = 0; i <= 720; i++) {
        const u = i / 720 * TAU, offset = layer * .08 + seedPhase + Math.sin(t + layer * .1) * 1.2 * travel;
        let x: number, y: number;
        if (p.variant === 1) { x = Math.sin(a * u + offset) * 440 * p.scale; y = Math.sin(b * u + Math.cos(t) * .65 * deformation) * 290 * p.scale; }
        else { const radius = 210 * p.scale + (p.variant === 2 ? 100 : 80) * Math.cos(a * u + offset + Math.sin(t) * deformation); x = Math.cos(u + offset) * radius + Math.cos(b * u + Math.sin(t) * deformation) * 85; y = Math.sin(u + offset) * radius + Math.sin(b * u + Math.sin(t) * deformation) * 85; }
        points.push([500 + x + warp(x, y) * .4, 600 + y + Math.cos(t + layer * .2) * 60 * travel]);
      }
      line(points, true); ctx.stroke();
    }
  } else if (p.pattern === "cells") {
    const cached = geometry(p);
    const movingPoints = cached.points.map(point => ({ ...point,
      x: point.x + Math.sin(t + point.phase) * 75 * travel,
      y: point.y + Math.cos(t + point.phase) * 65 * travel,
    }));
    // Moving Voronoi sites change actual cell boundaries and adjacency through the loop.
    const liveCells = movingPoints.map(point => {
      let polygon: [number, number][] = [[-300, 0], [1300, 0], [1300, 1200], [-300, 1200]];
      for (const other of movingPoints) {
        if (other === point || !polygon.length) continue;
        const nx = other.x - point.x, ny = other.y - point.y;
        polygon = clipPolygon(polygon, nx, ny, (other.x ** 2 + other.y ** 2 - point.x ** 2 - point.y ** 2) / 2);
      }
      return { polygon, color: point.color };
    });
    liveCells.forEach((cell, index) => {
      if (!cell.polygon.length) return;
      const center = movingPoints[index];
      const inset = p.variant === 2 ? .68 : p.variant === 1 ? .85 : .96;
      const pulse = 1 + Math.sin(t + center.phase) * .13 * deformation;
      const polygon = cell.polygon.map(([x, y]) => [center.x + (x - center.x) * inset * pulse + warp(x, y) * .3, center.y + (y - center.y) * inset * pulse] as [number, number]);
      line(polygon, true);
      ctx.fillStyle = colors[cell.color]; ctx.strokeStyle = colors[(cell.color + 1) % 3]; ctx.lineWidth = 3 * p.weight;
      if (p.variant !== 1) ctx.fill(); ctx.stroke();
    });
  } else if (p.pattern === "contours") {
    // Marching squares samples a bounded analytic field, not pixels; every contour is a true level set.
    const step = 22, cols = 56, rows = 44;
    const values: number[][] = [];
    let fieldMin = Infinity, fieldMax = -Infinity;
    const seedOffset = random() * 8, frequencyX = .6 + random() * 1.4, frequencyY = .5 + random() * 1.5;
    for (let row = 0; row <= rows; row++) {
      const valuesRow: number[] = [];
      for (let col = 0; col <= cols; col++) {
        const x = (col * step - 110) / (180 * p.scale), y = (row * step + 120) / (180 * p.scale);
        let value = Math.sin(x * frequencyX * p.noiseScale + seedOffset + Math.sin(t) * 1.5 * travel) + Math.cos(y * frequencyY + seedOffset + Math.cos(t) * 1.5 * travel) + Math.sin((x + y) * .65 + Math.sin(t) * 2 * deformation) * (p.distortion + .4 * deformation);
        if (p.variant === 1) value += Math.cos(Math.hypot(x - 3, y - 3) * 2) * .8;
        if (p.variant === 2) value += Math.sin(y * 2 + Math.cos(t) * 1.3 * deformation) * .7;
        valuesRow.push(value);
        fieldMin = Math.min(fieldMin, value); fieldMax = Math.max(fieldMax, value);
      }
      values.push(valuesRow);
    }
    ctx.lineWidth = 2.6 * p.weight;
    const levels = Math.round(12 * density);
    for (let level = 0; level < levels; level++) {
      // Adaptive levels keep coarse/low-frequency fields visible instead of sampling empty thresholds.
      const threshold = fieldMin + (level + .5) * (fieldMax - fieldMin) / levels;
      ctx.strokeStyle = colors[level % 3]; ctx.beginPath();
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const corners = [[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1]];
        const crossings: [number, number][] = [];
        for (let edge = 0; edge < 4; edge++) {
          const a = corners[edge], b = corners[(edge + 1) % 4], va = values[a[1]][a[0]], vb = values[b[1]][b[0]];
          if ((va > threshold) !== (vb > threshold)) {
            const mix = (threshold - va) / (vb - va);
            crossings.push([(a[0] + (b[0] - a[0]) * mix) * step - 110, (a[1] + (b[1] - a[1]) * mix) * step + 120]);
          }
        }
        for (let k = 0; k + 1 < crossings.length; k += 2) { ctx.moveTo(...crossings[k]); ctx.lineTo(...crossings[k + 1]); }
      }
      ctx.stroke();
    }
  } else if (p.pattern === "halftone") {
    const spacing = 34 * p.scale / Math.sqrt(density), offset = random() * TAU;
    for (let row = 0, y = 180; y < 1080; y += spacing, row++) for (let x = -80; x < 1100; x += spacing) {
      const px = x + (row % 2) * spacing / 2;
      const wave = (Math.sin(px * .009 * p.noiseScale + offset + Math.sin(t) * 2.2 * travel) + Math.cos(y * .008 + offset + Math.cos(t) * 1.5 * deformation) + 2) / 4;
      const radius = Math.max(.7, spacing * .42 * wave * p.weight * (1 + Math.sin(t + px * .004) * .18 * deformation));
      const dx = px + warp(px, y) * .4;
      ctx.fillStyle = colors[Math.min(2, Math.floor(wave * 3))];
      ctx.beginPath();
      if (p.variant === 0) { ctx.arc(dx, y, radius, 0, TAU); ctx.fill(); }
      else if (p.variant === 1) { line([[dx, y - radius], [dx + radius, y], [dx, y + radius], [dx - radius, y]], true); ctx.fill(); }
      else { ctx.fillRect(dx - radius, y - radius * .2, radius * 2, radius * .4); ctx.fillRect(dx - radius * .2, y - radius, radius * .4, radius * 2); }
    }
  } else if (p.pattern === "checker") {
    const cell = (60 + random() * 65) * p.scale / Math.sqrt(density);
    const distort = (x: number, y: number): [number, number] => [x + warp(x, y), y + Math.sin(x * .006 * p.noiseScale + Math.sin(t) * 2.2 * travel + p.seed % 5) * (55 * p.distortion + 40 * deformation)];
    for (let row = 0, y = 100; y < 1150; y += cell, row++) for (let col = 0, x = -200; x < 1250; x += cell, col++) {
      const fill = p.variant === 1 ? col % 2 === 0 : (row + col) % 2 === 0;
      if (!fill) continue;
      const inset = cell * .25 * (1 - Math.exp(-(3 - p.weight) * 12 / cell));
      const polygon = [distort(x + inset, y + inset), distort(x + cell - inset, y + inset), distort(x + cell - inset, y + cell - inset), distort(x + inset, y + cell - inset)];
      ctx.fillStyle = colors[(Math.floor(row / 3) + Math.floor(col / 4)) % 3];
      line(p.variant === 2 ? polygon.slice(0, 3) : polygon, true); ctx.fill();
    }
  } else if (p.pattern === "rosette") {
    const petals = 4 + Math.floor(random() * 12), rings = Math.round((7 + random() * 7) * density);
    ctx.lineWidth = 3 * p.weight;
    for (let ring = rings; ring >= 1; ring--) {
      const points: [number, number][] = [];
      for (let step = 0; step <= 480; step++) {
        const angle = step / 480 * TAU;
        const radius = (45 + ring * 30) * p.scale * (1 + Math.cos(angle * petals + seedPhase + (1 - Math.cos(t)) * 2.5 * travel) * (p.variant === 1 ? .4 : .18) * (1 + p.distortion) + Math.sin(angle * harmonic + t) * .12 * deformation);
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
        points.push([500 + x + warp(x, y) * .2, 600 + y]);
      }
      ctx.strokeStyle = colors[ring % 3]; ctx.fillStyle = colors[ring % 3];
      line(points, true);
      if (p.variant === 0) ctx.fill();
      ctx.stroke();
      if (p.variant === 2) { ctx.save(); ctx.translate(500, 600); ctx.rotate(Math.PI / petals); ctx.translate(-500, -600); line(points, true); ctx.stroke(); ctx.restore(); }
    }
  } else if (p.pattern === "constellation") {
    const points = geometry(p).points.map(point => ({ ...point, x: point.x + Math.sin(t + point.phase) * 90 * travel + warp(point.x, point.y), y: point.y + Math.cos(t + point.phase) * 90 * travel }));
    ctx.lineWidth = 1.8 * p.weight;
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      ctx.strokeStyle = colors[point.color]; ctx.fillStyle = colors[point.color];
      if (p.variant !== 1) for (let j = i + 1; j < points.length; j++) {
        const other = points[j];
        const distance = Math.hypot(point.x - other.x, point.y - other.y), reach = 150 * p.scale;
        if (distance < reach) { ctx.globalAlpha = Math.min(1, (reach - distance) / (reach * .25)); ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(other.x, other.y); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      if (p.variant === 2) { ctx.beginPath(); ctx.arc(point.x, point.y, 20 * p.scale * Math.max(.2, 1 + Math.sin(t + point.phase) * .25 * deformation), point.phase, point.phase + 2.5); ctx.stroke(); }
      else if (p.variant === 1) { const size = (6 + point.radius * .1) * p.weight; line([[point.x - size, point.y], [point.x + size, point.y]]); ctx.stroke(); line([[point.x, point.y - size], [point.x, point.y + size]]); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(.5, 4 * p.weight * (1 + Math.sin(t + point.phase) * .2 * deformation)), 0, TAU); ctx.fill(); }
    }
  }
  ctx.restore();
}

export function drawPoster(ctx: CanvasRenderingContext2D, poster: PosterData, phase: number, artOnly = false, customFrame?: CanvasImageSource) {
  const { width, height } = ctx.canvas;
  const palette = poster.customColors ?? PALETTES[poster.palette] ?? PALETTES[0];
  const time = ((phase % 1) + 1) % 1 * TAU;
  const logicalHeight = height * 1000 / width, footerY = logicalHeight - 300;
  // Reserve clear space below the complete brand name, including font descenders.
  const artTop = 290;
  ctx.save();
  ctx.scale(width / 1000, artOnly ? height / 700 : width / 1000);
  ctx.fillStyle = palette.paper; ctx.fillRect(0, 0, 1000, artOnly ? 700 : logicalHeight);
  ctx.save(); ctx.beginPath(); ctx.rect(0, artOnly ? 0 : artTop, 1000, artOnly ? 700 : footerY - artTop); ctx.clip();
  if (poster.customArt?.enabled) {
    if (customFrame) ctx.drawImage(customFrame, 0, artOnly ? 0 : artTop, 1000, artOnly ? 700 : footerY - artTop);
  } else {
  if (artOnly) ctx.translate(0, -250);
  const artScale = artOnly ? 1 : (footerY - artTop) / 700;
  ctx.translate(500, artOnly ? 250 : artTop); ctx.scale(artScale, artScale); ctx.translate(-500, -250);
  ctx.translate(500, 600);
  ctx.rotate((poster.rotation + (poster.composition === "diagonal" ? -25 : 0)) * Math.PI / 180);
  ctx.translate(-500, -600);
  if (poster.composition === "mirror") {
    ctx.save(); ctx.beginPath(); ctx.rect(-1000, -1000, 1500, 3000); ctx.clip();
    drawArt(ctx, poster, time, palette.colors, palette.paper); ctx.restore();
    ctx.save(); ctx.translate(1000, 0); ctx.scale(-1, 1); ctx.beginPath(); ctx.rect(-1000, -1000, 1500, 3000); ctx.clip();
    drawArt(ctx, poster, time, palette.colors, palette.paper); ctx.restore();
  } else drawArt(ctx, poster, time, palette.colors, palette.paper);
  }
  ctx.restore();
  if (poster.grain > 0) {
    const texture = grainTexture(poster, palette.ink);
    if (texture) {
      ctx.save(); ctx.globalAlpha = poster.grain;
      const pattern = ctx.createPattern(texture, "repeat");
      if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, artOnly ? 0 : artTop, 1000, artOnly ? 700 : footerY - artTop); }
      ctx.restore();
    }
  }
  if (!artOnly) {
    ctx.fillStyle = palette.ink; ctx.textBaseline = "alphabetic";
    fitText(ctx, poster.title || "CCNYC", 876, 224, "Tanker, sans-serif"); ctx.fillText(poster.title || "CCNYC", 57, 214);
    ctx.font = "500 19px Karla, sans-serif"; ctx.fillText("CREATIVE CODING NEW YORK CITY", 62, 250);
    ctx.fillStyle = palette.paper; ctx.fillRect(0, footerY, 1000, 300);
    ctx.fillStyle = palette.ink;
    fitText(ctx, poster.date || "Your next meetup", 876, 56, "Tanker, sans-serif"); ctx.fillText(poster.date || "Your next meetup", 62, footerY + 85);
    fitText(ctx, poster.location || "Location to be announced", 876, 36, "Karla, sans-serif", "600"); ctx.fillText(poster.location || "Location to be announced", 62, footerY + 143);
    fitText(ctx, poster.time || "6–8 PM", 600, 42, "Karla, sans-serif", "600"); ctx.fillText(poster.time || "6–8 PM", 62, footerY + 232);
  }
  ctx.restore();
}
