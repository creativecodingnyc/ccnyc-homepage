import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
const dataUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const model = dataUrl(ts.transpileModule(readFileSync("src/components/poster-builder/types.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText);
const rendererSource = readFileSync("src/lib/poster-renderer.ts", "utf8").replace('"../components/poster-builder/types"', JSON.stringify(model));
const { drawPoster, randomGenerator, posterDimensions } = await import(dataUrl(ts.transpileModule(rendererSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText));
const { ART_DEFAULTS, PATTERNS } = await import(model);
const defaults = { ...ART_DEFAULTS, title: "CCNYC", date: "Tuesday, October 27", location: "Location TBA", time: "6–8 PM", pattern: "ribbons", palette: 0, seed: 426, motion: 1, scale: 1, duration: 15, format: "4:5" };
function commands(poster, phase, format = "4:5") {
  const calls = [], ctx = new Proxy({ canvas: posterDimensions(format), measureText: text => ({ width: text.length * 8 }) }, { get(target, key) { if (key in target) return target[key]; return (...args) => calls.push([key, ...args.map(n => typeof n === "number" ? Math.round(n * 1e8) / 1e8 : n)]); }, set(target, key, value) { calls.push([key, value]); target[key] = value; return true; } });
  drawPoster(ctx, poster, phase); return calls;
}
for (const { id: pattern } of PATTERNS) {
  test(`${pattern}: deterministic, periodic, seed-sensitive, animated`, () => {
    const poster = { ...defaults, pattern };
    assert.deepEqual(commands(poster, 0), commands(poster, 1));
    assert.deepEqual(commands(poster, .37), commands(poster, .37));
    assert.notDeepEqual(commands(poster, .37), commands({ ...poster, seed: 8345 }, .37));
    assert.notDeepEqual(commands(poster, 0), commands(poster, .25));
    assert.deepEqual(commands({ ...poster, motion: 0 }, 0), commands({ ...poster, motion: 0 }, .25));
    assert.ok(commands(poster, .5).flat().filter(item => typeof item === "number").every(Number.isFinite));
  });
}
test("portrait and story use uniform type scale and expected export dimensions", () => {
  assert.deepEqual(posterDimensions("4:5"), { width: 1080, height: 1350 });
  assert.deepEqual(posterDimensions("9:16"), { width: 1080, height: 1920 });
  for (const format of ["4:5", "9:16"]) {
    const [firstScale] = commands(defaults, 0, format).filter(call => call[0] === "scale");
    assert.equal(firstScale[1], firstScale[2]);
  }
});
test("seeded generator is repeatable and bounded", () => {
  const a = randomGenerator(43), b = randomGenerator(43);
  for (let i = 0; i < 100; i++) { const value = a(); assert.equal(value, b()); assert.ok(value >= 0 && value < 1); }
});

for (const { id: pattern } of PATTERNS) {
  test(`${pattern}: substyles and universal geometry controls have real drawing impact`, () => {
    const poster = { ...defaults, pattern };
    const original = commands(poster, .23);
    for (const [key, value] of Object.entries({ variant: 1, scale: 1.5, density: 1.8, weight: 2, distortion: 1.2, noiseScale: 2.8, rotation: 20, composition: "mirror", tempo: 3, travel: .3, deformation: .3 })) {
      assert.notDeepEqual(commands({ ...poster, [key]: value }, .23), original, `${pattern}: ${key} must affect rendering`);
    }
    for (const variant of [0, 1, 2]) {
      const extreme = { ...poster, variant, scale: .35, density: 2.5, weight: 3, distortion: 1.5, noiseScale: 4, motion: 1.5, tempo: 4 };
      assert.deepEqual(commands(extreme, 0), commands(extreme, 1));
      assert.ok(commands(extreme, .3).flat().filter(item => typeof item === "number").every(Number.isFinite));
    }
  });
}
const recipeSource = readFileSync("src/lib/poster-recipes.ts", "utf8").replace('"../components/poster-builder/types"', JSON.stringify(model));
const { readRecipe, recipeFor, randomizedPoster, EMPTY_LOCKS, STARTERS, NUMBER_LIMITS } = await import(dataUrl(ts.transpileModule(recipeSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText));

test("recipe roundtrip preserves every supported design field", () => {
  const poster = { ...defaults, pattern: "contours", variant: 2, density: 1.8, tempo: 3, customColors: { paper: "#ffffff", ink: "#112233", colors: ["#ff0000", "#00ff00", "#0000ff"] } };
  assert.deepEqual(readRecipe(JSON.parse(JSON.stringify(recipeFor(poster, "Terrain"))), defaults), recipeFor(poster, "Terrain"));
});
test("recipe parser rejects wrong version, unknown family and malformed colors", () => {
  assert.throws(() => readRecipe({ version: 2, poster: defaults }, defaults), /version/);
  assert.throws(() => readRecipe({ version: 1, poster: { ...defaults, pattern: "imaginary" } }, defaults), /unknown/);
  assert.throws(() => readRecipe({ version: 1, poster: { ...defaults, customColors: { paper: "red" } } }, defaults), /HEX/);
  assert.throws(() => readRecipe([], defaults));
});
test("recipe parser clamps all numeric bounds, handles nonfinite values and ignores arbitrary keys", () => {
  const source = { ...defaults, title: "x".repeat(500), evil: "not copied", seed: -99, tempo: 3.6 };
  for (const key of Object.keys(NUMBER_LIMITS)) source[key] = 1e20;
  const result = readRecipe({ version: 1, poster: source }, defaults).poster;
  for (const [key, bounds] of Object.entries(NUMBER_LIMITS)) assert.equal(result[key], bounds[1]);
  assert.equal(result.title.length, 24);
  assert.equal(result.seed, 0);
  assert.equal("evil" in result, false);
  assert.equal(readRecipe({ version: 1, poster: { ...defaults, density: Infinity } }, defaults).poster.density, defaults.density);
});
test("all curated starters validate and contain distinct parameter recipes", () => {
  assert.equal(STARTERS.length, PATTERNS.length);
  assert.equal(new Set(STARTERS.map(item => item.pattern)).size, PATTERNS.length);
  assert.equal(new Set(STARTERS.map(item => item.id)).size, STARTERS.length);
  for (const starter of STARTERS) {
    const result = readRecipe(recipeFor({ ...defaults, ...starter.settings }, starter.name), defaults);
    assert.equal(result.poster.pattern, starter.pattern);
  }
  assert.equal(new Set(STARTERS.map(item => JSON.stringify(item.settings))).size, STARTERS.length);
});
test("randomization respects every locked group and keeps event fields", () => {
  const allLocked = { structure: true, colors: true, motion: true, texture: true };
  assert.deepEqual(randomizedPoster(defaults, allLocked, randomGenerator(44)), defaults);
  for (const group of Object.keys(EMPTY_LOCKS)) {
    const locks = { ...allLocked, [group]: false };
    const result = randomizedPoster(defaults, locks, randomGenerator(44));
    const fields = { structure: ["pattern", "variant", "seed", "scale", "density", "weight", "distortion", "noiseScale", "rotation", "composition"], colors: ["palette", "customColors"], motion: ["motion", "motionStyle", "travel", "deformation", "tempo"], texture: ["grain", "grainSize"] };
    for (const key of Object.keys(defaults)) if (!fields[group].includes(key)) assert.deepEqual(result[key], defaults[key], `${group} must preserve ${key}`);
  }
});

test("grain uses a bounded seeded texture cache, independent of animation and opacity", () => {
  let created = 0;
  globalThis.document = { createElement() {
    created++;
    const context = new Proxy({}, { get: () => () => {}, set: () => true });
    return { width: 0, height: 0, getContext: () => context };
  } };
  try {
    const poster = { ...defaults, grain: .1, grainSize: 1.2 };
    commands(poster, 0);
    assert.equal(created, 2);
    commands({ ...poster, grain: .3 }, .7);
    assert.equal(created, 2, "phase and opacity must reuse the cached static tile");
    for (const ink of ["#ff0000", "#00ff00", "#0000ff"]) commands({ ...poster, customColors: { paper: "#ffffff", ink, colors: ["#111111", "#222222", "#333333"] } }, .4);
    assert.equal(created, 2, "color changes tint existing grain instead of rebuilding tiles");
    commands({ ...poster, grainSize: 2 }, .7);
    assert.equal(created, 4, "grain size changes the texture");
    for (let seed = 0; seed < 12; seed++) commands({ ...poster, seed }, .3);
    commands(poster, .5);
    assert.equal(created, 30, "old texture is evicted after bounded cache fills");
  } finally { delete globalThis.document; }
});

test("Eclipse rings use canonical full-circle endpoints on both sides of the loop seam", () => {
  const poster = { ...defaults, pattern: "orbit", variant: 1, seed: 99913, density: 2.2, scale: .6, weight: 1.3, distortion: 1.4, noiseScale: 3.6, tempo: 4, rotation: 32, composition: "mirror", motion: 1.5 };
  const first = commands(poster, .000001).filter(call => call[0] === "arc");
  const last = commands(poster, .999999).filter(call => call[0] === "arc");
  assert.equal(first.length, last.length);
  for (let i = 0; i < first.length; i++) {
    assert.equal(first[i][4], 0);
    assert.equal(first[i][5], Math.round(Math.PI * 2 * 1e8) / 1e8);
    assert.equal(last[i][4], 0);
    assert.equal(last[i][5], first[i][5]);
    for (let coordinate = 1; coordinate <= 3; coordinate++) assert.ok(Math.abs(first[i][coordinate] - last[i][coordinate]) < .02);
  }
});

for (const { id: pattern } of PATTERNS) {
  test(`${pattern}: travel and deformation work independently and seeds change uncolored structure`, () => {
    const base = { ...defaults, pattern };
    const still = commands({ ...base, travel: 0, deformation: 0 }, .23);
    assert.notDeepEqual(commands({ ...base, travel: 1, deformation: 0 }, .23), still, "travel must change spatial paths");
    assert.notDeepEqual(commands({ ...base, travel: 0, deformation: 1 }, .23), still, "deformation must change geometry independently");
    const geometric = poster => commands({ ...poster, motion: 0, distortion: 0 }, .23).filter(command => ["moveTo", "lineTo", "arc", "fillRect"].includes(command[0]));
    assert.notDeepEqual(geometric(base), geometric({ ...base, seed: 8345 }), "seed must change actual geometry without color, motion or noise");
    assert.deepEqual(commands({ ...base, motion: 0, travel: 2, deformation: 2 }, .13), commands({ ...base, motion: 0, travel: 2, deformation: 2 }, .82));
    const maximum = { ...base, motion: 3, travel: 2, deformation: 2, tempo: 8 };
    assert.ok(commands(maximum, .43).flat().filter(item => typeof item === "number").every(Number.isFinite));
  });
}
test("legacy recipes normalize independent motion controls and new ranges are bounded", () => {
  const legacy = { ...defaults }; delete legacy.travel; delete legacy.deformation;
  const loaded = readRecipe(recipeFor(legacy), legacy).poster;
  assert.equal(loaded.travel, 1); assert.equal(loaded.deformation, 1);
  const maximum = readRecipe(recipeFor({ ...defaults, motion: 99, tempo: 99, travel: 99, deformation: 99 }), defaults).poster;
  assert.equal(maximum.motion, 3); assert.equal(maximum.tempo, 8);
  assert.equal(maximum.travel, 2); assert.equal(maximum.deformation, 2);
});


test("brand subtitle has protected space above animation in both formats", () => {
  for (const format of ["4:5", "9:16"]) {
    const calls = commands(defaults, .25, format);
    const artClip = calls.find(call => call[0] === "rect");
    const subtitle = calls.find(call => call[0] === "fillText" && call[1] === "CREATIVE CODING NEW YORK CITY");
    assert.ok(artClip[2] >= subtitle[3] + 30, "brand baseline needs clear space before art");
    assert.ok(!calls.some(call => call[0] === "fillText" && /COME MAKE SOMETHING/i.test(call[1])));
  }
});

for (const { id: pattern } of PATTERNS) {
  test(`${pattern}: selectable motion behavior is periodic and independent of still mode`, () => {
    const base = { ...defaults, pattern };
    for (const motionStyle of ["flow", "reverse", "pingpong"]) {
      assert.deepEqual(commands({ ...base, motionStyle }, 0), commands({ ...base, motionStyle }, 1));
      assert.deepEqual(commands({ ...base, motionStyle, motion: 0 }, .17), commands({ ...base, motionStyle, motion: 0 }, .61));
    }
    assert.notDeepEqual(commands(base, .17), commands({ ...base, motionStyle: "reverse" }, .17));
    assert.notDeepEqual(commands(base, .17), commands({ ...base, motionStyle: "pingpong" }, .17));
  });
}
test("Interference density changes actual line count without scale-driven runaway work", () => {
  for (const variant of [0, 1, 2]) {
    let previous = 0;
    for (const density of [.35, .4, 1, 2.45, 2.5]) {
      const poster = { ...defaults, pattern: "interference", variant, density };
      const count = scale => commands({ ...poster, scale }, .23).filter(call => call[0] === "stroke").length;
      assert.equal(count(.35), count(2.5), "scale must not alter line count");
      assert.ok(count(.35) > previous, "higher density must add lines");
      previous = count(.35);
      assert.ok(previous <= 450, "bound line work at the densest setting");
    }
  }
});
test("motion behavior survives serialization and legacy files default to Flow", () => {
  assert.equal(readRecipe(recipeFor({ ...defaults, motionStyle: "pingpong" }), defaults).poster.motionStyle, "pingpong");
  const legacy = { ...defaults }; delete legacy.motionStyle;
  assert.equal(readRecipe(recipeFor(legacy), defaults).poster.motionStyle, "flow");
});

test("filled Rosette applies mark weight to visible stroked band edges", () => {
  const calls = commands({ ...defaults, pattern: "rosette", variant: 0, weight: 2 }, .23);
  assert.ok(calls.some(call => call[0] === "fill"));
  assert.ok(calls.some(call => call[0] === "stroke"));
  assert.ok(calls.some(call => call[0] === "lineWidth" && call[1] === 6));
});

test("arbitrary decimal design values survive recipe roundtrip without rounding", () => {
  const p={...defaults,scale:1.234567,density:1.678901,weight:.876543,rotation:-37.125,motion:.456789,travel:1.234567,deformation:.765432,grain:.123456,grainSize:1.234567};
  const restored=readRecipe(JSON.parse(JSON.stringify(recipeFor(p))),defaults).poster;
  for(const key of ["scale","density","weight","rotation","motion","travel","deformation","grain","grainSize"]) assert.equal(restored[key],p[key]);
});
test("dense Op art mark weight retains effective geometry adjustments", () => {
  const p={...defaults,pattern:"checker",scale:.35,density:2.5};
  const points=weight=>commands({...p,weight},.23).filter(call=>["moveTo","lineTo"].includes(call[0]));
  assert.notDeepEqual(points(.25),points(.5));
});
test("Constellation links fade near their distance boundary and reset alpha for marks", () => {
  const calls=commands({...defaults,pattern:"constellation"},.23);
  assert.ok(calls.some(call=>call[0]==="globalAlpha" && call[1]>0 && call[1]<1));
  assert.ok(calls.some(call=>call[0]==="globalAlpha" && call[1]===1));
});

test("coarse low-frequency Contours still contains level-set geometry", () => {
  const p={...defaults,pattern:"contours",variant:0,scale:2.5,density:.35,weight:.25,distortion:0,noiseScale:.25,motion:.15,travel:.25,deformation:2,tempo:1,rotation:-180};
  assert.ok(commands(p,.23,"9:16").filter(call=>call[0]==="lineTo").length>10);
});

test("custom artwork is drawn only inside the protected art frame", () => {
  const calls=[],frame={};
  const ctx=new Proxy({canvas:posterDimensions("4:5"),measureText:text=>({width:text.length*8})},{get(target,key){if(key in target)return target[key];return (...args)=>calls.push([key,...args]);},set(target,key,value){target[key]=value;return true;}});
  drawPoster(ctx,{...defaults,customArt:{enabled:true,language:"glsl",code:"void main(){}"}},.25,false,frame);
  const image=calls.find(call=>call[0]==="drawImage");assert.equal(image[1],frame);assert.equal(image[2],0);assert.equal(image[3],290);assert.equal(image[4],1000);assert.equal(image[5],660);
  assert.ok(calls.some(call=>call[0]==="fillText"&&call[1]==="CREATIVE CODING NEW YORK CITY"));
});
test("custom code recipes roundtrip and reject unsupported or oversized sources", () => {
  const p={...defaults,customArt:{enabled:true,language:"p5",code:"function draw(p,f){p.background(f.paper)}"}};
  assert.deepEqual(readRecipe(recipeFor(p),defaults).poster.customArt,p.customArt);
  assert.throws(()=>readRecipe(recipeFor({...p,customArt:{...p.customArt,language:"html"}}),defaults),/Custom art/);
  assert.throws(()=>readRecipe(recipeFor({...p,customArt:{...p.customArt,code:"x".repeat(50001)}}),defaults),/50,000/);
});
