"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { drawPoster } from "@/lib/poster-renderer";
import { saveBlob } from "@/lib/poster-export";
import { contrastRatio, effectiveColors, EMPTY_LOCKS, NUMBER_LIMITS, randomizedPoster, readRecipe, recipeFor, type Locks, type NumberControl, type Recipe } from "@/lib/poster-recipes";
import { PATTERNS, PALETTES, type PosterData, type PosterColors } from "./types";
import styles from "./poster-builder.module.css";
import CustomCodePanel from "./CustomCodePanel";

const STORAGE_KEY = "ccnyc-poster-recipes-v1";
type Change = <K extends keyof PosterData>(key: K, value: PosterData[K]) => void;
function SeedExplorer({ poster, onChange }: { poster: PosterData; onChange: Change }) {
  const [batch, setBatch] = useState(0), [open, setOpen] = useState(false);
  const samples = useMemo(() => Array.from({ length: 4 }, (_, index) => ({ ...poster, seed: (poster.seed + (batch * 4 + index + 1) * 104729) % 1000000000 })), [poster, batch]);
  return <details className={styles.disclosure} onToggle={event => setOpen(event.currentTarget.open)}><summary>Compare seed variations</summary><p className={styles.helper}>Same family, marks, colors and controls. Only the seed changes.</p><div className={styles.seedSamples}>{open && samples.map(sample => <SeedSample key={sample.seed} poster={sample} onSelect={() => onChange("seed", sample.seed)} />)}</div><button className={styles.wideButton} type="button" onClick={() => setBatch(value => value + 1)}>Explore more seeds ↗</button></details>;
}
function SeedSample({ poster, onSelect }: { poster: PosterData; onSelect: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const timer = setTimeout(() => { const context = canvas.current?.getContext("2d"); if (context) drawPoster(context, poster, .15, true); }, 120); return () => clearTimeout(timer); }, [poster]);
  return <button type="button" onClick={onSelect} aria-label={`Use seed ${poster.seed}`}><canvas width="180" height="130" ref={canvas} aria-hidden="true" /><span>{poster.seed}</span></button>;
}
function NumberField({ label, control, poster, onChange, hint }: { label: string; control: NumberControl; poster: PosterData; onChange: Change; hint?: string }) {
  const [min, max, step] = NUMBER_LIMITS[control];
  const value = poster[control], whole = control === "tempo";
  const [draft, setDraft] = useState(String(value)), [notice, setNotice] = useState("");
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const parsed = Number(draft);
    if (!draft.trim() || !Number.isFinite(parsed)) { setDraft(String(value)); setNotice("Enter a valid number. Previous value restored."); return; }
    const bounded = Math.min(max, Math.max(min, parsed)), next = whole ? Math.round(bounded) : bounded;
    onChange(control, next); setDraft(String(next));
    setNotice(next !== parsed ? whole && parsed >= min && parsed <= max ? "Whole cycles keep the loop seamless." : `Range ${min}–${max}. Set to ${next}.` : "");
  };
  return <div className={styles.numberControl}><div><label htmlFor={`number-${control}`}>{label}</label><input id={`number-${control}`} type="text" className={styles.numericInput} inputMode={whole ? "numeric" : "decimal"} autoComplete="off" spellCheck={false} value={draft} title={`Range ${min} to ${max}. ${whole ? "Whole cycles only." : "Type an exact decimal, or use the slider."}`} aria-describedby={`help-${control}`} onChange={event => { setDraft(event.target.value); setNotice(""); }} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commit(); } if (event.key === "Escape") { event.preventDefault(); setDraft(String(value)); setNotice(""); } }} /></div><input type="range" aria-label={`${label} slider`} min={min} max={max} step={whole ? step : "any"} value={value} onChange={event => { setNotice(""); onChange(control, whole ? Number(event.target.value) : Number(Number(event.target.value).toFixed(3))); }} /><p id={`help-${control}`} className={styles.fieldHelp}>{notice || hint || `${min}–${max}${whole ? " · whole cycles" : " · exact decimals welcome"}`}</p></div>;
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState(value), [error, setError] = useState(false);
  useEffect(() => { setDraft(value); setError(false); }, [value]);
  const commit = () => { if (/^#[0-9a-f]{6}$/i.test(draft)) { onChange(draft.toLowerCase()); setError(false); } else setError(true); };
  return <div className={styles.colorField}><label htmlFor={`hex-${label.replace(/\s/g, "-")}`}>{label}</label><div><input type="color" aria-label={`${label} color picker`} value={value} onChange={event => onChange(event.target.value)} /><input id={`hex-${label.replace(/\s/g, "-")}`} aria-label={`${label} HEX`} value={draft} spellCheck={false} maxLength={7} aria-invalid={error} onChange={event => { setDraft(event.target.value); setError(false); }} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commit(); } }} /></div>{error && <small>Use a six-digit HEX, such as #ee482f.</small>}</div>;
}
export default function ControlsPanel({ poster, onChange, onApply, disabled, onWorkspaceChange }: { poster: PosterData; onChange: Change; onApply: (poster: PosterData) => void; disabled: boolean; onWorkspaceChange: (custom: boolean) => void }) {
  const [tab, setTab] = useState("art"), [saved, setSaved] = useState<Recipe[]>([]), [name, setName] = useState("My CCNYC poster"), [feedback, setFeedback] = useState("");
  const [locks, setLocks] = useState<Locks>({ ...EMPTY_LOCKS });
  useEffect(() => { if (window.location.hash === "#code-controls") setTab("code"); }, []);
  const selectTab = (next: string) => { setTab(next); window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + (next === "code" ? "#code-controls" : "")); };
  const controlsRef = useRef<HTMLElement>(null);
  useEffect(() => { controlsRef.current?.scrollTo({ top: 0 }); onWorkspaceChange(tab === "code"); }, [tab, onWorkspaceChange]);
  const [seedDraft, setSeedDraft] = useState(String(poster.seed));
  const fileInput = useRef<HTMLInputElement>(null), initial = useRef(poster);
  useEffect(() => setSeedDraft(String(poster.seed)), [poster.seed]);
  const commitSeed = () => {
    const parsed = Number(seedDraft);
    if (seedDraft.trim() && Number.isFinite(parsed)) { const next = Math.max(0, Math.min(999999999, Math.round(parsed))); onChange("seed", next); setSeedDraft(String(next)); }
    else setSeedDraft(String(poster.seed));
  };
  useEffect(() => {
    try { const stored = localStorage.getItem(STORAGE_KEY); if (!stored) return; const value: unknown = JSON.parse(stored); if (!Array.isArray(value)) return; const valid: Recipe[] = []; for (const item of value.slice(0, 40)) { try { valid.push(readRecipe(item, initial.current)); } catch { /* Skip incompatible entries. */ } } setSaved(valid); }
    catch { setFeedback("Saved designs could not be loaded. You can still import a recipe file."); }
  }, []);
  const family = PATTERNS.find(item => item.id === poster.pattern)!;
  const colors = effectiveColors(poster), lowContrast = contrastRatio(colors.paper, colors.ink) < 4.5;
  const persist = (next: Recipe[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSaved(next); return true; } catch { setFeedback("Could not save in this browser. Export JSON to keep your design."); return false; } };
  const save = () => { if (persist([recipeFor(poster, name.trim() || "My CCNYC poster"), ...saved].slice(0, 40))) setFeedback("Saved in this browser. Export JSON for a portable copy."); };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try { if (file.size > 512_000) throw new Error("Recipe files must be smaller than 512 KB."); const imported = readRecipe(JSON.parse(await file.text()), poster); onApply(imported.poster); setName(imported.name); setFeedback(`Imported ${imported.name}.`); }
    catch (error) { setFeedback(error instanceof SyntaxError ? "That file is not valid JSON. Choose an exported CCNYC recipe." : error instanceof Error ? error.message : "Could not read the recipe."); }
    if (fileInput.current) fileInput.current.value = "";
  };
  const setColor = (role: "paper" | "ink" | 0 | 1 | 2, value: string) => { const next: PosterColors = { paper: colors.paper, ink: colors.ink, colors: [...colors.colors] }; if (typeof role === "number") next.colors[role] = value; else next[role] = value; onChange("customColors", next); };
  return <aside ref={controlsRef} className={styles.controls} aria-label="Poster controls">
    <div className={`${styles.tabs} ${styles.threeTabs}`}>{[{ id: "art", label: "Design" }, { id: "code", label: "Custom code" }, { id: "event", label: "Event" }].map(item => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => selectTab(item.id)}>{item.label}</button>)}</div>
    {tab === "art" && <nav className={styles.controlJump} aria-label="Design control groups"><a href="#shape-controls">shape</a><a href="#movement-controls">movement</a><a href="#color-controls">color</a><a href="#texture-controls">texture</a></nav>}
    <fieldset disabled={disabled} className={styles.fieldset}>
      {tab === "art" && <>
        <div className={styles.controlHeading}><h2>Shape your poster</h2><span>{poster.customArt?.enabled ? "Custom code is active. Controls affect it when used in your code. Choose a family to return to built-in art." : "Type exact values or drag a slider. Press Enter or leave a field to apply."}</span></div>
        <label className={styles.selectLabel}>Pattern family<select value={poster.pattern} onChange={event => onApply({ ...poster, pattern: event.target.value as PosterData["pattern"], customArt: poster.customArt ? { ...poster.customArt, enabled: false } : null })}>{PATTERNS.map(item => <option value={item.id} key={item.id}>{item.name} · {item.description}</option>)}</select></label>
        <div className={styles.seedRow}><label>Pattern seed<input aria-label="Design seed" type="number" min="0" max="999999999" value={seedDraft} onChange={event => { const value = event.target.value; setSeedDraft(value); if (value.trim() && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 999999999) onChange("seed", Math.round(Number(value))); }} onBlur={commitSeed} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commitSeed(); } }} /></label><button type="button" onClick={() => { const values = new Uint32Array(1); crypto.getRandomValues(values); onChange("seed", (poster.seed + 1 + values[0] % 999999999) % 1000000000); }}>New seed ↗</button></div>
        <p className={styles.helper}>A new seed changes the structure within this family. Your colors and controls stay as set.</p>
        {!poster.customArt?.enabled && <SeedExplorer poster={poster} onChange={onChange} />}
      </>}
      {tab === "art" && <>
        <div className={styles.section}><h2>Mark construction</h2><div className={styles.segments}>{family.variants.map((variant, index) => <button type="button" key={variant} aria-pressed={poster.variant === index} onClick={() => onChange("variant", index)}>{variant}</button>)}</div></div>
        <div className={styles.section} id="shape-controls"><h2>Shape</h2><div className={styles.advancedContent}>
          <NumberField label="Pattern scale" control="scale" poster={poster} onChange={onChange} hint="Size of the pattern across the poster." />
          <NumberField label="Element density" control="density" poster={poster} onChange={onChange} hint={poster.pattern === "interference" ? `${Math.round(60 * poster.density)} lines per wave field. Scale changes the waves, not this count.` : undefined} />
          <NumberField label="Mark size / weight" control="weight" poster={poster} onChange={onChange} />
          <NumberField label="Geometry warp" control="distortion" poster={poster} onChange={onChange} />
          <NumberField label="Noise frequency" control="noiseScale" poster={poster} onChange={onChange} />
          <NumberField label="Rotation °" control="rotation" poster={poster} onChange={onChange} />
        </div></div>
        <div className={styles.section}><h2>Composition</h2><select className={styles.compactSelect} value={poster.composition} onChange={event => onChange("composition", event.target.value as PosterData["composition"])}><option value="center">Centered</option><option value="diagonal">Diagonal</option><option value="mirror">Mirrored</option></select></div>
        <div className={styles.inlineMotion} id="movement-controls">
          <label className={styles.selectLabel}>Movement<select value={poster.motionStyle} onChange={event => onChange("motionStyle", event.target.value as PosterData["motionStyle"])}><option value="flow">Flow · forward loop</option><option value="reverse">Reverse · backward loop</option><option value="pingpong">Ping-pong · forward and back</option></select></label>
          <NumberField label="Motion strength" control="motion" poster={poster} onChange={onChange} hint="0 = still · 1 = active · 3 = maximum" />
          <NumberField label="Travel" control="travel" poster={poster} onChange={onChange} hint="Movement through space." />
          <NumberField label="Deformation" control="deformation" poster={poster} onChange={onChange} hint="How much the forms change shape." />
          <NumberField label="Speed · cycles per loop" control="tempo" poster={poster} onChange={onChange} />
        </div>
        <div className={styles.section}><h2>Color story <span>{poster.customColors ? "Custom" : PALETTES[poster.palette].name}</span></h2><div className={`${styles.palettes} ${styles.paletteLibrary}`}>{PALETTES.map((palette, index) => <button key={palette.name} type="button" title={palette.name} aria-label={palette.name} aria-pressed={!poster.customColors && poster.palette === index} onClick={() => onApply({ ...poster, palette: index, customColors: null })}>{[palette.paper, ...palette.colors].map(color => <span key={color} style={{ background: color }} />)}</button>)}</div></div>
        <section className={styles.section} id="color-controls" aria-label="Custom colors"><h2>Exact colors</h2><div className={styles.customColors}><ColorField label="Paper" value={colors.paper} onChange={value => setColor("paper", value)} /><ColorField label="Type" value={colors.ink} onChange={value => setColor("ink", value)} />{([0, 1, 2] as const).map(index => <ColorField key={index} label={`Art ${index + 1}`} value={colors.colors[index]} onChange={value => setColor(index, value)} />)}</div>{lowContrast && <p className={styles.warning}>Paper and type have low contrast. Choose more distinct colors to keep event details readable.</p>}</section>
        <div className={styles.section} id="texture-controls"><h2>Print texture</h2><div className={styles.advancedContent}><NumberField label="Grain amount" control="grain" poster={poster} onChange={onChange} /><NumberField label="Grain size" control="grainSize" poster={poster} onChange={onChange} /></div></div>
        <details className={styles.disclosure}><summary>Explore with locks</summary><p className={styles.helper}>Locked groups stay exactly as you set them.</p><div className={styles.locks}>{(Object.keys(locks) as (keyof Locks)[]).map(key => <label key={key}><input type="checkbox" checked={locks[key]} onChange={event => setLocks(current => ({ ...current, [key]: event.target.checked }))} />Lock {key}</label>)}</div><button type="button" className={styles.wideButton} disabled={Object.values(locks).every(Boolean)} onClick={() => onApply(randomizedPoster(poster, locks, Math.random))}>Randomize unlocked settings ↗</button></details>
      </>}
      <div hidden={tab !== "code"}><CustomCodePanel poster={poster} onCustomArt={art => onChange("customArt", art)} /></div>
      {tab === "event" && <div className={styles.eventFields}><h2>The next gathering</h2><p>These details stay readable in every frame.</p>{([{ key: "title", label: "Title", max: 24 }, { key: "date", label: "Date", max: 70 }, { key: "location", label: "Location", max: 100 }, { key: "time", label: "Time", max: 40 }] as const).map(field => <label key={field.key}>{field.label}<input maxLength={field.max} value={poster[field.key]} onChange={event => onChange(field.key, event.target.value)} /></label>)}</div>}
      <div className={styles.outputOptions}><label>Format<select value={poster.format} onChange={event => onChange("format", event.target.value as PosterData["format"])}><option value="4:5">Portrait · 4:5</option><option value="9:16">Story · 9:16</option></select></label><label>Loop length<select value={poster.duration} onChange={event => onChange("duration", Number(event.target.value) as PosterData["duration"])}>{[10, 15, 20].map(value => <option value={value} key={value}>{value} seconds</option>)}</select></label></div>
      <details className={styles.disclosure}><summary>Save & transfer recipes {saved.length > 0 ? `(${saved.length})` : ""}</summary><div className={styles.recipeActions}><label>Design name<input value={name} maxLength={60} onChange={event => setName(event.target.value)} /></label><button type="button" className={styles.wideButton} onClick={save}>Save in this browser</button><div className={styles.twoColumns}><button type="button" onClick={() => saveBlob(new Blob([JSON.stringify(recipeFor(poster, name), null, 2)], { type: "application/json" }), `ccnyc-${poster.seed}.json`)}>Export JSON</button><button type="button" onClick={() => fileInput.current?.click()}>Import JSON</button></div><input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={event => void importFile(event.target.files?.[0])} />{saved.length > 0 && <div className={styles.savedRecipes}>{saved.map((recipe, index) => <div key={`${recipe.name}-${index}`}><button type="button" onClick={() => { onApply(recipe.poster); setName(recipe.name); setFeedback(`Loaded ${recipe.name}.`); }}>{recipe.name}</button><button type="button" aria-label={`Delete saved ${recipe.name}`} onClick={() => persist(saved.filter((_, savedIndex) => index !== savedIndex))}>Delete</button></div>)}</div>}</div></details>
      {feedback && <p className={styles.feedback} role="status">{feedback}</p>}
    </fieldset>
  </aside>;
}
