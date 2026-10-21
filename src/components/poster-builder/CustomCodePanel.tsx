"use client";
import { useEffect, useRef, useState } from "react";
import { createCustomRenderer, customArtSize, GLSL_STARTER, P5_STARTER, type CustomArt } from "@/lib/custom-art";
import type { PosterData } from "./types";
import styles from "./poster-builder.module.css";
export default function CustomCodePanel({ poster, onCustomArt }: { poster: PosterData; onCustomArt: (art: CustomArt) => void }) {
  const [language, setLanguage] = useState<CustomArt["language"]>(poster.customArt?.language ?? "glsl");
  const [codes, setCodes] = useState({ glsl: poster.customArt?.language === "glsl" ? poster.customArt.code : GLSL_STARTER, p5: poster.customArt?.language === "p5" ? poster.customArt.code : P5_STARTER });
  const [running, setRunning] = useState(false), [error, setError] = useState(""), [status, setStatus] = useState("");
  const tester = useRef<ReturnType<typeof createCustomRenderer> | null>(null), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; tester.current?.dispose(); }; }, []);
  useEffect(() => { if (poster.customArt) { const art = poster.customArt; setLanguage(art.language); setCodes(previous => ({ ...previous, [art.language]: art.code })); } }, [poster.customArt]);
  const run = async () => {
    if (running) return;
    const art: CustomArt = { enabled: true, language, code: codes[language] };
    if (!art.code.trim()) { setError("Enter some code or load the starter example."); return; }
    if (art.code.length > 50000) { setError("Keep custom code under 50,000 characters."); return; }
    setRunning(true); setError(""); setStatus("");
    try {
      const renderer = createCustomRenderer(art); tester.current = renderer;
      const size = customArtSize(600, poster.format === "4:5" ? 750 : 1067);
      await renderer.render({ ...poster, customArt: art }, 0, size.width, size.height);
      if (alive.current) { onCustomArt(art); setStatus("Running inside the artwork frame."); }
    } catch (issue) { if (alive.current) setError(issue instanceof Error ? issue.message : "Custom artwork could not start."); }
    finally { tester.current?.dispose(); tester.current = null; if (alive.current) setRunning(false); }
  };
  const changed = poster.customArt?.code !== codes[language] || poster.customArt?.language !== language;
  return <section className={styles.codePanel} id="code-controls" aria-label="Custom code workspace">
    <div className={styles.controlHeading}><h2>Custom code</h2><span>{poster.customArt?.enabled ? "Custom artwork is active" : "GLSL shaders & p5.js sketches"}</span></div>
    <p className={styles.helper}>Draw your own artwork inside the existing frame. The CCNYC header and event details stay in place.</p>
    <label className={styles.selectLabel}>Code language<select aria-label="Code language" value={language} disabled={running} onChange={event => { setLanguage(event.target.value as CustomArt["language"]); setError(""); setStatus(""); }}><option value="glsl">GLSL · fragment shader</option><option value="p5">p5.js · instance sketch</option></select></label>
    <div className={styles.codeActions}><button type="button" className={styles.primary} disabled={running} onClick={() => void run()}>{running ? "Checking code…" : "Run code ↗"}</button><button type="button" disabled={running} onClick={() => { setCodes(previous => ({ ...previous, [language]: language === "glsl" ? GLSL_STARTER : P5_STARTER })); setError(""); setStatus("Starter loaded. Run code to apply it."); }}>Load starter</button></div>
    <label className={styles.codeLabel} htmlFor="custom-source">{language === "glsl" ? "Fragment shader" : "p5.js sketch"}</label>
    <textarea id="custom-source" className={styles.codeEditor} aria-label="Custom artwork code" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={codes[language]} disabled={running} maxLength={50000}
      onChange={event => { setCodes(previous => ({ ...previous, [language]: event.target.value })); setError(""); }}
      onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void run(); } if (event.key === "Tab") { event.preventDefault(); const field = event.currentTarget; field.setRangeText("  ", field.selectionStart, field.selectionEnd, "end"); setCodes(previous => ({ ...previous, [language]: field.value })); } }} />

    {poster.customArt?.enabled && <button type="button" className={styles.wideButton} disabled={running} onClick={() => { onCustomArt({ ...poster.customArt!, enabled: false }); setStatus("Built-in family restored. Your custom code is kept."); }}>Use built-in family</button>}
    {changed && !error && <p className={styles.helper}>Edits apply only when you run the code. Ctrl/⌘ + Enter also runs it.</p>}
    {error && <pre className={styles.codeError} role="alert">{error}</pre>}{status && <p className={styles.feedback} role="status">{status}</p>}
    <details className={styles.codeHelp}><summary>Frame API & examples</summary>{language === "glsl" ? <p>WebGL 1 fragment shader. Use <code>gl_FragCoord</code>, <code>u_resolution</code> (vec2), <code>u_phase</code> (0–1), <code>u_time</code>, <code>u_seed</code>, <code>u_motion</code>, <code>u_scale</code>, <code>u_density</code>, <code>u_weight</code>, <code>u_distortion</code>, <code>u_noiseScale</code>, <code>u_travel</code>, <code>u_deformation</code>, <code>u_rotation</code>, <code>u_tempo</code> (floats), and <code>u_paper / u_ink / u_color1 / u_color2 / u_color3</code> (vec3 RGB).</p> : <p>Real p5.js 1.11.11 in instance mode. Define optional <code>setup(p, frame)</code> and required <code>draw(p, frame)</code>; call p5 methods with <code>p.</code>. The studio creates the canvas and owns playback. <code>frame</code> exposes <code>width, height, phase, time, seed, paper, ink, colors</code> and all numeric design controls.</p>}<p>Use phase-based sine/cosine motion for seamless loops and matching scrubbing/exports. Stateful simulations can depend on their drawing history. Movement mode changes the supplied phase; your code decides which other controls to use. External network assets are unavailable in this isolated renderer. Code is saved with the recipe.</p></details>
  </section>;
}
